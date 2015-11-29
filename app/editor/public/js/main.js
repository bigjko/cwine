var React = require('react');
var ReactDOM = require('react-dom');

//const $ = require('jquery');

let project = {};
let currentlySelected = undefined;

import Editor from './cwine-react.js';

/*window.onload = function() {

		// Check for the various File API support.
	if (window.File && window.FileReader && window.FileList && window.Blob) {
	  // Great success! All the File APIs are supported.
	} else {
	  alert('The File APIs are not fully supported in this browser.');
	}
	loader.load(init);
};*/

function init() {
	//project = loaded;

	//editor.init(loaded);

	ReactDOM.render(
		<Editor />,
		document.querySelector('#sidebar')
	);
}

init();

// main.js

// Render THE EDITOR!
