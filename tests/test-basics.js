QUnit.test("Basic Test - W3C API compliance", function( assert ) {
	var store = new WebStore('local');
  
	store.clear();
	assert.ok(store.length===0, "store cleared");
	store.setItem('test0', 'data0');
	assert.ok(store.length===1, "first item added to store");
	assert.ok(store.key(0)==='test0', "key registered");
	assert.ok(store.key(99)===null, "key() should return null when index out of bounds")
	assert.ok(store.getItem('test0')==='data0', "value retrieved with getItem matches stored value");
	assert.ok(store['test0']==='data0', "value retrieved with index operators matches stored value");
	store['test0'] = 'changed';
	assert.ok(store['test0']==='changed', "value updated correctly with index operators.");
	store['test1'] = 'data1';
	assert.ok(store.length===2, 'value added correctly with index operators');
	store.setItem('test2', 'data2');
	assert.ok(store.length===3, 'three items added to store');
	assert.ok(Object.keys(store).length == (7+3), "store has 10 enumerable properties (id, 6 api methods + 3 stored items)");
	assert.ok(store.getItem('test1')==='data1' && store.getItem('test2')==='data2', "retrieved values matches stored values");
	var keyOrderBefore = '';
	for (var i=0; i<store.length; i++) {
		keyOrderBefore += store.key(i);
	}
	store.setItem('test2', 'data2.2');
	var keyOrderAfter = '';
	for (var i=0; i<store.length; i++) {
		keyOrderAfter += store.key(i);
	}
	assert.ok(keyOrderBefore === keyOrderAfter, 'Key order not affected by mutation');

	store.removeItem('test1');
	assert.ok(store.length===2, "item removed correctly with removeItem");
	store.removeItem('test1');
	assert.ok(store.length===2, "double removal has no effect");
	assert.ok(store.getItem('test1')===undefined, "get removed item returns undefined");

	store.setItem('getItem', 'test');
	assert.ok(typeof store.getItem === 'function', "store API methods cannot be overwritten.");
	assert.ok(store.getItem('getItem') === 'test', "getItem successfully retrieves item with API name.");
	store.removeItem('getItem');
	assert.ok(store.getItem('getItem') === undefined, "After removal of item with API name, getItem returns undefined.");
	
	var glob = new WebStore();
	assert.ok(glob.length===0, "local store items are not visible globally");
	glob.setItem('glob0', 'data0');
	assert.ok(glob.length===1 && glob.getItem('glob0')==='data0', "globally stored items are retrieved ok");
	assert.ok(store.getItem('glob0')===undefined, "global items are not visible in the local store");
	glob.removeItem('glob0');
	assert.ok(glob.length===0, "global length is updated correctly");
	assert.ok(glob.key(0)===null, "global keys are removed correctly");
	assert.ok(glob.getItem('glob0')===undefined, "global values are removed correctly");

	store.clear();
	assert.ok(store.length===0, "store is cleared");
	assert.ok(store.key(0)===null, "no keys in cleared store");
	assert.ok(store.getItem('test0')===undefined, "no values in cleared store");
});

QUnit.test("Basic Test - Multiple instances", function( assert ) {
	var store1 = new WebStore('local');
	var store2 = new WebStore('local');
	store1.clear();
	store1.setItem('test0', 'data0');
	assert.ok(store2.getItem('test0') === store1.getItem('test0'), "Item added to store1 is also visible in store2");
	store1['test0'] = 'changed';
	assert.ok((store2.getItem('test0') === store1.getItem('test0')) && store1.getItem('test0') === 'changed', "Item changed in store1 is also changed in store2");
	store1['test1'] = 'data1';
	assert.ok(store2.length === store1.length, "Store lengths remain consistent");
	for (var i=0; i<store1.length; i++) {
		assert.ok(store1.key(i) === store2.key(i), 'Order of keys is consistent across stores');
		assert.ok(store1[store1.key(i)] === store2.getItem(store2.key(i)), 'Order and contents of values are consistent across stores');
	}
	store1.clear();
	assert.ok(store2.length===0, "Clearing store1 also clears store2");
});


QUnit.test("Basic Test - New-less construction", function( assert ) {
	var store1 = WebStore('local');
	assert.ok(store1, 'Existing store is defined and not null');
	assert.ok(store1 instanceof WebStore, 'Existing store is instanceof WebStore');
	
	var store2 = WebStore('new-store');
	assert.ok(store2, 'New store is defined and not null');
	assert.ok(store2 instanceof WebStore, 'New store is instanceof WebStore');
});

QUnit.test("Basic Test: Beyond W3C API", function( assert ) {
	var store = new WebStore('local');
	store.clear();
	store.my = {object: 'Yes!'};
	assert.ok(typeof store.getItem('my') === 'object', 'Object returned with getItem when object was stored');
	assert.ok(store.getItem('my').object === 'Yes!', 'Contents of objects survive storing/retrieving');
	store.tree = {nested: {objects: {works: 'Sure!'}}};
	assert.ok(store.tree.nested.objects.works === 'Sure!', 'Deep nested trees stored correctly');
	store.stringData = 'Some string';
	store.booleanData = true;
	store.integerData = 17;
	store.floatData = 3.14;
	store.dateData = new Date();
	store.arrayData = ['some', 'array'];
	store.objectData = {some: 'object'};
	store.nestedArrayData = [['some', 'nested'], ['array', 'data']];
	store.nestedObjectData = {'some': {nested: 'object'}};
	
	window.Greeter = function Greeter(name) {
		this.name = name;
		this.greet = function Greeter_greet() {
			return 'Hello, ' + this.name + '!';
		};
	};
	store.customTypedObject = new Greeter('Custom Type');
	
	// In the next test (in test-persistence.js), we'll see if this data survived reload
	store.save();
});

