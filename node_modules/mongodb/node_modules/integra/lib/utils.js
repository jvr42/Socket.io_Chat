var f = require('util').format;

var debug = function(className) {
	return function(logLevel, logLevelRequired, text) {
		if(logLevel == null) return;

		if(logLevelRequired == 'info' 
			&& (logLevel == 'debug' || logLevel == 'info'))
			return console.log(f("[INFO:%s] %s", className, text));

		if(logLevelRequired == 'error' 
			&& (logLevel == 'debug' || logLevel == 'info' || logLevel == 'error'))
			return console.log(f("[ERROR:%s] %s", className, text));

		if(logLevel == 'debug')
			return console.log(f("[DEBUG:%s] %s", className, text));
	}
}

/*
 *  Set up a read-only property using a value
 */
var readOnlyEnumerableProperty = function(self, name, value) {
	Object.defineProperty(self, name, {
		get: function() {
			return value;
		},
		enumerable: true
	});
}

/*
 *  Set up a read-only property using a function
 */
var readOnlyEnumerablePropertyFunction = function(self, name, func) {
	Object.defineProperty(self, name, {
		get: func,
		enumerable: true
	});
}

/*
 *  Execute a plugin method
 */
var executePluginsEventMethod = function(plugins, functionName, params) {
  for(var i = 0; i < plugins.length; i++) {
    var plugin = plugins[i];

    if(typeof plugin[functionName] == 'function') {
      plugin[functionName].apply(plugin, params);
    }
  }    
}

var executeAllPlugins = function(plugins, method, object, callback) {
	runPlugins(plugins, method, object, 0, callback);
}

var runPlugins = function(plugins, method, object, index, callback) {
	if(index >= plugins.length) return callback();

	// If the plugin supports this method, execute it
	if(typeof plugins[index][method] == 'function') {
		return plugins[index][method](object, function() {
			runPlugins(plugins, method, object, index + 1, callback);
		});
	}

	// Otherwise check the next plugin
	runPlugins(plugins, method, object, index + 1, callback);
}

module.exports = {
		readOnlyEnumerableProperty:readOnlyEnumerableProperty
	, executePluginsEventMethod: executePluginsEventMethod
	, readOnlyEnumerablePropertyFunction:readOnlyEnumerablePropertyFunction
	, debug: debug
	, executeAllPlugins: executeAllPlugins
}