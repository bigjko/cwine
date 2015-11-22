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
				panel = <ElementProperties node={this.props.nodes[sel.node].elements[sel.element]} />;
			}
			else panel = <PanelProperties node={this.props.nodes[sel.node]} />;
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
			<div>
				<h4>Filebox!</h4>
			</div>
		);
	}
});

const PanelProperties = React.createClass({
	render: function() {
		return (
			<h4>
				{ this.props.node.name }
			</h4>
		);
	}
});

const ElementProperties = React.createClass({
	render: function() {
		return (
			<h4>
				{ this.props.node.text }
			</h4>
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