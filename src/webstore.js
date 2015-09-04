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
