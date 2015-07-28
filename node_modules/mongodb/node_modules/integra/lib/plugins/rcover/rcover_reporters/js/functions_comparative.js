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

// Add handlers to the select and the heat button
document.getElementById("test1").onchange = onChangeEventHandler("left")
document.getElementById("test2").onchange = onChangeEventHandler("right")

// Render all the coverage
var applyCoverage = function(renderTo, testName) {
  var renderTd = document.getElementById(renderTo);
  var renderHtml = [];
  var regex = /(<([^>]+)>)/ig;

  for(var fileName in data) {
    // Get the coverage for this file for a specific test
    var coverage = data[fileName][testName];
    // Get any covered lines
    var lines = [];
    // Iterate over all the structures
    for(var i = 0; i < coverage.structured.length; i++) {
      var structure = coverage.structured[i];

      if(structure.covered == "yes") {
        lines.push(structure);
      }
    }

    if(lines.length > 0) {
      var filename = fileName.split("/");     
      renderHtml.push("<h3>" + filename.pop() + "</h3>");
      renderHtml.push("<table width='100%'>");

      // Render the lines
      for(var i = 0; i < lines.length; i++) {
        var line = lines[i].text.text;
        renderHtml.push("<tr>");
        renderHtml.push("<td>");
        renderHtml.push(lines[i].line);       
        renderHtml.push("</td>");
        renderHtml.push("<td width='100%'>");
        renderHtml.push("<textarea cols='80' rows='1' width='100%'>")
        renderHtml.push(customEscape(line).replace(regex, ""));
        renderHtml.push("</textarea>")        
        renderHtml.push("</td>");
        renderHtml.push("</tr>");
      }
  
      renderHtml.push("</table>");
    }
  }

  // Set the inner html
  renderTd.innerHTML = renderHtml.join("");
}

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