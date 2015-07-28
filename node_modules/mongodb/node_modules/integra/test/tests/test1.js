exports['Should Correctly Match 1=1'] = {
	// Contains meta data that can be used by the runner to
	// filter tests based on environments
	metadata: {
		requires: { 
				mongodb: ">2.1.0"
			,	mongodb_topology: "single"
		}
	},

	// Actual test function to run
	test: function(configuration, test) {
		test.equal(1, 1);
		test.done();
	}
}

exports['Should Fail Due to 1 != 2'] = {
	// Contains meta data that can be used by the runner to
	// filter tests based on environments
	metadata: {
		requires: { 
				mongodb: ">2.1.0"
			,	mongodb_topology: "single"
		}
	},

	// Actual test function to run
	test: function(configuration, test) {
		test.equal(1, 2);
		test.done();
	}
}