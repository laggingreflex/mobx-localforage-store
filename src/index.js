import localForage from 'localforage';
import * as mobx from 'mobx';
import * as mobxObserver from 'mobx-observer';
import ority from 'ority';
import { symbol } from './utils';

localForage.config({
  // driver: localforage.WEBSQL, // Force WebSQL; same as using setDriver()
  // name: pkg.name,
  // storeName: 'appdata', // Should be alphanumeric, with underscores.
});

const keysSymbol = symbol('__keys');
const storeSymbol = symbol('__store');
const readySymbol = symbol('__ready');

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

    if (Array.isArray(data)) {
      const keys = data;
      this[keysSymbol] = keys;
      const nullData = keys.reduce((d, k) => ({ ...d, [k]: null }), {});
      mobx.extendObservable(this, nullData);
      for (const key of keys) {
        this[key] = null;
      }
      if (this[storeSymbol]) {
        this[readySymbol] = this.restore(keys).then((data) => {
          Object.entries(data).forEach(([key, data]) => {
            this[key] = data;
          });
          return data;
        });
      } else {
        mobx.extendObservable(this, nullData);
      }
    } else {
      const _data = data || {};
      this[keysSymbol] = Object.keys(_data);
      mobx.extendObservable(this, _data);
      this[readySymbol] = this.setState(_data);
    }
    if (typeof Proxy !== 'undefined' && !(opts && opts.useProxy === false)) {
      return new Proxy(this, {
        set(store, key, value) {
          if (typeof key !== 'string') {
            store[key] = value;
            return true;
          }
          if (!store[keysSymbol].includes(key)) {
            store[keysSymbol].push(key);
          }
          store[key] = value;
          if (!mobx.isObservable(store, key)) {
            mobx.extendObservable(store, {
              [key]: store[key]
            });
            store.setItem(key, value)
          }
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

  async setItem(key, data) {
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
    return this[storeSymbol] && this[storeSymbol].setItem(key, data);
  }
  async getItem(key) {
    if (!this[storeSymbol]) {
      throw new Error('A unique name is require for data persistence');
    }
    if (!this[keysSymbol].includes(key)) {
      this[keysSymbol].push(key);
    }
    const data = await this[storeSymbol].getItem(key);
    await this.setItem(key, data);
    return data;
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
    await Promise.all(keys.map((key) => this.getItem(key).then(data => {
      ret[key] = data;
      return this.setItem(key, data);
    })));
    return ret;
  }

  setState(obj) {
    return Object.entries(obj).map(([key, value]) => this.setItem(key, value));
  }

  clear() {
    return Promise.all(this[keysSymbol].map((key) => this.removeItem(key)));
  }
  save() {
    return Promise.all(this[keysSymbol].map((key) => this.setItem(key)));
  }

  toJS() {
    return mobx.toJS(this);
  }

}
