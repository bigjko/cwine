import Node from '../lib/canvas/Node';
import Panel from '../lib/canvas/Panel';

//var classes = require('./classes.js');
var loader = require("./loader.js");
var $ = require('jquery');

var panels;
var config;
let createjs = window.createjs;
var stage;
var viewContainer;
var nodeContainer;
//var firstLoad = true;
var viewScale = 1;
var dragoffset = {x:0, y:0};
//var dragBox;
var zoomNumber = 3;
var zoomStep = [0.2, 0.3, 0.5, 0.75, 1, 1.5, 2];
var dragging_element;

var defaultGamePath = "";
var con_r = 6;
var currentlySelected;
var currentLocalImages;

let handleSelection;
let handleChange;
let addNode;

exports.init = function(obj, onselect, onchange, addnode) {

	handleSelection = onselect;
	handleChange = onchange;
	addNode = addnode;

    panels = obj.nodes;
    config = obj.config;
    
	if (stage === undefined) {
		stage = new createjs.Stage("edit_canvas");
		createjs.Ticker.setFPS(60);
		createjs.Ticker.addEventListener("tick", stage);
	}
	else {
		stage.removeAllChildren();
		/*var bubbles = $(".bubble");
		var view = $("#view");
		for (var b=0; b < bubbles.length; b++) {
			view.removeChild(bubbles[b]);
		}*/
		$('.bubble').remove();
	}

	//var cool_mads_node = new Node("panel");
	//cool_mads_node.addSocket(true);
	//console.log(cool_mads_node instanceof createjs.Container);
	//console.log(cool_mads_node instanceof Node);
	//stage.canvas.width = document.documentElement.clientWidth;
	//stage.canvas.height = document.documentElement.clientHeight;

	stage.canvas.width = $("#view").outerWidth();
	stage.canvas.height = $("#view").outerHeight();
	stage.enableMouseOver(15);
	stage.on("mousedown", function() { document.activeElement.blur(); });

	stage.mouseMoveOutside = true;
	stage.on("stagemousemove", stageMouseMove);

	initviewContainer();
	initNodes();

	$("#zoomin").on('click', function() { zoom(1); });
	$("#zoomout").on('click', function() { zoom(-1); });
	//$('#tabs').on('click', 'li', function() { openTab($(this).prop('id')); });
	//document.querySelector("#propertyTab").onclick = function() { openTab('propertyTab'); };
	//document.querySelector("#imagesTab").onclick = function() { openTab('imagesTab'); };
	$("#edit_canvas").on('drop', function(event) { drop(event); });
	$("#edit_canvas").on('dragover', function(event) { allowDrop(event); });
	
	/*$("#save").on('click', function() {
		loader.save(nodeContainer.toObject());
	});*/
	$(document).keydown(function(e) {
	  console.log("keydown:");
	  if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
	    e.preventDefault();
	    console.log("CTRL+S");
	    // Process event...
	    loader.save(nodeContainer.toObject(), $("#filepath").value);
	  }
	});

	function stageMouseMove(evt) {
		if (dragging_element !== undefined && dragging_element !== null) {
			var local = dragging_element.parent.globalToLocal(evt.stageX - dragoffset.x, evt.stageY - dragoffset.y);
			dragging_element.x = local.x;
			dragging_element.y = local.y;
		}
	}
};

exports.updateData = function(data) {

};

exports.updateNode = function(sel, update) {
	console.log("update node!");
	if (sel.node !== undefined) {
		if (sel.element !== undefined) {
			nodeContainer.nodes[sel.node].elements[sel.element].update(update);
		} else nodeContainer.nodes[sel.node].update(update);
	}
	drawAllConnections();
};

exports.updateConfig = function(conf) {
	config = conf;
};

exports.updateAll = function() {
	for (var p=0; p<nodeContainer.nodes.length;p++) {
		let panel = nodeContainer.nodes[p];
		if (panel !== null) {
			panel.update();
		}
	}
	drawAllConnections();
};

function initNodes() {
	let coolnode = new Node();
	coolnode.cool();

	nodeContainer = new NodeContainer();
	nodeContainer.nodes = [];
	nodeContainer.startnode = config.startnode;
	for (var p=0; p<panels.length;p++) {
		if (panels[p] !== null) {
			let node;
			if (panels[p].type !== undefined) {
				if (panels[p].type == 'varnode') {
					node = new Node(panels[p]);
					node.setup(panels[p]);
				}
			} else {
				node = new Panel(panels[p]);
				node.setup(panels[p]);
			}
			//var panel = new Panel(panels[p]);
			nodeContainer.addChild(node);
			nodeContainer.nodes.push(node);
		} else {
			nodeContainer.nodes.push(null);
		}
	}
	nodeContainer.makeConnections();
	viewContainer.addChild(nodeContainer);
	drawAllConnections();
}

window.onresize = function(event) {
    let view = $("#view");
    let sidebar = $("#sidebar");

    stage.canvas.width = view.outerWidth();
    stage.canvas.height = view.outerHeight();

	stage.getChildByName("dragBox").graphics.beginFill("#999").drawRect(0,0,stage.canvas.width, stage.canvas.height);
    //stage.update();
};

function clearAll() {

	function clearEvents(disObj) {
		console.log(disObj);
		disObj.removeAllEventListeners();
		for (var i=0; i < disObj.children.length; i++) {
			if (disObj.children[i].children !== undefined) {
				clearEvents(disObj.children[i]);
			}
		}
	}
	if (stage !== undefined) clearEvents(stage);
}

function initviewContainer() {
	var dragBox;

	//var corners = new createjs.Shape();

	viewContainer = new createjs.Container();
	viewScale = zoomStep[zoomNumber];
	viewContainer.scaleX = viewScale;
	viewContainer.scaleY = viewScale;
	viewContainer.name = "View Container";

	function dragView(evt) {
		//console.log("Draggin view! " + evt.target);
		viewContainer.x = evt.stageX - dragoffset.x;
		viewContainer.y = evt.stageY - dragoffset.y;

		centerViewOrigin(evt.stageX - dragoffset.x, evt.stageY - dragoffset.y);
	}

	function centerViewOrigin(x,y) {
		viewContainer.regX = (($("#view").outerWidth() - 280)/2 - viewContainer.x)/viewScale;
		viewContainer.regY = (($("#view").outerHeight()/2) - viewContainer.y)/viewScale;
		viewContainer.x = x + viewContainer.regX * viewScale;
		viewContainer.y = y + viewContainer.regY * viewScale;
	}

	dragBox = new createjs.Shape(new createjs.Graphics().beginFill("#999").drawRect(0,0,stage.canvas.width, stage.canvas.height));
	dragBox.on("mousedown", function(evt) {
		if (currentlySelected !== undefined && currentlySelected.selected !== undefined) currentlySelected.selected.graphics.clear();
		currentlySelected = nodeContainer;
		handleSelection({});
		//openTab("propertyTab");
		//nodeContainer.showProperties();
		dragoffset.x = evt.stageX - viewContainer.x + viewContainer.regX*viewScale;
		dragoffset.y = evt.stageY - viewContainer.y + viewContainer.regY*viewScale;
	});
	dragBox.on("pressmove", dragView);
	//dragBox.cursor = "grab";
	dragBox.name = "dragBox";

	stage.addChild(dragBox);
	//stage.addChild(corners);
	stage.addChild(viewContainer);

	centerViewOrigin(0,0);

	
	let zoomIn = $('<div>+</div>').attr('id', 'zoomin').addClass('zoom-button noselect plus').click(zoom(1));
	let zoomOut = $('<div>-</div>').attr('id', 'zoomout').addClass('zoom-button noselect').click(zoom(-1));
	let zoomButtons = $('<div>').attr('id', 'zoom').append(zoomIn, zoomOut);
	$('body').append(zoomButtons);
}

function drawAllConnections() {
	for (var c = 0; c < nodeContainer.children.length; c++) {
		nodeContainer.children[c].drawConnections();
	}
}

exports.newNode = function(x, y, type) {
	let pos = nodeContainer.globalToLocal(x,y);
	console.log('new node', pos.x, pos.y);
	let obj = {
		type: type,
		editor: { position: { x: x, y: y } }
	};
	var node = new Node();
	node.setup(obj);
	nodeContainer.nodes.push(node);
	nodeContainer.addChild(node);
	addNode({type:'node'}, obj);
}

function newPanel(x, y, image) {
	var obj = {};
	obj.image = image;
	obj.editor = {};
	obj.editor.position = {
		x: x,
		y: y
	};
	let panel = new Panel();
	panel.setup(obj)
	nodeContainer.addChild(panel);
	nodeContainer.nodes.push(panel);
	addNode({type:'node'}, panel.toObject());
}

exports.removeNode = function(sel) {
	if (sel.node !== undefined) {
		let panel = nodeContainer.nodes[sel.node];
		if (sel.element !== undefined) {
			let element = panel.elements[sel.element];
			panel.removeChild(element);
			panel.elements[sel.element] = null;
		} else {
			nodeContainer.removeChild(panel);
			nodeContainer.nodes[sel.node] = null;
		}
		//handleSelection({});
	}
	return nodeContainer.toObject();
};

exports.getImageSize = function(sel) {
	let width;
	let height;
	if (sel.node !== undefined) {
		let panel = nodeContainer.nodes[sel.node];
		if (sel.element !== undefined) {
			let element = panel.elements[sel.element];
			width = element.loadimage.get(0).naturalWidth;
			height = element.loadimage.get(0).naturalHeight;
		} else {
			width = panel.panelbitmap.image.width;
			height = panel.panelbitmap.image.height;
		}
	}
	console.log(width, height);
	return { width: width, height: height };
};

function newPanelElement(x, y, panel, image) {
	var elm = {};
	elm.position = {
		x: x/(panel.panelbitmap.image.width*panel.panelbitmap.scaleX),
		y: y/(panel.panelbitmap.image.height*panel.panelbitmap.scaleY)
	};
	console.log(elm.position);
	elm.image = image;
	//default alignment option! for now
	elm.bubble_type = "down";
	elm.text = "";

	var panelelement = new PanelElement(elm, panel.panelbitmap);

	if (panel.elements === undefined) panel.elements = [];
	panel.elements.push(panelelement);
	panel.addChild(panelelement);

	var socketpos = {
		x: panelelement.x + panelelement.width*panelelement.scaleX,
		y: panelelement.y + panelelement.height/2*panelelement.scaleY
	};
	var sock = panel.addSocket(socketpos.x, socketpos.y, panelelement.goto, panel, 3, "#fff");
	sock.owner = panelelement;
	socketpos = sock.owner.localToLocal(sock.owner.width, sock.owner.height/2, sock.parent);
	sock.x = socketpos.x;
	sock.y = socketpos.y;

	addNode({type:'element', node:nodeContainer.nodes.indexOf(panel)}, panelelement.toObject());
}

function zoom(zoomModifier) {

	if (zoomNumber + zoomModifier < 0 || zoomNumber + zoomModifier >= zoomStep.length) return;

	var zoomspeed = 200;

	zoomNumber += zoomModifier;
	viewScale = zoomStep[zoomNumber];
	console.log(viewScale);

	createjs.Tween.get(viewContainer, {override: true})
		.to({ scaleX: viewScale, scaleY: viewScale }, zoomspeed, createjs.Ease.cubicOut);

	/*for (var c = 0; c < viewContainer.children.length; c++) {
		var ps = viewContainer.children[c].getChildByName("panelSocket");
		createjs.Tween.get(ps, {override: true}).to({scaleX: 1 / viewScale, scaleY: 1 / viewScale}, zoomspeed, createjs.Ease.cubicOut);
		setTimeout(drawConnections(viewContainer.children[c]), 200);
	}*/
}

const allowDrop = function (ev) {
    ev.preventDefault();
};

exports.drag = function (ev, path) {
    ev.dataTransfer.setData("text/plain", path);
};

const drop = function (ev) {
    ev.preventDefault();
    ev.dataTransfer = ev.originalEvent.dataTransfer;
    ev.clientX = ev.originalEvent.clientX;
    ev.clientY = ev.originalEvent.clientY;
    let newimage = ev.dataTransfer.getData("text/plain");
    if (ev.target == stage.canvas) {
    	//console.log("Dropped on STAGE! Cool!", ev.clientX, ev.clientY);
    	var local = nodeContainer.globalToLocal(ev.clientX, ev.clientY);
    	console.log(local);
    	//console.log(ev.dataTransfer.getData("text/plain"));
    	var pnl = nodeContainer.getObjectUnderPoint(local.x, local.y);
    	if (pnl !== null && pnl instanceof createjs.Bitmap) pnl = pnl.parent;
    	//console.log(pnl);
    	if (pnl instanceof Panel) {
    		var pos = pnl.globalToLocal(ev.clientX, ev.clientY);
    		console.log(pos);
    		if (ev.originalEvent.ctrlKey) {
    			console.log('replace image!');
    			//pnl.image = ev.dataTransfer.getData("text/plain");
    			pnl.newImage(newimage);
    			let sel = {node: nodeContainer.nodes.indexOf(pnl)};
				handleChange(sel, {image: newimage});
    		} else {
	    		newPanelElement(pos.x, pos.y, pnl, newimage);
	    	}
    	}
    	else newPanel(local.x, local.y, newimage);
    }
    //var data = ev.dataTransfer.getData("text");
    //ev.target.appendChild(document.getElementById(data));
};


(function() {

	
	
	// ------------ //
	// PanelElement //
	// ------------ //

	function PanelElement(obj, bitmap) {
		this.Container_constructor();
		this.panelbitmap = bitmap;
		this.setup(obj);
		this.ctrldrag = {dragging:false, socket:null};
	} createjs.extend(PanelElement, createjs.Container);

	PanelElement.prototype.setup = function(obj) {
		if (obj.goto != -1) this.goto = obj.goto;
		this.align = obj.align;
		this.bubble_type = obj.bubble_type;
		this.text = obj.text;
        this.position = obj.position;
		this.padding = obj.padding;

		var sb = obj;

		var div = document.querySelector("#view").appendChild(document.createElement("DIV"));
		var bubble_orient = sb.bubble_type;

		if (obj.image !== undefined) {
			this.image = obj.image;
		}
		else {
			var image = "";
			var bubble_size = "medium";
			if (sb.text.length < 4) {
				bubble_size = "small";
			}
			
			image += bubble_size;
			if (bubble_orient == "box") {
				image += "_box.png";
			}
			else image += "_bubble_" + bubble_orient + ".png";
			this.image = 'game/img/bubbles/' + image;
		}

		div.innerHTML = "<p>" + sb.text.replace(/\n/g, "<br>") + "</p>";

		div.className = "bubble";
		if (bubble_orient == "box") div.className += " box";
		div.className += " noselect";
		div.style.opacity = '0';
		div.style.backgroundImage = 'url("' + this.image +'")';
		div.style.position = "absolute";
		div.style.top = 0;
		div.style.left = 0;
		if (config.comic_fontsize !== undefined) {
			div.children[0].style.fontSize = config.comic_fontsize + 'px';
		}
		if (config.comic_font !== undefined) {
			div.style.fontFamily = '\'' + config.comic_font + '\', Verdana, Geneva, sans-serif';
		}
		if (config.comic_lineheight !== undefined) {
			div.children[0].style.lineHeight = config.comic_lineheight + 'rem';
		}

		if (obj.width !== undefined && obj.width !== "") {
			div.style.width = this.panelbitmap.image.width*this.panelbitmap.scaleX*(obj.width/100)/0.6 + 'px';
		}
		if (obj.height !== undefined && obj.height !== "") {
			div.style.height = this.panelbitmap.image.height*this.panelbitmap.scaleX*(obj.height/100)/0.6 + 'px';
		}
		if (obj.padding !== undefined && div.children.length > 0) {
			div.children[0].style.padding = obj.padding.trim().split(' ').join('px ') + 'px';
		}
		else if (config.default_padding !== undefined && div.children.length > 0) {
			let padding = config.default_padding.trim().split(' ').join('px ') + 'px';
			div.children[0].style.padding = padding;
			console.log(padding);
		}
		

		this.scaleX = 0.6;
		this.scaleY = 0.6;

		this.x = sb.position.x * this.panelbitmap.image.width*this.panelbitmap.scaleX;
		this.y = sb.position.y * this.panelbitmap.image.height*this.panelbitmap.scaleY;
		this.regX = div.clientWidth/2;
		this.regY = div.clientHeight;
		this.width = div.clientWidth;
		this.height = div.clientHeight;
		if (bubble_orient == "left") {
			this.regX = 0;
		}

		var align_x = "left";
		var align_y = "top";
		if (sb.align !== undefined) {
			align_x = sb.align.x;
			align_y = sb.align.y;
		}
		if (align_x == "right") {
			this.regX = div.clientWidth;
			this.x = this.panelbitmap.image.width*this.panelbitmap.scaleX-this.x;
		}
		if (align_y == "bottom") {
			this.regY = div.clientHeight;
			this.y = this.panelbitmap.image.height*this.panelbitmap.scaleY-this.y;
		}
		var selected = new createjs.Shape();
		var hitshape = new createjs.Shape();
		hitshape.graphics.f("#000").dr(0,0,this.width,this.height);
		this.hitArea = hitshape;
		var elm = new createjs.DOMElement(div);
		this.addChild(selected, elm);
		div.opacity = '1';
		elm.x = 0;
		elm.y = 0;
		this.loadimage = $('<img />').attr('src', this.image);
		//this.addChild(hitshape);
		this.on("mousedown", this.setDragOffset);
		this.on("pressmove", this.dragElement);
		this.on("pressup", this.handleMouseUp);
		//this.on("click", this.showProperties);
		//elm.regY = elm.getBounds().height;
		//elements.addChild(elm);
	};

	PanelElement.prototype.update = function(update) {
		var element = this.children[1].htmlElement;

		for (let property in update) {
			if (property == 'width') {
				this.width = this.panelbitmap.image.width*this.panelbitmap.scaleX*(update.width/100)/0.6;
				element.style.width = this.width + 'px';
			}
			else if (property == 'height') {
				this.height = this.panelbitmap.image.height*this.panelbitmap.scaleX*(update.height/100)/0.6;
				element.style.height = this.height + 'px';
			}
			else this[property] = update[property];
		}
		/*if (update.text !== undefined) this.text = update.text;
		if (update.bubble_type !== undefined) this.bubble_type = update.bubble_type;
		if (update.image !== undefined) this.image = update.image;
		if (update.position !== undefined) this.position = update.position;
		if (update.align !== undefined) this.align = update.align;*/

		if (this.width === '' || this.width == 0 || this.width === undefined)
		{
			element.style.width = "";
		}
		if (this.height === '' || this.height == 0 || this.height === undefined)
		{
			element.style.height = "";
		}
		element.innerHTML = '<p>' + this.text.replace(/\n/g, "<br>") + '</p>';
		if (config.comic_fontsize !== undefined && element.children.length > 0) {
			element.children[0].style.fontSize = config.comic_fontsize + 'px';
		}
		if (config.comic_font !== undefined && element.children.length > 0) {
			element.style.fontFamily = '\'' + config.comic_font + '\', Verdana, Geneva, sans-serif';
		}
		if (config.comic_lineheight !== undefined && element.children.length > 0) {
			element.children[0].style.lineHeight = config.comic_lineheight + 'rem';
		}
		if (this.padding !== undefined && element.children.length > 0) {
			element.children[0].style.padding = this.padding.trim().split(' ').join('px ') + 'px';
		} else if (config.default_padding !== undefined && element.children.length > 0) {
			let padding = config.default_padding.trim().split(' ').join('px ') + 'px';
			element.children[0].style.padding = padding;
			console.log(padding);
		}

		this.width = element.clientWidth;
		this.height = element.clientHeight;
		//this.width = element.clientWidth;
		//this.height = element.clientHeight;
		this.regX = element.clientWidth/2;
		this.regY = element.clientHeight;
		this.hitArea.graphics.clear().f("#000").dr(0,0,this.width,this.height);
		this.setPosition();
		element.style.backgroundImage = this.image;

		if (this.align !== undefined && this.align.x == "right") {
			this.regX = element.clientWidth;
		}



		drawAllConnections();
	};

	PanelElement.prototype.toObject = function() {
		let obj = {};

		obj.text = this.text;
		obj.align = this.align;
		obj.keepAspect = this.keepAspect;
		obj.image = this.image;
		//obj.goto = this.goto;
		obj.bubble_type = this.bubble_type;
		obj.position = this.position;

		return obj;
	};

	PanelElement.prototype.setDragOffset = function(evt) {
		let node = evt.target;
		node.ctrldrag = { dragging: false, socket: null };
		if (navigator.platform.match("Mac") ? evt.nativeEvent.metaKey : evt.nativeEvent.ctrlKey) {
			evt.preventDefault();
			
			for (let s=0; s < node.parent.sockets.length; s++) {
				let socket = node.parent.sockets[s];
				if (socket.owner == node) {
					let socketEvt = evt.clone();
					let nodeEvt = evt.clone();
					node.ctrldrag = {dragging:true, socket: socket};
					socketEvt.set({type: 'pressmove', target: socket});
					//nodeEvt.set({type: 'mouseup'});
					//node.dispatchEvent(nodeEvt);		
					socket.dispatchEvent(socketEvt);
				}
			}

			return false;
		}
		var global = evt.target.parent.localToGlobal(evt.target.x, evt.target.y);
		dragoffset = {
			x: evt.stageX - global.x,
			y: evt.stageY - global.y
		};
		//currentlySelected = evt.target.parent;
		if (currentlySelected !== undefined && currentlySelected.selected !== undefined) currentlySelected.selected.graphics.clear();
		currentlySelected = evt.target;
		handleSelection({node: nodeContainer.nodes.indexOf(evt.target.parent), element: evt.target.parent.elements.indexOf(evt.target)});
		//openTab("propertyTab");
		//evt.target.showProperties();
	};

	PanelElement.prototype.dragElement = function(evt) {
		//console.log("Click!");
		let node = evt.target;
		if (node.ctrldrag.dragging) {
			let socketEvt = evt.clone();
			socketEvt.set({type: 'pressmove', target: node.ctrldrag.socket});
			
			node.ctrldrag.socket.dispatchEvent(socketEvt);
			return false;
		}

		var local = evt.target.parent.globalToLocal(evt.stageX - dragoffset.x, evt.stageY - dragoffset.y);
		var panelbitmap = evt.target.parent.panelbitmap;
		var panel = {
			width: panelbitmap.image.width*panelbitmap.scaleX,
			height: panelbitmap.image.height*panelbitmap.scaleY
		};
		if (local.x < 0) local.x = 0;
		if (local.x > panel.width) local.x = panel.width;
		if (local.y < 0) local.y = 0;
		if (local.y > panel.height) local.y = panel.height;
		evt.target.x = local.x;
		evt.target.y = local.y;
		this.position = evt.target.outputPosition();
		let sel = {node: nodeContainer.nodes.indexOf(evt.target.parent), element: evt.target.parent.elements.indexOf(evt.target)};
		let pos = evt.target.outputPosition();
		handleChange(sel, {position: pos});
        /*evt.target.position = { 
            x: local.x/evt.target.panelbitmap.image.width/evt.target.panelbitmap.scaleX*100, 
            y: local.y/evt.target.panelbitmap.image.height/evt.target.panelbitmap.scaleY*100 }*/
		evt.target.parent.drawConnections();
	};

	PanelElement.prototype.handleMouseUp = function(evt) {
		let node = evt.target;
		if (node.ctrldrag.dragging) {
			let socketEvt = evt.clone();
			socketEvt.set({type: 'pressup', target: node.ctrldrag.socket});
			
			node.ctrldrag.socket.dispatchEvent(socketEvt);

			node.ctrldrag = { dragging: false, socket: null };
			return false;
		}
	};

	PanelElement.prototype.setPosition = function() {
		var panelbitmap = this.parent.panelbitmap;
		var panel = {
			width: panelbitmap.image.width*panelbitmap.scaleX,
			height: panelbitmap.image.height*panelbitmap.scaleY
		};

		if (this.align === undefined) {
			this.x = this.position.x * panel.width;
			this.y = this.position.y * panel.height;
		} else {
			this.x = panel.width - this.position.x * panel.width;
			this.y = panel.height - this.position.y * panel.height;
		}
	};

	PanelElement.prototype.outputPosition = function() {
		let elm = this;
		let bitm = elm.panelbitmap;
		let pos = {
							x:elm.x/(bitm.image.width*bitm.scaleX),
							y:elm.y/(bitm.image.height*bitm.scaleY)
						};
		if (elm.align !== undefined) {
			if (elm.align.x == "right") pos.x = 1 - pos.x;
			if (elm.align.y == "bottom") pos.y = 1 - pos.y;
		}
		return pos;
	};

	window.PanelElement = createjs.promote(PanelElement, "Container");


	// --------------- //
	//  NodeContainer  //
	// --------------- //

	function NodeContainer() {
		this.Container_constructor();
		this.startnode = 0;
	} createjs.extend(NodeContainer, createjs.Container);

	NodeContainer.prototype.makeConnections = function() {

		for (let i=0; i < this.nodes.length; i++) {
			var node = this.nodes[i];
			if (node !== null) {
				if (node.goto !== undefined) 
					if (this.nodes[node.goto] !== null) {
						node.goto = this.nodes[node.goto];
					} else {
						node.goto = undefined;
					}
				if (node.elements !== undefined) {
					for (let e=0; e < node.elements.length; e++) {
						var elem = node.elements[e];
						if (elem instanceof PanelElement && elem.goto !== undefined) {
							if (node.elements[elem.goto] !== null) {
								elem.goto = this.nodes[elem.goto];
							} else {
								elem.goto = undefined;
							}
						} 
					}
				}
			}			
		}

	};

	// Overwrite Container.removeChild()
	NodeContainer.prototype.removeChild = function(child) {
		var view = document.querySelector("#view");
		for (let e=0; e<child.elements.length; e++) {
			let elm = child.elements[e];
			if (elm !== null && elm instanceof PanelElement) {
				elm = elm.children[1].htmlElement;
				view.removeChild(elm);
			}
		}
		//this.nodes[indexOf(child)] = null;
		this.Container_removeChild(child);
		drawAllConnections();
	};

	// toObject - For outputting editor parameters to a JSON object

	NodeContainer.prototype.toObject = function() {

		var output = {};

		output.config = {
			startnode: this.startnode
		};

		output.nodes = [];
		for (let i=0; i < this.nodes.length; i++) {
			var ref = this.nodes[i];
			// cycle through all nodes, saving their data to an object
			var node = {};

			if (ref instanceof Panel) {
				//console.log(node.name);
				node.name = ref.name;
				node.size = ref.size;
				node.image = ref.image;
				node.goto = this.nodes.indexOf(ref.goto);
				if (node.goto == -1) node.goto = undefined;
				node.editor = {
					position: { x: ref.x, y: ref.y }
				};

				node.elements = [];

				for (let e=0; e < ref.elements.length; e++) {
					var r_elem = ref.elements[e];
					if (r_elem instanceof PanelElement) {
						var elem = {};

						elem.type = r_elem.type;
						if (r_elem.text !== undefined) {
							elem.text = r_elem.text;
						}
						elem.bubble_type = r_elem.bubble_type;
						elem.image = r_elem.image;
						
						elem.position = {
							x:r_elem.x/(r_elem.panelbitmap.image.width*r_elem.panelbitmap.scaleX),
							y:r_elem.y/(r_elem.panelbitmap.image.height*r_elem.panelbitmap.scaleY)
						};
						if (r_elem.align !== undefined) {
							elem.align = r_elem.align;
							if (elem.align.x == "right") elem.position.x = 1 - elem.position.x;
							if (elem.align.y == "bottom") elem.position.y = 1 - elem.position.y;
						}
						elem.goto = this.nodes.indexOf(r_elem.goto);
						if (elem.goto == -1) elem.goto = undefined;

						node.elements.push(elem);
					}
				}

			}

			output.nodes.push(node);
		}

		return output;
	};

	window.NodeContainer = createjs.promote(NodeContainer, "Container");

}());






