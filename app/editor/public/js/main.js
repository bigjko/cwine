var loader = require('./loader.js');
var editor = require('./editor.js');

var gamepath = __dirname + '/app/game/';


document.addEventListener("keydown", function(e) {
  if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
    e.preventDefault();
    // Process event...
      saveJSON(editor.getNodes.toObject(), document.querySelector("#filepath").value);
  }
}, false);


window.onload = function() {

	document.querySelector("#load").onclick = function() {
		loadJSON(document.querySelector("#filepath").value, editor.init);
	};
	document.querySelector("#save").onclick = function() {
		saveJSON(editor.getNodes.toObject(), document.querySelector("#filepath").value);
	};
	//document.querySelector("#save");
	loadJSON(gamepath + "/js/panels.json", editor.init);
};