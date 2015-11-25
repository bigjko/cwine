// SIDEBAR REACT

const React = require('react');
const ReactDOM = require('react-dom');
const Tabs = require('react-simpletabs');

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
					<li className="element-list-item" onClick={this.props.onselect} data-selection={{node: this.props.selected.node, element:index}} key={index}>
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
				<div className="field labelside">
					<p>Name:</p>
					<input type="text" name="name" value={ this.props.node.name } onChange={this.props.onchange} />
				</div>
				<div className="field labelside">
					<p>Size:</p>
					<input type="text" name="size" value={ this.props.node.size } onChange={this.props.onchange} />
					<br /><span className="noselect"><em>work in progress: value from 1 - 5</em></span>
				</div>
				<div className="field labelside">
					<p>Image:</p>
					<span>{ this.props.node.image }</span>
				</div>
				<div className="field labeltop">
					<p>Panel Elements:</p>
					<ul className="element-list">{elementList}</ul>
				</div>
				<div className="field labelside">
					<button className="button delete-button">Delete Panel</button>
				</div>
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
					<textarea name="text" value={ this.props.node.text } onChange={this.props.onchange} />
				</div>
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

export default Sidebar;