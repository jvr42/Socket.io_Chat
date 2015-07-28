// var colors = ["#FFFAFA", "#F4C2C2", "#FF5C5C", "#FF0000", "#CE1620", "#A40000", "#800000"];
var colors = ["#F4C2C2", "#FF5C5C", "#FF0000", "#CE1620", "#A00000", "#CE1620"];

// Add handlers to the select and the heat button
document.getElementById("test").onchange = function() {
	var value = this.options[this.selectedIndex].value;

	// User picked a an existing test, show coverage
	// from the view of that test
	if(value != "") {
		applyCoverage(data[value]);
	}
}

// Show heat map of over coverage
document.getElementById("heat").onclick = function() {
	renderCoverageHeat(data);
}

/**
 * Render a coverage view of the source
 */
var applyCoverage = function(coverage) {
	for(var i = 0; i < coverage.s.length; i++) {
		var structure = coverage.s[i];
		var sourceLineRow = document.getElementById("" + structure[0] - 1);
		var coverageCountCell = document.getElementById("" + structure[0] - 1 + "-coverage-count");
		// Default no coverage shown
		var color = "white";
		var coverageCount = '';

		// console.log(structure)

		if(structure) {
			coverageCount = 1;
			color = "lightgreen";			
		}

		coverageCountCell.innerHTML = coverageCount;
		sourceLineRow.style.backgroundColor = color;
	}
}

/**
 * Render the coverage heat
 */
var renderCoverageHeat = function(data) {
	// sum up the heat for each line
	var lines = [];
	var maxValue = 0;

	// Iterate over all the data
	for(var name in data) {
		var coverage = data[name];
		// Iterate over all the structures
		for(var i = 0; i < coverage.s.length; i++) {
			var structure = coverage.s[i];
			lines[structure[0] - 1] = typeof lines[structure[0] - 1] == 'number' ? lines[structure[0] - 1] + 1 : 1;
			if(lines[structure[0] - 1] > maxValue) maxValue = lines[structure[0] - 1];
		}
	}

	// Calculate heat step size
	var stepSize = maxValue / colors.length;
	// console.log(stepSize)

	// Render all covered lines
	for(var i = 0; i < lines.length; i++) {
		var sourceLineRow = document.getElementById("" + i);
		var coverageCountCell = document.getElementById("" + i + "-coverage-count");
		var color = "lightgreen";
		var coverageCount = '';

		if(lines[i] > 0) {
			coverageCount = lines[i];
			var colorIndex = Math.round(lines[i] / stepSize) - 1;
			colorIndex = colorIndex < 0 ? 0 : colorIndex;
			// console.log(colorIndex)
			sourceLineRow.style.backgroundColor = colors[colorIndex];
			if(colorIndex >= (colors.length / 2)) {
				sourceLineRow.style.color = "white"				
			}
		}

		coverageCountCell.innerHTML = coverageCount;		
	}
}