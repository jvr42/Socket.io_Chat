var debug = require('../../utils').debug
	, f = require('util').format;

var CoverageData = function(options) {
	var logger = debug('CoverageData');
	var dataDictionaries = {};
	var dataDictionary = {};

	// Set up coverage options
	var coverOptions = options || {};

	// Set the start dictionary as the default one
	var currentDictionary = null;

	// Clear out all the data
	var clearOutData = function(coverage) {
		var cleanObject = function(o, value) {
			for(var _name in o) {
				o[_name] = value;
			}			
		}

		// Clean out the coverage object
		for(var name in coverage) {
			var cov = coverage[name];
			cleanObject(cov.s, 0);
			cleanObject(cov.f, 0);

			// zero out all the entries in the array
			for(var _name in cov.b) {
				for(var i = 0; i < cov.b.length; i++) {
					cov.b[i] = 0;
				}
			}
		}
	}

	// Copy all the data
	var copyData = function(coverage, destination) {
		var copyObject = function(o) {
			var obj = {};
			
			for(var _name in o) {
				obj[_name] = o[_name];
			}

			return obj;
		}

		for(var name in coverage) {
			destination[name] = {
					path: coverage[name].path
				,	s: copyObject(coverage[name].s)
				, b: copyObject(coverage[name].b)
				, f: copyObject(coverage[name].f)
				, fnMap: copyObject(coverage[name].fnMap)
				, statementMap: copyObject(coverage[name].statementMap)
				, branchMap: copyObject(coverage[name].branchMap)
			};
		}		
	}

	var cleanupData = function(coverage) {
		for(var name in coverage) {
			if(Object.keys(coverage[name].statementMap) == 0) {
				delete coverage[name];
			}
		}		
	}

	this.setCurrentDictionary = function(name, test) {
		logger(coverOptions.logLevel, 'debug', f("setCurrentDictionary = %s", name));
		// If we don't have a dictionary for this test create one
		if(dataDictionaries[name] == null) {
			dataDictionaries[name] = {
					test: test
				, data: {}
			};
		}

		// Clear out all the data
		clearOutData(dataDictionary);

		// Set the current dictionary to the test one
		currentDictionary = dataDictionaries[name];
	}

	this.unsetCurrentDictionary = function() {
		logger(coverOptions.logLevel, 'debug', f("unsetCurrentDictionary"));
		// Copy the data
		copyData(dataDictionary, currentDictionary.data);
	}

	this.getDataDictionaries = function() {
		logger(coverOptions.logLevel, 'debug', f("getDataDictionaries"));
		return dataDictionaries;
	}

	this.getDefaultDictionary = function() {
		return dataDictionary;
	}

	Object.defineProperty(this, 'data', {
		get: function() {
			logger(coverOptions.logLevel, 'debug', f("getData"));
			return dataDictionary;
		},
		enumerable: true
	});
}

module.exports = CoverageData;