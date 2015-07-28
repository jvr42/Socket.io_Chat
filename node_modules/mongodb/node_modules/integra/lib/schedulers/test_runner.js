var debug = require('../utils').debug
	, f = require('util').format
	, assert = require('../assert/assert')
	, utils = require('../utils')
	, Formatter = require('./formatter');

var TestRunnerResults = function() {
	var errors = [];
	var results = [];

	utils.readOnlyEnumerableProperty(this, "errors", errors);
	utils.readOnlyEnumerableProperty(this, "results", results);

	this.add = function(result) {
		results.push(result);
	}

	this.addErr = function(test) {
		errors.push(test);
	}
}

var TestResult = function(test) {
	var err = null;
	var callback = null;
	var number_of_assertions = 0;
	var number_of_successful_assertions = 0;
	var number_of_failed_assertions = 0;

	utils.readOnlyEnumerableProperty(this, "assertions", number_of_assertions);
	utils.readOnlyEnumerableProperty(this, "successfulAssertions", number_of_successful_assertions);
	utils.readOnlyEnumerableProperty(this, "failedAssertions", number_of_failed_assertions);

	this.addErr = function(_err) {
		err = _err;
	}

	this.done = function() {
		if(typeof callback == 'function') callback(test);
	}

	this.onDone = function(_callback) {
		callback = _callback;
	}

  this.ok = function(value, description) {
    number_of_assertions++;

    try {
      assert.ok(value, description);    
      number_of_successful_assertions++;
    } catch(err) {
      number_of_failed_assertions++;
      throw err;
    }
  }

  this.equal = function(expected, value, description) {
    number_of_assertions++;

    try {
      assert.equal(value, expected, description);
      number_of_successful_assertions++;
    } catch(_err) {
      number_of_failed_assertions++;
      throw _err;
    }
  }	

  this.notEqual = function(expected, value, description) {
    number_of_assertions++;

    try {
      assert.notEqual(value, expected, description);
      number_of_successful_assertions++;
    } catch(err) {
      number_of_failed_assertions++;
      throw err;
    }
  } 

  this.deepEqual = function(expected, value, description) {
  	number_of_assertions++;

		try {
			assert.deepEqual(value, expected, description);
			number_of_successful_assertions++;
		} catch(err) {
			number_of_failed_assertions++;
			throw err;
		}
  }

  this.throws = function(block, error, message) {
    number_of_assertions++;

    try {
      assert.throws(block, error, message);
      number_of_successful_assertions++;
    } catch(err) {
      number_of_failed_assertions++;
      throw err;
    }
  }

  this.strictEqual = function(expected, value, description) {
    number_of_assertions++;

    try {
      assert.strictEqual(value, expected, description);
      number_of_successful_assertions++;
    } catch(err) {
      number_of_failed_assertions++;
      throw err;
    }
  }

  this.uncaughtException = function(handler) {
    // Save state of the current uncaughtException listeners
    var state = process._events['uncaughtException'];
    process._events['uncaughtException'] = [];
    // Add our own handler
    process.on('uncaughtException', function(err) {
      process._events['uncaughtException'] = state;
      handler(err);
    });
  }
}

var TestRunner = function(context, options, plugins, testFiles) {
	var tests = [];
	var logger = debug('LocalScheduler');
	var results = new TestRunnerResults();
	var formatter = new Formatter();
	options = options || {};
	// Fail test process on first failure
	var failFast = typeof options.failFast == 'boolean' ? options.failFast : true;

	this.add = function(test) {
		tests.push(test);
	}

	this.run = function(callback) {
		if(tests.length == 0) callback(null, null);
		runTests(context, tests, 0, function() {
			callback(null, results);
		})
	}

	var runTests = function(context, tests, index, callback) {
		if(index >= tests.length) return callback();
		// Get the test
		var test = tests[index];
		// Create a test result instance
		var testResult = new TestResult(test);
		results.add(testResult);
		// Assume fail until passed in case of an uncaught exception
		test.status = "fail";
		
		// Add onDone
		testResult.onDone(function(test) {
			console.log(formatter.ok('✔ ' + test.name));
			test.status = "pass";

      // Execute the before tests
      testFiles[test.file].afterTests(context, test, function() {
  			// All plugins that need to run after a test finished
  			utils.executeAllPlugins(plugins, "afterTest", test, function() {
  				context.teardown(function() {
  					runTests(context, tests, index + 1, callback);
  				});
  			});			
      });
		});

		// All plugins that need to run before a test starts
		utils.executeAllPlugins(plugins, "beforeTest", test, function() {
			// We need to run the context setup
			context.setup(function() {
        
        // Execute the before tests
        testFiles[test.file].beforeTests(context, test, function() {
          // Get the test Function
          var testFunction = typeof test.test == 'function' ? test.test : test.test.test;
          
          // Execute the test
          try {
            logger(options.logLevel, 'info', f("started test [%s]", test.name));
            testFunction.apply(test.module, [context, testResult]);
          } catch(err) {
            console.log(formatter.error('✖ ' + test.name));
            console.log(formatter.bold(JSON.stringify(err)));
            // Add error to test results
            testResult.addErr(err);
            
            // If we decided to fail fast, due so now
            if(!failFast) {
              // All plugins that need to run after a test finished
              return utils.executeAllPlugins(plugins, "afterTest", test, function() {
                process.nextTick(function() {
                  runTests(context, tests, index + 1, callback);
                });
              });
            }

            // Throw an error
            throw err;
          }                    
        })
			});
		});
	}
}

module.exports = TestRunner;
