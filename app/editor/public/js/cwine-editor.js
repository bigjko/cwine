(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//var classes = require('./classes.js');
var loader = require("./loader.js");

var panels;
var config;
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



// --------------------------- //
//							   //
//			EXPORTS            //
//							   //
// --------------------------- //

exports.init = function(obj) {

    panels = obj.nodes;
    config = obj.config;
    
	if (stage === undefined) {
		stage = new createjs.Stage("edit_canvas");
		createjs.Ticker.setFPS(60);
		createjs.Ticker.addEventListener("tick", stage);
	}
	else {
		stage.removeAllChildren();
		var bubbles = document.querySelectorAll(".bubble");
		var view = document.querySelector("#view");
		for (var b=0; b < bubbles.length; b++) {
			view.removeChild(bubbles[b]);
		}
	}

	//var cool_mads_node = new Node("panel");
	//cool_mads_node.addSocket(true);
	//console.log(cool_mads_node instanceof createjs.Container);
	//console.log(cool_mads_node instanceof Node);
	//stage.canvas.width = document.documentElement.clientWidth;
	//stage.canvas.height = document.documentElement.clientHeight;

	stage.canvas.width = document.querySelector("#view").offsetWidth;
	stage.canvas.height = document.querySelector("#view").offsetHeight;
	stage.enableMouseOver(15);
	stage.on("mousedown", function() { document.activeElement.blur(); });

	stage.mouseMoveOutside = true;
	stage.on("stagemousemove", stageMouseMove);

	initviewContainer();
	initNodes();

	document.querySelector("#zoomin").onclick = function() { zoom(1) };
	document.querySelector("#zoomout").onclick = function() { zoom(-1) };
	document.querySelector("#propertyTab").onclick = function() { openTab('propertyTab') };
	document.querySelector("#imagesTab").onclick = function() { openTab('imagesTab') };

	function stageMouseMove(evt) {
		if (dragging_element !== undefined && dragging_element !== null) {
			var local = dragging_element.parent.globalToLocal(evt.stageX - dragoffset.x, evt.stageY - dragoffset.y);
			dragging_element.x = local.x;
			dragging_element.y = local.y;
		}
	}
}

exports.nodesToObject = function() {
	return nodeContainer.toObject();
}




//////////////////
////  EDITOR  ////
//////////////////


function initNodes() {
	nodeContainer = new NodeContainer();
	nodeContainer.startnode = config.startnode;
	for (var p=0; p<panels.length;p++) {
		var panel = new Panel(panels[p]);
		nodeContainer.addChild(panel);
	}
	nodeContainer.makeConnections();
	viewContainer.addChild(nodeContainer);
	drawAllConnections();
}

window.onresize = function(event) {
    var view = document.querySelector("#view");
    var sidebar = document.querySelector("#sidebar");

    stage.canvas.width = view.offsetWidth;
    stage.canvas.height = view.offsetHeight;

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
		viewContainer.regX = ((document.querySelector("#view").offsetWidth - 280)/2 - viewContainer.x)/viewScale;
		viewContainer.regY = ((document.querySelector("#view").offsetHeight/2) - viewContainer.y)/viewScale;
		//corners.graphics.clear();
		//corners.graphics.f("red").dc(viewContainer.x,viewContainer.y,15).f("blue").dc(viewContainer.x+viewContainer.regX*viewScale, viewContainer.y+viewContainer.regY*viewScale, 15);
		viewContainer.x = x + viewContainer.regX * viewScale;
		viewContainer.y = y + viewContainer.regY * viewScale;
	}

	dragBox = new createjs.Shape(new createjs.Graphics().beginFill("#999").drawRect(0,0,stage.canvas.width, stage.canvas.height));
	dragBox.on("mousedown", function(evt) {
		if (currentlySelected !== undefined && currentlySelected.selected !== undefined) currentlySelected.selected.graphics.clear();
		currentlySelected = nodeContainer;
		openTab("propertyTab");
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
}

function drawAllConnections() {
	for (var c = 0; c < nodeContainer.children.length; c++) {
		nodeContainer.children[c].drawConnections();
	}
}

function newPanel(x, y, image) {
	var obj = new Object();
	obj.image = image;
	obj.editor = new Object();
	obj.editor.position = {
		x: x,
		y: y
	}
	nodeContainer.addChild(new Panel(obj));
}

function newPanelElement(x, y, panel, image) {
	var elm = new Object();
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

	if (panel.elements == undefined) panel.elements = [];
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

var currentlySelected;
var currentTab = "properties";

function openTab(tab) {

	//if (tab == currentTab) return;
	currentTab = tab;

	switch(tab) {

		case "propertyTab":
		console.log("cool");
		if (currentlySelected !== undefined) {
		 	currentlySelected.showProperties();
		}
		else nodeContainer.showProperties();
		break;

		case "imagesTab":
		loader.loadAllImages(function(obj) {
			var properties = document.querySelector("#properties");
			properties.innerHTML = "";
			for (i=0; i<obj.length; i++) {
				console.log(obj[i]);
				properties.innerHTML += '<img width="100" style="margin-left:10px;" src="' + obj[i].replace("../", "") + '" draggable="true" ondragstart="drag(event, \'' + obj[i].replace("../", "") + '\')" />';
			}
		});
		break;
	}

	var tabs = document.querySelector("#tabs");
	for (t=0; t<tabs.children.length; t++) {
		tabs.children[t].className = (tabs.children[t].id == currentTab) ? "selected" : "";
	}
}


var sidebarClosed = false;

function hideSidebar() {
	var min = "30px";
	var max = "280px";
	if ( sidebarClosed ) {
		document.querySelector("#sidebar").style.width = max;
		sidebarClosed = false;
	}
	else {
		document.querySelector("#sidebar").style.width = min;
		sidebarClosed = true;
	}
}

function mouseUp() {
	console.log("Mouse Up on HTML Element");
	dragging_element = undefined;
}

function mouseDown(elm) {
	console.log("Mouse Down on HTML Element");
	dragging_element = elm;
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev, path) {
    ev.dataTransfer.setData("text/plain", path);
}

function drop(ev) {
    ev.preventDefault();
    if (ev.target == stage.canvas) {
    	//console.log("Dropped on STAGE! Cool!", ev.clientX, ev.clientY);
    	var local = nodeContainer.globalToLocal(ev.clientX, ev.clientY);
    	//console.log(ev.dataTransfer.getData("text/plain"));
    	var pnl = nodeContainer.getObjectUnderPoint(local.x, local.y);
    	if (pnl !== null && pnl instanceof createjs.Bitmap) pnl = pnl.parent;
    	//console.log(pnl);
    	if (pnl instanceof Panel) {
    		var pos = pnl.globalToLocal(ev.clientX, ev.clientY);
    		console.log(pos);
    		newPanelElement(pos.x, pos.y, pnl, ev.dataTransfer.getData("text/plain"));
    	}
    	else newPanel(local.x, local.y, ev.dataTransfer.getData("text/plain"));
    }
    //var data = ev.dataTransfer.getData("text");
    //ev.target.appendChild(document.getElementById(data));
}


/**
* 
*
*	Easeljs class definitions
*
*
**/

(function() {

	// ------------ //
	//  NODE class  //
	// ------------ //

	//var editor = require('./editor.js');

	function Node() {
		this.Container_constructor();
		this.sockets = [];
	}
	createjs.extend(Node, createjs.Container);

	Node.prototype.handleMouseDown = function(evt) {
		dragoffset = {
			x: evt.stageX/viewScale - evt.target.parent.x,
			y: evt.stageY/viewScale - evt.target.parent.y
		};

		//evt.target.dragoffset.y = evt.stageY/viewScale - evt.target.parent.y;
		if (currentlySelected !== undefined && currentlySelected.selected !== undefined) currentlySelected.selected.graphics.clear();
		currentlySelected = evt.target.parent;
		openTab("propertyTab");
	};

	Node.prototype.handleMouseMove = function(evt) {
		//console.log(evt.target);
		evt.target.parent.x = evt.stageX/viewScale - dragoffset.x;
		evt.target.parent.y = evt.stageY/viewScale - dragoffset.y;

		evt.target.parent.x = Math.round(evt.target.parent.x*0.1)*10;
		evt.target.parent.y = Math.round(evt.target.parent.y*0.1)*10;

		//console.log(evt.target.parent);
		//drawConnections(evt.target.parent);
		drawAllConnections();
	};

	Node.prototype.drawConnections = function() {
		for (s=0; s < this.sockets.length; s++) {
			var socket = this.sockets[s];
			socket.line.graphics.clear();
			if (socket.owner instanceof PanelElement) {
				var socketpos = socket.owner.localToLocal(socket.owner.width, socket.owner.height/2, socket.parent);
				socket.x = socketpos.x;
				socket.y = socketpos.y;
			}
			if (socket.owner.goto !== undefined && this.parent.contains(socket.owner.goto)) {
				var goto = socket.owner.goto;
				var local = this.parent.localToLocal(goto.x, goto.y+goto.height/2, socket);
				
				if (socket.owner instanceof PanelElement) socket.line.graphics.s(socket.color).ss(socket.strokewidth).sd([10,5]).mt(0+socket.radius, 0).lt(local.x, local.y );
				else socket.line.graphics.s(socket.color).ss(socket.strokewidth).mt(0+socket.radius, 0).lt(local.x, local.y );
				socket.alpha = 1;
			}
			else socket.alpha = 0.5;
		}
	};

	Node.prototype.dragLine = function(evt) {
		var sock = evt.target.parent;
		var line = sock.line;
		line.graphics.clear();
		var local = line.globalToLocal(evt.stageX, evt.stageY);
		line.graphics.s(sock.color).ss(sock.strokewidth).mt(0+con_r, 0).lt(local.x,local.y);
	};

	Node.prototype.releaseLine = function(evt) {
		evt.target.parent.goto = undefined;
		evt.target.parent.owner.goto = undefined;
		evt.target.parent.line.graphics.clear();
		var targ = stage.getObjectUnderPoint(evt.stageX, evt.stageY);
		if (targ.parent instanceof Node) {
			evt.target.parent.goto = targ.parent;
			evt.target.parent.owner.goto = targ.parent;
		}
		evt.target.parent.parent.drawConnections();
	};

	Node.prototype.addSocket = function(x, y, goto, addTo, radius, color) {
		var socket = new createjs.Container();
		socket.shape = new createjs.Shape();
		socket.line = new createjs.Shape();
		socket.radius = radius;

		socket.x = x;
		socket.y = y;

		if (color !== undefined) socket.color = color;
		else socket.color = "#000";

		if (color == "#fff") this.bg_color = "#000";
		else this.bg_color = "#fff";

		var r = socket.radius;
		socket.shape.regY = r;
		socket.shape.regX = 0;

		socket.shape.graphics.f(this.bg_color).dc(r,r,r).f(socket.color).dc(r,r,r-r/3);
		//socket.shape.scaleX = 1;
		//socket.shape.scaleY = 1;

		socket.strokewidth = socket.radius/2;
		socket.cursor = "pointer";

		socket.goto = goto;

		socket.addChild(socket.shape, socket.line);

		socket.on("pressmove", this.dragLine);
		socket.on("pressup", this.releaseLine);

		this.sockets.push(socket);
		if (addTo === undefined) this.addChild(socket);
		else addTo.addChild(socket);

		return socket;
	};

	window.Node = createjs.promote(Node, "Container");

	//
	// PANEL class
	//

	function Panel(obj) {
		this.Node_constructor();
		//this.sockets = [];
		this.setup(obj);
	}
	createjs.extend(Panel, Node);

	Panel.prototype.setup = function(obj) {
		this.name = obj.name;
		if (obj.editor !== undefined) {
			this.x = obj.editor.position.x;
			this.y = obj.editor.position.y;
		}
		this.selected = new createjs.Shape();
		this.addChild(this.selected);

		if (obj.image !== undefined) {
			this.panelbitmap = new createjs.Bitmap(obj.image);
            this.image = obj.image;
			var scale = 0.25;
			//if (panels[i].size == 4) scale = 0.35;
            if (obj.size === undefined) this.size = 1;
            else this.size = obj.size;
			scale = this.size*400*scale / this.panelbitmap.image.width;
			this.panelbitmap.scaleX = scale;
			this.panelbitmap.scaleY = scale;
			this.width = this.panelbitmap.image.width*this.panelbitmap.scaleX;
			this.height = this.panelbitmap.image.height*this.panelbitmap.scaleY;
			//this.panelbitmap.on("mousedown", handleMouseDown);
			//this.panelbitmap.on("pressmove", handleMouseMove);
			//this.panelbitmap.on("pressup", handleMouseUp);
			this.panelbitmap.cursor = "move";
			this.addChild(this.panelbitmap);
			this.panelbitmap.on("mousedown", this.handleMouseDown);
			this.panelbitmap.on("pressmove", this.handleMouseMove);
			this.panelbitmap.shadow = new createjs.Shadow("rgba(0,0,0,0.2)", 3, 3, 4);
			//this.panelbitmap.on("click", this.showProperties);
		}
        
		var socketpos = {
			x: this.panelbitmap.scaleX*this.panelbitmap.image.width,
			y: this.panelbitmap.scaleY*this.panelbitmap.image.height/2
		};

		var sock = this.addSocket(socketpos.x,socketpos.y,obj.goto, this, 6);
		sock.owner = this;
        
        if (obj.goto != -1) this.goto = obj.goto;

		//this.elements = [];

		if (obj.elements !== undefined) {
			for (e=0; e < obj.elements.length; e++) {
				var element = new PanelElement(obj.elements[e], this.panelbitmap);

				//this.elements.push(element);
				this.addChild(element);
				//console.log(element.children.length);
				socketpos = {
					x: element.x + element.width*element.scaleX,
					y: element.y + element.height/2*element.scaleY
				};
				sock = this.addSocket(socketpos.x, socketpos.y, element.goto, this, 3, "#fff");
				sock.owner = element;
				sock.dashes = [10,5];
			}
		}

		
	};

	Panel.prototype.showProperties = function() {
		var node = this;
		//if (currentlySelected == this) return;
		//currentlySelected = this;

		//console.log("Showing properties for node " + node.name );
		var thickness = 3;
		this.selected.graphics.f("#0099ee").dr(-thickness,-thickness,this.panelbitmap.image.width*this.panelbitmap.scaleX+thickness*2, this.panelbitmap.image.height*this.panelbitmap.scaleY+thickness*2);
		var property_panel = document.querySelector("#properties");

		var property_header = 	'<div id="object-name">' +
									'<p>' + node.name + '<span class="element-id">#' + nodeContainer.getChildIndex(node) + '</span></p>' +
								'</div>';
		property_panel.innerHTML = property_header;

		var node_name = '<div class="field labelside"><p>Name:</p><input type="text" value="' + node.name + '" id="property-name"></div>';
		property_panel.innerHTML += node_name;

		if (node instanceof Panel) {

			var panel_image = '<div class="field labeltop"><p>Image URL:</p><input type="text" value="' + node.image + '" id="property-imagepath"></div>';
			property_panel.innerHTML += panel_image;

			var panel_size = '<div class="field labelside"><p>Size:</p><ul id="property-size" class="buttons noselect">';
			
			//panel_size += '</ul></div>';
			

			//var propsize = document.querySelector("#property-size");
			for (s=1; s <= 4; s++) {
				//var li = document.createElement("li");
				//if (node.size == s) li.className = "selected";
				//li.innerHTML = s.toString();
				/*li.onclick = function() {
					console.log("set to size " + s);
					node.size = s;
					this.className = "selected";
				};*/
				//propsize.appendChild(li);
				var selected = (s == node.size) ? 'class="selected"' : '';
				panel_size += '<li ' + selected + ' onclick="currentlySelected.changeSize(' + s.toString() + ')">' + s.toString() + '</li>';
			}
			panel_size += '</ul></div>';
			property_panel.innerHTML += panel_size;

			var delete_button = '<div class="field"><input id="delete" class="button delete-button" type="submit" value="Delete Panel"></div>';
			property_panel.innerHTML += delete_button;
			document.querySelector("#delete").onclick = function() {
				console.log("lol");
				nodeContainer.removeChild(currentlySelected);
			};

			var propname = document.querySelector("#property-name");
			propname.onchange = function() {
				node.name = propname.value;
				var prophead = document.querySelector("#object-name");
				prophead.innerHTML = '<div id="object-name">' +
									'<p>' + node.name + '<span class="element-id">#' + nodeContainer.getChildIndex(node) + '</span></p>' +
								'</div>';
			}

			propname.onkeyup = function() {
				//console.log(proptext.value);
				node.name = propname.value;
				var prophead = document.querySelector("#object-name");
				prophead.innerHTML = '<div id="object-name">' +
									'<p>' + node.name + '<span class="element-id">#' + nodeContainer.getChildIndex(node) + '</span></p>' +
								'</div>';
			};

			var propimage = document.querySelector("#property-imagepath");
			propimage.onchange = function() {
				//node.image = propimage.value;
				var img = new Image();
				img.src = propimage.value;
				img.onload = function() {
					node.image = propimage.value;
					node.panelbitmap.image = img;
					node.selected.graphics.clear();
					var thickness = 3;
					node.selected.graphics.f("#0099ee").dr(-thickness,-thickness,node.panelbitmap.image.width*node.panelbitmap.scaleX+thickness*2, node.panelbitmap.image.height*node.panelbitmap.scaleY+thickness*2);
				}
				img.onerror = function() {
					var dialog = document.querySelector("#dialog");
					dialog.innerHTML = "<p>'" + propimage.value + "' could not be loaded<p>";
					//dialog.style.top = "50%";
					//dialog.style.left = "50%";
					dialog.style.opacity = "0.8";
					dialog.style.backgroundColor = "#522";
					setTimeout(function() {
						dialog.style.opacity = "0";
					}, 2000);
				}
			};
		}
		
	};

	Panel.prototype.removeChild = function(child) {
		var view = document.querySelector("#view");
		var elm = child.children[1].htmlElement;
		console.log(elm);
		view.removeChild(elm);
		this.Node_removeChild(child);
		drawAllConnections();
	}

	Panel.prototype.changeSize = function(size) {
		this.size = size;
		var scale = 0.25;
		scale = this.size*400*scale / this.panelbitmap.image.width;
		this.panelbitmap.scaleX = scale;
		this.panelbitmap.scaleY = scale;
		var ps = document.querySelector("#property-size");
		for (s=0; s < ps.children.length; s++) {
			ps.children[s].className = (s+1 == this.size) ? "selected" : "";
		}
		this.selected.graphics.clear();
		var thickness = 3;
		this.selected.graphics.f("#0099ee").dr(-thickness,-thickness,this.panelbitmap.image.width*this.panelbitmap.scaleX+thickness*2, this.panelbitmap.image.height*this.panelbitmap.scaleY+thickness*2);
	};

	window.Panel = createjs.promote(Panel, "Node");

	// ------------ //
	// PanelElement //
	// ------------ //

	function PanelElement(obj, bitmap) {
		this.Container_constructor();
		this.panelbitmap = bitmap;
		this.setup(obj);
	} createjs.extend(PanelElement, createjs.Container);

	PanelElement.prototype.setup = function(obj) {
		if (obj.goto != -1) this.goto = obj.goto;
		//this.type = obj.type;
		this.align = obj.align;
		this.bubble_type = obj.bubble_type;
		this.text = obj.text;
        this.position = obj.position;

		//var panel = panels[i];
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

		//document.querySelector("#view").appendChild(div);

		


		this.scaleX = 0.6;
		this.scaleY = 0.6;

		this.x = sb.position.x * this.panelbitmap.image.width*this.panelbitmap.scaleX;
		this.y = sb.position.y * this.panelbitmap.image.height*this.panelbitmap.scaleY;
		//this.x = elm.x;
		//this.y = elm.y;
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
		//this.addChild(hitshape);
		this.on("mousedown", this.setDragOffset);
		this.on("pressmove", this.dragElement);
		//this.on("click", this.showProperties);
		//elm.regY = elm.getBounds().height;
		//elements.addChild(elm);
	};

	PanelElement.prototype.updateElement = function() {
		var element = this.children[1].htmlElement; 
		element.innerHTML = '<p>' + this.text.replace(/\n/g, "<br>") + '</p>';
		this.width = element.clientWidth;
		this.height = element.clientHeight;
		this.regX = element.clientWidth/2;
		this.regY = element.clientHeight;

		/*var image = "";
		var bubble_size = "medium";
		if (this.text.length < 4) {
			bubble_size = "small";
		}
		var bubble_orient = this.bubble_type;
		image += bubble_size;
		if (bubble_orient == "box") {
			image += "_box.png";
		}
		else image += "_bubble_" + bubble_orient + ".png";
		element.style.backgroundImage = "url(\"game/img/bubbles/"+image+"\")";*/
		element.style.backgroundImage = this.image;

		if (this.align !== undefined && this.align.x == "right") {
			this.regX = element.clientWidth;
		}
	};

	PanelElement.prototype.showProperties = function() {
		var node = this;
		//if (currentlySelected == this) return;
		//currentlySelected = this;

		//console.log("Showing properties for node " + node.name );

		var property_panel = document.querySelector("#properties");

		var property_header = 	'<div id="object-name">' +
									'<p>' + node.parent.name + '<span class="element-id">' + node.parent.constructor.name + ' #' + nodeContainer.getChildIndex(node.parent) + ' - ' + node.constructor.name + '</span></p>' +
								'</div>';
		property_panel.innerHTML = property_header;

		//var node_name = '<div class="field labelside"><p>Name:</p><input type="text" value="' + node.name + '" id="property-name"></div>';
		//property_panel.innerHTML += node_name;

		var prop_image = '<div class="field labeltop"><p>Image URL:</p><input type="text" value="' + node.image + '" id="property-imagepath"></div>';
		property_panel.innerHTML += prop_image;

		console.log("Yo!");

		document.querySelector("#property-imagepath").onchange = function() {
			console.log("Whut!");
			//node.image = propimage.value;
			var img = new Image();
			img.src = propimage.value;
			img.onload = function() {
				node.image = propimage.value;
				node.updateElement();
				//node.panelbitmap.image = img;
				//node.selected.graphics.clear();
				//var thickness = 3;
				//node.selected.graphics.f("#0099ee").dr(-thickness,-thickness,node.panelbitmap.image.width*node.panelbitmap.scaleX+thickness*2, node.panelbitmap.image.height*node.panelbitmap.scaleY+thickness*2);
			}
			img.onerror = function() {
				var dialog = document.querySelector("#dialog");
				dialog.innerHTML = "<p>'" + propimage.value + "' could not be loaded<p>";
				//dialog.style.top = "50%";
				//dialog.style.left = "50%";
				dialog.style.opacity = "0.8";
				dialog.style.backgroundColor = "#522";
				setTimeout(function() {
					dialog.style.opacity = "0";
				}, 2000);
			}
		};

		var prop_text = '<div class="field labeltop"><p>Text:</p><textarea id="property-text">' +
		node.text +
		'</textarea></div>';

		//var panel_image = '<div class="field labeltop"><p>Image URL:</p><input type="text" value="' + node.image + '" id="property-imagepath"></div>';
		property_panel.innerHTML += prop_text;

		//var panel_size = '<div class="field labelside"><p>Size:</p><ul id="property-size" class="numberbuttons noselect">';
		
		//panel_size += '</ul></div>';
		
		/*panel_size += '</ul></div>';
		property_panel.innerHTML += panel_size;*/
		/*var propname = document.querySelector("#property-name");
		propname.onchange = function() {
			node.name = propname.value;
		}*/

		var delete_button = '<div class="field"><input id="delete" class="button delete-button" type="submit" value="Delete Panel"></div>';
		property_panel.innerHTML += delete_button;
		document.querySelector("#delete").onclick = function() {
			console.log(node.parent);
			node.parent.removeChild(currentlySelected);
		};

		var proptext = document.querySelector("#property-text");
		proptext.onkeyup = function() {
			//console.log(proptext.value);
			node.text = proptext.value;
			node.updateElement();
		};

		
		
	};

	PanelElement.prototype.setDragOffset = function(evt) {
		var global = evt.target.parent.localToGlobal(evt.target.x, evt.target.y);
		dragoffset = {
			x: evt.stageX - global.x,
			y: evt.stageY - global.y
		};
		//currentlySelected = evt.target.parent;
		if (currentlySelected !== undefined && currentlySelected.selected !== undefined) currentlySelected.selected.graphics.clear();
		currentlySelected = evt.target;
		openTab("propertyTab");
		//evt.target.showProperties();
	};

	PanelElement.prototype.dragElement = function(evt) {
		//console.log("Click!");
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
        /*evt.target.position = { 
            x: local.x/evt.target.panelbitmap.image.width/evt.target.panelbitmap.scaleX*100, 
            y: local.y/evt.target.panelbitmap.image.height/evt.target.panelbitmap.scaleY*100 }*/
		evt.target.parent.drawConnections();
	};

	window.PanelElement = createjs.promote(PanelElement, "Container");


	// --------------- //
	//  NodeContainer  //
	// --------------- //

	function NodeContainer() {
		this.Container_constructor();
		this.startnode = 0;
	} createjs.extend(NodeContainer, createjs.Container);


	NodeContainer.prototype.showProperties = function() {

		//console.log(this);

		//f (currentlySelected == this) return;
		//currentlySelected = this;

		var property_panel = document.querySelector("#properties");

		var property_header = 	'<div id="object-name">' +
									'<p>Project Properties</p>' +
								'</div>';
		property_panel.innerHTML = property_header;

		var prop_startnode = '<div class="field labelside"><p>Start node:</p><input type="number" value="' + this.startnode + '" id="property-startnode"></div>';
		property_panel.innerHTML += prop_startnode;

		var propstart = document.querySelector("#property-startnode");
		var container = this;
		propstart.onchange = function() {
			console.log("Start node changed", propstart.value);
			container.startnode = propstart.value;
			console.log(container.startnode);
		};
		
	};

	NodeContainer.prototype.makeConnections = function() {

		for (i=0; i < this.children.length; i++) {
			var node = this.children[i];
			if (node.goto !== undefined) node.goto = this.getChildAt(node.goto);
			for (e=0; e < node.children.length; e++) {
				var elem = node.children[e];
				if (elem instanceof PanelElement && elem.goto !== undefined) elem.goto = this.getChildAt(elem.goto);
			}
		}

	};

	// Overwrite Container.removeChild()
	NodeContainer.prototype.removeChild = function(child) {
		var view = document.querySelector("#view");
		for (e=0; e<child.children.length; e++) {
			var elm = child.children[e];
			console.log(elm);
			if (elm instanceof PanelElement) {
				elm = elm.children[1].htmlElement;
				console.log(elm);
				view.removeChild(elm);
			}
		}
		this.Container_removeChild(child);
		drawAllConnections();
	}

	// toObject - For outputting editor parameters to a JSON object

	NodeContainer.prototype.toObject = function() {

		var output = new Object();

		output.config = {
			startnode: this.startnode
		};

		output.nodes = [];
		for (i=0; i < this.children.length; i++) {
			var ref = this.children[i];
			// cycle through all nodes, saving their data to an object
			var node = new Object();

			if (ref instanceof Panel) {
				//console.log(node.name);
				node.name = ref.name;
				node.size = ref.size;
				node.image = ref.image;
				node.goto = this.getChildIndex(ref.goto);
				if (node.goto == -1) node.goto = undefined;
				node.editor = {
					position: { x: ref.x, y: ref.y }
				};

				node.elements = [];

				for (e=0; e < ref.children.length; e++) {
					var r_elem = ref.children[e];
					if (r_elem instanceof PanelElement) {
						var elem = new Object();

						elem.type = r_elem.type;
						if (r_elem.text !== undefined) {
							elem.text = r_elem.text;
						}
						elem.bubble_type = r_elem.bubble_type;
						elem.image = r_elem.image;
						
						elem.position = {
							x:r_elem.x/(r_elem.panelbitmap.image.width*r_elem.panelbitmap.scaleX),
							y:r_elem.y/(r_elem.panelbitmap.image.height*r_elem.panelbitmap.scaleY)
						}
						if (r_elem.align !== undefined) {
							elem.align = r_elem.align;
							if (elem.align.x == "right") elem.position.x = 1 - elem.position.x;
							if (elem.align.y == "bottom") elem.position.y = 1 - elem.position.y;
						}
						elem.goto = this.getChildIndex(r_elem.goto);
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







},{"./loader.js":2}],2:[function(require,module,exports){
var fs = require('fs');
/*exports.checkPath = function(path)
{
	if (typeof path == "undefined" || path === "" ) {
		window.alert("You forgot to enter a path!");
		return false;
	}

	var filename = path.split("/").pop();
	var extension = filename.split(".").pop();

	if (extension != "json" && extension != "txt") {
		window.alert("Please specify a .json or .txt file.");
		return false;
	}

	return true;
}*/

exports.loadAllImages = function(path, callback) {
	
    var request = new XMLHttpRequest();
	request.open('GET', "./img-folder.php", true);

	request.onload = function() {
		if (request.status >= 200 && request.status < 400) {
			//document.querySelector("#properties").innerHTML = request.responseText;
			//console.log(request.responseText);
			callback(JSON.parse(request.responseText));
		} else {
		// We reached our target server, but it returned an error
		alert(request.responseText);
		return null;
		}
	};

	request.onerror = function() {
		alert(request.responseText);
	};

	request.send();
}

exports.saveJSON = function(obj, path) {
	//if (!checkPath(path)) return;

	var filename = path.split("/").pop();

	//doesFileExist(path);
	writeToFile();

	function doesFileExist(urlToFile)
	{
		var xhr = new XMLHttpRequest();
		xhr.open('HEAD', urlToFile, true);
		xhr.send();

		xhr.onload = function() {
			if (xhr.status == 404) {
				// File not found
				writeToFile();
			} else {
				// File exists
				if (window.confirm("'"+path+"' already exists.\nDo you want to overwrite it?")) writeToFile();
				else return null;
			}
		};
	}

	function writeToFile() {
		//window.alert("Writing to file! ..not really lol");
		var sendrequest = new XMLHttpRequest();
		sendrequest.onload = function() {
			if (sendrequest.status >= 200 && sendrequest.status < 400) {
                //window.alert(sendrequest.responseText);
				var dialog = document.querySelector("#dialog");
				dialog.innerHTML = "<p>'" + path + "' saved successfully<p>";
				//dialog.style.top = "50%";
				//dialog.style.left = "50%";
				dialog.style.opacity = "0.8";
				dialog.style.backgroundColor = "#333";
				setTimeout(function() {
					dialog.style.opacity = "0";
				}, 2000);
			}
			//window.alert(sendrequest.status + " - " + sendrequest.responseText);
		};
		sendrequest.open("POST","./json.php",true);
		sendrequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		//sendrequest.responseType = 'json';
		console.log(path);
		sendrequest.send("json=" + JSON.stringify(obj, null, 4) + "&path=" + path);
	}
}

exports.loadJSON = function(path, callback) {

	//if (!checkPath(path)) return;
	//clearAll();

	var request = new XMLHttpRequest();
	request.open('GET', path + '?_=' + new Date().getTime(), true);

	var mobile_small_panels = 0;

	request.onload = function() {
		if (request.status >= 200 && request.status < 400) {
			// Success!
			//panels = JSON.parse(request.responseText);
            var obj = JSON.parse(request.responseText);
            //console.log(obj);
			preloadImages(obj, callback);
			//callback(obj);
		} else {
		// We reached our target server, but it returned an error
			if (request.status == 404) window.alert("File not found!");
			else window.alert(request.responseText);
		return null;
		}
	};

	request.onerror = function() {
		alert(request.responseText);
	};

	request.send();
}

function preloadImages(obj, callback) {
	var loaded = 0;
	var images = [];
	/*images.push("img/bubbles/medium_bubble_left.png");
	images.push("img/bubbles/medium_bubble_down.png");
	images.push("img/bubbles/medium_box.png");
	images.push("img/bubbles/small_box.png");
	images.push("img/bubbles/small_bubble_down.png");
	images.push("img/bubbles/x_small_bubble_left.png");*/
	for (var i=0; i<obj.nodes.length; i++) {
		images.push(obj.nodes[i].image);
	}

	function imageLoaded() {
		loaded++;
		//console.log("Image loaded.." + loaded + "/" + images.length);
		updateProgress();
	}

	function updateProgress() {
		document.getElementById("progress_bar").style.width = (loaded/images.length * 100).toString() + "%";
		//console.log("update progress..");
		if (loaded == images.length) {
			console.log("Finished preloading images..");
			setTimeout(function() {
				document.getElementById("progress").style.opacity = "0";
			}, 100);
			callback(obj);
		}
	}

	setTimeout(function() {
		document.getElementById("progress").style.opacity = "1";
	}, 100);

	setTimeout(function() {
		// preload image
		for (var l=0; l<images.length; l++) {
			var img = new Image();
			img.src = images[l];
			img.onload = imageLoaded;
		}
	}, 50);
}
},{"fs":4}],3:[function(require,module,exports){
(function (__dirname){
var loader = require('./loader.js');
var editor = require('./editor.js');

var gamepath = __dirname + '/app/game/';


document.addEventListener("keydown", function(e) {
  if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
    e.preventDefault();
    // Process event...
      loader.saveJSON(editor.getNodes.toObject(), document.querySelector("#filepath").value);
  }
}, false);


window.onload = function() {

	document.querySelector("#load").onclick = function() {
		loader.loadJSON(document.querySelector("#filepath").value, editor.init);
	};
	document.querySelector("#save").onclick = function() {
		loader.saveJSON(editor.getNodes.toObject(), document.querySelector("#filepath").value);
	};
	//document.querySelector("#save");
	loader.loadJSON("js/panels.json", editor.init);
};
}).call(this,"/app/editor/public/js")

},{"./editor.js":1,"./loader.js":2}],4:[function(require,module,exports){

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvZWRpdG9yL3B1YmxpYy9qcy9lZGl0b3IuanMiLCJhcHAvZWRpdG9yL3B1YmxpYy9qcy9sb2FkZXIuanMiLCJhcHAvZWRpdG9yL3B1YmxpYy9qcy9tYWluLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbGliL19lbXB0eS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1aENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMzS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3pCQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvL3ZhciBjbGFzc2VzID0gcmVxdWlyZSgnLi9jbGFzc2VzLmpzJyk7XG52YXIgbG9hZGVyID0gcmVxdWlyZShcIi4vbG9hZGVyLmpzXCIpO1xuXG52YXIgcGFuZWxzO1xudmFyIGNvbmZpZztcbnZhciBzdGFnZTtcbnZhciB2aWV3Q29udGFpbmVyO1xudmFyIG5vZGVDb250YWluZXI7XG4vL3ZhciBmaXJzdExvYWQgPSB0cnVlO1xudmFyIHZpZXdTY2FsZSA9IDE7XG52YXIgZHJhZ29mZnNldCA9IHt4OjAsIHk6MH07XG4vL3ZhciBkcmFnQm94O1xudmFyIHpvb21OdW1iZXIgPSAzO1xudmFyIHpvb21TdGVwID0gWzAuMiwgMC4zLCAwLjUsIDAuNzUsIDEsIDEuNSwgMl07XG52YXIgZHJhZ2dpbmdfZWxlbWVudDtcblxudmFyIGRlZmF1bHRHYW1lUGF0aCA9IFwiXCI7XG52YXIgY29uX3IgPSA2O1xuXG5cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG4vL1x0XHRcdFx0XHRcdFx0ICAgLy9cbi8vXHRcdFx0RVhQT1JUUyAgICAgICAgICAgIC8vXG4vL1x0XHRcdFx0XHRcdFx0ICAgLy9cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbihvYmopIHtcblxuICAgIHBhbmVscyA9IG9iai5ub2RlcztcbiAgICBjb25maWcgPSBvYmouY29uZmlnO1xuICAgIFxuXHRpZiAoc3RhZ2UgPT09IHVuZGVmaW5lZCkge1xuXHRcdHN0YWdlID0gbmV3IGNyZWF0ZWpzLlN0YWdlKFwiZWRpdF9jYW52YXNcIik7XG5cdFx0Y3JlYXRlanMuVGlja2VyLnNldEZQUyg2MCk7XG5cdFx0Y3JlYXRlanMuVGlja2VyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0aWNrXCIsIHN0YWdlKTtcblx0fVxuXHRlbHNlIHtcblx0XHRzdGFnZS5yZW1vdmVBbGxDaGlsZHJlbigpO1xuXHRcdHZhciBidWJibGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5idWJibGVcIik7XG5cdFx0dmFyIHZpZXcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpZXdcIik7XG5cdFx0Zm9yICh2YXIgYj0wOyBiIDwgYnViYmxlcy5sZW5ndGg7IGIrKykge1xuXHRcdFx0dmlldy5yZW1vdmVDaGlsZChidWJibGVzW2JdKTtcblx0XHR9XG5cdH1cblxuXHQvL3ZhciBjb29sX21hZHNfbm9kZSA9IG5ldyBOb2RlKFwicGFuZWxcIik7XG5cdC8vY29vbF9tYWRzX25vZGUuYWRkU29ja2V0KHRydWUpO1xuXHQvL2NvbnNvbGUubG9nKGNvb2xfbWFkc19ub2RlIGluc3RhbmNlb2YgY3JlYXRlanMuQ29udGFpbmVyKTtcblx0Ly9jb25zb2xlLmxvZyhjb29sX21hZHNfbm9kZSBpbnN0YW5jZW9mIE5vZGUpO1xuXHQvL3N0YWdlLmNhbnZhcy53aWR0aCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcblx0Ly9zdGFnZS5jYW52YXMuaGVpZ2h0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcblxuXHRzdGFnZS5jYW52YXMud2lkdGggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpZXdcIikub2Zmc2V0V2lkdGg7XG5cdHN0YWdlLmNhbnZhcy5oZWlnaHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpZXdcIikub2Zmc2V0SGVpZ2h0O1xuXHRzdGFnZS5lbmFibGVNb3VzZU92ZXIoMTUpO1xuXHRzdGFnZS5vbihcIm1vdXNlZG93blwiLCBmdW5jdGlvbigpIHsgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7IH0pO1xuXG5cdHN0YWdlLm1vdXNlTW92ZU91dHNpZGUgPSB0cnVlO1xuXHRzdGFnZS5vbihcInN0YWdlbW91c2Vtb3ZlXCIsIHN0YWdlTW91c2VNb3ZlKTtcblxuXHRpbml0dmlld0NvbnRhaW5lcigpO1xuXHRpbml0Tm9kZXMoKTtcblxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3pvb21pblwiKS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7IHpvb20oMSkgfTtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN6b29tb3V0XCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpIHsgem9vbSgtMSkgfTtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNwcm9wZXJ0eVRhYlwiKS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7IG9wZW5UYWIoJ3Byb3BlcnR5VGFiJykgfTtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNpbWFnZXNUYWJcIikub25jbGljayA9IGZ1bmN0aW9uKCkgeyBvcGVuVGFiKCdpbWFnZXNUYWInKSB9O1xuXG5cdGZ1bmN0aW9uIHN0YWdlTW91c2VNb3ZlKGV2dCkge1xuXHRcdGlmIChkcmFnZ2luZ19lbGVtZW50ICE9PSB1bmRlZmluZWQgJiYgZHJhZ2dpbmdfZWxlbWVudCAhPT0gbnVsbCkge1xuXHRcdFx0dmFyIGxvY2FsID0gZHJhZ2dpbmdfZWxlbWVudC5wYXJlbnQuZ2xvYmFsVG9Mb2NhbChldnQuc3RhZ2VYIC0gZHJhZ29mZnNldC54LCBldnQuc3RhZ2VZIC0gZHJhZ29mZnNldC55KTtcblx0XHRcdGRyYWdnaW5nX2VsZW1lbnQueCA9IGxvY2FsLng7XG5cdFx0XHRkcmFnZ2luZ19lbGVtZW50LnkgPSBsb2NhbC55O1xuXHRcdH1cblx0fVxufVxuXG5leHBvcnRzLm5vZGVzVG9PYmplY3QgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIG5vZGVDb250YWluZXIudG9PYmplY3QoKTtcbn1cblxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vICBFRElUT1IgIC8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cbmZ1bmN0aW9uIGluaXROb2RlcygpIHtcblx0bm9kZUNvbnRhaW5lciA9IG5ldyBOb2RlQ29udGFpbmVyKCk7XG5cdG5vZGVDb250YWluZXIuc3RhcnRub2RlID0gY29uZmlnLnN0YXJ0bm9kZTtcblx0Zm9yICh2YXIgcD0wOyBwPHBhbmVscy5sZW5ndGg7cCsrKSB7XG5cdFx0dmFyIHBhbmVsID0gbmV3IFBhbmVsKHBhbmVsc1twXSk7XG5cdFx0bm9kZUNvbnRhaW5lci5hZGRDaGlsZChwYW5lbCk7XG5cdH1cblx0bm9kZUNvbnRhaW5lci5tYWtlQ29ubmVjdGlvbnMoKTtcblx0dmlld0NvbnRhaW5lci5hZGRDaGlsZChub2RlQ29udGFpbmVyKTtcblx0ZHJhd0FsbENvbm5lY3Rpb25zKCk7XG59XG5cbndpbmRvdy5vbnJlc2l6ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIHZpZXcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpZXdcIik7XG4gICAgdmFyIHNpZGViYXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3NpZGViYXJcIik7XG5cbiAgICBzdGFnZS5jYW52YXMud2lkdGggPSB2aWV3Lm9mZnNldFdpZHRoO1xuICAgIHN0YWdlLmNhbnZhcy5oZWlnaHQgPSB2aWV3Lm9mZnNldEhlaWdodDtcblxuXHRzdGFnZS5nZXRDaGlsZEJ5TmFtZShcImRyYWdCb3hcIikuZ3JhcGhpY3MuYmVnaW5GaWxsKFwiIzk5OVwiKS5kcmF3UmVjdCgwLDAsc3RhZ2UuY2FudmFzLndpZHRoLCBzdGFnZS5jYW52YXMuaGVpZ2h0KTtcbiAgICAvL3N0YWdlLnVwZGF0ZSgpO1xufTtcblxuZnVuY3Rpb24gY2xlYXJBbGwoKSB7XG5cblx0ZnVuY3Rpb24gY2xlYXJFdmVudHMoZGlzT2JqKSB7XG5cdFx0Y29uc29sZS5sb2coZGlzT2JqKTtcblx0XHRkaXNPYmoucmVtb3ZlQWxsRXZlbnRMaXN0ZW5lcnMoKTtcblx0XHRmb3IgKHZhciBpPTA7IGkgPCBkaXNPYmouY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChkaXNPYmouY2hpbGRyZW5baV0uY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRjbGVhckV2ZW50cyhkaXNPYmouY2hpbGRyZW5baV0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRpZiAoc3RhZ2UgIT09IHVuZGVmaW5lZCkgY2xlYXJFdmVudHMoc3RhZ2UpO1xufVxuXG5mdW5jdGlvbiBpbml0dmlld0NvbnRhaW5lcigpIHtcblx0dmFyIGRyYWdCb3g7XG5cblx0Ly92YXIgY29ybmVycyA9IG5ldyBjcmVhdGVqcy5TaGFwZSgpO1xuXG5cdHZpZXdDb250YWluZXIgPSBuZXcgY3JlYXRlanMuQ29udGFpbmVyKCk7XG5cdHZpZXdTY2FsZSA9IHpvb21TdGVwW3pvb21OdW1iZXJdO1xuXHR2aWV3Q29udGFpbmVyLnNjYWxlWCA9IHZpZXdTY2FsZTtcblx0dmlld0NvbnRhaW5lci5zY2FsZVkgPSB2aWV3U2NhbGU7XG5cdHZpZXdDb250YWluZXIubmFtZSA9IFwiVmlldyBDb250YWluZXJcIjtcblxuXHRmdW5jdGlvbiBkcmFnVmlldyhldnQpIHtcblx0XHQvL2NvbnNvbGUubG9nKFwiRHJhZ2dpbiB2aWV3ISBcIiArIGV2dC50YXJnZXQpO1xuXHRcdHZpZXdDb250YWluZXIueCA9IGV2dC5zdGFnZVggLSBkcmFnb2Zmc2V0Lng7XG5cdFx0dmlld0NvbnRhaW5lci55ID0gZXZ0LnN0YWdlWSAtIGRyYWdvZmZzZXQueTtcblxuXHRcdGNlbnRlclZpZXdPcmlnaW4oZXZ0LnN0YWdlWCAtIGRyYWdvZmZzZXQueCwgZXZ0LnN0YWdlWSAtIGRyYWdvZmZzZXQueSk7XG5cdH1cblxuXHRmdW5jdGlvbiBjZW50ZXJWaWV3T3JpZ2luKHgseSkge1xuXHRcdHZpZXdDb250YWluZXIucmVnWCA9ICgoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN2aWV3XCIpLm9mZnNldFdpZHRoIC0gMjgwKS8yIC0gdmlld0NvbnRhaW5lci54KS92aWV3U2NhbGU7XG5cdFx0dmlld0NvbnRhaW5lci5yZWdZID0gKChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpZXdcIikub2Zmc2V0SGVpZ2h0LzIpIC0gdmlld0NvbnRhaW5lci55KS92aWV3U2NhbGU7XG5cdFx0Ly9jb3JuZXJzLmdyYXBoaWNzLmNsZWFyKCk7XG5cdFx0Ly9jb3JuZXJzLmdyYXBoaWNzLmYoXCJyZWRcIikuZGModmlld0NvbnRhaW5lci54LHZpZXdDb250YWluZXIueSwxNSkuZihcImJsdWVcIikuZGModmlld0NvbnRhaW5lci54K3ZpZXdDb250YWluZXIucmVnWCp2aWV3U2NhbGUsIHZpZXdDb250YWluZXIueSt2aWV3Q29udGFpbmVyLnJlZ1kqdmlld1NjYWxlLCAxNSk7XG5cdFx0dmlld0NvbnRhaW5lci54ID0geCArIHZpZXdDb250YWluZXIucmVnWCAqIHZpZXdTY2FsZTtcblx0XHR2aWV3Q29udGFpbmVyLnkgPSB5ICsgdmlld0NvbnRhaW5lci5yZWdZICogdmlld1NjYWxlO1xuXHR9XG5cblx0ZHJhZ0JveCA9IG5ldyBjcmVhdGVqcy5TaGFwZShuZXcgY3JlYXRlanMuR3JhcGhpY3MoKS5iZWdpbkZpbGwoXCIjOTk5XCIpLmRyYXdSZWN0KDAsMCxzdGFnZS5jYW52YXMud2lkdGgsIHN0YWdlLmNhbnZhcy5oZWlnaHQpKTtcblx0ZHJhZ0JveC5vbihcIm1vdXNlZG93blwiLCBmdW5jdGlvbihldnQpIHtcblx0XHRpZiAoY3VycmVudGx5U2VsZWN0ZWQgIT09IHVuZGVmaW5lZCAmJiBjdXJyZW50bHlTZWxlY3RlZC5zZWxlY3RlZCAhPT0gdW5kZWZpbmVkKSBjdXJyZW50bHlTZWxlY3RlZC5zZWxlY3RlZC5ncmFwaGljcy5jbGVhcigpO1xuXHRcdGN1cnJlbnRseVNlbGVjdGVkID0gbm9kZUNvbnRhaW5lcjtcblx0XHRvcGVuVGFiKFwicHJvcGVydHlUYWJcIik7XG5cdFx0Ly9ub2RlQ29udGFpbmVyLnNob3dQcm9wZXJ0aWVzKCk7XG5cdFx0ZHJhZ29mZnNldC54ID0gZXZ0LnN0YWdlWCAtIHZpZXdDb250YWluZXIueCArIHZpZXdDb250YWluZXIucmVnWCp2aWV3U2NhbGU7XG5cdFx0ZHJhZ29mZnNldC55ID0gZXZ0LnN0YWdlWSAtIHZpZXdDb250YWluZXIueSArIHZpZXdDb250YWluZXIucmVnWSp2aWV3U2NhbGU7XG5cdH0pO1xuXHRkcmFnQm94Lm9uKFwicHJlc3Ntb3ZlXCIsIGRyYWdWaWV3KTtcblx0Ly9kcmFnQm94LmN1cnNvciA9IFwiZ3JhYlwiO1xuXHRkcmFnQm94Lm5hbWUgPSBcImRyYWdCb3hcIjtcblxuXHRzdGFnZS5hZGRDaGlsZChkcmFnQm94KTtcblx0Ly9zdGFnZS5hZGRDaGlsZChjb3JuZXJzKTtcblx0c3RhZ2UuYWRkQ2hpbGQodmlld0NvbnRhaW5lcik7XG5cblx0Y2VudGVyVmlld09yaWdpbigwLDApO1xufVxuXG5mdW5jdGlvbiBkcmF3QWxsQ29ubmVjdGlvbnMoKSB7XG5cdGZvciAodmFyIGMgPSAwOyBjIDwgbm9kZUNvbnRhaW5lci5jaGlsZHJlbi5sZW5ndGg7IGMrKykge1xuXHRcdG5vZGVDb250YWluZXIuY2hpbGRyZW5bY10uZHJhd0Nvbm5lY3Rpb25zKCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gbmV3UGFuZWwoeCwgeSwgaW1hZ2UpIHtcblx0dmFyIG9iaiA9IG5ldyBPYmplY3QoKTtcblx0b2JqLmltYWdlID0gaW1hZ2U7XG5cdG9iai5lZGl0b3IgPSBuZXcgT2JqZWN0KCk7XG5cdG9iai5lZGl0b3IucG9zaXRpb24gPSB7XG5cdFx0eDogeCxcblx0XHR5OiB5XG5cdH1cblx0bm9kZUNvbnRhaW5lci5hZGRDaGlsZChuZXcgUGFuZWwob2JqKSk7XG59XG5cbmZ1bmN0aW9uIG5ld1BhbmVsRWxlbWVudCh4LCB5LCBwYW5lbCwgaW1hZ2UpIHtcblx0dmFyIGVsbSA9IG5ldyBPYmplY3QoKTtcblx0ZWxtLnBvc2l0aW9uID0ge1xuXHRcdHg6IHgvKHBhbmVsLnBhbmVsYml0bWFwLmltYWdlLndpZHRoKnBhbmVsLnBhbmVsYml0bWFwLnNjYWxlWCksXG5cdFx0eTogeS8ocGFuZWwucGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0KnBhbmVsLnBhbmVsYml0bWFwLnNjYWxlWSlcblx0fTtcblx0Y29uc29sZS5sb2coZWxtLnBvc2l0aW9uKTtcblx0ZWxtLmltYWdlID0gaW1hZ2U7XG5cdC8vZGVmYXVsdCBhbGlnbm1lbnQgb3B0aW9uISBmb3Igbm93XG5cdGVsbS5idWJibGVfdHlwZSA9IFwiZG93blwiO1xuXHRlbG0udGV4dCA9IFwiXCI7XG5cblx0dmFyIHBhbmVsZWxlbWVudCA9IG5ldyBQYW5lbEVsZW1lbnQoZWxtLCBwYW5lbC5wYW5lbGJpdG1hcCk7XG5cblx0aWYgKHBhbmVsLmVsZW1lbnRzID09IHVuZGVmaW5lZCkgcGFuZWwuZWxlbWVudHMgPSBbXTtcblx0cGFuZWwuZWxlbWVudHMucHVzaChwYW5lbGVsZW1lbnQpO1xuXHRwYW5lbC5hZGRDaGlsZChwYW5lbGVsZW1lbnQpO1xuXG5cdHZhciBzb2NrZXRwb3MgPSB7XG5cdFx0eDogcGFuZWxlbGVtZW50LnggKyBwYW5lbGVsZW1lbnQud2lkdGgqcGFuZWxlbGVtZW50LnNjYWxlWCxcblx0XHR5OiBwYW5lbGVsZW1lbnQueSArIHBhbmVsZWxlbWVudC5oZWlnaHQvMipwYW5lbGVsZW1lbnQuc2NhbGVZXG5cdH07XG5cdHZhciBzb2NrID0gcGFuZWwuYWRkU29ja2V0KHNvY2tldHBvcy54LCBzb2NrZXRwb3MueSwgcGFuZWxlbGVtZW50LmdvdG8sIHBhbmVsLCAzLCBcIiNmZmZcIik7XG5cdHNvY2sub3duZXIgPSBwYW5lbGVsZW1lbnQ7XG5cdHNvY2tldHBvcyA9IHNvY2sub3duZXIubG9jYWxUb0xvY2FsKHNvY2sub3duZXIud2lkdGgsIHNvY2sub3duZXIuaGVpZ2h0LzIsIHNvY2sucGFyZW50KTtcblx0c29jay54ID0gc29ja2V0cG9zLng7XG5cdHNvY2sueSA9IHNvY2tldHBvcy55O1xufVxuXG5mdW5jdGlvbiB6b29tKHpvb21Nb2RpZmllcikge1xuXG5cdGlmICh6b29tTnVtYmVyICsgem9vbU1vZGlmaWVyIDwgMCB8fCB6b29tTnVtYmVyICsgem9vbU1vZGlmaWVyID49IHpvb21TdGVwLmxlbmd0aCkgcmV0dXJuO1xuXG5cdHZhciB6b29tc3BlZWQgPSAyMDA7XG5cblx0em9vbU51bWJlciArPSB6b29tTW9kaWZpZXI7XG5cdHZpZXdTY2FsZSA9IHpvb21TdGVwW3pvb21OdW1iZXJdO1xuXHRjb25zb2xlLmxvZyh2aWV3U2NhbGUpO1xuXG5cdGNyZWF0ZWpzLlR3ZWVuLmdldCh2aWV3Q29udGFpbmVyLCB7b3ZlcnJpZGU6IHRydWV9KVxuXHRcdC50byh7IHNjYWxlWDogdmlld1NjYWxlLCBzY2FsZVk6IHZpZXdTY2FsZSB9LCB6b29tc3BlZWQsIGNyZWF0ZWpzLkVhc2UuY3ViaWNPdXQpO1xuXG5cdC8qZm9yICh2YXIgYyA9IDA7IGMgPCB2aWV3Q29udGFpbmVyLmNoaWxkcmVuLmxlbmd0aDsgYysrKSB7XG5cdFx0dmFyIHBzID0gdmlld0NvbnRhaW5lci5jaGlsZHJlbltjXS5nZXRDaGlsZEJ5TmFtZShcInBhbmVsU29ja2V0XCIpO1xuXHRcdGNyZWF0ZWpzLlR3ZWVuLmdldChwcywge292ZXJyaWRlOiB0cnVlfSkudG8oe3NjYWxlWDogMSAvIHZpZXdTY2FsZSwgc2NhbGVZOiAxIC8gdmlld1NjYWxlfSwgem9vbXNwZWVkLCBjcmVhdGVqcy5FYXNlLmN1YmljT3V0KTtcblx0XHRzZXRUaW1lb3V0KGRyYXdDb25uZWN0aW9ucyh2aWV3Q29udGFpbmVyLmNoaWxkcmVuW2NdKSwgMjAwKTtcblx0fSovXG59XG5cbnZhciBjdXJyZW50bHlTZWxlY3RlZDtcbnZhciBjdXJyZW50VGFiID0gXCJwcm9wZXJ0aWVzXCI7XG5cbmZ1bmN0aW9uIG9wZW5UYWIodGFiKSB7XG5cblx0Ly9pZiAodGFiID09IGN1cnJlbnRUYWIpIHJldHVybjtcblx0Y3VycmVudFRhYiA9IHRhYjtcblxuXHRzd2l0Y2godGFiKSB7XG5cblx0XHRjYXNlIFwicHJvcGVydHlUYWJcIjpcblx0XHRjb25zb2xlLmxvZyhcImNvb2xcIik7XG5cdFx0aWYgKGN1cnJlbnRseVNlbGVjdGVkICE9PSB1bmRlZmluZWQpIHtcblx0XHQgXHRjdXJyZW50bHlTZWxlY3RlZC5zaG93UHJvcGVydGllcygpO1xuXHRcdH1cblx0XHRlbHNlIG5vZGVDb250YWluZXIuc2hvd1Byb3BlcnRpZXMoKTtcblx0XHRicmVhaztcblxuXHRcdGNhc2UgXCJpbWFnZXNUYWJcIjpcblx0XHRsb2FkZXIubG9hZEFsbEltYWdlcyhmdW5jdGlvbihvYmopIHtcblx0XHRcdHZhciBwcm9wZXJ0aWVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNwcm9wZXJ0aWVzXCIpO1xuXHRcdFx0cHJvcGVydGllcy5pbm5lckhUTUwgPSBcIlwiO1xuXHRcdFx0Zm9yIChpPTA7IGk8b2JqLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKG9ialtpXSk7XG5cdFx0XHRcdHByb3BlcnRpZXMuaW5uZXJIVE1MICs9ICc8aW1nIHdpZHRoPVwiMTAwXCIgc3R5bGU9XCJtYXJnaW4tbGVmdDoxMHB4O1wiIHNyYz1cIicgKyBvYmpbaV0ucmVwbGFjZShcIi4uL1wiLCBcIlwiKSArICdcIiBkcmFnZ2FibGU9XCJ0cnVlXCIgb25kcmFnc3RhcnQ9XCJkcmFnKGV2ZW50LCBcXCcnICsgb2JqW2ldLnJlcGxhY2UoXCIuLi9cIiwgXCJcIikgKyAnXFwnKVwiIC8+Jztcblx0XHRcdH1cblx0XHR9KTtcblx0XHRicmVhaztcblx0fVxuXG5cdHZhciB0YWJzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0YWJzXCIpO1xuXHRmb3IgKHQ9MDsgdDx0YWJzLmNoaWxkcmVuLmxlbmd0aDsgdCsrKSB7XG5cdFx0dGFicy5jaGlsZHJlblt0XS5jbGFzc05hbWUgPSAodGFicy5jaGlsZHJlblt0XS5pZCA9PSBjdXJyZW50VGFiKSA/IFwic2VsZWN0ZWRcIiA6IFwiXCI7XG5cdH1cbn1cblxuXG52YXIgc2lkZWJhckNsb3NlZCA9IGZhbHNlO1xuXG5mdW5jdGlvbiBoaWRlU2lkZWJhcigpIHtcblx0dmFyIG1pbiA9IFwiMzBweFwiO1xuXHR2YXIgbWF4ID0gXCIyODBweFwiO1xuXHRpZiAoIHNpZGViYXJDbG9zZWQgKSB7XG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzaWRlYmFyXCIpLnN0eWxlLndpZHRoID0gbWF4O1xuXHRcdHNpZGViYXJDbG9zZWQgPSBmYWxzZTtcblx0fVxuXHRlbHNlIHtcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3NpZGViYXJcIikuc3R5bGUud2lkdGggPSBtaW47XG5cdFx0c2lkZWJhckNsb3NlZCA9IHRydWU7XG5cdH1cbn1cblxuZnVuY3Rpb24gbW91c2VVcCgpIHtcblx0Y29uc29sZS5sb2coXCJNb3VzZSBVcCBvbiBIVE1MIEVsZW1lbnRcIik7XG5cdGRyYWdnaW5nX2VsZW1lbnQgPSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG1vdXNlRG93bihlbG0pIHtcblx0Y29uc29sZS5sb2coXCJNb3VzZSBEb3duIG9uIEhUTUwgRWxlbWVudFwiKTtcblx0ZHJhZ2dpbmdfZWxlbWVudCA9IGVsbTtcbn1cblxuZnVuY3Rpb24gYWxsb3dEcm9wKGV2KSB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcbn1cblxuZnVuY3Rpb24gZHJhZyhldiwgcGF0aCkge1xuICAgIGV2LmRhdGFUcmFuc2Zlci5zZXREYXRhKFwidGV4dC9wbGFpblwiLCBwYXRoKTtcbn1cblxuZnVuY3Rpb24gZHJvcChldikge1xuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKGV2LnRhcmdldCA9PSBzdGFnZS5jYW52YXMpIHtcbiAgICBcdC8vY29uc29sZS5sb2coXCJEcm9wcGVkIG9uIFNUQUdFISBDb29sIVwiLCBldi5jbGllbnRYLCBldi5jbGllbnRZKTtcbiAgICBcdHZhciBsb2NhbCA9IG5vZGVDb250YWluZXIuZ2xvYmFsVG9Mb2NhbChldi5jbGllbnRYLCBldi5jbGllbnRZKTtcbiAgICBcdC8vY29uc29sZS5sb2coZXYuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJ0ZXh0L3BsYWluXCIpKTtcbiAgICBcdHZhciBwbmwgPSBub2RlQ29udGFpbmVyLmdldE9iamVjdFVuZGVyUG9pbnQobG9jYWwueCwgbG9jYWwueSk7XG4gICAgXHRpZiAocG5sICE9PSBudWxsICYmIHBubCBpbnN0YW5jZW9mIGNyZWF0ZWpzLkJpdG1hcCkgcG5sID0gcG5sLnBhcmVudDtcbiAgICBcdC8vY29uc29sZS5sb2cocG5sKTtcbiAgICBcdGlmIChwbmwgaW5zdGFuY2VvZiBQYW5lbCkge1xuICAgIFx0XHR2YXIgcG9zID0gcG5sLmdsb2JhbFRvTG9jYWwoZXYuY2xpZW50WCwgZXYuY2xpZW50WSk7XG4gICAgXHRcdGNvbnNvbGUubG9nKHBvcyk7XG4gICAgXHRcdG5ld1BhbmVsRWxlbWVudChwb3MueCwgcG9zLnksIHBubCwgZXYuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJ0ZXh0L3BsYWluXCIpKTtcbiAgICBcdH1cbiAgICBcdGVsc2UgbmV3UGFuZWwobG9jYWwueCwgbG9jYWwueSwgZXYuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJ0ZXh0L3BsYWluXCIpKTtcbiAgICB9XG4gICAgLy92YXIgZGF0YSA9IGV2LmRhdGFUcmFuc2Zlci5nZXREYXRhKFwidGV4dFwiKTtcbiAgICAvL2V2LnRhcmdldC5hcHBlbmRDaGlsZChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkYXRhKSk7XG59XG5cblxuLyoqXG4qIFxuKlxuKlx0RWFzZWxqcyBjbGFzcyBkZWZpbml0aW9uc1xuKlxuKlxuKiovXG5cbihmdW5jdGlvbigpIHtcblxuXHQvLyAtLS0tLS0tLS0tLS0gLy9cblx0Ly8gIE5PREUgY2xhc3MgIC8vXG5cdC8vIC0tLS0tLS0tLS0tLSAvL1xuXG5cdC8vdmFyIGVkaXRvciA9IHJlcXVpcmUoJy4vZWRpdG9yLmpzJyk7XG5cblx0ZnVuY3Rpb24gTm9kZSgpIHtcblx0XHR0aGlzLkNvbnRhaW5lcl9jb25zdHJ1Y3RvcigpO1xuXHRcdHRoaXMuc29ja2V0cyA9IFtdO1xuXHR9XG5cdGNyZWF0ZWpzLmV4dGVuZChOb2RlLCBjcmVhdGVqcy5Db250YWluZXIpO1xuXG5cdE5vZGUucHJvdG90eXBlLmhhbmRsZU1vdXNlRG93biA9IGZ1bmN0aW9uKGV2dCkge1xuXHRcdGRyYWdvZmZzZXQgPSB7XG5cdFx0XHR4OiBldnQuc3RhZ2VYL3ZpZXdTY2FsZSAtIGV2dC50YXJnZXQucGFyZW50LngsXG5cdFx0XHR5OiBldnQuc3RhZ2VZL3ZpZXdTY2FsZSAtIGV2dC50YXJnZXQucGFyZW50Lnlcblx0XHR9O1xuXG5cdFx0Ly9ldnQudGFyZ2V0LmRyYWdvZmZzZXQueSA9IGV2dC5zdGFnZVkvdmlld1NjYWxlIC0gZXZ0LnRhcmdldC5wYXJlbnQueTtcblx0XHRpZiAoY3VycmVudGx5U2VsZWN0ZWQgIT09IHVuZGVmaW5lZCAmJiBjdXJyZW50bHlTZWxlY3RlZC5zZWxlY3RlZCAhPT0gdW5kZWZpbmVkKSBjdXJyZW50bHlTZWxlY3RlZC5zZWxlY3RlZC5ncmFwaGljcy5jbGVhcigpO1xuXHRcdGN1cnJlbnRseVNlbGVjdGVkID0gZXZ0LnRhcmdldC5wYXJlbnQ7XG5cdFx0b3BlblRhYihcInByb3BlcnR5VGFiXCIpO1xuXHR9O1xuXG5cdE5vZGUucHJvdG90eXBlLmhhbmRsZU1vdXNlTW92ZSA9IGZ1bmN0aW9uKGV2dCkge1xuXHRcdC8vY29uc29sZS5sb2coZXZ0LnRhcmdldCk7XG5cdFx0ZXZ0LnRhcmdldC5wYXJlbnQueCA9IGV2dC5zdGFnZVgvdmlld1NjYWxlIC0gZHJhZ29mZnNldC54O1xuXHRcdGV2dC50YXJnZXQucGFyZW50LnkgPSBldnQuc3RhZ2VZL3ZpZXdTY2FsZSAtIGRyYWdvZmZzZXQueTtcblxuXHRcdGV2dC50YXJnZXQucGFyZW50LnggPSBNYXRoLnJvdW5kKGV2dC50YXJnZXQucGFyZW50LngqMC4xKSoxMDtcblx0XHRldnQudGFyZ2V0LnBhcmVudC55ID0gTWF0aC5yb3VuZChldnQudGFyZ2V0LnBhcmVudC55KjAuMSkqMTA7XG5cblx0XHQvL2NvbnNvbGUubG9nKGV2dC50YXJnZXQucGFyZW50KTtcblx0XHQvL2RyYXdDb25uZWN0aW9ucyhldnQudGFyZ2V0LnBhcmVudCk7XG5cdFx0ZHJhd0FsbENvbm5lY3Rpb25zKCk7XG5cdH07XG5cblx0Tm9kZS5wcm90b3R5cGUuZHJhd0Nvbm5lY3Rpb25zID0gZnVuY3Rpb24oKSB7XG5cdFx0Zm9yIChzPTA7IHMgPCB0aGlzLnNvY2tldHMubGVuZ3RoOyBzKyspIHtcblx0XHRcdHZhciBzb2NrZXQgPSB0aGlzLnNvY2tldHNbc107XG5cdFx0XHRzb2NrZXQubGluZS5ncmFwaGljcy5jbGVhcigpO1xuXHRcdFx0aWYgKHNvY2tldC5vd25lciBpbnN0YW5jZW9mIFBhbmVsRWxlbWVudCkge1xuXHRcdFx0XHR2YXIgc29ja2V0cG9zID0gc29ja2V0Lm93bmVyLmxvY2FsVG9Mb2NhbChzb2NrZXQub3duZXIud2lkdGgsIHNvY2tldC5vd25lci5oZWlnaHQvMiwgc29ja2V0LnBhcmVudCk7XG5cdFx0XHRcdHNvY2tldC54ID0gc29ja2V0cG9zLng7XG5cdFx0XHRcdHNvY2tldC55ID0gc29ja2V0cG9zLnk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoc29ja2V0Lm93bmVyLmdvdG8gIT09IHVuZGVmaW5lZCAmJiB0aGlzLnBhcmVudC5jb250YWlucyhzb2NrZXQub3duZXIuZ290bykpIHtcblx0XHRcdFx0dmFyIGdvdG8gPSBzb2NrZXQub3duZXIuZ290bztcblx0XHRcdFx0dmFyIGxvY2FsID0gdGhpcy5wYXJlbnQubG9jYWxUb0xvY2FsKGdvdG8ueCwgZ290by55K2dvdG8uaGVpZ2h0LzIsIHNvY2tldCk7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAoc29ja2V0Lm93bmVyIGluc3RhbmNlb2YgUGFuZWxFbGVtZW50KSBzb2NrZXQubGluZS5ncmFwaGljcy5zKHNvY2tldC5jb2xvcikuc3Moc29ja2V0LnN0cm9rZXdpZHRoKS5zZChbMTAsNV0pLm10KDArc29ja2V0LnJhZGl1cywgMCkubHQobG9jYWwueCwgbG9jYWwueSApO1xuXHRcdFx0XHRlbHNlIHNvY2tldC5saW5lLmdyYXBoaWNzLnMoc29ja2V0LmNvbG9yKS5zcyhzb2NrZXQuc3Ryb2tld2lkdGgpLm10KDArc29ja2V0LnJhZGl1cywgMCkubHQobG9jYWwueCwgbG9jYWwueSApO1xuXHRcdFx0XHRzb2NrZXQuYWxwaGEgPSAxO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBzb2NrZXQuYWxwaGEgPSAwLjU7XG5cdFx0fVxuXHR9O1xuXG5cdE5vZGUucHJvdG90eXBlLmRyYWdMaW5lID0gZnVuY3Rpb24oZXZ0KSB7XG5cdFx0dmFyIHNvY2sgPSBldnQudGFyZ2V0LnBhcmVudDtcblx0XHR2YXIgbGluZSA9IHNvY2subGluZTtcblx0XHRsaW5lLmdyYXBoaWNzLmNsZWFyKCk7XG5cdFx0dmFyIGxvY2FsID0gbGluZS5nbG9iYWxUb0xvY2FsKGV2dC5zdGFnZVgsIGV2dC5zdGFnZVkpO1xuXHRcdGxpbmUuZ3JhcGhpY3Mucyhzb2NrLmNvbG9yKS5zcyhzb2NrLnN0cm9rZXdpZHRoKS5tdCgwK2Nvbl9yLCAwKS5sdChsb2NhbC54LGxvY2FsLnkpO1xuXHR9O1xuXG5cdE5vZGUucHJvdG90eXBlLnJlbGVhc2VMaW5lID0gZnVuY3Rpb24oZXZ0KSB7XG5cdFx0ZXZ0LnRhcmdldC5wYXJlbnQuZ290byA9IHVuZGVmaW5lZDtcblx0XHRldnQudGFyZ2V0LnBhcmVudC5vd25lci5nb3RvID0gdW5kZWZpbmVkO1xuXHRcdGV2dC50YXJnZXQucGFyZW50LmxpbmUuZ3JhcGhpY3MuY2xlYXIoKTtcblx0XHR2YXIgdGFyZyA9IHN0YWdlLmdldE9iamVjdFVuZGVyUG9pbnQoZXZ0LnN0YWdlWCwgZXZ0LnN0YWdlWSk7XG5cdFx0aWYgKHRhcmcucGFyZW50IGluc3RhbmNlb2YgTm9kZSkge1xuXHRcdFx0ZXZ0LnRhcmdldC5wYXJlbnQuZ290byA9IHRhcmcucGFyZW50O1xuXHRcdFx0ZXZ0LnRhcmdldC5wYXJlbnQub3duZXIuZ290byA9IHRhcmcucGFyZW50O1xuXHRcdH1cblx0XHRldnQudGFyZ2V0LnBhcmVudC5wYXJlbnQuZHJhd0Nvbm5lY3Rpb25zKCk7XG5cdH07XG5cblx0Tm9kZS5wcm90b3R5cGUuYWRkU29ja2V0ID0gZnVuY3Rpb24oeCwgeSwgZ290bywgYWRkVG8sIHJhZGl1cywgY29sb3IpIHtcblx0XHR2YXIgc29ja2V0ID0gbmV3IGNyZWF0ZWpzLkNvbnRhaW5lcigpO1xuXHRcdHNvY2tldC5zaGFwZSA9IG5ldyBjcmVhdGVqcy5TaGFwZSgpO1xuXHRcdHNvY2tldC5saW5lID0gbmV3IGNyZWF0ZWpzLlNoYXBlKCk7XG5cdFx0c29ja2V0LnJhZGl1cyA9IHJhZGl1cztcblxuXHRcdHNvY2tldC54ID0geDtcblx0XHRzb2NrZXQueSA9IHk7XG5cblx0XHRpZiAoY29sb3IgIT09IHVuZGVmaW5lZCkgc29ja2V0LmNvbG9yID0gY29sb3I7XG5cdFx0ZWxzZSBzb2NrZXQuY29sb3IgPSBcIiMwMDBcIjtcblxuXHRcdGlmIChjb2xvciA9PSBcIiNmZmZcIikgdGhpcy5iZ19jb2xvciA9IFwiIzAwMFwiO1xuXHRcdGVsc2UgdGhpcy5iZ19jb2xvciA9IFwiI2ZmZlwiO1xuXG5cdFx0dmFyIHIgPSBzb2NrZXQucmFkaXVzO1xuXHRcdHNvY2tldC5zaGFwZS5yZWdZID0gcjtcblx0XHRzb2NrZXQuc2hhcGUucmVnWCA9IDA7XG5cblx0XHRzb2NrZXQuc2hhcGUuZ3JhcGhpY3MuZih0aGlzLmJnX2NvbG9yKS5kYyhyLHIscikuZihzb2NrZXQuY29sb3IpLmRjKHIscixyLXIvMyk7XG5cdFx0Ly9zb2NrZXQuc2hhcGUuc2NhbGVYID0gMTtcblx0XHQvL3NvY2tldC5zaGFwZS5zY2FsZVkgPSAxO1xuXG5cdFx0c29ja2V0LnN0cm9rZXdpZHRoID0gc29ja2V0LnJhZGl1cy8yO1xuXHRcdHNvY2tldC5jdXJzb3IgPSBcInBvaW50ZXJcIjtcblxuXHRcdHNvY2tldC5nb3RvID0gZ290bztcblxuXHRcdHNvY2tldC5hZGRDaGlsZChzb2NrZXQuc2hhcGUsIHNvY2tldC5saW5lKTtcblxuXHRcdHNvY2tldC5vbihcInByZXNzbW92ZVwiLCB0aGlzLmRyYWdMaW5lKTtcblx0XHRzb2NrZXQub24oXCJwcmVzc3VwXCIsIHRoaXMucmVsZWFzZUxpbmUpO1xuXG5cdFx0dGhpcy5zb2NrZXRzLnB1c2goc29ja2V0KTtcblx0XHRpZiAoYWRkVG8gPT09IHVuZGVmaW5lZCkgdGhpcy5hZGRDaGlsZChzb2NrZXQpO1xuXHRcdGVsc2UgYWRkVG8uYWRkQ2hpbGQoc29ja2V0KTtcblxuXHRcdHJldHVybiBzb2NrZXQ7XG5cdH07XG5cblx0d2luZG93Lk5vZGUgPSBjcmVhdGVqcy5wcm9tb3RlKE5vZGUsIFwiQ29udGFpbmVyXCIpO1xuXG5cdC8vXG5cdC8vIFBBTkVMIGNsYXNzXG5cdC8vXG5cblx0ZnVuY3Rpb24gUGFuZWwob2JqKSB7XG5cdFx0dGhpcy5Ob2RlX2NvbnN0cnVjdG9yKCk7XG5cdFx0Ly90aGlzLnNvY2tldHMgPSBbXTtcblx0XHR0aGlzLnNldHVwKG9iaik7XG5cdH1cblx0Y3JlYXRlanMuZXh0ZW5kKFBhbmVsLCBOb2RlKTtcblxuXHRQYW5lbC5wcm90b3R5cGUuc2V0dXAgPSBmdW5jdGlvbihvYmopIHtcblx0XHR0aGlzLm5hbWUgPSBvYmoubmFtZTtcblx0XHRpZiAob2JqLmVkaXRvciAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR0aGlzLnggPSBvYmouZWRpdG9yLnBvc2l0aW9uLng7XG5cdFx0XHR0aGlzLnkgPSBvYmouZWRpdG9yLnBvc2l0aW9uLnk7XG5cdFx0fVxuXHRcdHRoaXMuc2VsZWN0ZWQgPSBuZXcgY3JlYXRlanMuU2hhcGUoKTtcblx0XHR0aGlzLmFkZENoaWxkKHRoaXMuc2VsZWN0ZWQpO1xuXG5cdFx0aWYgKG9iai5pbWFnZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR0aGlzLnBhbmVsYml0bWFwID0gbmV3IGNyZWF0ZWpzLkJpdG1hcChvYmouaW1hZ2UpO1xuICAgICAgICAgICAgdGhpcy5pbWFnZSA9IG9iai5pbWFnZTtcblx0XHRcdHZhciBzY2FsZSA9IDAuMjU7XG5cdFx0XHQvL2lmIChwYW5lbHNbaV0uc2l6ZSA9PSA0KSBzY2FsZSA9IDAuMzU7XG4gICAgICAgICAgICBpZiAob2JqLnNpemUgPT09IHVuZGVmaW5lZCkgdGhpcy5zaXplID0gMTtcbiAgICAgICAgICAgIGVsc2UgdGhpcy5zaXplID0gb2JqLnNpemU7XG5cdFx0XHRzY2FsZSA9IHRoaXMuc2l6ZSo0MDAqc2NhbGUgLyB0aGlzLnBhbmVsYml0bWFwLmltYWdlLndpZHRoO1xuXHRcdFx0dGhpcy5wYW5lbGJpdG1hcC5zY2FsZVggPSBzY2FsZTtcblx0XHRcdHRoaXMucGFuZWxiaXRtYXAuc2NhbGVZID0gc2NhbGU7XG5cdFx0XHR0aGlzLndpZHRoID0gdGhpcy5wYW5lbGJpdG1hcC5pbWFnZS53aWR0aCp0aGlzLnBhbmVsYml0bWFwLnNjYWxlWDtcblx0XHRcdHRoaXMuaGVpZ2h0ID0gdGhpcy5wYW5lbGJpdG1hcC5pbWFnZS5oZWlnaHQqdGhpcy5wYW5lbGJpdG1hcC5zY2FsZVk7XG5cdFx0XHQvL3RoaXMucGFuZWxiaXRtYXAub24oXCJtb3VzZWRvd25cIiwgaGFuZGxlTW91c2VEb3duKTtcblx0XHRcdC8vdGhpcy5wYW5lbGJpdG1hcC5vbihcInByZXNzbW92ZVwiLCBoYW5kbGVNb3VzZU1vdmUpO1xuXHRcdFx0Ly90aGlzLnBhbmVsYml0bWFwLm9uKFwicHJlc3N1cFwiLCBoYW5kbGVNb3VzZVVwKTtcblx0XHRcdHRoaXMucGFuZWxiaXRtYXAuY3Vyc29yID0gXCJtb3ZlXCI7XG5cdFx0XHR0aGlzLmFkZENoaWxkKHRoaXMucGFuZWxiaXRtYXApO1xuXHRcdFx0dGhpcy5wYW5lbGJpdG1hcC5vbihcIm1vdXNlZG93blwiLCB0aGlzLmhhbmRsZU1vdXNlRG93bik7XG5cdFx0XHR0aGlzLnBhbmVsYml0bWFwLm9uKFwicHJlc3Ntb3ZlXCIsIHRoaXMuaGFuZGxlTW91c2VNb3ZlKTtcblx0XHRcdHRoaXMucGFuZWxiaXRtYXAuc2hhZG93ID0gbmV3IGNyZWF0ZWpzLlNoYWRvdyhcInJnYmEoMCwwLDAsMC4yKVwiLCAzLCAzLCA0KTtcblx0XHRcdC8vdGhpcy5wYW5lbGJpdG1hcC5vbihcImNsaWNrXCIsIHRoaXMuc2hvd1Byb3BlcnRpZXMpO1xuXHRcdH1cbiAgICAgICAgXG5cdFx0dmFyIHNvY2tldHBvcyA9IHtcblx0XHRcdHg6IHRoaXMucGFuZWxiaXRtYXAuc2NhbGVYKnRoaXMucGFuZWxiaXRtYXAuaW1hZ2Uud2lkdGgsXG5cdFx0XHR5OiB0aGlzLnBhbmVsYml0bWFwLnNjYWxlWSp0aGlzLnBhbmVsYml0bWFwLmltYWdlLmhlaWdodC8yXG5cdFx0fTtcblxuXHRcdHZhciBzb2NrID0gdGhpcy5hZGRTb2NrZXQoc29ja2V0cG9zLngsc29ja2V0cG9zLnksb2JqLmdvdG8sIHRoaXMsIDYpO1xuXHRcdHNvY2sub3duZXIgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgaWYgKG9iai5nb3RvICE9IC0xKSB0aGlzLmdvdG8gPSBvYmouZ290bztcblxuXHRcdC8vdGhpcy5lbGVtZW50cyA9IFtdO1xuXG5cdFx0aWYgKG9iai5lbGVtZW50cyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRmb3IgKGU9MDsgZSA8IG9iai5lbGVtZW50cy5sZW5ndGg7IGUrKykge1xuXHRcdFx0XHR2YXIgZWxlbWVudCA9IG5ldyBQYW5lbEVsZW1lbnQob2JqLmVsZW1lbnRzW2VdLCB0aGlzLnBhbmVsYml0bWFwKTtcblxuXHRcdFx0XHQvL3RoaXMuZWxlbWVudHMucHVzaChlbGVtZW50KTtcblx0XHRcdFx0dGhpcy5hZGRDaGlsZChlbGVtZW50KTtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhlbGVtZW50LmNoaWxkcmVuLmxlbmd0aCk7XG5cdFx0XHRcdHNvY2tldHBvcyA9IHtcblx0XHRcdFx0XHR4OiBlbGVtZW50LnggKyBlbGVtZW50LndpZHRoKmVsZW1lbnQuc2NhbGVYLFxuXHRcdFx0XHRcdHk6IGVsZW1lbnQueSArIGVsZW1lbnQuaGVpZ2h0LzIqZWxlbWVudC5zY2FsZVlcblx0XHRcdFx0fTtcblx0XHRcdFx0c29jayA9IHRoaXMuYWRkU29ja2V0KHNvY2tldHBvcy54LCBzb2NrZXRwb3MueSwgZWxlbWVudC5nb3RvLCB0aGlzLCAzLCBcIiNmZmZcIik7XG5cdFx0XHRcdHNvY2sub3duZXIgPSBlbGVtZW50O1xuXHRcdFx0XHRzb2NrLmRhc2hlcyA9IFsxMCw1XTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRcblx0fTtcblxuXHRQYW5lbC5wcm90b3R5cGUuc2hvd1Byb3BlcnRpZXMgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgbm9kZSA9IHRoaXM7XG5cdFx0Ly9pZiAoY3VycmVudGx5U2VsZWN0ZWQgPT0gdGhpcykgcmV0dXJuO1xuXHRcdC8vY3VycmVudGx5U2VsZWN0ZWQgPSB0aGlzO1xuXG5cdFx0Ly9jb25zb2xlLmxvZyhcIlNob3dpbmcgcHJvcGVydGllcyBmb3Igbm9kZSBcIiArIG5vZGUubmFtZSApO1xuXHRcdHZhciB0aGlja25lc3MgPSAzO1xuXHRcdHRoaXMuc2VsZWN0ZWQuZ3JhcGhpY3MuZihcIiMwMDk5ZWVcIikuZHIoLXRoaWNrbmVzcywtdGhpY2tuZXNzLHRoaXMucGFuZWxiaXRtYXAuaW1hZ2Uud2lkdGgqdGhpcy5wYW5lbGJpdG1hcC5zY2FsZVgrdGhpY2tuZXNzKjIsIHRoaXMucGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0KnRoaXMucGFuZWxiaXRtYXAuc2NhbGVZK3RoaWNrbmVzcyoyKTtcblx0XHR2YXIgcHJvcGVydHlfcGFuZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnRpZXNcIik7XG5cblx0XHR2YXIgcHJvcGVydHlfaGVhZGVyID0gXHQnPGRpdiBpZD1cIm9iamVjdC1uYW1lXCI+JyArXG5cdFx0XHRcdFx0XHRcdFx0XHQnPHA+JyArIG5vZGUubmFtZSArICc8c3BhbiBjbGFzcz1cImVsZW1lbnQtaWRcIj4jJyArIG5vZGVDb250YWluZXIuZ2V0Q2hpbGRJbmRleChub2RlKSArICc8L3NwYW4+PC9wPicgK1xuXHRcdFx0XHRcdFx0XHRcdCc8L2Rpdj4nO1xuXHRcdHByb3BlcnR5X3BhbmVsLmlubmVySFRNTCA9IHByb3BlcnR5X2hlYWRlcjtcblxuXHRcdHZhciBub2RlX25hbWUgPSAnPGRpdiBjbGFzcz1cImZpZWxkIGxhYmVsc2lkZVwiPjxwPk5hbWU6PC9wPjxpbnB1dCB0eXBlPVwidGV4dFwiIHZhbHVlPVwiJyArIG5vZGUubmFtZSArICdcIiBpZD1cInByb3BlcnR5LW5hbWVcIj48L2Rpdj4nO1xuXHRcdHByb3BlcnR5X3BhbmVsLmlubmVySFRNTCArPSBub2RlX25hbWU7XG5cblx0XHRpZiAobm9kZSBpbnN0YW5jZW9mIFBhbmVsKSB7XG5cblx0XHRcdHZhciBwYW5lbF9pbWFnZSA9ICc8ZGl2IGNsYXNzPVwiZmllbGQgbGFiZWx0b3BcIj48cD5JbWFnZSBVUkw6PC9wPjxpbnB1dCB0eXBlPVwidGV4dFwiIHZhbHVlPVwiJyArIG5vZGUuaW1hZ2UgKyAnXCIgaWQ9XCJwcm9wZXJ0eS1pbWFnZXBhdGhcIj48L2Rpdj4nO1xuXHRcdFx0cHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MICs9IHBhbmVsX2ltYWdlO1xuXG5cdFx0XHR2YXIgcGFuZWxfc2l6ZSA9ICc8ZGl2IGNsYXNzPVwiZmllbGQgbGFiZWxzaWRlXCI+PHA+U2l6ZTo8L3A+PHVsIGlkPVwicHJvcGVydHktc2l6ZVwiIGNsYXNzPVwiYnV0dG9ucyBub3NlbGVjdFwiPic7XG5cdFx0XHRcblx0XHRcdC8vcGFuZWxfc2l6ZSArPSAnPC91bD48L2Rpdj4nO1xuXHRcdFx0XG5cblx0XHRcdC8vdmFyIHByb3BzaXplID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNwcm9wZXJ0eS1zaXplXCIpO1xuXHRcdFx0Zm9yIChzPTE7IHMgPD0gNDsgcysrKSB7XG5cdFx0XHRcdC8vdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuXHRcdFx0XHQvL2lmIChub2RlLnNpemUgPT0gcykgbGkuY2xhc3NOYW1lID0gXCJzZWxlY3RlZFwiO1xuXHRcdFx0XHQvL2xpLmlubmVySFRNTCA9IHMudG9TdHJpbmcoKTtcblx0XHRcdFx0LypsaS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coXCJzZXQgdG8gc2l6ZSBcIiArIHMpO1xuXHRcdFx0XHRcdG5vZGUuc2l6ZSA9IHM7XG5cdFx0XHRcdFx0dGhpcy5jbGFzc05hbWUgPSBcInNlbGVjdGVkXCI7XG5cdFx0XHRcdH07Ki9cblx0XHRcdFx0Ly9wcm9wc2l6ZS5hcHBlbmRDaGlsZChsaSk7XG5cdFx0XHRcdHZhciBzZWxlY3RlZCA9IChzID09IG5vZGUuc2l6ZSkgPyAnY2xhc3M9XCJzZWxlY3RlZFwiJyA6ICcnO1xuXHRcdFx0XHRwYW5lbF9zaXplICs9ICc8bGkgJyArIHNlbGVjdGVkICsgJyBvbmNsaWNrPVwiY3VycmVudGx5U2VsZWN0ZWQuY2hhbmdlU2l6ZSgnICsgcy50b1N0cmluZygpICsgJylcIj4nICsgcy50b1N0cmluZygpICsgJzwvbGk+Jztcblx0XHRcdH1cblx0XHRcdHBhbmVsX3NpemUgKz0gJzwvdWw+PC9kaXY+Jztcblx0XHRcdHByb3BlcnR5X3BhbmVsLmlubmVySFRNTCArPSBwYW5lbF9zaXplO1xuXG5cdFx0XHR2YXIgZGVsZXRlX2J1dHRvbiA9ICc8ZGl2IGNsYXNzPVwiZmllbGRcIj48aW5wdXQgaWQ9XCJkZWxldGVcIiBjbGFzcz1cImJ1dHRvbiBkZWxldGUtYnV0dG9uXCIgdHlwZT1cInN1Ym1pdFwiIHZhbHVlPVwiRGVsZXRlIFBhbmVsXCI+PC9kaXY+Jztcblx0XHRcdHByb3BlcnR5X3BhbmVsLmlubmVySFRNTCArPSBkZWxldGVfYnV0dG9uO1xuXHRcdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNkZWxldGVcIikub25jbGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcImxvbFwiKTtcblx0XHRcdFx0bm9kZUNvbnRhaW5lci5yZW1vdmVDaGlsZChjdXJyZW50bHlTZWxlY3RlZCk7XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgcHJvcG5hbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnR5LW5hbWVcIik7XG5cdFx0XHRwcm9wbmFtZS5vbmNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRub2RlLm5hbWUgPSBwcm9wbmFtZS52YWx1ZTtcblx0XHRcdFx0dmFyIHByb3BoZWFkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNvYmplY3QtbmFtZVwiKTtcblx0XHRcdFx0cHJvcGhlYWQuaW5uZXJIVE1MID0gJzxkaXYgaWQ9XCJvYmplY3QtbmFtZVwiPicgK1xuXHRcdFx0XHRcdFx0XHRcdFx0JzxwPicgKyBub2RlLm5hbWUgKyAnPHNwYW4gY2xhc3M9XCJlbGVtZW50LWlkXCI+IycgKyBub2RlQ29udGFpbmVyLmdldENoaWxkSW5kZXgobm9kZSkgKyAnPC9zcGFuPjwvcD4nICtcblx0XHRcdFx0XHRcdFx0XHQnPC9kaXY+Jztcblx0XHRcdH1cblxuXHRcdFx0cHJvcG5hbWUub25rZXl1cCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKHByb3B0ZXh0LnZhbHVlKTtcblx0XHRcdFx0bm9kZS5uYW1lID0gcHJvcG5hbWUudmFsdWU7XG5cdFx0XHRcdHZhciBwcm9waGVhZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjb2JqZWN0LW5hbWVcIik7XG5cdFx0XHRcdHByb3BoZWFkLmlubmVySFRNTCA9ICc8ZGl2IGlkPVwib2JqZWN0LW5hbWVcIj4nICtcblx0XHRcdFx0XHRcdFx0XHRcdCc8cD4nICsgbm9kZS5uYW1lICsgJzxzcGFuIGNsYXNzPVwiZWxlbWVudC1pZFwiPiMnICsgbm9kZUNvbnRhaW5lci5nZXRDaGlsZEluZGV4KG5vZGUpICsgJzwvc3Bhbj48L3A+JyArXG5cdFx0XHRcdFx0XHRcdFx0JzwvZGl2Pic7XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgcHJvcGltYWdlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNwcm9wZXJ0eS1pbWFnZXBhdGhcIik7XG5cdFx0XHRwcm9waW1hZ2Uub25jaGFuZ2UgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0Ly9ub2RlLmltYWdlID0gcHJvcGltYWdlLnZhbHVlO1xuXHRcdFx0XHR2YXIgaW1nID0gbmV3IEltYWdlKCk7XG5cdFx0XHRcdGltZy5zcmMgPSBwcm9waW1hZ2UudmFsdWU7XG5cdFx0XHRcdGltZy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRub2RlLmltYWdlID0gcHJvcGltYWdlLnZhbHVlO1xuXHRcdFx0XHRcdG5vZGUucGFuZWxiaXRtYXAuaW1hZ2UgPSBpbWc7XG5cdFx0XHRcdFx0bm9kZS5zZWxlY3RlZC5ncmFwaGljcy5jbGVhcigpO1xuXHRcdFx0XHRcdHZhciB0aGlja25lc3MgPSAzO1xuXHRcdFx0XHRcdG5vZGUuc2VsZWN0ZWQuZ3JhcGhpY3MuZihcIiMwMDk5ZWVcIikuZHIoLXRoaWNrbmVzcywtdGhpY2tuZXNzLG5vZGUucGFuZWxiaXRtYXAuaW1hZ2Uud2lkdGgqbm9kZS5wYW5lbGJpdG1hcC5zY2FsZVgrdGhpY2tuZXNzKjIsIG5vZGUucGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0Km5vZGUucGFuZWxiaXRtYXAuc2NhbGVZK3RoaWNrbmVzcyoyKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpbWcub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHZhciBkaWFsb2cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2RpYWxvZ1wiKTtcblx0XHRcdFx0XHRkaWFsb2cuaW5uZXJIVE1MID0gXCI8cD4nXCIgKyBwcm9waW1hZ2UudmFsdWUgKyBcIicgY291bGQgbm90IGJlIGxvYWRlZDxwPlwiO1xuXHRcdFx0XHRcdC8vZGlhbG9nLnN0eWxlLnRvcCA9IFwiNTAlXCI7XG5cdFx0XHRcdFx0Ly9kaWFsb2cuc3R5bGUubGVmdCA9IFwiNTAlXCI7XG5cdFx0XHRcdFx0ZGlhbG9nLnN0eWxlLm9wYWNpdHkgPSBcIjAuOFwiO1xuXHRcdFx0XHRcdGRpYWxvZy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcIiM1MjJcIjtcblx0XHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0ZGlhbG9nLnN0eWxlLm9wYWNpdHkgPSBcIjBcIjtcblx0XHRcdFx0XHR9LCAyMDAwKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cdFx0XG5cdH07XG5cblx0UGFuZWwucHJvdG90eXBlLnJlbW92ZUNoaWxkID0gZnVuY3Rpb24oY2hpbGQpIHtcblx0XHR2YXIgdmlldyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdmlld1wiKTtcblx0XHR2YXIgZWxtID0gY2hpbGQuY2hpbGRyZW5bMV0uaHRtbEVsZW1lbnQ7XG5cdFx0Y29uc29sZS5sb2coZWxtKTtcblx0XHR2aWV3LnJlbW92ZUNoaWxkKGVsbSk7XG5cdFx0dGhpcy5Ob2RlX3JlbW92ZUNoaWxkKGNoaWxkKTtcblx0XHRkcmF3QWxsQ29ubmVjdGlvbnMoKTtcblx0fVxuXG5cdFBhbmVsLnByb3RvdHlwZS5jaGFuZ2VTaXplID0gZnVuY3Rpb24oc2l6ZSkge1xuXHRcdHRoaXMuc2l6ZSA9IHNpemU7XG5cdFx0dmFyIHNjYWxlID0gMC4yNTtcblx0XHRzY2FsZSA9IHRoaXMuc2l6ZSo0MDAqc2NhbGUgLyB0aGlzLnBhbmVsYml0bWFwLmltYWdlLndpZHRoO1xuXHRcdHRoaXMucGFuZWxiaXRtYXAuc2NhbGVYID0gc2NhbGU7XG5cdFx0dGhpcy5wYW5lbGJpdG1hcC5zY2FsZVkgPSBzY2FsZTtcblx0XHR2YXIgcHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnR5LXNpemVcIik7XG5cdFx0Zm9yIChzPTA7IHMgPCBwcy5jaGlsZHJlbi5sZW5ndGg7IHMrKykge1xuXHRcdFx0cHMuY2hpbGRyZW5bc10uY2xhc3NOYW1lID0gKHMrMSA9PSB0aGlzLnNpemUpID8gXCJzZWxlY3RlZFwiIDogXCJcIjtcblx0XHR9XG5cdFx0dGhpcy5zZWxlY3RlZC5ncmFwaGljcy5jbGVhcigpO1xuXHRcdHZhciB0aGlja25lc3MgPSAzO1xuXHRcdHRoaXMuc2VsZWN0ZWQuZ3JhcGhpY3MuZihcIiMwMDk5ZWVcIikuZHIoLXRoaWNrbmVzcywtdGhpY2tuZXNzLHRoaXMucGFuZWxiaXRtYXAuaW1hZ2Uud2lkdGgqdGhpcy5wYW5lbGJpdG1hcC5zY2FsZVgrdGhpY2tuZXNzKjIsIHRoaXMucGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0KnRoaXMucGFuZWxiaXRtYXAuc2NhbGVZK3RoaWNrbmVzcyoyKTtcblx0fTtcblxuXHR3aW5kb3cuUGFuZWwgPSBjcmVhdGVqcy5wcm9tb3RlKFBhbmVsLCBcIk5vZGVcIik7XG5cblx0Ly8gLS0tLS0tLS0tLS0tIC8vXG5cdC8vIFBhbmVsRWxlbWVudCAvL1xuXHQvLyAtLS0tLS0tLS0tLS0gLy9cblxuXHRmdW5jdGlvbiBQYW5lbEVsZW1lbnQob2JqLCBiaXRtYXApIHtcblx0XHR0aGlzLkNvbnRhaW5lcl9jb25zdHJ1Y3RvcigpO1xuXHRcdHRoaXMucGFuZWxiaXRtYXAgPSBiaXRtYXA7XG5cdFx0dGhpcy5zZXR1cChvYmopO1xuXHR9IGNyZWF0ZWpzLmV4dGVuZChQYW5lbEVsZW1lbnQsIGNyZWF0ZWpzLkNvbnRhaW5lcik7XG5cblx0UGFuZWxFbGVtZW50LnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uKG9iaikge1xuXHRcdGlmIChvYmouZ290byAhPSAtMSkgdGhpcy5nb3RvID0gb2JqLmdvdG87XG5cdFx0Ly90aGlzLnR5cGUgPSBvYmoudHlwZTtcblx0XHR0aGlzLmFsaWduID0gb2JqLmFsaWduO1xuXHRcdHRoaXMuYnViYmxlX3R5cGUgPSBvYmouYnViYmxlX3R5cGU7XG5cdFx0dGhpcy50ZXh0ID0gb2JqLnRleHQ7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBvYmoucG9zaXRpb247XG5cblx0XHQvL3ZhciBwYW5lbCA9IHBhbmVsc1tpXTtcblx0XHR2YXIgc2IgPSBvYmo7XG5cblx0XHR2YXIgZGl2ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN2aWV3XCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIikpO1xuXHRcdHZhciBidWJibGVfb3JpZW50ID0gc2IuYnViYmxlX3R5cGU7XG5cblx0XHRpZiAob2JqLmltYWdlICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHRoaXMuaW1hZ2UgPSBvYmouaW1hZ2U7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dmFyIGltYWdlID0gXCJcIjtcblx0XHRcdHZhciBidWJibGVfc2l6ZSA9IFwibWVkaXVtXCI7XG5cdFx0XHRpZiAoc2IudGV4dC5sZW5ndGggPCA0KSB7XG5cdFx0XHRcdGJ1YmJsZV9zaXplID0gXCJzbWFsbFwiO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRpbWFnZSArPSBidWJibGVfc2l6ZTtcblx0XHRcdGlmIChidWJibGVfb3JpZW50ID09IFwiYm94XCIpIHtcblx0XHRcdFx0aW1hZ2UgKz0gXCJfYm94LnBuZ1wiO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpbWFnZSArPSBcIl9idWJibGVfXCIgKyBidWJibGVfb3JpZW50ICsgXCIucG5nXCI7XG5cdFx0XHR0aGlzLmltYWdlID0gJ2dhbWUvaW1nL2J1YmJsZXMvJyArIGltYWdlO1xuXHRcdH1cblxuXHRcdGRpdi5pbm5lckhUTUwgPSBcIjxwPlwiICsgc2IudGV4dC5yZXBsYWNlKC9cXG4vZywgXCI8YnI+XCIpICsgXCI8L3A+XCI7XG5cblx0XHRkaXYuY2xhc3NOYW1lID0gXCJidWJibGVcIjtcblx0XHRpZiAoYnViYmxlX29yaWVudCA9PSBcImJveFwiKSBkaXYuY2xhc3NOYW1lICs9IFwiIGJveFwiO1xuXHRcdGRpdi5jbGFzc05hbWUgKz0gXCIgbm9zZWxlY3RcIjtcblx0XHRkaXYuc3R5bGUub3BhY2l0eSA9ICcwJztcblx0XHRkaXYuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gJ3VybChcIicgKyB0aGlzLmltYWdlICsnXCIpJztcblx0XHRkaXYuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG5cdFx0ZGl2LnN0eWxlLnRvcCA9IDA7XG5cdFx0ZGl2LnN0eWxlLmxlZnQgPSAwO1xuXG5cdFx0Ly9kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpZXdcIikuYXBwZW5kQ2hpbGQoZGl2KTtcblxuXHRcdFxuXG5cblx0XHR0aGlzLnNjYWxlWCA9IDAuNjtcblx0XHR0aGlzLnNjYWxlWSA9IDAuNjtcblxuXHRcdHRoaXMueCA9IHNiLnBvc2l0aW9uLnggKiB0aGlzLnBhbmVsYml0bWFwLmltYWdlLndpZHRoKnRoaXMucGFuZWxiaXRtYXAuc2NhbGVYO1xuXHRcdHRoaXMueSA9IHNiLnBvc2l0aW9uLnkgKiB0aGlzLnBhbmVsYml0bWFwLmltYWdlLmhlaWdodCp0aGlzLnBhbmVsYml0bWFwLnNjYWxlWTtcblx0XHQvL3RoaXMueCA9IGVsbS54O1xuXHRcdC8vdGhpcy55ID0gZWxtLnk7XG5cdFx0dGhpcy5yZWdYID0gZGl2LmNsaWVudFdpZHRoLzI7XG5cdFx0dGhpcy5yZWdZID0gZGl2LmNsaWVudEhlaWdodDtcblx0XHR0aGlzLndpZHRoID0gZGl2LmNsaWVudFdpZHRoO1xuXHRcdHRoaXMuaGVpZ2h0ID0gZGl2LmNsaWVudEhlaWdodDtcblx0XHRpZiAoYnViYmxlX29yaWVudCA9PSBcImxlZnRcIikge1xuXHRcdFx0dGhpcy5yZWdYID0gMDtcblx0XHR9XG5cblx0XHR2YXIgYWxpZ25feCA9IFwibGVmdFwiO1xuXHRcdHZhciBhbGlnbl95ID0gXCJ0b3BcIjtcblx0XHRpZiAoc2IuYWxpZ24gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0YWxpZ25feCA9IHNiLmFsaWduLng7XG5cdFx0XHRhbGlnbl95ID0gc2IuYWxpZ24ueTtcblx0XHR9XG5cdFx0aWYgKGFsaWduX3ggPT0gXCJyaWdodFwiKSB7XG5cdFx0XHR0aGlzLnJlZ1ggPSBkaXYuY2xpZW50V2lkdGg7XG5cdFx0XHR0aGlzLnggPSB0aGlzLnBhbmVsYml0bWFwLmltYWdlLndpZHRoKnRoaXMucGFuZWxiaXRtYXAuc2NhbGVYLXRoaXMueDtcblx0XHR9XG5cdFx0aWYgKGFsaWduX3kgPT0gXCJib3R0b21cIikge1xuXHRcdFx0dGhpcy5yZWdZID0gZGl2LmNsaWVudEhlaWdodDtcblx0XHRcdHRoaXMueSA9IHRoaXMucGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0KnRoaXMucGFuZWxiaXRtYXAuc2NhbGVZLXRoaXMueTtcblx0XHR9XG5cdFx0dmFyIHNlbGVjdGVkID0gbmV3IGNyZWF0ZWpzLlNoYXBlKCk7XG5cdFx0dmFyIGhpdHNoYXBlID0gbmV3IGNyZWF0ZWpzLlNoYXBlKCk7XG5cdFx0aGl0c2hhcGUuZ3JhcGhpY3MuZihcIiMwMDBcIikuZHIoMCwwLHRoaXMud2lkdGgsdGhpcy5oZWlnaHQpO1xuXHRcdHRoaXMuaGl0QXJlYSA9IGhpdHNoYXBlO1xuXHRcdHZhciBlbG0gPSBuZXcgY3JlYXRlanMuRE9NRWxlbWVudChkaXYpO1xuXHRcdHRoaXMuYWRkQ2hpbGQoc2VsZWN0ZWQsIGVsbSk7XG5cdFx0ZGl2Lm9wYWNpdHkgPSAnMSc7XG5cdFx0ZWxtLnggPSAwO1xuXHRcdGVsbS55ID0gMDtcblx0XHQvL3RoaXMuYWRkQ2hpbGQoaGl0c2hhcGUpO1xuXHRcdHRoaXMub24oXCJtb3VzZWRvd25cIiwgdGhpcy5zZXREcmFnT2Zmc2V0KTtcblx0XHR0aGlzLm9uKFwicHJlc3Ntb3ZlXCIsIHRoaXMuZHJhZ0VsZW1lbnQpO1xuXHRcdC8vdGhpcy5vbihcImNsaWNrXCIsIHRoaXMuc2hvd1Byb3BlcnRpZXMpO1xuXHRcdC8vZWxtLnJlZ1kgPSBlbG0uZ2V0Qm91bmRzKCkuaGVpZ2h0O1xuXHRcdC8vZWxlbWVudHMuYWRkQ2hpbGQoZWxtKTtcblx0fTtcblxuXHRQYW5lbEVsZW1lbnQucHJvdG90eXBlLnVwZGF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgZWxlbWVudCA9IHRoaXMuY2hpbGRyZW5bMV0uaHRtbEVsZW1lbnQ7IFxuXHRcdGVsZW1lbnQuaW5uZXJIVE1MID0gJzxwPicgKyB0aGlzLnRleHQucmVwbGFjZSgvXFxuL2csIFwiPGJyPlwiKSArICc8L3A+Jztcblx0XHR0aGlzLndpZHRoID0gZWxlbWVudC5jbGllbnRXaWR0aDtcblx0XHR0aGlzLmhlaWdodCA9IGVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuXHRcdHRoaXMucmVnWCA9IGVsZW1lbnQuY2xpZW50V2lkdGgvMjtcblx0XHR0aGlzLnJlZ1kgPSBlbGVtZW50LmNsaWVudEhlaWdodDtcblxuXHRcdC8qdmFyIGltYWdlID0gXCJcIjtcblx0XHR2YXIgYnViYmxlX3NpemUgPSBcIm1lZGl1bVwiO1xuXHRcdGlmICh0aGlzLnRleHQubGVuZ3RoIDwgNCkge1xuXHRcdFx0YnViYmxlX3NpemUgPSBcInNtYWxsXCI7XG5cdFx0fVxuXHRcdHZhciBidWJibGVfb3JpZW50ID0gdGhpcy5idWJibGVfdHlwZTtcblx0XHRpbWFnZSArPSBidWJibGVfc2l6ZTtcblx0XHRpZiAoYnViYmxlX29yaWVudCA9PSBcImJveFwiKSB7XG5cdFx0XHRpbWFnZSArPSBcIl9ib3gucG5nXCI7XG5cdFx0fVxuXHRcdGVsc2UgaW1hZ2UgKz0gXCJfYnViYmxlX1wiICsgYnViYmxlX29yaWVudCArIFwiLnBuZ1wiO1xuXHRcdGVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gXCJ1cmwoXFxcImdhbWUvaW1nL2J1YmJsZXMvXCIraW1hZ2UrXCJcXFwiKVwiOyovXG5cdFx0ZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLmltYWdlO1xuXG5cdFx0aWYgKHRoaXMuYWxpZ24gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmFsaWduLnggPT0gXCJyaWdodFwiKSB7XG5cdFx0XHR0aGlzLnJlZ1ggPSBlbGVtZW50LmNsaWVudFdpZHRoO1xuXHRcdH1cblx0fTtcblxuXHRQYW5lbEVsZW1lbnQucHJvdG90eXBlLnNob3dQcm9wZXJ0aWVzID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG5vZGUgPSB0aGlzO1xuXHRcdC8vaWYgKGN1cnJlbnRseVNlbGVjdGVkID09IHRoaXMpIHJldHVybjtcblx0XHQvL2N1cnJlbnRseVNlbGVjdGVkID0gdGhpcztcblxuXHRcdC8vY29uc29sZS5sb2coXCJTaG93aW5nIHByb3BlcnRpZXMgZm9yIG5vZGUgXCIgKyBub2RlLm5hbWUgKTtcblxuXHRcdHZhciBwcm9wZXJ0eV9wYW5lbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcHJvcGVydGllc1wiKTtcblxuXHRcdHZhciBwcm9wZXJ0eV9oZWFkZXIgPSBcdCc8ZGl2IGlkPVwib2JqZWN0LW5hbWVcIj4nICtcblx0XHRcdFx0XHRcdFx0XHRcdCc8cD4nICsgbm9kZS5wYXJlbnQubmFtZSArICc8c3BhbiBjbGFzcz1cImVsZW1lbnQtaWRcIj4nICsgbm9kZS5wYXJlbnQuY29uc3RydWN0b3IubmFtZSArICcgIycgKyBub2RlQ29udGFpbmVyLmdldENoaWxkSW5kZXgobm9kZS5wYXJlbnQpICsgJyAtICcgKyBub2RlLmNvbnN0cnVjdG9yLm5hbWUgKyAnPC9zcGFuPjwvcD4nICtcblx0XHRcdFx0XHRcdFx0XHQnPC9kaXY+Jztcblx0XHRwcm9wZXJ0eV9wYW5lbC5pbm5lckhUTUwgPSBwcm9wZXJ0eV9oZWFkZXI7XG5cblx0XHQvL3ZhciBub2RlX25hbWUgPSAnPGRpdiBjbGFzcz1cImZpZWxkIGxhYmVsc2lkZVwiPjxwPk5hbWU6PC9wPjxpbnB1dCB0eXBlPVwidGV4dFwiIHZhbHVlPVwiJyArIG5vZGUubmFtZSArICdcIiBpZD1cInByb3BlcnR5LW5hbWVcIj48L2Rpdj4nO1xuXHRcdC8vcHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MICs9IG5vZGVfbmFtZTtcblxuXHRcdHZhciBwcm9wX2ltYWdlID0gJzxkaXYgY2xhc3M9XCJmaWVsZCBsYWJlbHRvcFwiPjxwPkltYWdlIFVSTDo8L3A+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgdmFsdWU9XCInICsgbm9kZS5pbWFnZSArICdcIiBpZD1cInByb3BlcnR5LWltYWdlcGF0aFwiPjwvZGl2Pic7XG5cdFx0cHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MICs9IHByb3BfaW1hZ2U7XG5cblx0XHRjb25zb2xlLmxvZyhcIllvIVwiKTtcblxuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcHJvcGVydHktaW1hZ2VwYXRoXCIpLm9uY2hhbmdlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcIldodXQhXCIpO1xuXHRcdFx0Ly9ub2RlLmltYWdlID0gcHJvcGltYWdlLnZhbHVlO1xuXHRcdFx0dmFyIGltZyA9IG5ldyBJbWFnZSgpO1xuXHRcdFx0aW1nLnNyYyA9IHByb3BpbWFnZS52YWx1ZTtcblx0XHRcdGltZy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0bm9kZS5pbWFnZSA9IHByb3BpbWFnZS52YWx1ZTtcblx0XHRcdFx0bm9kZS51cGRhdGVFbGVtZW50KCk7XG5cdFx0XHRcdC8vbm9kZS5wYW5lbGJpdG1hcC5pbWFnZSA9IGltZztcblx0XHRcdFx0Ly9ub2RlLnNlbGVjdGVkLmdyYXBoaWNzLmNsZWFyKCk7XG5cdFx0XHRcdC8vdmFyIHRoaWNrbmVzcyA9IDM7XG5cdFx0XHRcdC8vbm9kZS5zZWxlY3RlZC5ncmFwaGljcy5mKFwiIzAwOTllZVwiKS5kcigtdGhpY2tuZXNzLC10aGlja25lc3Msbm9kZS5wYW5lbGJpdG1hcC5pbWFnZS53aWR0aCpub2RlLnBhbmVsYml0bWFwLnNjYWxlWCt0aGlja25lc3MqMiwgbm9kZS5wYW5lbGJpdG1hcC5pbWFnZS5oZWlnaHQqbm9kZS5wYW5lbGJpdG1hcC5zY2FsZVkrdGhpY2tuZXNzKjIpO1xuXHRcdFx0fVxuXHRcdFx0aW1nLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGRpYWxvZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZGlhbG9nXCIpO1xuXHRcdFx0XHRkaWFsb2cuaW5uZXJIVE1MID0gXCI8cD4nXCIgKyBwcm9waW1hZ2UudmFsdWUgKyBcIicgY291bGQgbm90IGJlIGxvYWRlZDxwPlwiO1xuXHRcdFx0XHQvL2RpYWxvZy5zdHlsZS50b3AgPSBcIjUwJVwiO1xuXHRcdFx0XHQvL2RpYWxvZy5zdHlsZS5sZWZ0ID0gXCI1MCVcIjtcblx0XHRcdFx0ZGlhbG9nLnN0eWxlLm9wYWNpdHkgPSBcIjAuOFwiO1xuXHRcdFx0XHRkaWFsb2cuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCIjNTIyXCI7XG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0ZGlhbG9nLnN0eWxlLm9wYWNpdHkgPSBcIjBcIjtcblx0XHRcdFx0fSwgMjAwMCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHZhciBwcm9wX3RleHQgPSAnPGRpdiBjbGFzcz1cImZpZWxkIGxhYmVsdG9wXCI+PHA+VGV4dDo8L3A+PHRleHRhcmVhIGlkPVwicHJvcGVydHktdGV4dFwiPicgK1xuXHRcdG5vZGUudGV4dCArXG5cdFx0JzwvdGV4dGFyZWE+PC9kaXY+JztcblxuXHRcdC8vdmFyIHBhbmVsX2ltYWdlID0gJzxkaXYgY2xhc3M9XCJmaWVsZCBsYWJlbHRvcFwiPjxwPkltYWdlIFVSTDo8L3A+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgdmFsdWU9XCInICsgbm9kZS5pbWFnZSArICdcIiBpZD1cInByb3BlcnR5LWltYWdlcGF0aFwiPjwvZGl2Pic7XG5cdFx0cHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MICs9IHByb3BfdGV4dDtcblxuXHRcdC8vdmFyIHBhbmVsX3NpemUgPSAnPGRpdiBjbGFzcz1cImZpZWxkIGxhYmVsc2lkZVwiPjxwPlNpemU6PC9wPjx1bCBpZD1cInByb3BlcnR5LXNpemVcIiBjbGFzcz1cIm51bWJlcmJ1dHRvbnMgbm9zZWxlY3RcIj4nO1xuXHRcdFxuXHRcdC8vcGFuZWxfc2l6ZSArPSAnPC91bD48L2Rpdj4nO1xuXHRcdFxuXHRcdC8qcGFuZWxfc2l6ZSArPSAnPC91bD48L2Rpdj4nO1xuXHRcdHByb3BlcnR5X3BhbmVsLmlubmVySFRNTCArPSBwYW5lbF9zaXplOyovXG5cdFx0Lyp2YXIgcHJvcG5hbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnR5LW5hbWVcIik7XG5cdFx0cHJvcG5hbWUub25jaGFuZ2UgPSBmdW5jdGlvbigpIHtcblx0XHRcdG5vZGUubmFtZSA9IHByb3BuYW1lLnZhbHVlO1xuXHRcdH0qL1xuXG5cdFx0dmFyIGRlbGV0ZV9idXR0b24gPSAnPGRpdiBjbGFzcz1cImZpZWxkXCI+PGlucHV0IGlkPVwiZGVsZXRlXCIgY2xhc3M9XCJidXR0b24gZGVsZXRlLWJ1dHRvblwiIHR5cGU9XCJzdWJtaXRcIiB2YWx1ZT1cIkRlbGV0ZSBQYW5lbFwiPjwvZGl2Pic7XG5cdFx0cHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MICs9IGRlbGV0ZV9idXR0b247XG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNkZWxldGVcIikub25jbGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0Y29uc29sZS5sb2cobm9kZS5wYXJlbnQpO1xuXHRcdFx0bm9kZS5wYXJlbnQucmVtb3ZlQ2hpbGQoY3VycmVudGx5U2VsZWN0ZWQpO1xuXHRcdH07XG5cblx0XHR2YXIgcHJvcHRleHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnR5LXRleHRcIik7XG5cdFx0cHJvcHRleHQub25rZXl1cCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhwcm9wdGV4dC52YWx1ZSk7XG5cdFx0XHRub2RlLnRleHQgPSBwcm9wdGV4dC52YWx1ZTtcblx0XHRcdG5vZGUudXBkYXRlRWxlbWVudCgpO1xuXHRcdH07XG5cblx0XHRcblx0XHRcblx0fTtcblxuXHRQYW5lbEVsZW1lbnQucHJvdG90eXBlLnNldERyYWdPZmZzZXQgPSBmdW5jdGlvbihldnQpIHtcblx0XHR2YXIgZ2xvYmFsID0gZXZ0LnRhcmdldC5wYXJlbnQubG9jYWxUb0dsb2JhbChldnQudGFyZ2V0LngsIGV2dC50YXJnZXQueSk7XG5cdFx0ZHJhZ29mZnNldCA9IHtcblx0XHRcdHg6IGV2dC5zdGFnZVggLSBnbG9iYWwueCxcblx0XHRcdHk6IGV2dC5zdGFnZVkgLSBnbG9iYWwueVxuXHRcdH07XG5cdFx0Ly9jdXJyZW50bHlTZWxlY3RlZCA9IGV2dC50YXJnZXQucGFyZW50O1xuXHRcdGlmIChjdXJyZW50bHlTZWxlY3RlZCAhPT0gdW5kZWZpbmVkICYmIGN1cnJlbnRseVNlbGVjdGVkLnNlbGVjdGVkICE9PSB1bmRlZmluZWQpIGN1cnJlbnRseVNlbGVjdGVkLnNlbGVjdGVkLmdyYXBoaWNzLmNsZWFyKCk7XG5cdFx0Y3VycmVudGx5U2VsZWN0ZWQgPSBldnQudGFyZ2V0O1xuXHRcdG9wZW5UYWIoXCJwcm9wZXJ0eVRhYlwiKTtcblx0XHQvL2V2dC50YXJnZXQuc2hvd1Byb3BlcnRpZXMoKTtcblx0fTtcblxuXHRQYW5lbEVsZW1lbnQucHJvdG90eXBlLmRyYWdFbGVtZW50ID0gZnVuY3Rpb24oZXZ0KSB7XG5cdFx0Ly9jb25zb2xlLmxvZyhcIkNsaWNrIVwiKTtcblx0XHR2YXIgbG9jYWwgPSBldnQudGFyZ2V0LnBhcmVudC5nbG9iYWxUb0xvY2FsKGV2dC5zdGFnZVggLSBkcmFnb2Zmc2V0LngsIGV2dC5zdGFnZVkgLSBkcmFnb2Zmc2V0LnkpO1xuXHRcdHZhciBwYW5lbGJpdG1hcCA9IGV2dC50YXJnZXQucGFyZW50LnBhbmVsYml0bWFwO1xuXHRcdHZhciBwYW5lbCA9IHtcblx0XHRcdHdpZHRoOiBwYW5lbGJpdG1hcC5pbWFnZS53aWR0aCpwYW5lbGJpdG1hcC5zY2FsZVgsXG5cdFx0XHRoZWlnaHQ6IHBhbmVsYml0bWFwLmltYWdlLmhlaWdodCpwYW5lbGJpdG1hcC5zY2FsZVlcblx0XHR9O1xuXHRcdGlmIChsb2NhbC54IDwgMCkgbG9jYWwueCA9IDA7XG5cdFx0aWYgKGxvY2FsLnggPiBwYW5lbC53aWR0aCkgbG9jYWwueCA9IHBhbmVsLndpZHRoO1xuXHRcdGlmIChsb2NhbC55IDwgMCkgbG9jYWwueSA9IDA7XG5cdFx0aWYgKGxvY2FsLnkgPiBwYW5lbC5oZWlnaHQpIGxvY2FsLnkgPSBwYW5lbC5oZWlnaHQ7XG5cdFx0ZXZ0LnRhcmdldC54ID0gbG9jYWwueDtcblx0XHRldnQudGFyZ2V0LnkgPSBsb2NhbC55O1xuICAgICAgICAvKmV2dC50YXJnZXQucG9zaXRpb24gPSB7IFxuICAgICAgICAgICAgeDogbG9jYWwueC9ldnQudGFyZ2V0LnBhbmVsYml0bWFwLmltYWdlLndpZHRoL2V2dC50YXJnZXQucGFuZWxiaXRtYXAuc2NhbGVYKjEwMCwgXG4gICAgICAgICAgICB5OiBsb2NhbC55L2V2dC50YXJnZXQucGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0L2V2dC50YXJnZXQucGFuZWxiaXRtYXAuc2NhbGVZKjEwMCB9Ki9cblx0XHRldnQudGFyZ2V0LnBhcmVudC5kcmF3Q29ubmVjdGlvbnMoKTtcblx0fTtcblxuXHR3aW5kb3cuUGFuZWxFbGVtZW50ID0gY3JlYXRlanMucHJvbW90ZShQYW5lbEVsZW1lbnQsIFwiQ29udGFpbmVyXCIpO1xuXG5cblx0Ly8gLS0tLS0tLS0tLS0tLS0tIC8vXG5cdC8vICBOb2RlQ29udGFpbmVyICAvL1xuXHQvLyAtLS0tLS0tLS0tLS0tLS0gLy9cblxuXHRmdW5jdGlvbiBOb2RlQ29udGFpbmVyKCkge1xuXHRcdHRoaXMuQ29udGFpbmVyX2NvbnN0cnVjdG9yKCk7XG5cdFx0dGhpcy5zdGFydG5vZGUgPSAwO1xuXHR9IGNyZWF0ZWpzLmV4dGVuZChOb2RlQ29udGFpbmVyLCBjcmVhdGVqcy5Db250YWluZXIpO1xuXG5cblx0Tm9kZUNvbnRhaW5lci5wcm90b3R5cGUuc2hvd1Byb3BlcnRpZXMgPSBmdW5jdGlvbigpIHtcblxuXHRcdC8vY29uc29sZS5sb2codGhpcyk7XG5cblx0XHQvL2YgKGN1cnJlbnRseVNlbGVjdGVkID09IHRoaXMpIHJldHVybjtcblx0XHQvL2N1cnJlbnRseVNlbGVjdGVkID0gdGhpcztcblxuXHRcdHZhciBwcm9wZXJ0eV9wYW5lbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcHJvcGVydGllc1wiKTtcblxuXHRcdHZhciBwcm9wZXJ0eV9oZWFkZXIgPSBcdCc8ZGl2IGlkPVwib2JqZWN0LW5hbWVcIj4nICtcblx0XHRcdFx0XHRcdFx0XHRcdCc8cD5Qcm9qZWN0IFByb3BlcnRpZXM8L3A+JyArXG5cdFx0XHRcdFx0XHRcdFx0JzwvZGl2Pic7XG5cdFx0cHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MID0gcHJvcGVydHlfaGVhZGVyO1xuXG5cdFx0dmFyIHByb3Bfc3RhcnRub2RlID0gJzxkaXYgY2xhc3M9XCJmaWVsZCBsYWJlbHNpZGVcIj48cD5TdGFydCBub2RlOjwvcD48aW5wdXQgdHlwZT1cIm51bWJlclwiIHZhbHVlPVwiJyArIHRoaXMuc3RhcnRub2RlICsgJ1wiIGlkPVwicHJvcGVydHktc3RhcnRub2RlXCI+PC9kaXY+Jztcblx0XHRwcm9wZXJ0eV9wYW5lbC5pbm5lckhUTUwgKz0gcHJvcF9zdGFydG5vZGU7XG5cblx0XHR2YXIgcHJvcHN0YXJ0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNwcm9wZXJ0eS1zdGFydG5vZGVcIik7XG5cdFx0dmFyIGNvbnRhaW5lciA9IHRoaXM7XG5cdFx0cHJvcHN0YXJ0Lm9uY2hhbmdlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcIlN0YXJ0IG5vZGUgY2hhbmdlZFwiLCBwcm9wc3RhcnQudmFsdWUpO1xuXHRcdFx0Y29udGFpbmVyLnN0YXJ0bm9kZSA9IHByb3BzdGFydC52YWx1ZTtcblx0XHRcdGNvbnNvbGUubG9nKGNvbnRhaW5lci5zdGFydG5vZGUpO1xuXHRcdH07XG5cdFx0XG5cdH07XG5cblx0Tm9kZUNvbnRhaW5lci5wcm90b3R5cGUubWFrZUNvbm5lY3Rpb25zID0gZnVuY3Rpb24oKSB7XG5cblx0XHRmb3IgKGk9MDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBub2RlID0gdGhpcy5jaGlsZHJlbltpXTtcblx0XHRcdGlmIChub2RlLmdvdG8gIT09IHVuZGVmaW5lZCkgbm9kZS5nb3RvID0gdGhpcy5nZXRDaGlsZEF0KG5vZGUuZ290byk7XG5cdFx0XHRmb3IgKGU9MDsgZSA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBlKyspIHtcblx0XHRcdFx0dmFyIGVsZW0gPSBub2RlLmNoaWxkcmVuW2VdO1xuXHRcdFx0XHRpZiAoZWxlbSBpbnN0YW5jZW9mIFBhbmVsRWxlbWVudCAmJiBlbGVtLmdvdG8gIT09IHVuZGVmaW5lZCkgZWxlbS5nb3RvID0gdGhpcy5nZXRDaGlsZEF0KGVsZW0uZ290byk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH07XG5cblx0Ly8gT3ZlcndyaXRlIENvbnRhaW5lci5yZW1vdmVDaGlsZCgpXG5cdE5vZGVDb250YWluZXIucHJvdG90eXBlLnJlbW92ZUNoaWxkID0gZnVuY3Rpb24oY2hpbGQpIHtcblx0XHR2YXIgdmlldyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdmlld1wiKTtcblx0XHRmb3IgKGU9MDsgZTxjaGlsZC5jaGlsZHJlbi5sZW5ndGg7IGUrKykge1xuXHRcdFx0dmFyIGVsbSA9IGNoaWxkLmNoaWxkcmVuW2VdO1xuXHRcdFx0Y29uc29sZS5sb2coZWxtKTtcblx0XHRcdGlmIChlbG0gaW5zdGFuY2VvZiBQYW5lbEVsZW1lbnQpIHtcblx0XHRcdFx0ZWxtID0gZWxtLmNoaWxkcmVuWzFdLmh0bWxFbGVtZW50O1xuXHRcdFx0XHRjb25zb2xlLmxvZyhlbG0pO1xuXHRcdFx0XHR2aWV3LnJlbW92ZUNoaWxkKGVsbSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHRoaXMuQ29udGFpbmVyX3JlbW92ZUNoaWxkKGNoaWxkKTtcblx0XHRkcmF3QWxsQ29ubmVjdGlvbnMoKTtcblx0fVxuXG5cdC8vIHRvT2JqZWN0IC0gRm9yIG91dHB1dHRpbmcgZWRpdG9yIHBhcmFtZXRlcnMgdG8gYSBKU09OIG9iamVjdFxuXG5cdE5vZGVDb250YWluZXIucHJvdG90eXBlLnRvT2JqZWN0ID0gZnVuY3Rpb24oKSB7XG5cblx0XHR2YXIgb3V0cHV0ID0gbmV3IE9iamVjdCgpO1xuXG5cdFx0b3V0cHV0LmNvbmZpZyA9IHtcblx0XHRcdHN0YXJ0bm9kZTogdGhpcy5zdGFydG5vZGVcblx0XHR9O1xuXG5cdFx0b3V0cHV0Lm5vZGVzID0gW107XG5cdFx0Zm9yIChpPTA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgcmVmID0gdGhpcy5jaGlsZHJlbltpXTtcblx0XHRcdC8vIGN5Y2xlIHRocm91Z2ggYWxsIG5vZGVzLCBzYXZpbmcgdGhlaXIgZGF0YSB0byBhbiBvYmplY3Rcblx0XHRcdHZhciBub2RlID0gbmV3IE9iamVjdCgpO1xuXG5cdFx0XHRpZiAocmVmIGluc3RhbmNlb2YgUGFuZWwpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhub2RlLm5hbWUpO1xuXHRcdFx0XHRub2RlLm5hbWUgPSByZWYubmFtZTtcblx0XHRcdFx0bm9kZS5zaXplID0gcmVmLnNpemU7XG5cdFx0XHRcdG5vZGUuaW1hZ2UgPSByZWYuaW1hZ2U7XG5cdFx0XHRcdG5vZGUuZ290byA9IHRoaXMuZ2V0Q2hpbGRJbmRleChyZWYuZ290byk7XG5cdFx0XHRcdGlmIChub2RlLmdvdG8gPT0gLTEpIG5vZGUuZ290byA9IHVuZGVmaW5lZDtcblx0XHRcdFx0bm9kZS5lZGl0b3IgPSB7XG5cdFx0XHRcdFx0cG9zaXRpb246IHsgeDogcmVmLngsIHk6IHJlZi55IH1cblx0XHRcdFx0fTtcblxuXHRcdFx0XHRub2RlLmVsZW1lbnRzID0gW107XG5cblx0XHRcdFx0Zm9yIChlPTA7IGUgPCByZWYuY2hpbGRyZW4ubGVuZ3RoOyBlKyspIHtcblx0XHRcdFx0XHR2YXIgcl9lbGVtID0gcmVmLmNoaWxkcmVuW2VdO1xuXHRcdFx0XHRcdGlmIChyX2VsZW0gaW5zdGFuY2VvZiBQYW5lbEVsZW1lbnQpIHtcblx0XHRcdFx0XHRcdHZhciBlbGVtID0gbmV3IE9iamVjdCgpO1xuXG5cdFx0XHRcdFx0XHRlbGVtLnR5cGUgPSByX2VsZW0udHlwZTtcblx0XHRcdFx0XHRcdGlmIChyX2VsZW0udGV4dCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRcdGVsZW0udGV4dCA9IHJfZWxlbS50ZXh0O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxlbS5idWJibGVfdHlwZSA9IHJfZWxlbS5idWJibGVfdHlwZTtcblx0XHRcdFx0XHRcdGVsZW0uaW1hZ2UgPSByX2VsZW0uaW1hZ2U7XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdGVsZW0ucG9zaXRpb24gPSB7XG5cdFx0XHRcdFx0XHRcdHg6cl9lbGVtLngvKHJfZWxlbS5wYW5lbGJpdG1hcC5pbWFnZS53aWR0aCpyX2VsZW0ucGFuZWxiaXRtYXAuc2NhbGVYKSxcblx0XHRcdFx0XHRcdFx0eTpyX2VsZW0ueS8ocl9lbGVtLnBhbmVsYml0bWFwLmltYWdlLmhlaWdodCpyX2VsZW0ucGFuZWxiaXRtYXAuc2NhbGVZKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0aWYgKHJfZWxlbS5hbGlnbiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRcdGVsZW0uYWxpZ24gPSByX2VsZW0uYWxpZ247XG5cdFx0XHRcdFx0XHRcdGlmIChlbGVtLmFsaWduLnggPT0gXCJyaWdodFwiKSBlbGVtLnBvc2l0aW9uLnggPSAxIC0gZWxlbS5wb3NpdGlvbi54O1xuXHRcdFx0XHRcdFx0XHRpZiAoZWxlbS5hbGlnbi55ID09IFwiYm90dG9tXCIpIGVsZW0ucG9zaXRpb24ueSA9IDEgLSBlbGVtLnBvc2l0aW9uLnk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbGVtLmdvdG8gPSB0aGlzLmdldENoaWxkSW5kZXgocl9lbGVtLmdvdG8pO1xuXHRcdFx0XHRcdFx0aWYgKGVsZW0uZ290byA9PSAtMSkgZWxlbS5nb3RvID0gdW5kZWZpbmVkO1xuXG5cdFx0XHRcdFx0XHRub2RlLmVsZW1lbnRzLnB1c2goZWxlbSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdH1cblxuXHRcdFx0b3V0cHV0Lm5vZGVzLnB1c2gobm9kZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG91dHB1dDtcblx0fTtcblxuXHR3aW5kb3cuTm9kZUNvbnRhaW5lciA9IGNyZWF0ZWpzLnByb21vdGUoTm9kZUNvbnRhaW5lciwgXCJDb250YWluZXJcIik7XG5cbn0oKSk7XG5cblxuXG5cblxuXG4iLCJ2YXIgZnMgPSByZXF1aXJlKCdmcycpO1xuLypleHBvcnRzLmNoZWNrUGF0aCA9IGZ1bmN0aW9uKHBhdGgpXG57XG5cdGlmICh0eXBlb2YgcGF0aCA9PSBcInVuZGVmaW5lZFwiIHx8IHBhdGggPT09IFwiXCIgKSB7XG5cdFx0d2luZG93LmFsZXJ0KFwiWW91IGZvcmdvdCB0byBlbnRlciBhIHBhdGghXCIpO1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdHZhciBmaWxlbmFtZSA9IHBhdGguc3BsaXQoXCIvXCIpLnBvcCgpO1xuXHR2YXIgZXh0ZW5zaW9uID0gZmlsZW5hbWUuc3BsaXQoXCIuXCIpLnBvcCgpO1xuXG5cdGlmIChleHRlbnNpb24gIT0gXCJqc29uXCIgJiYgZXh0ZW5zaW9uICE9IFwidHh0XCIpIHtcblx0XHR3aW5kb3cuYWxlcnQoXCJQbGVhc2Ugc3BlY2lmeSBhIC5qc29uIG9yIC50eHQgZmlsZS5cIik7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0cmV0dXJuIHRydWU7XG59Ki9cblxuZXhwb3J0cy5sb2FkQWxsSW1hZ2VzID0gZnVuY3Rpb24ocGF0aCwgY2FsbGJhY2spIHtcblx0XG4gICAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0cmVxdWVzdC5vcGVuKCdHRVQnLCBcIi4vaW1nLWZvbGRlci5waHBcIiwgdHJ1ZSk7XG5cblx0cmVxdWVzdC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAocmVxdWVzdC5zdGF0dXMgPj0gMjAwICYmIHJlcXVlc3Quc3RhdHVzIDwgNDAwKSB7XG5cdFx0XHQvL2RvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcHJvcGVydGllc1wiKS5pbm5lckhUTUwgPSByZXF1ZXN0LnJlc3BvbnNlVGV4dDtcblx0XHRcdC8vY29uc29sZS5sb2cocmVxdWVzdC5yZXNwb25zZVRleHQpO1xuXHRcdFx0Y2FsbGJhY2soSlNPTi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlVGV4dCkpO1xuXHRcdH0gZWxzZSB7XG5cdFx0Ly8gV2UgcmVhY2hlZCBvdXIgdGFyZ2V0IHNlcnZlciwgYnV0IGl0IHJldHVybmVkIGFuIGVycm9yXG5cdFx0YWxlcnQocmVxdWVzdC5yZXNwb25zZVRleHQpO1xuXHRcdHJldHVybiBudWxsO1xuXHRcdH1cblx0fTtcblxuXHRyZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcblx0XHRhbGVydChyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG5cdH07XG5cblx0cmVxdWVzdC5zZW5kKCk7XG59XG5cbmV4cG9ydHMuc2F2ZUpTT04gPSBmdW5jdGlvbihvYmosIHBhdGgpIHtcblx0Ly9pZiAoIWNoZWNrUGF0aChwYXRoKSkgcmV0dXJuO1xuXG5cdHZhciBmaWxlbmFtZSA9IHBhdGguc3BsaXQoXCIvXCIpLnBvcCgpO1xuXG5cdC8vZG9lc0ZpbGVFeGlzdChwYXRoKTtcblx0d3JpdGVUb0ZpbGUoKTtcblxuXHRmdW5jdGlvbiBkb2VzRmlsZUV4aXN0KHVybFRvRmlsZSlcblx0e1xuXHRcdHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0XHR4aHIub3BlbignSEVBRCcsIHVybFRvRmlsZSwgdHJ1ZSk7XG5cdFx0eGhyLnNlbmQoKTtcblxuXHRcdHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICh4aHIuc3RhdHVzID09IDQwNCkge1xuXHRcdFx0XHQvLyBGaWxlIG5vdCBmb3VuZFxuXHRcdFx0XHR3cml0ZVRvRmlsZSgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gRmlsZSBleGlzdHNcblx0XHRcdFx0aWYgKHdpbmRvdy5jb25maXJtKFwiJ1wiK3BhdGgrXCInIGFscmVhZHkgZXhpc3RzLlxcbkRvIHlvdSB3YW50IHRvIG92ZXJ3cml0ZSBpdD9cIikpIHdyaXRlVG9GaWxlKCk7XG5cdFx0XHRcdGVsc2UgcmV0dXJuIG51bGw7XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuXG5cdGZ1bmN0aW9uIHdyaXRlVG9GaWxlKCkge1xuXHRcdC8vd2luZG93LmFsZXJ0KFwiV3JpdGluZyB0byBmaWxlISAuLm5vdCByZWFsbHkgbG9sXCIpO1xuXHRcdHZhciBzZW5kcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXHRcdHNlbmRyZXF1ZXN0Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKHNlbmRyZXF1ZXN0LnN0YXR1cyA+PSAyMDAgJiYgc2VuZHJlcXVlc3Quc3RhdHVzIDwgNDAwKSB7XG4gICAgICAgICAgICAgICAgLy93aW5kb3cuYWxlcnQoc2VuZHJlcXVlc3QucmVzcG9uc2VUZXh0KTtcblx0XHRcdFx0dmFyIGRpYWxvZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZGlhbG9nXCIpO1xuXHRcdFx0XHRkaWFsb2cuaW5uZXJIVE1MID0gXCI8cD4nXCIgKyBwYXRoICsgXCInIHNhdmVkIHN1Y2Nlc3NmdWxseTxwPlwiO1xuXHRcdFx0XHQvL2RpYWxvZy5zdHlsZS50b3AgPSBcIjUwJVwiO1xuXHRcdFx0XHQvL2RpYWxvZy5zdHlsZS5sZWZ0ID0gXCI1MCVcIjtcblx0XHRcdFx0ZGlhbG9nLnN0eWxlLm9wYWNpdHkgPSBcIjAuOFwiO1xuXHRcdFx0XHRkaWFsb2cuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCIjMzMzXCI7XG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0ZGlhbG9nLnN0eWxlLm9wYWNpdHkgPSBcIjBcIjtcblx0XHRcdFx0fSwgMjAwMCk7XG5cdFx0XHR9XG5cdFx0XHQvL3dpbmRvdy5hbGVydChzZW5kcmVxdWVzdC5zdGF0dXMgKyBcIiAtIFwiICsgc2VuZHJlcXVlc3QucmVzcG9uc2VUZXh0KTtcblx0XHR9O1xuXHRcdHNlbmRyZXF1ZXN0Lm9wZW4oXCJQT1NUXCIsXCIuL2pzb24ucGhwXCIsdHJ1ZSk7XG5cdFx0c2VuZHJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtdHlwZVwiLCBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZFwiKTtcblx0XHQvL3NlbmRyZXF1ZXN0LnJlc3BvbnNlVHlwZSA9ICdqc29uJztcblx0XHRjb25zb2xlLmxvZyhwYXRoKTtcblx0XHRzZW5kcmVxdWVzdC5zZW5kKFwianNvbj1cIiArIEpTT04uc3RyaW5naWZ5KG9iaiwgbnVsbCwgNCkgKyBcIiZwYXRoPVwiICsgcGF0aCk7XG5cdH1cbn1cblxuZXhwb3J0cy5sb2FkSlNPTiA9IGZ1bmN0aW9uKHBhdGgsIGNhbGxiYWNrKSB7XG5cblx0Ly9pZiAoIWNoZWNrUGF0aChwYXRoKSkgcmV0dXJuO1xuXHQvL2NsZWFyQWxsKCk7XG5cblx0dmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0cmVxdWVzdC5vcGVuKCdHRVQnLCBwYXRoICsgJz9fPScgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKSwgdHJ1ZSk7XG5cblx0dmFyIG1vYmlsZV9zbWFsbF9wYW5lbHMgPSAwO1xuXG5cdHJlcXVlc3Qub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHJlcXVlc3Quc3RhdHVzID49IDIwMCAmJiByZXF1ZXN0LnN0YXR1cyA8IDQwMCkge1xuXHRcdFx0Ly8gU3VjY2VzcyFcblx0XHRcdC8vcGFuZWxzID0gSlNPTi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB2YXIgb2JqID0gSlNPTi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKG9iaik7XG5cdFx0XHRwcmVsb2FkSW1hZ2VzKG9iaiwgY2FsbGJhY2spO1xuXHRcdFx0Ly9jYWxsYmFjayhvYmopO1xuXHRcdH0gZWxzZSB7XG5cdFx0Ly8gV2UgcmVhY2hlZCBvdXIgdGFyZ2V0IHNlcnZlciwgYnV0IGl0IHJldHVybmVkIGFuIGVycm9yXG5cdFx0XHRpZiAocmVxdWVzdC5zdGF0dXMgPT0gNDA0KSB3aW5kb3cuYWxlcnQoXCJGaWxlIG5vdCBmb3VuZCFcIik7XG5cdFx0XHRlbHNlIHdpbmRvdy5hbGVydChyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG5cdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHR9O1xuXG5cdHJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuXHRcdGFsZXJ0KHJlcXVlc3QucmVzcG9uc2VUZXh0KTtcblx0fTtcblxuXHRyZXF1ZXN0LnNlbmQoKTtcbn1cblxuZnVuY3Rpb24gcHJlbG9hZEltYWdlcyhvYmosIGNhbGxiYWNrKSB7XG5cdHZhciBsb2FkZWQgPSAwO1xuXHR2YXIgaW1hZ2VzID0gW107XG5cdC8qaW1hZ2VzLnB1c2goXCJpbWcvYnViYmxlcy9tZWRpdW1fYnViYmxlX2xlZnQucG5nXCIpO1xuXHRpbWFnZXMucHVzaChcImltZy9idWJibGVzL21lZGl1bV9idWJibGVfZG93bi5wbmdcIik7XG5cdGltYWdlcy5wdXNoKFwiaW1nL2J1YmJsZXMvbWVkaXVtX2JveC5wbmdcIik7XG5cdGltYWdlcy5wdXNoKFwiaW1nL2J1YmJsZXMvc21hbGxfYm94LnBuZ1wiKTtcblx0aW1hZ2VzLnB1c2goXCJpbWcvYnViYmxlcy9zbWFsbF9idWJibGVfZG93bi5wbmdcIik7XG5cdGltYWdlcy5wdXNoKFwiaW1nL2J1YmJsZXMveF9zbWFsbF9idWJibGVfbGVmdC5wbmdcIik7Ki9cblx0Zm9yICh2YXIgaT0wOyBpPG9iai5ub2Rlcy5sZW5ndGg7IGkrKykge1xuXHRcdGltYWdlcy5wdXNoKG9iai5ub2Rlc1tpXS5pbWFnZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBpbWFnZUxvYWRlZCgpIHtcblx0XHRsb2FkZWQrKztcblx0XHQvL2NvbnNvbGUubG9nKFwiSW1hZ2UgbG9hZGVkLi5cIiArIGxvYWRlZCArIFwiL1wiICsgaW1hZ2VzLmxlbmd0aCk7XG5cdFx0dXBkYXRlUHJvZ3Jlc3MoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZVByb2dyZXNzKCkge1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicHJvZ3Jlc3NfYmFyXCIpLnN0eWxlLndpZHRoID0gKGxvYWRlZC9pbWFnZXMubGVuZ3RoICogMTAwKS50b1N0cmluZygpICsgXCIlXCI7XG5cdFx0Ly9jb25zb2xlLmxvZyhcInVwZGF0ZSBwcm9ncmVzcy4uXCIpO1xuXHRcdGlmIChsb2FkZWQgPT0gaW1hZ2VzLmxlbmd0aCkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJGaW5pc2hlZCBwcmVsb2FkaW5nIGltYWdlcy4uXCIpO1xuXHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwcm9ncmVzc1wiKS5zdHlsZS5vcGFjaXR5ID0gXCIwXCI7XG5cdFx0XHR9LCAxMDApO1xuXHRcdFx0Y2FsbGJhY2sob2JqKTtcblx0XHR9XG5cdH1cblxuXHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicHJvZ3Jlc3NcIikuc3R5bGUub3BhY2l0eSA9IFwiMVwiO1xuXHR9LCAxMDApO1xuXG5cdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0Ly8gcHJlbG9hZCBpbWFnZVxuXHRcdGZvciAodmFyIGw9MDsgbDxpbWFnZXMubGVuZ3RoOyBsKyspIHtcblx0XHRcdHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRcdGltZy5zcmMgPSBpbWFnZXNbbF07XG5cdFx0XHRpbWcub25sb2FkID0gaW1hZ2VMb2FkZWQ7XG5cdFx0fVxuXHR9LCA1MCk7XG59IiwidmFyIGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyLmpzJyk7XG52YXIgZWRpdG9yID0gcmVxdWlyZSgnLi9lZGl0b3IuanMnKTtcblxudmFyIGdhbWVwYXRoID0gX19kaXJuYW1lICsgJy9hcHAvZ2FtZS8nO1xuXG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uKGUpIHtcbiAgaWYgKGUua2V5Q29kZSA9PSA4MyAmJiAobmF2aWdhdG9yLnBsYXRmb3JtLm1hdGNoKFwiTWFjXCIpID8gZS5tZXRhS2V5IDogZS5jdHJsS2V5KSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAvLyBQcm9jZXNzIGV2ZW50Li4uXG4gICAgICBsb2FkZXIuc2F2ZUpTT04oZWRpdG9yLmdldE5vZGVzLnRvT2JqZWN0KCksIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZmlsZXBhdGhcIikudmFsdWUpO1xuICB9XG59LCBmYWxzZSk7XG5cblxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbG9hZFwiKS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0bG9hZGVyLmxvYWRKU09OKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZmlsZXBhdGhcIikudmFsdWUsIGVkaXRvci5pbml0KTtcblx0fTtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzYXZlXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRsb2FkZXIuc2F2ZUpTT04oZWRpdG9yLmdldE5vZGVzLnRvT2JqZWN0KCksIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZmlsZXBhdGhcIikudmFsdWUpO1xuXHR9O1xuXHQvL2RvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2F2ZVwiKTtcblx0bG9hZGVyLmxvYWRKU09OKFwianMvcGFuZWxzLmpzb25cIiwgZWRpdG9yLmluaXQpO1xufTsiLCIiXX0=
