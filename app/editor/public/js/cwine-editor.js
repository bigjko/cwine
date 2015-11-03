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
var currentLocalImages;



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
	document.querySelector("#edit_canvas").ondrop = function() { drop(event) };
	document.querySelector("#edit_canvas").ondragover = function() { allowDrop(event) };
	
	document.querySelector("#save").onclick = function() {
		loader.save(nodeContainer.toObject());
	};
	document.addEventListener("keydown", function(e) {
	  if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
	    e.preventDefault();
	    // Process event...
	      loader.saveJSON(editor.nodesToObject(), document.querySelector("#filepath").value);
	  }
	}, false);

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
		function handleFileSelect(evt) {
		    var files = evt.target.files; // FileList object
		    currentLocalImages = files;
		    // files is a FileList of File objects. List some properties.
		    listFiles(files);
		    //document.querySelector('#imagelist').innerHTML = output.join('');
  		}
  		function listFiles(filearray) {
  			for (var i = 0, f; f = filearray[i]; i++) {
		    	if (!f.type.match('image.*')) {
			    	continue;
			    }

			    var reader = new FileReader();

			    reader.onload = (function(theFile) {
			        return function(e) {
			          // Render thumbnail.
			          //var span = document.createElement('span');
			          var img = document.createElement('IMG');
			          img.src = e.target.result;
			          img.width = 100;
			          img.draggable = true;
			          img.ondragstart = function() { drag(event, e.target.result) };

			          /*span.innerHTML = ['<img width="100" src="', e.target.result,
			                            '" title="', escape(theFile.name), '" draggable="true" ondragstart="drag(event,\'', e.target.result ,'\')"/>'].join('');*/
			          document.getElementById('imagelist').insertBefore(img, null);
			        };
			    })(f);

			    reader.readAsDataURL(f);
		    }
  		}

  		document.querySelector('#properties').innerHTML = '<input type="file" id="imagefiles" name="files[]" multiple /><output id="imagelist"></output>';
  		if (currentLocalImages !== undefined) { listFiles(currentLocalImages) };
  		document.querySelector('#imagefiles').addEventListener('change', handleFileSelect, false);
  		/*
		loader.loadAllImages(function(obj) {
			var properties = document.querySelector("#properties");
			properties.innerHTML = "";
			for (i=0; i<obj.length; i++) {
				console.log(obj[i]);
				properties.innerHTML += '<img width="100" style="margin-left:10px;" src="' + obj[i].replace("../", "") + '" draggable="true" ondragstart="drag(event, \'' + obj[i].replace("../", "") + '\')" />';
			}
		});*/
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
var localforage = require('localforage');
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
	request.open('GET', "./js/img-folder.php", true);

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

exports.save = function(obj, path) {
	//if (!checkPath(path)) return;

	/*var filename = path.split("/").pop();

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
	}*/

	localforage.setItem('cwine', obj, function(err, result) { 	
		var dialog = document.querySelector("#dialog");
		dialog.innerHTML = "<p>Cwine saved successfully<p>";
		dialog.style.opacity = "0.8";
		dialog.style.backgroundColor = "#333";
		setTimeout(function() {
			dialog.style.opacity = "0";
		}, 2000);
	});
}

exports.load = function(callback) {

	localforage.getItem('cwine', function(err, value) {
		preloadImages(value,callback); 	
		//callback(value);
	});
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
},{"localforage":4}],3:[function(require,module,exports){
var loader = require('./loader.js');
var editor = require('./editor.js');

//var gamepath = __dirname + '/app/game/';

window.onload = function() {

		// Check for the various File API support.
	if (window.File && window.FileReader && window.FileList && window.Blob) {
	  // Great success! All the File APIs are supported.
	} else {
	  alert('The File APIs are not fully supported in this browser.');
	}
	//document.querySelector("#save");
	document.querySelector("#loadjson").onclick = function() {
		loader.loadJSON(document.querySelector("#filepath").value, editor.init);
	};
	document.querySelector("#load").onclick = function() {
		loader.load(editor.init);
	};
	loader.load(editor.init);
};
},{"./editor.js":1,"./loader.js":2}],4:[function(require,module,exports){
(function (process,global){
/*!
    localForage -- Offline Storage, Improved
    Version 1.3.0
    https://mozilla.github.io/localForage
    (c) 2013-2015 Mozilla, Apache License 2.0
*/
(function() {
var define, requireModule, require, requirejs;

(function() {
  var registry = {}, seen = {};

  define = function(name, deps, callback) {
    registry[name] = { deps: deps, callback: callback };
  };

  requirejs = require = requireModule = function(name) {
  requirejs._eak_seen = registry;

    if (seen[name]) { return seen[name]; }
    seen[name] = {};

    if (!registry[name]) {
      throw new Error("Could not find module " + name);
    }

    var mod = registry[name],
        deps = mod.deps,
        callback = mod.callback,
        reified = [],
        exports;

    for (var i=0, l=deps.length; i<l; i++) {
      if (deps[i] === 'exports') {
        reified.push(exports = {});
      } else {
        reified.push(requireModule(resolve(deps[i])));
      }
    }

    var value = callback.apply(this, reified);
    return seen[name] = exports || value;

    function resolve(child) {
      if (child.charAt(0) !== '.') { return child; }
      var parts = child.split("/");
      var parentBase = name.split("/").slice(0, -1);

      for (var i=0, l=parts.length; i<l; i++) {
        var part = parts[i];

        if (part === '..') { parentBase.pop(); }
        else if (part === '.') { continue; }
        else { parentBase.push(part); }
      }

      return parentBase.join("/");
    }
  };
})();

define("promise/all", 
  ["./utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /* global toString */

    var isArray = __dependency1__.isArray;
    var isFunction = __dependency1__.isFunction;

    /**
      Returns a promise that is fulfilled when all the given promises have been
      fulfilled, or rejected if any of them become rejected. The return promise
      is fulfilled with an array that gives all the values in the order they were
      passed in the `promises` array argument.

      Example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.resolve(2);
      var promise3 = RSVP.resolve(3);
      var promises = [ promise1, promise2, promise3 ];

      RSVP.all(promises).then(function(array){
        // The array here would be [ 1, 2, 3 ];
      });
      ```

      If any of the `promises` given to `RSVP.all` are rejected, the first promise
      that is rejected will be given as an argument to the returned promises's
      rejection handler. For example:

      Example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.reject(new Error("2"));
      var promise3 = RSVP.reject(new Error("3"));
      var promises = [ promise1, promise2, promise3 ];

      RSVP.all(promises).then(function(array){
        // Code here never runs because there are rejected promises!
      }, function(error) {
        // error.message === "2"
      });
      ```

      @method all
      @for RSVP
      @param {Array} promises
      @param {String} label
      @return {Promise} promise that is fulfilled when all `promises` have been
      fulfilled, or rejected if any of them become rejected.
    */
    function all(promises) {
      /*jshint validthis:true */
      var Promise = this;

      if (!isArray(promises)) {
        throw new TypeError('You must pass an array to all.');
      }

      return new Promise(function(resolve, reject) {
        var results = [], remaining = promises.length,
        promise;

        if (remaining === 0) {
          resolve([]);
        }

        function resolver(index) {
          return function(value) {
            resolveAll(index, value);
          };
        }

        function resolveAll(index, value) {
          results[index] = value;
          if (--remaining === 0) {
            resolve(results);
          }
        }

        for (var i = 0; i < promises.length; i++) {
          promise = promises[i];

          if (promise && isFunction(promise.then)) {
            promise.then(resolver(i), reject);
          } else {
            resolveAll(i, promise);
          }
        }
      });
    }

    __exports__.all = all;
  });
define("promise/asap", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var browserGlobal = (typeof window !== 'undefined') ? window : {};
    var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
    var local = (typeof global !== 'undefined') ? global : (this === undefined? window:this);

    // node
    function useNextTick() {
      return function() {
        process.nextTick(flush);
      };
    }

    function useMutationObserver() {
      var iterations = 0;
      var observer = new BrowserMutationObserver(flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    function useSetTimeout() {
      return function() {
        local.setTimeout(flush, 1);
      };
    }

    var queue = [];
    function flush() {
      for (var i = 0; i < queue.length; i++) {
        var tuple = queue[i];
        var callback = tuple[0], arg = tuple[1];
        callback(arg);
      }
      queue = [];
    }

    var scheduleFlush;

    // Decide what async method to use to triggering processing of queued callbacks:
    if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
      scheduleFlush = useNextTick();
    } else if (BrowserMutationObserver) {
      scheduleFlush = useMutationObserver();
    } else {
      scheduleFlush = useSetTimeout();
    }

    function asap(callback, arg) {
      var length = queue.push([callback, arg]);
      if (length === 1) {
        // If length is 1, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        scheduleFlush();
      }
    }

    __exports__.asap = asap;
  });
define("promise/config", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var config = {
      instrument: false
    };

    function configure(name, value) {
      if (arguments.length === 2) {
        config[name] = value;
      } else {
        return config[name];
      }
    }

    __exports__.config = config;
    __exports__.configure = configure;
  });
define("promise/polyfill", 
  ["./promise","./utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    /*global self*/
    var RSVPPromise = __dependency1__.Promise;
    var isFunction = __dependency2__.isFunction;

    function polyfill() {
      var local;

      if (typeof global !== 'undefined') {
        local = global;
      } else if (typeof window !== 'undefined' && window.document) {
        local = window;
      } else {
        local = self;
      }

      var es6PromiseSupport = 
        "Promise" in local &&
        // Some of these methods are missing from
        // Firefox/Chrome experimental implementations
        "resolve" in local.Promise &&
        "reject" in local.Promise &&
        "all" in local.Promise &&
        "race" in local.Promise &&
        // Older version of the spec had a resolver object
        // as the arg rather than a function
        (function() {
          var resolve;
          new local.Promise(function(r) { resolve = r; });
          return isFunction(resolve);
        }());

      if (!es6PromiseSupport) {
        local.Promise = RSVPPromise;
      }
    }

    __exports__.polyfill = polyfill;
  });
define("promise/promise", 
  ["./config","./utils","./all","./race","./resolve","./reject","./asap","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __exports__) {
    "use strict";
    var config = __dependency1__.config;
    var configure = __dependency1__.configure;
    var objectOrFunction = __dependency2__.objectOrFunction;
    var isFunction = __dependency2__.isFunction;
    var now = __dependency2__.now;
    var all = __dependency3__.all;
    var race = __dependency4__.race;
    var staticResolve = __dependency5__.resolve;
    var staticReject = __dependency6__.reject;
    var asap = __dependency7__.asap;

    var counter = 0;

    config.async = asap; // default async is asap;

    function Promise(resolver) {
      if (!isFunction(resolver)) {
        throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
      }

      if (!(this instanceof Promise)) {
        throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
      }

      this._subscribers = [];

      invokeResolver(resolver, this);
    }

    function invokeResolver(resolver, promise) {
      function resolvePromise(value) {
        resolve(promise, value);
      }

      function rejectPromise(reason) {
        reject(promise, reason);
      }

      try {
        resolver(resolvePromise, rejectPromise);
      } catch(e) {
        rejectPromise(e);
      }
    }

    function invokeCallback(settled, promise, callback, detail) {
      var hasCallback = isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        try {
          value = callback(detail);
          succeeded = true;
        } catch(e) {
          failed = true;
          error = e;
        }
      } else {
        value = detail;
        succeeded = true;
      }

      if (handleThenable(promise, value)) {
        return;
      } else if (hasCallback && succeeded) {
        resolve(promise, value);
      } else if (failed) {
        reject(promise, error);
      } else if (settled === FULFILLED) {
        resolve(promise, value);
      } else if (settled === REJECTED) {
        reject(promise, value);
      }
    }

    var PENDING   = void 0;
    var SEALED    = 0;
    var FULFILLED = 1;
    var REJECTED  = 2;

    function subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      subscribers[length] = child;
      subscribers[length + FULFILLED] = onFulfillment;
      subscribers[length + REJECTED]  = onRejection;
    }

    function publish(promise, settled) {
      var child, callback, subscribers = promise._subscribers, detail = promise._detail;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        invokeCallback(settled, child, callback, detail);
      }

      promise._subscribers = null;
    }

    Promise.prototype = {
      constructor: Promise,

      _state: undefined,
      _detail: undefined,
      _subscribers: undefined,

      then: function(onFulfillment, onRejection) {
        var promise = this;

        var thenPromise = new this.constructor(function() {});

        if (this._state) {
          var callbacks = arguments;
          config.async(function invokePromiseCallback() {
            invokeCallback(promise._state, thenPromise, callbacks[promise._state - 1], promise._detail);
          });
        } else {
          subscribe(this, thenPromise, onFulfillment, onRejection);
        }

        return thenPromise;
      },

      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };

    Promise.all = all;
    Promise.race = race;
    Promise.resolve = staticResolve;
    Promise.reject = staticReject;

    function handleThenable(promise, value) {
      var then = null,
      resolved;

      try {
        if (promise === value) {
          throw new TypeError("A promises callback cannot return that same promise.");
        }

        if (objectOrFunction(value)) {
          then = value.then;

          if (isFunction(then)) {
            then.call(value, function(val) {
              if (resolved) { return true; }
              resolved = true;

              if (value !== val) {
                resolve(promise, val);
              } else {
                fulfill(promise, val);
              }
            }, function(val) {
              if (resolved) { return true; }
              resolved = true;

              reject(promise, val);
            });

            return true;
          }
        }
      } catch (error) {
        if (resolved) { return true; }
        reject(promise, error);
        return true;
      }

      return false;
    }

    function resolve(promise, value) {
      if (promise === value) {
        fulfill(promise, value);
      } else if (!handleThenable(promise, value)) {
        fulfill(promise, value);
      }
    }

    function fulfill(promise, value) {
      if (promise._state !== PENDING) { return; }
      promise._state = SEALED;
      promise._detail = value;

      config.async(publishFulfillment, promise);
    }

    function reject(promise, reason) {
      if (promise._state !== PENDING) { return; }
      promise._state = SEALED;
      promise._detail = reason;

      config.async(publishRejection, promise);
    }

    function publishFulfillment(promise) {
      publish(promise, promise._state = FULFILLED);
    }

    function publishRejection(promise) {
      publish(promise, promise._state = REJECTED);
    }

    __exports__.Promise = Promise;
  });
define("promise/race", 
  ["./utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /* global toString */
    var isArray = __dependency1__.isArray;

    /**
      `RSVP.race` allows you to watch a series of promises and act as soon as the
      first promise given to the `promises` argument fulfills or rejects.

      Example:

      ```javascript
      var promise1 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 1");
        }, 200);
      });

      var promise2 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 2");
        }, 100);
      });

      RSVP.race([promise1, promise2]).then(function(result){
        // result === "promise 2" because it was resolved before promise1
        // was resolved.
      });
      ```

      `RSVP.race` is deterministic in that only the state of the first completed
      promise matters. For example, even if other promises given to the `promises`
      array argument are resolved, but the first completed promise has become
      rejected before the other promises became fulfilled, the returned promise
      will become rejected:

      ```javascript
      var promise1 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 1");
        }, 200);
      });

      var promise2 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          reject(new Error("promise 2"));
        }, 100);
      });

      RSVP.race([promise1, promise2]).then(function(result){
        // Code here never runs because there are rejected promises!
      }, function(reason){
        // reason.message === "promise2" because promise 2 became rejected before
        // promise 1 became fulfilled
      });
      ```

      @method race
      @for RSVP
      @param {Array} promises array of promises to observe
      @param {String} label optional string for describing the promise returned.
      Useful for tooling.
      @return {Promise} a promise that becomes fulfilled with the value the first
      completed promises is resolved with if the first completed promise was
      fulfilled, or rejected with the reason that the first completed promise
      was rejected with.
    */
    function race(promises) {
      /*jshint validthis:true */
      var Promise = this;

      if (!isArray(promises)) {
        throw new TypeError('You must pass an array to race.');
      }
      return new Promise(function(resolve, reject) {
        var results = [], promise;

        for (var i = 0; i < promises.length; i++) {
          promise = promises[i];

          if (promise && typeof promise.then === 'function') {
            promise.then(resolve, reject);
          } else {
            resolve(promise);
          }
        }
      });
    }

    __exports__.race = race;
  });
define("promise/reject", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
      `RSVP.reject` returns a promise that will become rejected with the passed
      `reason`. `RSVP.reject` is essentially shorthand for the following:

      ```javascript
      var promise = new RSVP.Promise(function(resolve, reject){
        reject(new Error('WHOOPS'));
      });

      promise.then(function(value){
        // Code here doesn't run because the promise is rejected!
      }, function(reason){
        // reason.message === 'WHOOPS'
      });
      ```

      Instead of writing the above, your code now simply becomes the following:

      ```javascript
      var promise = RSVP.reject(new Error('WHOOPS'));

      promise.then(function(value){
        // Code here doesn't run because the promise is rejected!
      }, function(reason){
        // reason.message === 'WHOOPS'
      });
      ```

      @method reject
      @for RSVP
      @param {Any} reason value that the returned promise will be rejected with.
      @param {String} label optional string for identifying the returned promise.
      Useful for tooling.
      @return {Promise} a promise that will become rejected with the given
      `reason`.
    */
    function reject(reason) {
      /*jshint validthis:true */
      var Promise = this;

      return new Promise(function (resolve, reject) {
        reject(reason);
      });
    }

    __exports__.reject = reject;
  });
define("promise/resolve", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function resolve(value) {
      /*jshint validthis:true */
      if (value && typeof value === 'object' && value.constructor === this) {
        return value;
      }

      var Promise = this;

      return new Promise(function(resolve) {
        resolve(value);
      });
    }

    __exports__.resolve = resolve;
  });
define("promise/utils", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function objectOrFunction(x) {
      return isFunction(x) || (typeof x === "object" && x !== null);
    }

    function isFunction(x) {
      return typeof x === "function";
    }

    function isArray(x) {
      return Object.prototype.toString.call(x) === "[object Array]";
    }

    // Date.now is not available in browsers < IE9
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
    var now = Date.now || function() { return new Date().getTime(); };


    __exports__.objectOrFunction = objectOrFunction;
    __exports__.isFunction = isFunction;
    __exports__.isArray = isArray;
    __exports__.now = now;
  });
requireModule('promise/polyfill').polyfill();
}());(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["localforage"] = factory();
	else
		root["localforage"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	exports.__esModule = true;

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	(function () {
	    'use strict';

	    // Custom drivers are stored here when `defineDriver()` is called.
	    // They are shared across all instances of localForage.
	    var CustomDrivers = {};

	    var DriverType = {
	        INDEXEDDB: 'asyncStorage',
	        LOCALSTORAGE: 'localStorageWrapper',
	        WEBSQL: 'webSQLStorage'
	    };

	    var DefaultDriverOrder = [DriverType.INDEXEDDB, DriverType.WEBSQL, DriverType.LOCALSTORAGE];

	    var LibraryMethods = ['clear', 'getItem', 'iterate', 'key', 'keys', 'length', 'removeItem', 'setItem'];

	    var DefaultConfig = {
	        description: '',
	        driver: DefaultDriverOrder.slice(),
	        name: 'localforage',
	        // Default DB size is _JUST UNDER_ 5MB, as it's the highest size
	        // we can use without a prompt.
	        size: 4980736,
	        storeName: 'keyvaluepairs',
	        version: 1.0
	    };

	    // Check to see if IndexedDB is available and if it is the latest
	    // implementation; it's our preferred backend library. We use "_spec_test"
	    // as the name of the database because it's not the one we'll operate on,
	    // but it's useful to make sure its using the right spec.
	    // See: https://github.com/mozilla/localForage/issues/128
	    var driverSupport = (function (self) {
	        // Initialize IndexedDB; fall back to vendor-prefixed versions
	        // if needed.
	        var indexedDB = indexedDB || self.indexedDB || self.webkitIndexedDB || self.mozIndexedDB || self.OIndexedDB || self.msIndexedDB;

	        var result = {};

	        result[DriverType.WEBSQL] = !!self.openDatabase;
	        result[DriverType.INDEXEDDB] = !!(function () {
	            // We mimic PouchDB here; just UA test for Safari (which, as of
	            // iOS 8/Yosemite, doesn't properly support IndexedDB).
	            // IndexedDB support is broken and different from Blink's.
	            // This is faster than the test case (and it's sync), so we just
	            // do this. *SIGH*
	            // http://bl.ocks.org/nolanlawson/raw/c83e9039edf2278047e9/
	            //
	            // We test for openDatabase because IE Mobile identifies itself
	            // as Safari. Oh the lulz...
	            if (typeof self.openDatabase !== 'undefined' && self.navigator && self.navigator.userAgent && /Safari/.test(self.navigator.userAgent) && !/Chrome/.test(self.navigator.userAgent)) {
	                return false;
	            }
	            try {
	                return indexedDB && typeof indexedDB.open === 'function' &&
	                // Some Samsung/HTC Android 4.0-4.3 devices
	                // have older IndexedDB specs; if this isn't available
	                // their IndexedDB is too old for us to use.
	                // (Replaces the onupgradeneeded test.)
	                typeof self.IDBKeyRange !== 'undefined';
	            } catch (e) {
	                return false;
	            }
	        })();

	        result[DriverType.LOCALSTORAGE] = !!(function () {
	            try {
	                return self.localStorage && 'setItem' in self.localStorage && self.localStorage.setItem;
	            } catch (e) {
	                return false;
	            }
	        })();

	        return result;
	    })(this);

	    var isArray = Array.isArray || function (arg) {
	        return Object.prototype.toString.call(arg) === '[object Array]';
	    };

	    function callWhenReady(localForageInstance, libraryMethod) {
	        localForageInstance[libraryMethod] = function () {
	            var _args = arguments;
	            return localForageInstance.ready().then(function () {
	                return localForageInstance[libraryMethod].apply(localForageInstance, _args);
	            });
	        };
	    }

	    function extend() {
	        for (var i = 1; i < arguments.length; i++) {
	            var arg = arguments[i];

	            if (arg) {
	                for (var key in arg) {
	                    if (arg.hasOwnProperty(key)) {
	                        if (isArray(arg[key])) {
	                            arguments[0][key] = arg[key].slice();
	                        } else {
	                            arguments[0][key] = arg[key];
	                        }
	                    }
	                }
	            }
	        }

	        return arguments[0];
	    }

	    function isLibraryDriver(driverName) {
	        for (var driver in DriverType) {
	            if (DriverType.hasOwnProperty(driver) && DriverType[driver] === driverName) {
	                return true;
	            }
	        }

	        return false;
	    }

	    var LocalForage = (function () {
	        function LocalForage(options) {
	            _classCallCheck(this, LocalForage);

	            this.INDEXEDDB = DriverType.INDEXEDDB;
	            this.LOCALSTORAGE = DriverType.LOCALSTORAGE;
	            this.WEBSQL = DriverType.WEBSQL;

	            this._defaultConfig = extend({}, DefaultConfig);
	            this._config = extend({}, this._defaultConfig, options);
	            this._driverSet = null;
	            this._initDriver = null;
	            this._ready = false;
	            this._dbInfo = null;

	            this._wrapLibraryMethodsWithReady();
	            this.setDriver(this._config.driver);
	        }

	        // The actual localForage object that we expose as a module or via a
	        // global. It's extended by pulling in one of our other libraries.

	        // Set any config values for localForage; can be called anytime before
	        // the first API call (e.g. `getItem`, `setItem`).
	        // We loop through options so we don't overwrite existing config
	        // values.

	        LocalForage.prototype.config = function config(options) {
	            // If the options argument is an object, we use it to set values.
	            // Otherwise, we return either a specified config value or all
	            // config values.
	            if (typeof options === 'object') {
	                // If localforage is ready and fully initialized, we can't set
	                // any new configuration values. Instead, we return an error.
	                if (this._ready) {
	                    return new Error("Can't call config() after localforage " + 'has been used.');
	                }

	                for (var i in options) {
	                    if (i === 'storeName') {
	                        options[i] = options[i].replace(/\W/g, '_');
	                    }

	                    this._config[i] = options[i];
	                }

	                // after all config options are set and
	                // the driver option is used, try setting it
	                if ('driver' in options && options.driver) {
	                    this.setDriver(this._config.driver);
	                }

	                return true;
	            } else if (typeof options === 'string') {
	                return this._config[options];
	            } else {
	                return this._config;
	            }
	        };

	        // Used to define a custom driver, shared across all instances of
	        // localForage.

	        LocalForage.prototype.defineDriver = function defineDriver(driverObject, callback, errorCallback) {
	            var promise = new Promise(function (resolve, reject) {
	                try {
	                    var driverName = driverObject._driver;
	                    var complianceError = new Error('Custom driver not compliant; see ' + 'https://mozilla.github.io/localForage/#definedriver');
	                    var namingError = new Error('Custom driver name already in use: ' + driverObject._driver);

	                    // A driver name should be defined and not overlap with the
	                    // library-defined, default drivers.
	                    if (!driverObject._driver) {
	                        reject(complianceError);
	                        return;
	                    }
	                    if (isLibraryDriver(driverObject._driver)) {
	                        reject(namingError);
	                        return;
	                    }

	                    var customDriverMethods = LibraryMethods.concat('_initStorage');
	                    for (var i = 0; i < customDriverMethods.length; i++) {
	                        var customDriverMethod = customDriverMethods[i];
	                        if (!customDriverMethod || !driverObject[customDriverMethod] || typeof driverObject[customDriverMethod] !== 'function') {
	                            reject(complianceError);
	                            return;
	                        }
	                    }

	                    var supportPromise = Promise.resolve(true);
	                    if ('_support' in driverObject) {
	                        if (driverObject._support && typeof driverObject._support === 'function') {
	                            supportPromise = driverObject._support();
	                        } else {
	                            supportPromise = Promise.resolve(!!driverObject._support);
	                        }
	                    }

	                    supportPromise.then(function (supportResult) {
	                        driverSupport[driverName] = supportResult;
	                        CustomDrivers[driverName] = driverObject;
	                        resolve();
	                    }, reject);
	                } catch (e) {
	                    reject(e);
	                }
	            });

	            promise.then(callback, errorCallback);
	            return promise;
	        };

	        LocalForage.prototype.driver = function driver() {
	            return this._driver || null;
	        };

	        LocalForage.prototype.getDriver = function getDriver(driverName, callback, errorCallback) {
	            var self = this;
	            var getDriverPromise = (function () {
	                if (isLibraryDriver(driverName)) {
	                    switch (driverName) {
	                        case self.INDEXEDDB:
	                            return new Promise(function (resolve, reject) {
	                                resolve(__webpack_require__(1));
	                            });
	                        case self.LOCALSTORAGE:
	                            return new Promise(function (resolve, reject) {
	                                resolve(__webpack_require__(2));
	                            });
	                        case self.WEBSQL:
	                            return new Promise(function (resolve, reject) {
	                                resolve(__webpack_require__(4));
	                            });
	                    }
	                } else if (CustomDrivers[driverName]) {
	                    return Promise.resolve(CustomDrivers[driverName]);
	                }

	                return Promise.reject(new Error('Driver not found.'));
	            })();

	            getDriverPromise.then(callback, errorCallback);
	            return getDriverPromise;
	        };

	        LocalForage.prototype.getSerializer = function getSerializer(callback) {
	            var serializerPromise = new Promise(function (resolve, reject) {
	                resolve(__webpack_require__(3));
	            });
	            if (callback && typeof callback === 'function') {
	                serializerPromise.then(function (result) {
	                    callback(result);
	                });
	            }
	            return serializerPromise;
	        };

	        LocalForage.prototype.ready = function ready(callback) {
	            var self = this;

	            var promise = self._driverSet.then(function () {
	                if (self._ready === null) {
	                    self._ready = self._initDriver();
	                }

	                return self._ready;
	            });

	            promise.then(callback, callback);
	            return promise;
	        };

	        LocalForage.prototype.setDriver = function setDriver(drivers, callback, errorCallback) {
	            var self = this;

	            if (!isArray(drivers)) {
	                drivers = [drivers];
	            }

	            var supportedDrivers = this._getSupportedDrivers(drivers);

	            function setDriverToConfig() {
	                self._config.driver = self.driver();
	            }

	            function initDriver(supportedDrivers) {
	                return function () {
	                    var currentDriverIndex = 0;

	                    function driverPromiseLoop() {
	                        while (currentDriverIndex < supportedDrivers.length) {
	                            var driverName = supportedDrivers[currentDriverIndex];
	                            currentDriverIndex++;

	                            self._dbInfo = null;
	                            self._ready = null;

	                            return self.getDriver(driverName).then(function (driver) {
	                                self._extend(driver);
	                                setDriverToConfig();

	                                self._ready = self._initStorage(self._config);
	                                return self._ready;
	                            })['catch'](driverPromiseLoop);
	                        }

	                        setDriverToConfig();
	                        var error = new Error('No available storage method found.');
	                        self._driverSet = Promise.reject(error);
	                        return self._driverSet;
	                    }

	                    return driverPromiseLoop();
	                };
	            }

	            // There might be a driver initialization in progress
	            // so wait for it to finish in order to avoid a possible
	            // race condition to set _dbInfo
	            var oldDriverSetDone = this._driverSet !== null ? this._driverSet['catch'](function () {
	                return Promise.resolve();
	            }) : Promise.resolve();

	            this._driverSet = oldDriverSetDone.then(function () {
	                var driverName = supportedDrivers[0];
	                self._dbInfo = null;
	                self._ready = null;

	                return self.getDriver(driverName).then(function (driver) {
	                    self._driver = driver._driver;
	                    setDriverToConfig();
	                    self._wrapLibraryMethodsWithReady();
	                    self._initDriver = initDriver(supportedDrivers);
	                });
	            })['catch'](function () {
	                setDriverToConfig();
	                var error = new Error('No available storage method found.');
	                self._driverSet = Promise.reject(error);
	                return self._driverSet;
	            });

	            this._driverSet.then(callback, errorCallback);
	            return this._driverSet;
	        };

	        LocalForage.prototype.supports = function supports(driverName) {
	            return !!driverSupport[driverName];
	        };

	        LocalForage.prototype._extend = function _extend(libraryMethodsAndProperties) {
	            extend(this, libraryMethodsAndProperties);
	        };

	        LocalForage.prototype._getSupportedDrivers = function _getSupportedDrivers(drivers) {
	            var supportedDrivers = [];
	            for (var i = 0, len = drivers.length; i < len; i++) {
	                var driverName = drivers[i];
	                if (this.supports(driverName)) {
	                    supportedDrivers.push(driverName);
	                }
	            }
	            return supportedDrivers;
	        };

	        LocalForage.prototype._wrapLibraryMethodsWithReady = function _wrapLibraryMethodsWithReady() {
	            // Add a stub for each driver API method that delays the call to the
	            // corresponding driver method until localForage is ready. These stubs
	            // will be replaced by the driver methods as soon as the driver is
	            // loaded, so there is no performance impact.
	            for (var i = 0; i < LibraryMethods.length; i++) {
	                callWhenReady(this, LibraryMethods[i]);
	            }
	        };

	        LocalForage.prototype.createInstance = function createInstance(options) {
	            return new LocalForage(options);
	        };

	        return LocalForage;
	    })();

	    var localForage = new LocalForage();

	    exports['default'] = localForage;
	}).call(typeof window !== 'undefined' ? window : self);
	module.exports = exports['default'];

/***/ },
/* 1 */
/***/ function(module, exports) {

	// Some code originally from async_storage.js in
	// [Gaia](https://github.com/mozilla-b2g/gaia).
	'use strict';

	exports.__esModule = true;
	(function () {
	    'use strict';

	    var globalObject = this;
	    // Initialize IndexedDB; fall back to vendor-prefixed versions if needed.
	    var indexedDB = indexedDB || this.indexedDB || this.webkitIndexedDB || this.mozIndexedDB || this.OIndexedDB || this.msIndexedDB;

	    // If IndexedDB isn't available, we get outta here!
	    if (!indexedDB) {
	        return;
	    }

	    var DETECT_BLOB_SUPPORT_STORE = 'local-forage-detect-blob-support';
	    var supportsBlobs;
	    var dbContexts;

	    // Abstracts constructing a Blob object, so it also works in older
	    // browsers that don't support the native Blob constructor. (i.e.
	    // old QtWebKit versions, at least).
	    function _createBlob(parts, properties) {
	        parts = parts || [];
	        properties = properties || {};
	        try {
	            return new Blob(parts, properties);
	        } catch (e) {
	            if (e.name !== 'TypeError') {
	                throw e;
	            }
	            var BlobBuilder = globalObject.BlobBuilder || globalObject.MSBlobBuilder || globalObject.MozBlobBuilder || globalObject.WebKitBlobBuilder;
	            var builder = new BlobBuilder();
	            for (var i = 0; i < parts.length; i += 1) {
	                builder.append(parts[i]);
	            }
	            return builder.getBlob(properties.type);
	        }
	    }

	    // Transform a binary string to an array buffer, because otherwise
	    // weird stuff happens when you try to work with the binary string directly.
	    // It is known.
	    // From http://stackoverflow.com/questions/14967647/ (continues on next line)
	    // encode-decode-image-with-base64-breaks-image (2013-04-21)
	    function _binStringToArrayBuffer(bin) {
	        var length = bin.length;
	        var buf = new ArrayBuffer(length);
	        var arr = new Uint8Array(buf);
	        for (var i = 0; i < length; i++) {
	            arr[i] = bin.charCodeAt(i);
	        }
	        return buf;
	    }

	    // Fetch a blob using ajax. This reveals bugs in Chrome < 43.
	    // For details on all this junk:
	    // https://github.com/nolanlawson/state-of-binary-data-in-the-browser#readme
	    function _blobAjax(url) {
	        return new Promise(function (resolve, reject) {
	            var xhr = new XMLHttpRequest();
	            xhr.open('GET', url);
	            xhr.withCredentials = true;
	            xhr.responseType = 'arraybuffer';

	            xhr.onreadystatechange = function () {
	                if (xhr.readyState !== 4) {
	                    return;
	                }
	                if (xhr.status === 200) {
	                    return resolve({
	                        response: xhr.response,
	                        type: xhr.getResponseHeader('Content-Type')
	                    });
	                }
	                reject({ status: xhr.status, response: xhr.response });
	            };
	            xhr.send();
	        });
	    }

	    //
	    // Detect blob support. Chrome didn't support it until version 38.
	    // In version 37 they had a broken version where PNGs (and possibly
	    // other binary types) aren't stored correctly, because when you fetch
	    // them, the content type is always null.
	    //
	    // Furthermore, they have some outstanding bugs where blobs occasionally
	    // are read by FileReader as null, or by ajax as 404s.
	    //
	    // Sadly we use the 404 bug to detect the FileReader bug, so if they
	    // get fixed independently and released in different versions of Chrome,
	    // then the bug could come back. So it's worthwhile to watch these issues:
	    // 404 bug: https://code.google.com/p/chromium/issues/detail?id=447916
	    // FileReader bug: https://code.google.com/p/chromium/issues/detail?id=447836
	    //
	    function _checkBlobSupportWithoutCaching(idb) {
	        return new Promise(function (resolve, reject) {
	            var blob = _createBlob([''], { type: 'image/png' });
	            var txn = idb.transaction([DETECT_BLOB_SUPPORT_STORE], 'readwrite');
	            txn.objectStore(DETECT_BLOB_SUPPORT_STORE).put(blob, 'key');
	            txn.oncomplete = function () {
	                // have to do it in a separate transaction, else the correct
	                // content type is always returned
	                var blobTxn = idb.transaction([DETECT_BLOB_SUPPORT_STORE], 'readwrite');
	                var getBlobReq = blobTxn.objectStore(DETECT_BLOB_SUPPORT_STORE).get('key');
	                getBlobReq.onerror = reject;
	                getBlobReq.onsuccess = function (e) {

	                    var storedBlob = e.target.result;
	                    var url = URL.createObjectURL(storedBlob);

	                    _blobAjax(url).then(function (res) {
	                        resolve(!!(res && res.type === 'image/png'));
	                    }, function () {
	                        resolve(false);
	                    }).then(function () {
	                        URL.revokeObjectURL(url);
	                    });
	                };
	            };
	        })['catch'](function () {
	            return false; // error, so assume unsupported
	        });
	    }

	    function _checkBlobSupport(idb) {
	        if (typeof supportsBlobs === 'boolean') {
	            return Promise.resolve(supportsBlobs);
	        }
	        return _checkBlobSupportWithoutCaching(idb).then(function (value) {
	            supportsBlobs = value;
	            return supportsBlobs;
	        });
	    }

	    // encode a blob for indexeddb engines that don't support blobs
	    function _encodeBlob(blob) {
	        return new Promise(function (resolve, reject) {
	            var reader = new FileReader();
	            reader.onerror = reject;
	            reader.onloadend = function (e) {
	                var base64 = btoa(e.target.result || '');
	                resolve({
	                    __local_forage_encoded_blob: true,
	                    data: base64,
	                    type: blob.type
	                });
	            };
	            reader.readAsBinaryString(blob);
	        });
	    }

	    // decode an encoded blob
	    function _decodeBlob(encodedBlob) {
	        var arrayBuff = _binStringToArrayBuffer(atob(encodedBlob.data));
	        return _createBlob([arrayBuff], { type: encodedBlob.type });
	    }

	    // is this one of our fancy encoded blobs?
	    function _isEncodedBlob(value) {
	        return value && value.__local_forage_encoded_blob;
	    }

	    // Open the IndexedDB database (automatically creates one if one didn't
	    // previously exist), using any options set in the config.
	    function _initStorage(options) {
	        var self = this;
	        var dbInfo = {
	            db: null
	        };

	        if (options) {
	            for (var i in options) {
	                dbInfo[i] = options[i];
	            }
	        }

	        // Initialize a singleton container for all running localForages.
	        if (!dbContexts) {
	            dbContexts = {};
	        }

	        // Get the current context of the database;
	        var dbContext = dbContexts[dbInfo.name];

	        // ...or create a new context.
	        if (!dbContext) {
	            dbContext = {
	                // Running localForages sharing a database.
	                forages: [],
	                // Shared database.
	                db: null
	            };
	            // Register the new context in the global container.
	            dbContexts[dbInfo.name] = dbContext;
	        }

	        // Register itself as a running localForage in the current context.
	        dbContext.forages.push(this);

	        // Create an array of readiness of the related localForages.
	        var readyPromises = [];

	        function ignoreErrors() {
	            // Don't handle errors here,
	            // just makes sure related localForages aren't pending.
	            return Promise.resolve();
	        }

	        for (var j = 0; j < dbContext.forages.length; j++) {
	            var forage = dbContext.forages[j];
	            if (forage !== this) {
	                // Don't wait for itself...
	                readyPromises.push(forage.ready()['catch'](ignoreErrors));
	            }
	        }

	        // Take a snapshot of the related localForages.
	        var forages = dbContext.forages.slice(0);

	        // Initialize the connection process only when
	        // all the related localForages aren't pending.
	        return Promise.all(readyPromises).then(function () {
	            dbInfo.db = dbContext.db;
	            // Get the connection or open a new one without upgrade.
	            return _getOriginalConnection(dbInfo);
	        }).then(function (db) {
	            dbInfo.db = db;
	            if (_isUpgradeNeeded(dbInfo, self._defaultConfig.version)) {
	                // Reopen the database for upgrading.
	                return _getUpgradedConnection(dbInfo);
	            }
	            return db;
	        }).then(function (db) {
	            dbInfo.db = dbContext.db = db;
	            self._dbInfo = dbInfo;
	            // Share the final connection amongst related localForages.
	            for (var k in forages) {
	                var forage = forages[k];
	                if (forage !== self) {
	                    // Self is already up-to-date.
	                    forage._dbInfo.db = dbInfo.db;
	                    forage._dbInfo.version = dbInfo.version;
	                }
	            }
	        });
	    }

	    function _getOriginalConnection(dbInfo) {
	        return _getConnection(dbInfo, false);
	    }

	    function _getUpgradedConnection(dbInfo) {
	        return _getConnection(dbInfo, true);
	    }

	    function _getConnection(dbInfo, upgradeNeeded) {
	        return new Promise(function (resolve, reject) {
	            if (dbInfo.db) {
	                if (upgradeNeeded) {
	                    dbInfo.db.close();
	                } else {
	                    return resolve(dbInfo.db);
	                }
	            }

	            var dbArgs = [dbInfo.name];

	            if (upgradeNeeded) {
	                dbArgs.push(dbInfo.version);
	            }

	            var openreq = indexedDB.open.apply(indexedDB, dbArgs);

	            if (upgradeNeeded) {
	                openreq.onupgradeneeded = function (e) {
	                    var db = openreq.result;
	                    try {
	                        db.createObjectStore(dbInfo.storeName);
	                        if (e.oldVersion <= 1) {
	                            // Added when support for blob shims was added
	                            db.createObjectStore(DETECT_BLOB_SUPPORT_STORE);
	                        }
	                    } catch (ex) {
	                        if (ex.name === 'ConstraintError') {
	                            globalObject.console.warn('The database "' + dbInfo.name + '"' + ' has been upgraded from version ' + e.oldVersion + ' to version ' + e.newVersion + ', but the storage "' + dbInfo.storeName + '" already exists.');
	                        } else {
	                            throw ex;
	                        }
	                    }
	                };
	            }

	            openreq.onerror = function () {
	                reject(openreq.error);
	            };

	            openreq.onsuccess = function () {
	                resolve(openreq.result);
	            };
	        });
	    }

	    function _isUpgradeNeeded(dbInfo, defaultVersion) {
	        if (!dbInfo.db) {
	            return true;
	        }

	        var isNewStore = !dbInfo.db.objectStoreNames.contains(dbInfo.storeName);
	        var isDowngrade = dbInfo.version < dbInfo.db.version;
	        var isUpgrade = dbInfo.version > dbInfo.db.version;

	        if (isDowngrade) {
	            // If the version is not the default one
	            // then warn for impossible downgrade.
	            if (dbInfo.version !== defaultVersion) {
	                globalObject.console.warn('The database "' + dbInfo.name + '"' + ' can\'t be downgraded from version ' + dbInfo.db.version + ' to version ' + dbInfo.version + '.');
	            }
	            // Align the versions to prevent errors.
	            dbInfo.version = dbInfo.db.version;
	        }

	        if (isUpgrade || isNewStore) {
	            // If the store is new then increment the version (if needed).
	            // This will trigger an "upgradeneeded" event which is required
	            // for creating a store.
	            if (isNewStore) {
	                var incVersion = dbInfo.db.version + 1;
	                if (incVersion > dbInfo.version) {
	                    dbInfo.version = incVersion;
	                }
	            }

	            return true;
	        }

	        return false;
	    }

	    function getItem(key, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var store = dbInfo.db.transaction(dbInfo.storeName, 'readonly').objectStore(dbInfo.storeName);
	                var req = store.get(key);

	                req.onsuccess = function () {
	                    var value = req.result;
	                    if (value === undefined) {
	                        value = null;
	                    }
	                    if (_isEncodedBlob(value)) {
	                        value = _decodeBlob(value);
	                    }
	                    resolve(value);
	                };

	                req.onerror = function () {
	                    reject(req.error);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Iterate over all items stored in database.
	    function iterate(iterator, callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var store = dbInfo.db.transaction(dbInfo.storeName, 'readonly').objectStore(dbInfo.storeName);

	                var req = store.openCursor();
	                var iterationNumber = 1;

	                req.onsuccess = function () {
	                    var cursor = req.result;

	                    if (cursor) {
	                        var value = cursor.value;
	                        if (_isEncodedBlob(value)) {
	                            value = _decodeBlob(value);
	                        }
	                        var result = iterator(value, cursor.key, iterationNumber++);

	                        if (result !== void 0) {
	                            resolve(result);
	                        } else {
	                            cursor['continue']();
	                        }
	                    } else {
	                        resolve();
	                    }
	                };

	                req.onerror = function () {
	                    reject(req.error);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);

	        return promise;
	    }

	    function setItem(key, value, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = new Promise(function (resolve, reject) {
	            var dbInfo;
	            self.ready().then(function () {
	                dbInfo = self._dbInfo;
	                return _checkBlobSupport(dbInfo.db);
	            }).then(function (blobSupport) {
	                if (!blobSupport && value instanceof Blob) {
	                    return _encodeBlob(value);
	                }
	                return value;
	            }).then(function (value) {
	                var transaction = dbInfo.db.transaction(dbInfo.storeName, 'readwrite');
	                var store = transaction.objectStore(dbInfo.storeName);

	                // The reason we don't _save_ null is because IE 10 does
	                // not support saving the `null` type in IndexedDB. How
	                // ironic, given the bug below!
	                // See: https://github.com/mozilla/localForage/issues/161
	                if (value === null) {
	                    value = undefined;
	                }

	                var req = store.put(value, key);
	                transaction.oncomplete = function () {
	                    // Cast to undefined so the value passed to
	                    // callback/promise is the same as what one would get out
	                    // of `getItem()` later. This leads to some weirdness
	                    // (setItem('foo', undefined) will return `null`), but
	                    // it's not my fault localStorage is our baseline and that
	                    // it's weird.
	                    if (value === undefined) {
	                        value = null;
	                    }

	                    resolve(value);
	                };
	                transaction.onabort = transaction.onerror = function () {
	                    var err = req.error ? req.error : req.transaction.error;
	                    reject(err);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function removeItem(key, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var transaction = dbInfo.db.transaction(dbInfo.storeName, 'readwrite');
	                var store = transaction.objectStore(dbInfo.storeName);

	                // We use a Grunt task to make this safe for IE and some
	                // versions of Android (including those used by Cordova).
	                // Normally IE won't like `.delete()` and will insist on
	                // using `['delete']()`, but we have a build step that
	                // fixes this for us now.
	                var req = store['delete'](key);
	                transaction.oncomplete = function () {
	                    resolve();
	                };

	                transaction.onerror = function () {
	                    reject(req.error);
	                };

	                // The request will be also be aborted if we've exceeded our storage
	                // space.
	                transaction.onabort = function () {
	                    var err = req.error ? req.error : req.transaction.error;
	                    reject(err);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function clear(callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var transaction = dbInfo.db.transaction(dbInfo.storeName, 'readwrite');
	                var store = transaction.objectStore(dbInfo.storeName);
	                var req = store.clear();

	                transaction.oncomplete = function () {
	                    resolve();
	                };

	                transaction.onabort = transaction.onerror = function () {
	                    var err = req.error ? req.error : req.transaction.error;
	                    reject(err);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function length(callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var store = dbInfo.db.transaction(dbInfo.storeName, 'readonly').objectStore(dbInfo.storeName);
	                var req = store.count();

	                req.onsuccess = function () {
	                    resolve(req.result);
	                };

	                req.onerror = function () {
	                    reject(req.error);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function key(n, callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            if (n < 0) {
	                resolve(null);

	                return;
	            }

	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var store = dbInfo.db.transaction(dbInfo.storeName, 'readonly').objectStore(dbInfo.storeName);

	                var advanced = false;
	                var req = store.openCursor();
	                req.onsuccess = function () {
	                    var cursor = req.result;
	                    if (!cursor) {
	                        // this means there weren't enough keys
	                        resolve(null);

	                        return;
	                    }

	                    if (n === 0) {
	                        // We have the first key, return it if that's what they
	                        // wanted.
	                        resolve(cursor.key);
	                    } else {
	                        if (!advanced) {
	                            // Otherwise, ask the cursor to skip ahead n
	                            // records.
	                            advanced = true;
	                            cursor.advance(n);
	                        } else {
	                            // When we get here, we've got the nth key.
	                            resolve(cursor.key);
	                        }
	                    }
	                };

	                req.onerror = function () {
	                    reject(req.error);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function keys(callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var store = dbInfo.db.transaction(dbInfo.storeName, 'readonly').objectStore(dbInfo.storeName);

	                var req = store.openCursor();
	                var keys = [];

	                req.onsuccess = function () {
	                    var cursor = req.result;

	                    if (!cursor) {
	                        resolve(keys);
	                        return;
	                    }

	                    keys.push(cursor.key);
	                    cursor['continue']();
	                };

	                req.onerror = function () {
	                    reject(req.error);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function executeCallback(promise, callback) {
	        if (callback) {
	            promise.then(function (result) {
	                callback(null, result);
	            }, function (error) {
	                callback(error);
	            });
	        }
	    }

	    var asyncStorage = {
	        _driver: 'asyncStorage',
	        _initStorage: _initStorage,
	        iterate: iterate,
	        getItem: getItem,
	        setItem: setItem,
	        removeItem: removeItem,
	        clear: clear,
	        length: length,
	        key: key,
	        keys: keys
	    };

	    exports['default'] = asyncStorage;
	}).call(typeof window !== 'undefined' ? window : self);
	module.exports = exports['default'];

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	// If IndexedDB isn't available, we'll fall back to localStorage.
	// Note that this will have considerable performance and storage
	// side-effects (all data will be serialized on save and only data that
	// can be converted to a string via `JSON.stringify()` will be saved).
	'use strict';

	exports.__esModule = true;
	(function () {
	    'use strict';

	    var globalObject = this;
	    var localStorage = null;

	    // If the app is running inside a Google Chrome packaged webapp, or some
	    // other context where localStorage isn't available, we don't use
	    // localStorage. This feature detection is preferred over the old
	    // `if (window.chrome && window.chrome.runtime)` code.
	    // See: https://github.com/mozilla/localForage/issues/68
	    try {
	        // If localStorage isn't available, we get outta here!
	        // This should be inside a try catch
	        if (!this.localStorage || !('setItem' in this.localStorage)) {
	            return;
	        }
	        // Initialize localStorage and create a variable to use throughout
	        // the code.
	        localStorage = this.localStorage;
	    } catch (e) {
	        return;
	    }

	    // Config the localStorage backend, using options set in the config.
	    function _initStorage(options) {
	        var self = this;
	        var dbInfo = {};
	        if (options) {
	            for (var i in options) {
	                dbInfo[i] = options[i];
	            }
	        }

	        dbInfo.keyPrefix = dbInfo.name + '/';

	        if (dbInfo.storeName !== self._defaultConfig.storeName) {
	            dbInfo.keyPrefix += dbInfo.storeName + '/';
	        }

	        self._dbInfo = dbInfo;

	        return new Promise(function (resolve, reject) {
	            resolve(__webpack_require__(3));
	        }).then(function (lib) {
	            dbInfo.serializer = lib;
	            return Promise.resolve();
	        });
	    }

	    // Remove all keys from the datastore, effectively destroying all data in
	    // the app's key/value store!
	    function clear(callback) {
	        var self = this;
	        var promise = self.ready().then(function () {
	            var keyPrefix = self._dbInfo.keyPrefix;

	            for (var i = localStorage.length - 1; i >= 0; i--) {
	                var key = localStorage.key(i);

	                if (key.indexOf(keyPrefix) === 0) {
	                    localStorage.removeItem(key);
	                }
	            }
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Retrieve an item from the store. Unlike the original async_storage
	    // library in Gaia, we don't modify return values at all. If a key's value
	    // is `undefined`, we pass that value to the callback function.
	    function getItem(key, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            var result = localStorage.getItem(dbInfo.keyPrefix + key);

	            // If a result was found, parse it from the serialized
	            // string into a JS object. If result isn't truthy, the key
	            // is likely undefined and we'll pass it straight to the
	            // callback.
	            if (result) {
	                result = dbInfo.serializer.deserialize(result);
	            }

	            return result;
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Iterate over all items in the store.
	    function iterate(iterator, callback) {
	        var self = this;

	        var promise = self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            var keyPrefix = dbInfo.keyPrefix;
	            var keyPrefixLength = keyPrefix.length;
	            var length = localStorage.length;

	            // We use a dedicated iterator instead of the `i` variable below
	            // so other keys we fetch in localStorage aren't counted in
	            // the `iterationNumber` argument passed to the `iterate()`
	            // callback.
	            //
	            // See: github.com/mozilla/localForage/pull/435#discussion_r38061530
	            var iterationNumber = 1;

	            for (var i = 0; i < length; i++) {
	                var key = localStorage.key(i);
	                if (key.indexOf(keyPrefix) !== 0) {
	                    continue;
	                }
	                var value = localStorage.getItem(key);

	                // If a result was found, parse it from the serialized
	                // string into a JS object. If result isn't truthy, the
	                // key is likely undefined and we'll pass it straight
	                // to the iterator.
	                if (value) {
	                    value = dbInfo.serializer.deserialize(value);
	                }

	                value = iterator(value, key.substring(keyPrefixLength), iterationNumber++);

	                if (value !== void 0) {
	                    return value;
	                }
	            }
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Same as localStorage's key() method, except takes a callback.
	    function key(n, callback) {
	        var self = this;
	        var promise = self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            var result;
	            try {
	                result = localStorage.key(n);
	            } catch (error) {
	                result = null;
	            }

	            // Remove the prefix from the key, if a key is found.
	            if (result) {
	                result = result.substring(dbInfo.keyPrefix.length);
	            }

	            return result;
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function keys(callback) {
	        var self = this;
	        var promise = self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            var length = localStorage.length;
	            var keys = [];

	            for (var i = 0; i < length; i++) {
	                if (localStorage.key(i).indexOf(dbInfo.keyPrefix) === 0) {
	                    keys.push(localStorage.key(i).substring(dbInfo.keyPrefix.length));
	                }
	            }

	            return keys;
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Supply the number of keys in the datastore to the callback function.
	    function length(callback) {
	        var self = this;
	        var promise = self.keys().then(function (keys) {
	            return keys.length;
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Remove an item from the store, nice and simple.
	    function removeItem(key, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            localStorage.removeItem(dbInfo.keyPrefix + key);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Set a key's value and run an optional callback once the value is set.
	    // Unlike Gaia's implementation, the callback function is passed the value,
	    // in case you want to operate on that value only after you're sure it
	    // saved, or something like that.
	    function setItem(key, value, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = self.ready().then(function () {
	            // Convert undefined values to null.
	            // https://github.com/mozilla/localForage/pull/42
	            if (value === undefined) {
	                value = null;
	            }

	            // Save the original value to pass to the callback.
	            var originalValue = value;

	            return new Promise(function (resolve, reject) {
	                var dbInfo = self._dbInfo;
	                dbInfo.serializer.serialize(value, function (value, error) {
	                    if (error) {
	                        reject(error);
	                    } else {
	                        try {
	                            localStorage.setItem(dbInfo.keyPrefix + key, value);
	                            resolve(originalValue);
	                        } catch (e) {
	                            // localStorage capacity exceeded.
	                            // TODO: Make this a specific error/event.
	                            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
	                                reject(e);
	                            }
	                            reject(e);
	                        }
	                    }
	                });
	            });
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function executeCallback(promise, callback) {
	        if (callback) {
	            promise.then(function (result) {
	                callback(null, result);
	            }, function (error) {
	                callback(error);
	            });
	        }
	    }

	    var localStorageWrapper = {
	        _driver: 'localStorageWrapper',
	        _initStorage: _initStorage,
	        // Default API, from Gaia/localStorage.
	        iterate: iterate,
	        getItem: getItem,
	        setItem: setItem,
	        removeItem: removeItem,
	        clear: clear,
	        length: length,
	        key: key,
	        keys: keys
	    };

	    exports['default'] = localStorageWrapper;
	}).call(typeof window !== 'undefined' ? window : self);
	module.exports = exports['default'];

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';

	exports.__esModule = true;
	(function () {
	    'use strict';

	    // Sadly, the best way to save binary data in WebSQL/localStorage is serializing
	    // it to Base64, so this is how we store it to prevent very strange errors with less
	    // verbose ways of binary <-> string data storage.
	    var BASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	    var BLOB_TYPE_PREFIX = '~~local_forage_type~';
	    var BLOB_TYPE_PREFIX_REGEX = /^~~local_forage_type~([^~]+)~/;

	    var SERIALIZED_MARKER = '__lfsc__:';
	    var SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER.length;

	    // OMG the serializations!
	    var TYPE_ARRAYBUFFER = 'arbf';
	    var TYPE_BLOB = 'blob';
	    var TYPE_INT8ARRAY = 'si08';
	    var TYPE_UINT8ARRAY = 'ui08';
	    var TYPE_UINT8CLAMPEDARRAY = 'uic8';
	    var TYPE_INT16ARRAY = 'si16';
	    var TYPE_INT32ARRAY = 'si32';
	    var TYPE_UINT16ARRAY = 'ur16';
	    var TYPE_UINT32ARRAY = 'ui32';
	    var TYPE_FLOAT32ARRAY = 'fl32';
	    var TYPE_FLOAT64ARRAY = 'fl64';
	    var TYPE_SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER_LENGTH + TYPE_ARRAYBUFFER.length;

	    // Get out of our habit of using `window` inline, at least.
	    var globalObject = this;

	    // Abstracts constructing a Blob object, so it also works in older
	    // browsers that don't support the native Blob constructor. (i.e.
	    // old QtWebKit versions, at least).
	    function _createBlob(parts, properties) {
	        parts = parts || [];
	        properties = properties || {};

	        try {
	            return new Blob(parts, properties);
	        } catch (err) {
	            if (err.name !== 'TypeError') {
	                throw err;
	            }

	            var BlobBuilder = globalObject.BlobBuilder || globalObject.MSBlobBuilder || globalObject.MozBlobBuilder || globalObject.WebKitBlobBuilder;

	            var builder = new BlobBuilder();
	            for (var i = 0; i < parts.length; i += 1) {
	                builder.append(parts[i]);
	            }

	            return builder.getBlob(properties.type);
	        }
	    }

	    // Serialize a value, afterwards executing a callback (which usually
	    // instructs the `setItem()` callback/promise to be executed). This is how
	    // we store binary data with localStorage.
	    function serialize(value, callback) {
	        var valueString = '';
	        if (value) {
	            valueString = value.toString();
	        }

	        // Cannot use `value instanceof ArrayBuffer` or such here, as these
	        // checks fail when running the tests using casper.js...
	        //
	        // TODO: See why those tests fail and use a better solution.
	        if (value && (value.toString() === '[object ArrayBuffer]' || value.buffer && value.buffer.toString() === '[object ArrayBuffer]')) {
	            // Convert binary arrays to a string and prefix the string with
	            // a special marker.
	            var buffer;
	            var marker = SERIALIZED_MARKER;

	            if (value instanceof ArrayBuffer) {
	                buffer = value;
	                marker += TYPE_ARRAYBUFFER;
	            } else {
	                buffer = value.buffer;

	                if (valueString === '[object Int8Array]') {
	                    marker += TYPE_INT8ARRAY;
	                } else if (valueString === '[object Uint8Array]') {
	                    marker += TYPE_UINT8ARRAY;
	                } else if (valueString === '[object Uint8ClampedArray]') {
	                    marker += TYPE_UINT8CLAMPEDARRAY;
	                } else if (valueString === '[object Int16Array]') {
	                    marker += TYPE_INT16ARRAY;
	                } else if (valueString === '[object Uint16Array]') {
	                    marker += TYPE_UINT16ARRAY;
	                } else if (valueString === '[object Int32Array]') {
	                    marker += TYPE_INT32ARRAY;
	                } else if (valueString === '[object Uint32Array]') {
	                    marker += TYPE_UINT32ARRAY;
	                } else if (valueString === '[object Float32Array]') {
	                    marker += TYPE_FLOAT32ARRAY;
	                } else if (valueString === '[object Float64Array]') {
	                    marker += TYPE_FLOAT64ARRAY;
	                } else {
	                    callback(new Error('Failed to get type for BinaryArray'));
	                }
	            }

	            callback(marker + bufferToString(buffer));
	        } else if (valueString === '[object Blob]') {
	            // Conver the blob to a binaryArray and then to a string.
	            var fileReader = new FileReader();

	            fileReader.onload = function () {
	                // Backwards-compatible prefix for the blob type.
	                var str = BLOB_TYPE_PREFIX + value.type + '~' + bufferToString(this.result);

	                callback(SERIALIZED_MARKER + TYPE_BLOB + str);
	            };

	            fileReader.readAsArrayBuffer(value);
	        } else {
	            try {
	                callback(JSON.stringify(value));
	            } catch (e) {
	                console.error("Couldn't convert value into a JSON string: ", value);

	                callback(null, e);
	            }
	        }
	    }

	    // Deserialize data we've inserted into a value column/field. We place
	    // special markers into our strings to mark them as encoded; this isn't
	    // as nice as a meta field, but it's the only sane thing we can do whilst
	    // keeping localStorage support intact.
	    //
	    // Oftentimes this will just deserialize JSON content, but if we have a
	    // special marker (SERIALIZED_MARKER, defined above), we will extract
	    // some kind of arraybuffer/binary data/typed array out of the string.
	    function deserialize(value) {
	        // If we haven't marked this string as being specially serialized (i.e.
	        // something other than serialized JSON), we can just return it and be
	        // done with it.
	        if (value.substring(0, SERIALIZED_MARKER_LENGTH) !== SERIALIZED_MARKER) {
	            return JSON.parse(value);
	        }

	        // The following code deals with deserializing some kind of Blob or
	        // TypedArray. First we separate out the type of data we're dealing
	        // with from the data itself.
	        var serializedString = value.substring(TYPE_SERIALIZED_MARKER_LENGTH);
	        var type = value.substring(SERIALIZED_MARKER_LENGTH, TYPE_SERIALIZED_MARKER_LENGTH);

	        var blobType;
	        // Backwards-compatible blob type serialization strategy.
	        // DBs created with older versions of localForage will simply not have the blob type.
	        if (type === TYPE_BLOB && BLOB_TYPE_PREFIX_REGEX.test(serializedString)) {
	            var matcher = serializedString.match(BLOB_TYPE_PREFIX_REGEX);
	            blobType = matcher[1];
	            serializedString = serializedString.substring(matcher[0].length);
	        }
	        var buffer = stringToBuffer(serializedString);

	        // Return the right type based on the code/type set during
	        // serialization.
	        switch (type) {
	            case TYPE_ARRAYBUFFER:
	                return buffer;
	            case TYPE_BLOB:
	                return _createBlob([buffer], { type: blobType });
	            case TYPE_INT8ARRAY:
	                return new Int8Array(buffer);
	            case TYPE_UINT8ARRAY:
	                return new Uint8Array(buffer);
	            case TYPE_UINT8CLAMPEDARRAY:
	                return new Uint8ClampedArray(buffer);
	            case TYPE_INT16ARRAY:
	                return new Int16Array(buffer);
	            case TYPE_UINT16ARRAY:
	                return new Uint16Array(buffer);
	            case TYPE_INT32ARRAY:
	                return new Int32Array(buffer);
	            case TYPE_UINT32ARRAY:
	                return new Uint32Array(buffer);
	            case TYPE_FLOAT32ARRAY:
	                return new Float32Array(buffer);
	            case TYPE_FLOAT64ARRAY:
	                return new Float64Array(buffer);
	            default:
	                throw new Error('Unkown type: ' + type);
	        }
	    }

	    function stringToBuffer(serializedString) {
	        // Fill the string into a ArrayBuffer.
	        var bufferLength = serializedString.length * 0.75;
	        var len = serializedString.length;
	        var i;
	        var p = 0;
	        var encoded1, encoded2, encoded3, encoded4;

	        if (serializedString[serializedString.length - 1] === '=') {
	            bufferLength--;
	            if (serializedString[serializedString.length - 2] === '=') {
	                bufferLength--;
	            }
	        }

	        var buffer = new ArrayBuffer(bufferLength);
	        var bytes = new Uint8Array(buffer);

	        for (i = 0; i < len; i += 4) {
	            encoded1 = BASE_CHARS.indexOf(serializedString[i]);
	            encoded2 = BASE_CHARS.indexOf(serializedString[i + 1]);
	            encoded3 = BASE_CHARS.indexOf(serializedString[i + 2]);
	            encoded4 = BASE_CHARS.indexOf(serializedString[i + 3]);

	            /*jslint bitwise: true */
	            bytes[p++] = encoded1 << 2 | encoded2 >> 4;
	            bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
	            bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
	        }
	        return buffer;
	    }

	    // Converts a buffer to a string to store, serialized, in the backend
	    // storage library.
	    function bufferToString(buffer) {
	        // base64-arraybuffer
	        var bytes = new Uint8Array(buffer);
	        var base64String = '';
	        var i;

	        for (i = 0; i < bytes.length; i += 3) {
	            /*jslint bitwise: true */
	            base64String += BASE_CHARS[bytes[i] >> 2];
	            base64String += BASE_CHARS[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
	            base64String += BASE_CHARS[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
	            base64String += BASE_CHARS[bytes[i + 2] & 63];
	        }

	        if (bytes.length % 3 === 2) {
	            base64String = base64String.substring(0, base64String.length - 1) + '=';
	        } else if (bytes.length % 3 === 1) {
	            base64String = base64String.substring(0, base64String.length - 2) + '==';
	        }

	        return base64String;
	    }

	    var localforageSerializer = {
	        serialize: serialize,
	        deserialize: deserialize,
	        stringToBuffer: stringToBuffer,
	        bufferToString: bufferToString
	    };

	    exports['default'] = localforageSerializer;
	}).call(typeof window !== 'undefined' ? window : self);
	module.exports = exports['default'];

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * Includes code from:
	 *
	 * base64-arraybuffer
	 * https://github.com/niklasvh/base64-arraybuffer
	 *
	 * Copyright (c) 2012 Niklas von Hertzen
	 * Licensed under the MIT license.
	 */
	'use strict';

	exports.__esModule = true;
	(function () {
	    'use strict';

	    var globalObject = this;
	    var openDatabase = this.openDatabase;

	    // If WebSQL methods aren't available, we can stop now.
	    if (!openDatabase) {
	        return;
	    }

	    // Open the WebSQL database (automatically creates one if one didn't
	    // previously exist), using any options set in the config.
	    function _initStorage(options) {
	        var self = this;
	        var dbInfo = {
	            db: null
	        };

	        if (options) {
	            for (var i in options) {
	                dbInfo[i] = typeof options[i] !== 'string' ? options[i].toString() : options[i];
	            }
	        }

	        var dbInfoPromise = new Promise(function (resolve, reject) {
	            // Open the database; the openDatabase API will automatically
	            // create it for us if it doesn't exist.
	            try {
	                dbInfo.db = openDatabase(dbInfo.name, String(dbInfo.version), dbInfo.description, dbInfo.size);
	            } catch (e) {
	                return self.setDriver(self.LOCALSTORAGE).then(function () {
	                    return self._initStorage(options);
	                }).then(resolve)['catch'](reject);
	            }

	            // Create our key/value table if it doesn't exist.
	            dbInfo.db.transaction(function (t) {
	                t.executeSql('CREATE TABLE IF NOT EXISTS ' + dbInfo.storeName + ' (id INTEGER PRIMARY KEY, key unique, value)', [], function () {
	                    self._dbInfo = dbInfo;
	                    resolve();
	                }, function (t, error) {
	                    reject(error);
	                });
	            });
	        });

	        return new Promise(function (resolve, reject) {
	            resolve(__webpack_require__(3));
	        }).then(function (lib) {
	            dbInfo.serializer = lib;
	            return dbInfoPromise;
	        });
	    }

	    function getItem(key, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                dbInfo.db.transaction(function (t) {
	                    t.executeSql('SELECT * FROM ' + dbInfo.storeName + ' WHERE key = ? LIMIT 1', [key], function (t, results) {
	                        var result = results.rows.length ? results.rows.item(0).value : null;

	                        // Check to see if this is serialized content we need to
	                        // unpack.
	                        if (result) {
	                            result = dbInfo.serializer.deserialize(result);
	                        }

	                        resolve(result);
	                    }, function (t, error) {

	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function iterate(iterator, callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;

	                dbInfo.db.transaction(function (t) {
	                    t.executeSql('SELECT * FROM ' + dbInfo.storeName, [], function (t, results) {
	                        var rows = results.rows;
	                        var length = rows.length;

	                        for (var i = 0; i < length; i++) {
	                            var item = rows.item(i);
	                            var result = item.value;

	                            // Check to see if this is serialized content
	                            // we need to unpack.
	                            if (result) {
	                                result = dbInfo.serializer.deserialize(result);
	                            }

	                            result = iterator(result, item.key, i + 1);

	                            // void(0) prevents problems with redefinition
	                            // of `undefined`.
	                            if (result !== void 0) {
	                                resolve(result);
	                                return;
	                            }
	                        }

	                        resolve();
	                    }, function (t, error) {
	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function setItem(key, value, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                // The localStorage API doesn't return undefined values in an
	                // "expected" way, so undefined is always cast to null in all
	                // drivers. See: https://github.com/mozilla/localForage/pull/42
	                if (value === undefined) {
	                    value = null;
	                }

	                // Save the original value to pass to the callback.
	                var originalValue = value;

	                var dbInfo = self._dbInfo;
	                dbInfo.serializer.serialize(value, function (value, error) {
	                    if (error) {
	                        reject(error);
	                    } else {
	                        dbInfo.db.transaction(function (t) {
	                            t.executeSql('INSERT OR REPLACE INTO ' + dbInfo.storeName + ' (key, value) VALUES (?, ?)', [key, value], function () {
	                                resolve(originalValue);
	                            }, function (t, error) {
	                                reject(error);
	                            });
	                        }, function (sqlError) {
	                            // The transaction failed; check
	                            // to see if it's a quota error.
	                            if (sqlError.code === sqlError.QUOTA_ERR) {
	                                // We reject the callback outright for now, but
	                                // it's worth trying to re-run the transaction.
	                                // Even if the user accepts the prompt to use
	                                // more storage on Safari, this error will
	                                // be called.
	                                //
	                                // TODO: Try to re-run the transaction.
	                                reject(sqlError);
	                            }
	                        });
	                    }
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function removeItem(key, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                dbInfo.db.transaction(function (t) {
	                    t.executeSql('DELETE FROM ' + dbInfo.storeName + ' WHERE key = ?', [key], function () {
	                        resolve();
	                    }, function (t, error) {

	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Deletes every item in the table.
	    // TODO: Find out if this resets the AUTO_INCREMENT number.
	    function clear(callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                dbInfo.db.transaction(function (t) {
	                    t.executeSql('DELETE FROM ' + dbInfo.storeName, [], function () {
	                        resolve();
	                    }, function (t, error) {
	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Does a simple `COUNT(key)` to get the number of items stored in
	    // localForage.
	    function length(callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                dbInfo.db.transaction(function (t) {
	                    // Ahhh, SQL makes this one soooooo easy.
	                    t.executeSql('SELECT COUNT(key) as c FROM ' + dbInfo.storeName, [], function (t, results) {
	                        var result = results.rows.item(0).c;

	                        resolve(result);
	                    }, function (t, error) {

	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Return the key located at key index X; essentially gets the key from a
	    // `WHERE id = ?`. This is the most efficient way I can think to implement
	    // this rarely-used (in my experience) part of the API, but it can seem
	    // inconsistent, because we do `INSERT OR REPLACE INTO` on `setItem()`, so
	    // the ID of each key will change every time it's updated. Perhaps a stored
	    // procedure for the `setItem()` SQL would solve this problem?
	    // TODO: Don't change ID on `setItem()`.
	    function key(n, callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                dbInfo.db.transaction(function (t) {
	                    t.executeSql('SELECT key FROM ' + dbInfo.storeName + ' WHERE id = ? LIMIT 1', [n + 1], function (t, results) {
	                        var result = results.rows.length ? results.rows.item(0).key : null;
	                        resolve(result);
	                    }, function (t, error) {
	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function keys(callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                dbInfo.db.transaction(function (t) {
	                    t.executeSql('SELECT key FROM ' + dbInfo.storeName, [], function (t, results) {
	                        var keys = [];

	                        for (var i = 0; i < results.rows.length; i++) {
	                            keys.push(results.rows.item(i).key);
	                        }

	                        resolve(keys);
	                    }, function (t, error) {

	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function executeCallback(promise, callback) {
	        if (callback) {
	            promise.then(function (result) {
	                callback(null, result);
	            }, function (error) {
	                callback(error);
	            });
	        }
	    }

	    var webSQLStorage = {
	        _driver: 'webSQLStorage',
	        _initStorage: _initStorage,
	        iterate: iterate,
	        getItem: getItem,
	        setItem: setItem,
	        removeItem: removeItem,
	        clear: clear,
	        length: length,
	        key: key,
	        keys: keys
	    };

	    exports['default'] = webSQLStorage;
	}).call(typeof window !== 'undefined' ? window : self);
	module.exports = exports['default'];

/***/ }
/******/ ])
});
;
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":5}],5:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvZWRpdG9yL3B1YmxpYy9qcy9lZGl0b3IuanMiLCJhcHAvZWRpdG9yL3B1YmxpYy9qcy9sb2FkZXIuanMiLCJhcHAvZWRpdG9yL3B1YmxpYy9qcy9tYWluLmpzIiwibm9kZV9tb2R1bGVzL2xvY2FsZm9yYWdlL2Rpc3QvbG9jYWxmb3JhZ2UuanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzV0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvL3ZhciBjbGFzc2VzID0gcmVxdWlyZSgnLi9jbGFzc2VzLmpzJyk7XG52YXIgbG9hZGVyID0gcmVxdWlyZShcIi4vbG9hZGVyLmpzXCIpO1xuXG52YXIgcGFuZWxzO1xudmFyIGNvbmZpZztcbnZhciBzdGFnZTtcbnZhciB2aWV3Q29udGFpbmVyO1xudmFyIG5vZGVDb250YWluZXI7XG4vL3ZhciBmaXJzdExvYWQgPSB0cnVlO1xudmFyIHZpZXdTY2FsZSA9IDE7XG52YXIgZHJhZ29mZnNldCA9IHt4OjAsIHk6MH07XG4vL3ZhciBkcmFnQm94O1xudmFyIHpvb21OdW1iZXIgPSAzO1xudmFyIHpvb21TdGVwID0gWzAuMiwgMC4zLCAwLjUsIDAuNzUsIDEsIDEuNSwgMl07XG52YXIgZHJhZ2dpbmdfZWxlbWVudDtcblxudmFyIGRlZmF1bHRHYW1lUGF0aCA9IFwiXCI7XG52YXIgY29uX3IgPSA2O1xudmFyIGN1cnJlbnRMb2NhbEltYWdlcztcblxuXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuLy9cdFx0XHRcdFx0XHRcdCAgIC8vXG4vL1x0XHRcdEVYUE9SVFMgICAgICAgICAgICAvL1xuLy9cdFx0XHRcdFx0XHRcdCAgIC8vXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24ob2JqKSB7XG5cbiAgICBwYW5lbHMgPSBvYmoubm9kZXM7XG4gICAgY29uZmlnID0gb2JqLmNvbmZpZztcbiAgICBcblx0aWYgKHN0YWdlID09PSB1bmRlZmluZWQpIHtcblx0XHRzdGFnZSA9IG5ldyBjcmVhdGVqcy5TdGFnZShcImVkaXRfY2FudmFzXCIpO1xuXHRcdGNyZWF0ZWpzLlRpY2tlci5zZXRGUFMoNjApO1xuXHRcdGNyZWF0ZWpzLlRpY2tlci5hZGRFdmVudExpc3RlbmVyKFwidGlja1wiLCBzdGFnZSk7XG5cdH1cblx0ZWxzZSB7XG5cdFx0c3RhZ2UucmVtb3ZlQWxsQ2hpbGRyZW4oKTtcblx0XHR2YXIgYnViYmxlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuYnViYmxlXCIpO1xuXHRcdHZhciB2aWV3ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN2aWV3XCIpO1xuXHRcdGZvciAodmFyIGI9MDsgYiA8IGJ1YmJsZXMubGVuZ3RoOyBiKyspIHtcblx0XHRcdHZpZXcucmVtb3ZlQ2hpbGQoYnViYmxlc1tiXSk7XG5cdFx0fVxuXHR9XG5cblx0Ly92YXIgY29vbF9tYWRzX25vZGUgPSBuZXcgTm9kZShcInBhbmVsXCIpO1xuXHQvL2Nvb2xfbWFkc19ub2RlLmFkZFNvY2tldCh0cnVlKTtcblx0Ly9jb25zb2xlLmxvZyhjb29sX21hZHNfbm9kZSBpbnN0YW5jZW9mIGNyZWF0ZWpzLkNvbnRhaW5lcik7XG5cdC8vY29uc29sZS5sb2coY29vbF9tYWRzX25vZGUgaW5zdGFuY2VvZiBOb2RlKTtcblx0Ly9zdGFnZS5jYW52YXMud2lkdGggPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XG5cdC8vc3RhZ2UuY2FudmFzLmhlaWdodCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XG5cblx0c3RhZ2UuY2FudmFzLndpZHRoID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN2aWV3XCIpLm9mZnNldFdpZHRoO1xuXHRzdGFnZS5jYW52YXMuaGVpZ2h0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN2aWV3XCIpLm9mZnNldEhlaWdodDtcblx0c3RhZ2UuZW5hYmxlTW91c2VPdmVyKDE1KTtcblx0c3RhZ2Uub24oXCJtb3VzZWRvd25cIiwgZnVuY3Rpb24oKSB7IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpOyB9KTtcblxuXHRzdGFnZS5tb3VzZU1vdmVPdXRzaWRlID0gdHJ1ZTtcblx0c3RhZ2Uub24oXCJzdGFnZW1vdXNlbW92ZVwiLCBzdGFnZU1vdXNlTW92ZSk7XG5cblx0aW5pdHZpZXdDb250YWluZXIoKTtcblx0aW5pdE5vZGVzKCk7XG5cblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN6b29taW5cIikub25jbGljayA9IGZ1bmN0aW9uKCkgeyB6b29tKDEpIH07XG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjem9vbW91dFwiKS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7IHpvb20oLTEpIH07XG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcHJvcGVydHlUYWJcIikub25jbGljayA9IGZ1bmN0aW9uKCkgeyBvcGVuVGFiKCdwcm9wZXJ0eVRhYicpIH07XG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjaW1hZ2VzVGFiXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpIHsgb3BlblRhYignaW1hZ2VzVGFiJykgfTtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNlZGl0X2NhbnZhc1wiKS5vbmRyb3AgPSBmdW5jdGlvbigpIHsgZHJvcChldmVudCkgfTtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNlZGl0X2NhbnZhc1wiKS5vbmRyYWdvdmVyID0gZnVuY3Rpb24oKSB7IGFsbG93RHJvcChldmVudCkgfTtcblx0XG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2F2ZVwiKS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0bG9hZGVyLnNhdmUobm9kZUNvbnRhaW5lci50b09iamVjdCgpKTtcblx0fTtcblx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24oZSkge1xuXHQgIGlmIChlLmtleUNvZGUgPT0gODMgJiYgKG5hdmlnYXRvci5wbGF0Zm9ybS5tYXRjaChcIk1hY1wiKSA/IGUubWV0YUtleSA6IGUuY3RybEtleSkpIHtcblx0ICAgIGUucHJldmVudERlZmF1bHQoKTtcblx0ICAgIC8vIFByb2Nlc3MgZXZlbnQuLi5cblx0ICAgICAgbG9hZGVyLnNhdmVKU09OKGVkaXRvci5ub2Rlc1RvT2JqZWN0KCksIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZmlsZXBhdGhcIikudmFsdWUpO1xuXHQgIH1cblx0fSwgZmFsc2UpO1xuXG5cdGZ1bmN0aW9uIHN0YWdlTW91c2VNb3ZlKGV2dCkge1xuXHRcdGlmIChkcmFnZ2luZ19lbGVtZW50ICE9PSB1bmRlZmluZWQgJiYgZHJhZ2dpbmdfZWxlbWVudCAhPT0gbnVsbCkge1xuXHRcdFx0dmFyIGxvY2FsID0gZHJhZ2dpbmdfZWxlbWVudC5wYXJlbnQuZ2xvYmFsVG9Mb2NhbChldnQuc3RhZ2VYIC0gZHJhZ29mZnNldC54LCBldnQuc3RhZ2VZIC0gZHJhZ29mZnNldC55KTtcblx0XHRcdGRyYWdnaW5nX2VsZW1lbnQueCA9IGxvY2FsLng7XG5cdFx0XHRkcmFnZ2luZ19lbGVtZW50LnkgPSBsb2NhbC55O1xuXHRcdH1cblx0fVxufVxuXG5leHBvcnRzLm5vZGVzVG9PYmplY3QgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIG5vZGVDb250YWluZXIudG9PYmplY3QoKTtcbn1cblxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vICBFRElUT1IgIC8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cbmZ1bmN0aW9uIGluaXROb2RlcygpIHtcblx0bm9kZUNvbnRhaW5lciA9IG5ldyBOb2RlQ29udGFpbmVyKCk7XG5cdG5vZGVDb250YWluZXIuc3RhcnRub2RlID0gY29uZmlnLnN0YXJ0bm9kZTtcblx0Zm9yICh2YXIgcD0wOyBwPHBhbmVscy5sZW5ndGg7cCsrKSB7XG5cdFx0dmFyIHBhbmVsID0gbmV3IFBhbmVsKHBhbmVsc1twXSk7XG5cdFx0bm9kZUNvbnRhaW5lci5hZGRDaGlsZChwYW5lbCk7XG5cdH1cblx0bm9kZUNvbnRhaW5lci5tYWtlQ29ubmVjdGlvbnMoKTtcblx0dmlld0NvbnRhaW5lci5hZGRDaGlsZChub2RlQ29udGFpbmVyKTtcblx0ZHJhd0FsbENvbm5lY3Rpb25zKCk7XG59XG5cbndpbmRvdy5vbnJlc2l6ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIHZpZXcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpZXdcIik7XG4gICAgdmFyIHNpZGViYXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3NpZGViYXJcIik7XG5cbiAgICBzdGFnZS5jYW52YXMud2lkdGggPSB2aWV3Lm9mZnNldFdpZHRoO1xuICAgIHN0YWdlLmNhbnZhcy5oZWlnaHQgPSB2aWV3Lm9mZnNldEhlaWdodDtcblxuXHRzdGFnZS5nZXRDaGlsZEJ5TmFtZShcImRyYWdCb3hcIikuZ3JhcGhpY3MuYmVnaW5GaWxsKFwiIzk5OVwiKS5kcmF3UmVjdCgwLDAsc3RhZ2UuY2FudmFzLndpZHRoLCBzdGFnZS5jYW52YXMuaGVpZ2h0KTtcbiAgICAvL3N0YWdlLnVwZGF0ZSgpO1xufTtcblxuZnVuY3Rpb24gY2xlYXJBbGwoKSB7XG5cblx0ZnVuY3Rpb24gY2xlYXJFdmVudHMoZGlzT2JqKSB7XG5cdFx0Y29uc29sZS5sb2coZGlzT2JqKTtcblx0XHRkaXNPYmoucmVtb3ZlQWxsRXZlbnRMaXN0ZW5lcnMoKTtcblx0XHRmb3IgKHZhciBpPTA7IGkgPCBkaXNPYmouY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChkaXNPYmouY2hpbGRyZW5baV0uY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRjbGVhckV2ZW50cyhkaXNPYmouY2hpbGRyZW5baV0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRpZiAoc3RhZ2UgIT09IHVuZGVmaW5lZCkgY2xlYXJFdmVudHMoc3RhZ2UpO1xufVxuXG5mdW5jdGlvbiBpbml0dmlld0NvbnRhaW5lcigpIHtcblx0dmFyIGRyYWdCb3g7XG5cblx0Ly92YXIgY29ybmVycyA9IG5ldyBjcmVhdGVqcy5TaGFwZSgpO1xuXG5cdHZpZXdDb250YWluZXIgPSBuZXcgY3JlYXRlanMuQ29udGFpbmVyKCk7XG5cdHZpZXdTY2FsZSA9IHpvb21TdGVwW3pvb21OdW1iZXJdO1xuXHR2aWV3Q29udGFpbmVyLnNjYWxlWCA9IHZpZXdTY2FsZTtcblx0dmlld0NvbnRhaW5lci5zY2FsZVkgPSB2aWV3U2NhbGU7XG5cdHZpZXdDb250YWluZXIubmFtZSA9IFwiVmlldyBDb250YWluZXJcIjtcblxuXHRmdW5jdGlvbiBkcmFnVmlldyhldnQpIHtcblx0XHQvL2NvbnNvbGUubG9nKFwiRHJhZ2dpbiB2aWV3ISBcIiArIGV2dC50YXJnZXQpO1xuXHRcdHZpZXdDb250YWluZXIueCA9IGV2dC5zdGFnZVggLSBkcmFnb2Zmc2V0Lng7XG5cdFx0dmlld0NvbnRhaW5lci55ID0gZXZ0LnN0YWdlWSAtIGRyYWdvZmZzZXQueTtcblxuXHRcdGNlbnRlclZpZXdPcmlnaW4oZXZ0LnN0YWdlWCAtIGRyYWdvZmZzZXQueCwgZXZ0LnN0YWdlWSAtIGRyYWdvZmZzZXQueSk7XG5cdH1cblxuXHRmdW5jdGlvbiBjZW50ZXJWaWV3T3JpZ2luKHgseSkge1xuXHRcdHZpZXdDb250YWluZXIucmVnWCA9ICgoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN2aWV3XCIpLm9mZnNldFdpZHRoIC0gMjgwKS8yIC0gdmlld0NvbnRhaW5lci54KS92aWV3U2NhbGU7XG5cdFx0dmlld0NvbnRhaW5lci5yZWdZID0gKChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpZXdcIikub2Zmc2V0SGVpZ2h0LzIpIC0gdmlld0NvbnRhaW5lci55KS92aWV3U2NhbGU7XG5cdFx0Ly9jb3JuZXJzLmdyYXBoaWNzLmNsZWFyKCk7XG5cdFx0Ly9jb3JuZXJzLmdyYXBoaWNzLmYoXCJyZWRcIikuZGModmlld0NvbnRhaW5lci54LHZpZXdDb250YWluZXIueSwxNSkuZihcImJsdWVcIikuZGModmlld0NvbnRhaW5lci54K3ZpZXdDb250YWluZXIucmVnWCp2aWV3U2NhbGUsIHZpZXdDb250YWluZXIueSt2aWV3Q29udGFpbmVyLnJlZ1kqdmlld1NjYWxlLCAxNSk7XG5cdFx0dmlld0NvbnRhaW5lci54ID0geCArIHZpZXdDb250YWluZXIucmVnWCAqIHZpZXdTY2FsZTtcblx0XHR2aWV3Q29udGFpbmVyLnkgPSB5ICsgdmlld0NvbnRhaW5lci5yZWdZICogdmlld1NjYWxlO1xuXHR9XG5cblx0ZHJhZ0JveCA9IG5ldyBjcmVhdGVqcy5TaGFwZShuZXcgY3JlYXRlanMuR3JhcGhpY3MoKS5iZWdpbkZpbGwoXCIjOTk5XCIpLmRyYXdSZWN0KDAsMCxzdGFnZS5jYW52YXMud2lkdGgsIHN0YWdlLmNhbnZhcy5oZWlnaHQpKTtcblx0ZHJhZ0JveC5vbihcIm1vdXNlZG93blwiLCBmdW5jdGlvbihldnQpIHtcblx0XHRpZiAoY3VycmVudGx5U2VsZWN0ZWQgIT09IHVuZGVmaW5lZCAmJiBjdXJyZW50bHlTZWxlY3RlZC5zZWxlY3RlZCAhPT0gdW5kZWZpbmVkKSBjdXJyZW50bHlTZWxlY3RlZC5zZWxlY3RlZC5ncmFwaGljcy5jbGVhcigpO1xuXHRcdGN1cnJlbnRseVNlbGVjdGVkID0gbm9kZUNvbnRhaW5lcjtcblx0XHRvcGVuVGFiKFwicHJvcGVydHlUYWJcIik7XG5cdFx0Ly9ub2RlQ29udGFpbmVyLnNob3dQcm9wZXJ0aWVzKCk7XG5cdFx0ZHJhZ29mZnNldC54ID0gZXZ0LnN0YWdlWCAtIHZpZXdDb250YWluZXIueCArIHZpZXdDb250YWluZXIucmVnWCp2aWV3U2NhbGU7XG5cdFx0ZHJhZ29mZnNldC55ID0gZXZ0LnN0YWdlWSAtIHZpZXdDb250YWluZXIueSArIHZpZXdDb250YWluZXIucmVnWSp2aWV3U2NhbGU7XG5cdH0pO1xuXHRkcmFnQm94Lm9uKFwicHJlc3Ntb3ZlXCIsIGRyYWdWaWV3KTtcblx0Ly9kcmFnQm94LmN1cnNvciA9IFwiZ3JhYlwiO1xuXHRkcmFnQm94Lm5hbWUgPSBcImRyYWdCb3hcIjtcblxuXHRzdGFnZS5hZGRDaGlsZChkcmFnQm94KTtcblx0Ly9zdGFnZS5hZGRDaGlsZChjb3JuZXJzKTtcblx0c3RhZ2UuYWRkQ2hpbGQodmlld0NvbnRhaW5lcik7XG5cblx0Y2VudGVyVmlld09yaWdpbigwLDApO1xufVxuXG5mdW5jdGlvbiBkcmF3QWxsQ29ubmVjdGlvbnMoKSB7XG5cdGZvciAodmFyIGMgPSAwOyBjIDwgbm9kZUNvbnRhaW5lci5jaGlsZHJlbi5sZW5ndGg7IGMrKykge1xuXHRcdG5vZGVDb250YWluZXIuY2hpbGRyZW5bY10uZHJhd0Nvbm5lY3Rpb25zKCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gbmV3UGFuZWwoeCwgeSwgaW1hZ2UpIHtcblx0dmFyIG9iaiA9IG5ldyBPYmplY3QoKTtcblx0b2JqLmltYWdlID0gaW1hZ2U7XG5cdG9iai5lZGl0b3IgPSBuZXcgT2JqZWN0KCk7XG5cdG9iai5lZGl0b3IucG9zaXRpb24gPSB7XG5cdFx0eDogeCxcblx0XHR5OiB5XG5cdH1cblx0bm9kZUNvbnRhaW5lci5hZGRDaGlsZChuZXcgUGFuZWwob2JqKSk7XG59XG5cbmZ1bmN0aW9uIG5ld1BhbmVsRWxlbWVudCh4LCB5LCBwYW5lbCwgaW1hZ2UpIHtcblx0dmFyIGVsbSA9IG5ldyBPYmplY3QoKTtcblx0ZWxtLnBvc2l0aW9uID0ge1xuXHRcdHg6IHgvKHBhbmVsLnBhbmVsYml0bWFwLmltYWdlLndpZHRoKnBhbmVsLnBhbmVsYml0bWFwLnNjYWxlWCksXG5cdFx0eTogeS8ocGFuZWwucGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0KnBhbmVsLnBhbmVsYml0bWFwLnNjYWxlWSlcblx0fTtcblx0Y29uc29sZS5sb2coZWxtLnBvc2l0aW9uKTtcblx0ZWxtLmltYWdlID0gaW1hZ2U7XG5cdC8vZGVmYXVsdCBhbGlnbm1lbnQgb3B0aW9uISBmb3Igbm93XG5cdGVsbS5idWJibGVfdHlwZSA9IFwiZG93blwiO1xuXHRlbG0udGV4dCA9IFwiXCI7XG5cblx0dmFyIHBhbmVsZWxlbWVudCA9IG5ldyBQYW5lbEVsZW1lbnQoZWxtLCBwYW5lbC5wYW5lbGJpdG1hcCk7XG5cblx0aWYgKHBhbmVsLmVsZW1lbnRzID09IHVuZGVmaW5lZCkgcGFuZWwuZWxlbWVudHMgPSBbXTtcblx0cGFuZWwuZWxlbWVudHMucHVzaChwYW5lbGVsZW1lbnQpO1xuXHRwYW5lbC5hZGRDaGlsZChwYW5lbGVsZW1lbnQpO1xuXG5cdHZhciBzb2NrZXRwb3MgPSB7XG5cdFx0eDogcGFuZWxlbGVtZW50LnggKyBwYW5lbGVsZW1lbnQud2lkdGgqcGFuZWxlbGVtZW50LnNjYWxlWCxcblx0XHR5OiBwYW5lbGVsZW1lbnQueSArIHBhbmVsZWxlbWVudC5oZWlnaHQvMipwYW5lbGVsZW1lbnQuc2NhbGVZXG5cdH07XG5cdHZhciBzb2NrID0gcGFuZWwuYWRkU29ja2V0KHNvY2tldHBvcy54LCBzb2NrZXRwb3MueSwgcGFuZWxlbGVtZW50LmdvdG8sIHBhbmVsLCAzLCBcIiNmZmZcIik7XG5cdHNvY2sub3duZXIgPSBwYW5lbGVsZW1lbnQ7XG5cdHNvY2tldHBvcyA9IHNvY2sub3duZXIubG9jYWxUb0xvY2FsKHNvY2sub3duZXIud2lkdGgsIHNvY2sub3duZXIuaGVpZ2h0LzIsIHNvY2sucGFyZW50KTtcblx0c29jay54ID0gc29ja2V0cG9zLng7XG5cdHNvY2sueSA9IHNvY2tldHBvcy55O1xufVxuXG5mdW5jdGlvbiB6b29tKHpvb21Nb2RpZmllcikge1xuXG5cdGlmICh6b29tTnVtYmVyICsgem9vbU1vZGlmaWVyIDwgMCB8fCB6b29tTnVtYmVyICsgem9vbU1vZGlmaWVyID49IHpvb21TdGVwLmxlbmd0aCkgcmV0dXJuO1xuXG5cdHZhciB6b29tc3BlZWQgPSAyMDA7XG5cblx0em9vbU51bWJlciArPSB6b29tTW9kaWZpZXI7XG5cdHZpZXdTY2FsZSA9IHpvb21TdGVwW3pvb21OdW1iZXJdO1xuXHRjb25zb2xlLmxvZyh2aWV3U2NhbGUpO1xuXG5cdGNyZWF0ZWpzLlR3ZWVuLmdldCh2aWV3Q29udGFpbmVyLCB7b3ZlcnJpZGU6IHRydWV9KVxuXHRcdC50byh7IHNjYWxlWDogdmlld1NjYWxlLCBzY2FsZVk6IHZpZXdTY2FsZSB9LCB6b29tc3BlZWQsIGNyZWF0ZWpzLkVhc2UuY3ViaWNPdXQpO1xuXG5cdC8qZm9yICh2YXIgYyA9IDA7IGMgPCB2aWV3Q29udGFpbmVyLmNoaWxkcmVuLmxlbmd0aDsgYysrKSB7XG5cdFx0dmFyIHBzID0gdmlld0NvbnRhaW5lci5jaGlsZHJlbltjXS5nZXRDaGlsZEJ5TmFtZShcInBhbmVsU29ja2V0XCIpO1xuXHRcdGNyZWF0ZWpzLlR3ZWVuLmdldChwcywge292ZXJyaWRlOiB0cnVlfSkudG8oe3NjYWxlWDogMSAvIHZpZXdTY2FsZSwgc2NhbGVZOiAxIC8gdmlld1NjYWxlfSwgem9vbXNwZWVkLCBjcmVhdGVqcy5FYXNlLmN1YmljT3V0KTtcblx0XHRzZXRUaW1lb3V0KGRyYXdDb25uZWN0aW9ucyh2aWV3Q29udGFpbmVyLmNoaWxkcmVuW2NdKSwgMjAwKTtcblx0fSovXG59XG5cbnZhciBjdXJyZW50bHlTZWxlY3RlZDtcbnZhciBjdXJyZW50VGFiID0gXCJwcm9wZXJ0aWVzXCI7XG5cbmZ1bmN0aW9uIG9wZW5UYWIodGFiKSB7XG5cblx0Ly9pZiAodGFiID09IGN1cnJlbnRUYWIpIHJldHVybjtcblx0Y3VycmVudFRhYiA9IHRhYjtcblxuXHRzd2l0Y2godGFiKSB7XG5cblx0XHRjYXNlIFwicHJvcGVydHlUYWJcIjpcblx0XHRjb25zb2xlLmxvZyhcImNvb2xcIik7XG5cdFx0aWYgKGN1cnJlbnRseVNlbGVjdGVkICE9PSB1bmRlZmluZWQpIHtcblx0XHQgXHRjdXJyZW50bHlTZWxlY3RlZC5zaG93UHJvcGVydGllcygpO1xuXHRcdH1cblx0XHRlbHNlIG5vZGVDb250YWluZXIuc2hvd1Byb3BlcnRpZXMoKTtcblx0XHRicmVhaztcblxuXHRcdGNhc2UgXCJpbWFnZXNUYWJcIjpcblx0XHRmdW5jdGlvbiBoYW5kbGVGaWxlU2VsZWN0KGV2dCkge1xuXHRcdCAgICB2YXIgZmlsZXMgPSBldnQudGFyZ2V0LmZpbGVzOyAvLyBGaWxlTGlzdCBvYmplY3Rcblx0XHQgICAgY3VycmVudExvY2FsSW1hZ2VzID0gZmlsZXM7XG5cdFx0ICAgIC8vIGZpbGVzIGlzIGEgRmlsZUxpc3Qgb2YgRmlsZSBvYmplY3RzLiBMaXN0IHNvbWUgcHJvcGVydGllcy5cblx0XHQgICAgbGlzdEZpbGVzKGZpbGVzKTtcblx0XHQgICAgLy9kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW1hZ2VsaXN0JykuaW5uZXJIVE1MID0gb3V0cHV0LmpvaW4oJycpO1xuICBcdFx0fVxuICBcdFx0ZnVuY3Rpb24gbGlzdEZpbGVzKGZpbGVhcnJheSkge1xuICBcdFx0XHRmb3IgKHZhciBpID0gMCwgZjsgZiA9IGZpbGVhcnJheVtpXTsgaSsrKSB7XG5cdFx0ICAgIFx0aWYgKCFmLnR5cGUubWF0Y2goJ2ltYWdlLionKSkge1xuXHRcdFx0ICAgIFx0Y29udGludWU7XG5cdFx0XHQgICAgfVxuXG5cdFx0XHQgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cblx0XHRcdCAgICByZWFkZXIub25sb2FkID0gKGZ1bmN0aW9uKHRoZUZpbGUpIHtcblx0XHRcdCAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGUpIHtcblx0XHRcdCAgICAgICAgICAvLyBSZW5kZXIgdGh1bWJuYWlsLlxuXHRcdFx0ICAgICAgICAgIC8vdmFyIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG5cdFx0XHQgICAgICAgICAgdmFyIGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0lNRycpO1xuXHRcdFx0ICAgICAgICAgIGltZy5zcmMgPSBlLnRhcmdldC5yZXN1bHQ7XG5cdFx0XHQgICAgICAgICAgaW1nLndpZHRoID0gMTAwO1xuXHRcdFx0ICAgICAgICAgIGltZy5kcmFnZ2FibGUgPSB0cnVlO1xuXHRcdFx0ICAgICAgICAgIGltZy5vbmRyYWdzdGFydCA9IGZ1bmN0aW9uKCkgeyBkcmFnKGV2ZW50LCBlLnRhcmdldC5yZXN1bHQpIH07XG5cblx0XHRcdCAgICAgICAgICAvKnNwYW4uaW5uZXJIVE1MID0gWyc8aW1nIHdpZHRoPVwiMTAwXCIgc3JjPVwiJywgZS50YXJnZXQucmVzdWx0LFxuXHRcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICdcIiB0aXRsZT1cIicsIGVzY2FwZSh0aGVGaWxlLm5hbWUpLCAnXCIgZHJhZ2dhYmxlPVwidHJ1ZVwiIG9uZHJhZ3N0YXJ0PVwiZHJhZyhldmVudCxcXCcnLCBlLnRhcmdldC5yZXN1bHQgLCdcXCcpXCIvPiddLmpvaW4oJycpOyovXG5cdFx0XHQgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ltYWdlbGlzdCcpLmluc2VydEJlZm9yZShpbWcsIG51bGwpO1xuXHRcdFx0ICAgICAgICB9O1xuXHRcdFx0ICAgIH0pKGYpO1xuXG5cdFx0XHQgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZik7XG5cdFx0ICAgIH1cbiAgXHRcdH1cblxuICBcdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Byb3BlcnRpZXMnKS5pbm5lckhUTUwgPSAnPGlucHV0IHR5cGU9XCJmaWxlXCIgaWQ9XCJpbWFnZWZpbGVzXCIgbmFtZT1cImZpbGVzW11cIiBtdWx0aXBsZSAvPjxvdXRwdXQgaWQ9XCJpbWFnZWxpc3RcIj48L291dHB1dD4nO1xuICBcdFx0aWYgKGN1cnJlbnRMb2NhbEltYWdlcyAhPT0gdW5kZWZpbmVkKSB7IGxpc3RGaWxlcyhjdXJyZW50TG9jYWxJbWFnZXMpIH07XG4gIFx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW1hZ2VmaWxlcycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGhhbmRsZUZpbGVTZWxlY3QsIGZhbHNlKTtcbiAgXHRcdC8qXG5cdFx0bG9hZGVyLmxvYWRBbGxJbWFnZXMoZnVuY3Rpb24ob2JqKSB7XG5cdFx0XHR2YXIgcHJvcGVydGllcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcHJvcGVydGllc1wiKTtcblx0XHRcdHByb3BlcnRpZXMuaW5uZXJIVE1MID0gXCJcIjtcblx0XHRcdGZvciAoaT0wOyBpPG9iai5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhvYmpbaV0pO1xuXHRcdFx0XHRwcm9wZXJ0aWVzLmlubmVySFRNTCArPSAnPGltZyB3aWR0aD1cIjEwMFwiIHN0eWxlPVwibWFyZ2luLWxlZnQ6MTBweDtcIiBzcmM9XCInICsgb2JqW2ldLnJlcGxhY2UoXCIuLi9cIiwgXCJcIikgKyAnXCIgZHJhZ2dhYmxlPVwidHJ1ZVwiIG9uZHJhZ3N0YXJ0PVwiZHJhZyhldmVudCwgXFwnJyArIG9ialtpXS5yZXBsYWNlKFwiLi4vXCIsIFwiXCIpICsgJ1xcJylcIiAvPic7XG5cdFx0XHR9XG5cdFx0fSk7Ki9cblx0XHRicmVhaztcblx0fVxuXG5cdHZhciB0YWJzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0YWJzXCIpO1xuXHRmb3IgKHQ9MDsgdDx0YWJzLmNoaWxkcmVuLmxlbmd0aDsgdCsrKSB7XG5cdFx0dGFicy5jaGlsZHJlblt0XS5jbGFzc05hbWUgPSAodGFicy5jaGlsZHJlblt0XS5pZCA9PSBjdXJyZW50VGFiKSA/IFwic2VsZWN0ZWRcIiA6IFwiXCI7XG5cdH1cbn1cblxuXG52YXIgc2lkZWJhckNsb3NlZCA9IGZhbHNlO1xuXG5mdW5jdGlvbiBoaWRlU2lkZWJhcigpIHtcblx0dmFyIG1pbiA9IFwiMzBweFwiO1xuXHR2YXIgbWF4ID0gXCIyODBweFwiO1xuXHRpZiAoIHNpZGViYXJDbG9zZWQgKSB7XG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzaWRlYmFyXCIpLnN0eWxlLndpZHRoID0gbWF4O1xuXHRcdHNpZGViYXJDbG9zZWQgPSBmYWxzZTtcblx0fVxuXHRlbHNlIHtcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3NpZGViYXJcIikuc3R5bGUud2lkdGggPSBtaW47XG5cdFx0c2lkZWJhckNsb3NlZCA9IHRydWU7XG5cdH1cbn1cblxuZnVuY3Rpb24gbW91c2VVcCgpIHtcblx0Y29uc29sZS5sb2coXCJNb3VzZSBVcCBvbiBIVE1MIEVsZW1lbnRcIik7XG5cdGRyYWdnaW5nX2VsZW1lbnQgPSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG1vdXNlRG93bihlbG0pIHtcblx0Y29uc29sZS5sb2coXCJNb3VzZSBEb3duIG9uIEhUTUwgRWxlbWVudFwiKTtcblx0ZHJhZ2dpbmdfZWxlbWVudCA9IGVsbTtcbn1cblxuZnVuY3Rpb24gYWxsb3dEcm9wKGV2KSB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcbn1cblxuZnVuY3Rpb24gZHJhZyhldiwgcGF0aCkge1xuICAgIGV2LmRhdGFUcmFuc2Zlci5zZXREYXRhKFwidGV4dC9wbGFpblwiLCBwYXRoKTtcbn1cblxuZnVuY3Rpb24gZHJvcChldikge1xuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKGV2LnRhcmdldCA9PSBzdGFnZS5jYW52YXMpIHtcbiAgICBcdC8vY29uc29sZS5sb2coXCJEcm9wcGVkIG9uIFNUQUdFISBDb29sIVwiLCBldi5jbGllbnRYLCBldi5jbGllbnRZKTtcbiAgICBcdHZhciBsb2NhbCA9IG5vZGVDb250YWluZXIuZ2xvYmFsVG9Mb2NhbChldi5jbGllbnRYLCBldi5jbGllbnRZKTtcbiAgICBcdC8vY29uc29sZS5sb2coZXYuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJ0ZXh0L3BsYWluXCIpKTtcbiAgICBcdHZhciBwbmwgPSBub2RlQ29udGFpbmVyLmdldE9iamVjdFVuZGVyUG9pbnQobG9jYWwueCwgbG9jYWwueSk7XG4gICAgXHRpZiAocG5sICE9PSBudWxsICYmIHBubCBpbnN0YW5jZW9mIGNyZWF0ZWpzLkJpdG1hcCkgcG5sID0gcG5sLnBhcmVudDtcbiAgICBcdC8vY29uc29sZS5sb2cocG5sKTtcbiAgICBcdGlmIChwbmwgaW5zdGFuY2VvZiBQYW5lbCkge1xuICAgIFx0XHR2YXIgcG9zID0gcG5sLmdsb2JhbFRvTG9jYWwoZXYuY2xpZW50WCwgZXYuY2xpZW50WSk7XG4gICAgXHRcdGNvbnNvbGUubG9nKHBvcyk7XG4gICAgXHRcdG5ld1BhbmVsRWxlbWVudChwb3MueCwgcG9zLnksIHBubCwgZXYuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJ0ZXh0L3BsYWluXCIpKTtcbiAgICBcdH1cbiAgICBcdGVsc2UgbmV3UGFuZWwobG9jYWwueCwgbG9jYWwueSwgZXYuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJ0ZXh0L3BsYWluXCIpKTtcbiAgICB9XG4gICAgLy92YXIgZGF0YSA9IGV2LmRhdGFUcmFuc2Zlci5nZXREYXRhKFwidGV4dFwiKTtcbiAgICAvL2V2LnRhcmdldC5hcHBlbmRDaGlsZChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkYXRhKSk7XG59XG5cblxuLyoqXG4qIFxuKlxuKlx0RWFzZWxqcyBjbGFzcyBkZWZpbml0aW9uc1xuKlxuKlxuKiovXG5cbihmdW5jdGlvbigpIHtcblxuXHQvLyAtLS0tLS0tLS0tLS0gLy9cblx0Ly8gIE5PREUgY2xhc3MgIC8vXG5cdC8vIC0tLS0tLS0tLS0tLSAvL1xuXG5cdC8vdmFyIGVkaXRvciA9IHJlcXVpcmUoJy4vZWRpdG9yLmpzJyk7XG5cblx0ZnVuY3Rpb24gTm9kZSgpIHtcblx0XHR0aGlzLkNvbnRhaW5lcl9jb25zdHJ1Y3RvcigpO1xuXHRcdHRoaXMuc29ja2V0cyA9IFtdO1xuXHR9XG5cdGNyZWF0ZWpzLmV4dGVuZChOb2RlLCBjcmVhdGVqcy5Db250YWluZXIpO1xuXG5cdE5vZGUucHJvdG90eXBlLmhhbmRsZU1vdXNlRG93biA9IGZ1bmN0aW9uKGV2dCkge1xuXHRcdGRyYWdvZmZzZXQgPSB7XG5cdFx0XHR4OiBldnQuc3RhZ2VYL3ZpZXdTY2FsZSAtIGV2dC50YXJnZXQucGFyZW50LngsXG5cdFx0XHR5OiBldnQuc3RhZ2VZL3ZpZXdTY2FsZSAtIGV2dC50YXJnZXQucGFyZW50Lnlcblx0XHR9O1xuXG5cdFx0Ly9ldnQudGFyZ2V0LmRyYWdvZmZzZXQueSA9IGV2dC5zdGFnZVkvdmlld1NjYWxlIC0gZXZ0LnRhcmdldC5wYXJlbnQueTtcblx0XHRpZiAoY3VycmVudGx5U2VsZWN0ZWQgIT09IHVuZGVmaW5lZCAmJiBjdXJyZW50bHlTZWxlY3RlZC5zZWxlY3RlZCAhPT0gdW5kZWZpbmVkKSBjdXJyZW50bHlTZWxlY3RlZC5zZWxlY3RlZC5ncmFwaGljcy5jbGVhcigpO1xuXHRcdGN1cnJlbnRseVNlbGVjdGVkID0gZXZ0LnRhcmdldC5wYXJlbnQ7XG5cdFx0b3BlblRhYihcInByb3BlcnR5VGFiXCIpO1xuXHR9O1xuXG5cdE5vZGUucHJvdG90eXBlLmhhbmRsZU1vdXNlTW92ZSA9IGZ1bmN0aW9uKGV2dCkge1xuXHRcdC8vY29uc29sZS5sb2coZXZ0LnRhcmdldCk7XG5cdFx0ZXZ0LnRhcmdldC5wYXJlbnQueCA9IGV2dC5zdGFnZVgvdmlld1NjYWxlIC0gZHJhZ29mZnNldC54O1xuXHRcdGV2dC50YXJnZXQucGFyZW50LnkgPSBldnQuc3RhZ2VZL3ZpZXdTY2FsZSAtIGRyYWdvZmZzZXQueTtcblxuXHRcdGV2dC50YXJnZXQucGFyZW50LnggPSBNYXRoLnJvdW5kKGV2dC50YXJnZXQucGFyZW50LngqMC4xKSoxMDtcblx0XHRldnQudGFyZ2V0LnBhcmVudC55ID0gTWF0aC5yb3VuZChldnQudGFyZ2V0LnBhcmVudC55KjAuMSkqMTA7XG5cblx0XHQvL2NvbnNvbGUubG9nKGV2dC50YXJnZXQucGFyZW50KTtcblx0XHQvL2RyYXdDb25uZWN0aW9ucyhldnQudGFyZ2V0LnBhcmVudCk7XG5cdFx0ZHJhd0FsbENvbm5lY3Rpb25zKCk7XG5cdH07XG5cblx0Tm9kZS5wcm90b3R5cGUuZHJhd0Nvbm5lY3Rpb25zID0gZnVuY3Rpb24oKSB7XG5cdFx0Zm9yIChzPTA7IHMgPCB0aGlzLnNvY2tldHMubGVuZ3RoOyBzKyspIHtcblx0XHRcdHZhciBzb2NrZXQgPSB0aGlzLnNvY2tldHNbc107XG5cdFx0XHRzb2NrZXQubGluZS5ncmFwaGljcy5jbGVhcigpO1xuXHRcdFx0aWYgKHNvY2tldC5vd25lciBpbnN0YW5jZW9mIFBhbmVsRWxlbWVudCkge1xuXHRcdFx0XHR2YXIgc29ja2V0cG9zID0gc29ja2V0Lm93bmVyLmxvY2FsVG9Mb2NhbChzb2NrZXQub3duZXIud2lkdGgsIHNvY2tldC5vd25lci5oZWlnaHQvMiwgc29ja2V0LnBhcmVudCk7XG5cdFx0XHRcdHNvY2tldC54ID0gc29ja2V0cG9zLng7XG5cdFx0XHRcdHNvY2tldC55ID0gc29ja2V0cG9zLnk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoc29ja2V0Lm93bmVyLmdvdG8gIT09IHVuZGVmaW5lZCAmJiB0aGlzLnBhcmVudC5jb250YWlucyhzb2NrZXQub3duZXIuZ290bykpIHtcblx0XHRcdFx0dmFyIGdvdG8gPSBzb2NrZXQub3duZXIuZ290bztcblx0XHRcdFx0dmFyIGxvY2FsID0gdGhpcy5wYXJlbnQubG9jYWxUb0xvY2FsKGdvdG8ueCwgZ290by55K2dvdG8uaGVpZ2h0LzIsIHNvY2tldCk7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAoc29ja2V0Lm93bmVyIGluc3RhbmNlb2YgUGFuZWxFbGVtZW50KSBzb2NrZXQubGluZS5ncmFwaGljcy5zKHNvY2tldC5jb2xvcikuc3Moc29ja2V0LnN0cm9rZXdpZHRoKS5zZChbMTAsNV0pLm10KDArc29ja2V0LnJhZGl1cywgMCkubHQobG9jYWwueCwgbG9jYWwueSApO1xuXHRcdFx0XHRlbHNlIHNvY2tldC5saW5lLmdyYXBoaWNzLnMoc29ja2V0LmNvbG9yKS5zcyhzb2NrZXQuc3Ryb2tld2lkdGgpLm10KDArc29ja2V0LnJhZGl1cywgMCkubHQobG9jYWwueCwgbG9jYWwueSApO1xuXHRcdFx0XHRzb2NrZXQuYWxwaGEgPSAxO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBzb2NrZXQuYWxwaGEgPSAwLjU7XG5cdFx0fVxuXHR9O1xuXG5cdE5vZGUucHJvdG90eXBlLmRyYWdMaW5lID0gZnVuY3Rpb24oZXZ0KSB7XG5cdFx0dmFyIHNvY2sgPSBldnQudGFyZ2V0LnBhcmVudDtcblx0XHR2YXIgbGluZSA9IHNvY2subGluZTtcblx0XHRsaW5lLmdyYXBoaWNzLmNsZWFyKCk7XG5cdFx0dmFyIGxvY2FsID0gbGluZS5nbG9iYWxUb0xvY2FsKGV2dC5zdGFnZVgsIGV2dC5zdGFnZVkpO1xuXHRcdGxpbmUuZ3JhcGhpY3Mucyhzb2NrLmNvbG9yKS5zcyhzb2NrLnN0cm9rZXdpZHRoKS5tdCgwK2Nvbl9yLCAwKS5sdChsb2NhbC54LGxvY2FsLnkpO1xuXHR9O1xuXG5cdE5vZGUucHJvdG90eXBlLnJlbGVhc2VMaW5lID0gZnVuY3Rpb24oZXZ0KSB7XG5cdFx0ZXZ0LnRhcmdldC5wYXJlbnQuZ290byA9IHVuZGVmaW5lZDtcblx0XHRldnQudGFyZ2V0LnBhcmVudC5vd25lci5nb3RvID0gdW5kZWZpbmVkO1xuXHRcdGV2dC50YXJnZXQucGFyZW50LmxpbmUuZ3JhcGhpY3MuY2xlYXIoKTtcblx0XHR2YXIgdGFyZyA9IHN0YWdlLmdldE9iamVjdFVuZGVyUG9pbnQoZXZ0LnN0YWdlWCwgZXZ0LnN0YWdlWSk7XG5cdFx0aWYgKHRhcmcucGFyZW50IGluc3RhbmNlb2YgTm9kZSkge1xuXHRcdFx0ZXZ0LnRhcmdldC5wYXJlbnQuZ290byA9IHRhcmcucGFyZW50O1xuXHRcdFx0ZXZ0LnRhcmdldC5wYXJlbnQub3duZXIuZ290byA9IHRhcmcucGFyZW50O1xuXHRcdH1cblx0XHRldnQudGFyZ2V0LnBhcmVudC5wYXJlbnQuZHJhd0Nvbm5lY3Rpb25zKCk7XG5cdH07XG5cblx0Tm9kZS5wcm90b3R5cGUuYWRkU29ja2V0ID0gZnVuY3Rpb24oeCwgeSwgZ290bywgYWRkVG8sIHJhZGl1cywgY29sb3IpIHtcblx0XHR2YXIgc29ja2V0ID0gbmV3IGNyZWF0ZWpzLkNvbnRhaW5lcigpO1xuXHRcdHNvY2tldC5zaGFwZSA9IG5ldyBjcmVhdGVqcy5TaGFwZSgpO1xuXHRcdHNvY2tldC5saW5lID0gbmV3IGNyZWF0ZWpzLlNoYXBlKCk7XG5cdFx0c29ja2V0LnJhZGl1cyA9IHJhZGl1cztcblxuXHRcdHNvY2tldC54ID0geDtcblx0XHRzb2NrZXQueSA9IHk7XG5cblx0XHRpZiAoY29sb3IgIT09IHVuZGVmaW5lZCkgc29ja2V0LmNvbG9yID0gY29sb3I7XG5cdFx0ZWxzZSBzb2NrZXQuY29sb3IgPSBcIiMwMDBcIjtcblxuXHRcdGlmIChjb2xvciA9PSBcIiNmZmZcIikgdGhpcy5iZ19jb2xvciA9IFwiIzAwMFwiO1xuXHRcdGVsc2UgdGhpcy5iZ19jb2xvciA9IFwiI2ZmZlwiO1xuXG5cdFx0dmFyIHIgPSBzb2NrZXQucmFkaXVzO1xuXHRcdHNvY2tldC5zaGFwZS5yZWdZID0gcjtcblx0XHRzb2NrZXQuc2hhcGUucmVnWCA9IDA7XG5cblx0XHRzb2NrZXQuc2hhcGUuZ3JhcGhpY3MuZih0aGlzLmJnX2NvbG9yKS5kYyhyLHIscikuZihzb2NrZXQuY29sb3IpLmRjKHIscixyLXIvMyk7XG5cdFx0Ly9zb2NrZXQuc2hhcGUuc2NhbGVYID0gMTtcblx0XHQvL3NvY2tldC5zaGFwZS5zY2FsZVkgPSAxO1xuXG5cdFx0c29ja2V0LnN0cm9rZXdpZHRoID0gc29ja2V0LnJhZGl1cy8yO1xuXHRcdHNvY2tldC5jdXJzb3IgPSBcInBvaW50ZXJcIjtcblxuXHRcdHNvY2tldC5nb3RvID0gZ290bztcblxuXHRcdHNvY2tldC5hZGRDaGlsZChzb2NrZXQuc2hhcGUsIHNvY2tldC5saW5lKTtcblxuXHRcdHNvY2tldC5vbihcInByZXNzbW92ZVwiLCB0aGlzLmRyYWdMaW5lKTtcblx0XHRzb2NrZXQub24oXCJwcmVzc3VwXCIsIHRoaXMucmVsZWFzZUxpbmUpO1xuXG5cdFx0dGhpcy5zb2NrZXRzLnB1c2goc29ja2V0KTtcblx0XHRpZiAoYWRkVG8gPT09IHVuZGVmaW5lZCkgdGhpcy5hZGRDaGlsZChzb2NrZXQpO1xuXHRcdGVsc2UgYWRkVG8uYWRkQ2hpbGQoc29ja2V0KTtcblxuXHRcdHJldHVybiBzb2NrZXQ7XG5cdH07XG5cblx0d2luZG93Lk5vZGUgPSBjcmVhdGVqcy5wcm9tb3RlKE5vZGUsIFwiQ29udGFpbmVyXCIpO1xuXG5cdC8vXG5cdC8vIFBBTkVMIGNsYXNzXG5cdC8vXG5cblx0ZnVuY3Rpb24gUGFuZWwob2JqKSB7XG5cdFx0dGhpcy5Ob2RlX2NvbnN0cnVjdG9yKCk7XG5cdFx0Ly90aGlzLnNvY2tldHMgPSBbXTtcblx0XHR0aGlzLnNldHVwKG9iaik7XG5cdH1cblx0Y3JlYXRlanMuZXh0ZW5kKFBhbmVsLCBOb2RlKTtcblxuXHRQYW5lbC5wcm90b3R5cGUuc2V0dXAgPSBmdW5jdGlvbihvYmopIHtcblx0XHR0aGlzLm5hbWUgPSBvYmoubmFtZTtcblx0XHRpZiAob2JqLmVkaXRvciAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR0aGlzLnggPSBvYmouZWRpdG9yLnBvc2l0aW9uLng7XG5cdFx0XHR0aGlzLnkgPSBvYmouZWRpdG9yLnBvc2l0aW9uLnk7XG5cdFx0fVxuXHRcdHRoaXMuc2VsZWN0ZWQgPSBuZXcgY3JlYXRlanMuU2hhcGUoKTtcblx0XHR0aGlzLmFkZENoaWxkKHRoaXMuc2VsZWN0ZWQpO1xuXG5cdFx0aWYgKG9iai5pbWFnZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR0aGlzLnBhbmVsYml0bWFwID0gbmV3IGNyZWF0ZWpzLkJpdG1hcChvYmouaW1hZ2UpO1xuICAgICAgICAgICAgdGhpcy5pbWFnZSA9IG9iai5pbWFnZTtcblx0XHRcdHZhciBzY2FsZSA9IDAuMjU7XG5cdFx0XHQvL2lmIChwYW5lbHNbaV0uc2l6ZSA9PSA0KSBzY2FsZSA9IDAuMzU7XG4gICAgICAgICAgICBpZiAob2JqLnNpemUgPT09IHVuZGVmaW5lZCkgdGhpcy5zaXplID0gMTtcbiAgICAgICAgICAgIGVsc2UgdGhpcy5zaXplID0gb2JqLnNpemU7XG5cdFx0XHRzY2FsZSA9IHRoaXMuc2l6ZSo0MDAqc2NhbGUgLyB0aGlzLnBhbmVsYml0bWFwLmltYWdlLndpZHRoO1xuXHRcdFx0dGhpcy5wYW5lbGJpdG1hcC5zY2FsZVggPSBzY2FsZTtcblx0XHRcdHRoaXMucGFuZWxiaXRtYXAuc2NhbGVZID0gc2NhbGU7XG5cdFx0XHR0aGlzLndpZHRoID0gdGhpcy5wYW5lbGJpdG1hcC5pbWFnZS53aWR0aCp0aGlzLnBhbmVsYml0bWFwLnNjYWxlWDtcblx0XHRcdHRoaXMuaGVpZ2h0ID0gdGhpcy5wYW5lbGJpdG1hcC5pbWFnZS5oZWlnaHQqdGhpcy5wYW5lbGJpdG1hcC5zY2FsZVk7XG5cdFx0XHQvL3RoaXMucGFuZWxiaXRtYXAub24oXCJtb3VzZWRvd25cIiwgaGFuZGxlTW91c2VEb3duKTtcblx0XHRcdC8vdGhpcy5wYW5lbGJpdG1hcC5vbihcInByZXNzbW92ZVwiLCBoYW5kbGVNb3VzZU1vdmUpO1xuXHRcdFx0Ly90aGlzLnBhbmVsYml0bWFwLm9uKFwicHJlc3N1cFwiLCBoYW5kbGVNb3VzZVVwKTtcblx0XHRcdHRoaXMucGFuZWxiaXRtYXAuY3Vyc29yID0gXCJtb3ZlXCI7XG5cdFx0XHR0aGlzLmFkZENoaWxkKHRoaXMucGFuZWxiaXRtYXApO1xuXHRcdFx0dGhpcy5wYW5lbGJpdG1hcC5vbihcIm1vdXNlZG93blwiLCB0aGlzLmhhbmRsZU1vdXNlRG93bik7XG5cdFx0XHR0aGlzLnBhbmVsYml0bWFwLm9uKFwicHJlc3Ntb3ZlXCIsIHRoaXMuaGFuZGxlTW91c2VNb3ZlKTtcblx0XHRcdHRoaXMucGFuZWxiaXRtYXAuc2hhZG93ID0gbmV3IGNyZWF0ZWpzLlNoYWRvdyhcInJnYmEoMCwwLDAsMC4yKVwiLCAzLCAzLCA0KTtcblx0XHRcdC8vdGhpcy5wYW5lbGJpdG1hcC5vbihcImNsaWNrXCIsIHRoaXMuc2hvd1Byb3BlcnRpZXMpO1xuXHRcdH1cbiAgICAgICAgXG5cdFx0dmFyIHNvY2tldHBvcyA9IHtcblx0XHRcdHg6IHRoaXMucGFuZWxiaXRtYXAuc2NhbGVYKnRoaXMucGFuZWxiaXRtYXAuaW1hZ2Uud2lkdGgsXG5cdFx0XHR5OiB0aGlzLnBhbmVsYml0bWFwLnNjYWxlWSp0aGlzLnBhbmVsYml0bWFwLmltYWdlLmhlaWdodC8yXG5cdFx0fTtcblxuXHRcdHZhciBzb2NrID0gdGhpcy5hZGRTb2NrZXQoc29ja2V0cG9zLngsc29ja2V0cG9zLnksb2JqLmdvdG8sIHRoaXMsIDYpO1xuXHRcdHNvY2sub3duZXIgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgaWYgKG9iai5nb3RvICE9IC0xKSB0aGlzLmdvdG8gPSBvYmouZ290bztcblxuXHRcdC8vdGhpcy5lbGVtZW50cyA9IFtdO1xuXG5cdFx0aWYgKG9iai5lbGVtZW50cyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRmb3IgKGU9MDsgZSA8IG9iai5lbGVtZW50cy5sZW5ndGg7IGUrKykge1xuXHRcdFx0XHR2YXIgZWxlbWVudCA9IG5ldyBQYW5lbEVsZW1lbnQob2JqLmVsZW1lbnRzW2VdLCB0aGlzLnBhbmVsYml0bWFwKTtcblxuXHRcdFx0XHQvL3RoaXMuZWxlbWVudHMucHVzaChlbGVtZW50KTtcblx0XHRcdFx0dGhpcy5hZGRDaGlsZChlbGVtZW50KTtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhlbGVtZW50LmNoaWxkcmVuLmxlbmd0aCk7XG5cdFx0XHRcdHNvY2tldHBvcyA9IHtcblx0XHRcdFx0XHR4OiBlbGVtZW50LnggKyBlbGVtZW50LndpZHRoKmVsZW1lbnQuc2NhbGVYLFxuXHRcdFx0XHRcdHk6IGVsZW1lbnQueSArIGVsZW1lbnQuaGVpZ2h0LzIqZWxlbWVudC5zY2FsZVlcblx0XHRcdFx0fTtcblx0XHRcdFx0c29jayA9IHRoaXMuYWRkU29ja2V0KHNvY2tldHBvcy54LCBzb2NrZXRwb3MueSwgZWxlbWVudC5nb3RvLCB0aGlzLCAzLCBcIiNmZmZcIik7XG5cdFx0XHRcdHNvY2sub3duZXIgPSBlbGVtZW50O1xuXHRcdFx0XHRzb2NrLmRhc2hlcyA9IFsxMCw1XTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRcblx0fTtcblxuXHRQYW5lbC5wcm90b3R5cGUuc2hvd1Byb3BlcnRpZXMgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgbm9kZSA9IHRoaXM7XG5cdFx0Ly9pZiAoY3VycmVudGx5U2VsZWN0ZWQgPT0gdGhpcykgcmV0dXJuO1xuXHRcdC8vY3VycmVudGx5U2VsZWN0ZWQgPSB0aGlzO1xuXG5cdFx0Ly9jb25zb2xlLmxvZyhcIlNob3dpbmcgcHJvcGVydGllcyBmb3Igbm9kZSBcIiArIG5vZGUubmFtZSApO1xuXHRcdHZhciB0aGlja25lc3MgPSAzO1xuXHRcdHRoaXMuc2VsZWN0ZWQuZ3JhcGhpY3MuZihcIiMwMDk5ZWVcIikuZHIoLXRoaWNrbmVzcywtdGhpY2tuZXNzLHRoaXMucGFuZWxiaXRtYXAuaW1hZ2Uud2lkdGgqdGhpcy5wYW5lbGJpdG1hcC5zY2FsZVgrdGhpY2tuZXNzKjIsIHRoaXMucGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0KnRoaXMucGFuZWxiaXRtYXAuc2NhbGVZK3RoaWNrbmVzcyoyKTtcblx0XHR2YXIgcHJvcGVydHlfcGFuZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnRpZXNcIik7XG5cblx0XHR2YXIgcHJvcGVydHlfaGVhZGVyID0gXHQnPGRpdiBpZD1cIm9iamVjdC1uYW1lXCI+JyArXG5cdFx0XHRcdFx0XHRcdFx0XHQnPHA+JyArIG5vZGUubmFtZSArICc8c3BhbiBjbGFzcz1cImVsZW1lbnQtaWRcIj4jJyArIG5vZGVDb250YWluZXIuZ2V0Q2hpbGRJbmRleChub2RlKSArICc8L3NwYW4+PC9wPicgK1xuXHRcdFx0XHRcdFx0XHRcdCc8L2Rpdj4nO1xuXHRcdHByb3BlcnR5X3BhbmVsLmlubmVySFRNTCA9IHByb3BlcnR5X2hlYWRlcjtcblxuXHRcdHZhciBub2RlX25hbWUgPSAnPGRpdiBjbGFzcz1cImZpZWxkIGxhYmVsc2lkZVwiPjxwPk5hbWU6PC9wPjxpbnB1dCB0eXBlPVwidGV4dFwiIHZhbHVlPVwiJyArIG5vZGUubmFtZSArICdcIiBpZD1cInByb3BlcnR5LW5hbWVcIj48L2Rpdj4nO1xuXHRcdHByb3BlcnR5X3BhbmVsLmlubmVySFRNTCArPSBub2RlX25hbWU7XG5cblx0XHRpZiAobm9kZSBpbnN0YW5jZW9mIFBhbmVsKSB7XG5cblx0XHRcdHZhciBwYW5lbF9pbWFnZSA9ICc8ZGl2IGNsYXNzPVwiZmllbGQgbGFiZWx0b3BcIj48cD5JbWFnZSBVUkw6PC9wPjxpbnB1dCB0eXBlPVwidGV4dFwiIHZhbHVlPVwiJyArIG5vZGUuaW1hZ2UgKyAnXCIgaWQ9XCJwcm9wZXJ0eS1pbWFnZXBhdGhcIj48L2Rpdj4nO1xuXHRcdFx0cHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MICs9IHBhbmVsX2ltYWdlO1xuXG5cdFx0XHR2YXIgcGFuZWxfc2l6ZSA9ICc8ZGl2IGNsYXNzPVwiZmllbGQgbGFiZWxzaWRlXCI+PHA+U2l6ZTo8L3A+PHVsIGlkPVwicHJvcGVydHktc2l6ZVwiIGNsYXNzPVwiYnV0dG9ucyBub3NlbGVjdFwiPic7XG5cdFx0XHRcblx0XHRcdC8vcGFuZWxfc2l6ZSArPSAnPC91bD48L2Rpdj4nO1xuXHRcdFx0XG5cblx0XHRcdC8vdmFyIHByb3BzaXplID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNwcm9wZXJ0eS1zaXplXCIpO1xuXHRcdFx0Zm9yIChzPTE7IHMgPD0gNDsgcysrKSB7XG5cdFx0XHRcdC8vdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuXHRcdFx0XHQvL2lmIChub2RlLnNpemUgPT0gcykgbGkuY2xhc3NOYW1lID0gXCJzZWxlY3RlZFwiO1xuXHRcdFx0XHQvL2xpLmlubmVySFRNTCA9IHMudG9TdHJpbmcoKTtcblx0XHRcdFx0LypsaS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coXCJzZXQgdG8gc2l6ZSBcIiArIHMpO1xuXHRcdFx0XHRcdG5vZGUuc2l6ZSA9IHM7XG5cdFx0XHRcdFx0dGhpcy5jbGFzc05hbWUgPSBcInNlbGVjdGVkXCI7XG5cdFx0XHRcdH07Ki9cblx0XHRcdFx0Ly9wcm9wc2l6ZS5hcHBlbmRDaGlsZChsaSk7XG5cdFx0XHRcdHZhciBzZWxlY3RlZCA9IChzID09IG5vZGUuc2l6ZSkgPyAnY2xhc3M9XCJzZWxlY3RlZFwiJyA6ICcnO1xuXHRcdFx0XHRwYW5lbF9zaXplICs9ICc8bGkgJyArIHNlbGVjdGVkICsgJyBvbmNsaWNrPVwiY3VycmVudGx5U2VsZWN0ZWQuY2hhbmdlU2l6ZSgnICsgcy50b1N0cmluZygpICsgJylcIj4nICsgcy50b1N0cmluZygpICsgJzwvbGk+Jztcblx0XHRcdH1cblx0XHRcdHBhbmVsX3NpemUgKz0gJzwvdWw+PC9kaXY+Jztcblx0XHRcdHByb3BlcnR5X3BhbmVsLmlubmVySFRNTCArPSBwYW5lbF9zaXplO1xuXG5cdFx0XHR2YXIgZGVsZXRlX2J1dHRvbiA9ICc8ZGl2IGNsYXNzPVwiZmllbGRcIj48aW5wdXQgaWQ9XCJkZWxldGVcIiBjbGFzcz1cImJ1dHRvbiBkZWxldGUtYnV0dG9uXCIgdHlwZT1cInN1Ym1pdFwiIHZhbHVlPVwiRGVsZXRlIFBhbmVsXCI+PC9kaXY+Jztcblx0XHRcdHByb3BlcnR5X3BhbmVsLmlubmVySFRNTCArPSBkZWxldGVfYnV0dG9uO1xuXHRcdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNkZWxldGVcIikub25jbGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcImxvbFwiKTtcblx0XHRcdFx0bm9kZUNvbnRhaW5lci5yZW1vdmVDaGlsZChjdXJyZW50bHlTZWxlY3RlZCk7XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgcHJvcG5hbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnR5LW5hbWVcIik7XG5cdFx0XHRwcm9wbmFtZS5vbmNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRub2RlLm5hbWUgPSBwcm9wbmFtZS52YWx1ZTtcblx0XHRcdFx0dmFyIHByb3BoZWFkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNvYmplY3QtbmFtZVwiKTtcblx0XHRcdFx0cHJvcGhlYWQuaW5uZXJIVE1MID0gJzxkaXYgaWQ9XCJvYmplY3QtbmFtZVwiPicgK1xuXHRcdFx0XHRcdFx0XHRcdFx0JzxwPicgKyBub2RlLm5hbWUgKyAnPHNwYW4gY2xhc3M9XCJlbGVtZW50LWlkXCI+IycgKyBub2RlQ29udGFpbmVyLmdldENoaWxkSW5kZXgobm9kZSkgKyAnPC9zcGFuPjwvcD4nICtcblx0XHRcdFx0XHRcdFx0XHQnPC9kaXY+Jztcblx0XHRcdH1cblxuXHRcdFx0cHJvcG5hbWUub25rZXl1cCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKHByb3B0ZXh0LnZhbHVlKTtcblx0XHRcdFx0bm9kZS5uYW1lID0gcHJvcG5hbWUudmFsdWU7XG5cdFx0XHRcdHZhciBwcm9waGVhZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjb2JqZWN0LW5hbWVcIik7XG5cdFx0XHRcdHByb3BoZWFkLmlubmVySFRNTCA9ICc8ZGl2IGlkPVwib2JqZWN0LW5hbWVcIj4nICtcblx0XHRcdFx0XHRcdFx0XHRcdCc8cD4nICsgbm9kZS5uYW1lICsgJzxzcGFuIGNsYXNzPVwiZWxlbWVudC1pZFwiPiMnICsgbm9kZUNvbnRhaW5lci5nZXRDaGlsZEluZGV4KG5vZGUpICsgJzwvc3Bhbj48L3A+JyArXG5cdFx0XHRcdFx0XHRcdFx0JzwvZGl2Pic7XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgcHJvcGltYWdlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNwcm9wZXJ0eS1pbWFnZXBhdGhcIik7XG5cdFx0XHRwcm9waW1hZ2Uub25jaGFuZ2UgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0Ly9ub2RlLmltYWdlID0gcHJvcGltYWdlLnZhbHVlO1xuXHRcdFx0XHR2YXIgaW1nID0gbmV3IEltYWdlKCk7XG5cdFx0XHRcdGltZy5zcmMgPSBwcm9waW1hZ2UudmFsdWU7XG5cdFx0XHRcdGltZy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRub2RlLmltYWdlID0gcHJvcGltYWdlLnZhbHVlO1xuXHRcdFx0XHRcdG5vZGUucGFuZWxiaXRtYXAuaW1hZ2UgPSBpbWc7XG5cdFx0XHRcdFx0bm9kZS5zZWxlY3RlZC5ncmFwaGljcy5jbGVhcigpO1xuXHRcdFx0XHRcdHZhciB0aGlja25lc3MgPSAzO1xuXHRcdFx0XHRcdG5vZGUuc2VsZWN0ZWQuZ3JhcGhpY3MuZihcIiMwMDk5ZWVcIikuZHIoLXRoaWNrbmVzcywtdGhpY2tuZXNzLG5vZGUucGFuZWxiaXRtYXAuaW1hZ2Uud2lkdGgqbm9kZS5wYW5lbGJpdG1hcC5zY2FsZVgrdGhpY2tuZXNzKjIsIG5vZGUucGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0Km5vZGUucGFuZWxiaXRtYXAuc2NhbGVZK3RoaWNrbmVzcyoyKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpbWcub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHZhciBkaWFsb2cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2RpYWxvZ1wiKTtcblx0XHRcdFx0XHRkaWFsb2cuaW5uZXJIVE1MID0gXCI8cD4nXCIgKyBwcm9waW1hZ2UudmFsdWUgKyBcIicgY291bGQgbm90IGJlIGxvYWRlZDxwPlwiO1xuXHRcdFx0XHRcdC8vZGlhbG9nLnN0eWxlLnRvcCA9IFwiNTAlXCI7XG5cdFx0XHRcdFx0Ly9kaWFsb2cuc3R5bGUubGVmdCA9IFwiNTAlXCI7XG5cdFx0XHRcdFx0ZGlhbG9nLnN0eWxlLm9wYWNpdHkgPSBcIjAuOFwiO1xuXHRcdFx0XHRcdGRpYWxvZy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcIiM1MjJcIjtcblx0XHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0ZGlhbG9nLnN0eWxlLm9wYWNpdHkgPSBcIjBcIjtcblx0XHRcdFx0XHR9LCAyMDAwKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cdFx0XG5cdH07XG5cblx0UGFuZWwucHJvdG90eXBlLnJlbW92ZUNoaWxkID0gZnVuY3Rpb24oY2hpbGQpIHtcblx0XHR2YXIgdmlldyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdmlld1wiKTtcblx0XHR2YXIgZWxtID0gY2hpbGQuY2hpbGRyZW5bMV0uaHRtbEVsZW1lbnQ7XG5cdFx0Y29uc29sZS5sb2coZWxtKTtcblx0XHR2aWV3LnJlbW92ZUNoaWxkKGVsbSk7XG5cdFx0dGhpcy5Ob2RlX3JlbW92ZUNoaWxkKGNoaWxkKTtcblx0XHRkcmF3QWxsQ29ubmVjdGlvbnMoKTtcblx0fVxuXG5cdFBhbmVsLnByb3RvdHlwZS5jaGFuZ2VTaXplID0gZnVuY3Rpb24oc2l6ZSkge1xuXHRcdHRoaXMuc2l6ZSA9IHNpemU7XG5cdFx0dmFyIHNjYWxlID0gMC4yNTtcblx0XHRzY2FsZSA9IHRoaXMuc2l6ZSo0MDAqc2NhbGUgLyB0aGlzLnBhbmVsYml0bWFwLmltYWdlLndpZHRoO1xuXHRcdHRoaXMucGFuZWxiaXRtYXAuc2NhbGVYID0gc2NhbGU7XG5cdFx0dGhpcy5wYW5lbGJpdG1hcC5zY2FsZVkgPSBzY2FsZTtcblx0XHR2YXIgcHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnR5LXNpemVcIik7XG5cdFx0Zm9yIChzPTA7IHMgPCBwcy5jaGlsZHJlbi5sZW5ndGg7IHMrKykge1xuXHRcdFx0cHMuY2hpbGRyZW5bc10uY2xhc3NOYW1lID0gKHMrMSA9PSB0aGlzLnNpemUpID8gXCJzZWxlY3RlZFwiIDogXCJcIjtcblx0XHR9XG5cdFx0dGhpcy5zZWxlY3RlZC5ncmFwaGljcy5jbGVhcigpO1xuXHRcdHZhciB0aGlja25lc3MgPSAzO1xuXHRcdHRoaXMuc2VsZWN0ZWQuZ3JhcGhpY3MuZihcIiMwMDk5ZWVcIikuZHIoLXRoaWNrbmVzcywtdGhpY2tuZXNzLHRoaXMucGFuZWxiaXRtYXAuaW1hZ2Uud2lkdGgqdGhpcy5wYW5lbGJpdG1hcC5zY2FsZVgrdGhpY2tuZXNzKjIsIHRoaXMucGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0KnRoaXMucGFuZWxiaXRtYXAuc2NhbGVZK3RoaWNrbmVzcyoyKTtcblx0fTtcblxuXHR3aW5kb3cuUGFuZWwgPSBjcmVhdGVqcy5wcm9tb3RlKFBhbmVsLCBcIk5vZGVcIik7XG5cblx0Ly8gLS0tLS0tLS0tLS0tIC8vXG5cdC8vIFBhbmVsRWxlbWVudCAvL1xuXHQvLyAtLS0tLS0tLS0tLS0gLy9cblxuXHRmdW5jdGlvbiBQYW5lbEVsZW1lbnQob2JqLCBiaXRtYXApIHtcblx0XHR0aGlzLkNvbnRhaW5lcl9jb25zdHJ1Y3RvcigpO1xuXHRcdHRoaXMucGFuZWxiaXRtYXAgPSBiaXRtYXA7XG5cdFx0dGhpcy5zZXR1cChvYmopO1xuXHR9IGNyZWF0ZWpzLmV4dGVuZChQYW5lbEVsZW1lbnQsIGNyZWF0ZWpzLkNvbnRhaW5lcik7XG5cblx0UGFuZWxFbGVtZW50LnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uKG9iaikge1xuXHRcdGlmIChvYmouZ290byAhPSAtMSkgdGhpcy5nb3RvID0gb2JqLmdvdG87XG5cdFx0Ly90aGlzLnR5cGUgPSBvYmoudHlwZTtcblx0XHR0aGlzLmFsaWduID0gb2JqLmFsaWduO1xuXHRcdHRoaXMuYnViYmxlX3R5cGUgPSBvYmouYnViYmxlX3R5cGU7XG5cdFx0dGhpcy50ZXh0ID0gb2JqLnRleHQ7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBvYmoucG9zaXRpb247XG5cblx0XHQvL3ZhciBwYW5lbCA9IHBhbmVsc1tpXTtcblx0XHR2YXIgc2IgPSBvYmo7XG5cblx0XHR2YXIgZGl2ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN2aWV3XCIpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIikpO1xuXHRcdHZhciBidWJibGVfb3JpZW50ID0gc2IuYnViYmxlX3R5cGU7XG5cblx0XHRpZiAob2JqLmltYWdlICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHRoaXMuaW1hZ2UgPSBvYmouaW1hZ2U7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dmFyIGltYWdlID0gXCJcIjtcblx0XHRcdHZhciBidWJibGVfc2l6ZSA9IFwibWVkaXVtXCI7XG5cdFx0XHRpZiAoc2IudGV4dC5sZW5ndGggPCA0KSB7XG5cdFx0XHRcdGJ1YmJsZV9zaXplID0gXCJzbWFsbFwiO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRpbWFnZSArPSBidWJibGVfc2l6ZTtcblx0XHRcdGlmIChidWJibGVfb3JpZW50ID09IFwiYm94XCIpIHtcblx0XHRcdFx0aW1hZ2UgKz0gXCJfYm94LnBuZ1wiO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpbWFnZSArPSBcIl9idWJibGVfXCIgKyBidWJibGVfb3JpZW50ICsgXCIucG5nXCI7XG5cdFx0XHR0aGlzLmltYWdlID0gJ2dhbWUvaW1nL2J1YmJsZXMvJyArIGltYWdlO1xuXHRcdH1cblxuXHRcdGRpdi5pbm5lckhUTUwgPSBcIjxwPlwiICsgc2IudGV4dC5yZXBsYWNlKC9cXG4vZywgXCI8YnI+XCIpICsgXCI8L3A+XCI7XG5cblx0XHRkaXYuY2xhc3NOYW1lID0gXCJidWJibGVcIjtcblx0XHRpZiAoYnViYmxlX29yaWVudCA9PSBcImJveFwiKSBkaXYuY2xhc3NOYW1lICs9IFwiIGJveFwiO1xuXHRcdGRpdi5jbGFzc05hbWUgKz0gXCIgbm9zZWxlY3RcIjtcblx0XHRkaXYuc3R5bGUub3BhY2l0eSA9ICcwJztcblx0XHRkaXYuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gJ3VybChcIicgKyB0aGlzLmltYWdlICsnXCIpJztcblx0XHRkaXYuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG5cdFx0ZGl2LnN0eWxlLnRvcCA9IDA7XG5cdFx0ZGl2LnN0eWxlLmxlZnQgPSAwO1xuXG5cdFx0Ly9kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpZXdcIikuYXBwZW5kQ2hpbGQoZGl2KTtcblxuXHRcdFxuXG5cblx0XHR0aGlzLnNjYWxlWCA9IDAuNjtcblx0XHR0aGlzLnNjYWxlWSA9IDAuNjtcblxuXHRcdHRoaXMueCA9IHNiLnBvc2l0aW9uLnggKiB0aGlzLnBhbmVsYml0bWFwLmltYWdlLndpZHRoKnRoaXMucGFuZWxiaXRtYXAuc2NhbGVYO1xuXHRcdHRoaXMueSA9IHNiLnBvc2l0aW9uLnkgKiB0aGlzLnBhbmVsYml0bWFwLmltYWdlLmhlaWdodCp0aGlzLnBhbmVsYml0bWFwLnNjYWxlWTtcblx0XHQvL3RoaXMueCA9IGVsbS54O1xuXHRcdC8vdGhpcy55ID0gZWxtLnk7XG5cdFx0dGhpcy5yZWdYID0gZGl2LmNsaWVudFdpZHRoLzI7XG5cdFx0dGhpcy5yZWdZID0gZGl2LmNsaWVudEhlaWdodDtcblx0XHR0aGlzLndpZHRoID0gZGl2LmNsaWVudFdpZHRoO1xuXHRcdHRoaXMuaGVpZ2h0ID0gZGl2LmNsaWVudEhlaWdodDtcblx0XHRpZiAoYnViYmxlX29yaWVudCA9PSBcImxlZnRcIikge1xuXHRcdFx0dGhpcy5yZWdYID0gMDtcblx0XHR9XG5cblx0XHR2YXIgYWxpZ25feCA9IFwibGVmdFwiO1xuXHRcdHZhciBhbGlnbl95ID0gXCJ0b3BcIjtcblx0XHRpZiAoc2IuYWxpZ24gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0YWxpZ25feCA9IHNiLmFsaWduLng7XG5cdFx0XHRhbGlnbl95ID0gc2IuYWxpZ24ueTtcblx0XHR9XG5cdFx0aWYgKGFsaWduX3ggPT0gXCJyaWdodFwiKSB7XG5cdFx0XHR0aGlzLnJlZ1ggPSBkaXYuY2xpZW50V2lkdGg7XG5cdFx0XHR0aGlzLnggPSB0aGlzLnBhbmVsYml0bWFwLmltYWdlLndpZHRoKnRoaXMucGFuZWxiaXRtYXAuc2NhbGVYLXRoaXMueDtcblx0XHR9XG5cdFx0aWYgKGFsaWduX3kgPT0gXCJib3R0b21cIikge1xuXHRcdFx0dGhpcy5yZWdZID0gZGl2LmNsaWVudEhlaWdodDtcblx0XHRcdHRoaXMueSA9IHRoaXMucGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0KnRoaXMucGFuZWxiaXRtYXAuc2NhbGVZLXRoaXMueTtcblx0XHR9XG5cdFx0dmFyIHNlbGVjdGVkID0gbmV3IGNyZWF0ZWpzLlNoYXBlKCk7XG5cdFx0dmFyIGhpdHNoYXBlID0gbmV3IGNyZWF0ZWpzLlNoYXBlKCk7XG5cdFx0aGl0c2hhcGUuZ3JhcGhpY3MuZihcIiMwMDBcIikuZHIoMCwwLHRoaXMud2lkdGgsdGhpcy5oZWlnaHQpO1xuXHRcdHRoaXMuaGl0QXJlYSA9IGhpdHNoYXBlO1xuXHRcdHZhciBlbG0gPSBuZXcgY3JlYXRlanMuRE9NRWxlbWVudChkaXYpO1xuXHRcdHRoaXMuYWRkQ2hpbGQoc2VsZWN0ZWQsIGVsbSk7XG5cdFx0ZGl2Lm9wYWNpdHkgPSAnMSc7XG5cdFx0ZWxtLnggPSAwO1xuXHRcdGVsbS55ID0gMDtcblx0XHQvL3RoaXMuYWRkQ2hpbGQoaGl0c2hhcGUpO1xuXHRcdHRoaXMub24oXCJtb3VzZWRvd25cIiwgdGhpcy5zZXREcmFnT2Zmc2V0KTtcblx0XHR0aGlzLm9uKFwicHJlc3Ntb3ZlXCIsIHRoaXMuZHJhZ0VsZW1lbnQpO1xuXHRcdC8vdGhpcy5vbihcImNsaWNrXCIsIHRoaXMuc2hvd1Byb3BlcnRpZXMpO1xuXHRcdC8vZWxtLnJlZ1kgPSBlbG0uZ2V0Qm91bmRzKCkuaGVpZ2h0O1xuXHRcdC8vZWxlbWVudHMuYWRkQ2hpbGQoZWxtKTtcblx0fTtcblxuXHRQYW5lbEVsZW1lbnQucHJvdG90eXBlLnVwZGF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgZWxlbWVudCA9IHRoaXMuY2hpbGRyZW5bMV0uaHRtbEVsZW1lbnQ7IFxuXHRcdGVsZW1lbnQuaW5uZXJIVE1MID0gJzxwPicgKyB0aGlzLnRleHQucmVwbGFjZSgvXFxuL2csIFwiPGJyPlwiKSArICc8L3A+Jztcblx0XHR0aGlzLndpZHRoID0gZWxlbWVudC5jbGllbnRXaWR0aDtcblx0XHR0aGlzLmhlaWdodCA9IGVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuXHRcdHRoaXMucmVnWCA9IGVsZW1lbnQuY2xpZW50V2lkdGgvMjtcblx0XHR0aGlzLnJlZ1kgPSBlbGVtZW50LmNsaWVudEhlaWdodDtcblxuXHRcdC8qdmFyIGltYWdlID0gXCJcIjtcblx0XHR2YXIgYnViYmxlX3NpemUgPSBcIm1lZGl1bVwiO1xuXHRcdGlmICh0aGlzLnRleHQubGVuZ3RoIDwgNCkge1xuXHRcdFx0YnViYmxlX3NpemUgPSBcInNtYWxsXCI7XG5cdFx0fVxuXHRcdHZhciBidWJibGVfb3JpZW50ID0gdGhpcy5idWJibGVfdHlwZTtcblx0XHRpbWFnZSArPSBidWJibGVfc2l6ZTtcblx0XHRpZiAoYnViYmxlX29yaWVudCA9PSBcImJveFwiKSB7XG5cdFx0XHRpbWFnZSArPSBcIl9ib3gucG5nXCI7XG5cdFx0fVxuXHRcdGVsc2UgaW1hZ2UgKz0gXCJfYnViYmxlX1wiICsgYnViYmxlX29yaWVudCArIFwiLnBuZ1wiO1xuXHRcdGVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gXCJ1cmwoXFxcImdhbWUvaW1nL2J1YmJsZXMvXCIraW1hZ2UrXCJcXFwiKVwiOyovXG5cdFx0ZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLmltYWdlO1xuXG5cdFx0aWYgKHRoaXMuYWxpZ24gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmFsaWduLnggPT0gXCJyaWdodFwiKSB7XG5cdFx0XHR0aGlzLnJlZ1ggPSBlbGVtZW50LmNsaWVudFdpZHRoO1xuXHRcdH1cblx0fTtcblxuXHRQYW5lbEVsZW1lbnQucHJvdG90eXBlLnNob3dQcm9wZXJ0aWVzID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG5vZGUgPSB0aGlzO1xuXHRcdC8vaWYgKGN1cnJlbnRseVNlbGVjdGVkID09IHRoaXMpIHJldHVybjtcblx0XHQvL2N1cnJlbnRseVNlbGVjdGVkID0gdGhpcztcblxuXHRcdC8vY29uc29sZS5sb2coXCJTaG93aW5nIHByb3BlcnRpZXMgZm9yIG5vZGUgXCIgKyBub2RlLm5hbWUgKTtcblxuXHRcdHZhciBwcm9wZXJ0eV9wYW5lbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcHJvcGVydGllc1wiKTtcblxuXHRcdHZhciBwcm9wZXJ0eV9oZWFkZXIgPSBcdCc8ZGl2IGlkPVwib2JqZWN0LW5hbWVcIj4nICtcblx0XHRcdFx0XHRcdFx0XHRcdCc8cD4nICsgbm9kZS5wYXJlbnQubmFtZSArICc8c3BhbiBjbGFzcz1cImVsZW1lbnQtaWRcIj4nICsgbm9kZS5wYXJlbnQuY29uc3RydWN0b3IubmFtZSArICcgIycgKyBub2RlQ29udGFpbmVyLmdldENoaWxkSW5kZXgobm9kZS5wYXJlbnQpICsgJyAtICcgKyBub2RlLmNvbnN0cnVjdG9yLm5hbWUgKyAnPC9zcGFuPjwvcD4nICtcblx0XHRcdFx0XHRcdFx0XHQnPC9kaXY+Jztcblx0XHRwcm9wZXJ0eV9wYW5lbC5pbm5lckhUTUwgPSBwcm9wZXJ0eV9oZWFkZXI7XG5cblx0XHQvL3ZhciBub2RlX25hbWUgPSAnPGRpdiBjbGFzcz1cImZpZWxkIGxhYmVsc2lkZVwiPjxwPk5hbWU6PC9wPjxpbnB1dCB0eXBlPVwidGV4dFwiIHZhbHVlPVwiJyArIG5vZGUubmFtZSArICdcIiBpZD1cInByb3BlcnR5LW5hbWVcIj48L2Rpdj4nO1xuXHRcdC8vcHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MICs9IG5vZGVfbmFtZTtcblxuXHRcdHZhciBwcm9wX2ltYWdlID0gJzxkaXYgY2xhc3M9XCJmaWVsZCBsYWJlbHRvcFwiPjxwPkltYWdlIFVSTDo8L3A+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgdmFsdWU9XCInICsgbm9kZS5pbWFnZSArICdcIiBpZD1cInByb3BlcnR5LWltYWdlcGF0aFwiPjwvZGl2Pic7XG5cdFx0cHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MICs9IHByb3BfaW1hZ2U7XG5cblx0XHRjb25zb2xlLmxvZyhcIllvIVwiKTtcblxuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcHJvcGVydHktaW1hZ2VwYXRoXCIpLm9uY2hhbmdlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcIldodXQhXCIpO1xuXHRcdFx0Ly9ub2RlLmltYWdlID0gcHJvcGltYWdlLnZhbHVlO1xuXHRcdFx0dmFyIGltZyA9IG5ldyBJbWFnZSgpO1xuXHRcdFx0aW1nLnNyYyA9IHByb3BpbWFnZS52YWx1ZTtcblx0XHRcdGltZy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0bm9kZS5pbWFnZSA9IHByb3BpbWFnZS52YWx1ZTtcblx0XHRcdFx0bm9kZS51cGRhdGVFbGVtZW50KCk7XG5cdFx0XHRcdC8vbm9kZS5wYW5lbGJpdG1hcC5pbWFnZSA9IGltZztcblx0XHRcdFx0Ly9ub2RlLnNlbGVjdGVkLmdyYXBoaWNzLmNsZWFyKCk7XG5cdFx0XHRcdC8vdmFyIHRoaWNrbmVzcyA9IDM7XG5cdFx0XHRcdC8vbm9kZS5zZWxlY3RlZC5ncmFwaGljcy5mKFwiIzAwOTllZVwiKS5kcigtdGhpY2tuZXNzLC10aGlja25lc3Msbm9kZS5wYW5lbGJpdG1hcC5pbWFnZS53aWR0aCpub2RlLnBhbmVsYml0bWFwLnNjYWxlWCt0aGlja25lc3MqMiwgbm9kZS5wYW5lbGJpdG1hcC5pbWFnZS5oZWlnaHQqbm9kZS5wYW5lbGJpdG1hcC5zY2FsZVkrdGhpY2tuZXNzKjIpO1xuXHRcdFx0fVxuXHRcdFx0aW1nLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGRpYWxvZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZGlhbG9nXCIpO1xuXHRcdFx0XHRkaWFsb2cuaW5uZXJIVE1MID0gXCI8cD4nXCIgKyBwcm9waW1hZ2UudmFsdWUgKyBcIicgY291bGQgbm90IGJlIGxvYWRlZDxwPlwiO1xuXHRcdFx0XHQvL2RpYWxvZy5zdHlsZS50b3AgPSBcIjUwJVwiO1xuXHRcdFx0XHQvL2RpYWxvZy5zdHlsZS5sZWZ0ID0gXCI1MCVcIjtcblx0XHRcdFx0ZGlhbG9nLnN0eWxlLm9wYWNpdHkgPSBcIjAuOFwiO1xuXHRcdFx0XHRkaWFsb2cuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCIjNTIyXCI7XG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0ZGlhbG9nLnN0eWxlLm9wYWNpdHkgPSBcIjBcIjtcblx0XHRcdFx0fSwgMjAwMCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHZhciBwcm9wX3RleHQgPSAnPGRpdiBjbGFzcz1cImZpZWxkIGxhYmVsdG9wXCI+PHA+VGV4dDo8L3A+PHRleHRhcmVhIGlkPVwicHJvcGVydHktdGV4dFwiPicgK1xuXHRcdG5vZGUudGV4dCArXG5cdFx0JzwvdGV4dGFyZWE+PC9kaXY+JztcblxuXHRcdC8vdmFyIHBhbmVsX2ltYWdlID0gJzxkaXYgY2xhc3M9XCJmaWVsZCBsYWJlbHRvcFwiPjxwPkltYWdlIFVSTDo8L3A+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgdmFsdWU9XCInICsgbm9kZS5pbWFnZSArICdcIiBpZD1cInByb3BlcnR5LWltYWdlcGF0aFwiPjwvZGl2Pic7XG5cdFx0cHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MICs9IHByb3BfdGV4dDtcblxuXHRcdC8vdmFyIHBhbmVsX3NpemUgPSAnPGRpdiBjbGFzcz1cImZpZWxkIGxhYmVsc2lkZVwiPjxwPlNpemU6PC9wPjx1bCBpZD1cInByb3BlcnR5LXNpemVcIiBjbGFzcz1cIm51bWJlcmJ1dHRvbnMgbm9zZWxlY3RcIj4nO1xuXHRcdFxuXHRcdC8vcGFuZWxfc2l6ZSArPSAnPC91bD48L2Rpdj4nO1xuXHRcdFxuXHRcdC8qcGFuZWxfc2l6ZSArPSAnPC91bD48L2Rpdj4nO1xuXHRcdHByb3BlcnR5X3BhbmVsLmlubmVySFRNTCArPSBwYW5lbF9zaXplOyovXG5cdFx0Lyp2YXIgcHJvcG5hbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnR5LW5hbWVcIik7XG5cdFx0cHJvcG5hbWUub25jaGFuZ2UgPSBmdW5jdGlvbigpIHtcblx0XHRcdG5vZGUubmFtZSA9IHByb3BuYW1lLnZhbHVlO1xuXHRcdH0qL1xuXG5cdFx0dmFyIGRlbGV0ZV9idXR0b24gPSAnPGRpdiBjbGFzcz1cImZpZWxkXCI+PGlucHV0IGlkPVwiZGVsZXRlXCIgY2xhc3M9XCJidXR0b24gZGVsZXRlLWJ1dHRvblwiIHR5cGU9XCJzdWJtaXRcIiB2YWx1ZT1cIkRlbGV0ZSBQYW5lbFwiPjwvZGl2Pic7XG5cdFx0cHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MICs9IGRlbGV0ZV9idXR0b247XG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNkZWxldGVcIikub25jbGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0Y29uc29sZS5sb2cobm9kZS5wYXJlbnQpO1xuXHRcdFx0bm9kZS5wYXJlbnQucmVtb3ZlQ2hpbGQoY3VycmVudGx5U2VsZWN0ZWQpO1xuXHRcdH07XG5cblx0XHR2YXIgcHJvcHRleHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnR5LXRleHRcIik7XG5cdFx0cHJvcHRleHQub25rZXl1cCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhwcm9wdGV4dC52YWx1ZSk7XG5cdFx0XHRub2RlLnRleHQgPSBwcm9wdGV4dC52YWx1ZTtcblx0XHRcdG5vZGUudXBkYXRlRWxlbWVudCgpO1xuXHRcdH07XG5cblx0XHRcblx0XHRcblx0fTtcblxuXHRQYW5lbEVsZW1lbnQucHJvdG90eXBlLnNldERyYWdPZmZzZXQgPSBmdW5jdGlvbihldnQpIHtcblx0XHR2YXIgZ2xvYmFsID0gZXZ0LnRhcmdldC5wYXJlbnQubG9jYWxUb0dsb2JhbChldnQudGFyZ2V0LngsIGV2dC50YXJnZXQueSk7XG5cdFx0ZHJhZ29mZnNldCA9IHtcblx0XHRcdHg6IGV2dC5zdGFnZVggLSBnbG9iYWwueCxcblx0XHRcdHk6IGV2dC5zdGFnZVkgLSBnbG9iYWwueVxuXHRcdH07XG5cdFx0Ly9jdXJyZW50bHlTZWxlY3RlZCA9IGV2dC50YXJnZXQucGFyZW50O1xuXHRcdGlmIChjdXJyZW50bHlTZWxlY3RlZCAhPT0gdW5kZWZpbmVkICYmIGN1cnJlbnRseVNlbGVjdGVkLnNlbGVjdGVkICE9PSB1bmRlZmluZWQpIGN1cnJlbnRseVNlbGVjdGVkLnNlbGVjdGVkLmdyYXBoaWNzLmNsZWFyKCk7XG5cdFx0Y3VycmVudGx5U2VsZWN0ZWQgPSBldnQudGFyZ2V0O1xuXHRcdG9wZW5UYWIoXCJwcm9wZXJ0eVRhYlwiKTtcblx0XHQvL2V2dC50YXJnZXQuc2hvd1Byb3BlcnRpZXMoKTtcblx0fTtcblxuXHRQYW5lbEVsZW1lbnQucHJvdG90eXBlLmRyYWdFbGVtZW50ID0gZnVuY3Rpb24oZXZ0KSB7XG5cdFx0Ly9jb25zb2xlLmxvZyhcIkNsaWNrIVwiKTtcblx0XHR2YXIgbG9jYWwgPSBldnQudGFyZ2V0LnBhcmVudC5nbG9iYWxUb0xvY2FsKGV2dC5zdGFnZVggLSBkcmFnb2Zmc2V0LngsIGV2dC5zdGFnZVkgLSBkcmFnb2Zmc2V0LnkpO1xuXHRcdHZhciBwYW5lbGJpdG1hcCA9IGV2dC50YXJnZXQucGFyZW50LnBhbmVsYml0bWFwO1xuXHRcdHZhciBwYW5lbCA9IHtcblx0XHRcdHdpZHRoOiBwYW5lbGJpdG1hcC5pbWFnZS53aWR0aCpwYW5lbGJpdG1hcC5zY2FsZVgsXG5cdFx0XHRoZWlnaHQ6IHBhbmVsYml0bWFwLmltYWdlLmhlaWdodCpwYW5lbGJpdG1hcC5zY2FsZVlcblx0XHR9O1xuXHRcdGlmIChsb2NhbC54IDwgMCkgbG9jYWwueCA9IDA7XG5cdFx0aWYgKGxvY2FsLnggPiBwYW5lbC53aWR0aCkgbG9jYWwueCA9IHBhbmVsLndpZHRoO1xuXHRcdGlmIChsb2NhbC55IDwgMCkgbG9jYWwueSA9IDA7XG5cdFx0aWYgKGxvY2FsLnkgPiBwYW5lbC5oZWlnaHQpIGxvY2FsLnkgPSBwYW5lbC5oZWlnaHQ7XG5cdFx0ZXZ0LnRhcmdldC54ID0gbG9jYWwueDtcblx0XHRldnQudGFyZ2V0LnkgPSBsb2NhbC55O1xuICAgICAgICAvKmV2dC50YXJnZXQucG9zaXRpb24gPSB7IFxuICAgICAgICAgICAgeDogbG9jYWwueC9ldnQudGFyZ2V0LnBhbmVsYml0bWFwLmltYWdlLndpZHRoL2V2dC50YXJnZXQucGFuZWxiaXRtYXAuc2NhbGVYKjEwMCwgXG4gICAgICAgICAgICB5OiBsb2NhbC55L2V2dC50YXJnZXQucGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0L2V2dC50YXJnZXQucGFuZWxiaXRtYXAuc2NhbGVZKjEwMCB9Ki9cblx0XHRldnQudGFyZ2V0LnBhcmVudC5kcmF3Q29ubmVjdGlvbnMoKTtcblx0fTtcblxuXHR3aW5kb3cuUGFuZWxFbGVtZW50ID0gY3JlYXRlanMucHJvbW90ZShQYW5lbEVsZW1lbnQsIFwiQ29udGFpbmVyXCIpO1xuXG5cblx0Ly8gLS0tLS0tLS0tLS0tLS0tIC8vXG5cdC8vICBOb2RlQ29udGFpbmVyICAvL1xuXHQvLyAtLS0tLS0tLS0tLS0tLS0gLy9cblxuXHRmdW5jdGlvbiBOb2RlQ29udGFpbmVyKCkge1xuXHRcdHRoaXMuQ29udGFpbmVyX2NvbnN0cnVjdG9yKCk7XG5cdFx0dGhpcy5zdGFydG5vZGUgPSAwO1xuXHR9IGNyZWF0ZWpzLmV4dGVuZChOb2RlQ29udGFpbmVyLCBjcmVhdGVqcy5Db250YWluZXIpO1xuXG5cblx0Tm9kZUNvbnRhaW5lci5wcm90b3R5cGUuc2hvd1Byb3BlcnRpZXMgPSBmdW5jdGlvbigpIHtcblxuXHRcdC8vY29uc29sZS5sb2codGhpcyk7XG5cblx0XHQvL2YgKGN1cnJlbnRseVNlbGVjdGVkID09IHRoaXMpIHJldHVybjtcblx0XHQvL2N1cnJlbnRseVNlbGVjdGVkID0gdGhpcztcblxuXHRcdHZhciBwcm9wZXJ0eV9wYW5lbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcHJvcGVydGllc1wiKTtcblxuXHRcdHZhciBwcm9wZXJ0eV9oZWFkZXIgPSBcdCc8ZGl2IGlkPVwib2JqZWN0LW5hbWVcIj4nICtcblx0XHRcdFx0XHRcdFx0XHRcdCc8cD5Qcm9qZWN0IFByb3BlcnRpZXM8L3A+JyArXG5cdFx0XHRcdFx0XHRcdFx0JzwvZGl2Pic7XG5cdFx0cHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MID0gcHJvcGVydHlfaGVhZGVyO1xuXG5cdFx0dmFyIHByb3Bfc3RhcnRub2RlID0gJzxkaXYgY2xhc3M9XCJmaWVsZCBsYWJlbHNpZGVcIj48cD5TdGFydCBub2RlOjwvcD48aW5wdXQgdHlwZT1cIm51bWJlclwiIHZhbHVlPVwiJyArIHRoaXMuc3RhcnRub2RlICsgJ1wiIGlkPVwicHJvcGVydHktc3RhcnRub2RlXCI+PC9kaXY+Jztcblx0XHRwcm9wZXJ0eV9wYW5lbC5pbm5lckhUTUwgKz0gcHJvcF9zdGFydG5vZGU7XG5cblx0XHR2YXIgcHJvcHN0YXJ0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNwcm9wZXJ0eS1zdGFydG5vZGVcIik7XG5cdFx0dmFyIGNvbnRhaW5lciA9IHRoaXM7XG5cdFx0cHJvcHN0YXJ0Lm9uY2hhbmdlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcIlN0YXJ0IG5vZGUgY2hhbmdlZFwiLCBwcm9wc3RhcnQudmFsdWUpO1xuXHRcdFx0Y29udGFpbmVyLnN0YXJ0bm9kZSA9IHByb3BzdGFydC52YWx1ZTtcblx0XHRcdGNvbnNvbGUubG9nKGNvbnRhaW5lci5zdGFydG5vZGUpO1xuXHRcdH07XG5cdFx0XG5cdH07XG5cblx0Tm9kZUNvbnRhaW5lci5wcm90b3R5cGUubWFrZUNvbm5lY3Rpb25zID0gZnVuY3Rpb24oKSB7XG5cblx0XHRmb3IgKGk9MDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBub2RlID0gdGhpcy5jaGlsZHJlbltpXTtcblx0XHRcdGlmIChub2RlLmdvdG8gIT09IHVuZGVmaW5lZCkgbm9kZS5nb3RvID0gdGhpcy5nZXRDaGlsZEF0KG5vZGUuZ290byk7XG5cdFx0XHRmb3IgKGU9MDsgZSA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBlKyspIHtcblx0XHRcdFx0dmFyIGVsZW0gPSBub2RlLmNoaWxkcmVuW2VdO1xuXHRcdFx0XHRpZiAoZWxlbSBpbnN0YW5jZW9mIFBhbmVsRWxlbWVudCAmJiBlbGVtLmdvdG8gIT09IHVuZGVmaW5lZCkgZWxlbS5nb3RvID0gdGhpcy5nZXRDaGlsZEF0KGVsZW0uZ290byk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH07XG5cblx0Ly8gT3ZlcndyaXRlIENvbnRhaW5lci5yZW1vdmVDaGlsZCgpXG5cdE5vZGVDb250YWluZXIucHJvdG90eXBlLnJlbW92ZUNoaWxkID0gZnVuY3Rpb24oY2hpbGQpIHtcblx0XHR2YXIgdmlldyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdmlld1wiKTtcblx0XHRmb3IgKGU9MDsgZTxjaGlsZC5jaGlsZHJlbi5sZW5ndGg7IGUrKykge1xuXHRcdFx0dmFyIGVsbSA9IGNoaWxkLmNoaWxkcmVuW2VdO1xuXHRcdFx0Y29uc29sZS5sb2coZWxtKTtcblx0XHRcdGlmIChlbG0gaW5zdGFuY2VvZiBQYW5lbEVsZW1lbnQpIHtcblx0XHRcdFx0ZWxtID0gZWxtLmNoaWxkcmVuWzFdLmh0bWxFbGVtZW50O1xuXHRcdFx0XHRjb25zb2xlLmxvZyhlbG0pO1xuXHRcdFx0XHR2aWV3LnJlbW92ZUNoaWxkKGVsbSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHRoaXMuQ29udGFpbmVyX3JlbW92ZUNoaWxkKGNoaWxkKTtcblx0XHRkcmF3QWxsQ29ubmVjdGlvbnMoKTtcblx0fVxuXG5cdC8vIHRvT2JqZWN0IC0gRm9yIG91dHB1dHRpbmcgZWRpdG9yIHBhcmFtZXRlcnMgdG8gYSBKU09OIG9iamVjdFxuXG5cdE5vZGVDb250YWluZXIucHJvdG90eXBlLnRvT2JqZWN0ID0gZnVuY3Rpb24oKSB7XG5cblx0XHR2YXIgb3V0cHV0ID0gbmV3IE9iamVjdCgpO1xuXG5cdFx0b3V0cHV0LmNvbmZpZyA9IHtcblx0XHRcdHN0YXJ0bm9kZTogdGhpcy5zdGFydG5vZGVcblx0XHR9O1xuXG5cdFx0b3V0cHV0Lm5vZGVzID0gW107XG5cdFx0Zm9yIChpPTA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgcmVmID0gdGhpcy5jaGlsZHJlbltpXTtcblx0XHRcdC8vIGN5Y2xlIHRocm91Z2ggYWxsIG5vZGVzLCBzYXZpbmcgdGhlaXIgZGF0YSB0byBhbiBvYmplY3Rcblx0XHRcdHZhciBub2RlID0gbmV3IE9iamVjdCgpO1xuXG5cdFx0XHRpZiAocmVmIGluc3RhbmNlb2YgUGFuZWwpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhub2RlLm5hbWUpO1xuXHRcdFx0XHRub2RlLm5hbWUgPSByZWYubmFtZTtcblx0XHRcdFx0bm9kZS5zaXplID0gcmVmLnNpemU7XG5cdFx0XHRcdG5vZGUuaW1hZ2UgPSByZWYuaW1hZ2U7XG5cdFx0XHRcdG5vZGUuZ290byA9IHRoaXMuZ2V0Q2hpbGRJbmRleChyZWYuZ290byk7XG5cdFx0XHRcdGlmIChub2RlLmdvdG8gPT0gLTEpIG5vZGUuZ290byA9IHVuZGVmaW5lZDtcblx0XHRcdFx0bm9kZS5lZGl0b3IgPSB7XG5cdFx0XHRcdFx0cG9zaXRpb246IHsgeDogcmVmLngsIHk6IHJlZi55IH1cblx0XHRcdFx0fTtcblxuXHRcdFx0XHRub2RlLmVsZW1lbnRzID0gW107XG5cblx0XHRcdFx0Zm9yIChlPTA7IGUgPCByZWYuY2hpbGRyZW4ubGVuZ3RoOyBlKyspIHtcblx0XHRcdFx0XHR2YXIgcl9lbGVtID0gcmVmLmNoaWxkcmVuW2VdO1xuXHRcdFx0XHRcdGlmIChyX2VsZW0gaW5zdGFuY2VvZiBQYW5lbEVsZW1lbnQpIHtcblx0XHRcdFx0XHRcdHZhciBlbGVtID0gbmV3IE9iamVjdCgpO1xuXG5cdFx0XHRcdFx0XHRlbGVtLnR5cGUgPSByX2VsZW0udHlwZTtcblx0XHRcdFx0XHRcdGlmIChyX2VsZW0udGV4dCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRcdGVsZW0udGV4dCA9IHJfZWxlbS50ZXh0O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxlbS5idWJibGVfdHlwZSA9IHJfZWxlbS5idWJibGVfdHlwZTtcblx0XHRcdFx0XHRcdGVsZW0uaW1hZ2UgPSByX2VsZW0uaW1hZ2U7XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdGVsZW0ucG9zaXRpb24gPSB7XG5cdFx0XHRcdFx0XHRcdHg6cl9lbGVtLngvKHJfZWxlbS5wYW5lbGJpdG1hcC5pbWFnZS53aWR0aCpyX2VsZW0ucGFuZWxiaXRtYXAuc2NhbGVYKSxcblx0XHRcdFx0XHRcdFx0eTpyX2VsZW0ueS8ocl9lbGVtLnBhbmVsYml0bWFwLmltYWdlLmhlaWdodCpyX2VsZW0ucGFuZWxiaXRtYXAuc2NhbGVZKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0aWYgKHJfZWxlbS5hbGlnbiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRcdGVsZW0uYWxpZ24gPSByX2VsZW0uYWxpZ247XG5cdFx0XHRcdFx0XHRcdGlmIChlbGVtLmFsaWduLnggPT0gXCJyaWdodFwiKSBlbGVtLnBvc2l0aW9uLnggPSAxIC0gZWxlbS5wb3NpdGlvbi54O1xuXHRcdFx0XHRcdFx0XHRpZiAoZWxlbS5hbGlnbi55ID09IFwiYm90dG9tXCIpIGVsZW0ucG9zaXRpb24ueSA9IDEgLSBlbGVtLnBvc2l0aW9uLnk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbGVtLmdvdG8gPSB0aGlzLmdldENoaWxkSW5kZXgocl9lbGVtLmdvdG8pO1xuXHRcdFx0XHRcdFx0aWYgKGVsZW0uZ290byA9PSAtMSkgZWxlbS5nb3RvID0gdW5kZWZpbmVkO1xuXG5cdFx0XHRcdFx0XHRub2RlLmVsZW1lbnRzLnB1c2goZWxlbSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdH1cblxuXHRcdFx0b3V0cHV0Lm5vZGVzLnB1c2gobm9kZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG91dHB1dDtcblx0fTtcblxuXHR3aW5kb3cuTm9kZUNvbnRhaW5lciA9IGNyZWF0ZWpzLnByb21vdGUoTm9kZUNvbnRhaW5lciwgXCJDb250YWluZXJcIik7XG5cbn0oKSk7XG5cblxuXG5cblxuXG4iLCJ2YXIgbG9jYWxmb3JhZ2UgPSByZXF1aXJlKCdsb2NhbGZvcmFnZScpO1xuLypleHBvcnRzLmNoZWNrUGF0aCA9IGZ1bmN0aW9uKHBhdGgpXG57XG5cdGlmICh0eXBlb2YgcGF0aCA9PSBcInVuZGVmaW5lZFwiIHx8IHBhdGggPT09IFwiXCIgKSB7XG5cdFx0d2luZG93LmFsZXJ0KFwiWW91IGZvcmdvdCB0byBlbnRlciBhIHBhdGghXCIpO1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdHZhciBmaWxlbmFtZSA9IHBhdGguc3BsaXQoXCIvXCIpLnBvcCgpO1xuXHR2YXIgZXh0ZW5zaW9uID0gZmlsZW5hbWUuc3BsaXQoXCIuXCIpLnBvcCgpO1xuXG5cdGlmIChleHRlbnNpb24gIT0gXCJqc29uXCIgJiYgZXh0ZW5zaW9uICE9IFwidHh0XCIpIHtcblx0XHR3aW5kb3cuYWxlcnQoXCJQbGVhc2Ugc3BlY2lmeSBhIC5qc29uIG9yIC50eHQgZmlsZS5cIik7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0cmV0dXJuIHRydWU7XG59Ki9cblxuZXhwb3J0cy5sb2FkQWxsSW1hZ2VzID0gZnVuY3Rpb24ocGF0aCwgY2FsbGJhY2spIHtcblx0XG4gICAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0cmVxdWVzdC5vcGVuKCdHRVQnLCBcIi4vanMvaW1nLWZvbGRlci5waHBcIiwgdHJ1ZSk7XG5cblx0cmVxdWVzdC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAocmVxdWVzdC5zdGF0dXMgPj0gMjAwICYmIHJlcXVlc3Quc3RhdHVzIDwgNDAwKSB7XG5cdFx0XHQvL2RvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcHJvcGVydGllc1wiKS5pbm5lckhUTUwgPSByZXF1ZXN0LnJlc3BvbnNlVGV4dDtcblx0XHRcdC8vY29uc29sZS5sb2cocmVxdWVzdC5yZXNwb25zZVRleHQpO1xuXHRcdFx0Y2FsbGJhY2soSlNPTi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlVGV4dCkpO1xuXHRcdH0gZWxzZSB7XG5cdFx0Ly8gV2UgcmVhY2hlZCBvdXIgdGFyZ2V0IHNlcnZlciwgYnV0IGl0IHJldHVybmVkIGFuIGVycm9yXG5cdFx0YWxlcnQocmVxdWVzdC5yZXNwb25zZVRleHQpO1xuXHRcdHJldHVybiBudWxsO1xuXHRcdH1cblx0fTtcblxuXHRyZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcblx0XHRhbGVydChyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG5cdH07XG5cblx0cmVxdWVzdC5zZW5kKCk7XG59XG5cbmV4cG9ydHMuc2F2ZSA9IGZ1bmN0aW9uKG9iaiwgcGF0aCkge1xuXHQvL2lmICghY2hlY2tQYXRoKHBhdGgpKSByZXR1cm47XG5cblx0Lyp2YXIgZmlsZW5hbWUgPSBwYXRoLnNwbGl0KFwiL1wiKS5wb3AoKTtcblxuXHQvL2RvZXNGaWxlRXhpc3QocGF0aCk7XG5cdHdyaXRlVG9GaWxlKCk7XG5cblx0ZnVuY3Rpb24gZG9lc0ZpbGVFeGlzdCh1cmxUb0ZpbGUpXG5cdHtcblx0XHR2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cdFx0eGhyLm9wZW4oJ0hFQUQnLCB1cmxUb0ZpbGUsIHRydWUpO1xuXHRcdHhoci5zZW5kKCk7XG5cblx0XHR4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoeGhyLnN0YXR1cyA9PSA0MDQpIHtcblx0XHRcdFx0Ly8gRmlsZSBub3QgZm91bmRcblx0XHRcdFx0d3JpdGVUb0ZpbGUoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIEZpbGUgZXhpc3RzXG5cdFx0XHRcdGlmICh3aW5kb3cuY29uZmlybShcIidcIitwYXRoK1wiJyBhbHJlYWR5IGV4aXN0cy5cXG5EbyB5b3Ugd2FudCB0byBvdmVyd3JpdGUgaXQ/XCIpKSB3cml0ZVRvRmlsZSgpO1xuXHRcdFx0XHRlbHNlIHJldHVybiBudWxsO1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cblxuXHRmdW5jdGlvbiB3cml0ZVRvRmlsZSgpIHtcblx0XHQvL3dpbmRvdy5hbGVydChcIldyaXRpbmcgdG8gZmlsZSEgLi5ub3QgcmVhbGx5IGxvbFwiKTtcblx0XHR2YXIgc2VuZHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0XHRzZW5kcmVxdWVzdC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmIChzZW5kcmVxdWVzdC5zdGF0dXMgPj0gMjAwICYmIHNlbmRyZXF1ZXN0LnN0YXR1cyA8IDQwMCkge1xuICAgICAgICAgICAgICAgIC8vd2luZG93LmFsZXJ0KHNlbmRyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG5cdFx0XHRcdHZhciBkaWFsb2cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2RpYWxvZ1wiKTtcblx0XHRcdFx0ZGlhbG9nLmlubmVySFRNTCA9IFwiPHA+J1wiICsgcGF0aCArIFwiJyBzYXZlZCBzdWNjZXNzZnVsbHk8cD5cIjtcblx0XHRcdFx0Ly9kaWFsb2cuc3R5bGUudG9wID0gXCI1MCVcIjtcblx0XHRcdFx0Ly9kaWFsb2cuc3R5bGUubGVmdCA9IFwiNTAlXCI7XG5cdFx0XHRcdGRpYWxvZy5zdHlsZS5vcGFjaXR5ID0gXCIwLjhcIjtcblx0XHRcdFx0ZGlhbG9nLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiIzMzM1wiO1xuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGRpYWxvZy5zdHlsZS5vcGFjaXR5ID0gXCIwXCI7XG5cdFx0XHRcdH0sIDIwMDApO1xuXHRcdFx0fVxuXHRcdFx0Ly93aW5kb3cuYWxlcnQoc2VuZHJlcXVlc3Quc3RhdHVzICsgXCIgLSBcIiArIHNlbmRyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG5cdFx0fTtcblx0XHRzZW5kcmVxdWVzdC5vcGVuKFwiUE9TVFwiLFwiLi9qc29uLnBocFwiLHRydWUpO1xuXHRcdHNlbmRyZXF1ZXN0LnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LXR5cGVcIiwgXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWRcIik7XG5cdFx0Ly9zZW5kcmVxdWVzdC5yZXNwb25zZVR5cGUgPSAnanNvbic7XG5cdFx0Y29uc29sZS5sb2cocGF0aCk7XG5cdFx0c2VuZHJlcXVlc3Quc2VuZChcImpzb249XCIgKyBKU09OLnN0cmluZ2lmeShvYmosIG51bGwsIDQpICsgXCImcGF0aD1cIiArIHBhdGgpO1xuXHR9Ki9cblxuXHRsb2NhbGZvcmFnZS5zZXRJdGVtKCdjd2luZScsIG9iaiwgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHsgXHRcblx0XHR2YXIgZGlhbG9nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNkaWFsb2dcIik7XG5cdFx0ZGlhbG9nLmlubmVySFRNTCA9IFwiPHA+Q3dpbmUgc2F2ZWQgc3VjY2Vzc2Z1bGx5PHA+XCI7XG5cdFx0ZGlhbG9nLnN0eWxlLm9wYWNpdHkgPSBcIjAuOFwiO1xuXHRcdGRpYWxvZy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcIiMzMzNcIjtcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0ZGlhbG9nLnN0eWxlLm9wYWNpdHkgPSBcIjBcIjtcblx0XHR9LCAyMDAwKTtcblx0fSk7XG59XG5cbmV4cG9ydHMubG9hZCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5cblx0bG9jYWxmb3JhZ2UuZ2V0SXRlbSgnY3dpbmUnLCBmdW5jdGlvbihlcnIsIHZhbHVlKSB7XG5cdFx0cHJlbG9hZEltYWdlcyh2YWx1ZSxjYWxsYmFjayk7IFx0XG5cdFx0Ly9jYWxsYmFjayh2YWx1ZSk7XG5cdH0pO1xufVxuXG5leHBvcnRzLmxvYWRKU09OID0gZnVuY3Rpb24ocGF0aCwgY2FsbGJhY2spIHtcblxuXHQvL2lmICghY2hlY2tQYXRoKHBhdGgpKSByZXR1cm47XG5cdC8vY2xlYXJBbGwoKTtcblxuXHR2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXHRyZXF1ZXN0Lm9wZW4oJ0dFVCcsIHBhdGggKyAnP189JyArIG5ldyBEYXRlKCkuZ2V0VGltZSgpLCB0cnVlKTtcblxuXHR2YXIgbW9iaWxlX3NtYWxsX3BhbmVscyA9IDA7XG5cblx0cmVxdWVzdC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAocmVxdWVzdC5zdGF0dXMgPj0gMjAwICYmIHJlcXVlc3Quc3RhdHVzIDwgNDAwKSB7XG5cdFx0XHQvLyBTdWNjZXNzIVxuXHRcdFx0Ly9wYW5lbHMgPSBKU09OLnBhcnNlKHJlcXVlc3QucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIHZhciBvYmogPSBKU09OLnBhcnNlKHJlcXVlc3QucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2cob2JqKTtcblx0XHRcdHByZWxvYWRJbWFnZXMob2JqLCBjYWxsYmFjayk7XG5cdFx0XHQvL2NhbGxiYWNrKG9iaik7XG5cdFx0fSBlbHNlIHtcblx0XHQvLyBXZSByZWFjaGVkIG91ciB0YXJnZXQgc2VydmVyLCBidXQgaXQgcmV0dXJuZWQgYW4gZXJyb3Jcblx0XHRcdGlmIChyZXF1ZXN0LnN0YXR1cyA9PSA0MDQpIHdpbmRvdy5hbGVydChcIkZpbGUgbm90IGZvdW5kIVwiKTtcblx0XHRcdGVsc2Ugd2luZG93LmFsZXJ0KHJlcXVlc3QucmVzcG9uc2VUZXh0KTtcblx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdH07XG5cblx0cmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG5cdFx0YWxlcnQocmVxdWVzdC5yZXNwb25zZVRleHQpO1xuXHR9O1xuXG5cdHJlcXVlc3Quc2VuZCgpO1xufVxuXG5mdW5jdGlvbiBwcmVsb2FkSW1hZ2VzKG9iaiwgY2FsbGJhY2spIHtcblx0dmFyIGxvYWRlZCA9IDA7XG5cdHZhciBpbWFnZXMgPSBbXTtcblx0LyppbWFnZXMucHVzaChcImltZy9idWJibGVzL21lZGl1bV9idWJibGVfbGVmdC5wbmdcIik7XG5cdGltYWdlcy5wdXNoKFwiaW1nL2J1YmJsZXMvbWVkaXVtX2J1YmJsZV9kb3duLnBuZ1wiKTtcblx0aW1hZ2VzLnB1c2goXCJpbWcvYnViYmxlcy9tZWRpdW1fYm94LnBuZ1wiKTtcblx0aW1hZ2VzLnB1c2goXCJpbWcvYnViYmxlcy9zbWFsbF9ib3gucG5nXCIpO1xuXHRpbWFnZXMucHVzaChcImltZy9idWJibGVzL3NtYWxsX2J1YmJsZV9kb3duLnBuZ1wiKTtcblx0aW1hZ2VzLnB1c2goXCJpbWcvYnViYmxlcy94X3NtYWxsX2J1YmJsZV9sZWZ0LnBuZ1wiKTsqL1xuXHRmb3IgKHZhciBpPTA7IGk8b2JqLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0aW1hZ2VzLnB1c2gob2JqLm5vZGVzW2ldLmltYWdlKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGltYWdlTG9hZGVkKCkge1xuXHRcdGxvYWRlZCsrO1xuXHRcdC8vY29uc29sZS5sb2coXCJJbWFnZSBsb2FkZWQuLlwiICsgbG9hZGVkICsgXCIvXCIgKyBpbWFnZXMubGVuZ3RoKTtcblx0XHR1cGRhdGVQcm9ncmVzcygpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlUHJvZ3Jlc3MoKSB7XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwcm9ncmVzc19iYXJcIikuc3R5bGUud2lkdGggPSAobG9hZGVkL2ltYWdlcy5sZW5ndGggKiAxMDApLnRvU3RyaW5nKCkgKyBcIiVcIjtcblx0XHQvL2NvbnNvbGUubG9nKFwidXBkYXRlIHByb2dyZXNzLi5cIik7XG5cdFx0aWYgKGxvYWRlZCA9PSBpbWFnZXMubGVuZ3RoKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcIkZpbmlzaGVkIHByZWxvYWRpbmcgaW1hZ2VzLi5cIik7XG5cdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInByb2dyZXNzXCIpLnN0eWxlLm9wYWNpdHkgPSBcIjBcIjtcblx0XHRcdH0sIDEwMCk7XG5cdFx0XHRjYWxsYmFjayhvYmopO1xuXHRcdH1cblx0fVxuXG5cdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwcm9ncmVzc1wiKS5zdHlsZS5vcGFjaXR5ID0gXCIxXCI7XG5cdH0sIDEwMCk7XG5cblx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHQvLyBwcmVsb2FkIGltYWdlXG5cdFx0Zm9yICh2YXIgbD0wOyBsPGltYWdlcy5sZW5ndGg7IGwrKykge1xuXHRcdFx0dmFyIGltZyA9IG5ldyBJbWFnZSgpO1xuXHRcdFx0aW1nLnNyYyA9IGltYWdlc1tsXTtcblx0XHRcdGltZy5vbmxvYWQgPSBpbWFnZUxvYWRlZDtcblx0XHR9XG5cdH0sIDUwKTtcbn0iLCJ2YXIgbG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXIuanMnKTtcbnZhciBlZGl0b3IgPSByZXF1aXJlKCcuL2VkaXRvci5qcycpO1xuXG4vL3ZhciBnYW1lcGF0aCA9IF9fZGlybmFtZSArICcvYXBwL2dhbWUvJztcblxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0Ly8gQ2hlY2sgZm9yIHRoZSB2YXJpb3VzIEZpbGUgQVBJIHN1cHBvcnQuXG5cdGlmICh3aW5kb3cuRmlsZSAmJiB3aW5kb3cuRmlsZVJlYWRlciAmJiB3aW5kb3cuRmlsZUxpc3QgJiYgd2luZG93LkJsb2IpIHtcblx0ICAvLyBHcmVhdCBzdWNjZXNzISBBbGwgdGhlIEZpbGUgQVBJcyBhcmUgc3VwcG9ydGVkLlxuXHR9IGVsc2Uge1xuXHQgIGFsZXJ0KCdUaGUgRmlsZSBBUElzIGFyZSBub3QgZnVsbHkgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3Nlci4nKTtcblx0fVxuXHQvL2RvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2F2ZVwiKTtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNsb2FkanNvblwiKS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0bG9hZGVyLmxvYWRKU09OKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZmlsZXBhdGhcIikudmFsdWUsIGVkaXRvci5pbml0KTtcblx0fTtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNsb2FkXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRsb2FkZXIubG9hZChlZGl0b3IuaW5pdCk7XG5cdH07XG5cdGxvYWRlci5sb2FkKGVkaXRvci5pbml0KTtcbn07IiwiLyohXG4gICAgbG9jYWxGb3JhZ2UgLS0gT2ZmbGluZSBTdG9yYWdlLCBJbXByb3ZlZFxuICAgIFZlcnNpb24gMS4zLjBcbiAgICBodHRwczovL21vemlsbGEuZ2l0aHViLmlvL2xvY2FsRm9yYWdlXG4gICAgKGMpIDIwMTMtMjAxNSBNb3ppbGxhLCBBcGFjaGUgTGljZW5zZSAyLjBcbiovXG4oZnVuY3Rpb24oKSB7XG52YXIgZGVmaW5lLCByZXF1aXJlTW9kdWxlLCByZXF1aXJlLCByZXF1aXJlanM7XG5cbihmdW5jdGlvbigpIHtcbiAgdmFyIHJlZ2lzdHJ5ID0ge30sIHNlZW4gPSB7fTtcblxuICBkZWZpbmUgPSBmdW5jdGlvbihuYW1lLCBkZXBzLCBjYWxsYmFjaykge1xuICAgIHJlZ2lzdHJ5W25hbWVdID0geyBkZXBzOiBkZXBzLCBjYWxsYmFjazogY2FsbGJhY2sgfTtcbiAgfTtcblxuICByZXF1aXJlanMgPSByZXF1aXJlID0gcmVxdWlyZU1vZHVsZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmVxdWlyZWpzLl9lYWtfc2VlbiA9IHJlZ2lzdHJ5O1xuXG4gICAgaWYgKHNlZW5bbmFtZV0pIHsgcmV0dXJuIHNlZW5bbmFtZV07IH1cbiAgICBzZWVuW25hbWVdID0ge307XG5cbiAgICBpZiAoIXJlZ2lzdHJ5W25hbWVdKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgZmluZCBtb2R1bGUgXCIgKyBuYW1lKTtcbiAgICB9XG5cbiAgICB2YXIgbW9kID0gcmVnaXN0cnlbbmFtZV0sXG4gICAgICAgIGRlcHMgPSBtb2QuZGVwcyxcbiAgICAgICAgY2FsbGJhY2sgPSBtb2QuY2FsbGJhY2ssXG4gICAgICAgIHJlaWZpZWQgPSBbXSxcbiAgICAgICAgZXhwb3J0cztcblxuICAgIGZvciAodmFyIGk9MCwgbD1kZXBzLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgIGlmIChkZXBzW2ldID09PSAnZXhwb3J0cycpIHtcbiAgICAgICAgcmVpZmllZC5wdXNoKGV4cG9ydHMgPSB7fSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWlmaWVkLnB1c2gocmVxdWlyZU1vZHVsZShyZXNvbHZlKGRlcHNbaV0pKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHZhbHVlID0gY2FsbGJhY2suYXBwbHkodGhpcywgcmVpZmllZCk7XG4gICAgcmV0dXJuIHNlZW5bbmFtZV0gPSBleHBvcnRzIHx8IHZhbHVlO1xuXG4gICAgZnVuY3Rpb24gcmVzb2x2ZShjaGlsZCkge1xuICAgICAgaWYgKGNoaWxkLmNoYXJBdCgwKSAhPT0gJy4nKSB7IHJldHVybiBjaGlsZDsgfVxuICAgICAgdmFyIHBhcnRzID0gY2hpbGQuc3BsaXQoXCIvXCIpO1xuICAgICAgdmFyIHBhcmVudEJhc2UgPSBuYW1lLnNwbGl0KFwiL1wiKS5zbGljZSgwLCAtMSk7XG5cbiAgICAgIGZvciAodmFyIGk9MCwgbD1wYXJ0cy5sZW5ndGg7IGk8bDsgaSsrKSB7XG4gICAgICAgIHZhciBwYXJ0ID0gcGFydHNbaV07XG5cbiAgICAgICAgaWYgKHBhcnQgPT09ICcuLicpIHsgcGFyZW50QmFzZS5wb3AoKTsgfVxuICAgICAgICBlbHNlIGlmIChwYXJ0ID09PSAnLicpIHsgY29udGludWU7IH1cbiAgICAgICAgZWxzZSB7IHBhcmVudEJhc2UucHVzaChwYXJ0KTsgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcGFyZW50QmFzZS5qb2luKFwiL1wiKTtcbiAgICB9XG4gIH07XG59KSgpO1xuXG5kZWZpbmUoXCJwcm9taXNlL2FsbFwiLCBcbiAgW1wiLi91dGlsc1wiLFwiZXhwb3J0c1wiXSxcbiAgZnVuY3Rpb24oX19kZXBlbmRlbmN5MV9fLCBfX2V4cG9ydHNfXykge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIC8qIGdsb2JhbCB0b1N0cmluZyAqL1xuXG4gICAgdmFyIGlzQXJyYXkgPSBfX2RlcGVuZGVuY3kxX18uaXNBcnJheTtcbiAgICB2YXIgaXNGdW5jdGlvbiA9IF9fZGVwZW5kZW5jeTFfXy5pc0Z1bmN0aW9uO1xuXG4gICAgLyoqXG4gICAgICBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGlzIGZ1bGZpbGxlZCB3aGVuIGFsbCB0aGUgZ2l2ZW4gcHJvbWlzZXMgaGF2ZSBiZWVuXG4gICAgICBmdWxmaWxsZWQsIG9yIHJlamVjdGVkIGlmIGFueSBvZiB0aGVtIGJlY29tZSByZWplY3RlZC4gVGhlIHJldHVybiBwcm9taXNlXG4gICAgICBpcyBmdWxmaWxsZWQgd2l0aCBhbiBhcnJheSB0aGF0IGdpdmVzIGFsbCB0aGUgdmFsdWVzIGluIHRoZSBvcmRlciB0aGV5IHdlcmVcbiAgICAgIHBhc3NlZCBpbiB0aGUgYHByb21pc2VzYCBhcnJheSBhcmd1bWVudC5cblxuICAgICAgRXhhbXBsZTpcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgdmFyIHByb21pc2UxID0gUlNWUC5yZXNvbHZlKDEpO1xuICAgICAgdmFyIHByb21pc2UyID0gUlNWUC5yZXNvbHZlKDIpO1xuICAgICAgdmFyIHByb21pc2UzID0gUlNWUC5yZXNvbHZlKDMpO1xuICAgICAgdmFyIHByb21pc2VzID0gWyBwcm9taXNlMSwgcHJvbWlzZTIsIHByb21pc2UzIF07XG5cbiAgICAgIFJTVlAuYWxsKHByb21pc2VzKS50aGVuKGZ1bmN0aW9uKGFycmF5KXtcbiAgICAgICAgLy8gVGhlIGFycmF5IGhlcmUgd291bGQgYmUgWyAxLCAyLCAzIF07XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBJZiBhbnkgb2YgdGhlIGBwcm9taXNlc2AgZ2l2ZW4gdG8gYFJTVlAuYWxsYCBhcmUgcmVqZWN0ZWQsIHRoZSBmaXJzdCBwcm9taXNlXG4gICAgICB0aGF0IGlzIHJlamVjdGVkIHdpbGwgYmUgZ2l2ZW4gYXMgYW4gYXJndW1lbnQgdG8gdGhlIHJldHVybmVkIHByb21pc2VzJ3NcbiAgICAgIHJlamVjdGlvbiBoYW5kbGVyLiBGb3IgZXhhbXBsZTpcblxuICAgICAgRXhhbXBsZTpcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgdmFyIHByb21pc2UxID0gUlNWUC5yZXNvbHZlKDEpO1xuICAgICAgdmFyIHByb21pc2UyID0gUlNWUC5yZWplY3QobmV3IEVycm9yKFwiMlwiKSk7XG4gICAgICB2YXIgcHJvbWlzZTMgPSBSU1ZQLnJlamVjdChuZXcgRXJyb3IoXCIzXCIpKTtcbiAgICAgIHZhciBwcm9taXNlcyA9IFsgcHJvbWlzZTEsIHByb21pc2UyLCBwcm9taXNlMyBdO1xuXG4gICAgICBSU1ZQLmFsbChwcm9taXNlcykudGhlbihmdW5jdGlvbihhcnJheSl7XG4gICAgICAgIC8vIENvZGUgaGVyZSBuZXZlciBydW5zIGJlY2F1c2UgdGhlcmUgYXJlIHJlamVjdGVkIHByb21pc2VzIVxuICAgICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgLy8gZXJyb3IubWVzc2FnZSA9PT0gXCIyXCJcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEBtZXRob2QgYWxsXG4gICAgICBAZm9yIFJTVlBcbiAgICAgIEBwYXJhbSB7QXJyYXl9IHByb21pc2VzXG4gICAgICBAcGFyYW0ge1N0cmluZ30gbGFiZWxcbiAgICAgIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgdGhhdCBpcyBmdWxmaWxsZWQgd2hlbiBhbGwgYHByb21pc2VzYCBoYXZlIGJlZW5cbiAgICAgIGZ1bGZpbGxlZCwgb3IgcmVqZWN0ZWQgaWYgYW55IG9mIHRoZW0gYmVjb21lIHJlamVjdGVkLlxuICAgICovXG4gICAgZnVuY3Rpb24gYWxsKHByb21pc2VzKSB7XG4gICAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgICAgdmFyIFByb21pc2UgPSB0aGlzO1xuXG4gICAgICBpZiAoIWlzQXJyYXkocHJvbWlzZXMpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYW4gYXJyYXkgdG8gYWxsLicpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciByZXN1bHRzID0gW10sIHJlbWFpbmluZyA9IHByb21pc2VzLmxlbmd0aCxcbiAgICAgICAgcHJvbWlzZTtcblxuICAgICAgICBpZiAocmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgICAgcmVzb2x2ZShbXSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiByZXNvbHZlcihpbmRleCkge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgcmVzb2x2ZUFsbChpbmRleCwgdmFsdWUpO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiByZXNvbHZlQWxsKGluZGV4LCB2YWx1ZSkge1xuICAgICAgICAgIHJlc3VsdHNbaW5kZXhdID0gdmFsdWU7XG4gICAgICAgICAgaWYgKC0tcmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgICAgICByZXNvbHZlKHJlc3VsdHMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvbWlzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBwcm9taXNlID0gcHJvbWlzZXNbaV07XG5cbiAgICAgICAgICBpZiAocHJvbWlzZSAmJiBpc0Z1bmN0aW9uKHByb21pc2UudGhlbikpIHtcbiAgICAgICAgICAgIHByb21pc2UudGhlbihyZXNvbHZlcihpKSwgcmVqZWN0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzb2x2ZUFsbChpLCBwcm9taXNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIF9fZXhwb3J0c19fLmFsbCA9IGFsbDtcbiAgfSk7XG5kZWZpbmUoXCJwcm9taXNlL2FzYXBcIiwgXG4gIFtcImV4cG9ydHNcIl0sXG4gIGZ1bmN0aW9uKF9fZXhwb3J0c19fKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIGJyb3dzZXJHbG9iYWwgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpID8gd2luZG93IDoge307XG4gICAgdmFyIEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID0gYnJvd3Nlckdsb2JhbC5NdXRhdGlvbk9ic2VydmVyIHx8IGJyb3dzZXJHbG9iYWwuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtcbiAgICB2YXIgbG9jYWwgPSAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpID8gZ2xvYmFsIDogKHRoaXMgPT09IHVuZGVmaW5lZD8gd2luZG93OnRoaXMpO1xuXG4gICAgLy8gbm9kZVxuICAgIGZ1bmN0aW9uIHVzZU5leHRUaWNrKCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGZsdXNoKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdXNlTXV0YXRpb25PYnNlcnZlcigpIHtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHZhciBvYnNlcnZlciA9IG5ldyBCcm93c2VyTXV0YXRpb25PYnNlcnZlcihmbHVzaCk7XG4gICAgICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0pO1xuXG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIG5vZGUuZGF0YSA9IChpdGVyYXRpb25zID0gKytpdGVyYXRpb25zICUgMik7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVzZVNldFRpbWVvdXQoKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGxvY2FsLnNldFRpbWVvdXQoZmx1c2gsIDEpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgcXVldWUgPSBbXTtcbiAgICBmdW5jdGlvbiBmbHVzaCgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHR1cGxlID0gcXVldWVbaV07XG4gICAgICAgIHZhciBjYWxsYmFjayA9IHR1cGxlWzBdLCBhcmcgPSB0dXBsZVsxXTtcbiAgICAgICAgY2FsbGJhY2soYXJnKTtcbiAgICAgIH1cbiAgICAgIHF1ZXVlID0gW107XG4gICAgfVxuXG4gICAgdmFyIHNjaGVkdWxlRmx1c2g7XG5cbiAgICAvLyBEZWNpZGUgd2hhdCBhc3luYyBtZXRob2QgdG8gdXNlIHRvIHRyaWdnZXJpbmcgcHJvY2Vzc2luZyBvZiBxdWV1ZWQgY2FsbGJhY2tzOlxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYge30udG9TdHJpbmcuY2FsbChwcm9jZXNzKSA9PT0gJ1tvYmplY3QgcHJvY2Vzc10nKSB7XG4gICAgICBzY2hlZHVsZUZsdXNoID0gdXNlTmV4dFRpY2soKTtcbiAgICB9IGVsc2UgaWYgKEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICBzY2hlZHVsZUZsdXNoID0gdXNlTXV0YXRpb25PYnNlcnZlcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzY2hlZHVsZUZsdXNoID0gdXNlU2V0VGltZW91dCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFzYXAoY2FsbGJhY2ssIGFyZykge1xuICAgICAgdmFyIGxlbmd0aCA9IHF1ZXVlLnB1c2goW2NhbGxiYWNrLCBhcmddKTtcbiAgICAgIGlmIChsZW5ndGggPT09IDEpIHtcbiAgICAgICAgLy8gSWYgbGVuZ3RoIGlzIDEsIHRoYXQgbWVhbnMgdGhhdCB3ZSBuZWVkIHRvIHNjaGVkdWxlIGFuIGFzeW5jIGZsdXNoLlxuICAgICAgICAvLyBJZiBhZGRpdGlvbmFsIGNhbGxiYWNrcyBhcmUgcXVldWVkIGJlZm9yZSB0aGUgcXVldWUgaXMgZmx1c2hlZCwgdGhleVxuICAgICAgICAvLyB3aWxsIGJlIHByb2Nlc3NlZCBieSB0aGlzIGZsdXNoIHRoYXQgd2UgYXJlIHNjaGVkdWxpbmcuXG4gICAgICAgIHNjaGVkdWxlRmx1c2goKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBfX2V4cG9ydHNfXy5hc2FwID0gYXNhcDtcbiAgfSk7XG5kZWZpbmUoXCJwcm9taXNlL2NvbmZpZ1wiLCBcbiAgW1wiZXhwb3J0c1wiXSxcbiAgZnVuY3Rpb24oX19leHBvcnRzX18pIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgY29uZmlnID0ge1xuICAgICAgaW5zdHJ1bWVudDogZmFsc2VcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gY29uZmlndXJlKG5hbWUsIHZhbHVlKSB7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgICAgICBjb25maWdbbmFtZV0gPSB2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBjb25maWdbbmFtZV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgX19leHBvcnRzX18uY29uZmlnID0gY29uZmlnO1xuICAgIF9fZXhwb3J0c19fLmNvbmZpZ3VyZSA9IGNvbmZpZ3VyZTtcbiAgfSk7XG5kZWZpbmUoXCJwcm9taXNlL3BvbHlmaWxsXCIsIFxuICBbXCIuL3Byb21pc2VcIixcIi4vdXRpbHNcIixcImV4cG9ydHNcIl0sXG4gIGZ1bmN0aW9uKF9fZGVwZW5kZW5jeTFfXywgX19kZXBlbmRlbmN5Ml9fLCBfX2V4cG9ydHNfXykge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIC8qZ2xvYmFsIHNlbGYqL1xuICAgIHZhciBSU1ZQUHJvbWlzZSA9IF9fZGVwZW5kZW5jeTFfXy5Qcm9taXNlO1xuICAgIHZhciBpc0Z1bmN0aW9uID0gX19kZXBlbmRlbmN5Ml9fLmlzRnVuY3Rpb247XG5cbiAgICBmdW5jdGlvbiBwb2x5ZmlsbCgpIHtcbiAgICAgIHZhciBsb2NhbDtcblxuICAgICAgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGxvY2FsID0gZ2xvYmFsO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuZG9jdW1lbnQpIHtcbiAgICAgICAgbG9jYWwgPSB3aW5kb3c7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb2NhbCA9IHNlbGY7XG4gICAgICB9XG5cbiAgICAgIHZhciBlczZQcm9taXNlU3VwcG9ydCA9IFxuICAgICAgICBcIlByb21pc2VcIiBpbiBsb2NhbCAmJlxuICAgICAgICAvLyBTb21lIG9mIHRoZXNlIG1ldGhvZHMgYXJlIG1pc3NpbmcgZnJvbVxuICAgICAgICAvLyBGaXJlZm94L0Nocm9tZSBleHBlcmltZW50YWwgaW1wbGVtZW50YXRpb25zXG4gICAgICAgIFwicmVzb2x2ZVwiIGluIGxvY2FsLlByb21pc2UgJiZcbiAgICAgICAgXCJyZWplY3RcIiBpbiBsb2NhbC5Qcm9taXNlICYmXG4gICAgICAgIFwiYWxsXCIgaW4gbG9jYWwuUHJvbWlzZSAmJlxuICAgICAgICBcInJhY2VcIiBpbiBsb2NhbC5Qcm9taXNlICYmXG4gICAgICAgIC8vIE9sZGVyIHZlcnNpb24gb2YgdGhlIHNwZWMgaGFkIGEgcmVzb2x2ZXIgb2JqZWN0XG4gICAgICAgIC8vIGFzIHRoZSBhcmcgcmF0aGVyIHRoYW4gYSBmdW5jdGlvblxuICAgICAgICAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHJlc29sdmU7XG4gICAgICAgICAgbmV3IGxvY2FsLlByb21pc2UoZnVuY3Rpb24ocikgeyByZXNvbHZlID0gcjsgfSk7XG4gICAgICAgICAgcmV0dXJuIGlzRnVuY3Rpb24ocmVzb2x2ZSk7XG4gICAgICAgIH0oKSk7XG5cbiAgICAgIGlmICghZXM2UHJvbWlzZVN1cHBvcnQpIHtcbiAgICAgICAgbG9jYWwuUHJvbWlzZSA9IFJTVlBQcm9taXNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIF9fZXhwb3J0c19fLnBvbHlmaWxsID0gcG9seWZpbGw7XG4gIH0pO1xuZGVmaW5lKFwicHJvbWlzZS9wcm9taXNlXCIsIFxuICBbXCIuL2NvbmZpZ1wiLFwiLi91dGlsc1wiLFwiLi9hbGxcIixcIi4vcmFjZVwiLFwiLi9yZXNvbHZlXCIsXCIuL3JlamVjdFwiLFwiLi9hc2FwXCIsXCJleHBvcnRzXCJdLFxuICBmdW5jdGlvbihfX2RlcGVuZGVuY3kxX18sIF9fZGVwZW5kZW5jeTJfXywgX19kZXBlbmRlbmN5M19fLCBfX2RlcGVuZGVuY3k0X18sIF9fZGVwZW5kZW5jeTVfXywgX19kZXBlbmRlbmN5Nl9fLCBfX2RlcGVuZGVuY3k3X18sIF9fZXhwb3J0c19fKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIGNvbmZpZyA9IF9fZGVwZW5kZW5jeTFfXy5jb25maWc7XG4gICAgdmFyIGNvbmZpZ3VyZSA9IF9fZGVwZW5kZW5jeTFfXy5jb25maWd1cmU7XG4gICAgdmFyIG9iamVjdE9yRnVuY3Rpb24gPSBfX2RlcGVuZGVuY3kyX18ub2JqZWN0T3JGdW5jdGlvbjtcbiAgICB2YXIgaXNGdW5jdGlvbiA9IF9fZGVwZW5kZW5jeTJfXy5pc0Z1bmN0aW9uO1xuICAgIHZhciBub3cgPSBfX2RlcGVuZGVuY3kyX18ubm93O1xuICAgIHZhciBhbGwgPSBfX2RlcGVuZGVuY3kzX18uYWxsO1xuICAgIHZhciByYWNlID0gX19kZXBlbmRlbmN5NF9fLnJhY2U7XG4gICAgdmFyIHN0YXRpY1Jlc29sdmUgPSBfX2RlcGVuZGVuY3k1X18ucmVzb2x2ZTtcbiAgICB2YXIgc3RhdGljUmVqZWN0ID0gX19kZXBlbmRlbmN5Nl9fLnJlamVjdDtcbiAgICB2YXIgYXNhcCA9IF9fZGVwZW5kZW5jeTdfXy5hc2FwO1xuXG4gICAgdmFyIGNvdW50ZXIgPSAwO1xuXG4gICAgY29uZmlnLmFzeW5jID0gYXNhcDsgLy8gZGVmYXVsdCBhc3luYyBpcyBhc2FwO1xuXG4gICAgZnVuY3Rpb24gUHJvbWlzZShyZXNvbHZlcikge1xuICAgICAgaWYgKCFpc0Z1bmN0aW9uKHJlc29sdmVyKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGEgcmVzb2x2ZXIgZnVuY3Rpb24gYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZSBwcm9taXNlIGNvbnN0cnVjdG9yJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBQcm9taXNlKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRmFpbGVkIHRvIGNvbnN0cnVjdCAnUHJvbWlzZSc6IFBsZWFzZSB1c2UgdGhlICduZXcnIG9wZXJhdG9yLCB0aGlzIG9iamVjdCBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgY2FsbGVkIGFzIGEgZnVuY3Rpb24uXCIpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9zdWJzY3JpYmVycyA9IFtdO1xuXG4gICAgICBpbnZva2VSZXNvbHZlcihyZXNvbHZlciwgdGhpcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW52b2tlUmVzb2x2ZXIocmVzb2x2ZXIsIHByb21pc2UpIHtcbiAgICAgIGZ1bmN0aW9uIHJlc29sdmVQcm9taXNlKHZhbHVlKSB7XG4gICAgICAgIHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiByZWplY3RQcm9taXNlKHJlYXNvbikge1xuICAgICAgICByZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZXIocmVzb2x2ZVByb21pc2UsIHJlamVjdFByb21pc2UpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHJlamVjdFByb21pc2UoZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW52b2tlQ2FsbGJhY2soc2V0dGxlZCwgcHJvbWlzZSwgY2FsbGJhY2ssIGRldGFpbCkge1xuICAgICAgdmFyIGhhc0NhbGxiYWNrID0gaXNGdW5jdGlvbihjYWxsYmFjayksXG4gICAgICAgICAgdmFsdWUsIGVycm9yLCBzdWNjZWVkZWQsIGZhaWxlZDtcblxuICAgICAgaWYgKGhhc0NhbGxiYWNrKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdmFsdWUgPSBjYWxsYmFjayhkZXRhaWwpO1xuICAgICAgICAgIHN1Y2NlZWRlZCA9IHRydWU7XG4gICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgIGZhaWxlZCA9IHRydWU7XG4gICAgICAgICAgZXJyb3IgPSBlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IGRldGFpbDtcbiAgICAgICAgc3VjY2VlZGVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGhhbmRsZVRoZW5hYmxlKHByb21pc2UsIHZhbHVlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9IGVsc2UgaWYgKGhhc0NhbGxiYWNrICYmIHN1Y2NlZWRlZCkge1xuICAgICAgICByZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoZmFpbGVkKSB7XG4gICAgICAgIHJlamVjdChwcm9taXNlLCBlcnJvcik7XG4gICAgICB9IGVsc2UgaWYgKHNldHRsZWQgPT09IEZVTEZJTExFRCkge1xuICAgICAgICByZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoc2V0dGxlZCA9PT0gUkVKRUNURUQpIHtcbiAgICAgICAgcmVqZWN0KHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgUEVORElORyAgID0gdm9pZCAwO1xuICAgIHZhciBTRUFMRUQgICAgPSAwO1xuICAgIHZhciBGVUxGSUxMRUQgPSAxO1xuICAgIHZhciBSRUpFQ1RFRCAgPSAyO1xuXG4gICAgZnVuY3Rpb24gc3Vic2NyaWJlKHBhcmVudCwgY2hpbGQsIG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKSB7XG4gICAgICB2YXIgc3Vic2NyaWJlcnMgPSBwYXJlbnQuX3N1YnNjcmliZXJzO1xuICAgICAgdmFyIGxlbmd0aCA9IHN1YnNjcmliZXJzLmxlbmd0aDtcblxuICAgICAgc3Vic2NyaWJlcnNbbGVuZ3RoXSA9IGNoaWxkO1xuICAgICAgc3Vic2NyaWJlcnNbbGVuZ3RoICsgRlVMRklMTEVEXSA9IG9uRnVsZmlsbG1lbnQ7XG4gICAgICBzdWJzY3JpYmVyc1tsZW5ndGggKyBSRUpFQ1RFRF0gID0gb25SZWplY3Rpb247XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHVibGlzaChwcm9taXNlLCBzZXR0bGVkKSB7XG4gICAgICB2YXIgY2hpbGQsIGNhbGxiYWNrLCBzdWJzY3JpYmVycyA9IHByb21pc2UuX3N1YnNjcmliZXJzLCBkZXRhaWwgPSBwcm9taXNlLl9kZXRhaWw7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3Vic2NyaWJlcnMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgY2hpbGQgPSBzdWJzY3JpYmVyc1tpXTtcbiAgICAgICAgY2FsbGJhY2sgPSBzdWJzY3JpYmVyc1tpICsgc2V0dGxlZF07XG5cbiAgICAgICAgaW52b2tlQ2FsbGJhY2soc2V0dGxlZCwgY2hpbGQsIGNhbGxiYWNrLCBkZXRhaWwpO1xuICAgICAgfVxuXG4gICAgICBwcm9taXNlLl9zdWJzY3JpYmVycyA9IG51bGw7XG4gICAgfVxuXG4gICAgUHJvbWlzZS5wcm90b3R5cGUgPSB7XG4gICAgICBjb25zdHJ1Y3RvcjogUHJvbWlzZSxcblxuICAgICAgX3N0YXRlOiB1bmRlZmluZWQsXG4gICAgICBfZGV0YWlsOiB1bmRlZmluZWQsXG4gICAgICBfc3Vic2NyaWJlcnM6IHVuZGVmaW5lZCxcblxuICAgICAgdGhlbjogZnVuY3Rpb24ob25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgICAgICAgdmFyIHByb21pc2UgPSB0aGlzO1xuXG4gICAgICAgIHZhciB0aGVuUHJvbWlzZSA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKGZ1bmN0aW9uKCkge30pO1xuXG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZSkge1xuICAgICAgICAgIHZhciBjYWxsYmFja3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgY29uZmlnLmFzeW5jKGZ1bmN0aW9uIGludm9rZVByb21pc2VDYWxsYmFjaygpIHtcbiAgICAgICAgICAgIGludm9rZUNhbGxiYWNrKHByb21pc2UuX3N0YXRlLCB0aGVuUHJvbWlzZSwgY2FsbGJhY2tzW3Byb21pc2UuX3N0YXRlIC0gMV0sIHByb21pc2UuX2RldGFpbCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3Vic2NyaWJlKHRoaXMsIHRoZW5Qcm9taXNlLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhlblByb21pc2U7XG4gICAgICB9LFxuXG4gICAgICAnY2F0Y2gnOiBmdW5jdGlvbihvblJlamVjdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy50aGVuKG51bGwsIG9uUmVqZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgUHJvbWlzZS5hbGwgPSBhbGw7XG4gICAgUHJvbWlzZS5yYWNlID0gcmFjZTtcbiAgICBQcm9taXNlLnJlc29sdmUgPSBzdGF0aWNSZXNvbHZlO1xuICAgIFByb21pc2UucmVqZWN0ID0gc3RhdGljUmVqZWN0O1xuXG4gICAgZnVuY3Rpb24gaGFuZGxlVGhlbmFibGUocHJvbWlzZSwgdmFsdWUpIHtcbiAgICAgIHZhciB0aGVuID0gbnVsbCxcbiAgICAgIHJlc29sdmVkO1xuXG4gICAgICB0cnkge1xuICAgICAgICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQSBwcm9taXNlcyBjYWxsYmFjayBjYW5ub3QgcmV0dXJuIHRoYXQgc2FtZSBwcm9taXNlLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvYmplY3RPckZ1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgICAgIHRoZW4gPSB2YWx1ZS50aGVuO1xuXG4gICAgICAgICAgaWYgKGlzRnVuY3Rpb24odGhlbikpIHtcbiAgICAgICAgICAgIHRoZW4uY2FsbCh2YWx1ZSwgZnVuY3Rpb24odmFsKSB7XG4gICAgICAgICAgICAgIGlmIChyZXNvbHZlZCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgICByZXNvbHZlZCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB2YWwpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHByb21pc2UsIHZhbCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZnVsZmlsbChwcm9taXNlLCB2YWwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICAgICAgaWYgKHJlc29sdmVkKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICAgIHJlc29sdmVkID0gdHJ1ZTtcblxuICAgICAgICAgICAgICByZWplY3QocHJvbWlzZSwgdmFsKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICByZWplY3QocHJvbWlzZSwgZXJyb3IpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc29sdmUocHJvbWlzZSwgdmFsdWUpIHtcbiAgICAgIGlmIChwcm9taXNlID09PSB2YWx1ZSkge1xuICAgICAgICBmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoIWhhbmRsZVRoZW5hYmxlKHByb21pc2UsIHZhbHVlKSkge1xuICAgICAgICBmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmdWxmaWxsKHByb21pc2UsIHZhbHVlKSB7XG4gICAgICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IFBFTkRJTkcpIHsgcmV0dXJuOyB9XG4gICAgICBwcm9taXNlLl9zdGF0ZSA9IFNFQUxFRDtcbiAgICAgIHByb21pc2UuX2RldGFpbCA9IHZhbHVlO1xuXG4gICAgICBjb25maWcuYXN5bmMocHVibGlzaEZ1bGZpbGxtZW50LCBwcm9taXNlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWplY3QocHJvbWlzZSwgcmVhc29uKSB7XG4gICAgICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IFBFTkRJTkcpIHsgcmV0dXJuOyB9XG4gICAgICBwcm9taXNlLl9zdGF0ZSA9IFNFQUxFRDtcbiAgICAgIHByb21pc2UuX2RldGFpbCA9IHJlYXNvbjtcblxuICAgICAgY29uZmlnLmFzeW5jKHB1Ymxpc2hSZWplY3Rpb24sIHByb21pc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHB1Ymxpc2hGdWxmaWxsbWVudChwcm9taXNlKSB7XG4gICAgICBwdWJsaXNoKHByb21pc2UsIHByb21pc2UuX3N0YXRlID0gRlVMRklMTEVEKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwdWJsaXNoUmVqZWN0aW9uKHByb21pc2UpIHtcbiAgICAgIHB1Ymxpc2gocHJvbWlzZSwgcHJvbWlzZS5fc3RhdGUgPSBSRUpFQ1RFRCk7XG4gICAgfVxuXG4gICAgX19leHBvcnRzX18uUHJvbWlzZSA9IFByb21pc2U7XG4gIH0pO1xuZGVmaW5lKFwicHJvbWlzZS9yYWNlXCIsIFxuICBbXCIuL3V0aWxzXCIsXCJleHBvcnRzXCJdLFxuICBmdW5jdGlvbihfX2RlcGVuZGVuY3kxX18sIF9fZXhwb3J0c19fKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgLyogZ2xvYmFsIHRvU3RyaW5nICovXG4gICAgdmFyIGlzQXJyYXkgPSBfX2RlcGVuZGVuY3kxX18uaXNBcnJheTtcblxuICAgIC8qKlxuICAgICAgYFJTVlAucmFjZWAgYWxsb3dzIHlvdSB0byB3YXRjaCBhIHNlcmllcyBvZiBwcm9taXNlcyBhbmQgYWN0IGFzIHNvb24gYXMgdGhlXG4gICAgICBmaXJzdCBwcm9taXNlIGdpdmVuIHRvIHRoZSBgcHJvbWlzZXNgIGFyZ3VtZW50IGZ1bGZpbGxzIG9yIHJlamVjdHMuXG5cbiAgICAgIEV4YW1wbGU6XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIHZhciBwcm9taXNlMSA9IG5ldyBSU1ZQLlByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgIHJlc29sdmUoXCJwcm9taXNlIDFcIik7XG4gICAgICAgIH0sIDIwMCk7XG4gICAgICB9KTtcblxuICAgICAgdmFyIHByb21pc2UyID0gbmV3IFJTVlAuUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgcmVzb2x2ZShcInByb21pc2UgMlwiKTtcbiAgICAgICAgfSwgMTAwKTtcbiAgICAgIH0pO1xuXG4gICAgICBSU1ZQLnJhY2UoW3Byb21pc2UxLCBwcm9taXNlMl0pLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtcbiAgICAgICAgLy8gcmVzdWx0ID09PSBcInByb21pc2UgMlwiIGJlY2F1c2UgaXQgd2FzIHJlc29sdmVkIGJlZm9yZSBwcm9taXNlMVxuICAgICAgICAvLyB3YXMgcmVzb2x2ZWQuXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBgUlNWUC5yYWNlYCBpcyBkZXRlcm1pbmlzdGljIGluIHRoYXQgb25seSB0aGUgc3RhdGUgb2YgdGhlIGZpcnN0IGNvbXBsZXRlZFxuICAgICAgcHJvbWlzZSBtYXR0ZXJzLiBGb3IgZXhhbXBsZSwgZXZlbiBpZiBvdGhlciBwcm9taXNlcyBnaXZlbiB0byB0aGUgYHByb21pc2VzYFxuICAgICAgYXJyYXkgYXJndW1lbnQgYXJlIHJlc29sdmVkLCBidXQgdGhlIGZpcnN0IGNvbXBsZXRlZCBwcm9taXNlIGhhcyBiZWNvbWVcbiAgICAgIHJlamVjdGVkIGJlZm9yZSB0aGUgb3RoZXIgcHJvbWlzZXMgYmVjYW1lIGZ1bGZpbGxlZCwgdGhlIHJldHVybmVkIHByb21pc2VcbiAgICAgIHdpbGwgYmVjb21lIHJlamVjdGVkOlxuXG4gICAgICBgYGBqYXZhc2NyaXB0XG4gICAgICB2YXIgcHJvbWlzZTEgPSBuZXcgUlNWUC5Qcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICByZXNvbHZlKFwicHJvbWlzZSAxXCIpO1xuICAgICAgICB9LCAyMDApO1xuICAgICAgfSk7XG5cbiAgICAgIHZhciBwcm9taXNlMiA9IG5ldyBSU1ZQLlByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJwcm9taXNlIDJcIikpO1xuICAgICAgICB9LCAxMDApO1xuICAgICAgfSk7XG5cbiAgICAgIFJTVlAucmFjZShbcHJvbWlzZTEsIHByb21pc2UyXSkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgICAgICAvLyBDb2RlIGhlcmUgbmV2ZXIgcnVucyBiZWNhdXNlIHRoZXJlIGFyZSByZWplY3RlZCBwcm9taXNlcyFcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSBcInByb21pc2UyXCIgYmVjYXVzZSBwcm9taXNlIDIgYmVjYW1lIHJlamVjdGVkIGJlZm9yZVxuICAgICAgICAvLyBwcm9taXNlIDEgYmVjYW1lIGZ1bGZpbGxlZFxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQG1ldGhvZCByYWNlXG4gICAgICBAZm9yIFJTVlBcbiAgICAgIEBwYXJhbSB7QXJyYXl9IHByb21pc2VzIGFycmF5IG9mIHByb21pc2VzIHRvIG9ic2VydmVcbiAgICAgIEBwYXJhbSB7U3RyaW5nfSBsYWJlbCBvcHRpb25hbCBzdHJpbmcgZm9yIGRlc2NyaWJpbmcgdGhlIHByb21pc2UgcmV0dXJuZWQuXG4gICAgICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gICAgICBAcmV0dXJuIHtQcm9taXNlfSBhIHByb21pc2UgdGhhdCBiZWNvbWVzIGZ1bGZpbGxlZCB3aXRoIHRoZSB2YWx1ZSB0aGUgZmlyc3RcbiAgICAgIGNvbXBsZXRlZCBwcm9taXNlcyBpcyByZXNvbHZlZCB3aXRoIGlmIHRoZSBmaXJzdCBjb21wbGV0ZWQgcHJvbWlzZSB3YXNcbiAgICAgIGZ1bGZpbGxlZCwgb3IgcmVqZWN0ZWQgd2l0aCB0aGUgcmVhc29uIHRoYXQgdGhlIGZpcnN0IGNvbXBsZXRlZCBwcm9taXNlXG4gICAgICB3YXMgcmVqZWN0ZWQgd2l0aC5cbiAgICAqL1xuICAgIGZ1bmN0aW9uIHJhY2UocHJvbWlzZXMpIHtcbiAgICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgICB2YXIgUHJvbWlzZSA9IHRoaXM7XG5cbiAgICAgIGlmICghaXNBcnJheShwcm9taXNlcykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhbiBhcnJheSB0byByYWNlLicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdLCBwcm9taXNlO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvbWlzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBwcm9taXNlID0gcHJvbWlzZXNbaV07XG5cbiAgICAgICAgICBpZiAocHJvbWlzZSAmJiB0eXBlb2YgcHJvbWlzZS50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBwcm9taXNlLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzb2x2ZShwcm9taXNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIF9fZXhwb3J0c19fLnJhY2UgPSByYWNlO1xuICB9KTtcbmRlZmluZShcInByb21pc2UvcmVqZWN0XCIsIFxuICBbXCJleHBvcnRzXCJdLFxuICBmdW5jdGlvbihfX2V4cG9ydHNfXykge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIC8qKlxuICAgICAgYFJTVlAucmVqZWN0YCByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHdpbGwgYmVjb21lIHJlamVjdGVkIHdpdGggdGhlIHBhc3NlZFxuICAgICAgYHJlYXNvbmAuIGBSU1ZQLnJlamVjdGAgaXMgZXNzZW50aWFsbHkgc2hvcnRoYW5kIGZvciB0aGUgZm9sbG93aW5nOlxuXG4gICAgICBgYGBqYXZhc2NyaXB0XG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBSU1ZQLlByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignV0hPT1BTJykpO1xuICAgICAgfSk7XG5cbiAgICAgIHByb21pc2UudGhlbihmdW5jdGlvbih2YWx1ZSl7XG4gICAgICAgIC8vIENvZGUgaGVyZSBkb2Vzbid0IHJ1biBiZWNhdXNlIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIVxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gcmVhc29uLm1lc3NhZ2UgPT09ICdXSE9PUFMnXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBJbnN0ZWFkIG9mIHdyaXRpbmcgdGhlIGFib3ZlLCB5b3VyIGNvZGUgbm93IHNpbXBseSBiZWNvbWVzIHRoZSBmb2xsb3dpbmc6XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIHZhciBwcm9taXNlID0gUlNWUC5yZWplY3QobmV3IEVycm9yKCdXSE9PUFMnKSk7XG5cbiAgICAgIHByb21pc2UudGhlbihmdW5jdGlvbih2YWx1ZSl7XG4gICAgICAgIC8vIENvZGUgaGVyZSBkb2Vzbid0IHJ1biBiZWNhdXNlIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIVxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gcmVhc29uLm1lc3NhZ2UgPT09ICdXSE9PUFMnXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBAbWV0aG9kIHJlamVjdFxuICAgICAgQGZvciBSU1ZQXG4gICAgICBAcGFyYW0ge0FueX0gcmVhc29uIHZhbHVlIHRoYXQgdGhlIHJldHVybmVkIHByb21pc2Ugd2lsbCBiZSByZWplY3RlZCB3aXRoLlxuICAgICAgQHBhcmFtIHtTdHJpbmd9IGxhYmVsIG9wdGlvbmFsIHN0cmluZyBmb3IgaWRlbnRpZnlpbmcgdGhlIHJldHVybmVkIHByb21pc2UuXG4gICAgICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gICAgICBAcmV0dXJuIHtQcm9taXNlfSBhIHByb21pc2UgdGhhdCB3aWxsIGJlY29tZSByZWplY3RlZCB3aXRoIHRoZSBnaXZlblxuICAgICAgYHJlYXNvbmAuXG4gICAgKi9cbiAgICBmdW5jdGlvbiByZWplY3QocmVhc29uKSB7XG4gICAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgICAgdmFyIFByb21pc2UgPSB0aGlzO1xuXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICByZWplY3QocmVhc29uKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIF9fZXhwb3J0c19fLnJlamVjdCA9IHJlamVjdDtcbiAgfSk7XG5kZWZpbmUoXCJwcm9taXNlL3Jlc29sdmVcIiwgXG4gIFtcImV4cG9ydHNcIl0sXG4gIGZ1bmN0aW9uKF9fZXhwb3J0c19fKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgZnVuY3Rpb24gcmVzb2x2ZSh2YWx1ZSkge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlLmNvbnN0cnVjdG9yID09PSB0aGlzKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cblxuICAgICAgdmFyIFByb21pc2UgPSB0aGlzO1xuXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgICByZXNvbHZlKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIF9fZXhwb3J0c19fLnJlc29sdmUgPSByZXNvbHZlO1xuICB9KTtcbmRlZmluZShcInByb21pc2UvdXRpbHNcIiwgXG4gIFtcImV4cG9ydHNcIl0sXG4gIGZ1bmN0aW9uKF9fZXhwb3J0c19fKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgZnVuY3Rpb24gb2JqZWN0T3JGdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gaXNGdW5jdGlvbih4KSB8fCAodHlwZW9mIHggPT09IFwib2JqZWN0XCIgJiYgeCAhPT0gbnVsbCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNGdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHggPT09IFwiZnVuY3Rpb25cIjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0FycmF5KHgpIHtcbiAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeCkgPT09IFwiW29iamVjdCBBcnJheV1cIjtcbiAgICB9XG5cbiAgICAvLyBEYXRlLm5vdyBpcyBub3QgYXZhaWxhYmxlIGluIGJyb3dzZXJzIDwgSUU5XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvRGF0ZS9ub3cjQ29tcGF0aWJpbGl0eVxuICAgIHZhciBub3cgPSBEYXRlLm5vdyB8fCBmdW5jdGlvbigpIHsgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpOyB9O1xuXG5cbiAgICBfX2V4cG9ydHNfXy5vYmplY3RPckZ1bmN0aW9uID0gb2JqZWN0T3JGdW5jdGlvbjtcbiAgICBfX2V4cG9ydHNfXy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcbiAgICBfX2V4cG9ydHNfXy5pc0FycmF5ID0gaXNBcnJheTtcbiAgICBfX2V4cG9ydHNfXy5ub3cgPSBub3c7XG4gIH0pO1xucmVxdWlyZU1vZHVsZSgncHJvbWlzZS9wb2x5ZmlsbCcpLnBvbHlmaWxsKCk7XG59KCkpOyhmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcImxvY2FsZm9yYWdlXCJdID0gZmFjdG9yeSgpO1xuXHRlbHNlXG5cdFx0cm9vdFtcImxvY2FsZm9yYWdlXCJdID0gZmFjdG9yeSgpO1xufSkodGhpcywgZnVuY3Rpb24oKSB7XG5yZXR1cm4gLyoqKioqKi8gKGZ1bmN0aW9uKG1vZHVsZXMpIHsgLy8gd2VicGFja0Jvb3RzdHJhcFxuLyoqKioqKi8gXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbi8qKioqKiovIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbi8qKioqKiovIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4vKioqKioqLyBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4vKioqKioqLyBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4vKioqKioqLyBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuLyoqKioqKi8gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4vKioqKioqLyBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuLyoqKioqKi8gXHRcdFx0ZXhwb3J0czoge30sXG4vKioqKioqLyBcdFx0XHRpZDogbW9kdWxlSWQsXG4vKioqKioqLyBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4vKioqKioqLyBcdFx0fTtcblxuLyoqKioqKi8gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuLyoqKioqKi8gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4vKioqKioqLyBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuLyoqKioqKi8gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4vKioqKioqLyBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbi8qKioqKiovIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4vKioqKioqLyBcdH1cblxuXG4vKioqKioqLyBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbi8qKioqKiovIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuLyoqKioqKi8gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4vKioqKioqLyBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLyoqKioqKi8gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcbi8qKioqKiovIH0pXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKioqKi8gKFtcbi8qIDAgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHRleHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5cdGZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5cdChmdW5jdGlvbiAoKSB7XG5cdCAgICAndXNlIHN0cmljdCc7XG5cblx0ICAgIC8vIEN1c3RvbSBkcml2ZXJzIGFyZSBzdG9yZWQgaGVyZSB3aGVuIGBkZWZpbmVEcml2ZXIoKWAgaXMgY2FsbGVkLlxuXHQgICAgLy8gVGhleSBhcmUgc2hhcmVkIGFjcm9zcyBhbGwgaW5zdGFuY2VzIG9mIGxvY2FsRm9yYWdlLlxuXHQgICAgdmFyIEN1c3RvbURyaXZlcnMgPSB7fTtcblxuXHQgICAgdmFyIERyaXZlclR5cGUgPSB7XG5cdCAgICAgICAgSU5ERVhFRERCOiAnYXN5bmNTdG9yYWdlJyxcblx0ICAgICAgICBMT0NBTFNUT1JBR0U6ICdsb2NhbFN0b3JhZ2VXcmFwcGVyJyxcblx0ICAgICAgICBXRUJTUUw6ICd3ZWJTUUxTdG9yYWdlJ1xuXHQgICAgfTtcblxuXHQgICAgdmFyIERlZmF1bHREcml2ZXJPcmRlciA9IFtEcml2ZXJUeXBlLklOREVYRUREQiwgRHJpdmVyVHlwZS5XRUJTUUwsIERyaXZlclR5cGUuTE9DQUxTVE9SQUdFXTtcblxuXHQgICAgdmFyIExpYnJhcnlNZXRob2RzID0gWydjbGVhcicsICdnZXRJdGVtJywgJ2l0ZXJhdGUnLCAna2V5JywgJ2tleXMnLCAnbGVuZ3RoJywgJ3JlbW92ZUl0ZW0nLCAnc2V0SXRlbSddO1xuXG5cdCAgICB2YXIgRGVmYXVsdENvbmZpZyA9IHtcblx0ICAgICAgICBkZXNjcmlwdGlvbjogJycsXG5cdCAgICAgICAgZHJpdmVyOiBEZWZhdWx0RHJpdmVyT3JkZXIuc2xpY2UoKSxcblx0ICAgICAgICBuYW1lOiAnbG9jYWxmb3JhZ2UnLFxuXHQgICAgICAgIC8vIERlZmF1bHQgREIgc2l6ZSBpcyBfSlVTVCBVTkRFUl8gNU1CLCBhcyBpdCdzIHRoZSBoaWdoZXN0IHNpemVcblx0ICAgICAgICAvLyB3ZSBjYW4gdXNlIHdpdGhvdXQgYSBwcm9tcHQuXG5cdCAgICAgICAgc2l6ZTogNDk4MDczNixcblx0ICAgICAgICBzdG9yZU5hbWU6ICdrZXl2YWx1ZXBhaXJzJyxcblx0ICAgICAgICB2ZXJzaW9uOiAxLjBcblx0ICAgIH07XG5cblx0ICAgIC8vIENoZWNrIHRvIHNlZSBpZiBJbmRleGVkREIgaXMgYXZhaWxhYmxlIGFuZCBpZiBpdCBpcyB0aGUgbGF0ZXN0XG5cdCAgICAvLyBpbXBsZW1lbnRhdGlvbjsgaXQncyBvdXIgcHJlZmVycmVkIGJhY2tlbmQgbGlicmFyeS4gV2UgdXNlIFwiX3NwZWNfdGVzdFwiXG5cdCAgICAvLyBhcyB0aGUgbmFtZSBvZiB0aGUgZGF0YWJhc2UgYmVjYXVzZSBpdCdzIG5vdCB0aGUgb25lIHdlJ2xsIG9wZXJhdGUgb24sXG5cdCAgICAvLyBidXQgaXQncyB1c2VmdWwgdG8gbWFrZSBzdXJlIGl0cyB1c2luZyB0aGUgcmlnaHQgc3BlYy5cblx0ICAgIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL21vemlsbGEvbG9jYWxGb3JhZ2UvaXNzdWVzLzEyOFxuXHQgICAgdmFyIGRyaXZlclN1cHBvcnQgPSAoZnVuY3Rpb24gKHNlbGYpIHtcblx0ICAgICAgICAvLyBJbml0aWFsaXplIEluZGV4ZWREQjsgZmFsbCBiYWNrIHRvIHZlbmRvci1wcmVmaXhlZCB2ZXJzaW9uc1xuXHQgICAgICAgIC8vIGlmIG5lZWRlZC5cblx0ICAgICAgICB2YXIgaW5kZXhlZERCID0gaW5kZXhlZERCIHx8IHNlbGYuaW5kZXhlZERCIHx8IHNlbGYud2Via2l0SW5kZXhlZERCIHx8IHNlbGYubW96SW5kZXhlZERCIHx8IHNlbGYuT0luZGV4ZWREQiB8fCBzZWxmLm1zSW5kZXhlZERCO1xuXG5cdCAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuXG5cdCAgICAgICAgcmVzdWx0W0RyaXZlclR5cGUuV0VCU1FMXSA9ICEhc2VsZi5vcGVuRGF0YWJhc2U7XG5cdCAgICAgICAgcmVzdWx0W0RyaXZlclR5cGUuSU5ERVhFRERCXSA9ICEhKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgLy8gV2UgbWltaWMgUG91Y2hEQiBoZXJlOyBqdXN0IFVBIHRlc3QgZm9yIFNhZmFyaSAod2hpY2gsIGFzIG9mXG5cdCAgICAgICAgICAgIC8vIGlPUyA4L1lvc2VtaXRlLCBkb2Vzbid0IHByb3Blcmx5IHN1cHBvcnQgSW5kZXhlZERCKS5cblx0ICAgICAgICAgICAgLy8gSW5kZXhlZERCIHN1cHBvcnQgaXMgYnJva2VuIGFuZCBkaWZmZXJlbnQgZnJvbSBCbGluaydzLlxuXHQgICAgICAgICAgICAvLyBUaGlzIGlzIGZhc3RlciB0aGFuIHRoZSB0ZXN0IGNhc2UgKGFuZCBpdCdzIHN5bmMpLCBzbyB3ZSBqdXN0XG5cdCAgICAgICAgICAgIC8vIGRvIHRoaXMuICpTSUdIKlxuXHQgICAgICAgICAgICAvLyBodHRwOi8vYmwub2Nrcy5vcmcvbm9sYW5sYXdzb24vcmF3L2M4M2U5MDM5ZWRmMjI3ODA0N2U5L1xuXHQgICAgICAgICAgICAvL1xuXHQgICAgICAgICAgICAvLyBXZSB0ZXN0IGZvciBvcGVuRGF0YWJhc2UgYmVjYXVzZSBJRSBNb2JpbGUgaWRlbnRpZmllcyBpdHNlbGZcblx0ICAgICAgICAgICAgLy8gYXMgU2FmYXJpLiBPaCB0aGUgbHVsei4uLlxuXHQgICAgICAgICAgICBpZiAodHlwZW9mIHNlbGYub3BlbkRhdGFiYXNlICE9PSAndW5kZWZpbmVkJyAmJiBzZWxmLm5hdmlnYXRvciAmJiBzZWxmLm5hdmlnYXRvci51c2VyQWdlbnQgJiYgL1NhZmFyaS8udGVzdChzZWxmLm5hdmlnYXRvci51c2VyQWdlbnQpICYmICEvQ2hyb21lLy50ZXN0KHNlbGYubmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4ZWREQiAmJiB0eXBlb2YgaW5kZXhlZERCLm9wZW4gPT09ICdmdW5jdGlvbicgJiZcblx0ICAgICAgICAgICAgICAgIC8vIFNvbWUgU2Ftc3VuZy9IVEMgQW5kcm9pZCA0LjAtNC4zIGRldmljZXNcblx0ICAgICAgICAgICAgICAgIC8vIGhhdmUgb2xkZXIgSW5kZXhlZERCIHNwZWNzOyBpZiB0aGlzIGlzbid0IGF2YWlsYWJsZVxuXHQgICAgICAgICAgICAgICAgLy8gdGhlaXIgSW5kZXhlZERCIGlzIHRvbyBvbGQgZm9yIHVzIHRvIHVzZS5cblx0ICAgICAgICAgICAgICAgIC8vIChSZXBsYWNlcyB0aGUgb251cGdyYWRlbmVlZGVkIHRlc3QuKVxuXHQgICAgICAgICAgICAgICAgdHlwZW9mIHNlbGYuSURCS2V5UmFuZ2UgIT09ICd1bmRlZmluZWQnO1xuXHQgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9KSgpO1xuXG5cdCAgICAgICAgcmVzdWx0W0RyaXZlclR5cGUuTE9DQUxTVE9SQUdFXSA9ICEhKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmxvY2FsU3RvcmFnZSAmJiAnc2V0SXRlbScgaW4gc2VsZi5sb2NhbFN0b3JhZ2UgJiYgc2VsZi5sb2NhbFN0b3JhZ2Uuc2V0SXRlbTtcblx0ICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSkoKTtcblxuXHQgICAgICAgIHJldHVybiByZXN1bHQ7XG5cdCAgICB9KSh0aGlzKTtcblxuXHQgICAgdmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcmcpIHtcblx0ICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZykgPT09ICdbb2JqZWN0IEFycmF5XSc7XG5cdCAgICB9O1xuXG5cdCAgICBmdW5jdGlvbiBjYWxsV2hlblJlYWR5KGxvY2FsRm9yYWdlSW5zdGFuY2UsIGxpYnJhcnlNZXRob2QpIHtcblx0ICAgICAgICBsb2NhbEZvcmFnZUluc3RhbmNlW2xpYnJhcnlNZXRob2RdID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICB2YXIgX2FyZ3MgPSBhcmd1bWVudHM7XG5cdCAgICAgICAgICAgIHJldHVybiBsb2NhbEZvcmFnZUluc3RhbmNlLnJlYWR5KCkudGhlbihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gbG9jYWxGb3JhZ2VJbnN0YW5jZVtsaWJyYXJ5TWV0aG9kXS5hcHBseShsb2NhbEZvcmFnZUluc3RhbmNlLCBfYXJncyk7XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgIH07XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGV4dGVuZCgpIHtcblx0ICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICB2YXIgYXJnID0gYXJndW1lbnRzW2ldO1xuXG5cdCAgICAgICAgICAgIGlmIChhcmcpIHtcblx0ICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBhcmcpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZiAoYXJnLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzQXJyYXkoYXJnW2tleV0pKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHNbMF1ba2V5XSA9IGFyZ1trZXldLnNsaWNlKCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHNbMF1ba2V5XSA9IGFyZ1trZXldO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIGFyZ3VtZW50c1swXTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gaXNMaWJyYXJ5RHJpdmVyKGRyaXZlck5hbWUpIHtcblx0ICAgICAgICBmb3IgKHZhciBkcml2ZXIgaW4gRHJpdmVyVHlwZSkge1xuXHQgICAgICAgICAgICBpZiAoRHJpdmVyVHlwZS5oYXNPd25Qcm9wZXJ0eShkcml2ZXIpICYmIERyaXZlclR5cGVbZHJpdmVyXSA9PT0gZHJpdmVyTmFtZSkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICB9XG5cblx0ICAgIHZhciBMb2NhbEZvcmFnZSA9IChmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgZnVuY3Rpb24gTG9jYWxGb3JhZ2Uob3B0aW9ucykge1xuXHQgICAgICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTG9jYWxGb3JhZ2UpO1xuXG5cdCAgICAgICAgICAgIHRoaXMuSU5ERVhFRERCID0gRHJpdmVyVHlwZS5JTkRFWEVEREI7XG5cdCAgICAgICAgICAgIHRoaXMuTE9DQUxTVE9SQUdFID0gRHJpdmVyVHlwZS5MT0NBTFNUT1JBR0U7XG5cdCAgICAgICAgICAgIHRoaXMuV0VCU1FMID0gRHJpdmVyVHlwZS5XRUJTUUw7XG5cblx0ICAgICAgICAgICAgdGhpcy5fZGVmYXVsdENvbmZpZyA9IGV4dGVuZCh7fSwgRGVmYXVsdENvbmZpZyk7XG5cdCAgICAgICAgICAgIHRoaXMuX2NvbmZpZyA9IGV4dGVuZCh7fSwgdGhpcy5fZGVmYXVsdENvbmZpZywgb3B0aW9ucyk7XG5cdCAgICAgICAgICAgIHRoaXMuX2RyaXZlclNldCA9IG51bGw7XG5cdCAgICAgICAgICAgIHRoaXMuX2luaXREcml2ZXIgPSBudWxsO1xuXHQgICAgICAgICAgICB0aGlzLl9yZWFkeSA9IGZhbHNlO1xuXHQgICAgICAgICAgICB0aGlzLl9kYkluZm8gPSBudWxsO1xuXG5cdCAgICAgICAgICAgIHRoaXMuX3dyYXBMaWJyYXJ5TWV0aG9kc1dpdGhSZWFkeSgpO1xuXHQgICAgICAgICAgICB0aGlzLnNldERyaXZlcih0aGlzLl9jb25maWcuZHJpdmVyKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBUaGUgYWN0dWFsIGxvY2FsRm9yYWdlIG9iamVjdCB0aGF0IHdlIGV4cG9zZSBhcyBhIG1vZHVsZSBvciB2aWEgYVxuXHQgICAgICAgIC8vIGdsb2JhbC4gSXQncyBleHRlbmRlZCBieSBwdWxsaW5nIGluIG9uZSBvZiBvdXIgb3RoZXIgbGlicmFyaWVzLlxuXG5cdCAgICAgICAgLy8gU2V0IGFueSBjb25maWcgdmFsdWVzIGZvciBsb2NhbEZvcmFnZTsgY2FuIGJlIGNhbGxlZCBhbnl0aW1lIGJlZm9yZVxuXHQgICAgICAgIC8vIHRoZSBmaXJzdCBBUEkgY2FsbCAoZS5nLiBgZ2V0SXRlbWAsIGBzZXRJdGVtYCkuXG5cdCAgICAgICAgLy8gV2UgbG9vcCB0aHJvdWdoIG9wdGlvbnMgc28gd2UgZG9uJ3Qgb3ZlcndyaXRlIGV4aXN0aW5nIGNvbmZpZ1xuXHQgICAgICAgIC8vIHZhbHVlcy5cblxuXHQgICAgICAgIExvY2FsRm9yYWdlLnByb3RvdHlwZS5jb25maWcgPSBmdW5jdGlvbiBjb25maWcob3B0aW9ucykge1xuXHQgICAgICAgICAgICAvLyBJZiB0aGUgb3B0aW9ucyBhcmd1bWVudCBpcyBhbiBvYmplY3QsIHdlIHVzZSBpdCB0byBzZXQgdmFsdWVzLlxuXHQgICAgICAgICAgICAvLyBPdGhlcndpc2UsIHdlIHJldHVybiBlaXRoZXIgYSBzcGVjaWZpZWQgY29uZmlnIHZhbHVlIG9yIGFsbFxuXHQgICAgICAgICAgICAvLyBjb25maWcgdmFsdWVzLlxuXHQgICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAgICAgICAgICAgICAvLyBJZiBsb2NhbGZvcmFnZSBpcyByZWFkeSBhbmQgZnVsbHkgaW5pdGlhbGl6ZWQsIHdlIGNhbid0IHNldFxuXHQgICAgICAgICAgICAgICAgLy8gYW55IG5ldyBjb25maWd1cmF0aW9uIHZhbHVlcy4gSW5zdGVhZCwgd2UgcmV0dXJuIGFuIGVycm9yLlxuXHQgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3JlYWR5KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihcIkNhbid0IGNhbGwgY29uZmlnKCkgYWZ0ZXIgbG9jYWxmb3JhZ2UgXCIgKyAnaGFzIGJlZW4gdXNlZC4nKTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBvcHRpb25zKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT09ICdzdG9yZU5hbWUnKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnNbaV0gPSBvcHRpb25zW2ldLnJlcGxhY2UoL1xcVy9nLCAnXycpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NvbmZpZ1tpXSA9IG9wdGlvbnNbaV07XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8vIGFmdGVyIGFsbCBjb25maWcgb3B0aW9ucyBhcmUgc2V0IGFuZFxuXHQgICAgICAgICAgICAgICAgLy8gdGhlIGRyaXZlciBvcHRpb24gaXMgdXNlZCwgdHJ5IHNldHRpbmcgaXRcblx0ICAgICAgICAgICAgICAgIGlmICgnZHJpdmVyJyBpbiBvcHRpb25zICYmIG9wdGlvbnMuZHJpdmVyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXREcml2ZXIodGhpcy5fY29uZmlnLmRyaXZlcik7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXHQgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbmZpZ1tvcHRpb25zXTtcblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb25maWc7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgLy8gVXNlZCB0byBkZWZpbmUgYSBjdXN0b20gZHJpdmVyLCBzaGFyZWQgYWNyb3NzIGFsbCBpbnN0YW5jZXMgb2Zcblx0ICAgICAgICAvLyBsb2NhbEZvcmFnZS5cblxuXHQgICAgICAgIExvY2FsRm9yYWdlLnByb3RvdHlwZS5kZWZpbmVEcml2ZXIgPSBmdW5jdGlvbiBkZWZpbmVEcml2ZXIoZHJpdmVyT2JqZWN0LCBjYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuXHQgICAgICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIGRyaXZlck5hbWUgPSBkcml2ZXJPYmplY3QuX2RyaXZlcjtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgY29tcGxpYW5jZUVycm9yID0gbmV3IEVycm9yKCdDdXN0b20gZHJpdmVyIG5vdCBjb21wbGlhbnQ7IHNlZSAnICsgJ2h0dHBzOi8vbW96aWxsYS5naXRodWIuaW8vbG9jYWxGb3JhZ2UvI2RlZmluZWRyaXZlcicpO1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciBuYW1pbmdFcnJvciA9IG5ldyBFcnJvcignQ3VzdG9tIGRyaXZlciBuYW1lIGFscmVhZHkgaW4gdXNlOiAnICsgZHJpdmVyT2JqZWN0Ll9kcml2ZXIpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLy8gQSBkcml2ZXIgbmFtZSBzaG91bGQgYmUgZGVmaW5lZCBhbmQgbm90IG92ZXJsYXAgd2l0aCB0aGVcblx0ICAgICAgICAgICAgICAgICAgICAvLyBsaWJyYXJ5LWRlZmluZWQsIGRlZmF1bHQgZHJpdmVycy5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoIWRyaXZlck9iamVjdC5fZHJpdmVyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChjb21wbGlhbmNlRXJyb3IpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIGlmIChpc0xpYnJhcnlEcml2ZXIoZHJpdmVyT2JqZWN0Ll9kcml2ZXIpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChuYW1pbmdFcnJvcik7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICB2YXIgY3VzdG9tRHJpdmVyTWV0aG9kcyA9IExpYnJhcnlNZXRob2RzLmNvbmNhdCgnX2luaXRTdG9yYWdlJyk7XG5cdCAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjdXN0b21Ecml2ZXJNZXRob2RzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXN0b21Ecml2ZXJNZXRob2QgPSBjdXN0b21Ecml2ZXJNZXRob2RzW2ldO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWN1c3RvbURyaXZlck1ldGhvZCB8fCAhZHJpdmVyT2JqZWN0W2N1c3RvbURyaXZlck1ldGhvZF0gfHwgdHlwZW9mIGRyaXZlck9iamVjdFtjdXN0b21Ecml2ZXJNZXRob2RdICE9PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoY29tcGxpYW5jZUVycm9yKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIHZhciBzdXBwb3J0UHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSh0cnVlKTtcblx0ICAgICAgICAgICAgICAgICAgICBpZiAoJ19zdXBwb3J0JyBpbiBkcml2ZXJPYmplY3QpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRyaXZlck9iamVjdC5fc3VwcG9ydCAmJiB0eXBlb2YgZHJpdmVyT2JqZWN0Ll9zdXBwb3J0ID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdXBwb3J0UHJvbWlzZSA9IGRyaXZlck9iamVjdC5fc3VwcG9ydCgpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VwcG9ydFByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoISFkcml2ZXJPYmplY3QuX3N1cHBvcnQpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgc3VwcG9ydFByb21pc2UudGhlbihmdW5jdGlvbiAoc3VwcG9ydFJlc3VsdCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBkcml2ZXJTdXBwb3J0W2RyaXZlck5hbWVdID0gc3VwcG9ydFJlc3VsdDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgQ3VzdG9tRHJpdmVyc1tkcml2ZXJOYW1lXSA9IGRyaXZlck9iamVjdDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuXHQgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG5cdCAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgICBwcm9taXNlLnRoZW4oY2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spO1xuXHQgICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgTG9jYWxGb3JhZ2UucHJvdG90eXBlLmRyaXZlciA9IGZ1bmN0aW9uIGRyaXZlcigpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RyaXZlciB8fCBudWxsO1xuXHQgICAgICAgIH07XG5cblx0ICAgICAgICBMb2NhbEZvcmFnZS5wcm90b3R5cGUuZ2V0RHJpdmVyID0gZnVuY3Rpb24gZ2V0RHJpdmVyKGRyaXZlck5hbWUsIGNhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG5cdCAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcblx0ICAgICAgICAgICAgdmFyIGdldERyaXZlclByb21pc2UgPSAoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgaWYgKGlzTGlicmFyeURyaXZlcihkcml2ZXJOYW1lKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoZHJpdmVyTmFtZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIHNlbGYuSU5ERVhFRERCOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKF9fd2VicGFja19yZXF1aXJlX18oMSkpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNhc2Ugc2VsZi5MT0NBTFNUT1JBR0U6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoX193ZWJwYWNrX3JlcXVpcmVfXygyKSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBzZWxmLldFQlNRTDpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShfX3dlYnBhY2tfcmVxdWlyZV9fKDQpKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoQ3VzdG9tRHJpdmVyc1tkcml2ZXJOYW1lXSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoQ3VzdG9tRHJpdmVyc1tkcml2ZXJOYW1lXSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0RyaXZlciBub3QgZm91bmQuJykpO1xuXHQgICAgICAgICAgICB9KSgpO1xuXG5cdCAgICAgICAgICAgIGdldERyaXZlclByb21pc2UudGhlbihjYWxsYmFjaywgZXJyb3JDYWxsYmFjayk7XG5cdCAgICAgICAgICAgIHJldHVybiBnZXREcml2ZXJQcm9taXNlO1xuXHQgICAgICAgIH07XG5cblx0ICAgICAgICBMb2NhbEZvcmFnZS5wcm90b3R5cGUuZ2V0U2VyaWFsaXplciA9IGZ1bmN0aW9uIGdldFNlcmlhbGl6ZXIoY2FsbGJhY2spIHtcblx0ICAgICAgICAgICAgdmFyIHNlcmlhbGl6ZXJQcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHQgICAgICAgICAgICAgICAgcmVzb2x2ZShfX3dlYnBhY2tfcmVxdWlyZV9fKDMpKTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIGlmIChjYWxsYmFjayAmJiB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICAgICAgICAgIHNlcmlhbGl6ZXJQcm9taXNlLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHJlc3VsdCk7XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gc2VyaWFsaXplclByb21pc2U7XG5cdCAgICAgICAgfTtcblxuXHQgICAgICAgIExvY2FsRm9yYWdlLnByb3RvdHlwZS5yZWFkeSA9IGZ1bmN0aW9uIHJlYWR5KGNhbGxiYWNrKSB7XG5cdCAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuXHQgICAgICAgICAgICB2YXIgcHJvbWlzZSA9IHNlbGYuX2RyaXZlclNldC50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIGlmIChzZWxmLl9yZWFkeSA9PT0gbnVsbCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHNlbGYuX3JlYWR5ID0gc2VsZi5faW5pdERyaXZlcigpO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5fcmVhZHk7XG5cdCAgICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICAgIHByb21pc2UudGhlbihjYWxsYmFjaywgY2FsbGJhY2spO1xuXHQgICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgTG9jYWxGb3JhZ2UucHJvdG90eXBlLnNldERyaXZlciA9IGZ1bmN0aW9uIHNldERyaXZlcihkcml2ZXJzLCBjYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuXHQgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgICAgICAgaWYgKCFpc0FycmF5KGRyaXZlcnMpKSB7XG5cdCAgICAgICAgICAgICAgICBkcml2ZXJzID0gW2RyaXZlcnNdO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgdmFyIHN1cHBvcnRlZERyaXZlcnMgPSB0aGlzLl9nZXRTdXBwb3J0ZWREcml2ZXJzKGRyaXZlcnMpO1xuXG5cdCAgICAgICAgICAgIGZ1bmN0aW9uIHNldERyaXZlclRvQ29uZmlnKCkge1xuXHQgICAgICAgICAgICAgICAgc2VsZi5fY29uZmlnLmRyaXZlciA9IHNlbGYuZHJpdmVyKCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBmdW5jdGlvbiBpbml0RHJpdmVyKHN1cHBvcnRlZERyaXZlcnMpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnREcml2ZXJJbmRleCA9IDA7XG5cblx0ICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBkcml2ZXJQcm9taXNlTG9vcCgpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGN1cnJlbnREcml2ZXJJbmRleCA8IHN1cHBvcnRlZERyaXZlcnMubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZHJpdmVyTmFtZSA9IHN1cHBvcnRlZERyaXZlcnNbY3VycmVudERyaXZlckluZGV4XTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnREcml2ZXJJbmRleCsrO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9kYkluZm8gPSBudWxsO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fcmVhZHkgPSBudWxsO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5nZXREcml2ZXIoZHJpdmVyTmFtZSkudGhlbihmdW5jdGlvbiAoZHJpdmVyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fZXh0ZW5kKGRyaXZlcik7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RHJpdmVyVG9Db25maWcoKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3JlYWR5ID0gc2VsZi5faW5pdFN0b3JhZ2Uoc2VsZi5fY29uZmlnKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5fcmVhZHk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVsnY2F0Y2gnXShkcml2ZXJQcm9taXNlTG9vcCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICBzZXREcml2ZXJUb0NvbmZpZygpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IoJ05vIGF2YWlsYWJsZSBzdG9yYWdlIG1ldGhvZCBmb3VuZC4nKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fZHJpdmVyU2V0ID0gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5fZHJpdmVyU2V0O1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBkcml2ZXJQcm9taXNlTG9vcCgpO1xuXHQgICAgICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8vIFRoZXJlIG1pZ2h0IGJlIGEgZHJpdmVyIGluaXRpYWxpemF0aW9uIGluIHByb2dyZXNzXG5cdCAgICAgICAgICAgIC8vIHNvIHdhaXQgZm9yIGl0IHRvIGZpbmlzaCBpbiBvcmRlciB0byBhdm9pZCBhIHBvc3NpYmxlXG5cdCAgICAgICAgICAgIC8vIHJhY2UgY29uZGl0aW9uIHRvIHNldCBfZGJJbmZvXG5cdCAgICAgICAgICAgIHZhciBvbGREcml2ZXJTZXREb25lID0gdGhpcy5fZHJpdmVyU2V0ICE9PSBudWxsID8gdGhpcy5fZHJpdmVyU2V0WydjYXRjaCddKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcblx0ICAgICAgICAgICAgfSkgOiBQcm9taXNlLnJlc29sdmUoKTtcblxuXHQgICAgICAgICAgICB0aGlzLl9kcml2ZXJTZXQgPSBvbGREcml2ZXJTZXREb25lLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgdmFyIGRyaXZlck5hbWUgPSBzdXBwb3J0ZWREcml2ZXJzWzBdO1xuXHQgICAgICAgICAgICAgICAgc2VsZi5fZGJJbmZvID0gbnVsbDtcblx0ICAgICAgICAgICAgICAgIHNlbGYuX3JlYWR5ID0gbnVsbDtcblxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuZ2V0RHJpdmVyKGRyaXZlck5hbWUpLnRoZW4oZnVuY3Rpb24gKGRyaXZlcikge1xuXHQgICAgICAgICAgICAgICAgICAgIHNlbGYuX2RyaXZlciA9IGRyaXZlci5fZHJpdmVyO1xuXHQgICAgICAgICAgICAgICAgICAgIHNldERyaXZlclRvQ29uZmlnKCk7XG5cdCAgICAgICAgICAgICAgICAgICAgc2VsZi5fd3JhcExpYnJhcnlNZXRob2RzV2l0aFJlYWR5KCk7XG5cdCAgICAgICAgICAgICAgICAgICAgc2VsZi5faW5pdERyaXZlciA9IGluaXREcml2ZXIoc3VwcG9ydGVkRHJpdmVycyk7XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfSlbJ2NhdGNoJ10oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgc2V0RHJpdmVyVG9Db25maWcoKTtcblx0ICAgICAgICAgICAgICAgIHZhciBlcnJvciA9IG5ldyBFcnJvcignTm8gYXZhaWxhYmxlIHN0b3JhZ2UgbWV0aG9kIGZvdW5kLicpO1xuXHQgICAgICAgICAgICAgICAgc2VsZi5fZHJpdmVyU2V0ID0gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuX2RyaXZlclNldDtcblx0ICAgICAgICAgICAgfSk7XG5cblx0ICAgICAgICAgICAgdGhpcy5fZHJpdmVyU2V0LnRoZW4oY2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spO1xuXHQgICAgICAgICAgICByZXR1cm4gdGhpcy5fZHJpdmVyU2V0O1xuXHQgICAgICAgIH07XG5cblx0ICAgICAgICBMb2NhbEZvcmFnZS5wcm90b3R5cGUuc3VwcG9ydHMgPSBmdW5jdGlvbiBzdXBwb3J0cyhkcml2ZXJOYW1lKSB7XG5cdCAgICAgICAgICAgIHJldHVybiAhIWRyaXZlclN1cHBvcnRbZHJpdmVyTmFtZV07XG5cdCAgICAgICAgfTtcblxuXHQgICAgICAgIExvY2FsRm9yYWdlLnByb3RvdHlwZS5fZXh0ZW5kID0gZnVuY3Rpb24gX2V4dGVuZChsaWJyYXJ5TWV0aG9kc0FuZFByb3BlcnRpZXMpIHtcblx0ICAgICAgICAgICAgZXh0ZW5kKHRoaXMsIGxpYnJhcnlNZXRob2RzQW5kUHJvcGVydGllcyk7XG5cdCAgICAgICAgfTtcblxuXHQgICAgICAgIExvY2FsRm9yYWdlLnByb3RvdHlwZS5fZ2V0U3VwcG9ydGVkRHJpdmVycyA9IGZ1bmN0aW9uIF9nZXRTdXBwb3J0ZWREcml2ZXJzKGRyaXZlcnMpIHtcblx0ICAgICAgICAgICAgdmFyIHN1cHBvcnRlZERyaXZlcnMgPSBbXTtcblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGRyaXZlcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIHZhciBkcml2ZXJOYW1lID0gZHJpdmVyc1tpXTtcblx0ICAgICAgICAgICAgICAgIGlmICh0aGlzLnN1cHBvcnRzKGRyaXZlck5hbWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgc3VwcG9ydGVkRHJpdmVycy5wdXNoKGRyaXZlck5hbWUpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiBzdXBwb3J0ZWREcml2ZXJzO1xuXHQgICAgICAgIH07XG5cblx0ICAgICAgICBMb2NhbEZvcmFnZS5wcm90b3R5cGUuX3dyYXBMaWJyYXJ5TWV0aG9kc1dpdGhSZWFkeSA9IGZ1bmN0aW9uIF93cmFwTGlicmFyeU1ldGhvZHNXaXRoUmVhZHkoKSB7XG5cdCAgICAgICAgICAgIC8vIEFkZCBhIHN0dWIgZm9yIGVhY2ggZHJpdmVyIEFQSSBtZXRob2QgdGhhdCBkZWxheXMgdGhlIGNhbGwgdG8gdGhlXG5cdCAgICAgICAgICAgIC8vIGNvcnJlc3BvbmRpbmcgZHJpdmVyIG1ldGhvZCB1bnRpbCBsb2NhbEZvcmFnZSBpcyByZWFkeS4gVGhlc2Ugc3R1YnNcblx0ICAgICAgICAgICAgLy8gd2lsbCBiZSByZXBsYWNlZCBieSB0aGUgZHJpdmVyIG1ldGhvZHMgYXMgc29vbiBhcyB0aGUgZHJpdmVyIGlzXG5cdCAgICAgICAgICAgIC8vIGxvYWRlZCwgc28gdGhlcmUgaXMgbm8gcGVyZm9ybWFuY2UgaW1wYWN0LlxuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IExpYnJhcnlNZXRob2RzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICBjYWxsV2hlblJlYWR5KHRoaXMsIExpYnJhcnlNZXRob2RzW2ldKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH07XG5cblx0ICAgICAgICBMb2NhbEZvcmFnZS5wcm90b3R5cGUuY3JlYXRlSW5zdGFuY2UgPSBmdW5jdGlvbiBjcmVhdGVJbnN0YW5jZShvcHRpb25zKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBuZXcgTG9jYWxGb3JhZ2Uob3B0aW9ucyk7XG5cdCAgICAgICAgfTtcblxuXHQgICAgICAgIHJldHVybiBMb2NhbEZvcmFnZTtcblx0ICAgIH0pKCk7XG5cblx0ICAgIHZhciBsb2NhbEZvcmFnZSA9IG5ldyBMb2NhbEZvcmFnZSgpO1xuXG5cdCAgICBleHBvcnRzWydkZWZhdWx0J10gPSBsb2NhbEZvcmFnZTtcblx0fSkuY2FsbCh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHNlbGYpO1xuXHRtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcblxuLyoqKi8gfSxcbi8qIDEgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdC8vIFNvbWUgY29kZSBvcmlnaW5hbGx5IGZyb20gYXN5bmNfc3RvcmFnZS5qcyBpblxuXHQvLyBbR2FpYV0oaHR0cHM6Ly9naXRodWIuY29tL21vemlsbGEtYjJnL2dhaWEpLlxuXHQndXNlIHN0cmljdCc7XG5cblx0ZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblx0KGZ1bmN0aW9uICgpIHtcblx0ICAgICd1c2Ugc3RyaWN0JztcblxuXHQgICAgdmFyIGdsb2JhbE9iamVjdCA9IHRoaXM7XG5cdCAgICAvLyBJbml0aWFsaXplIEluZGV4ZWREQjsgZmFsbCBiYWNrIHRvIHZlbmRvci1wcmVmaXhlZCB2ZXJzaW9ucyBpZiBuZWVkZWQuXG5cdCAgICB2YXIgaW5kZXhlZERCID0gaW5kZXhlZERCIHx8IHRoaXMuaW5kZXhlZERCIHx8IHRoaXMud2Via2l0SW5kZXhlZERCIHx8IHRoaXMubW96SW5kZXhlZERCIHx8IHRoaXMuT0luZGV4ZWREQiB8fCB0aGlzLm1zSW5kZXhlZERCO1xuXG5cdCAgICAvLyBJZiBJbmRleGVkREIgaXNuJ3QgYXZhaWxhYmxlLCB3ZSBnZXQgb3V0dGEgaGVyZSFcblx0ICAgIGlmICghaW5kZXhlZERCKSB7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgREVURUNUX0JMT0JfU1VQUE9SVF9TVE9SRSA9ICdsb2NhbC1mb3JhZ2UtZGV0ZWN0LWJsb2Itc3VwcG9ydCc7XG5cdCAgICB2YXIgc3VwcG9ydHNCbG9icztcblx0ICAgIHZhciBkYkNvbnRleHRzO1xuXG5cdCAgICAvLyBBYnN0cmFjdHMgY29uc3RydWN0aW5nIGEgQmxvYiBvYmplY3QsIHNvIGl0IGFsc28gd29ya3MgaW4gb2xkZXJcblx0ICAgIC8vIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCB0aGUgbmF0aXZlIEJsb2IgY29uc3RydWN0b3IuIChpLmUuXG5cdCAgICAvLyBvbGQgUXRXZWJLaXQgdmVyc2lvbnMsIGF0IGxlYXN0KS5cblx0ICAgIGZ1bmN0aW9uIF9jcmVhdGVCbG9iKHBhcnRzLCBwcm9wZXJ0aWVzKSB7XG5cdCAgICAgICAgcGFydHMgPSBwYXJ0cyB8fCBbXTtcblx0ICAgICAgICBwcm9wZXJ0aWVzID0gcHJvcGVydGllcyB8fCB7fTtcblx0ICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICByZXR1cm4gbmV3IEJsb2IocGFydHMsIHByb3BlcnRpZXMpO1xuXHQgICAgICAgIH0gY2F0Y2ggKGUpIHtcblx0ICAgICAgICAgICAgaWYgKGUubmFtZSAhPT0gJ1R5cGVFcnJvcicpIHtcblx0ICAgICAgICAgICAgICAgIHRocm93IGU7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgdmFyIEJsb2JCdWlsZGVyID0gZ2xvYmFsT2JqZWN0LkJsb2JCdWlsZGVyIHx8IGdsb2JhbE9iamVjdC5NU0Jsb2JCdWlsZGVyIHx8IGdsb2JhbE9iamVjdC5Nb3pCbG9iQnVpbGRlciB8fCBnbG9iYWxPYmplY3QuV2ViS2l0QmxvYkJ1aWxkZXI7XG5cdCAgICAgICAgICAgIHZhciBidWlsZGVyID0gbmV3IEJsb2JCdWlsZGVyKCk7XG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpICs9IDEpIHtcblx0ICAgICAgICAgICAgICAgIGJ1aWxkZXIuYXBwZW5kKHBhcnRzW2ldKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gYnVpbGRlci5nZXRCbG9iKHByb3BlcnRpZXMudHlwZSk7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICAvLyBUcmFuc2Zvcm0gYSBiaW5hcnkgc3RyaW5nIHRvIGFuIGFycmF5IGJ1ZmZlciwgYmVjYXVzZSBvdGhlcndpc2Vcblx0ICAgIC8vIHdlaXJkIHN0dWZmIGhhcHBlbnMgd2hlbiB5b3UgdHJ5IHRvIHdvcmsgd2l0aCB0aGUgYmluYXJ5IHN0cmluZyBkaXJlY3RseS5cblx0ICAgIC8vIEl0IGlzIGtub3duLlxuXHQgICAgLy8gRnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE0OTY3NjQ3LyAoY29udGludWVzIG9uIG5leHQgbGluZSlcblx0ICAgIC8vIGVuY29kZS1kZWNvZGUtaW1hZ2Utd2l0aC1iYXNlNjQtYnJlYWtzLWltYWdlICgyMDEzLTA0LTIxKVxuXHQgICAgZnVuY3Rpb24gX2JpblN0cmluZ1RvQXJyYXlCdWZmZXIoYmluKSB7XG5cdCAgICAgICAgdmFyIGxlbmd0aCA9IGJpbi5sZW5ndGg7XG5cdCAgICAgICAgdmFyIGJ1ZiA9IG5ldyBBcnJheUJ1ZmZlcihsZW5ndGgpO1xuXHQgICAgICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheShidWYpO1xuXHQgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgYXJyW2ldID0gYmluLmNoYXJDb2RlQXQoaSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBidWY7XG5cdCAgICB9XG5cblx0ICAgIC8vIEZldGNoIGEgYmxvYiB1c2luZyBhamF4LiBUaGlzIHJldmVhbHMgYnVncyBpbiBDaHJvbWUgPCA0My5cblx0ICAgIC8vIEZvciBkZXRhaWxzIG9uIGFsbCB0aGlzIGp1bms6XG5cdCAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbm9sYW5sYXdzb24vc3RhdGUtb2YtYmluYXJ5LWRhdGEtaW4tdGhlLWJyb3dzZXIjcmVhZG1lXG5cdCAgICBmdW5jdGlvbiBfYmxvYkFqYXgodXJsKSB7XG5cdCAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXHQgICAgICAgICAgICB4aHIub3BlbignR0VUJywgdXJsKTtcblx0ICAgICAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRydWU7XG5cdCAgICAgICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnYXJyYXlidWZmZXInO1xuXG5cdCAgICAgICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgIT09IDQpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAwKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoe1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZTogeGhyLnJlc3BvbnNlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ0NvbnRlbnQtVHlwZScpXG5cdCAgICAgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICByZWplY3QoeyBzdGF0dXM6IHhoci5zdGF0dXMsIHJlc3BvbnNlOiB4aHIucmVzcG9uc2UgfSk7XG5cdCAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgIHhoci5zZW5kKCk7XG5cdCAgICAgICAgfSk7XG5cdCAgICB9XG5cblx0ICAgIC8vXG5cdCAgICAvLyBEZXRlY3QgYmxvYiBzdXBwb3J0LiBDaHJvbWUgZGlkbid0IHN1cHBvcnQgaXQgdW50aWwgdmVyc2lvbiAzOC5cblx0ICAgIC8vIEluIHZlcnNpb24gMzcgdGhleSBoYWQgYSBicm9rZW4gdmVyc2lvbiB3aGVyZSBQTkdzIChhbmQgcG9zc2libHlcblx0ICAgIC8vIG90aGVyIGJpbmFyeSB0eXBlcykgYXJlbid0IHN0b3JlZCBjb3JyZWN0bHksIGJlY2F1c2Ugd2hlbiB5b3UgZmV0Y2hcblx0ICAgIC8vIHRoZW0sIHRoZSBjb250ZW50IHR5cGUgaXMgYWx3YXlzIG51bGwuXG5cdCAgICAvL1xuXHQgICAgLy8gRnVydGhlcm1vcmUsIHRoZXkgaGF2ZSBzb21lIG91dHN0YW5kaW5nIGJ1Z3Mgd2hlcmUgYmxvYnMgb2NjYXNpb25hbGx5XG5cdCAgICAvLyBhcmUgcmVhZCBieSBGaWxlUmVhZGVyIGFzIG51bGwsIG9yIGJ5IGFqYXggYXMgNDA0cy5cblx0ICAgIC8vXG5cdCAgICAvLyBTYWRseSB3ZSB1c2UgdGhlIDQwNCBidWcgdG8gZGV0ZWN0IHRoZSBGaWxlUmVhZGVyIGJ1Zywgc28gaWYgdGhleVxuXHQgICAgLy8gZ2V0IGZpeGVkIGluZGVwZW5kZW50bHkgYW5kIHJlbGVhc2VkIGluIGRpZmZlcmVudCB2ZXJzaW9ucyBvZiBDaHJvbWUsXG5cdCAgICAvLyB0aGVuIHRoZSBidWcgY291bGQgY29tZSBiYWNrLiBTbyBpdCdzIHdvcnRod2hpbGUgdG8gd2F0Y2ggdGhlc2UgaXNzdWVzOlxuXHQgICAgLy8gNDA0IGJ1ZzogaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTQ0NzkxNlxuXHQgICAgLy8gRmlsZVJlYWRlciBidWc6IGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD00NDc4MzZcblx0ICAgIC8vXG5cdCAgICBmdW5jdGlvbiBfY2hlY2tCbG9iU3VwcG9ydFdpdGhvdXRDYWNoaW5nKGlkYikge1xuXHQgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgIHZhciBibG9iID0gX2NyZWF0ZUJsb2IoWycnXSwgeyB0eXBlOiAnaW1hZ2UvcG5nJyB9KTtcblx0ICAgICAgICAgICAgdmFyIHR4biA9IGlkYi50cmFuc2FjdGlvbihbREVURUNUX0JMT0JfU1VQUE9SVF9TVE9SRV0sICdyZWFkd3JpdGUnKTtcblx0ICAgICAgICAgICAgdHhuLm9iamVjdFN0b3JlKERFVEVDVF9CTE9CX1NVUFBPUlRfU1RPUkUpLnB1dChibG9iLCAna2V5Jyk7XG5cdCAgICAgICAgICAgIHR4bi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgLy8gaGF2ZSB0byBkbyBpdCBpbiBhIHNlcGFyYXRlIHRyYW5zYWN0aW9uLCBlbHNlIHRoZSBjb3JyZWN0XG5cdCAgICAgICAgICAgICAgICAvLyBjb250ZW50IHR5cGUgaXMgYWx3YXlzIHJldHVybmVkXG5cdCAgICAgICAgICAgICAgICB2YXIgYmxvYlR4biA9IGlkYi50cmFuc2FjdGlvbihbREVURUNUX0JMT0JfU1VQUE9SVF9TVE9SRV0sICdyZWFkd3JpdGUnKTtcblx0ICAgICAgICAgICAgICAgIHZhciBnZXRCbG9iUmVxID0gYmxvYlR4bi5vYmplY3RTdG9yZShERVRFQ1RfQkxPQl9TVVBQT1JUX1NUT1JFKS5nZXQoJ2tleScpO1xuXHQgICAgICAgICAgICAgICAgZ2V0QmxvYlJlcS5vbmVycm9yID0gcmVqZWN0O1xuXHQgICAgICAgICAgICAgICAgZ2V0QmxvYlJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuXG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHN0b3JlZEJsb2IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoc3RvcmVkQmxvYik7XG5cblx0ICAgICAgICAgICAgICAgICAgICBfYmxvYkFqYXgodXJsKS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSghIShyZXMgJiYgcmVzLnR5cGUgPT09ICdpbWFnZS9wbmcnKSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGZhbHNlKTtcblx0ICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xuXHQgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgfTtcblx0ICAgICAgICB9KVsnY2F0Y2gnXShmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gZXJyb3IsIHNvIGFzc3VtZSB1bnN1cHBvcnRlZFxuXHQgICAgICAgIH0pO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBfY2hlY2tCbG9iU3VwcG9ydChpZGIpIHtcblx0ICAgICAgICBpZiAodHlwZW9mIHN1cHBvcnRzQmxvYnMgPT09ICdib29sZWFuJykge1xuXHQgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHN1cHBvcnRzQmxvYnMpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gX2NoZWNrQmxvYlN1cHBvcnRXaXRob3V0Q2FjaGluZyhpZGIpLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG5cdCAgICAgICAgICAgIHN1cHBvcnRzQmxvYnMgPSB2YWx1ZTtcblx0ICAgICAgICAgICAgcmV0dXJuIHN1cHBvcnRzQmxvYnM7XG5cdCAgICAgICAgfSk7XG5cdCAgICB9XG5cblx0ICAgIC8vIGVuY29kZSBhIGJsb2IgZm9yIGluZGV4ZWRkYiBlbmdpbmVzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBibG9ic1xuXHQgICAgZnVuY3Rpb24gX2VuY29kZUJsb2IoYmxvYikge1xuXHQgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXHQgICAgICAgICAgICByZWFkZXIub25lcnJvciA9IHJlamVjdDtcblx0ICAgICAgICAgICAgcmVhZGVyLm9ubG9hZGVuZCA9IGZ1bmN0aW9uIChlKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgYmFzZTY0ID0gYnRvYShlLnRhcmdldC5yZXN1bHQgfHwgJycpO1xuXHQgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG5cdCAgICAgICAgICAgICAgICAgICAgX19sb2NhbF9mb3JhZ2VfZW5jb2RlZF9ibG9iOiB0cnVlLFxuXHQgICAgICAgICAgICAgICAgICAgIGRhdGE6IGJhc2U2NCxcblx0ICAgICAgICAgICAgICAgICAgICB0eXBlOiBibG9iLnR5cGVcblx0ICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICByZWFkZXIucmVhZEFzQmluYXJ5U3RyaW5nKGJsb2IpO1xuXHQgICAgICAgIH0pO1xuXHQgICAgfVxuXG5cdCAgICAvLyBkZWNvZGUgYW4gZW5jb2RlZCBibG9iXG5cdCAgICBmdW5jdGlvbiBfZGVjb2RlQmxvYihlbmNvZGVkQmxvYikge1xuXHQgICAgICAgIHZhciBhcnJheUJ1ZmYgPSBfYmluU3RyaW5nVG9BcnJheUJ1ZmZlcihhdG9iKGVuY29kZWRCbG9iLmRhdGEpKTtcblx0ICAgICAgICByZXR1cm4gX2NyZWF0ZUJsb2IoW2FycmF5QnVmZl0sIHsgdHlwZTogZW5jb2RlZEJsb2IudHlwZSB9KTtcblx0ICAgIH1cblxuXHQgICAgLy8gaXMgdGhpcyBvbmUgb2Ygb3VyIGZhbmN5IGVuY29kZWQgYmxvYnM/XG5cdCAgICBmdW5jdGlvbiBfaXNFbmNvZGVkQmxvYih2YWx1ZSkge1xuXHQgICAgICAgIHJldHVybiB2YWx1ZSAmJiB2YWx1ZS5fX2xvY2FsX2ZvcmFnZV9lbmNvZGVkX2Jsb2I7XG5cdCAgICB9XG5cblx0ICAgIC8vIE9wZW4gdGhlIEluZGV4ZWREQiBkYXRhYmFzZSAoYXV0b21hdGljYWxseSBjcmVhdGVzIG9uZSBpZiBvbmUgZGlkbid0XG5cdCAgICAvLyBwcmV2aW91c2x5IGV4aXN0KSwgdXNpbmcgYW55IG9wdGlvbnMgc2V0IGluIHRoZSBjb25maWcuXG5cdCAgICBmdW5jdGlvbiBfaW5pdFN0b3JhZ2Uob3B0aW9ucykge1xuXHQgICAgICAgIHZhciBzZWxmID0gdGhpcztcblx0ICAgICAgICB2YXIgZGJJbmZvID0ge1xuXHQgICAgICAgICAgICBkYjogbnVsbFxuXHQgICAgICAgIH07XG5cblx0ICAgICAgICBpZiAob3B0aW9ucykge1xuXHQgICAgICAgICAgICBmb3IgKHZhciBpIGluIG9wdGlvbnMpIHtcblx0ICAgICAgICAgICAgICAgIGRiSW5mb1tpXSA9IG9wdGlvbnNbaV07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBJbml0aWFsaXplIGEgc2luZ2xldG9uIGNvbnRhaW5lciBmb3IgYWxsIHJ1bm5pbmcgbG9jYWxGb3JhZ2VzLlxuXHQgICAgICAgIGlmICghZGJDb250ZXh0cykge1xuXHQgICAgICAgICAgICBkYkNvbnRleHRzID0ge307XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gR2V0IHRoZSBjdXJyZW50IGNvbnRleHQgb2YgdGhlIGRhdGFiYXNlO1xuXHQgICAgICAgIHZhciBkYkNvbnRleHQgPSBkYkNvbnRleHRzW2RiSW5mby5uYW1lXTtcblxuXHQgICAgICAgIC8vIC4uLm9yIGNyZWF0ZSBhIG5ldyBjb250ZXh0LlxuXHQgICAgICAgIGlmICghZGJDb250ZXh0KSB7XG5cdCAgICAgICAgICAgIGRiQ29udGV4dCA9IHtcblx0ICAgICAgICAgICAgICAgIC8vIFJ1bm5pbmcgbG9jYWxGb3JhZ2VzIHNoYXJpbmcgYSBkYXRhYmFzZS5cblx0ICAgICAgICAgICAgICAgIGZvcmFnZXM6IFtdLFxuXHQgICAgICAgICAgICAgICAgLy8gU2hhcmVkIGRhdGFiYXNlLlxuXHQgICAgICAgICAgICAgICAgZGI6IG51bGxcblx0ICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgLy8gUmVnaXN0ZXIgdGhlIG5ldyBjb250ZXh0IGluIHRoZSBnbG9iYWwgY29udGFpbmVyLlxuXHQgICAgICAgICAgICBkYkNvbnRleHRzW2RiSW5mby5uYW1lXSA9IGRiQ29udGV4dDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBSZWdpc3RlciBpdHNlbGYgYXMgYSBydW5uaW5nIGxvY2FsRm9yYWdlIGluIHRoZSBjdXJyZW50IGNvbnRleHQuXG5cdCAgICAgICAgZGJDb250ZXh0LmZvcmFnZXMucHVzaCh0aGlzKTtcblxuXHQgICAgICAgIC8vIENyZWF0ZSBhbiBhcnJheSBvZiByZWFkaW5lc3Mgb2YgdGhlIHJlbGF0ZWQgbG9jYWxGb3JhZ2VzLlxuXHQgICAgICAgIHZhciByZWFkeVByb21pc2VzID0gW107XG5cblx0ICAgICAgICBmdW5jdGlvbiBpZ25vcmVFcnJvcnMoKSB7XG5cdCAgICAgICAgICAgIC8vIERvbid0IGhhbmRsZSBlcnJvcnMgaGVyZSxcblx0ICAgICAgICAgICAgLy8ganVzdCBtYWtlcyBzdXJlIHJlbGF0ZWQgbG9jYWxGb3JhZ2VzIGFyZW4ndCBwZW5kaW5nLlxuXHQgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBkYkNvbnRleHQuZm9yYWdlcy5sZW5ndGg7IGorKykge1xuXHQgICAgICAgICAgICB2YXIgZm9yYWdlID0gZGJDb250ZXh0LmZvcmFnZXNbal07XG5cdCAgICAgICAgICAgIGlmIChmb3JhZ2UgIT09IHRoaXMpIHtcblx0ICAgICAgICAgICAgICAgIC8vIERvbid0IHdhaXQgZm9yIGl0c2VsZi4uLlxuXHQgICAgICAgICAgICAgICAgcmVhZHlQcm9taXNlcy5wdXNoKGZvcmFnZS5yZWFkeSgpWydjYXRjaCddKGlnbm9yZUVycm9ycykpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gVGFrZSBhIHNuYXBzaG90IG9mIHRoZSByZWxhdGVkIGxvY2FsRm9yYWdlcy5cblx0ICAgICAgICB2YXIgZm9yYWdlcyA9IGRiQ29udGV4dC5mb3JhZ2VzLnNsaWNlKDApO1xuXG5cdCAgICAgICAgLy8gSW5pdGlhbGl6ZSB0aGUgY29ubmVjdGlvbiBwcm9jZXNzIG9ubHkgd2hlblxuXHQgICAgICAgIC8vIGFsbCB0aGUgcmVsYXRlZCBsb2NhbEZvcmFnZXMgYXJlbid0IHBlbmRpbmcuXG5cdCAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHJlYWR5UHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICBkYkluZm8uZGIgPSBkYkNvbnRleHQuZGI7XG5cdCAgICAgICAgICAgIC8vIEdldCB0aGUgY29ubmVjdGlvbiBvciBvcGVuIGEgbmV3IG9uZSB3aXRob3V0IHVwZ3JhZGUuXG5cdCAgICAgICAgICAgIHJldHVybiBfZ2V0T3JpZ2luYWxDb25uZWN0aW9uKGRiSW5mbyk7XG5cdCAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoZGIpIHtcblx0ICAgICAgICAgICAgZGJJbmZvLmRiID0gZGI7XG5cdCAgICAgICAgICAgIGlmIChfaXNVcGdyYWRlTmVlZGVkKGRiSW5mbywgc2VsZi5fZGVmYXVsdENvbmZpZy52ZXJzaW9uKSkge1xuXHQgICAgICAgICAgICAgICAgLy8gUmVvcGVuIHRoZSBkYXRhYmFzZSBmb3IgdXBncmFkaW5nLlxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIF9nZXRVcGdyYWRlZENvbm5lY3Rpb24oZGJJbmZvKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gZGI7XG5cdCAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoZGIpIHtcblx0ICAgICAgICAgICAgZGJJbmZvLmRiID0gZGJDb250ZXh0LmRiID0gZGI7XG5cdCAgICAgICAgICAgIHNlbGYuX2RiSW5mbyA9IGRiSW5mbztcblx0ICAgICAgICAgICAgLy8gU2hhcmUgdGhlIGZpbmFsIGNvbm5lY3Rpb24gYW1vbmdzdCByZWxhdGVkIGxvY2FsRm9yYWdlcy5cblx0ICAgICAgICAgICAgZm9yICh2YXIgayBpbiBmb3JhZ2VzKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgZm9yYWdlID0gZm9yYWdlc1trXTtcblx0ICAgICAgICAgICAgICAgIGlmIChmb3JhZ2UgIT09IHNlbGYpIHtcblx0ICAgICAgICAgICAgICAgICAgICAvLyBTZWxmIGlzIGFscmVhZHkgdXAtdG8tZGF0ZS5cblx0ICAgICAgICAgICAgICAgICAgICBmb3JhZ2UuX2RiSW5mby5kYiA9IGRiSW5mby5kYjtcblx0ICAgICAgICAgICAgICAgICAgICBmb3JhZ2UuX2RiSW5mby52ZXJzaW9uID0gZGJJbmZvLnZlcnNpb247XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9KTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gX2dldE9yaWdpbmFsQ29ubmVjdGlvbihkYkluZm8pIHtcblx0ICAgICAgICByZXR1cm4gX2dldENvbm5lY3Rpb24oZGJJbmZvLCBmYWxzZSk7XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIF9nZXRVcGdyYWRlZENvbm5lY3Rpb24oZGJJbmZvKSB7XG5cdCAgICAgICAgcmV0dXJuIF9nZXRDb25uZWN0aW9uKGRiSW5mbywgdHJ1ZSk7XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIF9nZXRDb25uZWN0aW9uKGRiSW5mbywgdXBncmFkZU5lZWRlZCkge1xuXHQgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgIGlmIChkYkluZm8uZGIpIHtcblx0ICAgICAgICAgICAgICAgIGlmICh1cGdyYWRlTmVlZGVkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgZGJJbmZvLmRiLmNsb3NlKCk7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKGRiSW5mby5kYik7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICB2YXIgZGJBcmdzID0gW2RiSW5mby5uYW1lXTtcblxuXHQgICAgICAgICAgICBpZiAodXBncmFkZU5lZWRlZCkge1xuXHQgICAgICAgICAgICAgICAgZGJBcmdzLnB1c2goZGJJbmZvLnZlcnNpb24pO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgdmFyIG9wZW5yZXEgPSBpbmRleGVkREIub3Blbi5hcHBseShpbmRleGVkREIsIGRiQXJncyk7XG5cblx0ICAgICAgICAgICAgaWYgKHVwZ3JhZGVOZWVkZWQpIHtcblx0ICAgICAgICAgICAgICAgIG9wZW5yZXEub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24gKGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgZGIgPSBvcGVucmVxLnJlc3VsdDtcblx0ICAgICAgICAgICAgICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBkYi5jcmVhdGVPYmplY3RTdG9yZShkYkluZm8uc3RvcmVOYW1lKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUub2xkVmVyc2lvbiA8PSAxKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGRlZCB3aGVuIHN1cHBvcnQgZm9yIGJsb2Igc2hpbXMgd2FzIGFkZGVkXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYi5jcmVhdGVPYmplY3RTdG9yZShERVRFQ1RfQkxPQl9TVVBQT1JUX1NUT1JFKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleC5uYW1lID09PSAnQ29uc3RyYWludEVycm9yJykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2xvYmFsT2JqZWN0LmNvbnNvbGUud2FybignVGhlIGRhdGFiYXNlIFwiJyArIGRiSW5mby5uYW1lICsgJ1wiJyArICcgaGFzIGJlZW4gdXBncmFkZWQgZnJvbSB2ZXJzaW9uICcgKyBlLm9sZFZlcnNpb24gKyAnIHRvIHZlcnNpb24gJyArIGUubmV3VmVyc2lvbiArICcsIGJ1dCB0aGUgc3RvcmFnZSBcIicgKyBkYkluZm8uc3RvcmVOYW1lICsgJ1wiIGFscmVhZHkgZXhpc3RzLicpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXg7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgb3BlbnJlcS5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgcmVqZWN0KG9wZW5yZXEuZXJyb3IpO1xuXHQgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICAgIG9wZW5yZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgcmVzb2x2ZShvcGVucmVxLnJlc3VsdCk7XG5cdCAgICAgICAgICAgIH07XG5cdCAgICAgICAgfSk7XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIF9pc1VwZ3JhZGVOZWVkZWQoZGJJbmZvLCBkZWZhdWx0VmVyc2lvbikge1xuXHQgICAgICAgIGlmICghZGJJbmZvLmRiKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBpc05ld1N0b3JlID0gIWRiSW5mby5kYi5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKGRiSW5mby5zdG9yZU5hbWUpO1xuXHQgICAgICAgIHZhciBpc0Rvd25ncmFkZSA9IGRiSW5mby52ZXJzaW9uIDwgZGJJbmZvLmRiLnZlcnNpb247XG5cdCAgICAgICAgdmFyIGlzVXBncmFkZSA9IGRiSW5mby52ZXJzaW9uID4gZGJJbmZvLmRiLnZlcnNpb247XG5cblx0ICAgICAgICBpZiAoaXNEb3duZ3JhZGUpIHtcblx0ICAgICAgICAgICAgLy8gSWYgdGhlIHZlcnNpb24gaXMgbm90IHRoZSBkZWZhdWx0IG9uZVxuXHQgICAgICAgICAgICAvLyB0aGVuIHdhcm4gZm9yIGltcG9zc2libGUgZG93bmdyYWRlLlxuXHQgICAgICAgICAgICBpZiAoZGJJbmZvLnZlcnNpb24gIT09IGRlZmF1bHRWZXJzaW9uKSB7XG5cdCAgICAgICAgICAgICAgICBnbG9iYWxPYmplY3QuY29uc29sZS53YXJuKCdUaGUgZGF0YWJhc2UgXCInICsgZGJJbmZvLm5hbWUgKyAnXCInICsgJyBjYW5cXCd0IGJlIGRvd25ncmFkZWQgZnJvbSB2ZXJzaW9uICcgKyBkYkluZm8uZGIudmVyc2lvbiArICcgdG8gdmVyc2lvbiAnICsgZGJJbmZvLnZlcnNpb24gKyAnLicpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIC8vIEFsaWduIHRoZSB2ZXJzaW9ucyB0byBwcmV2ZW50IGVycm9ycy5cblx0ICAgICAgICAgICAgZGJJbmZvLnZlcnNpb24gPSBkYkluZm8uZGIudmVyc2lvbjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAoaXNVcGdyYWRlIHx8IGlzTmV3U3RvcmUpIHtcblx0ICAgICAgICAgICAgLy8gSWYgdGhlIHN0b3JlIGlzIG5ldyB0aGVuIGluY3JlbWVudCB0aGUgdmVyc2lvbiAoaWYgbmVlZGVkKS5cblx0ICAgICAgICAgICAgLy8gVGhpcyB3aWxsIHRyaWdnZXIgYW4gXCJ1cGdyYWRlbmVlZGVkXCIgZXZlbnQgd2hpY2ggaXMgcmVxdWlyZWRcblx0ICAgICAgICAgICAgLy8gZm9yIGNyZWF0aW5nIGEgc3RvcmUuXG5cdCAgICAgICAgICAgIGlmIChpc05ld1N0b3JlKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgaW5jVmVyc2lvbiA9IGRiSW5mby5kYi52ZXJzaW9uICsgMTtcblx0ICAgICAgICAgICAgICAgIGlmIChpbmNWZXJzaW9uID4gZGJJbmZvLnZlcnNpb24pIHtcblx0ICAgICAgICAgICAgICAgICAgICBkYkluZm8udmVyc2lvbiA9IGluY1ZlcnNpb247XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGdldEl0ZW0oa2V5LCBjYWxsYmFjaykge1xuXHQgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuXHQgICAgICAgIC8vIENhc3QgdGhlIGtleSB0byBhIHN0cmluZywgYXMgdGhhdCdzIGFsbCB3ZSBjYW4gc2V0IGFzIGEga2V5LlxuXHQgICAgICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgICBnbG9iYWxPYmplY3QuY29uc29sZS53YXJuKGtleSArICcgdXNlZCBhcyBhIGtleSwgYnV0IGl0IGlzIG5vdCBhIHN0cmluZy4nKTtcblx0ICAgICAgICAgICAga2V5ID0gU3RyaW5nKGtleSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgIHNlbGYucmVhZHkoKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBkYkluZm8gPSBzZWxmLl9kYkluZm87XG5cdCAgICAgICAgICAgICAgICB2YXIgc3RvcmUgPSBkYkluZm8uZGIudHJhbnNhY3Rpb24oZGJJbmZvLnN0b3JlTmFtZSwgJ3JlYWRvbmx5Jykub2JqZWN0U3RvcmUoZGJJbmZvLnN0b3JlTmFtZSk7XG5cdCAgICAgICAgICAgICAgICB2YXIgcmVxID0gc3RvcmUuZ2V0KGtleSk7XG5cblx0ICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gcmVxLnJlc3VsdDtcblx0ICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IG51bGw7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIGlmIChfaXNFbmNvZGVkQmxvYih2YWx1ZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBfZGVjb2RlQmxvYih2YWx1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlcS5lcnJvcik7XG5cdCAgICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICB9KVsnY2F0Y2gnXShyZWplY3QpO1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKTtcblx0ICAgICAgICByZXR1cm4gcHJvbWlzZTtcblx0ICAgIH1cblxuXHQgICAgLy8gSXRlcmF0ZSBvdmVyIGFsbCBpdGVtcyBzdG9yZWQgaW4gZGF0YWJhc2UuXG5cdCAgICBmdW5jdGlvbiBpdGVyYXRlKGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuXHQgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuXHQgICAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHQgICAgICAgICAgICBzZWxmLnJlYWR5KCkudGhlbihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgZGJJbmZvID0gc2VsZi5fZGJJbmZvO1xuXHQgICAgICAgICAgICAgICAgdmFyIHN0b3JlID0gZGJJbmZvLmRiLnRyYW5zYWN0aW9uKGRiSW5mby5zdG9yZU5hbWUsICdyZWFkb25seScpLm9iamVjdFN0b3JlKGRiSW5mby5zdG9yZU5hbWUpO1xuXG5cdCAgICAgICAgICAgICAgICB2YXIgcmVxID0gc3RvcmUub3BlbkN1cnNvcigpO1xuXHQgICAgICAgICAgICAgICAgdmFyIGl0ZXJhdGlvbk51bWJlciA9IDE7XG5cblx0ICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnNvciA9IHJlcS5yZXN1bHQ7XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoY3Vyc29yKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGN1cnNvci52YWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF9pc0VuY29kZWRCbG9iKHZhbHVlKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBfZGVjb2RlQmxvYih2YWx1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGl0ZXJhdG9yKHZhbHVlLCBjdXJzb3Iua2V5LCBpdGVyYXRpb25OdW1iZXIrKyk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gdm9pZCAwKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3JbJ2NvbnRpbnVlJ10oKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICAgICAgICByZXEub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZWplY3QocmVxLmVycm9yKTtcblx0ICAgICAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgIH0pWydjYXRjaCddKHJlamVjdCk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXG5cdCAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIHNldEl0ZW0oa2V5LCB2YWx1ZSwgY2FsbGJhY2spIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgICAvLyBDYXN0IHRoZSBrZXkgdG8gYSBzdHJpbmcsIGFzIHRoYXQncyBhbGwgd2UgY2FuIHNldCBhcyBhIGtleS5cblx0ICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgZ2xvYmFsT2JqZWN0LmNvbnNvbGUud2FybihrZXkgKyAnIHVzZWQgYXMgYSBrZXksIGJ1dCBpdCBpcyBub3QgYSBzdHJpbmcuJyk7XG5cdCAgICAgICAgICAgIGtleSA9IFN0cmluZyhrZXkpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHQgICAgICAgICAgICB2YXIgZGJJbmZvO1xuXHQgICAgICAgICAgICBzZWxmLnJlYWR5KCkudGhlbihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICBkYkluZm8gPSBzZWxmLl9kYkluZm87XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gX2NoZWNrQmxvYlN1cHBvcnQoZGJJbmZvLmRiKTtcblx0ICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoYmxvYlN1cHBvcnQpIHtcblx0ICAgICAgICAgICAgICAgIGlmICghYmxvYlN1cHBvcnQgJiYgdmFsdWUgaW5zdGFuY2VvZiBCbG9iKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9lbmNvZGVCbG9iKHZhbHVlKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcblx0ICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcblx0ICAgICAgICAgICAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiSW5mby5kYi50cmFuc2FjdGlvbihkYkluZm8uc3RvcmVOYW1lLCAncmVhZHdyaXRlJyk7XG5cdCAgICAgICAgICAgICAgICB2YXIgc3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShkYkluZm8uc3RvcmVOYW1lKTtcblxuXHQgICAgICAgICAgICAgICAgLy8gVGhlIHJlYXNvbiB3ZSBkb24ndCBfc2F2ZV8gbnVsbCBpcyBiZWNhdXNlIElFIDEwIGRvZXNcblx0ICAgICAgICAgICAgICAgIC8vIG5vdCBzdXBwb3J0IHNhdmluZyB0aGUgYG51bGxgIHR5cGUgaW4gSW5kZXhlZERCLiBIb3dcblx0ICAgICAgICAgICAgICAgIC8vIGlyb25pYywgZ2l2ZW4gdGhlIGJ1ZyBiZWxvdyFcblx0ICAgICAgICAgICAgICAgIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL21vemlsbGEvbG9jYWxGb3JhZ2UvaXNzdWVzLzE2MVxuXHQgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB1bmRlZmluZWQ7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIHZhciByZXEgPSBzdG9yZS5wdXQodmFsdWUsIGtleSk7XG5cdCAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIC8vIENhc3QgdG8gdW5kZWZpbmVkIHNvIHRoZSB2YWx1ZSBwYXNzZWQgdG9cblx0ICAgICAgICAgICAgICAgICAgICAvLyBjYWxsYmFjay9wcm9taXNlIGlzIHRoZSBzYW1lIGFzIHdoYXQgb25lIHdvdWxkIGdldCBvdXRcblx0ICAgICAgICAgICAgICAgICAgICAvLyBvZiBgZ2V0SXRlbSgpYCBsYXRlci4gVGhpcyBsZWFkcyB0byBzb21lIHdlaXJkbmVzc1xuXHQgICAgICAgICAgICAgICAgICAgIC8vIChzZXRJdGVtKCdmb28nLCB1bmRlZmluZWQpIHdpbGwgcmV0dXJuIGBudWxsYCksIGJ1dFxuXHQgICAgICAgICAgICAgICAgICAgIC8vIGl0J3Mgbm90IG15IGZhdWx0IGxvY2FsU3RvcmFnZSBpcyBvdXIgYmFzZWxpbmUgYW5kIHRoYXRcblx0ICAgICAgICAgICAgICAgICAgICAvLyBpdCdzIHdlaXJkLlxuXHQgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gbnVsbDtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHZhbHVlKTtcblx0ICAgICAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmFib3J0ID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgZXJyID0gcmVxLmVycm9yID8gcmVxLmVycm9yIDogcmVxLnRyYW5zYWN0aW9uLmVycm9yO1xuXHQgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuXHQgICAgICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgfSlbJ2NhdGNoJ10ocmVqZWN0KTtcblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIGV4ZWN1dGVDYWxsYmFjayhwcm9taXNlLCBjYWxsYmFjayk7XG5cdCAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIHJlbW92ZUl0ZW0oa2V5LCBjYWxsYmFjaykge1xuXHQgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuXHQgICAgICAgIC8vIENhc3QgdGhlIGtleSB0byBhIHN0cmluZywgYXMgdGhhdCdzIGFsbCB3ZSBjYW4gc2V0IGFzIGEga2V5LlxuXHQgICAgICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgICBnbG9iYWxPYmplY3QuY29uc29sZS53YXJuKGtleSArICcgdXNlZCBhcyBhIGtleSwgYnV0IGl0IGlzIG5vdCBhIHN0cmluZy4nKTtcblx0ICAgICAgICAgICAga2V5ID0gU3RyaW5nKGtleSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgIHNlbGYucmVhZHkoKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBkYkluZm8gPSBzZWxmLl9kYkluZm87XG5cdCAgICAgICAgICAgICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYkluZm8uZGIudHJhbnNhY3Rpb24oZGJJbmZvLnN0b3JlTmFtZSwgJ3JlYWR3cml0ZScpO1xuXHQgICAgICAgICAgICAgICAgdmFyIHN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoZGJJbmZvLnN0b3JlTmFtZSk7XG5cblx0ICAgICAgICAgICAgICAgIC8vIFdlIHVzZSBhIEdydW50IHRhc2sgdG8gbWFrZSB0aGlzIHNhZmUgZm9yIElFIGFuZCBzb21lXG5cdCAgICAgICAgICAgICAgICAvLyB2ZXJzaW9ucyBvZiBBbmRyb2lkIChpbmNsdWRpbmcgdGhvc2UgdXNlZCBieSBDb3Jkb3ZhKS5cblx0ICAgICAgICAgICAgICAgIC8vIE5vcm1hbGx5IElFIHdvbid0IGxpa2UgYC5kZWxldGUoKWAgYW5kIHdpbGwgaW5zaXN0IG9uXG5cdCAgICAgICAgICAgICAgICAvLyB1c2luZyBgWydkZWxldGUnXSgpYCwgYnV0IHdlIGhhdmUgYSBidWlsZCBzdGVwIHRoYXRcblx0ICAgICAgICAgICAgICAgIC8vIGZpeGVzIHRoaXMgZm9yIHVzIG5vdy5cblx0ICAgICAgICAgICAgICAgIHZhciByZXEgPSBzdG9yZVsnZGVsZXRlJ10oa2V5KTtcblx0ICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuXHQgICAgICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24ub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZWplY3QocmVxLmVycm9yKTtcblx0ICAgICAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgICAgIC8vIFRoZSByZXF1ZXN0IHdpbGwgYmUgYWxzbyBiZSBhYm9ydGVkIGlmIHdlJ3ZlIGV4Y2VlZGVkIG91ciBzdG9yYWdlXG5cdCAgICAgICAgICAgICAgICAvLyBzcGFjZS5cblx0ICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIGVyciA9IHJlcS5lcnJvciA/IHJlcS5lcnJvciA6IHJlcS50cmFuc2FjdGlvbi5lcnJvcjtcblx0ICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcblx0ICAgICAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgIH0pWydjYXRjaCddKHJlamVjdCk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBjbGVhcihjYWxsYmFjaykge1xuXHQgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuXHQgICAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHQgICAgICAgICAgICBzZWxmLnJlYWR5KCkudGhlbihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgZGJJbmZvID0gc2VsZi5fZGJJbmZvO1xuXHQgICAgICAgICAgICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGJJbmZvLmRiLnRyYW5zYWN0aW9uKGRiSW5mby5zdG9yZU5hbWUsICdyZWFkd3JpdGUnKTtcblx0ICAgICAgICAgICAgICAgIHZhciBzdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKGRiSW5mby5zdG9yZU5hbWUpO1xuXHQgICAgICAgICAgICAgICAgdmFyIHJlcSA9IHN0b3JlLmNsZWFyKCk7XG5cblx0ICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuXHQgICAgICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24ub25hYm9ydCA9IHRyYW5zYWN0aW9uLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIGVyciA9IHJlcS5lcnJvciA/IHJlcS5lcnJvciA6IHJlcS50cmFuc2FjdGlvbi5lcnJvcjtcblx0ICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcblx0ICAgICAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgIH0pWydjYXRjaCddKHJlamVjdCk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBsZW5ndGgoY2FsbGJhY2spIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgc2VsZi5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgdmFyIGRiSW5mbyA9IHNlbGYuX2RiSW5mbztcblx0ICAgICAgICAgICAgICAgIHZhciBzdG9yZSA9IGRiSW5mby5kYi50cmFuc2FjdGlvbihkYkluZm8uc3RvcmVOYW1lLCAncmVhZG9ubHknKS5vYmplY3RTdG9yZShkYkluZm8uc3RvcmVOYW1lKTtcblx0ICAgICAgICAgICAgICAgIHZhciByZXEgPSBzdG9yZS5jb3VudCgpO1xuXG5cdCAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVxLnJlc3VsdCk7XG5cdCAgICAgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICAgICAgICByZXEub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZWplY3QocmVxLmVycm9yKTtcblx0ICAgICAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgIH0pWydjYXRjaCddKHJlamVjdCk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBrZXkobiwgY2FsbGJhY2spIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgaWYgKG4gPCAwKSB7XG5cdCAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuXG5cdCAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBzZWxmLnJlYWR5KCkudGhlbihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgZGJJbmZvID0gc2VsZi5fZGJJbmZvO1xuXHQgICAgICAgICAgICAgICAgdmFyIHN0b3JlID0gZGJJbmZvLmRiLnRyYW5zYWN0aW9uKGRiSW5mby5zdG9yZU5hbWUsICdyZWFkb25seScpLm9iamVjdFN0b3JlKGRiSW5mby5zdG9yZU5hbWUpO1xuXG5cdCAgICAgICAgICAgICAgICB2YXIgYWR2YW5jZWQgPSBmYWxzZTtcblx0ICAgICAgICAgICAgICAgIHZhciByZXEgPSBzdG9yZS5vcGVuQ3Vyc29yKCk7XG5cdCAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciBjdXJzb3IgPSByZXEucmVzdWx0O1xuXHQgICAgICAgICAgICAgICAgICAgIGlmICghY3Vyc29yKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgbWVhbnMgdGhlcmUgd2VyZW4ndCBlbm91Z2gga2V5c1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAobiA9PT0gMCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBoYXZlIHRoZSBmaXJzdCBrZXksIHJldHVybiBpdCBpZiB0aGF0J3Mgd2hhdCB0aGV5XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdhbnRlZC5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShjdXJzb3Iua2V5KTtcblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFkdmFuY2VkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPdGhlcndpc2UsIGFzayB0aGUgY3Vyc29yIHRvIHNraXAgYWhlYWQgblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVjb3Jkcy5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdmFuY2VkID0gdHJ1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvci5hZHZhbmNlKG4pO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2hlbiB3ZSBnZXQgaGVyZSwgd2UndmUgZ290IHRoZSBudGgga2V5LlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShjdXJzb3Iua2V5KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgICAgIHJlcS5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXEuZXJyb3IpO1xuXHQgICAgICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgfSlbJ2NhdGNoJ10ocmVqZWN0KTtcblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIGV4ZWN1dGVDYWxsYmFjayhwcm9taXNlLCBjYWxsYmFjayk7XG5cdCAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGtleXMoY2FsbGJhY2spIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgc2VsZi5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgdmFyIGRiSW5mbyA9IHNlbGYuX2RiSW5mbztcblx0ICAgICAgICAgICAgICAgIHZhciBzdG9yZSA9IGRiSW5mby5kYi50cmFuc2FjdGlvbihkYkluZm8uc3RvcmVOYW1lLCAncmVhZG9ubHknKS5vYmplY3RTdG9yZShkYkluZm8uc3RvcmVOYW1lKTtcblxuXHQgICAgICAgICAgICAgICAgdmFyIHJlcSA9IHN0b3JlLm9wZW5DdXJzb3IoKTtcblx0ICAgICAgICAgICAgICAgIHZhciBrZXlzID0gW107XG5cblx0ICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnNvciA9IHJlcS5yZXN1bHQ7XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoIWN1cnNvcikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGtleXMpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAga2V5cy5wdXNoKGN1cnNvci5rZXkpO1xuXHQgICAgICAgICAgICAgICAgICAgIGN1cnNvclsnY29udGludWUnXSgpO1xuXHQgICAgICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlcS5lcnJvcik7XG5cdCAgICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICB9KVsnY2F0Y2gnXShyZWplY3QpO1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKTtcblx0ICAgICAgICByZXR1cm4gcHJvbWlzZTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKSB7XG5cdCAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG5cdCAgICAgICAgICAgIHByb21pc2UudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG5cdCAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHQpO1xuXHQgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcblx0ICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycm9yKTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICB2YXIgYXN5bmNTdG9yYWdlID0ge1xuXHQgICAgICAgIF9kcml2ZXI6ICdhc3luY1N0b3JhZ2UnLFxuXHQgICAgICAgIF9pbml0U3RvcmFnZTogX2luaXRTdG9yYWdlLFxuXHQgICAgICAgIGl0ZXJhdGU6IGl0ZXJhdGUsXG5cdCAgICAgICAgZ2V0SXRlbTogZ2V0SXRlbSxcblx0ICAgICAgICBzZXRJdGVtOiBzZXRJdGVtLFxuXHQgICAgICAgIHJlbW92ZUl0ZW06IHJlbW92ZUl0ZW0sXG5cdCAgICAgICAgY2xlYXI6IGNsZWFyLFxuXHQgICAgICAgIGxlbmd0aDogbGVuZ3RoLFxuXHQgICAgICAgIGtleToga2V5LFxuXHQgICAgICAgIGtleXM6IGtleXNcblx0ICAgIH07XG5cblx0ICAgIGV4cG9ydHNbJ2RlZmF1bHQnXSA9IGFzeW5jU3RvcmFnZTtcblx0fSkuY2FsbCh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHNlbGYpO1xuXHRtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcblxuLyoqKi8gfSxcbi8qIDIgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdC8vIElmIEluZGV4ZWREQiBpc24ndCBhdmFpbGFibGUsIHdlJ2xsIGZhbGwgYmFjayB0byBsb2NhbFN0b3JhZ2UuXG5cdC8vIE5vdGUgdGhhdCB0aGlzIHdpbGwgaGF2ZSBjb25zaWRlcmFibGUgcGVyZm9ybWFuY2UgYW5kIHN0b3JhZ2Vcblx0Ly8gc2lkZS1lZmZlY3RzIChhbGwgZGF0YSB3aWxsIGJlIHNlcmlhbGl6ZWQgb24gc2F2ZSBhbmQgb25seSBkYXRhIHRoYXRcblx0Ly8gY2FuIGJlIGNvbnZlcnRlZCB0byBhIHN0cmluZyB2aWEgYEpTT04uc3RyaW5naWZ5KClgIHdpbGwgYmUgc2F2ZWQpLlxuXHQndXNlIHN0cmljdCc7XG5cblx0ZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblx0KGZ1bmN0aW9uICgpIHtcblx0ICAgICd1c2Ugc3RyaWN0JztcblxuXHQgICAgdmFyIGdsb2JhbE9iamVjdCA9IHRoaXM7XG5cdCAgICB2YXIgbG9jYWxTdG9yYWdlID0gbnVsbDtcblxuXHQgICAgLy8gSWYgdGhlIGFwcCBpcyBydW5uaW5nIGluc2lkZSBhIEdvb2dsZSBDaHJvbWUgcGFja2FnZWQgd2ViYXBwLCBvciBzb21lXG5cdCAgICAvLyBvdGhlciBjb250ZXh0IHdoZXJlIGxvY2FsU3RvcmFnZSBpc24ndCBhdmFpbGFibGUsIHdlIGRvbid0IHVzZVxuXHQgICAgLy8gbG9jYWxTdG9yYWdlLiBUaGlzIGZlYXR1cmUgZGV0ZWN0aW9uIGlzIHByZWZlcnJlZCBvdmVyIHRoZSBvbGRcblx0ICAgIC8vIGBpZiAod2luZG93LmNocm9tZSAmJiB3aW5kb3cuY2hyb21lLnJ1bnRpbWUpYCBjb2RlLlxuXHQgICAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vbW96aWxsYS9sb2NhbEZvcmFnZS9pc3N1ZXMvNjhcblx0ICAgIHRyeSB7XG5cdCAgICAgICAgLy8gSWYgbG9jYWxTdG9yYWdlIGlzbid0IGF2YWlsYWJsZSwgd2UgZ2V0IG91dHRhIGhlcmUhXG5cdCAgICAgICAgLy8gVGhpcyBzaG91bGQgYmUgaW5zaWRlIGEgdHJ5IGNhdGNoXG5cdCAgICAgICAgaWYgKCF0aGlzLmxvY2FsU3RvcmFnZSB8fCAhKCdzZXRJdGVtJyBpbiB0aGlzLmxvY2FsU3RvcmFnZSkpIHtcblx0ICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgIH1cblx0ICAgICAgICAvLyBJbml0aWFsaXplIGxvY2FsU3RvcmFnZSBhbmQgY3JlYXRlIGEgdmFyaWFibGUgdG8gdXNlIHRocm91Z2hvdXRcblx0ICAgICAgICAvLyB0aGUgY29kZS5cblx0ICAgICAgICBsb2NhbFN0b3JhZ2UgPSB0aGlzLmxvY2FsU3RvcmFnZTtcblx0ICAgIH0gY2F0Y2ggKGUpIHtcblx0ICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cblx0ICAgIC8vIENvbmZpZyB0aGUgbG9jYWxTdG9yYWdlIGJhY2tlbmQsIHVzaW5nIG9wdGlvbnMgc2V0IGluIHRoZSBjb25maWcuXG5cdCAgICBmdW5jdGlvbiBfaW5pdFN0b3JhZ2Uob3B0aW9ucykge1xuXHQgICAgICAgIHZhciBzZWxmID0gdGhpcztcblx0ICAgICAgICB2YXIgZGJJbmZvID0ge307XG5cdCAgICAgICAgaWYgKG9wdGlvbnMpIHtcblx0ICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBvcHRpb25zKSB7XG5cdCAgICAgICAgICAgICAgICBkYkluZm9baV0gPSBvcHRpb25zW2ldO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZGJJbmZvLmtleVByZWZpeCA9IGRiSW5mby5uYW1lICsgJy8nO1xuXG5cdCAgICAgICAgaWYgKGRiSW5mby5zdG9yZU5hbWUgIT09IHNlbGYuX2RlZmF1bHRDb25maWcuc3RvcmVOYW1lKSB7XG5cdCAgICAgICAgICAgIGRiSW5mby5rZXlQcmVmaXggKz0gZGJJbmZvLnN0b3JlTmFtZSArICcvJztcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBzZWxmLl9kYkluZm8gPSBkYkluZm87XG5cblx0ICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHQgICAgICAgICAgICByZXNvbHZlKF9fd2VicGFja19yZXF1aXJlX18oMykpO1xuXHQgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKGxpYikge1xuXHQgICAgICAgICAgICBkYkluZm8uc2VyaWFsaXplciA9IGxpYjtcblx0ICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuXHQgICAgICAgIH0pO1xuXHQgICAgfVxuXG5cdCAgICAvLyBSZW1vdmUgYWxsIGtleXMgZnJvbSB0aGUgZGF0YXN0b3JlLCBlZmZlY3RpdmVseSBkZXN0cm95aW5nIGFsbCBkYXRhIGluXG5cdCAgICAvLyB0aGUgYXBwJ3Mga2V5L3ZhbHVlIHN0b3JlIVxuXHQgICAgZnVuY3Rpb24gY2xlYXIoY2FsbGJhY2spIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cdCAgICAgICAgdmFyIHByb21pc2UgPSBzZWxmLnJlYWR5KCkudGhlbihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIHZhciBrZXlQcmVmaXggPSBzZWxmLl9kYkluZm8ua2V5UHJlZml4O1xuXG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSBsb2NhbFN0b3JhZ2UubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0ICAgICAgICAgICAgICAgIHZhciBrZXkgPSBsb2NhbFN0b3JhZ2Uua2V5KGkpO1xuXG5cdCAgICAgICAgICAgICAgICBpZiAoa2V5LmluZGV4T2Yoa2V5UHJlZml4KSA9PT0gMCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIGV4ZWN1dGVDYWxsYmFjayhwcm9taXNlLCBjYWxsYmFjayk7XG5cdCAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cdCAgICB9XG5cblx0ICAgIC8vIFJldHJpZXZlIGFuIGl0ZW0gZnJvbSB0aGUgc3RvcmUuIFVubGlrZSB0aGUgb3JpZ2luYWwgYXN5bmNfc3RvcmFnZVxuXHQgICAgLy8gbGlicmFyeSBpbiBHYWlhLCB3ZSBkb24ndCBtb2RpZnkgcmV0dXJuIHZhbHVlcyBhdCBhbGwuIElmIGEga2V5J3MgdmFsdWVcblx0ICAgIC8vIGlzIGB1bmRlZmluZWRgLCB3ZSBwYXNzIHRoYXQgdmFsdWUgdG8gdGhlIGNhbGxiYWNrIGZ1bmN0aW9uLlxuXHQgICAgZnVuY3Rpb24gZ2V0SXRlbShrZXksIGNhbGxiYWNrKSB7XG5cdCAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG5cdCAgICAgICAgLy8gQ2FzdCB0aGUga2V5IHRvIGEgc3RyaW5nLCBhcyB0aGF0J3MgYWxsIHdlIGNhbiBzZXQgYXMgYSBrZXkuXG5cdCAgICAgICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICAgIGdsb2JhbE9iamVjdC5jb25zb2xlLndhcm4oa2V5ICsgJyB1c2VkIGFzIGEga2V5LCBidXQgaXQgaXMgbm90IGEgc3RyaW5nLicpO1xuXHQgICAgICAgICAgICBrZXkgPSBTdHJpbmcoa2V5KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgcHJvbWlzZSA9IHNlbGYucmVhZHkoKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgdmFyIGRiSW5mbyA9IHNlbGYuX2RiSW5mbztcblx0ICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGRiSW5mby5rZXlQcmVmaXggKyBrZXkpO1xuXG5cdCAgICAgICAgICAgIC8vIElmIGEgcmVzdWx0IHdhcyBmb3VuZCwgcGFyc2UgaXQgZnJvbSB0aGUgc2VyaWFsaXplZFxuXHQgICAgICAgICAgICAvLyBzdHJpbmcgaW50byBhIEpTIG9iamVjdC4gSWYgcmVzdWx0IGlzbid0IHRydXRoeSwgdGhlIGtleVxuXHQgICAgICAgICAgICAvLyBpcyBsaWtlbHkgdW5kZWZpbmVkIGFuZCB3ZSdsbCBwYXNzIGl0IHN0cmFpZ2h0IHRvIHRoZVxuXHQgICAgICAgICAgICAvLyBjYWxsYmFjay5cblx0ICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xuXHQgICAgICAgICAgICAgICAgcmVzdWx0ID0gZGJJbmZvLnNlcmlhbGl6ZXIuZGVzZXJpYWxpemUocmVzdWx0KTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICAvLyBJdGVyYXRlIG92ZXIgYWxsIGl0ZW1zIGluIHRoZSBzdG9yZS5cblx0ICAgIGZ1bmN0aW9uIGl0ZXJhdGUoaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG5cdCAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG5cdCAgICAgICAgdmFyIHByb21pc2UgPSBzZWxmLnJlYWR5KCkudGhlbihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIHZhciBkYkluZm8gPSBzZWxmLl9kYkluZm87XG5cdCAgICAgICAgICAgIHZhciBrZXlQcmVmaXggPSBkYkluZm8ua2V5UHJlZml4O1xuXHQgICAgICAgICAgICB2YXIga2V5UHJlZml4TGVuZ3RoID0ga2V5UHJlZml4Lmxlbmd0aDtcblx0ICAgICAgICAgICAgdmFyIGxlbmd0aCA9IGxvY2FsU3RvcmFnZS5sZW5ndGg7XG5cblx0ICAgICAgICAgICAgLy8gV2UgdXNlIGEgZGVkaWNhdGVkIGl0ZXJhdG9yIGluc3RlYWQgb2YgdGhlIGBpYCB2YXJpYWJsZSBiZWxvd1xuXHQgICAgICAgICAgICAvLyBzbyBvdGhlciBrZXlzIHdlIGZldGNoIGluIGxvY2FsU3RvcmFnZSBhcmVuJ3QgY291bnRlZCBpblxuXHQgICAgICAgICAgICAvLyB0aGUgYGl0ZXJhdGlvbk51bWJlcmAgYXJndW1lbnQgcGFzc2VkIHRvIHRoZSBgaXRlcmF0ZSgpYFxuXHQgICAgICAgICAgICAvLyBjYWxsYmFjay5cblx0ICAgICAgICAgICAgLy9cblx0ICAgICAgICAgICAgLy8gU2VlOiBnaXRodWIuY29tL21vemlsbGEvbG9jYWxGb3JhZ2UvcHVsbC80MzUjZGlzY3Vzc2lvbl9yMzgwNjE1MzBcblx0ICAgICAgICAgICAgdmFyIGl0ZXJhdGlvbk51bWJlciA9IDE7XG5cblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgdmFyIGtleSA9IGxvY2FsU3RvcmFnZS5rZXkoaSk7XG5cdCAgICAgICAgICAgICAgICBpZiAoa2V5LmluZGV4T2Yoa2V5UHJlZml4KSAhPT0gMCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcblxuXHQgICAgICAgICAgICAgICAgLy8gSWYgYSByZXN1bHQgd2FzIGZvdW5kLCBwYXJzZSBpdCBmcm9tIHRoZSBzZXJpYWxpemVkXG5cdCAgICAgICAgICAgICAgICAvLyBzdHJpbmcgaW50byBhIEpTIG9iamVjdC4gSWYgcmVzdWx0IGlzbid0IHRydXRoeSwgdGhlXG5cdCAgICAgICAgICAgICAgICAvLyBrZXkgaXMgbGlrZWx5IHVuZGVmaW5lZCBhbmQgd2UnbGwgcGFzcyBpdCBzdHJhaWdodFxuXHQgICAgICAgICAgICAgICAgLy8gdG8gdGhlIGl0ZXJhdG9yLlxuXHQgICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBkYkluZm8uc2VyaWFsaXplci5kZXNlcmlhbGl6ZSh2YWx1ZSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIHZhbHVlID0gaXRlcmF0b3IodmFsdWUsIGtleS5zdWJzdHJpbmcoa2V5UHJlZml4TGVuZ3RoKSwgaXRlcmF0aW9uTnVtYmVyKyspO1xuXG5cdCAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IHZvaWQgMCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKTtcblx0ICAgICAgICByZXR1cm4gcHJvbWlzZTtcblx0ICAgIH1cblxuXHQgICAgLy8gU2FtZSBhcyBsb2NhbFN0b3JhZ2UncyBrZXkoKSBtZXRob2QsIGV4Y2VwdCB0YWtlcyBhIGNhbGxiYWNrLlxuXHQgICAgZnVuY3Rpb24ga2V5KG4sIGNhbGxiYWNrKSB7XG5cdCAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXHQgICAgICAgIHZhciBwcm9taXNlID0gc2VsZi5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICB2YXIgZGJJbmZvID0gc2VsZi5fZGJJbmZvO1xuXHQgICAgICAgICAgICB2YXIgcmVzdWx0O1xuXHQgICAgICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICAgICAgcmVzdWx0ID0gbG9jYWxTdG9yYWdlLmtleShuKTtcblx0ICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcblx0ICAgICAgICAgICAgICAgIHJlc3VsdCA9IG51bGw7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIHByZWZpeCBmcm9tIHRoZSBrZXksIGlmIGEga2V5IGlzIGZvdW5kLlxuXHQgICAgICAgICAgICBpZiAocmVzdWx0KSB7XG5cdCAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuc3Vic3RyaW5nKGRiSW5mby5rZXlQcmVmaXgubGVuZ3RoKTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBrZXlzKGNhbGxiYWNrKSB7XG5cdCAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXHQgICAgICAgIHZhciBwcm9taXNlID0gc2VsZi5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICB2YXIgZGJJbmZvID0gc2VsZi5fZGJJbmZvO1xuXHQgICAgICAgICAgICB2YXIgbGVuZ3RoID0gbG9jYWxTdG9yYWdlLmxlbmd0aDtcblx0ICAgICAgICAgICAgdmFyIGtleXMgPSBbXTtcblxuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAobG9jYWxTdG9yYWdlLmtleShpKS5pbmRleE9mKGRiSW5mby5rZXlQcmVmaXgpID09PSAwKSB7XG5cdCAgICAgICAgICAgICAgICAgICAga2V5cy5wdXNoKGxvY2FsU3RvcmFnZS5rZXkoaSkuc3Vic3RyaW5nKGRiSW5mby5rZXlQcmVmaXgubGVuZ3RoKSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4ga2V5cztcblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIGV4ZWN1dGVDYWxsYmFjayhwcm9taXNlLCBjYWxsYmFjayk7XG5cdCAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cdCAgICB9XG5cblx0ICAgIC8vIFN1cHBseSB0aGUgbnVtYmVyIG9mIGtleXMgaW4gdGhlIGRhdGFzdG9yZSB0byB0aGUgY2FsbGJhY2sgZnVuY3Rpb24uXG5cdCAgICBmdW5jdGlvbiBsZW5ndGgoY2FsbGJhY2spIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cdCAgICAgICAgdmFyIHByb21pc2UgPSBzZWxmLmtleXMoKS50aGVuKGZ1bmN0aW9uIChrZXlzKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBrZXlzLmxlbmd0aDtcblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIGV4ZWN1dGVDYWxsYmFjayhwcm9taXNlLCBjYWxsYmFjayk7XG5cdCAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cdCAgICB9XG5cblx0ICAgIC8vIFJlbW92ZSBhbiBpdGVtIGZyb20gdGhlIHN0b3JlLCBuaWNlIGFuZCBzaW1wbGUuXG5cdCAgICBmdW5jdGlvbiByZW1vdmVJdGVtKGtleSwgY2FsbGJhY2spIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgICAvLyBDYXN0IHRoZSBrZXkgdG8gYSBzdHJpbmcsIGFzIHRoYXQncyBhbGwgd2UgY2FuIHNldCBhcyBhIGtleS5cblx0ICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgZ2xvYmFsT2JqZWN0LmNvbnNvbGUud2FybihrZXkgKyAnIHVzZWQgYXMgYSBrZXksIGJ1dCBpdCBpcyBub3QgYSBzdHJpbmcuJyk7XG5cdCAgICAgICAgICAgIGtleSA9IFN0cmluZyhrZXkpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBwcm9taXNlID0gc2VsZi5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICB2YXIgZGJJbmZvID0gc2VsZi5fZGJJbmZvO1xuXHQgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShkYkluZm8ua2V5UHJlZml4ICsga2V5KTtcblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIGV4ZWN1dGVDYWxsYmFjayhwcm9taXNlLCBjYWxsYmFjayk7XG5cdCAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cdCAgICB9XG5cblx0ICAgIC8vIFNldCBhIGtleSdzIHZhbHVlIGFuZCBydW4gYW4gb3B0aW9uYWwgY2FsbGJhY2sgb25jZSB0aGUgdmFsdWUgaXMgc2V0LlxuXHQgICAgLy8gVW5saWtlIEdhaWEncyBpbXBsZW1lbnRhdGlvbiwgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uIGlzIHBhc3NlZCB0aGUgdmFsdWUsXG5cdCAgICAvLyBpbiBjYXNlIHlvdSB3YW50IHRvIG9wZXJhdGUgb24gdGhhdCB2YWx1ZSBvbmx5IGFmdGVyIHlvdSdyZSBzdXJlIGl0XG5cdCAgICAvLyBzYXZlZCwgb3Igc29tZXRoaW5nIGxpa2UgdGhhdC5cblx0ICAgIGZ1bmN0aW9uIHNldEl0ZW0oa2V5LCB2YWx1ZSwgY2FsbGJhY2spIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgICAvLyBDYXN0IHRoZSBrZXkgdG8gYSBzdHJpbmcsIGFzIHRoYXQncyBhbGwgd2UgY2FuIHNldCBhcyBhIGtleS5cblx0ICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgZ2xvYmFsT2JqZWN0LmNvbnNvbGUud2FybihrZXkgKyAnIHVzZWQgYXMgYSBrZXksIGJ1dCBpdCBpcyBub3QgYSBzdHJpbmcuJyk7XG5cdCAgICAgICAgICAgIGtleSA9IFN0cmluZyhrZXkpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBwcm9taXNlID0gc2VsZi5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAvLyBDb252ZXJ0IHVuZGVmaW5lZCB2YWx1ZXMgdG8gbnVsbC5cblx0ICAgICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vemlsbGEvbG9jYWxGb3JhZ2UvcHVsbC80MlxuXHQgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgdmFsdWUgPSBudWxsO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLy8gU2F2ZSB0aGUgb3JpZ2luYWwgdmFsdWUgdG8gcGFzcyB0byB0aGUgY2FsbGJhY2suXG5cdCAgICAgICAgICAgIHZhciBvcmlnaW5hbFZhbHVlID0gdmFsdWU7XG5cblx0ICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBkYkluZm8gPSBzZWxmLl9kYkluZm87XG5cdCAgICAgICAgICAgICAgICBkYkluZm8uc2VyaWFsaXplci5zZXJpYWxpemUodmFsdWUsIGZ1bmN0aW9uICh2YWx1ZSwgZXJyb3IpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oZGJJbmZvLmtleVByZWZpeCArIGtleSwgdmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShvcmlnaW5hbFZhbHVlKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbG9jYWxTdG9yYWdlIGNhcGFjaXR5IGV4Y2VlZGVkLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogTWFrZSB0aGlzIGEgc3BlY2lmaWMgZXJyb3IvZXZlbnQuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5uYW1lID09PSAnUXVvdGFFeGNlZWRlZEVycm9yJyB8fCBlLm5hbWUgPT09ICdOU19FUlJPUl9ET01fUVVPVEFfUkVBQ0hFRCcpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spIHtcblx0ICAgICAgICBpZiAoY2FsbGJhY2spIHtcblx0ICAgICAgICAgICAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcblx0ICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdCk7XG5cdCAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuXHQgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyb3IpO1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIHZhciBsb2NhbFN0b3JhZ2VXcmFwcGVyID0ge1xuXHQgICAgICAgIF9kcml2ZXI6ICdsb2NhbFN0b3JhZ2VXcmFwcGVyJyxcblx0ICAgICAgICBfaW5pdFN0b3JhZ2U6IF9pbml0U3RvcmFnZSxcblx0ICAgICAgICAvLyBEZWZhdWx0IEFQSSwgZnJvbSBHYWlhL2xvY2FsU3RvcmFnZS5cblx0ICAgICAgICBpdGVyYXRlOiBpdGVyYXRlLFxuXHQgICAgICAgIGdldEl0ZW06IGdldEl0ZW0sXG5cdCAgICAgICAgc2V0SXRlbTogc2V0SXRlbSxcblx0ICAgICAgICByZW1vdmVJdGVtOiByZW1vdmVJdGVtLFxuXHQgICAgICAgIGNsZWFyOiBjbGVhcixcblx0ICAgICAgICBsZW5ndGg6IGxlbmd0aCxcblx0ICAgICAgICBrZXk6IGtleSxcblx0ICAgICAgICBrZXlzOiBrZXlzXG5cdCAgICB9O1xuXG5cdCAgICBleHBvcnRzWydkZWZhdWx0J10gPSBsb2NhbFN0b3JhZ2VXcmFwcGVyO1xuXHR9KS5jYWxsKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogc2VsZik7XG5cdG1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuXG4vKioqLyB9LFxuLyogMyAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdGV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cdChmdW5jdGlvbiAoKSB7XG5cdCAgICAndXNlIHN0cmljdCc7XG5cblx0ICAgIC8vIFNhZGx5LCB0aGUgYmVzdCB3YXkgdG8gc2F2ZSBiaW5hcnkgZGF0YSBpbiBXZWJTUUwvbG9jYWxTdG9yYWdlIGlzIHNlcmlhbGl6aW5nXG5cdCAgICAvLyBpdCB0byBCYXNlNjQsIHNvIHRoaXMgaXMgaG93IHdlIHN0b3JlIGl0IHRvIHByZXZlbnQgdmVyeSBzdHJhbmdlIGVycm9ycyB3aXRoIGxlc3Ncblx0ICAgIC8vIHZlcmJvc2Ugd2F5cyBvZiBiaW5hcnkgPC0+IHN0cmluZyBkYXRhIHN0b3JhZ2UuXG5cdCAgICB2YXIgQkFTRV9DSEFSUyA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcblxuXHQgICAgdmFyIEJMT0JfVFlQRV9QUkVGSVggPSAnfn5sb2NhbF9mb3JhZ2VfdHlwZX4nO1xuXHQgICAgdmFyIEJMT0JfVFlQRV9QUkVGSVhfUkVHRVggPSAvXn5+bG9jYWxfZm9yYWdlX3R5cGV+KFtefl0rKX4vO1xuXG5cdCAgICB2YXIgU0VSSUFMSVpFRF9NQVJLRVIgPSAnX19sZnNjX186Jztcblx0ICAgIHZhciBTRVJJQUxJWkVEX01BUktFUl9MRU5HVEggPSBTRVJJQUxJWkVEX01BUktFUi5sZW5ndGg7XG5cblx0ICAgIC8vIE9NRyB0aGUgc2VyaWFsaXphdGlvbnMhXG5cdCAgICB2YXIgVFlQRV9BUlJBWUJVRkZFUiA9ICdhcmJmJztcblx0ICAgIHZhciBUWVBFX0JMT0IgPSAnYmxvYic7XG5cdCAgICB2YXIgVFlQRV9JTlQ4QVJSQVkgPSAnc2kwOCc7XG5cdCAgICB2YXIgVFlQRV9VSU5UOEFSUkFZID0gJ3VpMDgnO1xuXHQgICAgdmFyIFRZUEVfVUlOVDhDTEFNUEVEQVJSQVkgPSAndWljOCc7XG5cdCAgICB2YXIgVFlQRV9JTlQxNkFSUkFZID0gJ3NpMTYnO1xuXHQgICAgdmFyIFRZUEVfSU5UMzJBUlJBWSA9ICdzaTMyJztcblx0ICAgIHZhciBUWVBFX1VJTlQxNkFSUkFZID0gJ3VyMTYnO1xuXHQgICAgdmFyIFRZUEVfVUlOVDMyQVJSQVkgPSAndWkzMic7XG5cdCAgICB2YXIgVFlQRV9GTE9BVDMyQVJSQVkgPSAnZmwzMic7XG5cdCAgICB2YXIgVFlQRV9GTE9BVDY0QVJSQVkgPSAnZmw2NCc7XG5cdCAgICB2YXIgVFlQRV9TRVJJQUxJWkVEX01BUktFUl9MRU5HVEggPSBTRVJJQUxJWkVEX01BUktFUl9MRU5HVEggKyBUWVBFX0FSUkFZQlVGRkVSLmxlbmd0aDtcblxuXHQgICAgLy8gR2V0IG91dCBvZiBvdXIgaGFiaXQgb2YgdXNpbmcgYHdpbmRvd2AgaW5saW5lLCBhdCBsZWFzdC5cblx0ICAgIHZhciBnbG9iYWxPYmplY3QgPSB0aGlzO1xuXG5cdCAgICAvLyBBYnN0cmFjdHMgY29uc3RydWN0aW5nIGEgQmxvYiBvYmplY3QsIHNvIGl0IGFsc28gd29ya3MgaW4gb2xkZXJcblx0ICAgIC8vIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCB0aGUgbmF0aXZlIEJsb2IgY29uc3RydWN0b3IuIChpLmUuXG5cdCAgICAvLyBvbGQgUXRXZWJLaXQgdmVyc2lvbnMsIGF0IGxlYXN0KS5cblx0ICAgIGZ1bmN0aW9uIF9jcmVhdGVCbG9iKHBhcnRzLCBwcm9wZXJ0aWVzKSB7XG5cdCAgICAgICAgcGFydHMgPSBwYXJ0cyB8fCBbXTtcblx0ICAgICAgICBwcm9wZXJ0aWVzID0gcHJvcGVydGllcyB8fCB7fTtcblxuXHQgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgIHJldHVybiBuZXcgQmxvYihwYXJ0cywgcHJvcGVydGllcyk7XG5cdCAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG5cdCAgICAgICAgICAgIGlmIChlcnIubmFtZSAhPT0gJ1R5cGVFcnJvcicpIHtcblx0ICAgICAgICAgICAgICAgIHRocm93IGVycjtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHZhciBCbG9iQnVpbGRlciA9IGdsb2JhbE9iamVjdC5CbG9iQnVpbGRlciB8fCBnbG9iYWxPYmplY3QuTVNCbG9iQnVpbGRlciB8fCBnbG9iYWxPYmplY3QuTW96QmxvYkJ1aWxkZXIgfHwgZ2xvYmFsT2JqZWN0LldlYktpdEJsb2JCdWlsZGVyO1xuXG5cdCAgICAgICAgICAgIHZhciBidWlsZGVyID0gbmV3IEJsb2JCdWlsZGVyKCk7XG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpICs9IDEpIHtcblx0ICAgICAgICAgICAgICAgIGJ1aWxkZXIuYXBwZW5kKHBhcnRzW2ldKTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiBidWlsZGVyLmdldEJsb2IocHJvcGVydGllcy50eXBlKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIC8vIFNlcmlhbGl6ZSBhIHZhbHVlLCBhZnRlcndhcmRzIGV4ZWN1dGluZyBhIGNhbGxiYWNrICh3aGljaCB1c3VhbGx5XG5cdCAgICAvLyBpbnN0cnVjdHMgdGhlIGBzZXRJdGVtKClgIGNhbGxiYWNrL3Byb21pc2UgdG8gYmUgZXhlY3V0ZWQpLiBUaGlzIGlzIGhvd1xuXHQgICAgLy8gd2Ugc3RvcmUgYmluYXJ5IGRhdGEgd2l0aCBsb2NhbFN0b3JhZ2UuXG5cdCAgICBmdW5jdGlvbiBzZXJpYWxpemUodmFsdWUsIGNhbGxiYWNrKSB7XG5cdCAgICAgICAgdmFyIHZhbHVlU3RyaW5nID0gJyc7XG5cdCAgICAgICAgaWYgKHZhbHVlKSB7XG5cdCAgICAgICAgICAgIHZhbHVlU3RyaW5nID0gdmFsdWUudG9TdHJpbmcoKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBDYW5ub3QgdXNlIGB2YWx1ZSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyYCBvciBzdWNoIGhlcmUsIGFzIHRoZXNlXG5cdCAgICAgICAgLy8gY2hlY2tzIGZhaWwgd2hlbiBydW5uaW5nIHRoZSB0ZXN0cyB1c2luZyBjYXNwZXIuanMuLi5cblx0ICAgICAgICAvL1xuXHQgICAgICAgIC8vIFRPRE86IFNlZSB3aHkgdGhvc2UgdGVzdHMgZmFpbCBhbmQgdXNlIGEgYmV0dGVyIHNvbHV0aW9uLlxuXHQgICAgICAgIGlmICh2YWx1ZSAmJiAodmFsdWUudG9TdHJpbmcoKSA9PT0gJ1tvYmplY3QgQXJyYXlCdWZmZXJdJyB8fCB2YWx1ZS5idWZmZXIgJiYgdmFsdWUuYnVmZmVyLnRvU3RyaW5nKCkgPT09ICdbb2JqZWN0IEFycmF5QnVmZmVyXScpKSB7XG5cdCAgICAgICAgICAgIC8vIENvbnZlcnQgYmluYXJ5IGFycmF5cyB0byBhIHN0cmluZyBhbmQgcHJlZml4IHRoZSBzdHJpbmcgd2l0aFxuXHQgICAgICAgICAgICAvLyBhIHNwZWNpYWwgbWFya2VyLlxuXHQgICAgICAgICAgICB2YXIgYnVmZmVyO1xuXHQgICAgICAgICAgICB2YXIgbWFya2VyID0gU0VSSUFMSVpFRF9NQVJLRVI7XG5cblx0ICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcblx0ICAgICAgICAgICAgICAgIGJ1ZmZlciA9IHZhbHVlO1xuXHQgICAgICAgICAgICAgICAgbWFya2VyICs9IFRZUEVfQVJSQVlCVUZGRVI7XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBidWZmZXIgPSB2YWx1ZS5idWZmZXI7XG5cblx0ICAgICAgICAgICAgICAgIGlmICh2YWx1ZVN0cmluZyA9PT0gJ1tvYmplY3QgSW50OEFycmF5XScpIHtcblx0ICAgICAgICAgICAgICAgICAgICBtYXJrZXIgKz0gVFlQRV9JTlQ4QVJSQVk7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlU3RyaW5nID09PSAnW29iamVjdCBVaW50OEFycmF5XScpIHtcblx0ICAgICAgICAgICAgICAgICAgICBtYXJrZXIgKz0gVFlQRV9VSU5UOEFSUkFZO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZVN0cmluZyA9PT0gJ1tvYmplY3QgVWludDhDbGFtcGVkQXJyYXldJykge1xuXHQgICAgICAgICAgICAgICAgICAgIG1hcmtlciArPSBUWVBFX1VJTlQ4Q0xBTVBFREFSUkFZO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZVN0cmluZyA9PT0gJ1tvYmplY3QgSW50MTZBcnJheV0nKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgbWFya2VyICs9IFRZUEVfSU5UMTZBUlJBWTtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWVTdHJpbmcgPT09ICdbb2JqZWN0IFVpbnQxNkFycmF5XScpIHtcblx0ICAgICAgICAgICAgICAgICAgICBtYXJrZXIgKz0gVFlQRV9VSU5UMTZBUlJBWTtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWVTdHJpbmcgPT09ICdbb2JqZWN0IEludDMyQXJyYXldJykge1xuXHQgICAgICAgICAgICAgICAgICAgIG1hcmtlciArPSBUWVBFX0lOVDMyQVJSQVk7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlU3RyaW5nID09PSAnW29iamVjdCBVaW50MzJBcnJheV0nKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgbWFya2VyICs9IFRZUEVfVUlOVDMyQVJSQVk7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlU3RyaW5nID09PSAnW29iamVjdCBGbG9hdDMyQXJyYXldJykge1xuXHQgICAgICAgICAgICAgICAgICAgIG1hcmtlciArPSBUWVBFX0ZMT0FUMzJBUlJBWTtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWVTdHJpbmcgPT09ICdbb2JqZWN0IEZsb2F0NjRBcnJheV0nKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgbWFya2VyICs9IFRZUEVfRkxPQVQ2NEFSUkFZO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoJ0ZhaWxlZCB0byBnZXQgdHlwZSBmb3IgQmluYXJ5QXJyYXknKSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBjYWxsYmFjayhtYXJrZXIgKyBidWZmZXJUb1N0cmluZyhidWZmZXIpKTtcblx0ICAgICAgICB9IGVsc2UgaWYgKHZhbHVlU3RyaW5nID09PSAnW29iamVjdCBCbG9iXScpIHtcblx0ICAgICAgICAgICAgLy8gQ29udmVyIHRoZSBibG9iIHRvIGEgYmluYXJ5QXJyYXkgYW5kIHRoZW4gdG8gYSBzdHJpbmcuXG5cdCAgICAgICAgICAgIHZhciBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblxuXHQgICAgICAgICAgICBmaWxlUmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIC8vIEJhY2t3YXJkcy1jb21wYXRpYmxlIHByZWZpeCBmb3IgdGhlIGJsb2IgdHlwZS5cblx0ICAgICAgICAgICAgICAgIHZhciBzdHIgPSBCTE9CX1RZUEVfUFJFRklYICsgdmFsdWUudHlwZSArICd+JyArIGJ1ZmZlclRvU3RyaW5nKHRoaXMucmVzdWx0KTtcblxuXHQgICAgICAgICAgICAgICAgY2FsbGJhY2soU0VSSUFMSVpFRF9NQVJLRVIgKyBUWVBFX0JMT0IgKyBzdHIpO1xuXHQgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICAgIGZpbGVSZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIodmFsdWUpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgICAgICBjYWxsYmFjayhKU09OLnN0cmluZ2lmeSh2YWx1ZSkpO1xuXHQgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG5cdCAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQ291bGRuJ3QgY29udmVydCB2YWx1ZSBpbnRvIGEgSlNPTiBzdHJpbmc6IFwiLCB2YWx1ZSk7XG5cblx0ICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIGUpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICAvLyBEZXNlcmlhbGl6ZSBkYXRhIHdlJ3ZlIGluc2VydGVkIGludG8gYSB2YWx1ZSBjb2x1bW4vZmllbGQuIFdlIHBsYWNlXG5cdCAgICAvLyBzcGVjaWFsIG1hcmtlcnMgaW50byBvdXIgc3RyaW5ncyB0byBtYXJrIHRoZW0gYXMgZW5jb2RlZDsgdGhpcyBpc24ndFxuXHQgICAgLy8gYXMgbmljZSBhcyBhIG1ldGEgZmllbGQsIGJ1dCBpdCdzIHRoZSBvbmx5IHNhbmUgdGhpbmcgd2UgY2FuIGRvIHdoaWxzdFxuXHQgICAgLy8ga2VlcGluZyBsb2NhbFN0b3JhZ2Ugc3VwcG9ydCBpbnRhY3QuXG5cdCAgICAvL1xuXHQgICAgLy8gT2Z0ZW50aW1lcyB0aGlzIHdpbGwganVzdCBkZXNlcmlhbGl6ZSBKU09OIGNvbnRlbnQsIGJ1dCBpZiB3ZSBoYXZlIGFcblx0ICAgIC8vIHNwZWNpYWwgbWFya2VyIChTRVJJQUxJWkVEX01BUktFUiwgZGVmaW5lZCBhYm92ZSksIHdlIHdpbGwgZXh0cmFjdFxuXHQgICAgLy8gc29tZSBraW5kIG9mIGFycmF5YnVmZmVyL2JpbmFyeSBkYXRhL3R5cGVkIGFycmF5IG91dCBvZiB0aGUgc3RyaW5nLlxuXHQgICAgZnVuY3Rpb24gZGVzZXJpYWxpemUodmFsdWUpIHtcblx0ICAgICAgICAvLyBJZiB3ZSBoYXZlbid0IG1hcmtlZCB0aGlzIHN0cmluZyBhcyBiZWluZyBzcGVjaWFsbHkgc2VyaWFsaXplZCAoaS5lLlxuXHQgICAgICAgIC8vIHNvbWV0aGluZyBvdGhlciB0aGFuIHNlcmlhbGl6ZWQgSlNPTiksIHdlIGNhbiBqdXN0IHJldHVybiBpdCBhbmQgYmVcblx0ICAgICAgICAvLyBkb25lIHdpdGggaXQuXG5cdCAgICAgICAgaWYgKHZhbHVlLnN1YnN0cmluZygwLCBTRVJJQUxJWkVEX01BUktFUl9MRU5HVEgpICE9PSBTRVJJQUxJWkVEX01BUktFUikge1xuXHQgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZSh2YWx1ZSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBjb2RlIGRlYWxzIHdpdGggZGVzZXJpYWxpemluZyBzb21lIGtpbmQgb2YgQmxvYiBvclxuXHQgICAgICAgIC8vIFR5cGVkQXJyYXkuIEZpcnN0IHdlIHNlcGFyYXRlIG91dCB0aGUgdHlwZSBvZiBkYXRhIHdlJ3JlIGRlYWxpbmdcblx0ICAgICAgICAvLyB3aXRoIGZyb20gdGhlIGRhdGEgaXRzZWxmLlxuXHQgICAgICAgIHZhciBzZXJpYWxpemVkU3RyaW5nID0gdmFsdWUuc3Vic3RyaW5nKFRZUEVfU0VSSUFMSVpFRF9NQVJLRVJfTEVOR1RIKTtcblx0ICAgICAgICB2YXIgdHlwZSA9IHZhbHVlLnN1YnN0cmluZyhTRVJJQUxJWkVEX01BUktFUl9MRU5HVEgsIFRZUEVfU0VSSUFMSVpFRF9NQVJLRVJfTEVOR1RIKTtcblxuXHQgICAgICAgIHZhciBibG9iVHlwZTtcblx0ICAgICAgICAvLyBCYWNrd2FyZHMtY29tcGF0aWJsZSBibG9iIHR5cGUgc2VyaWFsaXphdGlvbiBzdHJhdGVneS5cblx0ICAgICAgICAvLyBEQnMgY3JlYXRlZCB3aXRoIG9sZGVyIHZlcnNpb25zIG9mIGxvY2FsRm9yYWdlIHdpbGwgc2ltcGx5IG5vdCBoYXZlIHRoZSBibG9iIHR5cGUuXG5cdCAgICAgICAgaWYgKHR5cGUgPT09IFRZUEVfQkxPQiAmJiBCTE9CX1RZUEVfUFJFRklYX1JFR0VYLnRlc3Qoc2VyaWFsaXplZFN0cmluZykpIHtcblx0ICAgICAgICAgICAgdmFyIG1hdGNoZXIgPSBzZXJpYWxpemVkU3RyaW5nLm1hdGNoKEJMT0JfVFlQRV9QUkVGSVhfUkVHRVgpO1xuXHQgICAgICAgICAgICBibG9iVHlwZSA9IG1hdGNoZXJbMV07XG5cdCAgICAgICAgICAgIHNlcmlhbGl6ZWRTdHJpbmcgPSBzZXJpYWxpemVkU3RyaW5nLnN1YnN0cmluZyhtYXRjaGVyWzBdLmxlbmd0aCk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHZhciBidWZmZXIgPSBzdHJpbmdUb0J1ZmZlcihzZXJpYWxpemVkU3RyaW5nKTtcblxuXHQgICAgICAgIC8vIFJldHVybiB0aGUgcmlnaHQgdHlwZSBiYXNlZCBvbiB0aGUgY29kZS90eXBlIHNldCBkdXJpbmdcblx0ICAgICAgICAvLyBzZXJpYWxpemF0aW9uLlxuXHQgICAgICAgIHN3aXRjaCAodHlwZSkge1xuXHQgICAgICAgICAgICBjYXNlIFRZUEVfQVJSQVlCVUZGRVI6XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gYnVmZmVyO1xuXHQgICAgICAgICAgICBjYXNlIFRZUEVfQkxPQjpcblx0ICAgICAgICAgICAgICAgIHJldHVybiBfY3JlYXRlQmxvYihbYnVmZmVyXSwgeyB0eXBlOiBibG9iVHlwZSB9KTtcblx0ICAgICAgICAgICAgY2FzZSBUWVBFX0lOVDhBUlJBWTpcblx0ICAgICAgICAgICAgICAgIHJldHVybiBuZXcgSW50OEFycmF5KGJ1ZmZlcik7XG5cdCAgICAgICAgICAgIGNhc2UgVFlQRV9VSU5UOEFSUkFZOlxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG5cdCAgICAgICAgICAgIGNhc2UgVFlQRV9VSU5UOENMQU1QRURBUlJBWTpcblx0ICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVWludDhDbGFtcGVkQXJyYXkoYnVmZmVyKTtcblx0ICAgICAgICAgICAgY2FzZSBUWVBFX0lOVDE2QVJSQVk6XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEludDE2QXJyYXkoYnVmZmVyKTtcblx0ICAgICAgICAgICAgY2FzZSBUWVBFX1VJTlQxNkFSUkFZOlxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBVaW50MTZBcnJheShidWZmZXIpO1xuXHQgICAgICAgICAgICBjYXNlIFRZUEVfSU5UMzJBUlJBWTpcblx0ICAgICAgICAgICAgICAgIHJldHVybiBuZXcgSW50MzJBcnJheShidWZmZXIpO1xuXHQgICAgICAgICAgICBjYXNlIFRZUEVfVUlOVDMyQVJSQVk6XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFVpbnQzMkFycmF5KGJ1ZmZlcik7XG5cdCAgICAgICAgICAgIGNhc2UgVFlQRV9GTE9BVDMyQVJSQVk6XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShidWZmZXIpO1xuXHQgICAgICAgICAgICBjYXNlIFRZUEVfRkxPQVQ2NEFSUkFZOlxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBGbG9hdDY0QXJyYXkoYnVmZmVyKTtcblx0ICAgICAgICAgICAgZGVmYXVsdDpcblx0ICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rb3duIHR5cGU6ICcgKyB0eXBlKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIHN0cmluZ1RvQnVmZmVyKHNlcmlhbGl6ZWRTdHJpbmcpIHtcblx0ICAgICAgICAvLyBGaWxsIHRoZSBzdHJpbmcgaW50byBhIEFycmF5QnVmZmVyLlxuXHQgICAgICAgIHZhciBidWZmZXJMZW5ndGggPSBzZXJpYWxpemVkU3RyaW5nLmxlbmd0aCAqIDAuNzU7XG5cdCAgICAgICAgdmFyIGxlbiA9IHNlcmlhbGl6ZWRTdHJpbmcubGVuZ3RoO1xuXHQgICAgICAgIHZhciBpO1xuXHQgICAgICAgIHZhciBwID0gMDtcblx0ICAgICAgICB2YXIgZW5jb2RlZDEsIGVuY29kZWQyLCBlbmNvZGVkMywgZW5jb2RlZDQ7XG5cblx0ICAgICAgICBpZiAoc2VyaWFsaXplZFN0cmluZ1tzZXJpYWxpemVkU3RyaW5nLmxlbmd0aCAtIDFdID09PSAnPScpIHtcblx0ICAgICAgICAgICAgYnVmZmVyTGVuZ3RoLS07XG5cdCAgICAgICAgICAgIGlmIChzZXJpYWxpemVkU3RyaW5nW3NlcmlhbGl6ZWRTdHJpbmcubGVuZ3RoIC0gMl0gPT09ICc9Jykge1xuXHQgICAgICAgICAgICAgICAgYnVmZmVyTGVuZ3RoLS07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKGJ1ZmZlckxlbmd0aCk7XG5cdCAgICAgICAgdmFyIGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcblxuXHQgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuXHQgICAgICAgICAgICBlbmNvZGVkMSA9IEJBU0VfQ0hBUlMuaW5kZXhPZihzZXJpYWxpemVkU3RyaW5nW2ldKTtcblx0ICAgICAgICAgICAgZW5jb2RlZDIgPSBCQVNFX0NIQVJTLmluZGV4T2Yoc2VyaWFsaXplZFN0cmluZ1tpICsgMV0pO1xuXHQgICAgICAgICAgICBlbmNvZGVkMyA9IEJBU0VfQ0hBUlMuaW5kZXhPZihzZXJpYWxpemVkU3RyaW5nW2kgKyAyXSk7XG5cdCAgICAgICAgICAgIGVuY29kZWQ0ID0gQkFTRV9DSEFSUy5pbmRleE9mKHNlcmlhbGl6ZWRTdHJpbmdbaSArIDNdKTtcblxuXHQgICAgICAgICAgICAvKmpzbGludCBiaXR3aXNlOiB0cnVlICovXG5cdCAgICAgICAgICAgIGJ5dGVzW3ArK10gPSBlbmNvZGVkMSA8PCAyIHwgZW5jb2RlZDIgPj4gNDtcblx0ICAgICAgICAgICAgYnl0ZXNbcCsrXSA9IChlbmNvZGVkMiAmIDE1KSA8PCA0IHwgZW5jb2RlZDMgPj4gMjtcblx0ICAgICAgICAgICAgYnl0ZXNbcCsrXSA9IChlbmNvZGVkMyAmIDMpIDw8IDYgfCBlbmNvZGVkNCAmIDYzO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gYnVmZmVyO1xuXHQgICAgfVxuXG5cdCAgICAvLyBDb252ZXJ0cyBhIGJ1ZmZlciB0byBhIHN0cmluZyB0byBzdG9yZSwgc2VyaWFsaXplZCwgaW4gdGhlIGJhY2tlbmRcblx0ICAgIC8vIHN0b3JhZ2UgbGlicmFyeS5cblx0ICAgIGZ1bmN0aW9uIGJ1ZmZlclRvU3RyaW5nKGJ1ZmZlcikge1xuXHQgICAgICAgIC8vIGJhc2U2NC1hcnJheWJ1ZmZlclxuXHQgICAgICAgIHZhciBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG5cdCAgICAgICAgdmFyIGJhc2U2NFN0cmluZyA9ICcnO1xuXHQgICAgICAgIHZhciBpO1xuXG5cdCAgICAgICAgZm9yIChpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAzKSB7XG5cdCAgICAgICAgICAgIC8qanNsaW50IGJpdHdpc2U6IHRydWUgKi9cblx0ICAgICAgICAgICAgYmFzZTY0U3RyaW5nICs9IEJBU0VfQ0hBUlNbYnl0ZXNbaV0gPj4gMl07XG5cdCAgICAgICAgICAgIGJhc2U2NFN0cmluZyArPSBCQVNFX0NIQVJTWyhieXRlc1tpXSAmIDMpIDw8IDQgfCBieXRlc1tpICsgMV0gPj4gNF07XG5cdCAgICAgICAgICAgIGJhc2U2NFN0cmluZyArPSBCQVNFX0NIQVJTWyhieXRlc1tpICsgMV0gJiAxNSkgPDwgMiB8IGJ5dGVzW2kgKyAyXSA+PiA2XTtcblx0ICAgICAgICAgICAgYmFzZTY0U3RyaW5nICs9IEJBU0VfQ0hBUlNbYnl0ZXNbaSArIDJdICYgNjNdO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmIChieXRlcy5sZW5ndGggJSAzID09PSAyKSB7XG5cdCAgICAgICAgICAgIGJhc2U2NFN0cmluZyA9IGJhc2U2NFN0cmluZy5zdWJzdHJpbmcoMCwgYmFzZTY0U3RyaW5nLmxlbmd0aCAtIDEpICsgJz0nO1xuXHQgICAgICAgIH0gZWxzZSBpZiAoYnl0ZXMubGVuZ3RoICUgMyA9PT0gMSkge1xuXHQgICAgICAgICAgICBiYXNlNjRTdHJpbmcgPSBiYXNlNjRTdHJpbmcuc3Vic3RyaW5nKDAsIGJhc2U2NFN0cmluZy5sZW5ndGggLSAyKSArICc9PSc7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIGJhc2U2NFN0cmluZztcblx0ICAgIH1cblxuXHQgICAgdmFyIGxvY2FsZm9yYWdlU2VyaWFsaXplciA9IHtcblx0ICAgICAgICBzZXJpYWxpemU6IHNlcmlhbGl6ZSxcblx0ICAgICAgICBkZXNlcmlhbGl6ZTogZGVzZXJpYWxpemUsXG5cdCAgICAgICAgc3RyaW5nVG9CdWZmZXI6IHN0cmluZ1RvQnVmZmVyLFxuXHQgICAgICAgIGJ1ZmZlclRvU3RyaW5nOiBidWZmZXJUb1N0cmluZ1xuXHQgICAgfTtcblxuXHQgICAgZXhwb3J0c1snZGVmYXVsdCddID0gbG9jYWxmb3JhZ2VTZXJpYWxpemVyO1xuXHR9KS5jYWxsKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogc2VsZik7XG5cdG1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuXG4vKioqLyB9LFxuLyogNCAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0Lypcblx0ICogSW5jbHVkZXMgY29kZSBmcm9tOlxuXHQgKlxuXHQgKiBiYXNlNjQtYXJyYXlidWZmZXJcblx0ICogaHR0cHM6Ly9naXRodWIuY29tL25pa2xhc3ZoL2Jhc2U2NC1hcnJheWJ1ZmZlclxuXHQgKlxuXHQgKiBDb3B5cmlnaHQgKGMpIDIwMTIgTmlrbGFzIHZvbiBIZXJ0emVuXG5cdCAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cblx0ICovXG5cdCd1c2Ugc3RyaWN0JztcblxuXHRleHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXHQoZnVuY3Rpb24gKCkge1xuXHQgICAgJ3VzZSBzdHJpY3QnO1xuXG5cdCAgICB2YXIgZ2xvYmFsT2JqZWN0ID0gdGhpcztcblx0ICAgIHZhciBvcGVuRGF0YWJhc2UgPSB0aGlzLm9wZW5EYXRhYmFzZTtcblxuXHQgICAgLy8gSWYgV2ViU1FMIG1ldGhvZHMgYXJlbid0IGF2YWlsYWJsZSwgd2UgY2FuIHN0b3Agbm93LlxuXHQgICAgaWYgKCFvcGVuRGF0YWJhc2UpIHtcblx0ICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cblx0ICAgIC8vIE9wZW4gdGhlIFdlYlNRTCBkYXRhYmFzZSAoYXV0b21hdGljYWxseSBjcmVhdGVzIG9uZSBpZiBvbmUgZGlkbid0XG5cdCAgICAvLyBwcmV2aW91c2x5IGV4aXN0KSwgdXNpbmcgYW55IG9wdGlvbnMgc2V0IGluIHRoZSBjb25maWcuXG5cdCAgICBmdW5jdGlvbiBfaW5pdFN0b3JhZ2Uob3B0aW9ucykge1xuXHQgICAgICAgIHZhciBzZWxmID0gdGhpcztcblx0ICAgICAgICB2YXIgZGJJbmZvID0ge1xuXHQgICAgICAgICAgICBkYjogbnVsbFxuXHQgICAgICAgIH07XG5cblx0ICAgICAgICBpZiAob3B0aW9ucykge1xuXHQgICAgICAgICAgICBmb3IgKHZhciBpIGluIG9wdGlvbnMpIHtcblx0ICAgICAgICAgICAgICAgIGRiSW5mb1tpXSA9IHR5cGVvZiBvcHRpb25zW2ldICE9PSAnc3RyaW5nJyA/IG9wdGlvbnNbaV0udG9TdHJpbmcoKSA6IG9wdGlvbnNbaV07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgZGJJbmZvUHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgLy8gT3BlbiB0aGUgZGF0YWJhc2U7IHRoZSBvcGVuRGF0YWJhc2UgQVBJIHdpbGwgYXV0b21hdGljYWxseVxuXHQgICAgICAgICAgICAvLyBjcmVhdGUgaXQgZm9yIHVzIGlmIGl0IGRvZXNuJ3QgZXhpc3QuXG5cdCAgICAgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgICAgICBkYkluZm8uZGIgPSBvcGVuRGF0YWJhc2UoZGJJbmZvLm5hbWUsIFN0cmluZyhkYkluZm8udmVyc2lvbiksIGRiSW5mby5kZXNjcmlwdGlvbiwgZGJJbmZvLnNpemUpO1xuXHQgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5zZXREcml2ZXIoc2VsZi5MT0NBTFNUT1JBR0UpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLl9pbml0U3RvcmFnZShvcHRpb25zKTtcblx0ICAgICAgICAgICAgICAgIH0pLnRoZW4ocmVzb2x2ZSlbJ2NhdGNoJ10ocmVqZWN0KTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8vIENyZWF0ZSBvdXIga2V5L3ZhbHVlIHRhYmxlIGlmIGl0IGRvZXNuJ3QgZXhpc3QuXG5cdCAgICAgICAgICAgIGRiSW5mby5kYi50cmFuc2FjdGlvbihmdW5jdGlvbiAodCkge1xuXHQgICAgICAgICAgICAgICAgdC5leGVjdXRlU3FsKCdDUkVBVEUgVEFCTEUgSUYgTk9UIEVYSVNUUyAnICsgZGJJbmZvLnN0b3JlTmFtZSArICcgKGlkIElOVEVHRVIgUFJJTUFSWSBLRVksIGtleSB1bmlxdWUsIHZhbHVlKScsIFtdLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgc2VsZi5fZGJJbmZvID0gZGJJbmZvO1xuXHQgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcblx0ICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICh0LCBlcnJvcikge1xuXHQgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHQgICAgICAgICAgICByZXNvbHZlKF9fd2VicGFja19yZXF1aXJlX18oMykpO1xuXHQgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKGxpYikge1xuXHQgICAgICAgICAgICBkYkluZm8uc2VyaWFsaXplciA9IGxpYjtcblx0ICAgICAgICAgICAgcmV0dXJuIGRiSW5mb1Byb21pc2U7XG5cdCAgICAgICAgfSk7XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGdldEl0ZW0oa2V5LCBjYWxsYmFjaykge1xuXHQgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuXHQgICAgICAgIC8vIENhc3QgdGhlIGtleSB0byBhIHN0cmluZywgYXMgdGhhdCdzIGFsbCB3ZSBjYW4gc2V0IGFzIGEga2V5LlxuXHQgICAgICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgICBnbG9iYWxPYmplY3QuY29uc29sZS53YXJuKGtleSArICcgdXNlZCBhcyBhIGtleSwgYnV0IGl0IGlzIG5vdCBhIHN0cmluZy4nKTtcblx0ICAgICAgICAgICAga2V5ID0gU3RyaW5nKGtleSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgIHNlbGYucmVhZHkoKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBkYkluZm8gPSBzZWxmLl9kYkluZm87XG5cdCAgICAgICAgICAgICAgICBkYkluZm8uZGIudHJhbnNhY3Rpb24oZnVuY3Rpb24gKHQpIHtcblx0ICAgICAgICAgICAgICAgICAgICB0LmV4ZWN1dGVTcWwoJ1NFTEVDVCAqIEZST00gJyArIGRiSW5mby5zdG9yZU5hbWUgKyAnIFdIRVJFIGtleSA9ID8gTElNSVQgMScsIFtrZXldLCBmdW5jdGlvbiAodCwgcmVzdWx0cykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gcmVzdWx0cy5yb3dzLmxlbmd0aCA/IHJlc3VsdHMucm93cy5pdGVtKDApLnZhbHVlIDogbnVsbDtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhpcyBpcyBzZXJpYWxpemVkIGNvbnRlbnQgd2UgbmVlZCB0b1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvLyB1bnBhY2suXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGRiSW5mby5zZXJpYWxpemVyLmRlc2VyaWFsaXplKHJlc3VsdCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG5cdCAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKHQsIGVycm9yKSB7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcblx0ICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICB9KVsnY2F0Y2gnXShyZWplY3QpO1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKTtcblx0ICAgICAgICByZXR1cm4gcHJvbWlzZTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gaXRlcmF0ZShpdGVyYXRvciwgY2FsbGJhY2spIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgc2VsZi5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgdmFyIGRiSW5mbyA9IHNlbGYuX2RiSW5mbztcblxuXHQgICAgICAgICAgICAgICAgZGJJbmZvLmRiLnRyYW5zYWN0aW9uKGZ1bmN0aW9uICh0KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdC5leGVjdXRlU3FsKCdTRUxFQ1QgKiBGUk9NICcgKyBkYkluZm8uc3RvcmVOYW1lLCBbXSwgZnVuY3Rpb24gKHQsIHJlc3VsdHMpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJvd3MgPSByZXN1bHRzLnJvd3M7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSByb3dzLmxlbmd0aDtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IHJvd3MuaXRlbShpKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBpdGVtLnZhbHVlO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhpcyBpcyBzZXJpYWxpemVkIGNvbnRlbnRcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlIG5lZWQgdG8gdW5wYWNrLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGRiSW5mby5zZXJpYWxpemVyLmRlc2VyaWFsaXplKHJlc3VsdCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGl0ZXJhdG9yKHJlc3VsdCwgaXRlbS5rZXksIGkgKyAxKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdm9pZCgwKSBwcmV2ZW50cyBwcm9ibGVtcyB3aXRoIHJlZGVmaW5pdGlvblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb2YgYHVuZGVmaW5lZGAuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICE9PSB2b2lkIDApIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuXHQgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICh0LCBlcnJvcikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuXHQgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH0pWydjYXRjaCddKHJlamVjdCk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBzZXRJdGVtKGtleSwgdmFsdWUsIGNhbGxiYWNrKSB7XG5cdCAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG5cdCAgICAgICAgLy8gQ2FzdCB0aGUga2V5IHRvIGEgc3RyaW5nLCBhcyB0aGF0J3MgYWxsIHdlIGNhbiBzZXQgYXMgYSBrZXkuXG5cdCAgICAgICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICAgIGdsb2JhbE9iamVjdC5jb25zb2xlLndhcm4oa2V5ICsgJyB1c2VkIGFzIGEga2V5LCBidXQgaXQgaXMgbm90IGEgc3RyaW5nLicpO1xuXHQgICAgICAgICAgICBrZXkgPSBTdHJpbmcoa2V5KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgc2VsZi5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgLy8gVGhlIGxvY2FsU3RvcmFnZSBBUEkgZG9lc24ndCByZXR1cm4gdW5kZWZpbmVkIHZhbHVlcyBpbiBhblxuXHQgICAgICAgICAgICAgICAgLy8gXCJleHBlY3RlZFwiIHdheSwgc28gdW5kZWZpbmVkIGlzIGFsd2F5cyBjYXN0IHRvIG51bGwgaW4gYWxsXG5cdCAgICAgICAgICAgICAgICAvLyBkcml2ZXJzLiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9tb3ppbGxhL2xvY2FsRm9yYWdlL3B1bGwvNDJcblx0ICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBudWxsO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvLyBTYXZlIHRoZSBvcmlnaW5hbCB2YWx1ZSB0byBwYXNzIHRvIHRoZSBjYWxsYmFjay5cblx0ICAgICAgICAgICAgICAgIHZhciBvcmlnaW5hbFZhbHVlID0gdmFsdWU7XG5cblx0ICAgICAgICAgICAgICAgIHZhciBkYkluZm8gPSBzZWxmLl9kYkluZm87XG5cdCAgICAgICAgICAgICAgICBkYkluZm8uc2VyaWFsaXplci5zZXJpYWxpemUodmFsdWUsIGZ1bmN0aW9uICh2YWx1ZSwgZXJyb3IpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBkYkluZm8uZGIudHJhbnNhY3Rpb24oZnVuY3Rpb24gKHQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHQuZXhlY3V0ZVNxbCgnSU5TRVJUIE9SIFJFUExBQ0UgSU5UTyAnICsgZGJJbmZvLnN0b3JlTmFtZSArICcgKGtleSwgdmFsdWUpIFZBTFVFUyAoPywgPyknLCBba2V5LCB2YWx1ZV0sIGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG9yaWdpbmFsVmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKHQsIGVycm9yKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoc3FsRXJyb3IpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSB0cmFuc2FjdGlvbiBmYWlsZWQ7IGNoZWNrXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0byBzZWUgaWYgaXQncyBhIHF1b3RhIGVycm9yLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNxbEVycm9yLmNvZGUgPT09IHNxbEVycm9yLlFVT1RBX0VSUikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIHJlamVjdCB0aGUgY2FsbGJhY2sgb3V0cmlnaHQgZm9yIG5vdywgYnV0XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXQncyB3b3J0aCB0cnlpbmcgdG8gcmUtcnVuIHRoZSB0cmFuc2FjdGlvbi5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFdmVuIGlmIHRoZSB1c2VyIGFjY2VwdHMgdGhlIHByb21wdCB0byB1c2Vcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBtb3JlIHN0b3JhZ2Ugb24gU2FmYXJpLCB0aGlzIGVycm9yIHdpbGxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBiZSBjYWxsZWQuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBUcnkgdG8gcmUtcnVuIHRoZSB0cmFuc2FjdGlvbi5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3Qoc3FsRXJyb3IpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfSlbJ2NhdGNoJ10ocmVqZWN0KTtcblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIGV4ZWN1dGVDYWxsYmFjayhwcm9taXNlLCBjYWxsYmFjayk7XG5cdCAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIHJlbW92ZUl0ZW0oa2V5LCBjYWxsYmFjaykge1xuXHQgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuXHQgICAgICAgIC8vIENhc3QgdGhlIGtleSB0byBhIHN0cmluZywgYXMgdGhhdCdzIGFsbCB3ZSBjYW4gc2V0IGFzIGEga2V5LlxuXHQgICAgICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgICBnbG9iYWxPYmplY3QuY29uc29sZS53YXJuKGtleSArICcgdXNlZCBhcyBhIGtleSwgYnV0IGl0IGlzIG5vdCBhIHN0cmluZy4nKTtcblx0ICAgICAgICAgICAga2V5ID0gU3RyaW5nKGtleSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgIHNlbGYucmVhZHkoKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBkYkluZm8gPSBzZWxmLl9kYkluZm87XG5cdCAgICAgICAgICAgICAgICBkYkluZm8uZGIudHJhbnNhY3Rpb24oZnVuY3Rpb24gKHQpIHtcblx0ICAgICAgICAgICAgICAgICAgICB0LmV4ZWN1dGVTcWwoJ0RFTEVURSBGUk9NICcgKyBkYkluZm8uc3RvcmVOYW1lICsgJyBXSEVSRSBrZXkgPSA/JywgW2tleV0sIGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuXHQgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICh0LCBlcnJvcikge1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG5cdCAgICAgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfSlbJ2NhdGNoJ10ocmVqZWN0KTtcblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIGV4ZWN1dGVDYWxsYmFjayhwcm9taXNlLCBjYWxsYmFjayk7XG5cdCAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cdCAgICB9XG5cblx0ICAgIC8vIERlbGV0ZXMgZXZlcnkgaXRlbSBpbiB0aGUgdGFibGUuXG5cdCAgICAvLyBUT0RPOiBGaW5kIG91dCBpZiB0aGlzIHJlc2V0cyB0aGUgQVVUT19JTkNSRU1FTlQgbnVtYmVyLlxuXHQgICAgZnVuY3Rpb24gY2xlYXIoY2FsbGJhY2spIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgc2VsZi5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgdmFyIGRiSW5mbyA9IHNlbGYuX2RiSW5mbztcblx0ICAgICAgICAgICAgICAgIGRiSW5mby5kYi50cmFuc2FjdGlvbihmdW5jdGlvbiAodCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHQuZXhlY3V0ZVNxbCgnREVMRVRFIEZST00gJyArIGRiSW5mby5zdG9yZU5hbWUsIFtdLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcblx0ICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAodCwgZXJyb3IpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcblx0ICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICB9KVsnY2F0Y2gnXShyZWplY3QpO1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKTtcblx0ICAgICAgICByZXR1cm4gcHJvbWlzZTtcblx0ICAgIH1cblxuXHQgICAgLy8gRG9lcyBhIHNpbXBsZSBgQ09VTlQoa2V5KWAgdG8gZ2V0IHRoZSBudW1iZXIgb2YgaXRlbXMgc3RvcmVkIGluXG5cdCAgICAvLyBsb2NhbEZvcmFnZS5cblx0ICAgIGZ1bmN0aW9uIGxlbmd0aChjYWxsYmFjaykge1xuXHQgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuXHQgICAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHQgICAgICAgICAgICBzZWxmLnJlYWR5KCkudGhlbihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgZGJJbmZvID0gc2VsZi5fZGJJbmZvO1xuXHQgICAgICAgICAgICAgICAgZGJJbmZvLmRiLnRyYW5zYWN0aW9uKGZ1bmN0aW9uICh0KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLy8gQWhoaCwgU1FMIG1ha2VzIHRoaXMgb25lIHNvb29vb28gZWFzeS5cblx0ICAgICAgICAgICAgICAgICAgICB0LmV4ZWN1dGVTcWwoJ1NFTEVDVCBDT1VOVChrZXkpIGFzIGMgRlJPTSAnICsgZGJJbmZvLnN0b3JlTmFtZSwgW10sIGZ1bmN0aW9uICh0LCByZXN1bHRzKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSByZXN1bHRzLnJvd3MuaXRlbSgwKS5jO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcblx0ICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAodCwgZXJyb3IpIHtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuXHQgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH0pWydjYXRjaCddKHJlamVjdCk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICAvLyBSZXR1cm4gdGhlIGtleSBsb2NhdGVkIGF0IGtleSBpbmRleCBYOyBlc3NlbnRpYWxseSBnZXRzIHRoZSBrZXkgZnJvbSBhXG5cdCAgICAvLyBgV0hFUkUgaWQgPSA/YC4gVGhpcyBpcyB0aGUgbW9zdCBlZmZpY2llbnQgd2F5IEkgY2FuIHRoaW5rIHRvIGltcGxlbWVudFxuXHQgICAgLy8gdGhpcyByYXJlbHktdXNlZCAoaW4gbXkgZXhwZXJpZW5jZSkgcGFydCBvZiB0aGUgQVBJLCBidXQgaXQgY2FuIHNlZW1cblx0ICAgIC8vIGluY29uc2lzdGVudCwgYmVjYXVzZSB3ZSBkbyBgSU5TRVJUIE9SIFJFUExBQ0UgSU5UT2Agb24gYHNldEl0ZW0oKWAsIHNvXG5cdCAgICAvLyB0aGUgSUQgb2YgZWFjaCBrZXkgd2lsbCBjaGFuZ2UgZXZlcnkgdGltZSBpdCdzIHVwZGF0ZWQuIFBlcmhhcHMgYSBzdG9yZWRcblx0ICAgIC8vIHByb2NlZHVyZSBmb3IgdGhlIGBzZXRJdGVtKClgIFNRTCB3b3VsZCBzb2x2ZSB0aGlzIHByb2JsZW0/XG5cdCAgICAvLyBUT0RPOiBEb24ndCBjaGFuZ2UgSUQgb24gYHNldEl0ZW0oKWAuXG5cdCAgICBmdW5jdGlvbiBrZXkobiwgY2FsbGJhY2spIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgc2VsZi5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgdmFyIGRiSW5mbyA9IHNlbGYuX2RiSW5mbztcblx0ICAgICAgICAgICAgICAgIGRiSW5mby5kYi50cmFuc2FjdGlvbihmdW5jdGlvbiAodCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHQuZXhlY3V0ZVNxbCgnU0VMRUNUIGtleSBGUk9NICcgKyBkYkluZm8uc3RvcmVOYW1lICsgJyBXSEVSRSBpZCA9ID8gTElNSVQgMScsIFtuICsgMV0sIGZ1bmN0aW9uICh0LCByZXN1bHRzKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSByZXN1bHRzLnJvd3MubGVuZ3RoID8gcmVzdWx0cy5yb3dzLml0ZW0oMCkua2V5IDogbnVsbDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuXHQgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICh0LCBlcnJvcikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuXHQgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH0pWydjYXRjaCddKHJlamVjdCk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBrZXlzKGNhbGxiYWNrKSB7XG5cdCAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG5cdCAgICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgIHNlbGYucmVhZHkoKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBkYkluZm8gPSBzZWxmLl9kYkluZm87XG5cdCAgICAgICAgICAgICAgICBkYkluZm8uZGIudHJhbnNhY3Rpb24oZnVuY3Rpb24gKHQpIHtcblx0ICAgICAgICAgICAgICAgICAgICB0LmV4ZWN1dGVTcWwoJ1NFTEVDVCBrZXkgRlJPTSAnICsgZGJJbmZvLnN0b3JlTmFtZSwgW10sIGZ1bmN0aW9uICh0LCByZXN1bHRzKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXlzID0gW107XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXN1bHRzLnJvd3MubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleXMucHVzaChyZXN1bHRzLnJvd3MuaXRlbShpKS5rZXkpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShrZXlzKTtcblx0ICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAodCwgZXJyb3IpIHtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuXHQgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH0pWydjYXRjaCddKHJlamVjdCk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spIHtcblx0ICAgICAgICBpZiAoY2FsbGJhY2spIHtcblx0ICAgICAgICAgICAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcblx0ICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdCk7XG5cdCAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuXHQgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyb3IpO1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIHZhciB3ZWJTUUxTdG9yYWdlID0ge1xuXHQgICAgICAgIF9kcml2ZXI6ICd3ZWJTUUxTdG9yYWdlJyxcblx0ICAgICAgICBfaW5pdFN0b3JhZ2U6IF9pbml0U3RvcmFnZSxcblx0ICAgICAgICBpdGVyYXRlOiBpdGVyYXRlLFxuXHQgICAgICAgIGdldEl0ZW06IGdldEl0ZW0sXG5cdCAgICAgICAgc2V0SXRlbTogc2V0SXRlbSxcblx0ICAgICAgICByZW1vdmVJdGVtOiByZW1vdmVJdGVtLFxuXHQgICAgICAgIGNsZWFyOiBjbGVhcixcblx0ICAgICAgICBsZW5ndGg6IGxlbmd0aCxcblx0ICAgICAgICBrZXk6IGtleSxcblx0ICAgICAgICBrZXlzOiBrZXlzXG5cdCAgICB9O1xuXG5cdCAgICBleHBvcnRzWydkZWZhdWx0J10gPSB3ZWJTUUxTdG9yYWdlO1xuXHR9KS5jYWxsKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogc2VsZik7XG5cdG1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuXG4vKioqLyB9XG4vKioqKioqLyBdKVxufSk7XG47IiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iXX0=
