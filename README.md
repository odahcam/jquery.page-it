# Page it!
## A simple ~jQuery dependent~ library to create paginations!

With this lib you can fully manipulate pagination events and fetch information from an endpoint.

Also you can, in fact you must (if you want to use it), integrate this tool with your own pagination component.

## Instalation

Download it via `npm`:

`npm i jquery.page-it@latest --save`

## Available Methods

| Methods          | Params                                    | Description                                                                    |
|------------------|-------------------------------------------|--------------------------------------------------------------------------------|
| `first`          | `void`                                    | Loads first page.                                                              |
| `prev`           | `void`                                    | Loads previous page.                                                           |
| `next`           | `void`                                    | Loads next page.                                                               |
| `last`           | `void`                                    | Loads last page.                                                               |
| `to`             | `{int} pageIndex`                         | Loads the specifyied page.                                                     |
| `on`             | `{string} eventName, {callable} callback` | Registers an event listener.                                                   |
| `trigger`        | `{string} eventName, {array} params`      | Triggers an event.                                                             |
| `setMeta`        | `{object} meta` (see meta schema)         | Sets the `meta` property, this property is used to control pagination numbers. |
| `setCurrent`     | `{int} current`                           | Accepts a callback to update the request data.                                 |
| `setRequestData` | `{object} requestData`                    | Sets the current page and updates dependent meta.                              |

## Options

Default options are:

```javascript
{
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
}
```

## Meta Schema

```javascript
{
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
}
```
