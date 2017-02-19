import ority from 'ority';
import _debounce from 'debounce-promise';

export const symbol = symbol => typeof Symbol !== 'undefined' && Symbol(symbol) || symbol;
export const debounce = (...args) => {
  let { fn, delay, opts } = ority(args, [{
    fn: 'function',
  }, {
    fn: 'function',
    delay: 'number',
  }, {
    fn: 'function',
    delay: 'function',
  }, {
    fn: 'function',
    opts: 'object',
  }]);
  opts = opts || {};
  delay = delay || opts.delay || 500;

  return _debounce(fn, delay, opts)

}
