# Page it!
## A simple ~jQuery dependent~ library to create paginations!

With this lib you can fully manipulate pagination events and fetch information from an endpoint.

Also you can, in fact you must (if you want to use it), integrate this tool with your own pagination component.

## Instalation

Download it via `npm`:

`npm i jquery.page-it@latest --save`

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
 * @var {bool} autoStart If should auto start loading the current page or not.
 */
autoStart: false,
/**
 * @var {bool} cache : if should store loaded pages (and load'em from) in a local storage or not
 */
cache: true,
/**
 * @var {object} ajax jQuery.AJAX configuration options.
 */
ajax: {
    url: '',
    cache: false,
    global: true,
},
/**
 * @var {HTMLElement} replace If you define this, you will have auto page content updates in the desired element.
 */
replace: null,
/**
 * @var {object} meta The initial meta information for controlling the pages.
 */
meta: metaSchema
}
```
