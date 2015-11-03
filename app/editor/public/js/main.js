var loader = require('./loader.js');
var editor = require('./editor.js');

//var gamepath = __dirname + '/app/game/';

window.onload = function() {
	//document.querySelector("#save");
	document.querySelector("#loadjson").onclick = function() {
		loader.loadJSON(document.querySelector("#filepath").value, editor.init);
	};
	document.querySelector("#load").onclick = function() {
		loader.load(editor.init);
	};
	loader.loadJSON("js/panels.json", editor.init);
};