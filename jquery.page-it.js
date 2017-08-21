(function ($, window, document, undefined) {

    var defaults = {
        url: '',
        method: 'get',
        dataType: 'html',
        initPage: 1,
        cacheAjax: false,
        cachePagination: true,
        containerContent: null,
        urlMeta: '',
        pageMeta: {
            first: 1,
            prev: undefined,
            current: undefined,
            next: undefined,
            last: undefined,
            total: undefined
        }
    };

    // Constructor
    window.Pagination = function Pagination(options) {

        this.settings = $.extend(true, {}, defaults, options);
        this.events = {};
        this.pages = [];

        this.pageMeta = this.settings.pageMeta;
        this.pageMeta.prev = this.settings.initPage - 1;
        this.pageMeta.current = this.settings.initPage;
        this.pageMeta.next = this.settings.initPage + 1;

        this.pageLoadData = {};

        return this.init();

    };

    // Pagination Methods
    $.extend(Pagination.prototype, {

        /**
         * Initialize module functionality.
         **/
        init: function () {

            if (!!this.settings.initPage)
                this.to(this.settings.initPage);

            this.trigger('ready.pagination');

        },

        /**
         * @param {intger} pageIndex
         **/
        to: function (pageIndex) {

            if (!pageIndex || pageIndex > this.pageMeta.last)
                return this;

            // if index is a string like 'next' or 'prev', it will be translated by calling it's manager
            if (typeof pageIndex === 'string' && pageIndex === 'next' || pageIndex === 'prev') {
                return this[pageIndex]();
            }

            if (!this.settings.cachePagination || !this.pages[pageIndex]) {

                /*
                 * reset pageLoadData object before triggering the beforeLoad,
                 * so the programer can replace it.
                 * Auto set the pageIndex that will be requested.
                 */
                this.pageLoadData = {};
                this.pageLoadData.pageIndex = pageIndex;

                this.trigger('page.load.before', this.pageLoadData);

                var that = this;

                $.ajax({
                    cache: this.settings.cache,
                    url: this.settings.url,
                    method: this.settings.method,
                    data: this.pageLoadData,
                    dataType: this.settings.dataType,
                    success: function (data) {

                        that.pages[pageIndex] = data;

                        that.pageMeta.prev = pageIndex - 1;
                        that.pageMeta.current = pageIndex;
                        that.pageMeta.next = pageIndex + 1;

                        that.trigger('page.content.loaded', data);

                        if (!!data) {

                            // se tem um container de conteúdo definido e a resposta é em HTML, insere o conteúdo nele
                            if (that.settings.dataType === 'html' && !!that.settings.containerContent) {

                                if ($(that.settings.containerContent).html(data)) {
                                    // plugin .trigger method
                                    that.trigger('page.filled', data);
                                }

                            }

                        } else {

                            that.trigger('page.content.empty', data);

                        }

                    },
                    error: function (response) {
                        console.error('Erro ao carregar página.');
                        console.log(response);
                    },
                    complete: function (response) {

                        // plugin .trigger method
                        that.trigger('page.load.after', response);

                        console.groupEnd();

                    }
                });

            } else {

                if (this.pages[pageIndex].content) {

                    // se tem um container de conteúdo definido, insere o conteúdo nele
                    if (!!this.settings.containerContent) {
                        this.settings.containerContent.innerHTML = this.pages[pageIndex].content;
                        this.trigger('page.filled', this.pages[pageIndex]);
                    }

                    this.trigger('page.content.loaded', this.pages[pageIndex]);
                    this.trigger('page.loaded.cache', this.pages[pageIndex]);

                } else {

                    this.trigger('page.content.empty', this.pages[pageIndex]);

                }

            }

            return this;

        },

        /**
         * Calls .to() with page number pageMeta.first as parameter.
         **/
        first: function () {
            this.trigger('page.first', this.pageMeta.first);
            return this.to(this.pageMeta.first);
        },

        /**
         * Calls .to() with page number pageMeta.current - 1 as parameter.
         **/
        prev: function () {
            this.trigger('page.prev', this.pageMeta.next);
            return this.to(this.pageMeta.prev);
        },

        /**
         * Calls .to() with page number pageMeta.current + 1 as parameter.
         **/
        next: function () {
            this.trigger('page.next', this.pageMeta.next);
            return this.to(this.pageMeta.next);
        },

        /**
         * Calls .to() with page number pageMeta.last as parameter.
         **/
        last: function () {
            this.trigger('page.last', this.pageMeta.last);
            return this.to(this.pageMeta.last);
        },

        /**
         * Register callbacks for the received event name.
         * @param {string} eventName
         * @param {function} fn
         * @return {object}
         **/
        on: function (eventName, fn) {

            if (this.events[eventName]) {
                this.events[eventName].push(fn);
            } else {
                this.events[eventName] = [fn];
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

        /**
         * Method to get some updated details about pagination.
         **/
        updateMeta: function () {

            var that = this;

            $.ajax({
                cache: false,
                url: this.settings.urlMeta,
                method: this.settings.method,
                data: this.pageMeta,
                dataType: 'json',
                success: function (data) {

                    that.trigger('page.meta.loaded', data);

                    if (data) {

                        $.extend(true, that.pageMeta, data);

                        that.trigger('page.meta.updated', data);

                    } else {

                        that.trigger('page.meta.empty', data);
                        console.warn('Page meta update found no data.');

                    }

                },
                error: function (response) {
                    console.error('Erro ao carregar meta dados.');
                    console.log(response);
                },
                complete: function (response) {
                    console.groupEnd();
                }
            });

            return this;

        },

        setData: function (object) {

            $.extend(this.pageLoadData, object);

        }

    });

})(window.jQuery, window, document);
