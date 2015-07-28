var debug = require('../utils').debug
	, f = require('util').format
	, TestRunner = require('./test_runner');

var LocalScheduler = function(options) {
	var _plugins = [];
	var testRunners = [];
	var logger = debug('LocalScheduler');

	this.addPlugins = function(plugins) {
		_plugins = plugins;
	}

	this.run = function(tests, testFiles, configurations, callback) {
		var index = 0;
		// Add x number of test queues to split up the tests into
		// parallel running ones
		configurations.forEach(function(configuration) {
			testRunners.push(new TestRunner(configuration, options, _plugins, testFiles));
		});

		// Filter out any tests
		tests.forEach(function(test) {
			var _test = test;
			var filterMatch = false;

			// Call the filter method on each plugin that has it specified
			for(var i = 0; i < _plugins.length; i++) {
				if(_plugins[i].filter && _plugins[i].filter(test)) {
					logger(options.logLevel, 'info', f("filtered out %s", test.name));
					_test = null;
					continue;
				}
			}	

			// Add the test to one of the queues
			if(_test) {
				testRunners[index].add(_test);
			}

			// Update the index
			index = (index + 1) % configurations.length;
		});

		// Runners left
		var runnersLeft = testRunners.length;
		var errors = [];
		var results = [];

		// Run all of the runners
		for(var i = 0; i < testRunners.length; i++) {
			testRunners[i].run(function(err, result) {
				runnersLeft = runnersLeft - 1;
				if(err) errors.push(err);
				if(result) results.push(result);

				// Callback as we are done
				if(runnersLeft == 0) {
					callback(errors, results);
				}
			});
		}
	}
}

module.exports = LocalScheduler;