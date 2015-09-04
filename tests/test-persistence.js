QUnit.test("Persistence Test - W3C API compliance", function( assert ) {
	var store = new WebStore('local');
	store.load();
	assert.ok(store.stringData === 'Some string', 'String data survived reload');
});

QUnit.test("Persistence Test - Basic types", function( assert ) {
	var store = new WebStore('local');
	store.load();
	assert.ok(store.booleanData === true, 'Boolean data survived reload');
	assert.ok(store.integerData === 17, 'Integer data survived reload');
	assert.ok((store.floatData > 3.139999) && (store.floatData < 3.140001), 'Float data survived reload');
	assert.ok(store.dateData instanceof Date, 'Date data survived reload');
	assert.ok(store.arrayData && store.arrayData[0]==='some' && store.arrayData[1]==='array', 'Array data survived reload');
	assert.ok(store.objectData && store.objectData.some === 'object', 'Object data survived reload');
	assert.ok(store.nestedArrayData && store.nestedArrayData[0][0]==='some' && store.nestedArrayData[1].length === 2, 'Nested array data survived reload');
	assert.ok(store.nestedObjectData && store.nestedObjectData.some.nested==='object', 'Nested object data survived reload');
});

QUnit.test("Persistence Test - Custom types", function( assert ) {
	var store = new WebStore('local');
	window.Greeter = function Greeter(name) {
		this.name = name;
		this.greet = function Greeter_greet() {
			console.info('Hello, ' + this.name + '!');
		};
	};
	store.load();
	assert.ok(store.customTypedObject instanceof Greeter, 'Custom typed object data survived reload');
});
