(function ($, window, document, undefined) {

    var pluginName = 'pageIt';

    var logger = {
        log: function () {
            console.log(pluginName + ": " + arguments[0], Array.prototype.slice.call(arguments, 1));
        },
        info: function () {
            console.info(pluginName + ": " + arguments[0], Array.prototype.slice.call(arguments, 1));
        },
        warn: function () {
            console.warn(pluginName + ": " + arguments[0], Array.prototype.slice.call(arguments, 1));
        },
        error: function () {
            console.error(pluginName + ": " + arguments[0], Array.prototype.slice.call(arguments, 1));
        },
    };

    if (!$) {
        logger.error(pluginName + ': Não foi possível reconhecer o jQuery, inicialização cancelada!');
        return false;
    }

    /*
     * Polyfill
     */
    // Production steps of ECMA-262, Edition 5, 15.4.4.17
    // Reference: http://es5.github.io/#x15.4.4.17
    if (!Array.prototype.some) {
        Array.prototype.some = function (fun/*, thisArg*/) {
            'use strict';

            if (this == null) {
                throw new TypeError('Array.prototype.some called on null or undefined');
            }

            if (typeof fun !== 'function') {
                throw new TypeError();
            }

            var t = Object(this);
            var len = t.length >>> 0;

            var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
            for (var i = 0; i < len; i++) {
                if (i in t && fun.call(thisArg, t[i], i, t)) {
                    return true;
                }
            }

            return false;
        };
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
         * @var {int?} The page where the plugin should start.
         */
        initPage: null,
        /**
         * @var {bool} cache : if should store loaded pages (and load'em from) in a local storage or not
         */
        cache: true,
        url: '',
        method: 'get',
        dataType: 'json',
        /**
         * @var {object} jQuery.AJAX configuration options.
         */
        ajax: {
            cache: false,
            global: true,
        },
        /**
         * @var {HTMLElement} contentView : if you define this, you will have auto page content updates
         */
        contentView: null,
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
        this.meta.prev = this.settings.initPage - 1;
        this.meta.current = this.settings.initPage;
        this.meta.next = this.settings.initPage + 1;

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

            if (!!this.settings.initPage)
                this.to(this.settings.initPage);
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
                this.requestData = {};
                this.requestData.pageIndex = pageIndex;

                this.trigger('page.load.before', this.requestData);

                var that = this;

                this.requesting = true;

                $.ajax({
                    cache: this.settings.ajax.cache,
                    global: this.settings.ajax.global,
                    url: this.settings.url,
                    method: this.settings.method,
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

                        that.meta.prev = pageIndex - 1;
                        that.meta.current = pageIndex;
                        that.meta.next = pageIndex + 1;

                        if (data.meta) {
                            that.setMeta(data.meta);
                        }

                        if (!!data.content) {

                            that.trigger('page.load.loaded', data);

                            // se tem um container de conteúdo definido e a resposta é em HTML, insere o conteúdo nele
                            if (!!that.settings.contentView) {

                                if ($(that.settings.contentView).html(data.content)) {
                                    // plugin .trigger method
                                    that.trigger('page.load.autoupdated', data);
                                }

                            } else {
                                logger.warn('No container set, no data will be auto inserted.');
                            }

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

                    // se tem um container de conteúdo definido, insere o conteúdo nele
                    if (!!this.settings.contentView) {
                        this.settings.contentView.innerHTML = this.pages[pageIndex].content;
                        this.trigger('page.filled', this.pages[pageIndex]);
                    }

                    this.trigger('page.load.loaded', this.pages[pageIndex]);
                    this.trigger('page.load.cache', this.pages[pageIndex]);

                } else {

                    this.trigger('page.load.empty', this.pages[pageIndex]);

                }

            }

            return this;
        },

        /**
         * Calls .to() with page number meta.first as parameter.
         **/
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
                //if (fn.name) {
                    if (!this.events[eventName]) {
                        logger.warn('Evento indisponível.');
                        throw new Error('Can\'t attach unrecognized event handler.');
                    }

                    var x = this.events[eventName].some(function (t) {
                        return t === fn;
                    }) || this.events[eventName].indexOf(fn);

                    //if (x > -1) return this;

                    this.events[eventName].push(fn);
                //} else {
                //    throw new Error('Funções anônimas não são permitidas.');
                //}
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

        setData: function (object) {

            $.extend(this.requestData, object);

        },

        setMeta: function (meta) {
            $.extend(this.meta, meta);
        }

    });

    return window[pluginName];

})(window.jQuery || false, window, document);
