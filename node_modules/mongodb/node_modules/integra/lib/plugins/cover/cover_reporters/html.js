var fs = require('fs')
	, InsertionText = require('../insertion-text')
  , debug = require('../../../utils').debug
	, path = require('path')
  , mkdirp = require('mkdirp')
  , f = require('util').format
	, handlebars = require('handlebars')
  , rimraf = require('rimraf');

var Html = function(options) {
	var self = this;
	options = options || {};
	options.outputDirectory = options.outputDirectory || "./out";
	options.tabReplacement = options.tabReplacement || "&nbsp;&nbsp;";
  options.reportSubDirectory = options.reportSubDirectory;
  options.noDelete = options.noDelete || false;

  // Logger
  var logger = debug('Html');

	// Templates
	var fileTemplate;
	var detailTemplate;
  var summaryTemplate;

  // Remove existing directories
  if(!options.noDelete) {
    rimraf.sync(options.outputDirectory);
  }

	// Perform any setup tasks
	var setup = function() {
    mkdirp.sync(options.outputDirectory + "/html", 0777);
    // Report subdirectory
    if(options.reportSubDirectory != null) {
      mkdirp.sync(options.outputDirectory + "/html/" + options.reportSubDirectory, 0777);
    }

		// Show ignored
		handlebars.registerHelper('show_ignores', function (metrics) {
		    var statements = metrics.statements.skipped,
		        functions = metrics.functions.skipped,
		        branches = metrics.branches.skipped,
		        result;

		    if (statements === 0 && functions === 0 && branches === 0) {
		        return '<span class="ignore-none">none</span>';
		    }

		    result = [];
		    if (statements >0) { result.push(statements === 1 ? '1 statement': statements + ' statements'); }
		    if (functions >0) { result.push(functions === 1 ? '1 function' : functions + ' functions'); }
		    if (branches >0) { result.push(branches === 1 ? '1 branch' : branches + ' branches'); }

		    return result.join(', ');
		});

		// Register helpers
		handlebars.registerHelper('show_lines', function (opts) {
		    var maxLines = Number(opts.fn(this)),
		        i,
		        array = [];

		    for (i = 0; i < maxLines; i += 1) {
		        array[i] = i + 1;
		    }
		    return array.join('\n');
		});

		// Register the line execution count handler
		handlebars.registerHelper('show_line_execution_counts', function (context, opts) {
		    var lines = context.l,
		        maxLines = Number(opts.fn(this)),
		        i,
		        lineNumber,
		        array = [],
		        covered,
		        value = '';

		    for (i = 0; i < maxLines; i += 1) {
		        lineNumber = i + 1;
		        value = '&nbsp;';
		        covered = 'neutral';
		        if (lines.hasOwnProperty(lineNumber)) {
		            if (lines[lineNumber] > 0) {
		                covered = 'yes';
		                value = lines[lineNumber];
		            } else {
		                covered = 'no';
		            }
		        }
		        array.push('<span class="cline-any cline-' + covered + '">' + value + '</span>');
		    }
		    return array.join('\n');
		});

		// Show the code
		handlebars.registerHelper('show_code', function (context /*, opts */) {
		    var array = [];

		    context.forEach(function (item) {
		        array.push(customEscape(item.text) || '&nbsp;');
		    });
		    return array.join('\n');
		});		

		// Read in the templates
  	var file = fs.readFileSync(__dirname + "/templates/file_html.txt", 'utf8');

  	// Compile the templates
  	fileTemplate = handlebars.compile(file, {noEscape: true});
  	detailTemplate = handlebars
  		.compile(fs.readFileSync(__dirname + "/templates/file_coverage.txt", 'utf8'), {noEscape: true});
  	summaryTemplate = handlebars
	  	.compile(fs.readFileSync(__dirname + "/templates/summary.txt", 'utf8'), {noEscape: true});
	}

	this.generate = function(node, coverage) {
		logger(options.logLevel, 'info', f("Generate HTML Files"));
		walkNode(node, coverage);
	}

	var walkNode = function(node, coverage) {
		// Run the setup
		setup();
		// Traverse all the children
		node.children.forEach(function(child) {
			if(child.kind == 'dir') {
				walkNode(child, coverage);
			} else {
				generateFile(child, coverage[child.fullName]);
			}
		});
	}

	var generateFile = function(node, fileCoverage) {
		// Current line count
		var count = 0;
		// Get the source text
    var sourceText = fileCoverage.code && Array.isArray(fileCoverage.code) 
    		? fileCoverage.code.join('\n') + '\n' 
        : fs.readFileSync(node.fullName, 'utf8');
    // Split up the code into source lines
    var code = sourceText.split(/(?:\r?\n)|\r/);
    // Create structured lines
    var structured = code.map(function (str) { 
  		count += 1; 
  		return { line: count, covered: null, text: new InsertionText(str, true) }; 
    });

    // Add a row 0
	  structured.unshift({ line: 0, covered: null, text: new InsertionText("") });

    annotateLines(fileCoverage, structured);    
    //note: order is important, since statements typically result in spanning the whole line and doing branches late
    //causes mismatched tags
    annotateBranches(fileCoverage, structured);
    annotateFunctions(fileCoverage, structured);
    annotateStatements(fileCoverage, structured);

    // Remove the row 0
    structured.shift();
		// Context of covered file
    context = {
      structured: structured,
      maxLines: structured.length,
      fileCoverage: fileCoverage
    };

  	// Get the actual file name
  	var filename = path.basename(node.fullName.split());
  	// Html name
  	var outputFilename = filename.replace(".js", ".html");

  	// Generate code details
    var details = detailTemplate(context);
    var summary = summaryTemplate({
    	metrics: node.metrics
    });

  	// Generate the result document
  	var html = fileTemplate({
  			entity: node.fullName
  		, reportClass: node.fullName
  		, details: details
  		, summary: summary
  	})

    var outputFile = options.outputDirectory + "/html/" + outputFilename;
    if(options.reportSubDirectory != null) {
      outputFile = options.outputDirectory + "/html/" + options.reportSubDirectory + "/" + outputFilename;
    }

  	// Print out the writing of the file
    logger(options.logLevel, 'info', f("Write coverage of %s", outputFile));
  	// Write the file out
  	fs.writeFileSync(outputFile, html);
	}
}

var lt = '\u0001',
    gt = '\u0002',
    RE_LT = /</g,
    RE_GT = />/g,
    RE_AMP = /&/g,
    RE_lt = /\u0001/g,
    RE_gt = /\u0002/g;

function title(str) {
  return ' title="' + str + '" ';
}

function annotateLines(fileCoverage, structuredText) {
  var lineStats = fileCoverage.l;
  if (!lineStats) { return; }
  Object.keys(lineStats).forEach(function (lineNumber) {
      var count = lineStats[lineNumber];
      structuredText[lineNumber].covered = count > 0 ? 'yes' : 'no';
  });

  structuredText.forEach(function (item) {
    if (item.covered === null) {
      item.covered = 'neutral';
    }
  });
}

function annotateBranches(fileCoverage, structuredText) {
  var branchStats = fileCoverage.b,
	    branchMeta = fileCoverage.branchMap;
  if (!branchStats) { return; }

  Object.keys(branchStats).forEach(function (branchName) {

    var branchArray = branchStats[branchName],
        sumCount = branchArray.reduce(function (p, n) { return p + n; }, 0),
        metaArray = branchMeta[branchName].locations,
        i,
        count,
        meta,
        type,
        startCol,
        endCol,
        startLine,
        endLine,
        openSpan,
        closeSpan,
        text;

    if(sumCount > 0) { //only highlight if partial branches are missing
      for (i = 0; i < branchArray.length; i += 1) {
        count = branchArray[i];
        meta = metaArray[i];
        type = count > 0 ? 'yes' : 'no';
        startCol = meta.start.column;
        endCol = meta.end.column + 1;
        startLine = meta.start.line;
        endLine = meta.end.line;
        openSpan = lt + 'span class="branch-' + i + ' ' + (meta.skip ? 'cbranch-skip' : 'cbranch-no') + '"' + title('branch not covered') + gt;
        closeSpan = lt + '/span' + gt;

        if (count === 0) { //skip branches taken
          if (endLine !== startLine) {
            endLine = startLine;
            endCol = structuredText[startLine].text.originalLength();
          }

          text = structuredText[startLine].text;
          if (branchMeta[branchName].type === 'if') { // and 'if' is a special case since the else branch might not be visible, being non-existent
            text.insertAt(startCol, lt + 'span class="' + (meta.skip ? 'skip-if-branch' : 'missing-if-branch') + '"' +
              title((i === 0 ? 'if' : 'else') + ' path not taken') + gt +
              (i === 0 ? 'I' : 'E')  + lt + '/span' + gt, true, false);
          } else {
            text.wrap(startCol,
              openSpan,
              startLine === endLine ? endCol : text.originalLength(),
              closeSpan);
          }
        }
      }
    }
  });
}

function annotateFunctions(fileCoverage, structuredText) {
  var fnStats = fileCoverage.f,
      fnMeta = fileCoverage.fnMap;
  if (!fnStats) { return; }
  Object.keys(fnStats).forEach(function (fName) {
    var count = fnStats[fName],
      meta = fnMeta[fName],
      type = count > 0 ? 'yes' : 'no',
      startCol = meta.loc.start.column,
      endCol = meta.loc.end.column + 1,
      startLine = meta.loc.start.line,
      endLine = meta.loc.end.line,
      openSpan = lt + 'span class="' + (meta.skip ? 'fstat-skip' : 'fstat-no') + '"' + title('function not covered') + gt,
      closeSpan = lt + '/span' + gt,
      text;

    if (type === 'no') {
      if (endLine !== startLine) {
        endLine = startLine;
        endCol = structuredText[startLine].text.originalLength();
      }

      text = structuredText[startLine].text;
      text.wrap(startCol,
        openSpan,
        startLine === endLine ? endCol : text.originalLength(),
        closeSpan);
    }
  });
}

function annotateStatements(fileCoverage, structuredText) {
  var statementStats = fileCoverage.s,
      statementMeta = fileCoverage.statementMap;
  Object.keys(statementStats).forEach(function (stName) {
    var count = statementStats[stName],
        meta = statementMeta[stName],
        type = count > 0 ? 'yes' : 'no',
        startCol = meta.start.column,
        endCol = meta.end.column + 1,
        startLine = meta.start.line,
        endLine = meta.end.line,
        openSpan = lt + 'span class="' + (meta.skip ? 'cstat-skip' : 'cstat-no') + '"' + title('statement not covered') + gt,
        closeSpan = lt + '/span' + gt,
        text;

    if (type === 'no') {
        if (endLine !== startLine) {
            endLine = startLine;
            endCol = structuredText[startLine].text.originalLength();
        }
        text = structuredText[startLine].text;
        text.wrap(startCol,
            openSpan,
            startLine === endLine ? endCol : text.originalLength(),
            closeSpan);
    }
  });
}

function customEscape(text) {
  text = text.toString();
  return text.replace(RE_AMP, '&amp;')
      .replace(RE_LT, '&lt;')
      .replace(RE_GT, '&gt;')
      .replace(RE_lt, '<')
      .replace(RE_gt, '>');
}

module.exports = Html;