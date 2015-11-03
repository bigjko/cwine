(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//var classes = require('./classes.js');

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

	function stageMouseMove(evt) {
		if (dragging_element !== undefined && dragging_element !== null) {
			var local = dragging_element.parent.globalToLocal(evt.stageX - dragoffset.x, evt.stageY - dragoffset.y);
			dragging_element.x = local.x;
			dragging_element.y = local.y;
		}
	}
}

exports.getNodes = function() {
	return nodeContainer;
}

exports.openTab = openTab;




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
		loadAllImages(function(obj) {
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







},{}],2:[function(require,module,exports){
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
	
    var results = [];

    fs.readdirSync(path).forEach(function(file) {
        file = path +'/'+file;
        var stat = filesystem.statSync(file);

        if (stat && stat.isDirectory()) {
            results = results.concat(_getAllFilesFromFolder(file))
        } else results.push(file);
    });

    return results;
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
		sendrequest.open("POST","json.php",true);
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
            console.log(obj);
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
		console.log("Image loaded.." + loaded + "/" + images.length);
		updateProgress();
	}

	function updateProgress() {
		document.getElementById("progress_bar").style.width = (loaded/images.length * 100).toString() + "%";
		console.log("update progress..");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvZWRpdG9yL3B1YmxpYy9qcy9lZGl0b3IuanMiLCJhcHAvZWRpdG9yL3B1YmxpYy9qcy9sb2FkZXIuanMiLCJhcHAvZWRpdG9yL3B1YmxpYy9qcy9tYWluLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbGliL19lbXB0eS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzUvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6QkEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy92YXIgY2xhc3NlcyA9IHJlcXVpcmUoJy4vY2xhc3Nlcy5qcycpO1xuXG52YXIgcGFuZWxzO1xudmFyIGNvbmZpZztcbnZhciBzdGFnZTtcbnZhciB2aWV3Q29udGFpbmVyO1xudmFyIG5vZGVDb250YWluZXI7XG4vL3ZhciBmaXJzdExvYWQgPSB0cnVlO1xudmFyIHZpZXdTY2FsZSA9IDE7XG52YXIgZHJhZ29mZnNldCA9IHt4OjAsIHk6MH07XG4vL3ZhciBkcmFnQm94O1xudmFyIHpvb21OdW1iZXIgPSAzO1xudmFyIHpvb21TdGVwID0gWzAuMiwgMC4zLCAwLjUsIDAuNzUsIDEsIDEuNSwgMl07XG52YXIgZHJhZ2dpbmdfZWxlbWVudDtcblxudmFyIGRlZmF1bHRHYW1lUGF0aCA9IFwiXCI7XG52YXIgY29uX3IgPSA2O1xuXG5cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG4vL1x0XHRcdFx0XHRcdFx0ICAgLy9cbi8vXHRcdFx0RVhQT1JUUyAgICAgICAgICAgIC8vXG4vL1x0XHRcdFx0XHRcdFx0ICAgLy9cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbihvYmopIHtcblxuICAgIHBhbmVscyA9IG9iai5ub2RlcztcbiAgICBjb25maWcgPSBvYmouY29uZmlnO1xuICAgIFxuXHRpZiAoc3RhZ2UgPT09IHVuZGVmaW5lZCkge1xuXHRcdHN0YWdlID0gbmV3IGNyZWF0ZWpzLlN0YWdlKFwiZWRpdF9jYW52YXNcIik7XG5cdFx0Y3JlYXRlanMuVGlja2VyLnNldEZQUyg2MCk7XG5cdFx0Y3JlYXRlanMuVGlja2VyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0aWNrXCIsIHN0YWdlKTtcblx0fVxuXHRlbHNlIHtcblx0XHRzdGFnZS5yZW1vdmVBbGxDaGlsZHJlbigpO1xuXHRcdHZhciBidWJibGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5idWJibGVcIik7XG5cdFx0dmFyIHZpZXcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpZXdcIik7XG5cdFx0Zm9yICh2YXIgYj0wOyBiIDwgYnViYmxlcy5sZW5ndGg7IGIrKykge1xuXHRcdFx0dmlldy5yZW1vdmVDaGlsZChidWJibGVzW2JdKTtcblx0XHR9XG5cdH1cblxuXHQvL3ZhciBjb29sX21hZHNfbm9kZSA9IG5ldyBOb2RlKFwicGFuZWxcIik7XG5cdC8vY29vbF9tYWRzX25vZGUuYWRkU29ja2V0KHRydWUpO1xuXHQvL2NvbnNvbGUubG9nKGNvb2xfbWFkc19ub2RlIGluc3RhbmNlb2YgY3JlYXRlanMuQ29udGFpbmVyKTtcblx0Ly9jb25zb2xlLmxvZyhjb29sX21hZHNfbm9kZSBpbnN0YW5jZW9mIE5vZGUpO1xuXHQvL3N0YWdlLmNhbnZhcy53aWR0aCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcblx0Ly9zdGFnZS5jYW52YXMuaGVpZ2h0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcblxuXHRzdGFnZS5jYW52YXMud2lkdGggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpZXdcIikub2Zmc2V0V2lkdGg7XG5cdHN0YWdlLmNhbnZhcy5oZWlnaHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpZXdcIikub2Zmc2V0SGVpZ2h0O1xuXHRzdGFnZS5lbmFibGVNb3VzZU92ZXIoMTUpO1xuXHRzdGFnZS5vbihcIm1vdXNlZG93blwiLCBmdW5jdGlvbigpIHsgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7IH0pO1xuXG5cdHN0YWdlLm1vdXNlTW92ZU91dHNpZGUgPSB0cnVlO1xuXHRzdGFnZS5vbihcInN0YWdlbW91c2Vtb3ZlXCIsIHN0YWdlTW91c2VNb3ZlKTtcblxuXHRpbml0dmlld0NvbnRhaW5lcigpO1xuXHRpbml0Tm9kZXMoKTtcblxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3pvb21pblwiKS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7IHpvb20oMSkgfTtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN6b29tb3V0XCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpIHsgem9vbSgtMSkgfTtcblxuXHRmdW5jdGlvbiBzdGFnZU1vdXNlTW92ZShldnQpIHtcblx0XHRpZiAoZHJhZ2dpbmdfZWxlbWVudCAhPT0gdW5kZWZpbmVkICYmIGRyYWdnaW5nX2VsZW1lbnQgIT09IG51bGwpIHtcblx0XHRcdHZhciBsb2NhbCA9IGRyYWdnaW5nX2VsZW1lbnQucGFyZW50Lmdsb2JhbFRvTG9jYWwoZXZ0LnN0YWdlWCAtIGRyYWdvZmZzZXQueCwgZXZ0LnN0YWdlWSAtIGRyYWdvZmZzZXQueSk7XG5cdFx0XHRkcmFnZ2luZ19lbGVtZW50LnggPSBsb2NhbC54O1xuXHRcdFx0ZHJhZ2dpbmdfZWxlbWVudC55ID0gbG9jYWwueTtcblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0cy5nZXROb2RlcyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gbm9kZUNvbnRhaW5lcjtcbn1cblxuZXhwb3J0cy5vcGVuVGFiID0gb3BlblRhYjtcblxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vICBFRElUT1IgIC8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cbmZ1bmN0aW9uIGluaXROb2RlcygpIHtcblx0bm9kZUNvbnRhaW5lciA9IG5ldyBOb2RlQ29udGFpbmVyKCk7XG5cdG5vZGVDb250YWluZXIuc3RhcnRub2RlID0gY29uZmlnLnN0YXJ0bm9kZTtcblx0Zm9yICh2YXIgcD0wOyBwPHBhbmVscy5sZW5ndGg7cCsrKSB7XG5cdFx0dmFyIHBhbmVsID0gbmV3IFBhbmVsKHBhbmVsc1twXSk7XG5cdFx0bm9kZUNvbnRhaW5lci5hZGRDaGlsZChwYW5lbCk7XG5cdH1cblx0bm9kZUNvbnRhaW5lci5tYWtlQ29ubmVjdGlvbnMoKTtcblx0dmlld0NvbnRhaW5lci5hZGRDaGlsZChub2RlQ29udGFpbmVyKTtcblx0ZHJhd0FsbENvbm5lY3Rpb25zKCk7XG59XG5cbndpbmRvdy5vbnJlc2l6ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIHZpZXcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpZXdcIik7XG4gICAgdmFyIHNpZGViYXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3NpZGViYXJcIik7XG5cbiAgICBzdGFnZS5jYW52YXMud2lkdGggPSB2aWV3Lm9mZnNldFdpZHRoO1xuICAgIHN0YWdlLmNhbnZhcy5oZWlnaHQgPSB2aWV3Lm9mZnNldEhlaWdodDtcblxuXHRzdGFnZS5nZXRDaGlsZEJ5TmFtZShcImRyYWdCb3hcIikuZ3JhcGhpY3MuYmVnaW5GaWxsKFwiIzk5OVwiKS5kcmF3UmVjdCgwLDAsc3RhZ2UuY2FudmFzLndpZHRoLCBzdGFnZS5jYW52YXMuaGVpZ2h0KTtcbiAgICAvL3N0YWdlLnVwZGF0ZSgpO1xufTtcblxuZnVuY3Rpb24gY2xlYXJBbGwoKSB7XG5cblx0ZnVuY3Rpb24gY2xlYXJFdmVudHMoZGlzT2JqKSB7XG5cdFx0Y29uc29sZS5sb2coZGlzT2JqKTtcblx0XHRkaXNPYmoucmVtb3ZlQWxsRXZlbnRMaXN0ZW5lcnMoKTtcblx0XHRmb3IgKHZhciBpPTA7IGkgPCBkaXNPYmouY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChkaXNPYmouY2hpbGRyZW5baV0uY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRjbGVhckV2ZW50cyhkaXNPYmouY2hpbGRyZW5baV0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRpZiAoc3RhZ2UgIT09IHVuZGVmaW5lZCkgY2xlYXJFdmVudHMoc3RhZ2UpO1xufVxuXG5mdW5jdGlvbiBpbml0dmlld0NvbnRhaW5lcigpIHtcblx0dmFyIGRyYWdCb3g7XG5cblx0Ly92YXIgY29ybmVycyA9IG5ldyBjcmVhdGVqcy5TaGFwZSgpO1xuXG5cdHZpZXdDb250YWluZXIgPSBuZXcgY3JlYXRlanMuQ29udGFpbmVyKCk7XG5cdHZpZXdTY2FsZSA9IHpvb21TdGVwW3pvb21OdW1iZXJdO1xuXHR2aWV3Q29udGFpbmVyLnNjYWxlWCA9IHZpZXdTY2FsZTtcblx0dmlld0NvbnRhaW5lci5zY2FsZVkgPSB2aWV3U2NhbGU7XG5cdHZpZXdDb250YWluZXIubmFtZSA9IFwiVmlldyBDb250YWluZXJcIjtcblxuXHRmdW5jdGlvbiBkcmFnVmlldyhldnQpIHtcblx0XHQvL2NvbnNvbGUubG9nKFwiRHJhZ2dpbiB2aWV3ISBcIiArIGV2dC50YXJnZXQpO1xuXHRcdHZpZXdDb250YWluZXIueCA9IGV2dC5zdGFnZVggLSBkcmFnb2Zmc2V0Lng7XG5cdFx0dmlld0NvbnRhaW5lci55ID0gZXZ0LnN0YWdlWSAtIGRyYWdvZmZzZXQueTtcblxuXHRcdGNlbnRlclZpZXdPcmlnaW4oZXZ0LnN0YWdlWCAtIGRyYWdvZmZzZXQueCwgZXZ0LnN0YWdlWSAtIGRyYWdvZmZzZXQueSk7XG5cdH1cblxuXHRmdW5jdGlvbiBjZW50ZXJWaWV3T3JpZ2luKHgseSkge1xuXHRcdHZpZXdDb250YWluZXIucmVnWCA9ICgoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN2aWV3XCIpLm9mZnNldFdpZHRoIC0gMjgwKS8yIC0gdmlld0NvbnRhaW5lci54KS92aWV3U2NhbGU7XG5cdFx0dmlld0NvbnRhaW5lci5yZWdZID0gKChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpZXdcIikub2Zmc2V0SGVpZ2h0LzIpIC0gdmlld0NvbnRhaW5lci55KS92aWV3U2NhbGU7XG5cdFx0Ly9jb3JuZXJzLmdyYXBoaWNzLmNsZWFyKCk7XG5cdFx0Ly9jb3JuZXJzLmdyYXBoaWNzLmYoXCJyZWRcIikuZGModmlld0NvbnRhaW5lci54LHZpZXdDb250YWluZXIueSwxNSkuZihcImJsdWVcIikuZGModmlld0NvbnRhaW5lci54K3ZpZXdDb250YWluZXIucmVnWCp2aWV3U2NhbGUsIHZpZXdDb250YWluZXIueSt2aWV3Q29udGFpbmVyLnJlZ1kqdmlld1NjYWxlLCAxNSk7XG5cdFx0dmlld0NvbnRhaW5lci54ID0geCArIHZpZXdDb250YWluZXIucmVnWCAqIHZpZXdTY2FsZTtcblx0XHR2aWV3Q29udGFpbmVyLnkgPSB5ICsgdmlld0NvbnRhaW5lci5yZWdZICogdmlld1NjYWxlO1xuXHR9XG5cblx0ZHJhZ0JveCA9IG5ldyBjcmVhdGVqcy5TaGFwZShuZXcgY3JlYXRlanMuR3JhcGhpY3MoKS5iZWdpbkZpbGwoXCIjOTk5XCIpLmRyYXdSZWN0KDAsMCxzdGFnZS5jYW52YXMud2lkdGgsIHN0YWdlLmNhbnZhcy5oZWlnaHQpKTtcblx0ZHJhZ0JveC5vbihcIm1vdXNlZG93blwiLCBmdW5jdGlvbihldnQpIHtcblx0XHRpZiAoY3VycmVudGx5U2VsZWN0ZWQgIT09IHVuZGVmaW5lZCAmJiBjdXJyZW50bHlTZWxlY3RlZC5zZWxlY3RlZCAhPT0gdW5kZWZpbmVkKSBjdXJyZW50bHlTZWxlY3RlZC5zZWxlY3RlZC5ncmFwaGljcy5jbGVhcigpO1xuXHRcdGN1cnJlbnRseVNlbGVjdGVkID0gbm9kZUNvbnRhaW5lcjtcblx0XHRvcGVuVGFiKFwicHJvcGVydHlUYWJcIik7XG5cdFx0Ly9ub2RlQ29udGFpbmVyLnNob3dQcm9wZXJ0aWVzKCk7XG5cdFx0ZHJhZ29mZnNldC54ID0gZXZ0LnN0YWdlWCAtIHZpZXdDb250YWluZXIueCArIHZpZXdDb250YWluZXIucmVnWCp2aWV3U2NhbGU7XG5cdFx0ZHJhZ29mZnNldC55ID0gZXZ0LnN0YWdlWSAtIHZpZXdDb250YWluZXIueSArIHZpZXdDb250YWluZXIucmVnWSp2aWV3U2NhbGU7XG5cdH0pO1xuXHRkcmFnQm94Lm9uKFwicHJlc3Ntb3ZlXCIsIGRyYWdWaWV3KTtcblx0Ly9kcmFnQm94LmN1cnNvciA9IFwiZ3JhYlwiO1xuXHRkcmFnQm94Lm5hbWUgPSBcImRyYWdCb3hcIjtcblxuXHRzdGFnZS5hZGRDaGlsZChkcmFnQm94KTtcblx0Ly9zdGFnZS5hZGRDaGlsZChjb3JuZXJzKTtcblx0c3RhZ2UuYWRkQ2hpbGQodmlld0NvbnRhaW5lcik7XG5cblx0Y2VudGVyVmlld09yaWdpbigwLDApO1xufVxuXG5mdW5jdGlvbiBkcmF3QWxsQ29ubmVjdGlvbnMoKSB7XG5cdGZvciAodmFyIGMgPSAwOyBjIDwgbm9kZUNvbnRhaW5lci5jaGlsZHJlbi5sZW5ndGg7IGMrKykge1xuXHRcdG5vZGVDb250YWluZXIuY2hpbGRyZW5bY10uZHJhd0Nvbm5lY3Rpb25zKCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gbmV3UGFuZWwoeCwgeSwgaW1hZ2UpIHtcblx0dmFyIG9iaiA9IG5ldyBPYmplY3QoKTtcblx0b2JqLmltYWdlID0gaW1hZ2U7XG5cdG9iai5lZGl0b3IgPSBuZXcgT2JqZWN0KCk7XG5cdG9iai5lZGl0b3IucG9zaXRpb24gPSB7XG5cdFx0eDogeCxcblx0XHR5OiB5XG5cdH1cblx0bm9kZUNvbnRhaW5lci5hZGRDaGlsZChuZXcgUGFuZWwob2JqKSk7XG59XG5cbmZ1bmN0aW9uIG5ld1BhbmVsRWxlbWVudCh4LCB5LCBwYW5lbCwgaW1hZ2UpIHtcblx0dmFyIGVsbSA9IG5ldyBPYmplY3QoKTtcblx0ZWxtLnBvc2l0aW9uID0ge1xuXHRcdHg6IHgvKHBhbmVsLnBhbmVsYml0bWFwLmltYWdlLndpZHRoKnBhbmVsLnBhbmVsYml0bWFwLnNjYWxlWCksXG5cdFx0eTogeS8ocGFuZWwucGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0KnBhbmVsLnBhbmVsYml0bWFwLnNjYWxlWSlcblx0fTtcblx0Y29uc29sZS5sb2coZWxtLnBvc2l0aW9uKTtcblx0ZWxtLmltYWdlID0gaW1hZ2U7XG5cdC8vZGVmYXVsdCBhbGlnbm1lbnQgb3B0aW9uISBmb3Igbm93XG5cdGVsbS5idWJibGVfdHlwZSA9IFwiZG93blwiO1xuXHRlbG0udGV4dCA9IFwiXCI7XG5cblx0dmFyIHBhbmVsZWxlbWVudCA9IG5ldyBQYW5lbEVsZW1lbnQoZWxtLCBwYW5lbC5wYW5lbGJpdG1hcCk7XG5cblx0aWYgKHBhbmVsLmVsZW1lbnRzID09IHVuZGVmaW5lZCkgcGFuZWwuZWxlbWVudHMgPSBbXTtcblx0cGFuZWwuZWxlbWVudHMucHVzaChwYW5lbGVsZW1lbnQpO1xuXHRwYW5lbC5hZGRDaGlsZChwYW5lbGVsZW1lbnQpO1xuXG5cdHZhciBzb2NrZXRwb3MgPSB7XG5cdFx0eDogcGFuZWxlbGVtZW50LnggKyBwYW5lbGVsZW1lbnQud2lkdGgqcGFuZWxlbGVtZW50LnNjYWxlWCxcblx0XHR5OiBwYW5lbGVsZW1lbnQueSArIHBhbmVsZWxlbWVudC5oZWlnaHQvMipwYW5lbGVsZW1lbnQuc2NhbGVZXG5cdH07XG5cdHZhciBzb2NrID0gcGFuZWwuYWRkU29ja2V0KHNvY2tldHBvcy54LCBzb2NrZXRwb3MueSwgcGFuZWxlbGVtZW50LmdvdG8sIHBhbmVsLCAzLCBcIiNmZmZcIik7XG5cdHNvY2sub3duZXIgPSBwYW5lbGVsZW1lbnQ7XG5cdHNvY2tldHBvcyA9IHNvY2sub3duZXIubG9jYWxUb0xvY2FsKHNvY2sub3duZXIud2lkdGgsIHNvY2sub3duZXIuaGVpZ2h0LzIsIHNvY2sucGFyZW50KTtcblx0c29jay54ID0gc29ja2V0cG9zLng7XG5cdHNvY2sueSA9IHNvY2tldHBvcy55O1xufVxuXG5mdW5jdGlvbiB6b29tKHpvb21Nb2RpZmllcikge1xuXG5cdGlmICh6b29tTnVtYmVyICsgem9vbU1vZGlmaWVyIDwgMCB8fCB6b29tTnVtYmVyICsgem9vbU1vZGlmaWVyID49IHpvb21TdGVwLmxlbmd0aCkgcmV0dXJuO1xuXG5cdHZhciB6b29tc3BlZWQgPSAyMDA7XG5cblx0em9vbU51bWJlciArPSB6b29tTW9kaWZpZXI7XG5cdHZpZXdTY2FsZSA9IHpvb21TdGVwW3pvb21OdW1iZXJdO1xuXHRjb25zb2xlLmxvZyh2aWV3U2NhbGUpO1xuXG5cdGNyZWF0ZWpzLlR3ZWVuLmdldCh2aWV3Q29udGFpbmVyLCB7b3ZlcnJpZGU6IHRydWV9KVxuXHRcdC50byh7IHNjYWxlWDogdmlld1NjYWxlLCBzY2FsZVk6IHZpZXdTY2FsZSB9LCB6b29tc3BlZWQsIGNyZWF0ZWpzLkVhc2UuY3ViaWNPdXQpO1xuXG5cdC8qZm9yICh2YXIgYyA9IDA7IGMgPCB2aWV3Q29udGFpbmVyLmNoaWxkcmVuLmxlbmd0aDsgYysrKSB7XG5cdFx0dmFyIHBzID0gdmlld0NvbnRhaW5lci5jaGlsZHJlbltjXS5nZXRDaGlsZEJ5TmFtZShcInBhbmVsU29ja2V0XCIpO1xuXHRcdGNyZWF0ZWpzLlR3ZWVuLmdldChwcywge292ZXJyaWRlOiB0cnVlfSkudG8oe3NjYWxlWDogMSAvIHZpZXdTY2FsZSwgc2NhbGVZOiAxIC8gdmlld1NjYWxlfSwgem9vbXNwZWVkLCBjcmVhdGVqcy5FYXNlLmN1YmljT3V0KTtcblx0XHRzZXRUaW1lb3V0KGRyYXdDb25uZWN0aW9ucyh2aWV3Q29udGFpbmVyLmNoaWxkcmVuW2NdKSwgMjAwKTtcblx0fSovXG59XG5cbnZhciBjdXJyZW50bHlTZWxlY3RlZDtcbnZhciBjdXJyZW50VGFiID0gXCJwcm9wZXJ0aWVzXCI7XG5cbmZ1bmN0aW9uIG9wZW5UYWIodGFiKSB7XG5cblx0Ly9pZiAodGFiID09IGN1cnJlbnRUYWIpIHJldHVybjtcblx0Y3VycmVudFRhYiA9IHRhYjtcblxuXHRzd2l0Y2godGFiKSB7XG5cblx0XHRjYXNlIFwicHJvcGVydHlUYWJcIjpcblx0XHRjb25zb2xlLmxvZyhcImNvb2xcIik7XG5cdFx0aWYgKGN1cnJlbnRseVNlbGVjdGVkICE9PSB1bmRlZmluZWQpIHtcblx0XHQgXHRjdXJyZW50bHlTZWxlY3RlZC5zaG93UHJvcGVydGllcygpO1xuXHRcdH1cblx0XHRlbHNlIG5vZGVDb250YWluZXIuc2hvd1Byb3BlcnRpZXMoKTtcblx0XHRicmVhaztcblxuXHRcdGNhc2UgXCJpbWFnZXNUYWJcIjpcblx0XHRsb2FkQWxsSW1hZ2VzKGZ1bmN0aW9uKG9iaikge1xuXHRcdFx0dmFyIHByb3BlcnRpZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnRpZXNcIik7XG5cdFx0XHRwcm9wZXJ0aWVzLmlubmVySFRNTCA9IFwiXCI7XG5cdFx0XHRmb3IgKGk9MDsgaTxvYmoubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0Y29uc29sZS5sb2cob2JqW2ldKTtcblx0XHRcdFx0cHJvcGVydGllcy5pbm5lckhUTUwgKz0gJzxpbWcgd2lkdGg9XCIxMDBcIiBzdHlsZT1cIm1hcmdpbi1sZWZ0OjEwcHg7XCIgc3JjPVwiJyArIG9ialtpXS5yZXBsYWNlKFwiLi4vXCIsIFwiXCIpICsgJ1wiIGRyYWdnYWJsZT1cInRydWVcIiBvbmRyYWdzdGFydD1cImRyYWcoZXZlbnQsIFxcJycgKyBvYmpbaV0ucmVwbGFjZShcIi4uL1wiLCBcIlwiKSArICdcXCcpXCIgLz4nO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdGJyZWFrO1xuXHR9XG5cblx0dmFyIHRhYnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RhYnNcIik7XG5cdGZvciAodD0wOyB0PHRhYnMuY2hpbGRyZW4ubGVuZ3RoOyB0KyspIHtcblx0XHR0YWJzLmNoaWxkcmVuW3RdLmNsYXNzTmFtZSA9ICh0YWJzLmNoaWxkcmVuW3RdLmlkID09IGN1cnJlbnRUYWIpID8gXCJzZWxlY3RlZFwiIDogXCJcIjtcblx0fVxufVxuXG5cbnZhciBzaWRlYmFyQ2xvc2VkID0gZmFsc2U7XG5cbmZ1bmN0aW9uIGhpZGVTaWRlYmFyKCkge1xuXHR2YXIgbWluID0gXCIzMHB4XCI7XG5cdHZhciBtYXggPSBcIjI4MHB4XCI7XG5cdGlmICggc2lkZWJhckNsb3NlZCApIHtcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3NpZGViYXJcIikuc3R5bGUud2lkdGggPSBtYXg7XG5cdFx0c2lkZWJhckNsb3NlZCA9IGZhbHNlO1xuXHR9XG5cdGVsc2Uge1xuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2lkZWJhclwiKS5zdHlsZS53aWR0aCA9IG1pbjtcblx0XHRzaWRlYmFyQ2xvc2VkID0gdHJ1ZTtcblx0fVxufVxuXG5mdW5jdGlvbiBtb3VzZVVwKCkge1xuXHRjb25zb2xlLmxvZyhcIk1vdXNlIFVwIG9uIEhUTUwgRWxlbWVudFwiKTtcblx0ZHJhZ2dpbmdfZWxlbWVudCA9IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gbW91c2VEb3duKGVsbSkge1xuXHRjb25zb2xlLmxvZyhcIk1vdXNlIERvd24gb24gSFRNTCBFbGVtZW50XCIpO1xuXHRkcmFnZ2luZ19lbGVtZW50ID0gZWxtO1xufVxuXG5mdW5jdGlvbiBhbGxvd0Ryb3AoZXYpIHtcbiAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xufVxuXG5mdW5jdGlvbiBkcmFnKGV2LCBwYXRoKSB7XG4gICAgZXYuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJ0ZXh0L3BsYWluXCIsIHBhdGgpO1xufVxuXG5mdW5jdGlvbiBkcm9wKGV2KSB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAoZXYudGFyZ2V0ID09IHN0YWdlLmNhbnZhcykge1xuICAgIFx0Ly9jb25zb2xlLmxvZyhcIkRyb3BwZWQgb24gU1RBR0UhIENvb2whXCIsIGV2LmNsaWVudFgsIGV2LmNsaWVudFkpO1xuICAgIFx0dmFyIGxvY2FsID0gbm9kZUNvbnRhaW5lci5nbG9iYWxUb0xvY2FsKGV2LmNsaWVudFgsIGV2LmNsaWVudFkpO1xuICAgIFx0Ly9jb25zb2xlLmxvZyhldi5kYXRhVHJhbnNmZXIuZ2V0RGF0YShcInRleHQvcGxhaW5cIikpO1xuICAgIFx0dmFyIHBubCA9IG5vZGVDb250YWluZXIuZ2V0T2JqZWN0VW5kZXJQb2ludChsb2NhbC54LCBsb2NhbC55KTtcbiAgICBcdGlmIChwbmwgIT09IG51bGwgJiYgcG5sIGluc3RhbmNlb2YgY3JlYXRlanMuQml0bWFwKSBwbmwgPSBwbmwucGFyZW50O1xuICAgIFx0Ly9jb25zb2xlLmxvZyhwbmwpO1xuICAgIFx0aWYgKHBubCBpbnN0YW5jZW9mIFBhbmVsKSB7XG4gICAgXHRcdHZhciBwb3MgPSBwbmwuZ2xvYmFsVG9Mb2NhbChldi5jbGllbnRYLCBldi5jbGllbnRZKTtcbiAgICBcdFx0Y29uc29sZS5sb2cocG9zKTtcbiAgICBcdFx0bmV3UGFuZWxFbGVtZW50KHBvcy54LCBwb3MueSwgcG5sLCBldi5kYXRhVHJhbnNmZXIuZ2V0RGF0YShcInRleHQvcGxhaW5cIikpO1xuICAgIFx0fVxuICAgIFx0ZWxzZSBuZXdQYW5lbChsb2NhbC54LCBsb2NhbC55LCBldi5kYXRhVHJhbnNmZXIuZ2V0RGF0YShcInRleHQvcGxhaW5cIikpO1xuICAgIH1cbiAgICAvL3ZhciBkYXRhID0gZXYuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJ0ZXh0XCIpO1xuICAgIC8vZXYudGFyZ2V0LmFwcGVuZENoaWxkKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRhdGEpKTtcbn1cblxuXG4vKipcbiogXG4qXG4qXHRFYXNlbGpzIGNsYXNzIGRlZmluaXRpb25zXG4qXG4qXG4qKi9cblxuKGZ1bmN0aW9uKCkge1xuXG5cdC8vIC0tLS0tLS0tLS0tLSAvL1xuXHQvLyAgTk9ERSBjbGFzcyAgLy9cblx0Ly8gLS0tLS0tLS0tLS0tIC8vXG5cblx0Ly92YXIgZWRpdG9yID0gcmVxdWlyZSgnLi9lZGl0b3IuanMnKTtcblxuXHRmdW5jdGlvbiBOb2RlKCkge1xuXHRcdHRoaXMuQ29udGFpbmVyX2NvbnN0cnVjdG9yKCk7XG5cdFx0dGhpcy5zb2NrZXRzID0gW107XG5cdH1cblx0Y3JlYXRlanMuZXh0ZW5kKE5vZGUsIGNyZWF0ZWpzLkNvbnRhaW5lcik7XG5cblx0Tm9kZS5wcm90b3R5cGUuaGFuZGxlTW91c2VEb3duID0gZnVuY3Rpb24oZXZ0KSB7XG5cdFx0ZHJhZ29mZnNldCA9IHtcblx0XHRcdHg6IGV2dC5zdGFnZVgvdmlld1NjYWxlIC0gZXZ0LnRhcmdldC5wYXJlbnQueCxcblx0XHRcdHk6IGV2dC5zdGFnZVkvdmlld1NjYWxlIC0gZXZ0LnRhcmdldC5wYXJlbnQueVxuXHRcdH07XG5cblx0XHQvL2V2dC50YXJnZXQuZHJhZ29mZnNldC55ID0gZXZ0LnN0YWdlWS92aWV3U2NhbGUgLSBldnQudGFyZ2V0LnBhcmVudC55O1xuXHRcdGlmIChjdXJyZW50bHlTZWxlY3RlZCAhPT0gdW5kZWZpbmVkICYmIGN1cnJlbnRseVNlbGVjdGVkLnNlbGVjdGVkICE9PSB1bmRlZmluZWQpIGN1cnJlbnRseVNlbGVjdGVkLnNlbGVjdGVkLmdyYXBoaWNzLmNsZWFyKCk7XG5cdFx0Y3VycmVudGx5U2VsZWN0ZWQgPSBldnQudGFyZ2V0LnBhcmVudDtcblx0XHRvcGVuVGFiKFwicHJvcGVydHlUYWJcIik7XG5cdH07XG5cblx0Tm9kZS5wcm90b3R5cGUuaGFuZGxlTW91c2VNb3ZlID0gZnVuY3Rpb24oZXZ0KSB7XG5cdFx0Ly9jb25zb2xlLmxvZyhldnQudGFyZ2V0KTtcblx0XHRldnQudGFyZ2V0LnBhcmVudC54ID0gZXZ0LnN0YWdlWC92aWV3U2NhbGUgLSBkcmFnb2Zmc2V0Lng7XG5cdFx0ZXZ0LnRhcmdldC5wYXJlbnQueSA9IGV2dC5zdGFnZVkvdmlld1NjYWxlIC0gZHJhZ29mZnNldC55O1xuXG5cdFx0ZXZ0LnRhcmdldC5wYXJlbnQueCA9IE1hdGgucm91bmQoZXZ0LnRhcmdldC5wYXJlbnQueCowLjEpKjEwO1xuXHRcdGV2dC50YXJnZXQucGFyZW50LnkgPSBNYXRoLnJvdW5kKGV2dC50YXJnZXQucGFyZW50LnkqMC4xKSoxMDtcblxuXHRcdC8vY29uc29sZS5sb2coZXZ0LnRhcmdldC5wYXJlbnQpO1xuXHRcdC8vZHJhd0Nvbm5lY3Rpb25zKGV2dC50YXJnZXQucGFyZW50KTtcblx0XHRkcmF3QWxsQ29ubmVjdGlvbnMoKTtcblx0fTtcblxuXHROb2RlLnByb3RvdHlwZS5kcmF3Q29ubmVjdGlvbnMgPSBmdW5jdGlvbigpIHtcblx0XHRmb3IgKHM9MDsgcyA8IHRoaXMuc29ja2V0cy5sZW5ndGg7IHMrKykge1xuXHRcdFx0dmFyIHNvY2tldCA9IHRoaXMuc29ja2V0c1tzXTtcblx0XHRcdHNvY2tldC5saW5lLmdyYXBoaWNzLmNsZWFyKCk7XG5cdFx0XHRpZiAoc29ja2V0Lm93bmVyIGluc3RhbmNlb2YgUGFuZWxFbGVtZW50KSB7XG5cdFx0XHRcdHZhciBzb2NrZXRwb3MgPSBzb2NrZXQub3duZXIubG9jYWxUb0xvY2FsKHNvY2tldC5vd25lci53aWR0aCwgc29ja2V0Lm93bmVyLmhlaWdodC8yLCBzb2NrZXQucGFyZW50KTtcblx0XHRcdFx0c29ja2V0LnggPSBzb2NrZXRwb3MueDtcblx0XHRcdFx0c29ja2V0LnkgPSBzb2NrZXRwb3MueTtcblx0XHRcdH1cblx0XHRcdGlmIChzb2NrZXQub3duZXIuZ290byAhPT0gdW5kZWZpbmVkICYmIHRoaXMucGFyZW50LmNvbnRhaW5zKHNvY2tldC5vd25lci5nb3RvKSkge1xuXHRcdFx0XHR2YXIgZ290byA9IHNvY2tldC5vd25lci5nb3RvO1xuXHRcdFx0XHR2YXIgbG9jYWwgPSB0aGlzLnBhcmVudC5sb2NhbFRvTG9jYWwoZ290by54LCBnb3RvLnkrZ290by5oZWlnaHQvMiwgc29ja2V0KTtcblx0XHRcdFx0XG5cdFx0XHRcdGlmIChzb2NrZXQub3duZXIgaW5zdGFuY2VvZiBQYW5lbEVsZW1lbnQpIHNvY2tldC5saW5lLmdyYXBoaWNzLnMoc29ja2V0LmNvbG9yKS5zcyhzb2NrZXQuc3Ryb2tld2lkdGgpLnNkKFsxMCw1XSkubXQoMCtzb2NrZXQucmFkaXVzLCAwKS5sdChsb2NhbC54LCBsb2NhbC55ICk7XG5cdFx0XHRcdGVsc2Ugc29ja2V0LmxpbmUuZ3JhcGhpY3Mucyhzb2NrZXQuY29sb3IpLnNzKHNvY2tldC5zdHJva2V3aWR0aCkubXQoMCtzb2NrZXQucmFkaXVzLCAwKS5sdChsb2NhbC54LCBsb2NhbC55ICk7XG5cdFx0XHRcdHNvY2tldC5hbHBoYSA9IDE7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHNvY2tldC5hbHBoYSA9IDAuNTtcblx0XHR9XG5cdH07XG5cblx0Tm9kZS5wcm90b3R5cGUuZHJhZ0xpbmUgPSBmdW5jdGlvbihldnQpIHtcblx0XHR2YXIgc29jayA9IGV2dC50YXJnZXQucGFyZW50O1xuXHRcdHZhciBsaW5lID0gc29jay5saW5lO1xuXHRcdGxpbmUuZ3JhcGhpY3MuY2xlYXIoKTtcblx0XHR2YXIgbG9jYWwgPSBsaW5lLmdsb2JhbFRvTG9jYWwoZXZ0LnN0YWdlWCwgZXZ0LnN0YWdlWSk7XG5cdFx0bGluZS5ncmFwaGljcy5zKHNvY2suY29sb3IpLnNzKHNvY2suc3Ryb2tld2lkdGgpLm10KDArY29uX3IsIDApLmx0KGxvY2FsLngsbG9jYWwueSk7XG5cdH07XG5cblx0Tm9kZS5wcm90b3R5cGUucmVsZWFzZUxpbmUgPSBmdW5jdGlvbihldnQpIHtcblx0XHRldnQudGFyZ2V0LnBhcmVudC5nb3RvID0gdW5kZWZpbmVkO1xuXHRcdGV2dC50YXJnZXQucGFyZW50Lm93bmVyLmdvdG8gPSB1bmRlZmluZWQ7XG5cdFx0ZXZ0LnRhcmdldC5wYXJlbnQubGluZS5ncmFwaGljcy5jbGVhcigpO1xuXHRcdHZhciB0YXJnID0gc3RhZ2UuZ2V0T2JqZWN0VW5kZXJQb2ludChldnQuc3RhZ2VYLCBldnQuc3RhZ2VZKTtcblx0XHRpZiAodGFyZy5wYXJlbnQgaW5zdGFuY2VvZiBOb2RlKSB7XG5cdFx0XHRldnQudGFyZ2V0LnBhcmVudC5nb3RvID0gdGFyZy5wYXJlbnQ7XG5cdFx0XHRldnQudGFyZ2V0LnBhcmVudC5vd25lci5nb3RvID0gdGFyZy5wYXJlbnQ7XG5cdFx0fVxuXHRcdGV2dC50YXJnZXQucGFyZW50LnBhcmVudC5kcmF3Q29ubmVjdGlvbnMoKTtcblx0fTtcblxuXHROb2RlLnByb3RvdHlwZS5hZGRTb2NrZXQgPSBmdW5jdGlvbih4LCB5LCBnb3RvLCBhZGRUbywgcmFkaXVzLCBjb2xvcikge1xuXHRcdHZhciBzb2NrZXQgPSBuZXcgY3JlYXRlanMuQ29udGFpbmVyKCk7XG5cdFx0c29ja2V0LnNoYXBlID0gbmV3IGNyZWF0ZWpzLlNoYXBlKCk7XG5cdFx0c29ja2V0LmxpbmUgPSBuZXcgY3JlYXRlanMuU2hhcGUoKTtcblx0XHRzb2NrZXQucmFkaXVzID0gcmFkaXVzO1xuXG5cdFx0c29ja2V0LnggPSB4O1xuXHRcdHNvY2tldC55ID0geTtcblxuXHRcdGlmIChjb2xvciAhPT0gdW5kZWZpbmVkKSBzb2NrZXQuY29sb3IgPSBjb2xvcjtcblx0XHRlbHNlIHNvY2tldC5jb2xvciA9IFwiIzAwMFwiO1xuXG5cdFx0aWYgKGNvbG9yID09IFwiI2ZmZlwiKSB0aGlzLmJnX2NvbG9yID0gXCIjMDAwXCI7XG5cdFx0ZWxzZSB0aGlzLmJnX2NvbG9yID0gXCIjZmZmXCI7XG5cblx0XHR2YXIgciA9IHNvY2tldC5yYWRpdXM7XG5cdFx0c29ja2V0LnNoYXBlLnJlZ1kgPSByO1xuXHRcdHNvY2tldC5zaGFwZS5yZWdYID0gMDtcblxuXHRcdHNvY2tldC5zaGFwZS5ncmFwaGljcy5mKHRoaXMuYmdfY29sb3IpLmRjKHIscixyKS5mKHNvY2tldC5jb2xvcikuZGMocixyLHItci8zKTtcblx0XHQvL3NvY2tldC5zaGFwZS5zY2FsZVggPSAxO1xuXHRcdC8vc29ja2V0LnNoYXBlLnNjYWxlWSA9IDE7XG5cblx0XHRzb2NrZXQuc3Ryb2tld2lkdGggPSBzb2NrZXQucmFkaXVzLzI7XG5cdFx0c29ja2V0LmN1cnNvciA9IFwicG9pbnRlclwiO1xuXG5cdFx0c29ja2V0LmdvdG8gPSBnb3RvO1xuXG5cdFx0c29ja2V0LmFkZENoaWxkKHNvY2tldC5zaGFwZSwgc29ja2V0LmxpbmUpO1xuXG5cdFx0c29ja2V0Lm9uKFwicHJlc3Ntb3ZlXCIsIHRoaXMuZHJhZ0xpbmUpO1xuXHRcdHNvY2tldC5vbihcInByZXNzdXBcIiwgdGhpcy5yZWxlYXNlTGluZSk7XG5cblx0XHR0aGlzLnNvY2tldHMucHVzaChzb2NrZXQpO1xuXHRcdGlmIChhZGRUbyA9PT0gdW5kZWZpbmVkKSB0aGlzLmFkZENoaWxkKHNvY2tldCk7XG5cdFx0ZWxzZSBhZGRUby5hZGRDaGlsZChzb2NrZXQpO1xuXG5cdFx0cmV0dXJuIHNvY2tldDtcblx0fTtcblxuXHR3aW5kb3cuTm9kZSA9IGNyZWF0ZWpzLnByb21vdGUoTm9kZSwgXCJDb250YWluZXJcIik7XG5cblx0Ly9cblx0Ly8gUEFORUwgY2xhc3Ncblx0Ly9cblxuXHRmdW5jdGlvbiBQYW5lbChvYmopIHtcblx0XHR0aGlzLk5vZGVfY29uc3RydWN0b3IoKTtcblx0XHQvL3RoaXMuc29ja2V0cyA9IFtdO1xuXHRcdHRoaXMuc2V0dXAob2JqKTtcblx0fVxuXHRjcmVhdGVqcy5leHRlbmQoUGFuZWwsIE5vZGUpO1xuXG5cdFBhbmVsLnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uKG9iaikge1xuXHRcdHRoaXMubmFtZSA9IG9iai5uYW1lO1xuXHRcdGlmIChvYmouZWRpdG9yICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHRoaXMueCA9IG9iai5lZGl0b3IucG9zaXRpb24ueDtcblx0XHRcdHRoaXMueSA9IG9iai5lZGl0b3IucG9zaXRpb24ueTtcblx0XHR9XG5cdFx0dGhpcy5zZWxlY3RlZCA9IG5ldyBjcmVhdGVqcy5TaGFwZSgpO1xuXHRcdHRoaXMuYWRkQ2hpbGQodGhpcy5zZWxlY3RlZCk7XG5cblx0XHRpZiAob2JqLmltYWdlICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHRoaXMucGFuZWxiaXRtYXAgPSBuZXcgY3JlYXRlanMuQml0bWFwKG9iai5pbWFnZSk7XG4gICAgICAgICAgICB0aGlzLmltYWdlID0gb2JqLmltYWdlO1xuXHRcdFx0dmFyIHNjYWxlID0gMC4yNTtcblx0XHRcdC8vaWYgKHBhbmVsc1tpXS5zaXplID09IDQpIHNjYWxlID0gMC4zNTtcbiAgICAgICAgICAgIGlmIChvYmouc2l6ZSA9PT0gdW5kZWZpbmVkKSB0aGlzLnNpemUgPSAxO1xuICAgICAgICAgICAgZWxzZSB0aGlzLnNpemUgPSBvYmouc2l6ZTtcblx0XHRcdHNjYWxlID0gdGhpcy5zaXplKjQwMCpzY2FsZSAvIHRoaXMucGFuZWxiaXRtYXAuaW1hZ2Uud2lkdGg7XG5cdFx0XHR0aGlzLnBhbmVsYml0bWFwLnNjYWxlWCA9IHNjYWxlO1xuXHRcdFx0dGhpcy5wYW5lbGJpdG1hcC5zY2FsZVkgPSBzY2FsZTtcblx0XHRcdHRoaXMud2lkdGggPSB0aGlzLnBhbmVsYml0bWFwLmltYWdlLndpZHRoKnRoaXMucGFuZWxiaXRtYXAuc2NhbGVYO1xuXHRcdFx0dGhpcy5oZWlnaHQgPSB0aGlzLnBhbmVsYml0bWFwLmltYWdlLmhlaWdodCp0aGlzLnBhbmVsYml0bWFwLnNjYWxlWTtcblx0XHRcdC8vdGhpcy5wYW5lbGJpdG1hcC5vbihcIm1vdXNlZG93blwiLCBoYW5kbGVNb3VzZURvd24pO1xuXHRcdFx0Ly90aGlzLnBhbmVsYml0bWFwLm9uKFwicHJlc3Ntb3ZlXCIsIGhhbmRsZU1vdXNlTW92ZSk7XG5cdFx0XHQvL3RoaXMucGFuZWxiaXRtYXAub24oXCJwcmVzc3VwXCIsIGhhbmRsZU1vdXNlVXApO1xuXHRcdFx0dGhpcy5wYW5lbGJpdG1hcC5jdXJzb3IgPSBcIm1vdmVcIjtcblx0XHRcdHRoaXMuYWRkQ2hpbGQodGhpcy5wYW5lbGJpdG1hcCk7XG5cdFx0XHR0aGlzLnBhbmVsYml0bWFwLm9uKFwibW91c2Vkb3duXCIsIHRoaXMuaGFuZGxlTW91c2VEb3duKTtcblx0XHRcdHRoaXMucGFuZWxiaXRtYXAub24oXCJwcmVzc21vdmVcIiwgdGhpcy5oYW5kbGVNb3VzZU1vdmUpO1xuXHRcdFx0dGhpcy5wYW5lbGJpdG1hcC5zaGFkb3cgPSBuZXcgY3JlYXRlanMuU2hhZG93KFwicmdiYSgwLDAsMCwwLjIpXCIsIDMsIDMsIDQpO1xuXHRcdFx0Ly90aGlzLnBhbmVsYml0bWFwLm9uKFwiY2xpY2tcIiwgdGhpcy5zaG93UHJvcGVydGllcyk7XG5cdFx0fVxuICAgICAgICBcblx0XHR2YXIgc29ja2V0cG9zID0ge1xuXHRcdFx0eDogdGhpcy5wYW5lbGJpdG1hcC5zY2FsZVgqdGhpcy5wYW5lbGJpdG1hcC5pbWFnZS53aWR0aCxcblx0XHRcdHk6IHRoaXMucGFuZWxiaXRtYXAuc2NhbGVZKnRoaXMucGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0LzJcblx0XHR9O1xuXG5cdFx0dmFyIHNvY2sgPSB0aGlzLmFkZFNvY2tldChzb2NrZXRwb3MueCxzb2NrZXRwb3MueSxvYmouZ290bywgdGhpcywgNik7XG5cdFx0c29jay5vd25lciA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICBpZiAob2JqLmdvdG8gIT0gLTEpIHRoaXMuZ290byA9IG9iai5nb3RvO1xuXG5cdFx0Ly90aGlzLmVsZW1lbnRzID0gW107XG5cblx0XHRpZiAob2JqLmVsZW1lbnRzICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGZvciAoZT0wOyBlIDwgb2JqLmVsZW1lbnRzLmxlbmd0aDsgZSsrKSB7XG5cdFx0XHRcdHZhciBlbGVtZW50ID0gbmV3IFBhbmVsRWxlbWVudChvYmouZWxlbWVudHNbZV0sIHRoaXMucGFuZWxiaXRtYXApO1xuXG5cdFx0XHRcdC8vdGhpcy5lbGVtZW50cy5wdXNoKGVsZW1lbnQpO1xuXHRcdFx0XHR0aGlzLmFkZENoaWxkKGVsZW1lbnQpO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoKTtcblx0XHRcdFx0c29ja2V0cG9zID0ge1xuXHRcdFx0XHRcdHg6IGVsZW1lbnQueCArIGVsZW1lbnQud2lkdGgqZWxlbWVudC5zY2FsZVgsXG5cdFx0XHRcdFx0eTogZWxlbWVudC55ICsgZWxlbWVudC5oZWlnaHQvMiplbGVtZW50LnNjYWxlWVxuXHRcdFx0XHR9O1xuXHRcdFx0XHRzb2NrID0gdGhpcy5hZGRTb2NrZXQoc29ja2V0cG9zLngsIHNvY2tldHBvcy55LCBlbGVtZW50LmdvdG8sIHRoaXMsIDMsIFwiI2ZmZlwiKTtcblx0XHRcdFx0c29jay5vd25lciA9IGVsZW1lbnQ7XG5cdFx0XHRcdHNvY2suZGFzaGVzID0gWzEwLDVdO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdFxuXHR9O1xuXG5cdFBhbmVsLnByb3RvdHlwZS5zaG93UHJvcGVydGllcyA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBub2RlID0gdGhpcztcblx0XHQvL2lmIChjdXJyZW50bHlTZWxlY3RlZCA9PSB0aGlzKSByZXR1cm47XG5cdFx0Ly9jdXJyZW50bHlTZWxlY3RlZCA9IHRoaXM7XG5cblx0XHQvL2NvbnNvbGUubG9nKFwiU2hvd2luZyBwcm9wZXJ0aWVzIGZvciBub2RlIFwiICsgbm9kZS5uYW1lICk7XG5cdFx0dmFyIHRoaWNrbmVzcyA9IDM7XG5cdFx0dGhpcy5zZWxlY3RlZC5ncmFwaGljcy5mKFwiIzAwOTllZVwiKS5kcigtdGhpY2tuZXNzLC10aGlja25lc3MsdGhpcy5wYW5lbGJpdG1hcC5pbWFnZS53aWR0aCp0aGlzLnBhbmVsYml0bWFwLnNjYWxlWCt0aGlja25lc3MqMiwgdGhpcy5wYW5lbGJpdG1hcC5pbWFnZS5oZWlnaHQqdGhpcy5wYW5lbGJpdG1hcC5zY2FsZVkrdGhpY2tuZXNzKjIpO1xuXHRcdHZhciBwcm9wZXJ0eV9wYW5lbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcHJvcGVydGllc1wiKTtcblxuXHRcdHZhciBwcm9wZXJ0eV9oZWFkZXIgPSBcdCc8ZGl2IGlkPVwib2JqZWN0LW5hbWVcIj4nICtcblx0XHRcdFx0XHRcdFx0XHRcdCc8cD4nICsgbm9kZS5uYW1lICsgJzxzcGFuIGNsYXNzPVwiZWxlbWVudC1pZFwiPiMnICsgbm9kZUNvbnRhaW5lci5nZXRDaGlsZEluZGV4KG5vZGUpICsgJzwvc3Bhbj48L3A+JyArXG5cdFx0XHRcdFx0XHRcdFx0JzwvZGl2Pic7XG5cdFx0cHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MID0gcHJvcGVydHlfaGVhZGVyO1xuXG5cdFx0dmFyIG5vZGVfbmFtZSA9ICc8ZGl2IGNsYXNzPVwiZmllbGQgbGFiZWxzaWRlXCI+PHA+TmFtZTo8L3A+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgdmFsdWU9XCInICsgbm9kZS5uYW1lICsgJ1wiIGlkPVwicHJvcGVydHktbmFtZVwiPjwvZGl2Pic7XG5cdFx0cHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MICs9IG5vZGVfbmFtZTtcblxuXHRcdGlmIChub2RlIGluc3RhbmNlb2YgUGFuZWwpIHtcblxuXHRcdFx0dmFyIHBhbmVsX2ltYWdlID0gJzxkaXYgY2xhc3M9XCJmaWVsZCBsYWJlbHRvcFwiPjxwPkltYWdlIFVSTDo8L3A+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgdmFsdWU9XCInICsgbm9kZS5pbWFnZSArICdcIiBpZD1cInByb3BlcnR5LWltYWdlcGF0aFwiPjwvZGl2Pic7XG5cdFx0XHRwcm9wZXJ0eV9wYW5lbC5pbm5lckhUTUwgKz0gcGFuZWxfaW1hZ2U7XG5cblx0XHRcdHZhciBwYW5lbF9zaXplID0gJzxkaXYgY2xhc3M9XCJmaWVsZCBsYWJlbHNpZGVcIj48cD5TaXplOjwvcD48dWwgaWQ9XCJwcm9wZXJ0eS1zaXplXCIgY2xhc3M9XCJidXR0b25zIG5vc2VsZWN0XCI+Jztcblx0XHRcdFxuXHRcdFx0Ly9wYW5lbF9zaXplICs9ICc8L3VsPjwvZGl2Pic7XG5cdFx0XHRcblxuXHRcdFx0Ly92YXIgcHJvcHNpemUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnR5LXNpemVcIik7XG5cdFx0XHRmb3IgKHM9MTsgcyA8PSA0OyBzKyspIHtcblx0XHRcdFx0Ly92YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG5cdFx0XHRcdC8vaWYgKG5vZGUuc2l6ZSA9PSBzKSBsaS5jbGFzc05hbWUgPSBcInNlbGVjdGVkXCI7XG5cdFx0XHRcdC8vbGkuaW5uZXJIVE1MID0gcy50b1N0cmluZygpO1xuXHRcdFx0XHQvKmxpLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcInNldCB0byBzaXplIFwiICsgcyk7XG5cdFx0XHRcdFx0bm9kZS5zaXplID0gcztcblx0XHRcdFx0XHR0aGlzLmNsYXNzTmFtZSA9IFwic2VsZWN0ZWRcIjtcblx0XHRcdFx0fTsqL1xuXHRcdFx0XHQvL3Byb3BzaXplLmFwcGVuZENoaWxkKGxpKTtcblx0XHRcdFx0dmFyIHNlbGVjdGVkID0gKHMgPT0gbm9kZS5zaXplKSA/ICdjbGFzcz1cInNlbGVjdGVkXCInIDogJyc7XG5cdFx0XHRcdHBhbmVsX3NpemUgKz0gJzxsaSAnICsgc2VsZWN0ZWQgKyAnIG9uY2xpY2s9XCJjdXJyZW50bHlTZWxlY3RlZC5jaGFuZ2VTaXplKCcgKyBzLnRvU3RyaW5nKCkgKyAnKVwiPicgKyBzLnRvU3RyaW5nKCkgKyAnPC9saT4nO1xuXHRcdFx0fVxuXHRcdFx0cGFuZWxfc2l6ZSArPSAnPC91bD48L2Rpdj4nO1xuXHRcdFx0cHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MICs9IHBhbmVsX3NpemU7XG5cblx0XHRcdHZhciBkZWxldGVfYnV0dG9uID0gJzxkaXYgY2xhc3M9XCJmaWVsZFwiPjxpbnB1dCBpZD1cImRlbGV0ZVwiIGNsYXNzPVwiYnV0dG9uIGRlbGV0ZS1idXR0b25cIiB0eXBlPVwic3VibWl0XCIgdmFsdWU9XCJEZWxldGUgUGFuZWxcIj48L2Rpdj4nO1xuXHRcdFx0cHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MICs9IGRlbGV0ZV9idXR0b247XG5cdFx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2RlbGV0ZVwiKS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwibG9sXCIpO1xuXHRcdFx0XHRub2RlQ29udGFpbmVyLnJlbW92ZUNoaWxkKGN1cnJlbnRseVNlbGVjdGVkKTtcblx0XHRcdH07XG5cblx0XHRcdHZhciBwcm9wbmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcHJvcGVydHktbmFtZVwiKTtcblx0XHRcdHByb3BuYW1lLm9uY2hhbmdlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdG5vZGUubmFtZSA9IHByb3BuYW1lLnZhbHVlO1xuXHRcdFx0XHR2YXIgcHJvcGhlYWQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI29iamVjdC1uYW1lXCIpO1xuXHRcdFx0XHRwcm9waGVhZC5pbm5lckhUTUwgPSAnPGRpdiBpZD1cIm9iamVjdC1uYW1lXCI+JyArXG5cdFx0XHRcdFx0XHRcdFx0XHQnPHA+JyArIG5vZGUubmFtZSArICc8c3BhbiBjbGFzcz1cImVsZW1lbnQtaWRcIj4jJyArIG5vZGVDb250YWluZXIuZ2V0Q2hpbGRJbmRleChub2RlKSArICc8L3NwYW4+PC9wPicgK1xuXHRcdFx0XHRcdFx0XHRcdCc8L2Rpdj4nO1xuXHRcdFx0fVxuXG5cdFx0XHRwcm9wbmFtZS5vbmtleXVwID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2cocHJvcHRleHQudmFsdWUpO1xuXHRcdFx0XHRub2RlLm5hbWUgPSBwcm9wbmFtZS52YWx1ZTtcblx0XHRcdFx0dmFyIHByb3BoZWFkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNvYmplY3QtbmFtZVwiKTtcblx0XHRcdFx0cHJvcGhlYWQuaW5uZXJIVE1MID0gJzxkaXYgaWQ9XCJvYmplY3QtbmFtZVwiPicgK1xuXHRcdFx0XHRcdFx0XHRcdFx0JzxwPicgKyBub2RlLm5hbWUgKyAnPHNwYW4gY2xhc3M9XCJlbGVtZW50LWlkXCI+IycgKyBub2RlQ29udGFpbmVyLmdldENoaWxkSW5kZXgobm9kZSkgKyAnPC9zcGFuPjwvcD4nICtcblx0XHRcdFx0XHRcdFx0XHQnPC9kaXY+Jztcblx0XHRcdH07XG5cblx0XHRcdHZhciBwcm9waW1hZ2UgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnR5LWltYWdlcGF0aFwiKTtcblx0XHRcdHByb3BpbWFnZS5vbmNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQvL25vZGUuaW1hZ2UgPSBwcm9waW1hZ2UudmFsdWU7XG5cdFx0XHRcdHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRcdFx0aW1nLnNyYyA9IHByb3BpbWFnZS52YWx1ZTtcblx0XHRcdFx0aW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdG5vZGUuaW1hZ2UgPSBwcm9waW1hZ2UudmFsdWU7XG5cdFx0XHRcdFx0bm9kZS5wYW5lbGJpdG1hcC5pbWFnZSA9IGltZztcblx0XHRcdFx0XHRub2RlLnNlbGVjdGVkLmdyYXBoaWNzLmNsZWFyKCk7XG5cdFx0XHRcdFx0dmFyIHRoaWNrbmVzcyA9IDM7XG5cdFx0XHRcdFx0bm9kZS5zZWxlY3RlZC5ncmFwaGljcy5mKFwiIzAwOTllZVwiKS5kcigtdGhpY2tuZXNzLC10aGlja25lc3Msbm9kZS5wYW5lbGJpdG1hcC5pbWFnZS53aWR0aCpub2RlLnBhbmVsYml0bWFwLnNjYWxlWCt0aGlja25lc3MqMiwgbm9kZS5wYW5lbGJpdG1hcC5pbWFnZS5oZWlnaHQqbm9kZS5wYW5lbGJpdG1hcC5zY2FsZVkrdGhpY2tuZXNzKjIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGltZy5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dmFyIGRpYWxvZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZGlhbG9nXCIpO1xuXHRcdFx0XHRcdGRpYWxvZy5pbm5lckhUTUwgPSBcIjxwPidcIiArIHByb3BpbWFnZS52YWx1ZSArIFwiJyBjb3VsZCBub3QgYmUgbG9hZGVkPHA+XCI7XG5cdFx0XHRcdFx0Ly9kaWFsb2cuc3R5bGUudG9wID0gXCI1MCVcIjtcblx0XHRcdFx0XHQvL2RpYWxvZy5zdHlsZS5sZWZ0ID0gXCI1MCVcIjtcblx0XHRcdFx0XHRkaWFsb2cuc3R5bGUub3BhY2l0eSA9IFwiMC44XCI7XG5cdFx0XHRcdFx0ZGlhbG9nLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiIzUyMlwiO1xuXHRcdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRkaWFsb2cuc3R5bGUub3BhY2l0eSA9IFwiMFwiO1xuXHRcdFx0XHRcdH0sIDIwMDApO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblx0XHRcblx0fTtcblxuXHRQYW5lbC5wcm90b3R5cGUucmVtb3ZlQ2hpbGQgPSBmdW5jdGlvbihjaGlsZCkge1xuXHRcdHZhciB2aWV3ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN2aWV3XCIpO1xuXHRcdHZhciBlbG0gPSBjaGlsZC5jaGlsZHJlblsxXS5odG1sRWxlbWVudDtcblx0XHRjb25zb2xlLmxvZyhlbG0pO1xuXHRcdHZpZXcucmVtb3ZlQ2hpbGQoZWxtKTtcblx0XHR0aGlzLk5vZGVfcmVtb3ZlQ2hpbGQoY2hpbGQpO1xuXHRcdGRyYXdBbGxDb25uZWN0aW9ucygpO1xuXHR9XG5cblx0UGFuZWwucHJvdG90eXBlLmNoYW5nZVNpemUgPSBmdW5jdGlvbihzaXplKSB7XG5cdFx0dGhpcy5zaXplID0gc2l6ZTtcblx0XHR2YXIgc2NhbGUgPSAwLjI1O1xuXHRcdHNjYWxlID0gdGhpcy5zaXplKjQwMCpzY2FsZSAvIHRoaXMucGFuZWxiaXRtYXAuaW1hZ2Uud2lkdGg7XG5cdFx0dGhpcy5wYW5lbGJpdG1hcC5zY2FsZVggPSBzY2FsZTtcblx0XHR0aGlzLnBhbmVsYml0bWFwLnNjYWxlWSA9IHNjYWxlO1xuXHRcdHZhciBwcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcHJvcGVydHktc2l6ZVwiKTtcblx0XHRmb3IgKHM9MDsgcyA8IHBzLmNoaWxkcmVuLmxlbmd0aDsgcysrKSB7XG5cdFx0XHRwcy5jaGlsZHJlbltzXS5jbGFzc05hbWUgPSAocysxID09IHRoaXMuc2l6ZSkgPyBcInNlbGVjdGVkXCIgOiBcIlwiO1xuXHRcdH1cblx0XHR0aGlzLnNlbGVjdGVkLmdyYXBoaWNzLmNsZWFyKCk7XG5cdFx0dmFyIHRoaWNrbmVzcyA9IDM7XG5cdFx0dGhpcy5zZWxlY3RlZC5ncmFwaGljcy5mKFwiIzAwOTllZVwiKS5kcigtdGhpY2tuZXNzLC10aGlja25lc3MsdGhpcy5wYW5lbGJpdG1hcC5pbWFnZS53aWR0aCp0aGlzLnBhbmVsYml0bWFwLnNjYWxlWCt0aGlja25lc3MqMiwgdGhpcy5wYW5lbGJpdG1hcC5pbWFnZS5oZWlnaHQqdGhpcy5wYW5lbGJpdG1hcC5zY2FsZVkrdGhpY2tuZXNzKjIpO1xuXHR9O1xuXG5cdHdpbmRvdy5QYW5lbCA9IGNyZWF0ZWpzLnByb21vdGUoUGFuZWwsIFwiTm9kZVwiKTtcblxuXHQvLyAtLS0tLS0tLS0tLS0gLy9cblx0Ly8gUGFuZWxFbGVtZW50IC8vXG5cdC8vIC0tLS0tLS0tLS0tLSAvL1xuXG5cdGZ1bmN0aW9uIFBhbmVsRWxlbWVudChvYmosIGJpdG1hcCkge1xuXHRcdHRoaXMuQ29udGFpbmVyX2NvbnN0cnVjdG9yKCk7XG5cdFx0dGhpcy5wYW5lbGJpdG1hcCA9IGJpdG1hcDtcblx0XHR0aGlzLnNldHVwKG9iaik7XG5cdH0gY3JlYXRlanMuZXh0ZW5kKFBhbmVsRWxlbWVudCwgY3JlYXRlanMuQ29udGFpbmVyKTtcblxuXHRQYW5lbEVsZW1lbnQucHJvdG90eXBlLnNldHVwID0gZnVuY3Rpb24ob2JqKSB7XG5cdFx0aWYgKG9iai5nb3RvICE9IC0xKSB0aGlzLmdvdG8gPSBvYmouZ290bztcblx0XHQvL3RoaXMudHlwZSA9IG9iai50eXBlO1xuXHRcdHRoaXMuYWxpZ24gPSBvYmouYWxpZ247XG5cdFx0dGhpcy5idWJibGVfdHlwZSA9IG9iai5idWJibGVfdHlwZTtcblx0XHR0aGlzLnRleHQgPSBvYmoudGV4dDtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG9iai5wb3NpdGlvbjtcblxuXHRcdC8vdmFyIHBhbmVsID0gcGFuZWxzW2ldO1xuXHRcdHZhciBzYiA9IG9iajtcblxuXHRcdHZhciBkaXYgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpZXdcIikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKSk7XG5cdFx0dmFyIGJ1YmJsZV9vcmllbnQgPSBzYi5idWJibGVfdHlwZTtcblxuXHRcdGlmIChvYmouaW1hZ2UgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0dGhpcy5pbWFnZSA9IG9iai5pbWFnZTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHR2YXIgaW1hZ2UgPSBcIlwiO1xuXHRcdFx0dmFyIGJ1YmJsZV9zaXplID0gXCJtZWRpdW1cIjtcblx0XHRcdGlmIChzYi50ZXh0Lmxlbmd0aCA8IDQpIHtcblx0XHRcdFx0YnViYmxlX3NpemUgPSBcInNtYWxsXCI7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGltYWdlICs9IGJ1YmJsZV9zaXplO1xuXHRcdFx0aWYgKGJ1YmJsZV9vcmllbnQgPT0gXCJib3hcIikge1xuXHRcdFx0XHRpbWFnZSArPSBcIl9ib3gucG5nXCI7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGltYWdlICs9IFwiX2J1YmJsZV9cIiArIGJ1YmJsZV9vcmllbnQgKyBcIi5wbmdcIjtcblx0XHRcdHRoaXMuaW1hZ2UgPSAnZ2FtZS9pbWcvYnViYmxlcy8nICsgaW1hZ2U7XG5cdFx0fVxuXG5cdFx0ZGl2LmlubmVySFRNTCA9IFwiPHA+XCIgKyBzYi50ZXh0LnJlcGxhY2UoL1xcbi9nLCBcIjxicj5cIikgKyBcIjwvcD5cIjtcblxuXHRcdGRpdi5jbGFzc05hbWUgPSBcImJ1YmJsZVwiO1xuXHRcdGlmIChidWJibGVfb3JpZW50ID09IFwiYm94XCIpIGRpdi5jbGFzc05hbWUgKz0gXCIgYm94XCI7XG5cdFx0ZGl2LmNsYXNzTmFtZSArPSBcIiBub3NlbGVjdFwiO1xuXHRcdGRpdi5zdHlsZS5vcGFjaXR5ID0gJzAnO1xuXHRcdGRpdi5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSAndXJsKFwiJyArIHRoaXMuaW1hZ2UgKydcIiknO1xuXHRcdGRpdi5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcblx0XHRkaXYuc3R5bGUudG9wID0gMDtcblx0XHRkaXYuc3R5bGUubGVmdCA9IDA7XG5cblx0XHQvL2RvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdmlld1wiKS5hcHBlbmRDaGlsZChkaXYpO1xuXG5cdFx0XG5cblxuXHRcdHRoaXMuc2NhbGVYID0gMC42O1xuXHRcdHRoaXMuc2NhbGVZID0gMC42O1xuXG5cdFx0dGhpcy54ID0gc2IucG9zaXRpb24ueCAqIHRoaXMucGFuZWxiaXRtYXAuaW1hZ2Uud2lkdGgqdGhpcy5wYW5lbGJpdG1hcC5zY2FsZVg7XG5cdFx0dGhpcy55ID0gc2IucG9zaXRpb24ueSAqIHRoaXMucGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0KnRoaXMucGFuZWxiaXRtYXAuc2NhbGVZO1xuXHRcdC8vdGhpcy54ID0gZWxtLng7XG5cdFx0Ly90aGlzLnkgPSBlbG0ueTtcblx0XHR0aGlzLnJlZ1ggPSBkaXYuY2xpZW50V2lkdGgvMjtcblx0XHR0aGlzLnJlZ1kgPSBkaXYuY2xpZW50SGVpZ2h0O1xuXHRcdHRoaXMud2lkdGggPSBkaXYuY2xpZW50V2lkdGg7XG5cdFx0dGhpcy5oZWlnaHQgPSBkaXYuY2xpZW50SGVpZ2h0O1xuXHRcdGlmIChidWJibGVfb3JpZW50ID09IFwibGVmdFwiKSB7XG5cdFx0XHR0aGlzLnJlZ1ggPSAwO1xuXHRcdH1cblxuXHRcdHZhciBhbGlnbl94ID0gXCJsZWZ0XCI7XG5cdFx0dmFyIGFsaWduX3kgPSBcInRvcFwiO1xuXHRcdGlmIChzYi5hbGlnbiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRhbGlnbl94ID0gc2IuYWxpZ24ueDtcblx0XHRcdGFsaWduX3kgPSBzYi5hbGlnbi55O1xuXHRcdH1cblx0XHRpZiAoYWxpZ25feCA9PSBcInJpZ2h0XCIpIHtcblx0XHRcdHRoaXMucmVnWCA9IGRpdi5jbGllbnRXaWR0aDtcblx0XHRcdHRoaXMueCA9IHRoaXMucGFuZWxiaXRtYXAuaW1hZ2Uud2lkdGgqdGhpcy5wYW5lbGJpdG1hcC5zY2FsZVgtdGhpcy54O1xuXHRcdH1cblx0XHRpZiAoYWxpZ25feSA9PSBcImJvdHRvbVwiKSB7XG5cdFx0XHR0aGlzLnJlZ1kgPSBkaXYuY2xpZW50SGVpZ2h0O1xuXHRcdFx0dGhpcy55ID0gdGhpcy5wYW5lbGJpdG1hcC5pbWFnZS5oZWlnaHQqdGhpcy5wYW5lbGJpdG1hcC5zY2FsZVktdGhpcy55O1xuXHRcdH1cblx0XHR2YXIgc2VsZWN0ZWQgPSBuZXcgY3JlYXRlanMuU2hhcGUoKTtcblx0XHR2YXIgaGl0c2hhcGUgPSBuZXcgY3JlYXRlanMuU2hhcGUoKTtcblx0XHRoaXRzaGFwZS5ncmFwaGljcy5mKFwiIzAwMFwiKS5kcigwLDAsdGhpcy53aWR0aCx0aGlzLmhlaWdodCk7XG5cdFx0dGhpcy5oaXRBcmVhID0gaGl0c2hhcGU7XG5cdFx0dmFyIGVsbSA9IG5ldyBjcmVhdGVqcy5ET01FbGVtZW50KGRpdik7XG5cdFx0dGhpcy5hZGRDaGlsZChzZWxlY3RlZCwgZWxtKTtcblx0XHRkaXYub3BhY2l0eSA9ICcxJztcblx0XHRlbG0ueCA9IDA7XG5cdFx0ZWxtLnkgPSAwO1xuXHRcdC8vdGhpcy5hZGRDaGlsZChoaXRzaGFwZSk7XG5cdFx0dGhpcy5vbihcIm1vdXNlZG93blwiLCB0aGlzLnNldERyYWdPZmZzZXQpO1xuXHRcdHRoaXMub24oXCJwcmVzc21vdmVcIiwgdGhpcy5kcmFnRWxlbWVudCk7XG5cdFx0Ly90aGlzLm9uKFwiY2xpY2tcIiwgdGhpcy5zaG93UHJvcGVydGllcyk7XG5cdFx0Ly9lbG0ucmVnWSA9IGVsbS5nZXRCb3VuZHMoKS5oZWlnaHQ7XG5cdFx0Ly9lbGVtZW50cy5hZGRDaGlsZChlbG0pO1xuXHR9O1xuXG5cdFBhbmVsRWxlbWVudC5wcm90b3R5cGUudXBkYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlbGVtZW50ID0gdGhpcy5jaGlsZHJlblsxXS5odG1sRWxlbWVudDsgXG5cdFx0ZWxlbWVudC5pbm5lckhUTUwgPSAnPHA+JyArIHRoaXMudGV4dC5yZXBsYWNlKC9cXG4vZywgXCI8YnI+XCIpICsgJzwvcD4nO1xuXHRcdHRoaXMud2lkdGggPSBlbGVtZW50LmNsaWVudFdpZHRoO1xuXHRcdHRoaXMuaGVpZ2h0ID0gZWxlbWVudC5jbGllbnRIZWlnaHQ7XG5cdFx0dGhpcy5yZWdYID0gZWxlbWVudC5jbGllbnRXaWR0aC8yO1xuXHRcdHRoaXMucmVnWSA9IGVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuXG5cdFx0Lyp2YXIgaW1hZ2UgPSBcIlwiO1xuXHRcdHZhciBidWJibGVfc2l6ZSA9IFwibWVkaXVtXCI7XG5cdFx0aWYgKHRoaXMudGV4dC5sZW5ndGggPCA0KSB7XG5cdFx0XHRidWJibGVfc2l6ZSA9IFwic21hbGxcIjtcblx0XHR9XG5cdFx0dmFyIGJ1YmJsZV9vcmllbnQgPSB0aGlzLmJ1YmJsZV90eXBlO1xuXHRcdGltYWdlICs9IGJ1YmJsZV9zaXplO1xuXHRcdGlmIChidWJibGVfb3JpZW50ID09IFwiYm94XCIpIHtcblx0XHRcdGltYWdlICs9IFwiX2JveC5wbmdcIjtcblx0XHR9XG5cdFx0ZWxzZSBpbWFnZSArPSBcIl9idWJibGVfXCIgKyBidWJibGVfb3JpZW50ICsgXCIucG5nXCI7XG5cdFx0ZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBcInVybChcXFwiZ2FtZS9pbWcvYnViYmxlcy9cIitpbWFnZStcIlxcXCIpXCI7Ki9cblx0XHRlbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHRoaXMuaW1hZ2U7XG5cblx0XHRpZiAodGhpcy5hbGlnbiAhPT0gdW5kZWZpbmVkICYmIHRoaXMuYWxpZ24ueCA9PSBcInJpZ2h0XCIpIHtcblx0XHRcdHRoaXMucmVnWCA9IGVsZW1lbnQuY2xpZW50V2lkdGg7XG5cdFx0fVxuXHR9O1xuXG5cdFBhbmVsRWxlbWVudC5wcm90b3R5cGUuc2hvd1Byb3BlcnRpZXMgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgbm9kZSA9IHRoaXM7XG5cdFx0Ly9pZiAoY3VycmVudGx5U2VsZWN0ZWQgPT0gdGhpcykgcmV0dXJuO1xuXHRcdC8vY3VycmVudGx5U2VsZWN0ZWQgPSB0aGlzO1xuXG5cdFx0Ly9jb25zb2xlLmxvZyhcIlNob3dpbmcgcHJvcGVydGllcyBmb3Igbm9kZSBcIiArIG5vZGUubmFtZSApO1xuXG5cdFx0dmFyIHByb3BlcnR5X3BhbmVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNwcm9wZXJ0aWVzXCIpO1xuXG5cdFx0dmFyIHByb3BlcnR5X2hlYWRlciA9IFx0JzxkaXYgaWQ9XCJvYmplY3QtbmFtZVwiPicgK1xuXHRcdFx0XHRcdFx0XHRcdFx0JzxwPicgKyBub2RlLnBhcmVudC5uYW1lICsgJzxzcGFuIGNsYXNzPVwiZWxlbWVudC1pZFwiPicgKyBub2RlLnBhcmVudC5jb25zdHJ1Y3Rvci5uYW1lICsgJyAjJyArIG5vZGVDb250YWluZXIuZ2V0Q2hpbGRJbmRleChub2RlLnBhcmVudCkgKyAnIC0gJyArIG5vZGUuY29uc3RydWN0b3IubmFtZSArICc8L3NwYW4+PC9wPicgK1xuXHRcdFx0XHRcdFx0XHRcdCc8L2Rpdj4nO1xuXHRcdHByb3BlcnR5X3BhbmVsLmlubmVySFRNTCA9IHByb3BlcnR5X2hlYWRlcjtcblxuXHRcdC8vdmFyIG5vZGVfbmFtZSA9ICc8ZGl2IGNsYXNzPVwiZmllbGQgbGFiZWxzaWRlXCI+PHA+TmFtZTo8L3A+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgdmFsdWU9XCInICsgbm9kZS5uYW1lICsgJ1wiIGlkPVwicHJvcGVydHktbmFtZVwiPjwvZGl2Pic7XG5cdFx0Ly9wcm9wZXJ0eV9wYW5lbC5pbm5lckhUTUwgKz0gbm9kZV9uYW1lO1xuXG5cdFx0dmFyIHByb3BfdGV4dCA9ICc8ZGl2IGNsYXNzPVwiZmllbGQgbGFiZWx0b3BcIj48cD5UZXh0OjwvcD48dGV4dGFyZWEgaWQ9XCJwcm9wZXJ0eS10ZXh0XCI+JyArXG5cdFx0bm9kZS50ZXh0ICtcblx0XHQnPC90ZXh0YXJlYT48L2Rpdj4nO1xuXG5cdFx0Ly92YXIgcGFuZWxfaW1hZ2UgPSAnPGRpdiBjbGFzcz1cImZpZWxkIGxhYmVsdG9wXCI+PHA+SW1hZ2UgVVJMOjwvcD48aW5wdXQgdHlwZT1cInRleHRcIiB2YWx1ZT1cIicgKyBub2RlLmltYWdlICsgJ1wiIGlkPVwicHJvcGVydHktaW1hZ2VwYXRoXCI+PC9kaXY+Jztcblx0XHRwcm9wZXJ0eV9wYW5lbC5pbm5lckhUTUwgKz0gcHJvcF90ZXh0O1xuXG5cdFx0Ly92YXIgcGFuZWxfc2l6ZSA9ICc8ZGl2IGNsYXNzPVwiZmllbGQgbGFiZWxzaWRlXCI+PHA+U2l6ZTo8L3A+PHVsIGlkPVwicHJvcGVydHktc2l6ZVwiIGNsYXNzPVwibnVtYmVyYnV0dG9ucyBub3NlbGVjdFwiPic7XG5cdFx0XG5cdFx0Ly9wYW5lbF9zaXplICs9ICc8L3VsPjwvZGl2Pic7XG5cdFx0XG5cdFx0LypwYW5lbF9zaXplICs9ICc8L3VsPjwvZGl2Pic7XG5cdFx0cHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MICs9IHBhbmVsX3NpemU7Ki9cblx0XHQvKnZhciBwcm9wbmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcHJvcGVydHktbmFtZVwiKTtcblx0XHRwcm9wbmFtZS5vbmNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0bm9kZS5uYW1lID0gcHJvcG5hbWUudmFsdWU7XG5cdFx0fSovXG5cblx0XHR2YXIgZGVsZXRlX2J1dHRvbiA9ICc8ZGl2IGNsYXNzPVwiZmllbGRcIj48aW5wdXQgaWQ9XCJkZWxldGVcIiBjbGFzcz1cImJ1dHRvbiBkZWxldGUtYnV0dG9uXCIgdHlwZT1cInN1Ym1pdFwiIHZhbHVlPVwiRGVsZXRlIFBhbmVsXCI+PC9kaXY+Jztcblx0XHRwcm9wZXJ0eV9wYW5lbC5pbm5lckhUTUwgKz0gZGVsZXRlX2J1dHRvbjtcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2RlbGV0ZVwiKS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhub2RlLnBhcmVudCk7XG5cdFx0XHRub2RlLnBhcmVudC5yZW1vdmVDaGlsZChjdXJyZW50bHlTZWxlY3RlZCk7XG5cdFx0fTtcblxuXHRcdHZhciBwcm9wdGV4dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcHJvcGVydHktdGV4dFwiKTtcblx0XHRwcm9wdGV4dC5vbmtleXVwID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHByb3B0ZXh0LnZhbHVlKTtcblx0XHRcdG5vZGUudGV4dCA9IHByb3B0ZXh0LnZhbHVlO1xuXHRcdFx0bm9kZS51cGRhdGVFbGVtZW50KCk7XG5cdFx0fTtcblxuXHRcdFxuXHRcdFxuXHR9O1xuXG5cdFBhbmVsRWxlbWVudC5wcm90b3R5cGUuc2V0RHJhZ09mZnNldCA9IGZ1bmN0aW9uKGV2dCkge1xuXHRcdHZhciBnbG9iYWwgPSBldnQudGFyZ2V0LnBhcmVudC5sb2NhbFRvR2xvYmFsKGV2dC50YXJnZXQueCwgZXZ0LnRhcmdldC55KTtcblx0XHRkcmFnb2Zmc2V0ID0ge1xuXHRcdFx0eDogZXZ0LnN0YWdlWCAtIGdsb2JhbC54LFxuXHRcdFx0eTogZXZ0LnN0YWdlWSAtIGdsb2JhbC55XG5cdFx0fTtcblx0XHQvL2N1cnJlbnRseVNlbGVjdGVkID0gZXZ0LnRhcmdldC5wYXJlbnQ7XG5cdFx0aWYgKGN1cnJlbnRseVNlbGVjdGVkICE9PSB1bmRlZmluZWQgJiYgY3VycmVudGx5U2VsZWN0ZWQuc2VsZWN0ZWQgIT09IHVuZGVmaW5lZCkgY3VycmVudGx5U2VsZWN0ZWQuc2VsZWN0ZWQuZ3JhcGhpY3MuY2xlYXIoKTtcblx0XHRjdXJyZW50bHlTZWxlY3RlZCA9IGV2dC50YXJnZXQ7XG5cdFx0b3BlblRhYihcInByb3BlcnR5VGFiXCIpO1xuXHRcdC8vZXZ0LnRhcmdldC5zaG93UHJvcGVydGllcygpO1xuXHR9O1xuXG5cdFBhbmVsRWxlbWVudC5wcm90b3R5cGUuZHJhZ0VsZW1lbnQgPSBmdW5jdGlvbihldnQpIHtcblx0XHQvL2NvbnNvbGUubG9nKFwiQ2xpY2shXCIpO1xuXHRcdHZhciBsb2NhbCA9IGV2dC50YXJnZXQucGFyZW50Lmdsb2JhbFRvTG9jYWwoZXZ0LnN0YWdlWCAtIGRyYWdvZmZzZXQueCwgZXZ0LnN0YWdlWSAtIGRyYWdvZmZzZXQueSk7XG5cdFx0dmFyIHBhbmVsYml0bWFwID0gZXZ0LnRhcmdldC5wYXJlbnQucGFuZWxiaXRtYXA7XG5cdFx0dmFyIHBhbmVsID0ge1xuXHRcdFx0d2lkdGg6IHBhbmVsYml0bWFwLmltYWdlLndpZHRoKnBhbmVsYml0bWFwLnNjYWxlWCxcblx0XHRcdGhlaWdodDogcGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0KnBhbmVsYml0bWFwLnNjYWxlWVxuXHRcdH07XG5cdFx0aWYgKGxvY2FsLnggPCAwKSBsb2NhbC54ID0gMDtcblx0XHRpZiAobG9jYWwueCA+IHBhbmVsLndpZHRoKSBsb2NhbC54ID0gcGFuZWwud2lkdGg7XG5cdFx0aWYgKGxvY2FsLnkgPCAwKSBsb2NhbC55ID0gMDtcblx0XHRpZiAobG9jYWwueSA+IHBhbmVsLmhlaWdodCkgbG9jYWwueSA9IHBhbmVsLmhlaWdodDtcblx0XHRldnQudGFyZ2V0LnggPSBsb2NhbC54O1xuXHRcdGV2dC50YXJnZXQueSA9IGxvY2FsLnk7XG4gICAgICAgIC8qZXZ0LnRhcmdldC5wb3NpdGlvbiA9IHsgXG4gICAgICAgICAgICB4OiBsb2NhbC54L2V2dC50YXJnZXQucGFuZWxiaXRtYXAuaW1hZ2Uud2lkdGgvZXZ0LnRhcmdldC5wYW5lbGJpdG1hcC5zY2FsZVgqMTAwLCBcbiAgICAgICAgICAgIHk6IGxvY2FsLnkvZXZ0LnRhcmdldC5wYW5lbGJpdG1hcC5pbWFnZS5oZWlnaHQvZXZ0LnRhcmdldC5wYW5lbGJpdG1hcC5zY2FsZVkqMTAwIH0qL1xuXHRcdGV2dC50YXJnZXQucGFyZW50LmRyYXdDb25uZWN0aW9ucygpO1xuXHR9O1xuXG5cdHdpbmRvdy5QYW5lbEVsZW1lbnQgPSBjcmVhdGVqcy5wcm9tb3RlKFBhbmVsRWxlbWVudCwgXCJDb250YWluZXJcIik7XG5cblxuXHQvLyAtLS0tLS0tLS0tLS0tLS0gLy9cblx0Ly8gIE5vZGVDb250YWluZXIgIC8vXG5cdC8vIC0tLS0tLS0tLS0tLS0tLSAvL1xuXG5cdGZ1bmN0aW9uIE5vZGVDb250YWluZXIoKSB7XG5cdFx0dGhpcy5Db250YWluZXJfY29uc3RydWN0b3IoKTtcblx0XHR0aGlzLnN0YXJ0bm9kZSA9IDA7XG5cdH0gY3JlYXRlanMuZXh0ZW5kKE5vZGVDb250YWluZXIsIGNyZWF0ZWpzLkNvbnRhaW5lcik7XG5cblxuXHROb2RlQ29udGFpbmVyLnByb3RvdHlwZS5zaG93UHJvcGVydGllcyA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0Ly9jb25zb2xlLmxvZyh0aGlzKTtcblxuXHRcdC8vZiAoY3VycmVudGx5U2VsZWN0ZWQgPT0gdGhpcykgcmV0dXJuO1xuXHRcdC8vY3VycmVudGx5U2VsZWN0ZWQgPSB0aGlzO1xuXG5cdFx0dmFyIHByb3BlcnR5X3BhbmVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNwcm9wZXJ0aWVzXCIpO1xuXG5cdFx0dmFyIHByb3BlcnR5X2hlYWRlciA9IFx0JzxkaXYgaWQ9XCJvYmplY3QtbmFtZVwiPicgK1xuXHRcdFx0XHRcdFx0XHRcdFx0JzxwPlByb2plY3QgUHJvcGVydGllczwvcD4nICtcblx0XHRcdFx0XHRcdFx0XHQnPC9kaXY+Jztcblx0XHRwcm9wZXJ0eV9wYW5lbC5pbm5lckhUTUwgPSBwcm9wZXJ0eV9oZWFkZXI7XG5cblx0XHR2YXIgcHJvcF9zdGFydG5vZGUgPSAnPGRpdiBjbGFzcz1cImZpZWxkIGxhYmVsc2lkZVwiPjxwPlN0YXJ0IG5vZGU6PC9wPjxpbnB1dCB0eXBlPVwibnVtYmVyXCIgdmFsdWU9XCInICsgdGhpcy5zdGFydG5vZGUgKyAnXCIgaWQ9XCJwcm9wZXJ0eS1zdGFydG5vZGVcIj48L2Rpdj4nO1xuXHRcdHByb3BlcnR5X3BhbmVsLmlubmVySFRNTCArPSBwcm9wX3N0YXJ0bm9kZTtcblxuXHRcdHZhciBwcm9wc3RhcnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnR5LXN0YXJ0bm9kZVwiKTtcblx0XHR2YXIgY29udGFpbmVyID0gdGhpcztcblx0XHRwcm9wc3RhcnQub25jaGFuZ2UgPSBmdW5jdGlvbigpIHtcblx0XHRcdGNvbnNvbGUubG9nKFwiU3RhcnQgbm9kZSBjaGFuZ2VkXCIsIHByb3BzdGFydC52YWx1ZSk7XG5cdFx0XHRjb250YWluZXIuc3RhcnRub2RlID0gcHJvcHN0YXJ0LnZhbHVlO1xuXHRcdFx0Y29uc29sZS5sb2coY29udGFpbmVyLnN0YXJ0bm9kZSk7XG5cdFx0fTtcblx0XHRcblx0fTtcblxuXHROb2RlQ29udGFpbmVyLnByb3RvdHlwZS5tYWtlQ29ubmVjdGlvbnMgPSBmdW5jdGlvbigpIHtcblxuXHRcdGZvciAoaT0wOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIG5vZGUgPSB0aGlzLmNoaWxkcmVuW2ldO1xuXHRcdFx0aWYgKG5vZGUuZ290byAhPT0gdW5kZWZpbmVkKSBub2RlLmdvdG8gPSB0aGlzLmdldENoaWxkQXQobm9kZS5nb3RvKTtcblx0XHRcdGZvciAoZT0wOyBlIDwgbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGUrKykge1xuXHRcdFx0XHR2YXIgZWxlbSA9IG5vZGUuY2hpbGRyZW5bZV07XG5cdFx0XHRcdGlmIChlbGVtIGluc3RhbmNlb2YgUGFuZWxFbGVtZW50ICYmIGVsZW0uZ290byAhPT0gdW5kZWZpbmVkKSBlbGVtLmdvdG8gPSB0aGlzLmdldENoaWxkQXQoZWxlbS5nb3RvKTtcblx0XHRcdH1cblx0XHR9XG5cblx0fTtcblxuXHQvLyBPdmVyd3JpdGUgQ29udGFpbmVyLnJlbW92ZUNoaWxkKClcblx0Tm9kZUNvbnRhaW5lci5wcm90b3R5cGUucmVtb3ZlQ2hpbGQgPSBmdW5jdGlvbihjaGlsZCkge1xuXHRcdHZhciB2aWV3ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN2aWV3XCIpO1xuXHRcdGZvciAoZT0wOyBlPGNoaWxkLmNoaWxkcmVuLmxlbmd0aDsgZSsrKSB7XG5cdFx0XHR2YXIgZWxtID0gY2hpbGQuY2hpbGRyZW5bZV07XG5cdFx0XHRjb25zb2xlLmxvZyhlbG0pO1xuXHRcdFx0aWYgKGVsbSBpbnN0YW5jZW9mIFBhbmVsRWxlbWVudCkge1xuXHRcdFx0XHRlbG0gPSBlbG0uY2hpbGRyZW5bMV0uaHRtbEVsZW1lbnQ7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGVsbSk7XG5cdFx0XHRcdHZpZXcucmVtb3ZlQ2hpbGQoZWxtKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5Db250YWluZXJfcmVtb3ZlQ2hpbGQoY2hpbGQpO1xuXHRcdGRyYXdBbGxDb25uZWN0aW9ucygpO1xuXHR9XG5cblx0Ly8gdG9PYmplY3QgLSBGb3Igb3V0cHV0dGluZyBlZGl0b3IgcGFyYW1ldGVycyB0byBhIEpTT04gb2JqZWN0XG5cblx0Tm9kZUNvbnRhaW5lci5wcm90b3R5cGUudG9PYmplY3QgPSBmdW5jdGlvbigpIHtcblxuXHRcdHZhciBvdXRwdXQgPSBuZXcgT2JqZWN0KCk7XG5cblx0XHRvdXRwdXQuY29uZmlnID0ge1xuXHRcdFx0c3RhcnRub2RlOiB0aGlzLnN0YXJ0bm9kZVxuXHRcdH07XG5cblx0XHRvdXRwdXQubm9kZXMgPSBbXTtcblx0XHRmb3IgKGk9MDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciByZWYgPSB0aGlzLmNoaWxkcmVuW2ldO1xuXHRcdFx0Ly8gY3ljbGUgdGhyb3VnaCBhbGwgbm9kZXMsIHNhdmluZyB0aGVpciBkYXRhIHRvIGFuIG9iamVjdFxuXHRcdFx0dmFyIG5vZGUgPSBuZXcgT2JqZWN0KCk7XG5cblx0XHRcdGlmIChyZWYgaW5zdGFuY2VvZiBQYW5lbCkge1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKG5vZGUubmFtZSk7XG5cdFx0XHRcdG5vZGUubmFtZSA9IHJlZi5uYW1lO1xuXHRcdFx0XHRub2RlLnNpemUgPSByZWYuc2l6ZTtcblx0XHRcdFx0bm9kZS5pbWFnZSA9IHJlZi5pbWFnZTtcblx0XHRcdFx0bm9kZS5nb3RvID0gdGhpcy5nZXRDaGlsZEluZGV4KHJlZi5nb3RvKTtcblx0XHRcdFx0aWYgKG5vZGUuZ290byA9PSAtMSkgbm9kZS5nb3RvID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRub2RlLmVkaXRvciA9IHtcblx0XHRcdFx0XHRwb3NpdGlvbjogeyB4OiByZWYueCwgeTogcmVmLnkgfVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdG5vZGUuZWxlbWVudHMgPSBbXTtcblxuXHRcdFx0XHRmb3IgKGU9MDsgZSA8IHJlZi5jaGlsZHJlbi5sZW5ndGg7IGUrKykge1xuXHRcdFx0XHRcdHZhciByX2VsZW0gPSByZWYuY2hpbGRyZW5bZV07XG5cdFx0XHRcdFx0aWYgKHJfZWxlbSBpbnN0YW5jZW9mIFBhbmVsRWxlbWVudCkge1xuXHRcdFx0XHRcdFx0dmFyIGVsZW0gPSBuZXcgT2JqZWN0KCk7XG5cblx0XHRcdFx0XHRcdGVsZW0udHlwZSA9IHJfZWxlbS50eXBlO1xuXHRcdFx0XHRcdFx0aWYgKHJfZWxlbS50ZXh0ICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdFx0ZWxlbS50ZXh0ID0gcl9lbGVtLnRleHQ7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbGVtLmJ1YmJsZV90eXBlID0gcl9lbGVtLmJ1YmJsZV90eXBlO1xuXHRcdFx0XHRcdFx0ZWxlbS5pbWFnZSA9IHJfZWxlbS5pbWFnZTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0ZWxlbS5wb3NpdGlvbiA9IHtcblx0XHRcdFx0XHRcdFx0eDpyX2VsZW0ueC8ocl9lbGVtLnBhbmVsYml0bWFwLmltYWdlLndpZHRoKnJfZWxlbS5wYW5lbGJpdG1hcC5zY2FsZVgpLFxuXHRcdFx0XHRcdFx0XHR5OnJfZWxlbS55LyhyX2VsZW0ucGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0KnJfZWxlbS5wYW5lbGJpdG1hcC5zY2FsZVkpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZiAocl9lbGVtLmFsaWduICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdFx0ZWxlbS5hbGlnbiA9IHJfZWxlbS5hbGlnbjtcblx0XHRcdFx0XHRcdFx0aWYgKGVsZW0uYWxpZ24ueCA9PSBcInJpZ2h0XCIpIGVsZW0ucG9zaXRpb24ueCA9IDEgLSBlbGVtLnBvc2l0aW9uLng7XG5cdFx0XHRcdFx0XHRcdGlmIChlbGVtLmFsaWduLnkgPT0gXCJib3R0b21cIikgZWxlbS5wb3NpdGlvbi55ID0gMSAtIGVsZW0ucG9zaXRpb24ueTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsZW0uZ290byA9IHRoaXMuZ2V0Q2hpbGRJbmRleChyX2VsZW0uZ290byk7XG5cdFx0XHRcdFx0XHRpZiAoZWxlbS5nb3RvID09IC0xKSBlbGVtLmdvdG8gPSB1bmRlZmluZWQ7XG5cblx0XHRcdFx0XHRcdG5vZGUuZWxlbWVudHMucHVzaChlbGVtKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0fVxuXG5cdFx0XHRvdXRwdXQubm9kZXMucHVzaChub2RlKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gb3V0cHV0O1xuXHR9O1xuXG5cdHdpbmRvdy5Ob2RlQ29udGFpbmVyID0gY3JlYXRlanMucHJvbW90ZShOb2RlQ29udGFpbmVyLCBcIkNvbnRhaW5lclwiKTtcblxufSgpKTtcblxuXG5cblxuXG5cbiIsInZhciBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG4vKmV4cG9ydHMuY2hlY2tQYXRoID0gZnVuY3Rpb24ocGF0aClcbntcblx0aWYgKHR5cGVvZiBwYXRoID09IFwidW5kZWZpbmVkXCIgfHwgcGF0aCA9PT0gXCJcIiApIHtcblx0XHR3aW5kb3cuYWxlcnQoXCJZb3UgZm9yZ290IHRvIGVudGVyIGEgcGF0aCFcIik7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0dmFyIGZpbGVuYW1lID0gcGF0aC5zcGxpdChcIi9cIikucG9wKCk7XG5cdHZhciBleHRlbnNpb24gPSBmaWxlbmFtZS5zcGxpdChcIi5cIikucG9wKCk7XG5cblx0aWYgKGV4dGVuc2lvbiAhPSBcImpzb25cIiAmJiBleHRlbnNpb24gIT0gXCJ0eHRcIikge1xuXHRcdHdpbmRvdy5hbGVydChcIlBsZWFzZSBzcGVjaWZ5IGEgLmpzb24gb3IgLnR4dCBmaWxlLlwiKTtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRyZXR1cm4gdHJ1ZTtcbn0qL1xuXG5leHBvcnRzLmxvYWRBbGxJbWFnZXMgPSBmdW5jdGlvbihwYXRoLCBjYWxsYmFjaykge1xuXHRcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuXG4gICAgZnMucmVhZGRpclN5bmMocGF0aCkuZm9yRWFjaChmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgIGZpbGUgPSBwYXRoICsnLycrZmlsZTtcbiAgICAgICAgdmFyIHN0YXQgPSBmaWxlc3lzdGVtLnN0YXRTeW5jKGZpbGUpO1xuXG4gICAgICAgIGlmIChzdGF0ICYmIHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuY29uY2F0KF9nZXRBbGxGaWxlc0Zyb21Gb2xkZXIoZmlsZSkpXG4gICAgICAgIH0gZWxzZSByZXN1bHRzLnB1c2goZmlsZSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbn1cblxuZXhwb3J0cy5zYXZlSlNPTiA9IGZ1bmN0aW9uKG9iaiwgcGF0aCkge1xuXHQvL2lmICghY2hlY2tQYXRoKHBhdGgpKSByZXR1cm47XG5cblx0dmFyIGZpbGVuYW1lID0gcGF0aC5zcGxpdChcIi9cIikucG9wKCk7XG5cblx0Ly9kb2VzRmlsZUV4aXN0KHBhdGgpO1xuXHR3cml0ZVRvRmlsZSgpO1xuXG5cdGZ1bmN0aW9uIGRvZXNGaWxlRXhpc3QodXJsVG9GaWxlKVxuXHR7XG5cdFx0dmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXHRcdHhoci5vcGVuKCdIRUFEJywgdXJsVG9GaWxlLCB0cnVlKTtcblx0XHR4aHIuc2VuZCgpO1xuXG5cdFx0eGhyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKHhoci5zdGF0dXMgPT0gNDA0KSB7XG5cdFx0XHRcdC8vIEZpbGUgbm90IGZvdW5kXG5cdFx0XHRcdHdyaXRlVG9GaWxlKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBGaWxlIGV4aXN0c1xuXHRcdFx0XHRpZiAod2luZG93LmNvbmZpcm0oXCInXCIrcGF0aCtcIicgYWxyZWFkeSBleGlzdHMuXFxuRG8geW91IHdhbnQgdG8gb3ZlcndyaXRlIGl0P1wiKSkgd3JpdGVUb0ZpbGUoKTtcblx0XHRcdFx0ZWxzZSByZXR1cm4gbnVsbDtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG5cblx0ZnVuY3Rpb24gd3JpdGVUb0ZpbGUoKSB7XG5cdFx0Ly93aW5kb3cuYWxlcnQoXCJXcml0aW5nIHRvIGZpbGUhIC4ubm90IHJlYWxseSBsb2xcIik7XG5cdFx0dmFyIHNlbmRyZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cdFx0c2VuZHJlcXVlc3Qub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoc2VuZHJlcXVlc3Quc3RhdHVzID49IDIwMCAmJiBzZW5kcmVxdWVzdC5zdGF0dXMgPCA0MDApIHtcbiAgICAgICAgICAgICAgICAvL3dpbmRvdy5hbGVydChzZW5kcmVxdWVzdC5yZXNwb25zZVRleHQpO1xuXHRcdFx0XHR2YXIgZGlhbG9nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNkaWFsb2dcIik7XG5cdFx0XHRcdGRpYWxvZy5pbm5lckhUTUwgPSBcIjxwPidcIiArIHBhdGggKyBcIicgc2F2ZWQgc3VjY2Vzc2Z1bGx5PHA+XCI7XG5cdFx0XHRcdC8vZGlhbG9nLnN0eWxlLnRvcCA9IFwiNTAlXCI7XG5cdFx0XHRcdC8vZGlhbG9nLnN0eWxlLmxlZnQgPSBcIjUwJVwiO1xuXHRcdFx0XHRkaWFsb2cuc3R5bGUub3BhY2l0eSA9IFwiMC44XCI7XG5cdFx0XHRcdGRpYWxvZy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcIiMzMzNcIjtcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRkaWFsb2cuc3R5bGUub3BhY2l0eSA9IFwiMFwiO1xuXHRcdFx0XHR9LCAyMDAwKTtcblx0XHRcdH1cblx0XHRcdC8vd2luZG93LmFsZXJ0KHNlbmRyZXF1ZXN0LnN0YXR1cyArIFwiIC0gXCIgKyBzZW5kcmVxdWVzdC5yZXNwb25zZVRleHQpO1xuXHRcdH07XG5cdFx0c2VuZHJlcXVlc3Qub3BlbihcIlBPU1RcIixcImpzb24ucGhwXCIsdHJ1ZSk7XG5cdFx0c2VuZHJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtdHlwZVwiLCBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZFwiKTtcblx0XHQvL3NlbmRyZXF1ZXN0LnJlc3BvbnNlVHlwZSA9ICdqc29uJztcblx0XHRjb25zb2xlLmxvZyhwYXRoKTtcblx0XHRzZW5kcmVxdWVzdC5zZW5kKFwianNvbj1cIiArIEpTT04uc3RyaW5naWZ5KG9iaiwgbnVsbCwgNCkgKyBcIiZwYXRoPVwiICsgcGF0aCk7XG5cdH1cbn1cblxuZXhwb3J0cy5sb2FkSlNPTiA9IGZ1bmN0aW9uKHBhdGgsIGNhbGxiYWNrKSB7XG5cblx0Ly9pZiAoIWNoZWNrUGF0aChwYXRoKSkgcmV0dXJuO1xuXHQvL2NsZWFyQWxsKCk7XG5cblx0dmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0cmVxdWVzdC5vcGVuKCdHRVQnLCBwYXRoICsgJz9fPScgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKSwgdHJ1ZSk7XG5cblx0dmFyIG1vYmlsZV9zbWFsbF9wYW5lbHMgPSAwO1xuXG5cdHJlcXVlc3Qub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHJlcXVlc3Quc3RhdHVzID49IDIwMCAmJiByZXF1ZXN0LnN0YXR1cyA8IDQwMCkge1xuXHRcdFx0Ly8gU3VjY2VzcyFcblx0XHRcdC8vcGFuZWxzID0gSlNPTi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB2YXIgb2JqID0gSlNPTi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhvYmopO1xuXHRcdFx0cHJlbG9hZEltYWdlcyhvYmosIGNhbGxiYWNrKTtcblx0XHRcdC8vY2FsbGJhY2sob2JqKTtcblx0XHR9IGVsc2Uge1xuXHRcdC8vIFdlIHJlYWNoZWQgb3VyIHRhcmdldCBzZXJ2ZXIsIGJ1dCBpdCByZXR1cm5lZCBhbiBlcnJvclxuXHRcdFx0aWYgKHJlcXVlc3Quc3RhdHVzID09IDQwNCkgd2luZG93LmFsZXJ0KFwiRmlsZSBub3QgZm91bmQhXCIpO1xuXHRcdFx0ZWxzZSB3aW5kb3cuYWxlcnQocmVxdWVzdC5yZXNwb25zZVRleHQpO1xuXHRcdHJldHVybiBudWxsO1xuXHRcdH1cblx0fTtcblxuXHRyZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcblx0XHRhbGVydChyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG5cdH07XG5cblx0cmVxdWVzdC5zZW5kKCk7XG59XG5cbmZ1bmN0aW9uIHByZWxvYWRJbWFnZXMob2JqLCBjYWxsYmFjaykge1xuXHR2YXIgbG9hZGVkID0gMDtcblx0dmFyIGltYWdlcyA9IFtdO1xuXHQvKmltYWdlcy5wdXNoKFwiaW1nL2J1YmJsZXMvbWVkaXVtX2J1YmJsZV9sZWZ0LnBuZ1wiKTtcblx0aW1hZ2VzLnB1c2goXCJpbWcvYnViYmxlcy9tZWRpdW1fYnViYmxlX2Rvd24ucG5nXCIpO1xuXHRpbWFnZXMucHVzaChcImltZy9idWJibGVzL21lZGl1bV9ib3gucG5nXCIpO1xuXHRpbWFnZXMucHVzaChcImltZy9idWJibGVzL3NtYWxsX2JveC5wbmdcIik7XG5cdGltYWdlcy5wdXNoKFwiaW1nL2J1YmJsZXMvc21hbGxfYnViYmxlX2Rvd24ucG5nXCIpO1xuXHRpbWFnZXMucHVzaChcImltZy9idWJibGVzL3hfc21hbGxfYnViYmxlX2xlZnQucG5nXCIpOyovXG5cdGZvciAodmFyIGk9MDsgaTxvYmoubm9kZXMubGVuZ3RoOyBpKyspIHtcblx0XHRpbWFnZXMucHVzaChvYmoubm9kZXNbaV0uaW1hZ2UpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW1hZ2VMb2FkZWQoKSB7XG5cdFx0bG9hZGVkKys7XG5cdFx0Y29uc29sZS5sb2coXCJJbWFnZSBsb2FkZWQuLlwiICsgbG9hZGVkICsgXCIvXCIgKyBpbWFnZXMubGVuZ3RoKTtcblx0XHR1cGRhdGVQcm9ncmVzcygpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlUHJvZ3Jlc3MoKSB7XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwcm9ncmVzc19iYXJcIikuc3R5bGUud2lkdGggPSAobG9hZGVkL2ltYWdlcy5sZW5ndGggKiAxMDApLnRvU3RyaW5nKCkgKyBcIiVcIjtcblx0XHRjb25zb2xlLmxvZyhcInVwZGF0ZSBwcm9ncmVzcy4uXCIpO1xuXHRcdGlmIChsb2FkZWQgPT0gaW1hZ2VzLmxlbmd0aCkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJGaW5pc2hlZCBwcmVsb2FkaW5nIGltYWdlcy4uXCIpO1xuXHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwcm9ncmVzc1wiKS5zdHlsZS5vcGFjaXR5ID0gXCIwXCI7XG5cdFx0XHR9LCAxMDApO1xuXHRcdFx0Y2FsbGJhY2sob2JqKTtcblx0XHR9XG5cdH1cblxuXHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicHJvZ3Jlc3NcIikuc3R5bGUub3BhY2l0eSA9IFwiMVwiO1xuXHR9LCAxMDApO1xuXG5cdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0Ly8gcHJlbG9hZCBpbWFnZVxuXHRcdGZvciAodmFyIGw9MDsgbDxpbWFnZXMubGVuZ3RoOyBsKyspIHtcblx0XHRcdHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRcdGltZy5zcmMgPSBpbWFnZXNbbF07XG5cdFx0XHRpbWcub25sb2FkID0gaW1hZ2VMb2FkZWQ7XG5cdFx0fVxuXHR9LCA1MCk7XG59IiwidmFyIGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyLmpzJyk7XG52YXIgZWRpdG9yID0gcmVxdWlyZSgnLi9lZGl0b3IuanMnKTtcblxudmFyIGdhbWVwYXRoID0gX19kaXJuYW1lICsgJy9hcHAvZ2FtZS8nO1xuXG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uKGUpIHtcbiAgaWYgKGUua2V5Q29kZSA9PSA4MyAmJiAobmF2aWdhdG9yLnBsYXRmb3JtLm1hdGNoKFwiTWFjXCIpID8gZS5tZXRhS2V5IDogZS5jdHJsS2V5KSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAvLyBQcm9jZXNzIGV2ZW50Li4uXG4gICAgICBsb2FkZXIuc2F2ZUpTT04oZWRpdG9yLmdldE5vZGVzLnRvT2JqZWN0KCksIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZmlsZXBhdGhcIikudmFsdWUpO1xuICB9XG59LCBmYWxzZSk7XG5cblxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbG9hZFwiKS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0bG9hZGVyLmxvYWRKU09OKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZmlsZXBhdGhcIikudmFsdWUsIGVkaXRvci5pbml0KTtcblx0fTtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzYXZlXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRsb2FkZXIuc2F2ZUpTT04oZWRpdG9yLmdldE5vZGVzLnRvT2JqZWN0KCksIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZmlsZXBhdGhcIikudmFsdWUpO1xuXHR9O1xuXHQvL2RvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2F2ZVwiKTtcblx0bG9hZGVyLmxvYWRKU09OKFwianMvcGFuZWxzLmpzb25cIiwgZWRpdG9yLmluaXQpO1xufTsiLCIiXX0=
