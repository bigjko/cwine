var React = require('react');
var ReactDOM = require('react-dom');
var loader = require('./loader.js');
var editor = require('./editor-react.js');
const update = require('react-addons-update');
const $ = require('jquery');

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
		return { nodes: [], currentlySelected: { node: 1 } };
	},
	handleCanvasSelection: function(selected) {
		this.setState({ currentlySelected: selected });
	},
	handleSidebarSelection: function(event) {
		let selection = event.target.getAttribute('data-selection');
		this.setState({ currentlySelected: selection});
	},
	handleChange: function(event) {
		let sel = this.state.currentlySelected;
		if (sel.node !== undefined) {
			if (sel.element !== undefined) {
				this.setState({
					nodes: update(this.state.nodes, {[sel.node]: {elements: {[sel.element]: {[event.target.name]: {$set: event.target.value}}}}})
				});
			}
			else {
				this.setState({
					nodes: update(this.state.nodes, {[sel.node]: {[event.target.name]: {$set: event.target.value}}})
				});
			}
		}
		console.log("Change!");
		// maybe use $.extend(node, change) here
	},
	componentDidMount: function() {
		loader.load(function(data) {
			editor.init(data, this.handleCanvasSelection, this.handleChange);
			this.setState({
				nodes: data.nodes,
				currentlySelected: { node: 3 }
			});
		}.bind(this));
	},
	render: function() {
		//let currentnode = this.state.nodes[this.state.currentlySelected.node];
		//if ( this.state.currentlySelected.element !== undefined ) currentnode = currentnode.elements[this.state.currentlySelected.element];
		return (
			<Sidebar nodes={this.state.nodes} current={this.state.currentlySelected} onchange={this.handleChange} onselect={this.handleSidebarSelection} />
		);
	}

});

init();

// main.js

// Render THE EDITOR!
