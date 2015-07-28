var fs = require('fs')
  , InsertionText = require('../insertion-text')
  , debug = require('../../../utils').debug
  , TreeSummarizer = require('../tree-summarizer')
  , Html = require('../rcover_reporters/html')
  , path = require('path')
  , utils = require('../object-utils')
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
  options.testsByFilename = options.testsByFilename || {};

  // Logger
  var logger = debug('Html');

  // Templates
  var fileTemplate;
  // Details templates
  var detailTemplate;
  var detailsComparativeTemplate;
  var detailsExplorerTemplate;
  // Summary Templates
  var summaryTemplate;
  var summaryComparativeTemplate;
  var summaryExplorerTemplate;
  
  // Javascript functions
  var functionsJs;
  var functionsJsComparative;
  var functionsJsExplorer;

  // Remove existing directories
  if(!options.noDelete) {
    rimraf.sync(options.outputDirectory);
  }

  // Perform any setup tasks
  var setup = function() {
    mkdirp.sync(options.outputDirectory + "/html", 0777);
    mkdirp.sync(options.outputDirectory + "/json", 0777);
    // Report subdirectory
    if(options.reportSubDirectory != null) {
      mkdirp.sync(options.outputDirectory + "/html/" + options.reportSubDirectory, 0777);
    }

    // Read in the templates
    var file = fs.readFileSync(__dirname + "/templates/file_html.txt", 'utf8');

    // Compile the templates
    fileTemplate = handlebars.compile(file, {noEscape: true});    
    
    // Summary template
    summaryTemplate = handlebars
      .compile(fs.readFileSync(__dirname + "/templates/summary.txt", 'utf8'), {noEscape: true});    

    // Summary template
    summaryComparativeTemplate = handlebars
      .compile(fs.readFileSync(__dirname + "/templates/summary_comparative.txt", 'utf8'), {noEscape: true});    

    // Summary explorer template
    summaryExplorerTemplate = handlebars
      .compile(fs.readFileSync(__dirname + "/templates/summary_explorer.txt", 'utf8'), {noEscape: true});    

    // details template
    detailsTemplate = handlebars
      .compile(fs.readFileSync(__dirname + "/templates/details.txt", 'utf8'), {noEscape: true});    

    // details template
    detailsComparativeTemplate = handlebars
      .compile(fs.readFileSync(__dirname + "/templates/details_comparative.txt", 'utf8'), {noEscape: true});    

    detailsExplorerTemplate = handlebars
      .compile(fs.readFileSync(__dirname + "/templates/details_explorer.txt", 'utf8'), {noEscape: true});    

    // Read in the javascript
    functionsJs = fs.readFileSync(__dirname + "/js/functions.js", 'utf8');
    functionsJsComparative = fs.readFileSync(__dirname + "/js/functions_comparative.js", 'utf8');
    functionsJsExplorer = fs.readFileSync(__dirname + "/js/functions_explorer.js", 'utf8');
  }

  this.generate = function(coverage, callback) {
    logger(options.logLevel, 'info', f("Generate HTML Files"));
    // Setup basic structure
    setup();

    // Contain all the processed data
    var processedData = {};
    var keys = Object.keys(coverage);

    // Walk each file 
    for(var name in coverage) {
      logger(options.logLevel, 'info', f("Process Coverage for %s", name));
      // Write the data out
      processFile(name, coverage[name]);
    }

    // // Render comparative view for RCover
    // renderComparativeView(processedData);

    // Render the explorer view for RCover
    renderExplorerView(keys, processedData, callback);
    // Finished up
    callback();
  }

  // var compressCoverage = function(coverage) {
  var compressCoverage = function(testCoverage) {
    compressedCoverage = {s: []};
    var cStructured = compressedCoverage.s;

    // Iterate over all the coverage
    for(var i = 0; i < testCoverage.structured.length; i++) {
      var structured = testCoverage.structured[i];
      if(structured.covered == 'yes') {
        var cStruct = [
            structured.line
          , structured.covered == 'yes' ? 0 : (structured.coverage == 'neutral' ? 1 : 2)
          , structured.text.consumeBlanks ? 1 : 0
          , structured.text.startPos
          , structured.text.endPos
          , structured.text.origLength
        ]

        if(structured.text.offsets.length > 0) {
          var offsets = [];

          for(var j = 0; j < structured.text.offsets.length; j++) {
            offsets.push(structured.text.offsets[j].pos)
            offsets.push(structured.text.offsets[j].len)
          }

          // cStruct.t.o = offsets;
          cStruct.push(offsets)
        }

        cStructured.push(cStruct)
      }
    }

    // Return the compressed coverage
    return compressedCoverage;
  }

  var renderExplorerView = function(keys, coverage, callback) {
    // Set up data
    var entity = "Explorer";
    var reportClass = entity;
    var testNames = {};

    // Coverage
    var finalCoverage = {tests: testNames
      , coverage: {}
      , source: {}
      , testsByFilename: options.testsByFilename};
    // Read in all the files and append to end
    var outputFileJSONDirectory = f("%s/json", options.outputDirectory);
    // Read the directory
    var files = fs.readdirSync(outputFileJSONDirectory).filter(function(item) {
      return item.indexOf("_coverage.json") != -1;
    });

    // Read each file in turn and create the final entry
    files.forEach(function(file) {
      var correctFile = file.replace("_coverage.json", ".js");

      // Read the content and parse
      var data = JSON.parse(fs.readFileSync(f("%s/%s", outputFileJSONDirectory, file)));
      
      // Locate the actual original key file
      keys.forEach(function(key) {
        // Read the source
        finalCoverage.source[key] = fs.readFileSync(key, 'utf8').split("\n");

        // Found matching file
        if(key.indexOf(correctFile) != -1) {
          // finalCoverage.coverage[key] = data;
          for(var testname in data) {
            testNames[testname] = testname;
            if(finalCoverage.coverage[testname] ==  null) finalCoverage.coverage[testname] = {};
            finalCoverage.coverage[testname][key] = data[testname];
          }
        }
      })
    });

    // Get the base name of the file
    var outputFile = f("%s/html/explorer.html", options.outputDirectory);

    // Render the summary
    var summary = summaryExplorerTemplate({
      tests: Object.keys(testNames)
    });

    // Render the details template
    var details = detailsExplorerTemplate({});

    // Stringify the data
    var jsonData = JSON.stringify(finalCoverage);

    // Generate the result document
    var html = fileTemplate({
        entity: entity
      , reportClass: reportClass
      , details: details
      , summary: summary
      , data: jsonData
      , js: functionsJsExplorer
    });

    logger(options.logLevel, 'info', f("Write RCoverage Explorer to %s", outputFile));
    // Just test dump the raw source there
    fs.writeFileSync(outputFile, html, 'utf8');  
    // Finish the processing
    callback();  
  }

  var renderComparativeView = function(coverage) {
    // Set up data
    var entity = "Comparative";
    var reportClass = entity;
    // var jsonData = JSON.stringify(coverage, null, 2);
    var jsonData = JSON.stringify(coverage, function(key, value) {
      if(key == 'fileCoverage') return undefined;
      return value;
    });

    // Get the base name of the file
    var outputFile = f("%s/html/comparative.html", options.outputDirectory);
    var testNames = {};

    for(var name in coverage) {
      for(var _name in coverage[name]) {
        testNames[_name] = _name;
      }
    }

    // Render the summary
    var summary = summaryComparativeTemplate({
      tests: Object.keys(testNames)
    });

    var details = detailsComparativeTemplate({});

    // Generate the result document
    var html = fileTemplate({
        entity: entity
      , reportClass: reportClass
      , details: details
      , summary: summary
      , data: jsonData
      , js: functionsJsComparative
    })

    logger(options.logLevel, 'info', f("Write RCoverage Comparative to %s", outputFile));
    // Just test dump the raw source there
    fs.writeFileSync(outputFile, html, 'utf8');
  }

  var processFile = function(filename, coverage) {
    // Read the source file
    source = fs.readFileSync(filename, 'utf8');
    // Split source into lines
    sourceLines = source.split(/\n/);    
    // Get the base name of the file
    var outputFileHtml = f("%s/html/%s", options.outputDirectory, path.basename(filename).replace(".js", ".html"));
    var outputFileJSON = f("%s/json/%s", options.outputDirectory, path.basename(filename).replace(".js", "_coverage.json"));

    // Final data structure
    var finalDataStructure = {};

    // Iterate over all tests that cover this file
    coverage.forEach((function(testCoverage) {
      var test = testCoverage.test;
      var file = testCoverage.file;
      var data = testCoverage.data[filename];

      // Create an instance of the Tree Summarizer
      var summarizer = new TreeSummarizer();
      // Add content to summarizer
      summarizer.addFileCoverageSummary(filename, utils.summarizeFileCoverage(data));
      // Get the tree summary
      var tree = summarizer.getTreeSummary();
      // Generate Data structure
      finalDataStructure[test] = compressCoverage(process(tree.root, data));
    }));

    logger(options.logLevel, 'info', f("Write JSON RCoverage to %s", outputFileJSON));
    // Turn into JSON
    var jsonData = JSON.stringify(finalDataStructure);
    // Flush data to disk
    fs.writeFileSync(outputFileJSON, jsonData, 'utf8');


    // // Create a raw json structure
    // // var jsonData = JSON.stringify(finalDataStructure, null, 2);
    // var jsonData = JSON.stringify(finalDataStructure, function(key, value) {
    //   if(key == 'fileCoverage') return undefined;
    //   return value;
    // });

    // Template variables
    var entity = filename;
    var reportClass = filename;
    var details = detailsTemplate({
      sourceLines: sourceLines
    });
    
    var summary = summaryTemplate({
      tests: Object.keys(finalDataStructure)
    });

    // Generate the result document
    var html = fileTemplate({
        entity: entity
      , reportClass: reportClass
      , details: details
      , summary: summary
      , data: jsonData
      , js: functionsJs
    })

    logger(options.logLevel, 'info', f("Write HTML RCoverage to %s", outputFileHtml));
    // Just test dump the raw source there
    fs.writeFileSync(outputFileHtml, html, 'utf8');
    // Return the final structure
    return finalDataStructure;
  }

  var process = function(node, coverage) {
    return walkNode(node, coverage);
  }

  var walkNode = function(node, coverage) {
    for(var i = 0; i < node.children.length; i++) {
      var child = node.children[i];

      if(child.kind == 'dir') {
        return walkNode(child, coverage);
      } else {
        return processCoverage(child, coverage);
      }
    }
  }

  var processCoverage = function(node, fileCoverage) {
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
    }

    return context;
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