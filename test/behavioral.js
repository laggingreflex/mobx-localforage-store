import Store, {
  __Rewire__ as rewire,
  __ResetDependency__ as reset,
} from '../src';

describe('Behavioral', () => {
  const value = 'some value';
  const value2 = 'some other value';
  const deepValue = { some: { deep: 'value' } };
  it('should initialize store with initial values', async() => {
    const store = new Store({
      some: value
    });
    assert.equal(store.some, value)
  });
  it('should restore', async() => {
    const store1 = new Store('namespace', ['some']);
    store1.some = value;
    await store1.save();
    const store2 = new Store('namespace', ['some']);
    await store2.ready;
    assert.equal(store2.some, value);
  });
  it('should restore deep', async() => {
    const store1 = new Store('namespace', ['some']);
    store1.some = deepValue;
    await store1.save();
    const store2 = new Store('namespace', ['some']);
    await store2.ready;
    assert.deepEqual(store2.some, deepValue);
  });
  it('should restore and overwrite default value', async() => {
    const store1 = new Store('namespace', { some: value });
    store1.some = value2;
    await store1.save();
    const store2 = new Store('namespace', { some: value });
    await store2.ready;
    assert.equal(store2.some, value2);
  });
  it.skip('should restore but not overwrite newly set value', async() => {
    // doesn't make sense. bahaviour is deprecated
    const store1 = new Store('namespace', ['some']);
    store1.some = value;
    await store1.save();
    const store2 = new Store('namespace', ['some']);
    store2.some = value2
    await store2.ready;
    assert.equal(store2.some, value2);
  });
  it('should restore but not overwrite if restored value was null', async() => {
    const store = new Store('namespace', ['some']);
    store.some = value;
    await store.ready;
    assert.equal(store.some, value);
  });
});
