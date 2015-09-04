# webstore <sub><sup>v0.9.0</sup></sub>
**One-stop shop for [Web Storage API](http://www.w3.org/TR/webstorage/) compliant persistence.**
[Project website](http://download.github.io/webstore)

WebStore builds on top of [MemoryStorage](https://download.github.io/memorystorage), 
adding persistence to it in the form of `load` and `save` methods.

For now loading and saving is explicit, so you will be able to fully control when it happens. 
I am thinking of some `autoPersist` option (maybe together with a strategy, or some settings) 
to have WebStore handle it for you, but that functionality is not there yet.

WebStore was built for performance. As it basically performs all operations in-memory, the overhead
of using it should be near zero as long as you don't save or load. When you do save or load, `localStorage`
is used so you will get the normal performance associated with such I/O. 

Having the data actually survive page reloads and browser sessions is a secondary concern. Users can wipe 
their browser caches and use private browsing modes, so we need to consider the option of the data
being gone anyway. I recommend storing the data on the server by means of an Ajax call if it is really
important and only using local storage as a glorified cache.

Currently, WebStore does not handle synchronization of data between multiple tabs. This
means you should either limit your use to single-page-apps, use isolated stores for different
pages, or come up with some synchronization system yourself.


## Download
* [webstore.js](https://cdn.rawgit.com/download/webstore/0.9.0/dist/webstore.js) (~10kB, commented)
* [webstore.min.js](https://cdn.rawgit.com/download/webstore/0.9.0/dist/webstore.min.js) (~3kB, minified)
* [webstore.min.js.map](https://cdn.rawgit.com/download/webstore/0.9.0/dist/webstore.min.js.map) (~3kB, debug map file)

## Include on your page
`webstore` can be used directly from CDN, or from a local script file.

### CDN
```xml
<script src="https://cdn.rawgit.com/download/webstore/0.9.0/dist/webstore.min.js"></script>
```

### Local script file
Download webstore.min.js, place it in a folder `lib` in the root of your website and include it like this:
```xml
<script src="/lib/webstore.min.js"></script>
```

### Use with NPM or Bower
`npm install webstore`

## Creating a webstore object
The `WebStore` function creates (or returns) a storage object implementing the W3C Web Storage API.
By default, scripts share a `global` storage object, so scripts can access and mutate each other's store
object. To have WebStore create a storage object that is isolated from other scripts, you pass in
a unique ID which acts as a namespace:

```javascript
var isolated = new WebStore('my-app'); // isolated from other scripts, recommended.
```

If you don't pass in an ID, or use the ID `'global'`, you get a globally shared storage object:

```javascript
var global = new WebStore(); // will default to a globally shared storage object.
var global2 = new WebStore('global'); // effectively same as above
```

For your convenience, the constructor permits `new`-less invocation:
```javascript
var store = WebStore('my-store');
var global = WebStore();
```

Instances of `WebStore` expose an immutable `id` property that is set to
the id the store was created with:

```javascript
alert(store.id); // alerts 'my-store'
alert(global.id); // alerts 'global'
```

## Loading the store
WebStore builds on top of [MemoryStorage](https://download.github.io/memorystorage). 
As such, all operations are performed in local memory and super-fast. But it also
means that we have to make sure our changes are loaded before we start, and saved
once we are done. I'm thinking about and experimenting with mechanisms to take care
of this for you, but for now you will explicitly have to call the `load` method yourself.

```javascript
var store = new WebStore('my-store');
store.load();
```

## Using the store
Once you have loaded the store, you can use it just as you would `localStorage`
or any other store implementing Web Storage:


```javascript
store.setItem('myString', 'Hello WebStore!');
store.myObject = JSON.stringify({my: 'object'}));
alert(store.getItem('My string')); // alerts 'Hello MemoryStorage!'
alert(store['My string']); // alerts 'Hello MemoryStorage!'
alert(store.length); // alerts '2'
alert(store.key(1)); // alerts 'My object'
store.removeItem('My string');
alert(store.length); // alerts '1'
store.clear();
alert(store.length); // alerts '0'
```

## Saving the store
When you are done writing to the store, call `save` to persist the data to `localStorage`:

```javascript
store.save();
```

If you don't mind some risk of losing the data, you could bind the `load` and `save` methods
to the `load`, `beforeunload`, `pageshow` and `pagehide` events. Note that WebKit will often
fire both `pagehide` and `beforeunload`, but not always. Currently I feel the best strategy would
be to bind to all events and just make sure we don't run save twice ourselves.


## Beyond the Web Storage API
WebStore is type-agnostic; it doesn't care about the type of data you store. 
If you want to remain within the Web Storage API, you should only read and write strings, 
however if you want you can store other types just as well.

### Storing basic types
```javascript
store.myNumber = 17;
alert(store.myNumber + 3); // alerts '20' (not '173')
store.myDate = new Date();

store.myObject = {my: 'object'};
alert(store.myObject.my); // alerts 'object'
var tree = {
	nested: {
		objects: {
			working: 'Sure!'
		}
	}
}
store.setItem('tree', tree);
alert(store.tree.nested.objects.working); // alerts 'Sure!'
```

###
WebStore even handles custom types:

```javascript
// A custom type
function Greeter(name) {
	this.name = name;
	this.greet = function Greeter_greet() {
		return 'Hello, ' + this.name + '!';
	};
};

// Add to the store and save
var store = new WebStore('local');
store.customData = new Greeter('WebStore');
store.save();

// Later on... possibly in a new browsing session
var store - new WebStore('local');
store.load();
alert(store.customData.greet()); // alerts 'Hello, WebStore!'
```

### Dealing with non-public types
When saved, WebStore serializes it's data to JSON and saves it in localStorage.
Some extra data is added to allow WebStore to find out what the name was of the
constructor used to create the object to be stored (class name in Java-speak). 
When the data is deserialized, WebStore uses JSON.parse with a custom `reviver`
function, which can be found on the store config:

`store.config.reviver;  // --> function basicReviver(key, value)`

To restore the original type, WebStore will try to get the constructor from the
window object using its name. If your types are not available on the window object, 
there are two thing you can do:

1. Add the type to the `constructors` object on the basic reviver
2. Replace the basic reviver with your own version.

#### Adding your private type to the basic reviver
Simply add your constructor function to the `constructors` property on the basic
reviver, keyed by name:
```javascript
function MyPrivateConstructor() {
  // do secret stuff here
}

store.config.reviver.constructors.MyPrivateConstructor = MyPrivateConstructor;
```

#### Replacing the basic reviver with your own one.
Writing a good JSON reviver is not easy and out of scope for these docs, 
but once you have one, telling WebStore to use your reviver instead of 
the basic reviver is a one-liner:

```javascript
var Store = new WebStore('my-store', {reviver: mySpiffyReviver});
```

If you need access to the old reviver, you can pick it up after creating the store
and then assign your new reviver:

```javascript
var Store = new WebStore('my-store');
var oldReviver = store.config.reviver; // Save the old reviver...
store.config.reviver = mySpiffyReviver; // Assign your new reviver
```

Make sure you don't save data with one reviver and then attempt to load it with another. It won't work.

#### Customizing JSON (de)serialization
WebStore adds a property named `__w3cx_ctor__` to the serialized JSON of objects 
that have a custom type, so it's basic reviver knows how to restore them. If you
want to customize what the JSON looks like, you can do so by implementing a `toJSON`
method on your objects, and a `fromJSON` method on your constructor.

## Copyright
Copyright 2015 by Stijn de Witt. Some rights reserved.

## License
Licensed under the [Creative Commons Attribution 4.0 International (CC-BY-4.0)](https://creativecommons.org/licenses/by/4.0/) Open Source license.