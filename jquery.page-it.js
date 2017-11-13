(function($, window, document, undefined) {

    var pluginName = 'pageIt';

    var logger = {
        log: function () {
            //if (logger.canLog(arguments[0]))
            //    console.log.apply(console, [pluginName + ': ' + arguments[0]].concat(Array.prototype.slice.call(arguments, 1)));
        },
        info: function () {
            //if (logger.canLog(arguments[0]))
            //    console.info.apply(console, [pluginName + ': ' + arguments[0]].concat(Array.prototype.slice.call(arguments, 1)));
        },
        warn: function () {
            if (logger.canLog(arguments[0]))
                console.warn.apply(console, [pluginName + ': ' + arguments[0]].concat(Array.prototype.slice.call(arguments, 1)));
        },
        error: function () {
            if (logger.canLog(arguments[0]))
                console.error.apply(console, [pluginName + ': ' + arguments[0]].concat(Array.prototype.slice.call(arguments, 1)));
        },
        canLog: function (log) {
            if (log === logger.lastLog) return false;
            else logger.lastLog = log;
            return true;
        },
        lastLog: '',
    };

    if (!$) {
        logger.error('Não foi possível reconhecer o jQuery, inicialização cancelada!');
        return false;
    }

    var metaSchema = {
        /**
         * @var {int} size : Items per page.
         */
        size: null,
        /**
         * @var {int} first : Whats the first page of the collection.
         */
        first: 1,
        /**
         * @var {int} prev : Whats the previous page behind current.
         */
        prev: null,
        /**
         * @var {int} current : Current page number.
         */
        current: null,
        /**
         * @var {int} next : Whats the next page from current.
         */
        next: null,
        /**
         * @var {int} last : Whats the last page of the collection.
         */
        last: null,
        /**
         * @var {int} total : The total quantity of pages.
         */
        total: null
    };

    var defaults = {
        /**
         * @var {bool} autoStart : If should auto start loading the current page or not.
         */
        autoStart: false,
        /**
         * @var {bool} cache : If should store loaded pages (and load'em from) in a local storage or not
         */
        cache: true,
        /**
         * @var {object} ajax : jQuery.AJAX configuration options.
         */
        ajax: {
            url: '',
            cache: false,
            global: true,
            method: 'get',
        },
        /**
         * @var {HTMLElement} target : If you define this, you will have auto page content updates
         */
        target: null,
        /**
         * @var {string} fillMode : The fill mode to use when pagrIt will do something with the target.
         */
        fillMode: 'replace',
        /**
         * @var {object} meta : The meta information used for controlling the things.
         */
        meta: metaSchema
    };

    var allowedNamedPages = ['first', 'prev', 'next', 'last'];

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
            'page.changed': [],
        };

        this.pages = [];

        this.requesting = false;

        this.meta = this.settings.meta;

        this.setCurrent(this.meta.current || 1);

        this.requestData = {};

        return this.init();
    };

    // Pagination Methods
    Object.assign(window[pluginName].prototype, {

        /**
         * Initialize module functionality.
         **/
        init: function() {

            this.trigger('ready');

            if (!!this.settings.autoStart)
                this.to(this.meta.current);
        },

        /**
         * @param {intger} page
         **/
        to: function(page) {

            if (this.requesting === true) {
                logger.warn('Uma requisição de página já está em andamento, esta requisição será ignorada.');
                return false;
            }

            // if index is a string like 'next' or 'prev', it will be translated by calling it's manager
            if (typeof page === 'string' && allowedNamedPages.indexOf(page) > -1) {
                return this[page]();
            }

            var last = this.meta.last || this.meta.total;

            if (!page || (last && page > last)) {
                this.trigger('page.load.skipped', {});
                this.trigger('page.load.last', {});
                return false;
            }

            if (!this.settings.cache || !this.pages[page]) {

                /*
                 * reset requestData object before triggering the beforeLoad,
                 * so the programer can replace it.
                 * Auto set the page that will be requested.
                 */
                this.requestData = {
                    page: page
                };

                // user can moddify the requestData here, before the AJAX call.
                this.trigger('page.load.before', this.requestData);

                var that = this;

                this.requesting = true;

                $.ajax({
                    cache: this.settings.ajax.cache,
                    global: this.settings.ajax.global,
                    url: this.settings.ajax.url,
                    method: this.settings.ajax.method, // http method
                    data: Object.assign({
                        pageIt: true
                    }, this.requestData),
                    dataType: 'html', // expecting from the server
                    success: function(data, status, response) {

                        // retrieves the meta information from the HTTP headers
                        var meta = {
                            // @NOTE: talvez dê para fazer um loop que recupera os cabeçalhos basado no metaSchema.
                            current: response.getResponseHeader('X-Page-Current'),
                            size: response.getResponseHeader('X-Page-Size'),
                            total: response.getResponseHeader('X-Page-Total'),
                            first: response.getResponseHeader('X-Page-First'),
                            prev: response.getResponseHeader('X-Page-Prev'),
                            next: response.getResponseHeader('X-Page-Next'),
                            last: response.getResponseHeader('X-Page-Last'),
                        };

                        // updates the meta information
                        that.setMeta(meta);

                        that.pages[page] = data;

                        that.setCurrent(page);

                        if (!!data) {

                            that.trigger('page.load.loaded', data);

                            that.fillContainer(data);

                        } else {

                            that.trigger('page.load.empty', data);

                        }

                    },
                    error: function(response) {
                        logger.error('Erro ao carregar página.');
                        console.log(response);

                        that.trigger('page.load.error', response);
                    },
                    complete: function(response) {

                        that.requesting = false;

                        // plugin .trigger method
                        that.trigger('page.load.after', response);
                        that.trigger('page.changed', that.meta);

                        console.groupEnd();

                    }
                });

            } else {

                if (this.pages[page]) {

                    this.setCurrent(page);

                    this.fillContainer(this.pages[page]);

                    this.trigger('page.load.loaded', this.pages[page]);
                    this.trigger('page.load.cache', this.pages[page]);
                    this.trigger('page.changed', this.meta);

                } else {

                    this.trigger('page.load.empty', this.pages[page]);

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

                var $target = $(this.settings.target);
                var status = true;

                switch (this.settings.fillMode) {

                    case 'append':
                        status = $target.append(data);
                        break;

                    default:
                    case 'replace':
                        status = $target.html(data);
                        break;

                }

                if (status) {
                    this.trigger('page.load.autoupdated', data);
                } else {
                    this.trigger('page.load.error', data);
                }

            } else {
                logger.info('No replacement target set, no DOM manipulation will be made.');
            }

        },

        /**
         * Calls .to() with page number meta.first as parameter.
         */
        first: function() {
            this.trigger('page.first', this.meta.first);
            return this.to(this.meta.first);
        },

        /**
         * Calls .to() with page number meta.current - 1 as parameter.
         **/
        prev: function() {
            this.trigger('page.prev', this.meta.next);
            return this.to(this.meta.prev);
        },

        /**
         * Calls .to() with page number meta.current + 1 as parameter.
         **/
        next: function() {
            this.trigger('page.next', this.meta.next);
            return this.to(this.meta.next);
        },

        /**
         * Calls .to() with page number meta.last as parameter.
         **/
        last: function() {
            this.trigger('page.last', this.meta.last);
            return this.to(this.meta.last);
        },

        /**
         * Register callbacks for the received event name.
         *
         * @param {string} eventName
         * @param {function} fn
         *
         * @return {object}
         **/
        on: function(eventName, fn) {

            if (eventName.match(' ')) {
                var that = this;
                eventName.split(' ').forEach(function(eventName) {
                    that.on(eventName, fn);
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
         *
         * @param {string} eventName
         * @param {function} fn
         *
         * @return {object}
         **/
        off: function(eventName, fn) {

            if (eventName.match(' ')) {
                var that = this;
                eventName.split(' ').forEach(function(eventName) {
                    that.off(eventName, fn);
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
         *
         * @param {string} eventName
         * @param {undefined} arguments
         *
         * @example this.trigger('event'[, data, response, etc]);
         **/
        trigger: function(eventName) {

            if (this.events[eventName] && this.events[eventName].length) {

                var that = this,
                    args = arguments;

                this.events[eventName].map(function(fnName) {

                    fnName.apply(that, Array.prototype.slice.call(args, 1)); // Array.prototype.slice will convert the arguments object

                });

            }

            return this;
        },

        /**
         * @param {object} meta
         */
        setMeta: function(meta) {
            // meta is not multilevel
            Object.assign(this.meta, meta);
        },

        /**
         * Accepts a callback to update the request data.
         * Everytime the pagination makes a request,
         * this function will be used to get its new data.
         *
         * @param {object} requestData
         */
        setRequestData: function(requestData) {
            // by default, request data is not multilevel
            Object.assign(this.requestData, requestData);
        },

        /**
         * Sets the current page and updates dependent meta.
         *
         * @param {int} current
         */
        setCurrent: function(current) {
            this.meta.current = current;
            this.meta.prev = current - 1;
            this.meta.next = current + 1;
        }

    });

    return window[pluginName];

})(window.jQuery || false, window, document);
