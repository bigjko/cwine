// SIDEBAR REACT

const React = require('react');
const ReactDOM = require('react-dom');
const Tabs = require('react-simpletabs');
const Textarea = require('react-textarea-autosize');

const Sidebar = React.createClass({
	render: function() {
		let sel = this.props.current;
		let panel = <ProjectProperties />;
		console.log(sel);
		if (this.props.nodes.length > 0 && sel !== undefined && sel.node !== undefined) {
			if (sel.element !== undefined) {
				panel = <ElementProperties node={this.props.nodes[sel.node].elements[sel.element]} onchange={this.props.onchange} />;
			}
			else panel = <PanelProperties selected={sel} node={this.props.nodes[sel.node]} onchange={this.props.onchange} onselect={this.props.onselect} />;
		}

		return (
			<div>
				<File />
				<Tabs>
					<Tabs.Panel title="Properties">
						{panel}
					</Tabs.Panel>
					<Tabs.Panel title="Images">
						<h2>Images!</h2>
					</Tabs.Panel>
				</Tabs>
			</div>
		);
	}
});

const File = React.createClass({
	render: function() {
		return (
			<div id="file-panel" className="noselect">
				<button className="button">Load Default JSON</button>
				<button className="button button-primary">Save</button>
				<button className="button">Export to .zip</button>
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
				
				<button className="button delete-button">Delete Panel</button>

			</div>
		);
	}
});

const ElementProperties = React.createClass({
	render: function() {
		//let text = this.props.node.text.replace('\\n', '\n');
		return (
			<div>
				<div className="field labelside">
					<p>Text:</p>
					<Textarea minRow={1} name="text" value={ this.props.node.text } onChange={this.props.onchange} />
				</div>
				<StaticField name="Image" value={this.props.node.image} />
			</div>
		);
	}
});

const ProjectProperties = React.createClass({
	render: function() {
		return (
			<h4>
				Project
			</h4>
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
					<span>{this.props.value}</span>
			</div>
		);
	}
});

export default Sidebar;