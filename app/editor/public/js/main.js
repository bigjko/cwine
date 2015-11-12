/* @jsx React.DOM */

//var loader = require('./loader.js');
//var editor = require('./editor.js');

/*window.onload = function() {

		// Check for the various File API support.
	if (window.File && window.FileReader && window.FileList && window.Blob) {
	  // Great success! All the File APIs are supported.
	} else {
	  alert('The File APIs are not fully supported in this browser.');
	}
	//document.querySelector("#save");
	document.querySelector("#loadjson").onclick = function() {
		loader.loadJSON(document.querySelector("#filepath").value, editor.init);
	};
	document.querySelector("#load").onclick = function() {
		loader.load(editor.init);
	};
	loader.load(editor.init);
};*/

// main.js
var React = require('react');
var ReactDOM = require('react-dom');

ReactDOM.render(
  <h1>Hello, world!</h1>,
  document.getElementById('view')
);