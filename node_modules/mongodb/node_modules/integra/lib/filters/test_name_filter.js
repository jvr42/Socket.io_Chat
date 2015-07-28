var TestNameFilter = function(name) {
  this.filter = function(test) {
    if(test.name.match(name)) {
      return false;
    }

    return true;
  }  
}

module.exports = TestNameFilter;