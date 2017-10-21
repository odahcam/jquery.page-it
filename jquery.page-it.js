(function ($, window, document, undefined) {

    var pluginName = 'pageIt';

    var logger = {
        log: function () {
            console.log(pluginName + ': ' + arguments[0], Array.prototype.slice.call(arguments, 1));
        },
        info: function () {
            console.info(pluginName + ': ' + arguments[0], Array.prototype.slice.call(arguments, 1));
        },
        warn: function () {
            console.warn(pluginName + ': ' + arguments[0], Array.prototype.slice.call(arguments, 1));
        },
        error: function () {
            console.error(pluginName + ': ' + arguments[0], Array.prototype.slice.call(arguments, 1));
        },
    };

    if (!$) {
        logger.error('Não foi possível reconhecer o jQuery, inicialização cancelada!');
        return false;
    }

    var metaSchema = {
        size: null,
        first: 1,
        prev: null,
        current: null,
        next: null,
        last: null,
        total: null
    };

    var defaults = {
        /**
         * @var {bool} If should auto start loading the current page or not.
         */
        autoStart: false,
        /**
         * @var {bool} cache : if should store loaded pages (and load'em from) in a local storage or not
         */
        cache: true,
        dataType: 'json',
        /**
         * @var {object} jQuery.AJAX configuration options.
         */
        ajax: {
            url: '', // @TODO: move it inside ajax key
            method: 'get', // @TODO: move it inside ajax key
            cache: false,
            global: true,
        },
        /**
         * @var {HTMLElement} target : if you define this, you will have auto page content updates
         */
        target: null,
        /**
         * @var {object}
         */
        meta: metaSchema
    };

    // Constructor
    window[pluginName] = function PageIt(options) {

        this.settings = $.extend(true, {}, defaults, options);
        this.events = {
            'ready': [],
            'page.load.empty': [],
            'page.load.loaded': [],
            'page.load.autoupdated': [],
            'page.load.skipped': [],
            'page.load.first': [],
            'page.load.last': [],
            'page.load.error': [],
            'page.load.before': [],
            'page.load.after': [],
            'page.load.cache': [],
            'page.filled': [],
            'page.first': [],
            'page.prev': [],
            'page.next': [],
            'page.last': [],
        };
        this.pages = [];

        this.requesting = false;

        this.meta = this.settings.meta;

        if (this.meta.current) {
            this.setCurrent(this.meta.current);
        }

        this.requestData = {};

        return this.init();
    };

    // Pagination Methods
    $.extend(window[pluginName].prototype, {

        /**
         * Initialize module functionality.
         **/
        init: function () {

            this.trigger('ready');

            if (!!this.settings.autoStart)
                this.to(this.meta.current);
        },

        /**
         * @param {intger} pageIndex
         **/
        to: function (pageIndex) {

            if (this.requesting === true) {
                logger.warn('Uma requisição de página já está em andamento, esta requisição será ignorada.');
                return false;
            }

            if (!pageIndex || (this.meta.last && pageIndex > this.meta.last)) {
                this.trigger('page.load.skipped', {});
                this.trigger('page.load.last', {});
                return false;
            }

            // if index is a string like 'next' or 'prev', it will be translated by calling it's manager
            if (typeof pageIndex === 'string' && pageIndex === 'next' || pageIndex === 'prev') {
                return this[pageIndex]();
            }

            if (!this.settings.cache || !this.pages[pageIndex]) {

                /*
                 * reset requestData object before triggering the beforeLoad,
                 * so the programer can replace it.
                 * Auto set the pageIndex that will be requested.
                 */
                this.requestData = { pageIndex: pageIndex };

                // user can moddify the requestData here, before the AJAX call.
                this.trigger('page.load.before', this.requestData);

                var that = this;

                this.requesting = true;

                $.ajax({
                    cache: this.settings.ajax.cache,
                    global: this.settings.ajax.global,
                    url: this.settings.ajax.url,
                    method: this.settings.ajax.method,
                    data: this.requestData,
                    dataType: this.settings.dataType,
                    success: function (data, status, response) {

                        /*
                        data: {
                            meta: {...}
                            content: [HTML String]
                        }
                        */

                        that.pages[pageIndex] = data.content;

                        that.setCurrent(pageIndex);

                        if (data.meta) {
                            that.setMeta(data.meta);
                        }

                        if (!!data.content) {

                            that.trigger('page.load.loaded', data);

                            that.fillContainer(data.content);

                        } else {

                            that.trigger('page.load.empty', data);

                        }

                    },
                    error: function (response) {
                        logger.error('Erro ao carregar página.');
                        console.log(response);

                        that.trigger('page.load.error', response);
                    },
                    complete: function (response) {

                        that.requesting = false;

                        // plugin .trigger method
                        that.trigger('page.load.after', response);

                        console.groupEnd();

                    }
                });

            } else {

                if (this.pages[pageIndex].content) {

                    this.fillContainer(this.pages[pageIndex].content);

                    this.trigger('page.load.loaded', this.pages[pageIndex]);
                    this.trigger('page.load.cache', this.pages[pageIndex]);

                } else {

                    this.trigger('page.load.empty', this.pages[pageIndex]);

                }

            }

            return this;
        },

        /**
         * Se tem um container de conteúdo definido e a resposta é em HTML, insere o conteúdo nele.
         *
         * @param {string} data : The HTML data to be inserted in the view.
         */
        fillContainer: function fillContainer(data) {

            if (!!this.settings.target) {

                if ($(this.settings.target).html(data)) {
                    // plugin .trigger method
                    this.trigger('page.load.autoupdated', data);
                }

            } else {
                logger.warn('No container set, no data will be auto inserted.');
            }

        },

        /**
         * Calls .to() with page number meta.first as parameter.
         */
        first: function () {
            this.trigger('page.first', this.meta.first);
            return this.to(this.meta.first);
        },

        /**
         * Calls .to() with page number meta.current - 1 as parameter.
         **/
        prev: function () {
            this.trigger('page.prev', this.meta.next);
            return this.to(this.meta.prev);
        },

        /**
         * Calls .to() with page number meta.current + 1 as parameter.
         **/
        next: function () {
            this.trigger('page.next', this.meta.next);
            return this.to(this.meta.next);
        },

        /**
         * Calls .to() with page number meta.last as parameter.
         **/
        last: function () {
            this.trigger('page.last', this.meta.last);
            return this.to(this.meta.last);
        },

        /**
         * Register callbacks for the received event name.
         * @param {string} eventName
         * @param {function} fn
         * @return {object}
         **/
        on: function (eventName, fn) {

            if (eventName.match(' ')) {
                eventname.split(' ').forEach(function (eventName) {
                    this.on(eventName, fn);
                });
            } else {

                if (!this.events[eventName]) {
                    logger.warn('Evento indisponível.');
                    throw new Error('Can\'t attach unrecognized event handler.');
                }

                this.events[eventName].push(fn);
            }

            return this;
        },

        /**
         * Removes callbacks for the received event name.
         * @param {string} eventName
         * @param {function} fn
         * @return {object}
         **/
        off: function (eventName, fn) {

            if (eventName.match(' ')) {
                eventname.split(' ').forEach(function (eventName) {
                    this.off(eventName, fn);
                });
            } else {

                if (!this.events[eventName]) {
                    logger.warn('Evento indisponível.');
                    throw new Error('Can\'t remove unrecognized event handler.');
                }

                this.events[eventName] = [];
            }

            return this;
        },

        /**
         * Event handler, can call any registered event.
         * @param {string} eventName
         * @param {undefined} arguments
         * @example this.trigger('event'[, data, response, etc]);
         **/
        trigger: function (eventName) {

            if (this.events[eventName] && this.events[eventName].length) {

                var that = this,
                    args = arguments;

                this.events[eventName].map(function (fnName) {

                    fnName.apply(that, Array.prototype.slice.call(args, 1)); // Array.prototype.slice will convert the arguments object

                });

            }

            return this;
        },

        setMeta: function (meta) {
            // meta is not multilevel
            $.extend(this.meta, meta);
        },

        setCurrent: function (current) {
            this.meta.current = current;
            this.meta.prev = current - 1;
            this.meta.next = current + 1;
        }

    });

    return window[pluginName];

})(window.jQuery || false, window, document);
