import Konva from 'konva';
import Node from '../lib/konva/Node';
import Panel from '../lib/konva/Panel';

const sizesX = [368,768,1168,1568];

//var classes = require('./classes.js');
var loader = require("./loader.js");
var $ = require('jquery');

var panels;
var config;
let createjs = window.createjs;
var stage;
var nodeContainer;
//var firstLoad = true;
var viewScale = 1;
var dragoffset = {x:0, y:0};
//var dragBox;
var zoomNumber = 3;
var zoomStep = [0.12, 0.15, 0.2, 0.3, 0.5, 0.75, 1, 1.5, 2];
var dragging_element;

var defaultGamePath = "";
var con_r = 6;
var currentlySelected;
var currentLocalImages;

let handleSelection;
let handleChange;
let addNode;

let debuglayer;

exports.init = function(obj, onselect, onchange, addnode) {

	handleSelection = onselect;
	handleChange = onchange;
	addNode = addnode;

    panels = obj.nodes;
    config = obj.config;

	var width = window.innerWidth;
    var height = window.innerHeight;

	stage = new Konva.Stage({
		container: 'view',
		width: width,
		height: height,
		scaleX: 0.4,
		scaleY: 0.4,
		draggable: true
	});

	//var cool_mads_node = new Node("panel");
	//cool_mads_node.addSocket(true);
	//console.log(cool_mads_node instanceof createjs.Container);
	//console.log(cool_mads_node instanceof Node);
	//stage.canvas.width = document.documentElement.clientWidth;
	//stage.canvas.height = document.documentElement.clientHeight;

	
	initNodes();

	let zoomIn = $('<div>+</div>').attr('id', 'zoomin').addClass('zoom-button noselect plus');
	let zoomOut = $('<div>-</div>').attr('id', 'zoomout').addClass('zoom-button noselect');
	let zoomButtons = $('<div>').attr('id', 'zoom').append(zoomIn, zoomOut);
	$('body').append(zoomButtons);

	$("#zoomin").on('click', function() { zoom(1); });
	$("#zoomout").on('click', function() { zoom(-1); });
	//$('#tabs').on('click', 'li', function() { openTab($(this).prop('id')); });
	//document.querySelector("#propertyTab").onclick = function() { openTab('propertyTab'); };
	//document.querySelector("#imagesTab").onclick = function() { openTab('imagesTab'); };
	
	$("#view").on('drop', function(event) { drop(event); });
	$("#view").on('dragover', function(event) { allowDrop(event); });
	
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
	nodeContainer = new Konva.Layer({name: 'nodeContainer'});
	nodeContainer.nodes = [];
	nodeContainer.startnode = config.startnode;
	for (var p=0; p<panels.length;p++) {
		if (panels[p] !== null) {
			let node;
			if (panels[p].type !== undefined) {
				if (panels[p].type == 'varnode') {
					node = new Node(panels[p]);
				}
			} else {
				//console.log("Added panel!");
				let panObj = panels[p];
				panObj.width = sizesX[panObj.size - 1];
				if (panObj.image !== undefined) {
					panObj.elements.unshift({
						image: panObj.image,
						position: {x:0, y:0},
						width: panObj.width
					});
					panObj.image = undefined;
				}
				panObj.height = 560 * (368/400);
				node = new Panel(panObj);
				node.setup(panObj);
			}
			//var panel = new Panel(panels[p]);
			nodeContainer.add(node);
			nodeContainer.nodes.push(node);
		} else {
			nodeContainer.nodes.push(null);
		}
	}
	stage.add(nodeContainer);
	stage.on('click', function(evt) {
		handleClick(evt);
	});
	drawAllConnections();
}

function handleClick(evt) {
	console.log(evt.target);
	evt.cancelBubble = true;
}

window.onresize = function(event) {
    let view = $("#view");
    let sidebar = $("#sidebar");

    stage.width(view.outerWidth());
    stage.height(view.outerHeight());

	stage.draw();

	//stage.getChildByName("dragBox").graphics.beginFill("#999").drawRect(0,0,stage.canvas.width, stage.canvas.height);
    //stage.update();
};

function clearAll() {

	function clearEvents(disObj) {
		//console.log(disObj);
		disObj.removeAllEventListeners();
		for (var i=0; i < disObj.children.length; i++) {
			if (disObj.children[i].children !== undefined) {
				clearEvents(disObj.children[i]);
			}
		}
	}
	if (stage !== undefined) clearEvents(stage);
}

/*function initviewContainer() {
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
}*/

function drawAllConnections() {
	/*for (var c = 0; c < nodeContainer.children.length; c++) {
		nodeContainer.children[c].drawConnections();
	}*/
	stage.find('.socket').each(function(shape) {
		//console.log(shape.goto);
	})
}

exports.newNode = function(x, y, type) {
	let pos = nodeContainer.globalToLocal(x,y);
	//console.log('new node', pos.x, pos.y);
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
	//console.log(width, height);
	return { width: width, height: height };
};

function newPanelElement(x, y, panel, image) {
	var elm = {};
	elm.position = {
		x: x/(panel.panelbitmap.image.width*panel.panelbitmap.scaleX),
		y: y/(panel.panelbitmap.image.height*panel.panelbitmap.scaleY)
	};
	//console.log(elm.position);
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

	function centerViewOrigin() {
		//console.log(stage.x(), stage.y());

		let screenCenter = {
			x: ($('#view').outerWidth() - 280)/2 - stage.x(),
			y: $('#view').outerHeight()/2 - stage.y()
		};
		let newOffset = {
			x: stage.offsetX() + screenCenter.x / stage.scaleX(),
			y: stage.offsetY() + screenCenter.y / stage.scaleY()
		};
		stage.offsetX(newOffset.x);
		stage.offsetY(newOffset.y);

		stage.x(stage.x() + screenCenter.x);
		stage.y(stage.y() + screenCenter.y);

		stage.draw();
		
		//console.log(screenCenter.x, screenCenter.y, stage.x(), stage.y(), newOffset.x, newOffset.y);
	}

	function resetOrigin() {
		nodeContainer.x(nodeContainer.offsetX()*nodeContainer.scaleX());
		nodeContainer.y(nodeContainer.offsetY()*nodeContainer.scaleY());
		nodeContainer.offsetX(0);
		nodeContainer.offsetY(0);
	}

	//console.log('zoom!');
	//let sx = nodeContainer.scaleX() + zoomModifier*0.1;
	//let sy = nodeContainer.scaleY() + zoomModifier*0.1;
	//console.log(zoomModifier);
	//nodeContainer.scaleX(sx);
	//nodeContainer.scaleY(sy);
	//nodeContainer.draw();
	
	if (zoomNumber + zoomModifier < 0 || zoomNumber + zoomModifier >= zoomStep.length) return;

	//var zoomspeed = 200;

	zoomNumber += zoomModifier;
	//viewScale = zoomStep[zoomNumber];
	//console.log(viewScale);

	centerViewOrigin();

	stage.tween = new Konva.Tween({
		node: stage,
		scaleX: zoomStep[zoomNumber],
		scaleY: zoomStep[zoomNumber],
		easing: Konva.Easings.EaseIn,
		duration: 0.1
	});
	stage.tween.play();

	
/*
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
    	//console.log(local);
    	//console.log(ev.dataTransfer.getData("text/plain"));
    	var pnl = nodeContainer.getObjectUnderPoint(local.x, local.y);
    	if (pnl !== null && pnl instanceof createjs.Bitmap) pnl = pnl.parent;
    	//console.log(pnl);
    	if (pnl instanceof Panel) {
    		var pos = pnl.globalToLocal(ev.clientX, ev.clientY);
    		//console.log(pos);
    		if (ev.originalEvent.ctrlKey) {
    			//console.log('replace image!');
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





