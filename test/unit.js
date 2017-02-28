import assert from 'assert';
import { delay } from 'bluebird';
import * as mobx from 'mobx';
import Store, {
  __Rewire__ as rewire,
  __ResetDependency__ as reset,
} from '../src';

describe('Unit', () => {

  describe('constructor', () => {
    it('should exist and construct', () => {
      assert(Store);
      const store = new Store();
      assert(store);
    });

    it('should not create a localforage store without a name', () => {
      const store = new Store();
      assert(!store.store);
    });
    it('should create a localforage store with a name', () => {
      const store = new Store('store');
      assert(store.store);
    });

    it('should fill in keys with an array', () => {
      const store = new Store(['key']);
      assert(store);
      assert(typeof store.key !== 'undefined');
    });
  });

  describe('setItem', () => {
    it('should make value observable', async() => {
      const store = new Store({}, { useProxy: false });
      store.key = 1;
      assert(!mobx.isObservable(store, 'key'), 'isObservable');
      await store.setItem('key', 2);
      assert(mobx.isObservable(store, 'key'), '!isObservable');
      assert(store.key == 2);
      await store.setItem('key', 3);
      assert(store.key == 3);
    });
    if (typeof Proxy !== 'undefined') {
      it('should use proxy to automatically make value observable', async() => {
        const store = new Store();
        store.key = 1;
        await delay(1000);
        assert(mobx.isObservable(store, 'key'), 'isObservable');
        assert(store.key == 1);
      });
    }
  });

  describe('setState', () => {
    it('should call setItem', async() => {
      const store = new Store();
      await store.setState({ key: 'value' })
      assert(store.key == 'value')
    });
  });

  describe('getItem', () => {
    it('should throw without a name', async() => {
      const store = new Store();
      try {
        await store.getItem('key');
      } catch (error) {
        return;
      }
      throw new Error(`didn't throw`);
    });
    it('should get and set from store', async() => {
      const store = new Store('name');
      store.store.getItem = () => 'test';
      const value = await store.getItem('key');
      assert.equal(value, 'test');
    });
  });

  describe('removeItem', () => {
    it('should remove item', async() => {
      const store = new Store('name', { key: 'value' });
      await store.removeItem('key');
      assert(!store.key, store.key);
    });
  });

  describe('restore', () => {
    it('should throw without a name', async() => {
      const store = new Store();
      try {
        await store.restore();
      } catch (error) {
        return;
      }
      throw new Error(`didn't throw`);
    });
    it('should restore', async() => {
      const store1 = new Store('name');
      store1.setItem('key', 'val');
      const store2 = new Store('name');
      await store2.restore(['key']);
      assert(store2.key == 'val');
    });
    it('should restore automatically from constructor', async() => {
      const store1 = new Store('name', { key: 'value' });
      await store1.ready;
      const store2 = new Store('name', ['key']);
      await store2.ready;
      assert(store2.key == 'value');
    });
  });

  describe('clear', () => {
    it('should throw without a name', async() => {
      const store = new Store();
      try {
        await store.restore();
      } catch (error) {
        return;
      }
      throw new Error(`didn't throw`);
    });
    it('should clear', async() => {
      const store = new Store('name');
      store.setItem('key', 'value');
      assert(store.key);
      await store.clear();
      assert(!store.key);
    });
  });
});
