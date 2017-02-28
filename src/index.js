import localForage from 'localforage';
import * as mobx from 'mobx';
import * as mobxObserver from 'mobx-observer';
import ority from 'ority';
import { symbol, debounce } from './utils';

localForage.config({
  // driver: localforage.WEBSQL, // Force WebSQL; same as using setDriver()
  // name: pkg.name,
  // storeName: 'appdata', // Should be alphanumeric, with underscores.
});

const keysSymbol = symbol('__keys');
const storeSymbol = symbol('__store');
const readySymbol = symbol('__ready');
const oDataSymbol = symbol('__original_data');
const okeysSymbol = symbol('__original_keys');
const optsSymbol = symbol('__opts');

export default class Store {

  static config = localForage.config

  constructor(...args) {
    const { name, data, opts } = ority(args, [{
      name: 'string',
    }, {
      name: 'string',
      data: 'array|object',
    }, {
      name: 'string',
      data: 'array|object',
      opts: 'object',
    }, {
      data: 'array|object',
      opts: 'object',
    }, {
      data: 'array|object',
    }, {}]);

    if (name) {
      this[storeSymbol] = localForage.createInstance({ name });
    }

    this[optsSymbol] = opts || {};

    if (this.opts.debounce) {
      this._storeItem = this.storeItem;
      this.storeItemDebounced = debounce(::this._storeItem, this.opts.debounce);
      this.storeItem = (key, data, opts = {}) => {
        if (opts.immediate || opts.debounce === false) {
          return this._storeItem(key, data, opts);
        } else {
          return this.storeItemDebounced(key, data, opts);
        }
      }
      this._setItem = this.setItem;
      this.setItemDebounced = debounce(::this._setItem, this.opts.debounce);
      this.setItem = (key, data, opts = {}) => {
        if (opts.immediate || opts.debounce === false) {
          return this._setItem(key, data, opts);
        } else {
          return this.setItemDebounced(key, data, opts);
        }
      }
    }

    this.setItem('isReady', false, { save: false });

    this[keysSymbol] = this[okeysSymbol] = [];
    if (Array.isArray(data)) {
      this[keysSymbol] = data;
      this[oDataSymbol] = data.reduce((d, k) => ({ ...d, [k]: null }), {});
    } else {
      const _data = data || {};
      this[oDataSymbol] = _data;
      this[keysSymbol] = Object.keys(_data);
    }
    this[okeysSymbol] = Array.from(this[keysSymbol]);
    this[readySymbol] = this.setState(this[oDataSymbol], { save: false });

    if (this[storeSymbol]) {
      this[readySymbol] = this[readySymbol].then(() => this.restore());
    }

    this[readySymbol] = this[readySymbol].then(() => this.setItem('isReady', true, { save: false }))

    if (typeof Proxy !== 'undefined' && !(this.opts && this.opts.useProxy === false)) {
      return new Proxy(this, {
        deleteProperty: (store, key) => {
          delete store[key];
          return true;
        },
        set: (store, key, value) => {
          if (typeof key !== 'string') {
            this[key] = value;
            return true;
          }
          this.setItem(key, value, {
            save: this.opts.autosave === true || (Array.isArray(this.opts.autosave) && this.opts.autosave.includes(key))
          })
          return true;
        }
      });
    }
  }

  static autorun = mobx.autorun
  static observe = mobxObserver.observer
  static observeClass = mobxObserver.observer
  static observeStateless = mobxObserver.makeObserver

  observe(...args) { return mobx.observe(this, ...args) }
  intercept(...args) { return mobx.intercept(this, ...args) }

  [keysSymbol] = [];

  get store() { return this[storeSymbol]; }
  get ready() { return this[readySymbol]; }
  get opts() { return this[optsSymbol] }

  async storeItem(key, data) {
    if (!this[storeSymbol]) {
      throw new Error('A unique name is require for data persistence');
    }
    if (!(data === undefined || data === null)) {
      await this[storeSymbol].setItem(key, mobx.toJS(data));
    }
  }
  async setItem(key, data, opts = {}) {
    if (typeof data === 'undefined') {
      data = this[key];
    }
    if (!this[keysSymbol].includes(key)) {
      this[keysSymbol].push(key);
    }
    this[key] = data;
    if (!mobx.isObservable(this, key)) {
      mobx.extendObservable(this, {
        [key]: this[key]
      });
    }
    if (this[storeSymbol] && opts.save !== false) {
      await this.storeItem(key, data, opts)
    }
  }

  async getItem(key, opts = {}) {
    if (!this[storeSymbol]) {
      throw new Error('A unique name is require for data persistence');
    }
    if (!this[keysSymbol].includes(key)) {
      this[keysSymbol].push(key);
    }
    const restoredData = await this[storeSymbol].getItem(key);
    const currentData = this[key];
    const originalData = this[oDataSymbol] && this[oDataSymbol][key];
    if (!(typeof restoredData === 'undefined' || restoredData === null)) {
      await this.setItem(key, restoredData);
      return restoredData;
    } else {
      return currentData;
    }
  }

  removeItem(key) {
    this[keysSymbol] = this[keysSymbol].filter(k => k !== key);
    this[key] = null;
    return this[storeSymbol] && this[storeSymbol].removeItem(key);
  }

  async restore(keys) {
    if (!this[storeSymbol]) {
      throw new Error('A unique name is require for data persistence');
    }
    keys = keys || this[keysSymbol]
    const ret = {};
    await Promise.all(keys.map((key) => this.getItem(key).then(data => ret[key] = data)));
    return ret;
  }

  setState(obj, opts) {
    return Promise.all(Object.entries(obj).map(([key, value]) => this.setItem(key, value, opts)))
  }

  clear() {
    return Promise.all(this[keysSymbol].map((key) => this.removeItem(key)));
  }
  save(keys, opts = {}) {
    return Promise.all((keys || this[okeysSymbol]).map((key) => this.setItem(key, undefined, { save: true, immediate: true, ...opts })));
  }
  saveAll(except = []) {
    return this.save(this[keysSymbol].filter(a => !except.includes(a)))
  }

  toJS() {
    return mobx.toJS(this);
  }

}
