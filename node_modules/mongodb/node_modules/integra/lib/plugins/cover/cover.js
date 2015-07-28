var debug = require('../../utils').debug
	, f = require('util').format
	, Instrumentor = require('./instrumentor')
	, Module = require('module')
	, TreeSummarizer = require('./tree-summarizer')
	, utils = require('./object-utils')
	, path = require('path')
	, Html = require('./cover_reporters/html')
	, mkdirp = require('mkdirp')
	, fs = require('fs');

var Cover = function Cover(options) {	
	var logger = debug('Cover');

	var originalRequire = require.extensions['.js'];
	var coverOptions = options || {};
	if(!coverOptions.includes) coverOptions.includes = ["./lib"];

	// Output directory
	coverOptions.outputDirectory = coverOptions.outputDirectory || "./out";
	coverOptions.outputDirectory = coverOptions.outputDirectory + "/cover";

	// Reporter
	var generator = new Html(coverOptions);
	// Coverage instrumentor
	var instrumentor = new Instrumentor();

	this.beforeInitialize = function(files, callback) {
		logger(coverOptions.logLevel, 'info', f("beforeInitialize"));

		// Override with our own
		require.extensions['.js'] = function(module, filename) {
			logger(coverOptions.logLevel, 'info', f("loading file %s", filename));
			// Are we going to instrument it
			var instrument = true;

			// Check if it's in a node_module, and don't instrument if it is
			if(filename.indexOf('node_modules/') != -1) {
				instrument = false;
			}

			// The file is not on the passed in list, instrument it
			if(instrument) {
				logger(coverOptions.logLevel, 'info', f("instrumenting file %s", filename));
				// Otherwise instrument it
				var file = fs.readFileSync(filename).toString();			
				// Instrument the code
				var instrumentedCode = instrumentor.instrumentSync(file, filename);
				// Get the base name
				var baseName = path.basename(filename);
				// Relative path
				var relativePathFile = filename.replace(process.cwd(), "");
				var relativePath = filename.replace(process.cwd(), "").replace("/" + baseName, "");

				// Create the relative Path
				mkdirp.sync("./out/" + relativePath, 0777);
				// Write the instrumented file
				fs.writeFileSync("./out/" + relativePathFile, instrumentedCode);
				// Return the compiled module
				return module._compile(instrumentedCode, filename);
			}

			// Return the original module
			return originalRequire(module, filename);
		}		
		// Finish up instrumenting
		callback();
	}

	this.beforeStart = function(tests, callback) {
		logger(coverOptions.logLevel, 'info', f("beforeStart"));
		callback();
	}

	this.beforeExit = function(tests, callback) {
		logger(coverOptions.logLevel, 'info', f("beforeExit"));
		// Create an instance of the Tree Summarizer
		var summarizer = new TreeSummarizer();
		// Undefined __coverage__ ignore
		if(global.__coverage__ == undefined) __coverage__ = {};
		// For each file in coverage, let's generate
		for(var filename in __coverage__) {
			// Get the coverage
			var coverage = __coverage__[filename];
			
			// Add content to summarizer
			summarizer.addFileCoverageSummary(filename, utils.summarizeFileCoverage(coverage));
		}

		// Get the tree summary
		var tree = summarizer.getTreeSummary();
		// Execute generation of html page
		generator.generate(tree.root, __coverage__);
		// Flush Tree to disk as json
		fs.writeFileSync("./out/cover/cover_data_summarized.json", JSON.stringify(tree, null, 2));
		fs.writeFileSync("./out/cover/cover_data_raw.json", JSON.stringify(__coverage__, null, 2));
		// Finish up
		callback();
	}

	this.beforeTest = function(test, callback) {
		logger(coverOptions.logLevel, 'info', f("beforeTest"));
		callback();
	}

	this.afterTest = function(test, callback) {
		logger(coverOptions.logLevel, 'info', f("afterTest"));
		callback();
	}
}

module.exports = Cover;