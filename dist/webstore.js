(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*! 
 * memorystorage.js - A memory-backed implementation of the Web Storage API.
 *
 * @copyright Copyright 2015 by Stijn de Witt. Some rights reserved. 
 * @license Licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).
 */
(function (u,m,d) {
    if (typeof define === 'function' && define.amd) {define(d);} 
    else if (typeof exports === 'object') {module.exports = d();} 
    else {u[m] = d();}
}(this, 'MemoryStorage', function(){
	'use strict';

	// API methods and properties will be cloaked
	var API = {'clear':1, 'getItem':1, 'id':1, 'key':1, 'length':1, 'removeItem':1, 'setItem':1},
		API_LENGTH = Object.keys(API).length,
		CLOAK = '__memorystorage_cloaked_items__';

	// Used to store all memorystorage objects
	var storage = {};

	/** @module memorystorage */
	
	/**
	 * Creates a new MemoryStorage object implementing the <a href="http://www.w3.org/TR/webstorage/">Web Storage API</a> using memory.
	 * 
	 * <p>If no arguments are given, the created memory storage object will read from and write to the
	 * <code>global</code> memory storage. If a string argument is given, the new storage object
	 * will read from and write to it's own segment of memory. Any data written to such a memory
	 * storage object will only show up in other memory storage objects that have been created with
	 * the same id. This data will not show up in the <code>global</code> memory space. As such it 
	 * is recommended to always construct a memory storage object with a unique string id as argument.</p> 
	 * 
	 * @param id Optional string argument used to isolate this memory storage object from others.
	 *
	 * @alias module:memorystorage.MemoryStorage
	 * @class 
	 */
	function MemoryStorage(id) {
		// make sure id is assigned
		id = id || 'global';
		// try to get existing store
		var result = storage[id]; 
		// return it if found
		if (result) {return result;}
		
		// make sure there is no harm in leaving out new in invocations to MemoryStorage
		if (! (this instanceof MemoryStorage)) {return new MemoryStorage(id);}
		
		// create a new store and save a ref to it so we can get it back later
		result = storage[id] = this;
		// create a space to store 'cloaked' key/values: items that have a key
		// that collides with Web Storage API method names.
		var cloaked = {};
		Object.defineProperty(result, CLOAK, {
			enumerable: false,
			get: function(){return cloaked;}
		});
		// Allow client code to read the id
		Object.defineProperty(result, 'id', {
			enumerable: true,
			get: function(){return id;}
		});
		// Create the length property
		Object.defineProperty(result, 'length', {
			enumerable: true,
			get: function(){
				return Object.keys(this).length + Object.keys(this[CLOAK]).length - API_LENGTH;
			}
		});
		// Create API methods
		result.getItem = function MemoryStorage_getItem(key) {
			return key in API ? this[CLOAK][key] : this[key];
		};
		result.setItem = function MemoryStorage_setItem(key, val) {
			if (key in API) {this[CLOAK][key] = val;}
			else {this[key] = val;}
		};
		result.removeItem = function MemoryStorage_removeItem(key) {
			if (key in API) {delete this[CLOAK][key];}
			else {delete this[key];}
		};
		result.key = function MemoryStorage_key(idx) {
			var keys = Object.keys(this).concat(Object.keys(this[CLOAK]));
			keys = keys.filter(function(x){return !(x in API);});
			return idx >= 0 && idx < keys.length ? keys[idx] : null;
		};
		result.clear = function MemoryStorage_clear() {
			var keys = Object.keys(this).filter(function(x){return !(x in API);});
			for (var i=0,key; key=keys[i]; i++) {
				if (! (key in API)) {delete this[key];}
			}
			keys = Object.keys(this[CLOAK]);
			for (var i=0,key; key=keys[i]; i++) {
				delete this[CLOAK][key];
			}
		};
		return result;
	}
	
	// EXPOSE
	return MemoryStorage;
}));

},{}],2:[function(require,module,exports){
(function (global){
'use strict';

global.WebStore = require('./webstore');

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./webstore":3}],3:[function(require,module,exports){
/*! 
 * webstore.js - One stop shop for Web Storage API compliant persistence.
 *
 * @copyright Copyright 2015 by Stijn de Witt. Some rights reserved. 
 * @license Licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).
 */

var MemoryStorage = require('memorystorage');

var DEFAULTS = {
	reviver: basicReviver
};

/** @module webstore */

/**
 * Creates a new WebStore object implementing the <a href="http://www.w3.org/TR/webstorage/">Web Storage API</a>.
 * 
 * <p>If no arguments are given, the created storage object will read from and write to the
 * <code>global</code> storage. If a string argument is given, the new storage object
 * will read from and write to it's own segment of storage. Any data written to such a 
 * storage object will only show up in other storage objects that have been created with
 * the same id. This data will not show up in the <code>global</code> storage. As such it 
 * is recommended to always construct a storage object with a unique string id as argument.</p>
 * 
 * @param id Optional string argument used to isolate this storage object from others.
 *
 * @alias module:webstore.WebStore
 * @class 
 */
function WebStore(id, options) {
	// Allow for new-less invocation
	if (! (this instanceof WebStore)) {return new WebStore(id);}

	var me = MemoryStorage.call(this, id);
	if (! me.config) {
		var config = DEFAULTS;
		for (var key in options) {
			config[key] = options[key];
		}
		Object.defineProperty(me, 'config', {
			enumerable: false,
			writeable: false,
			configurable: false,
			get: function(){return config;}
		});
	}
	return me;
}

WebStore.prototype  = Object.create(MemoryStorage.prototype);
WebStore.constructor = WebStore;

WebStore.prototype.load = function WebStore_load() {
	if (storageAvailable('localStorage')) {
		for(var i=0; i<localStorage.length; i++) {
			var key = localStorage.key(i);
			if (key.indexOf(this.id) === 0) {
				var value = localStorage.getItem(key);
				value = deserialize(value, this.config.reviver);
				this.setItem(key.substring(this.id.length), value);
			}
		}
	}
};

WebStore.prototype.save = function WebStore_save() {
	if (storageAvailable('localStorage')) {
		for(var i=0; i<this.length; i++) {
			var key = this.key(i),
				value = this.getItem(key);
			value = serialize(value);
			// TODO deal with transactional integrity issues
			localStorage.setItem(this.id + key, value);
		}
	}
};

function storageAvailable(type){
	try {
		var x = '__storage_availability_test__';
		window[type].setItem(x, x);
		var y = window[type].getItem(x);
		window[type].removeItem(x);
		if (x !== y) {throw new Error();}
		return true;
	}
	catch(e) {return false;}
}

//Polyfill constructor.name in IE
//Thanks to Matthew Sharley for this.
if (Function.prototype.name === undefined && Object.defineProperty !== undefined) {
    Object.defineProperty(Function.prototype, 'name', {
        get: function() {
            var funcNameRegex = /function\s([^(]{1,})\(/;
            var results = (funcNameRegex).exec((this).toString());
            return results && results.length > 1 ? results[1].trim() : '';
        }
    });
}

var W3CX = '__w3cx__',
    CTOR = '__w3cx_ctor__';

function serialize(value) {
	var t = typeof value;
	// W3C-compliant types (only string)
	if (t === 'string') {return value;}
	// save constructor name of object so it can be revived correctly
	if (t === 'object') {value[CTOR] = value.constructor.name;}
	var result = W3CX + JSON.stringify(value);
	delete value[CTOR];
	return result;
}

function deserialize(value, reviver) {
	// W3C-compliant types (only string)
	if (value.indexOf(W3CX)) {return value;}
	// deal with other types
	var result = JSON.parse(value.substring(W3CX.length), reviver);
	return result;
}

function basicReviver(key, value) {
	var t = typeof value;
	if (t === 'string' && /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/.test(value)) {
		return new Date(value);
	}
	if (t === 'object' && typeof value[CTOR] === 'string') {
		var ctor = basicReviver.constructors[value[CTOR]] || window[value[CTOR]];
		delete value[CTOR];
		if (typeof ctor === 'function') {
			return typeof ctor.fromJSON === 'function' ? ctor.fromJSON(value) : fromJSON(ctor, value);
		} else {
			return value;
		}
	}
	return value;
}
basicReviver.constructors = {};

function fromJSON(ctor, data) {
	var obj = new ctor(),
		keys = Object.keys(data);
	for (var i=0,key; key=keys[i]; i++) {
		obj[key] = data[key];
	}
	return obj;
}

// TODO we need a mechanism to ensure we pick up changes made to localStorage from OTHER tabs

// EXPOSE
module.exports = WebStore;

},{"memorystorage":1}]},{},[2]);
