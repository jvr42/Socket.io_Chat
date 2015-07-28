var Runner = require('../lib/runner')
	, Cover = require('../lib/plugins/cover/cover')
	, FileFilter = require('../lib/filters/file_filter');

var MyConfiguration = function(context) {
	var http = require('http');
	// Contains the global configuration context
	// where you can store shared values across
	// all the contexts
	if(context.startPort == null)
		context.startPort = 30000;
	// Contains the server
	var server = null;

	return {		
		start: function(callback) {
			// Update start Port before starting server
			var serverStartPort = context.startPort;
			context.startPort = context.startPort + 10;
			// Start http server
			server = http.createServer(function (req, res) {
			  res.writeHead(200, {'Content-Type': 'text/plain'});
			  res.end("Hello world from " + serverStartPort);
			}).listen(serverStartPort, callback);
		},

		shutdown: function(callback) {
			server.close(callback);
		},

		setup: function(callback) {
			callback();
		},

		teardown: function(callback) {
			callback();
		}
	}
}

// Set up the runner
var runner = new Runner({
		logLevel:'info'
	, runners: 2
	, failFast: false
});

// Add some tests to run
runner.add("/test/tests/test1.js");
runner.add("/test/tests/test2.js");
// Add a filter
runner.plugin(new FileFilter("test1.js"))

// Add the code coverage plugin
runner.plugin(new Cover());
runner.on('exit', function(errors, results) {
	// console.log("========================================================")
	// console.dir(errors)
	// console.dir(results)
	// // Go over all the results
	// results.forEach(function(result) {
	// 	console.dir(result.results)
	// });
	process.exit(0)
});

// Run the configuration
runner.run(MyConfiguration);
