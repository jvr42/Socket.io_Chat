var utils = require('./utils');

var TestFile = function(file, module) {
  var tests = {};
  // Do we have a before and after function
  var beforeTests = module['beforeTests'];
  var afterTests = module['afterTests'];
  var afterTestsRun = false;
  var beforeTestsRun = false;

  // Enumerable properties
  utils.readOnlyEnumerableProperty(this, "tests", tests);
  utils.readOnlyEnumerableProperty(this, "file", file);

  // Push an entry
  this.push = function(test) {
    tests[test.name + test.file] = test;
  }

  this.beforeTests = function(configuration, test, callback) {
    // Remove entry from hash
    delete tests[test.name + test.file];
    // Execute beforeTests if first test
    if(typeof beforeTests != 'function' || beforeTestsRun) 
      return callback();
    
    beforeTestsRun = true;
    beforeTests(configuration, callback);
  }

  this.afterTests = function(configuration, test, callback) {
    if(typeof afterTests != 'function' || afterTestsRun || Object.keys(tests).length > 0) 
      return callback();
    
    afterTestsRun = true;
    afterTests(configuration, callback);    
  }
}

module.exports = TestFile;