var React = require('react');
var ReactDOM = require('react-dom');
var loader = require('./loader.js');
const exporter = require('./exporter.js');
var editor = require('./editor.js');
var menuData = require('./contextmenuData.js');
const update = require('react-addons-update');
import Sidebar from './sidebar.js';
import Menu from './menu.js';

const Editor = React.createClass({
	getInitialState: function() {
		return { nodes: [], 
				 currentlySelected: { node: 1 }, 
				 config: {},
				 contextMenu: {show:false, x:0, y:0} };
	},
	handleCanvasSelection: function(selected) {
		this.setState({ currentlySelected: selected });
	},
	handleSidebarSelection: function(event) {
		let selection = JSON.parse(event.target.getAttribute('data-selection'));
		this.setState({ currentlySelected: selection});
	},
	handleChange: function(event) {
		let sel = this.state.currentlySelected;
		let property = event.target.name;
		let value = event.target.value;
		if (event.target.type == 'checkbox') {
			value = event.target.checked;
		}
		//console.log("Change",property,"to",value);
		//editor.updateNode(sel, {[event.target.name]: event.target.value});
		if (sel.node !== undefined) {
			editor.updateNode(sel, {[property]: value});
			if (sel.element !== undefined) {
				if (this.state.nodes[sel.node].elements[sel.element].keepAspect && (property == 'width' || property == 'height')) {
					let size = editor.getImageSize({node:sel.node, element:sel.element});
					let panelsize = editor.getImageSize({node:sel.node});
					let ratio;
					let prop2;
					if (property == 'width') {
						ratio = (size.height / size.width) * (panelsize.width / panelsize.height);
						prop2 = "height";
					} else {
						ratio = (size.width / size.height) * (panelsize.height / panelsize.width);
						prop2 = "width";
					}
					editor.updateNode(sel, {[prop2]: (value*ratio).toFixed(2)});
					//console.log('Change', prop2, 'to', value*ratio);
					this.setState({
						nodes: update(this.state.nodes,
						    {
						        [sel.node]: {
						            elements: {
						                [sel.element]: {
						                    [prop2]: {$set: (value*ratio).toFixed(2)},
						                    [property]: {$set: value}
						                }
						            }
						        }
						    }
						)
					});
				} else
				this.setState({
					nodes: update(this.state.nodes, {[sel.node]: {elements: {[sel.element]: {[property]: {$set: value}}}}})
				});
			}
			else {
				this.setState({
					nodes: update(this.state.nodes, {[sel.node]: {[property]: {$set: value}}})
				});
			}
		} else {
			this.setState({
				config: update(this.state.config, {[property]: {$set: value}})
			}, function() {
				editor.updateConfig(this.state.config);
				editor.updateAll();
			});
		
		}
		//this.forceUpdate();
		// maybe use $.extend(node, change) here
	},
	handleCanvasChange: function(sel, values) {
		//console.log("Canvas Change!");
		for (let property in values) {
			if (sel.node !== undefined && sel.node !== null) {
				if (sel.element !== undefined && sel.element !== null) {
					this.setState({
						nodes: update(this.state.nodes, {[sel.node]: {elements: {[sel.element]: {[property]: {$set: values[property]}}}}})
					});
				}
				else {
					this.setState({
						nodes: update(this.state.nodes, {[sel.node]: {[property]: {$set: values[property]}}})
					});
				}
			}	
		}
	},
	handleFiles: function (evt) {
		console.log("handling files");
	    let files = [];
	    for (let i=0, f; f = evt.target.files[i]; i++) {
	    	if (!f.type.match('image.*')) {
		    	continue;
		    }

		    console.log("Image!");

		    var reader = new FileReader();

		    reader.onload = (function(ed, array, theFile) {
		    		//debugger;
		    		return function(e) {
			    		array.push({file:theFile, image:e.target.result, path: window.URL.createObjectURL(theFile)});
			        	ed.setState({localImages: files});
			        	console.log(array);
		        	};
		    }(this, files, f));

		    reader.readAsDataURL(f);
	    }
	},
	removeNode: function (ev) {
		let sel = this.state.currentlySelected;
		if (sel.node !== undefined) {
			let data = editor.removeNode(sel);
			if (sel.element !== undefined) {
				this.setState({
					nodes: update(this.state.nodes,
						{ [sel.node] : { elements: { [sel.element]: { $set: null }}}}
					),
					currentlySelected: {}
				});
			} else {
				this.setState({
					nodes: update(this.state.nodes,
						{ [sel.node] : { $set: null }}
					),
					currentlySelected: {}
				});
			}
		}
		
		//this.setState({nodes: data.nodes});
	},
	addNode: function (sel, data) {
		// Add node
		if (sel.type == 'node') {
			this.setState({
				nodes: update(this.state.nodes,
					{ $push: [data] }
				)
			});
		} else if (sel.type == 'element') {
			if (this.state.nodes[sel.node].elements !== undefined) {
				this.setState({
					nodes: update(this.state.nodes,
						{ [sel.node]: { elements: { $push: [data] } }}
					)
				});
			} else {
				this.setState({
					nodes: update(this.state.nodes,
						{ [sel.node]: { elements: { $set: [data] } }}
					)
				});
			}

			
		}

	},
	handleLoad: function (evt) {
		if (evt.target.name == "demo") {
			loader.loadJSON('js/panels.json', function (data) {
				this.setState({nodes: data.nodes, config: data.config, currentlySelected: undefined});
				editor.init(data, this.handleCanvasSelection, this.handleCanvasChange, this.addNode);
			}.bind(this));
		}
		else if (evt.target.name == "fromfile") {
			let file = evt.target.files[0];
			//console.log(evt.target.files[0]);
			let reader = new FileReader();
			reader.onload = (function(th) {
				return function(e) {
					let json = JSON.parse(e.target.result);
					th.setState({ nodes:json.nodes, config:json.config, currentlySelected:undefined });
					editor.init(json, th.handleCanvasSelection, th.handleCanvasChange, th.addNode);
				};
			}(this));
			reader.readAsText(file);
		}
		else {

		}
	},
	handleSave: function (evt) {
		loader.save({ config: this.state.config, nodes: this.state.nodes, images: this.state.localImages });
		console.log("save");
	},
	handleExport: function (evt) {
		if (evt.target.name == 'json') {
			exporter.exportToJSON({config: this.state.config, nodes: this.state.nodes});
		} else if (evt.target.name == 'zip') {
			exporter.exportToZip({config: this.state.config, nodes: this.state.nodes});
		}

	},
	handleMenu: function (cmd, pos) {
		switch(cmd.name) {
			case 'addnode':
				console.log(cmd.name, cmd.type);
				editor.newNode(pos.x, pos.y, cmd.type);
			break;
		}
	},
	componentDidMount: function() {
		loader.load(function(data) {
			if (data !== null) 
			{	
				editor.init(data, this.handleCanvasSelection, this.handleCanvasChange, this.addNode);
				this.setState({
					config: data.config,
					nodes: data.nodes,
					currentlySelected: {},
					localImages: data.images
				});
			}
			//if (this.state.localImages !== undefined) this.reloadImages();
		}.bind(this));
		let canv = document.querySelector('#edit_canvas');
		canv.oncontextmenu = function(e) {
			e.preventDefault();
			
			// find x and y of mouse

			this.setState({contextMenu:{show:true, x:e.clientX , y:e.clientY}});
			
			return false;
		}.bind(this);
		canv.onclick = function(e) {
			this.setState({contextMenu:{show:false, x:0 , y:0}});
		}.bind(this);
	},
	render: function() {
		//let currentnode = this.state.nodes[this.state.currentlySelected.node];
		//if ( this.state.currentlySelected.element !== undefined ) currentnode = currentnode.elements[this.state.currentlySelected.element];
		return (
			<div>
				{this.state.contextMenu.show ? 
					<Menu menuData={menuData} handleMenu={this.handleMenu} position={{x:this.state.contextMenu.x, y:this.state.contextMenu.y}} />
				: null }
				<Sidebar 
					nodes={this.state.nodes}
					config={this.state.config}
					images={this.state.localImages}
					current={this.state.currentlySelected}
					onchange={this.handleChange}
					onselect={this.handleSidebarSelection}
					onfiles={this.handleFiles}
					onsave={this.handleSave}
					onloading={this.handleLoad}
					onremove={this.removeNode}
					onexport={this.handleExport} />
				
			</div>
		);
	}

});

export default Editor;