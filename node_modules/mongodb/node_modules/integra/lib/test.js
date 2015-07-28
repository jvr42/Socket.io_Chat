var utils = require('./utils');

var Test = function(name, file, module) {	
	utils.readOnlyEnumerableProperty(this, "name", name);
	utils.readOnlyEnumerableProperty(this, "file", file);
	utils.readOnlyEnumerableProperty(this, "test", module[name]);
	utils.readOnlyEnumerableProperty(this, "module", module);
	utils.readOnlyEnumerableProperty(this, "metadata", module[name].metadata);
}

module.exports = Test;