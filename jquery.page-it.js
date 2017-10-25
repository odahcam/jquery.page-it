(function($, window, document, undefined) {

    var pluginName = 'pageIt';

    var logger = {
        log: function() {
            console.log(pluginName + ': ' + arguments[0], Array.prototype.slice.call(arguments, 1));
        },
        info: function() {
            console.info(pluginName + ': ' + arguments[0], Array.prototype.slice.call(arguments, 1));
        },
        warn: function() {
            console.warn(pluginName + ': ' + arguments[0], Array.prototype.slice.call(arguments, 1));
        },
        error: function() {
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
            url: '',
            cache: false,
            global: true,
        },
        /**
         * @var {HTMLElement} target : if you define this, you will have auto page content updates
         */
        replace: null,
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

            if (!page || (this.meta.last && page > this.meta.last)) {
                this.trigger('page.load.skipped', {});
                this.trigger('page.load.last', {});
                return false;
            }

            // if index is a string like 'next' or 'prev', it will be translated by calling it's manager
            if (typeof page === 'string' && page === 'next' || page === 'prev') {
                return this[page]();
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

                // ajax
                var xhr = new XMLHttpRequest();

                if (this.settings.ajax.cache == false) {
                    xhr.setRequestHeader('Cache-Control', 'no-cache');
                }

                // xhr.addEventListener('progress', null, false);

                xhr.addEventListener('load', function (data, status, response) {

                    // success
                    if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {

                        that.pages[page] = data.content;

                        // retrieves the meta information from the HTTP headers
                        var meta = {
                            // @NOTE: talvez dê para fazer um loop que recupera os cabeçalhos basado no metaSchema.
                            current: xhr.getResponseHeader('X-Page-Current'),
                            size: xhr.getResponseHeader('X-Page-Size'),
                            total: xhr.getResponseHeader('X-Page-Total'),
                            first: xhr.getResponseHeader('X-Page-First'),
                            prev: xhr.getResponseHeader('X-Page-Prev'),
                            next: xhr.getResponseHeader('X-Page-Next'),
                            last: xhr.getResponseHeader('X-Page-Last'),
                        };

                        // updates the meta information
                        that.setMeta(meta);

                        that.setCurrent(page);

                        if (!!data) {

                            that.trigger('page.load.loaded', data);

                            that.fillContainer(data);

                        } else {

                            that.trigger('page.load.empty', data);

                        }
                        // Request finished. Do processing here.
                    }

                    that.trigger('page.load.after', that);
                    that.requesting = false;
                    console.groupEnd();

                }, false);

                xhr.addEventListener('error', function (response) {

                    logger.error('Erro ao carregar página.');
                    console.log(response);

                    that.trigger('page.load.error', response);


                    that.trigger('page.load.after', that);
                    that.requesting = false;
                    console.groupEnd();

                }, false);

                xhr.addEventListener('abort', function () {

                    that.trigger('page.load.abort', response);


                    that.trigger('page.load.after', that);
                    that.requesting = false;
                    console.groupEnd();

                }, false);

                // request.open();
                // xhr.open(method, url, async, user, password);
                xhr.open('GET', this.settings.ajax.url);

                xhr.send(null);
                // xhr.send('string');
                // xhr.send(new Blob());
                // xhr.send(new Int8Array());
                // xhr.send({ form: 'data' });
                // xhr.send(document);
                // /ajax

            } else {

                if (this.pages[page]) {

                    this.fillContainer(this.pages[page]);

                    this.trigger('page.load.loaded', this.pages[page]);
                    this.trigger('page.load.cache', this.pages[page]);

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

            if (!!this.settings.replace) {

                if ($(this.settings.replace).html(data)) {
                    // plugin .trigger method
                    this.trigger('page.load.autoupdated', data);
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
                eventname.split(' ').forEach(function(eventName) {
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
         *
         * @param {string} eventName
         * @param {function} fn
         *
         * @return {object}
         **/
        off: function(eventName, fn) {

            if (eventName.match(' ')) {
                eventname.split(' ').forEach(function(eventName) {
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
         *
         * @param {string} eventName O nome do evento a ser disparados.
         * @param {...any} arguments
         *
         * @example this.trigger('event'[, data, response, etc]);
         *
         * @return {object} Retorna o PageIt para encadeamento.
         */
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
         * A function that accepts a callback to update the request data.
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
         * @param {int} current
         */
        setCurrent: function(current) {
            this.meta.current = current;
            this.meta.prev = current - 1 > 0 ? current : null;
            this.meta.next = ++current;
        }

    });

    return window[pluginName];

})(window.jQuery || false, window, document);
