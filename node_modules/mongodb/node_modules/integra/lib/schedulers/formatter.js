//
// Output helper
//
var Formatter = function() {
  // Output helpers
  this.options = { error_prefix: '\u001b[31m',
    error_suffix: '\u001b[39m',
    ok_prefix: '\u001b[32m',
    ok_suffix: '\u001b[39m',
    bold_prefix: '\u001b[1m',
    bold_suffix: '\u001b[22m',
    assertion_prefix: '\u001b[35m',
    assertion_suffix: '\u001b[39m' };  
}

Formatter.prototype.error = function (str) {
  return this.options.error_prefix + str + this.options.error_suffix;
}
  
Formatter.prototype.ok = function (str) {
  return this.options.ok_prefix + str + this.options.ok_suffix;
}
  
Formatter.prototype.bold = function (str) {
  return this.options.bold_prefix + str + this.options.bold_suffix;
}
  
Formatter.prototype.assertion_message = function (str) {
  return this.options.assertion_prefix + str + this.options.assertion_suffix;
}

module.exports = Formatter;