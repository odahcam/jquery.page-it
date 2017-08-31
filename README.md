# Page it!
## A simple ~jQuery dependent~ library to create paginations!

With this lib you can fully manipulate pagination events and fetch information from an endpoint.

Also you can, in fact you must (if you want to use it), integrate this tool with your own pagination.

## Instalation

Download it via `npm`:

`npm install jquery.page-it@0.3.0`

## Available Methods

| Methods   | Params                                    | Description                                                                    |
|-----------|-------------------------------------------|--------------------------------------------------------------------------------|
| `first`   | `void`                                    | Loads first page.                                                              |
| `prev`    | `void`                                    | Loads previous page.                                                           |
| `next`    | `void`                                    | Loads next page.                                                               |
| `last`    | `void`                                    | Loads last page.                                                               |
| `to`      | `{int} pageIndex`                         | Loads the specifyied page.                                                     |
| `on`      | `{string} eventName, {callable} callback` | Registers an event listener.                                                   |
| `trigger` | `{string} eventName, {object} data`       | Triggers an event.                                                             |
| `setMeta` | `{object} meta`                           | Sets the `meta` property, this property is used to control pagination numbers. |

## Options

Default options are:

```javascript
{
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
}
```
