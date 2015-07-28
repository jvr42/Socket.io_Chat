var FileFilter = function(file) {	

	this.filter = function(test) {
		if(test.file.match(file)) {
			return false;
		}

		return true;
	}
}

module.exports = FileFilter;