# MobX-localForage-Store

[MobX] + [localForage] = a clean reactive data-persistent store.

## Install

```
npm install mobx-localforage-store
```

## Usage

### Example

```
import Store from 'mobx-localforage-store'

const reactiveStore = new Store({
  counter: 1
});

const persistenStore = new Store('namespace', {
  user: {some: 'data worth persisting'}
});

@Store.observe
class ViewComponent {
  render () {
    return "It updates: " + store.counter +  persistenStore.user
  }
  async save(){
    await persistenStore.setItem('user', {changed: 'data'})
  }
}

setInterval(() => {
  reactiveStore.counter++;
});

```

While both `reactiveStore` and `persistenStore` are reactive (both will trigger `render()` on change), `persistenStore` stores data using `localForage`.

`setItem` makes any new data (other than the one initialized) reactive, and optionally (if persistent storage is configured) stores it in `localForage`

### API

The API is much like [localForage] but it makes the properties observable.

#### methods

###### `constructor([name=string], [data=array|object], [opts=object])`

- `name` - Required for `localForage`. Without it it's just MobX reactive store, but still uses localForage-like API (`setItem`) to make properties observable (unless Proxy support is available)

- `data` - Data to initialize with. Can also be just an array of keys.

- `opts`

  - `opts.useProxy` (default:true if available) Uses ES6 Proxy to automatically make properties set mobx-reactive.

##### Method similar to `localForage`:

###### `setItem(key=string, data=any) => Promise`

Sets a property, makes it mobx-observable if not already, and if localForage is configured returns `localForage.setItem(...)` (which is a promise)

###### `getItem(key=string, data=any) => Promise`

Gets a property from `localForage` and runs `setItem`. Throws if `localForage` was not configured.

###### `removeItem(key=string) => Promise`

Removes a property, and if `localForage` was configured returns `localForage.removeItem(...)`

###### `clear() => Promise`

Runs `removeItem` on all keys found.

##### Additional methods:

###### `restore([keys=array]) => Promise`

Gets all keys (either passed or Object.keys(this)) from `localForage`, runs `setItem` on them. Throws if `localForage` was not configured. Returns a promise that resolves to restored key-values object.

###### `setState(data=object) => Promise`

Takes an object and runs `setItem` on every key-value pair. It's like React's `this.setState`.

##### Method related to MobX:

###### `toJS() => object`

Returns [`mobx.toJS(this)`](https://mobx.js.org/refguide/tojson.html)

###### `intercept()`

Calls [`mobx.intercept()`](https://mobx.js.org/refguide/observe.html) with target as `this`, so just provide it with rest of the arguments (propertyName?, listener, invokeImmediately?)

###### `observe()`

Calls [`mobx.observe()`](https://mobx.js.org/refguide/observe.html) with target as `this`, so just provide it with rest of the arguments (propertyName?, listener, invokeImmediately?)

(this is different from the @static method [`Store.observe`](#static-observe))

##### Static methods

###### @static `observe()`

Shortcut to [`mobxObserver.observer`](https://github.com/capaj/mobx-observer#decorator)

(this is different from the @instance method [`observe`](#observe))

###### @static `observeStateless()`

Shortcut to [`mobxObserver.makeObserver`](https://github.com/capaj/mobx-observer#decorator)

(this is different from the @instance method [`observe`](#observe))

###### @static `autorun()`

Shortcut to [`mobx.autorun`](https://mobx.js.org/refguide/autorun.html)

###### @static `config()`

Shortcut to `localForage.config`

#### Properties

###### `store`

The underlying localForage store created with `localForage.createInstance({ name })` (only if `name` was passed to constructor)

###### `ready`

Returns a promise that resolves when:

- the constructor was called with data as an array of keys, this promise resolves when all the keys were loaded from localForage

- the constructor was called with data as an object, this promise resolves when `setItem` has been called for all the keys



[mobx]: http://mobx.js.org
[mobx-observer]: https://github.com/capaj/mobx-observer
[localforage]: https://github.com/localForage/localForage

