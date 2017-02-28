import MockLocalStorage from 'mock-localstorage';

global.assert = require('assert');
global.delay = require('bluebird').delay;
global.mobx = require('mobx');

global.resetStorage = () => global.localStorage = new MockLocalStorage();
global.localStorage = new MockLocalStorage();
