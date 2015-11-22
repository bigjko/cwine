var React = require('react');
var ReactDOM = require('react-dom');
var loader = require('./loader.js');
var editor = require('./editor-react.js');

let project = {};
let currentlySelected = undefined;

import Sidebar from './sidebar.js';

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

const Editor = React.createClass({
	getInitialState: function() {
		return { nodes: [], currentlySelected: { node: 1, element: undefined } };
	},
	componentDidMount: function() {
		loader.load(function(data) {
			editor.init(data);
			this.setState({
				nodes: data.nodes,
				currentlySelected: { node: 3, element: undefined }
			});
		}.bind(this));
	},
	render: function() {
		//let currentnode = this.state.nodes[this.state.currentlySelected.node];
		//if ( this.state.currentlySelected.element !== undefined ) currentnode = currentnode.elements[this.state.currentlySelected.element];
		return (
			<Sidebar nodes={this.state.nodes} current={this.state.currentlySelected} />
		);
	}

});

init();

// main.js

// Render THE EDITOR!
