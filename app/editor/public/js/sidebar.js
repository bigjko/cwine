// SIDEBAR REACT

const React = require('react');
const ReactDOM = require('react-dom');
const Tabs = require('react-simpletabs');
const Textarea = require('react-textarea-autosize');

const Sidebar = React.createClass({
	render: function() {
		let sel = this.props.current;
		let panel = <ProjectProperties config={this.props.config} onchange={this.props.onchange} />;
		console.log(sel);
		if (this.props.nodes.length > 0 && sel !== undefined && sel.node !== undefined) {
			if (sel.element !== undefined) {
				panel = <ElementProperties selected={sel} node={this.props.nodes[sel.node].elements[sel.element]} onchange={this.props.onchange} onremove={this.props.onremove} />;
			}
			else panel = <PanelProperties selected={sel} node={this.props.nodes[sel.node]} onchange={this.props.onchange} onselect={this.props.onselect} onremove={this.props.onremove} />;
		}

		return (
			<div>
				<File onsave={this.props.onsave} loadjson={this.props.loadjson} />
				<Tabs>
					<Tabs.Panel title="Properties">
						{panel}
					</Tabs.Panel>
					<Tabs.Panel title="Images">
						<ImagePanel onfiles={this.props.onfiles} images={this.props.images} />
					</Tabs.Panel>
				</Tabs>
			</div>
		);
	}
});

const ImagePanel = React.createClass({
	render: function() {
		return (
			<div>
				<input type="file" id="imagefiles" name="files[]" onChange={this.props.onfiles} multiple />
				<ImageList images={this.props.images}/>
			</div>
		);
	}
});

const ImageList = React.createClass({
	drag: function(ev) {
		console.log(ev.target.src);
		ev.dataTransfer.setData("text/plain", ev.target.src);
	},
	render: function() {
		let imagelist;
		if (this.props.images !== undefined) {
			imagelist = this.props.images.map(function(file, index) {
				return (
					<img key={index} src={file.image} title={file.file.name} width='50' draggable='true' onDragStart={this.drag} />
				);
			}.bind(this));
		}
		return (
			<div>
				{imagelist}
			</div>
		);
	}
});

const File = React.createClass({
	render: function() {
		return (
			<div id="file-panel" className="noselect">
				<button onClick={this.props.loadjson} className="button">Load Default JSON</button>
				<button onClick={this.props.onsave} className="button button-primary">Save</button>
				<button className="button button-disabled">Export to .zip</button>
			</div>
		);
	}
});

const PanelProperties = React.createClass({
	render: function() {
		let gotohtml;
		let elementList;
		if (this.props.node.elements !== undefined) {
			elementList = this.props.node.elements.map(function(element, index) {
				return (
					<li className="element-list-item" onClick={this.props.onselect} data-selection={JSON.stringify({node: this.props.selected.node, element:index})} key={index}>
						{element.text}
					</li>
				);
			}.bind(this));
		}
		if (this.props.node.goto !== undefined) gotohtml = (
			<div className="field labelside">
					<p>Goto:</p>
					<span>{ this.props.node.goto }</span>
			</div>);

		return (
			<div className="noselect">
				<h6><span className="node-type">Panel #{this.props.selected.node}</span> {this.props.node.name}</h6>
				<InputField name="Name" valueName="name" value={this.props.node.name} onchange={this.props.onchange} />
				<InputField name="Size" valueName="size" value={this.props.node.size} onchange={this.props.onchange} description="work in progress: value from 1 - 5" />
				<StaticField name="Image" value={this.props.node.image} />
				<div className="field labeltop">
					<p>Panel Elements:</p>
					<ul className="element-list">{elementList}</ul>
				</div>
				
				<button onClick={this.props.onremove} className="button delete-button">Delete Panel</button>

			</div>
		);
	}
});

const ElementProperties = React.createClass({
	render: function() {
		//let text = this.props.node.text.replace('\\n', '\n');
		return (
			<div>
				<h6><span className="node-type">Panel #{this.props.selected.node} - Panel Element #{this.props.selected.element}</span></h6>
				<div className="field labelside">
					<p>Text:</p>
					<Textarea minRow={1} name="text" value={ this.props.node.text } onChange={this.props.onchange} />
				</div>
				<StaticField name="Image" value={this.props.node.image} />
				<StaticField name="Position" value={'x:' + this.props.node.position.x.toFixed(2) + ', y:' + this.props.node.position.y.toFixed(2)} />

				<button onClick={this.props.onremove} className="button delete-button">Delete Element</button>
			</div>
		);
	}
});

const ProjectProperties = React.createClass({
	render: function() {
		return (
			<div>
				<h6><span className="node-type">Project</span> {this.props.config.name}</h6>
				<InputField name="Project Name:" valueName="name" value={this.props.config.name} onchange={this.props.onchange} />
				<InputField name="Start Node:" valueName="startnode" value={this.props.config.startnode} onchange={this.props.onchange} />
			</div>
		);
	}
});

const InputField = React.createClass({
	render: function() {
		let description;
		if (this.props.description !== undefined) description = (
				<span className="prop-description noselect">{this.props.description}</span>
			);
		return (
			<div className="field labelside">
				<p>{this.props.name}:</p>
				<input type="text" name={this.props.valueName} value={ this.props.value } onChange={this.props.onchange} />
				{description}
			</div>
		);
	}
});

const StaticField = React.createClass({
	render: function() {
		return (
			<div className="field labelside">
					<p>{this.props.name}:</p>
					<span className="static-value">{this.props.value}</span>
			</div>
		);
	}
});

export default Sidebar;