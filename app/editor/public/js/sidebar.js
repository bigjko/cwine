// SIDEBAR REACT

const React = require('react');
const ReactDOM = require('react-dom');
const Tabs = require('react-simpletabs');
const Textarea = require('react-textarea-autosize');
import {ModalContainer, ModalDialog} from 'react-modal-dialog';

const Sidebar = React.createClass({
	render: function() {
		let sel = this.props.current;
		let panel = <ProjectProperties config={this.props.config} onchange={this.props.onchange} />;
		//console.log(sel);
		if (this.props.nodes.length > 0 && sel !== undefined && sel.node !== undefined) {
			if (sel.element !== undefined) {
				panel = <ElementProperties selected={sel} node={this.props.nodes[sel.node].elements[sel.element]} onchange={this.props.onchange} onremove={this.props.onremove} />;
			}
			else panel = <PanelProperties selected={sel} node={this.props.nodes[sel.node]} onchange={this.props.onchange} onselect={this.props.onselect} onremove={this.props.onremove} />;
		}

		return (
			<div>
				<ModalButton className="button button-primary" action={this.props.onsave} header="Saved!" text="Project has been saved locally.">Save</ModalButton>
				<LoadModal header="Load" onloading={this.props.onloading} />
				<button onClick={this.props.onexport} className="button">Export to .zip</button>
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

const LoadModal = React.createClass({
	getInitialState: function() {
		return {isShowingModal:false};
	},
	handleOpen: function(evt) {
		//this.props.action(evt);
		this.setState({isShowingModal: true});
		console.log("show dialog!");
	},
	handleClose: function() { 
		this.setState({isShowingModal: false});
	},
	handleClick: function() {
		this.fileInput.click();
	},
	render: function() {
		return (
			<button onClick={this.handleOpen} className="button">
				<span>Load</span>
				{this.state.isShowingModal &&
				<ModalContainer onClose={this.handleClose}>
					<ModalDialog onClose={this.handleClose}>
						<h1>{this.props.header}</h1>
						<button onClick={this.props.onloading} className="button" name="demo">Load Demo Comic</button>
						<input style={{display:'none'}} type="file" name="fromfile" accept=".json" onChange={this.props.onloading} ref={(ref) => this.fileInput = ref} />
						<br /><button onClick={this.handleClick} className="button">Load From File</button>
					</ModalDialog>
				</ModalContainer>}
			</button>
		);
	}
});

/// IMAGE PANEL

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
		//console.log(ev.target.src);
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

/// PROPERTY PANELS

const PanelProperties = React.createClass({
	render: function() {
		let gotohtml;
		let elementList;
		if (this.props.node.elements !== undefined) {
			elementList = this.props.node.elements.map(function(element, index) {
				if (element !== null) {
					return (
						<li className="element-list-item" onClick={this.props.onselect} data-selection={JSON.stringify({node: this.props.selected.node, element:index})} key={index}>
							{element.text}
						</li>
					);
				}
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
				<InputField label="side" name="Name" valueName="name" value={this.props.node.name} onchange={this.props.onchange} />
				<InputField label="side" name="Size" valueName="size" value={this.props.node.size} onchange={this.props.onchange} description="work in progress: value from 1 - 4" />
				<StaticField label="top" name="Image" value={this.props.node.image} />
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
				<StaticField label="top" name="Image" value={this.props.node.image} />
				<FieldLabel label="side" name="">
					<Field title="Width" name="width" after="%" value={this.props.node.width} onChange={this.props.onchange} />
					<Field title="Height" name="height" after="%" value={this.props.node.height} onChange={this.props.onchange} />
				</FieldLabel>
				<CheckMark label="after" title="Keep original aspect" name="keepAspect" checked={this.props.node.keepAspect} onChange={this.props.onchange} />

				<StaticField label="side" name="Position" value={'x:' + this.props.node.position.x.toFixed(2) + ', y:' + this.props.node.position.y.toFixed(2)} />

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
				<InputField label="top" name="Project Name" valueName="name" value={this.props.config.name} onchange={this.props.onchange} />
				<FieldLabel label="side" name="Start Node"><Field name="startnode" value={this.props.config.startnode} onChange={this.props.onchange} /></FieldLabel>
				<FieldLabel label="side" name="Comic Width"><Field after="%" name="comic_width" value={this.props.config.comic_width} onChange={this.props.onchange} /></FieldLabel>
				<FieldLabel label="side" name="Max Width"><Field after="px" name="comic_maxwidth" value={this.props.config.comic_maxwidth} onChange={this.props.onchange} /></FieldLabel>
				
				<div className="field">
					<label htmlFor='font'>Font</label>
					<select id='font' name='comic_font' value={this.props.config.comic_font} onChange={this.props.onchange}>
						<option value='KomikaHand'>KomikaHand</option>
						<option value='Open Sans'>Open Sans</option>
					</select>
				</div>

				<FieldLabel label="side" name="Font Size"><Field after="px" name="comic_fontsize" value={this.props.config.comic_fontsize} onChange={this.props.onchange} /></FieldLabel>
				<FieldLabel label="side" name="Line Height"><Field after="em" name="comic_lineheight" value={this.props.config.comic_lineheight} onChange={this.props.onchange} /></FieldLabel>


			</div>
		);
	}
});

/// PROPERTY COMPONENTS

const Field = React.createClass({
	render: function() {
		let after;
		let title;
		if (this.props.after != undefined) {
			after = <span>{this.props.after}</span>;
		}
		if (this.props.title !== undefined) {
			title = <span>{this.props.title}:</span>;
		}
		return (
			<div className="small-field">
				{title}
				<input className="small-input" type="text" name={this.props.name} value={ this.props.value } onChange={this.props.onChange} />
				{after}
			</div>
		);
	}
});

const FieldLabel = React.createClass({
	render: function() {
		let name = '';
		if (this.props.name !== '') name = this.props.name + ':';
		let fieldclass = 'field label' + this.props.label + ' multi-field';
		return (
			<div className={fieldclass}>
				<p>{name}</p>
				{this.props.children}
			</div>
		);
	}
});

const CheckMark = React.createClass({
	render: function() {
		let fieldclass = 'field label' + this.props.label;
		return (
			<div className={fieldclass}>
				<input type="checkbox" name={this.props.name} checked={ this.props.checked } onChange={this.props.onChange} />
				<p>{this.props.title}</p>
			</div>
		);
	}
});

const InputField = React.createClass({
	render: function() {
		let description;
		let fieldclass = 'field label' + this.props.label;
		if (this.props.description !== undefined) description = (
				<span className="prop-description">{this.props.description}</span>
			);
		return (
			<div className={fieldclass}>
				<p>{this.props.name}:</p>
				<input type="text" name={this.props.valueName} value={ this.props.value } onChange={this.props.onchange} />
				{description}
			</div>
		);
	}
});

const StaticField = React.createClass({
	render: function() {
		let fieldclass = 'field label' + this.props.label;
		return (
			<div className={fieldclass}>
					<p>{this.props.name}:</p>
					<span className="static-value">{this.props.value}</span>
			</div>
		);
	}
});

const ModalButton = React.createClass({
  getInitialState: function() {
    return {isShowingModal: false};
  },
  handleClick: function(evt) {
  	this.props.action(evt);
  	this.setState({isShowingModal: true});
  	console.log("show dialog!");
  },
  handleClose: function() { 
  	this.setState({isShowingModal: false});
  },
  render: function() {
    return (
      <button onClick={this.handleClick} className={this.props.className}>
                <span>{this.props.children}</span>

        {this.state.isShowingModal ?
          <ModalContainer onClose={this.handleClose}>
            <ModalDialog onClose={this.handleClose}>
            <h1>{this.props.header}</h1>
            <p>{this.props.text}</p>
            </ModalDialog>
          </ModalContainer>
        : null}
      </button>
    );
  }
});

export default Sidebar;