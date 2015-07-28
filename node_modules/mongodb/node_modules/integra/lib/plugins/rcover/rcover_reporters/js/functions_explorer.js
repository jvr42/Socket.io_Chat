// Grab the main divs
var left = document.getElementById("left");
var right = document.getElementById("right");

// Handle onchange event
var onChangeEventHandler = function(renderTo) {
  return function() {
    var value = this.options[this.selectedIndex].value;

    // User picked a an existing test, show coverage
    // from the view of that test
    if(value != "") {
      applyCoverage(renderTo, value);
    }
  } 
}

// Apply the handler
var applyHandler = function() {
	// Apply handler to all the test selectors
	var list = document.getElementsByTagName("input");
	for(var i = 0; i < list.length; i++) {
		list[i].onchange = function() {
			if(this.checked == false) {
				filtered[this.value] = 1;
			} else {
				delete filtered[this.value];
			}

			// Diff the data
			var filteredOut = createTotalCoverageModel(data.coverage, {
				filters: Object.keys(filtered)
			});

			// Do we have any keys (any diff at all)
			if(Object.keys(filteredOut).length > 0) {
				renderDiff(right, data, diffCoverage(totalCoverage, filteredOut));
			}
		}
	}
}

// Render the left side
var renderTestView = function(div, testsByFilename, filter) {
	div.innerHTML = '';
	var content = [];
	var fileMatch = null;

	// Check if we match exactly to a file
	for(var filename in testsByFilename) {
		var fname = filename.split('/').pop();
		if(filter == fname) {
			fileMatch = fname;
			break;
		}
	}

	if(fileMatch) {
		content.push("<h2>");
		content.push(fname);
		content.push("</h2>");

		// for(var name in testsByFilename[filename]) {
		testsByFilename[filename].forEach(function(name) {
			var text = name.length > 48 ? name.substr(0, 48) + "..." : name;

			content.push("<input type='checkbox' checked value='");
			content.push(name);
			content.push("'/>");
			content.push(text);
			content.push('<br/>');				
		});		
	} else {
		// Order by filename
		for(var filename in testsByFilename) {
			var fname = filename.split('/').pop();
			content.push("<h2>");
			content.push(fname);
			content.push("</h2>");

			testsByFilename[filename].forEach(function(name) {
				var text = name.length > 48 ? name.substr(0, 48) + "..." : name;

				if(filter == null || name.toLowerCase().indexOf(filter.toLowerCase()) != -1) {
					content.push("<input type='checkbox' checked value='");
					content.push(name);
					content.push("'/>");
					content.push(text);
					content.push('<br/>');									
				}
			});
		}		
	}

	// Add the content
	div.innerHTML = content.join('');
	// Apply the handler
	applyHandler();
}

renderTestView(left, data.testsByFilename);

// Add change handler
document.getElementById('search').onkeyup = function() {
	renderTestView(left, data.testsByFilename, this.value);
};

// All files currently filtered out
var filtered = {};

// Render the difference
var renderDiff = function(right, data, diff) {
	// Content
	var content = [];

	// Clear out the HTML
	right.innerHTML = '';

	// Render all the diffs found
	for(var name in diff) {
		content.push("<h3>");
		content.push(name.split("/").pop());
		content.push("</h3>");

		// Locate the source for this file
		var sourceLines = data.source[name];

		// Get all the diffs
		var diffs = diff[name];
		for(var _name in diffs) {
			// Get a specific diff
			var change = JSON.parse(_name);
			// Unpack the diff
			var line = change[0];
			var covered = change[1] == 1 ? true : false;
			var consumeBlanks = change[2] == 1 ? true : false;
			var startPos = change[3];
			var endPos = change[4];
			var origLength = change[5];
			var offsets = change.length == 7 ? change[6] : [];
			content.push(sourceLines[line]);
		}
	}

	right.innerHTML = content.join("<br/>");
}

// Calculate total coverage and create a data model we can compare against
var createTotalCoverageModel = function(coverage, options) {
	var coverageByFile = {};
	options = options	|| {};
	var filters = options.filters || [];

	for(var testname in coverage) {
		var skip = false;
		filters.forEach(function(filter) {
			if(testname == filter) skip = true;
		})

		// Don't skip the coverage
		if(!skip) {
			var c = coverage[testname];
			for(var filename in c) {
				// Create an entry for the coverage file
				coverageByFile[filename] = coverageByFile[filename] ? coverageByFile[filename] : {};
				// Generate a coverage hash based on the data entries
				c[filename].s.forEach(function(s) {
					coverageByFile[filename][JSON.stringify(s)] = 1;
				});
			}			
		}
	}

	return coverageByFile;
}

var diffCoverage = function(toaltCoverage, modifiedCoverage) {
	var diff = {};

	for(var filename in toaltCoverage) {
		var totalFileCoverage = totalCoverage[filename];
		var modifiedFileCoverage = modifiedCoverage[filename];

		// Go through all the coverage
		Object.keys(totalFileCoverage).forEach(function(key) {
			if(modifiedFileCoverage[key] == null) {
				diff[filename] = diff[filename] != null ? diff[filename] : {};
				diff[filename][key] = 1;
			}
		});
	}

	return diff;
}

// Create total coverage model we will use for diffs
var totalCoverage = createTotalCoverageModel(data.coverage);

var lt = '\u0001',
    gt = '\u0002',
    RE_LT = /</g,
    RE_GT = />/g,
    RE_AMP = /&/g,
    RE_lt = /\u0001/g,
    RE_gt = /\u0002/g;

function customEscape(text) {
  text = text.toString();
  return text.replace(RE_AMP, '&amp;')
      .replace(RE_LT, '&lt;')
      .replace(RE_GT, '&gt;')
      .replace(RE_lt, '<')
      .replace(RE_gt, '>');
}