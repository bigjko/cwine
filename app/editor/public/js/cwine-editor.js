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
			          img.title = escape(theFile.name);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvZWRpdG9yL3B1YmxpYy9qcy9lZGl0b3IuanMiLCJhcHAvZWRpdG9yL3B1YmxpYy9qcy9sb2FkZXIuanMiLCJhcHAvZWRpdG9yL3B1YmxpYy9qcy9tYWluLmpzIiwibm9kZV9tb2R1bGVzL2xvY2FsZm9yYWdlL2Rpc3QvbG9jYWxmb3JhZ2UuanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1dEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy92YXIgY2xhc3NlcyA9IHJlcXVpcmUoJy4vY2xhc3Nlcy5qcycpO1xudmFyIGxvYWRlciA9IHJlcXVpcmUoXCIuL2xvYWRlci5qc1wiKTtcblxudmFyIHBhbmVscztcbnZhciBjb25maWc7XG52YXIgc3RhZ2U7XG52YXIgdmlld0NvbnRhaW5lcjtcbnZhciBub2RlQ29udGFpbmVyO1xuLy92YXIgZmlyc3RMb2FkID0gdHJ1ZTtcbnZhciB2aWV3U2NhbGUgPSAxO1xudmFyIGRyYWdvZmZzZXQgPSB7eDowLCB5OjB9O1xuLy92YXIgZHJhZ0JveDtcbnZhciB6b29tTnVtYmVyID0gMztcbnZhciB6b29tU3RlcCA9IFswLjIsIDAuMywgMC41LCAwLjc1LCAxLCAxLjUsIDJdO1xudmFyIGRyYWdnaW5nX2VsZW1lbnQ7XG5cbnZhciBkZWZhdWx0R2FtZVBhdGggPSBcIlwiO1xudmFyIGNvbl9yID0gNjtcbnZhciBjdXJyZW50TG9jYWxJbWFnZXM7XG5cblxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cbi8vXHRcdFx0XHRcdFx0XHQgICAvL1xuLy9cdFx0XHRFWFBPUlRTICAgICAgICAgICAgLy9cbi8vXHRcdFx0XHRcdFx0XHQgICAvL1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKG9iaikge1xuXG4gICAgcGFuZWxzID0gb2JqLm5vZGVzO1xuICAgIGNvbmZpZyA9IG9iai5jb25maWc7XG4gICAgXG5cdGlmIChzdGFnZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0c3RhZ2UgPSBuZXcgY3JlYXRlanMuU3RhZ2UoXCJlZGl0X2NhbnZhc1wiKTtcblx0XHRjcmVhdGVqcy5UaWNrZXIuc2V0RlBTKDYwKTtcblx0XHRjcmVhdGVqcy5UaWNrZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRpY2tcIiwgc3RhZ2UpO1xuXHR9XG5cdGVsc2Uge1xuXHRcdHN0YWdlLnJlbW92ZUFsbENoaWxkcmVuKCk7XG5cdFx0dmFyIGJ1YmJsZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmJ1YmJsZVwiKTtcblx0XHR2YXIgdmlldyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdmlld1wiKTtcblx0XHRmb3IgKHZhciBiPTA7IGIgPCBidWJibGVzLmxlbmd0aDsgYisrKSB7XG5cdFx0XHR2aWV3LnJlbW92ZUNoaWxkKGJ1YmJsZXNbYl0pO1xuXHRcdH1cblx0fVxuXG5cdC8vdmFyIGNvb2xfbWFkc19ub2RlID0gbmV3IE5vZGUoXCJwYW5lbFwiKTtcblx0Ly9jb29sX21hZHNfbm9kZS5hZGRTb2NrZXQodHJ1ZSk7XG5cdC8vY29uc29sZS5sb2coY29vbF9tYWRzX25vZGUgaW5zdGFuY2VvZiBjcmVhdGVqcy5Db250YWluZXIpO1xuXHQvL2NvbnNvbGUubG9nKGNvb2xfbWFkc19ub2RlIGluc3RhbmNlb2YgTm9kZSk7XG5cdC8vc3RhZ2UuY2FudmFzLndpZHRoID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO1xuXHQvL3N0YWdlLmNhbnZhcy5oZWlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuXG5cdHN0YWdlLmNhbnZhcy53aWR0aCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdmlld1wiKS5vZmZzZXRXaWR0aDtcblx0c3RhZ2UuY2FudmFzLmhlaWdodCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdmlld1wiKS5vZmZzZXRIZWlnaHQ7XG5cdHN0YWdlLmVuYWJsZU1vdXNlT3ZlcigxNSk7XG5cdHN0YWdlLm9uKFwibW91c2Vkb3duXCIsIGZ1bmN0aW9uKCkgeyBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKTsgfSk7XG5cblx0c3RhZ2UubW91c2VNb3ZlT3V0c2lkZSA9IHRydWU7XG5cdHN0YWdlLm9uKFwic3RhZ2Vtb3VzZW1vdmVcIiwgc3RhZ2VNb3VzZU1vdmUpO1xuXG5cdGluaXR2aWV3Q29udGFpbmVyKCk7XG5cdGluaXROb2RlcygpO1xuXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjem9vbWluXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpIHsgem9vbSgxKSB9O1xuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3pvb21vdXRcIikub25jbGljayA9IGZ1bmN0aW9uKCkgeyB6b29tKC0xKSB9O1xuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnR5VGFiXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpIHsgb3BlblRhYigncHJvcGVydHlUYWInKSB9O1xuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2ltYWdlc1RhYlwiKS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7IG9wZW5UYWIoJ2ltYWdlc1RhYicpIH07XG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZWRpdF9jYW52YXNcIikub25kcm9wID0gZnVuY3Rpb24oKSB7IGRyb3AoZXZlbnQpIH07XG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZWRpdF9jYW52YXNcIikub25kcmFnb3ZlciA9IGZ1bmN0aW9uKCkgeyBhbGxvd0Ryb3AoZXZlbnQpIH07XG5cdFxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3NhdmVcIikub25jbGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdGxvYWRlci5zYXZlKG5vZGVDb250YWluZXIudG9PYmplY3QoKSk7XG5cdH07XG5cdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uKGUpIHtcblx0ICBpZiAoZS5rZXlDb2RlID09IDgzICYmIChuYXZpZ2F0b3IucGxhdGZvcm0ubWF0Y2goXCJNYWNcIikgPyBlLm1ldGFLZXkgOiBlLmN0cmxLZXkpKSB7XG5cdCAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cdCAgICAvLyBQcm9jZXNzIGV2ZW50Li4uXG5cdCAgICAgIGxvYWRlci5zYXZlSlNPTihlZGl0b3Iubm9kZXNUb09iamVjdCgpLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2ZpbGVwYXRoXCIpLnZhbHVlKTtcblx0ICB9XG5cdH0sIGZhbHNlKTtcblxuXHRmdW5jdGlvbiBzdGFnZU1vdXNlTW92ZShldnQpIHtcblx0XHRpZiAoZHJhZ2dpbmdfZWxlbWVudCAhPT0gdW5kZWZpbmVkICYmIGRyYWdnaW5nX2VsZW1lbnQgIT09IG51bGwpIHtcblx0XHRcdHZhciBsb2NhbCA9IGRyYWdnaW5nX2VsZW1lbnQucGFyZW50Lmdsb2JhbFRvTG9jYWwoZXZ0LnN0YWdlWCAtIGRyYWdvZmZzZXQueCwgZXZ0LnN0YWdlWSAtIGRyYWdvZmZzZXQueSk7XG5cdFx0XHRkcmFnZ2luZ19lbGVtZW50LnggPSBsb2NhbC54O1xuXHRcdFx0ZHJhZ2dpbmdfZWxlbWVudC55ID0gbG9jYWwueTtcblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0cy5ub2Rlc1RvT2JqZWN0ID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBub2RlQ29udGFpbmVyLnRvT2JqZWN0KCk7XG59XG5cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyAgRURJVE9SICAvLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG5mdW5jdGlvbiBpbml0Tm9kZXMoKSB7XG5cdG5vZGVDb250YWluZXIgPSBuZXcgTm9kZUNvbnRhaW5lcigpO1xuXHRub2RlQ29udGFpbmVyLnN0YXJ0bm9kZSA9IGNvbmZpZy5zdGFydG5vZGU7XG5cdGZvciAodmFyIHA9MDsgcDxwYW5lbHMubGVuZ3RoO3ArKykge1xuXHRcdHZhciBwYW5lbCA9IG5ldyBQYW5lbChwYW5lbHNbcF0pO1xuXHRcdG5vZGVDb250YWluZXIuYWRkQ2hpbGQocGFuZWwpO1xuXHR9XG5cdG5vZGVDb250YWluZXIubWFrZUNvbm5lY3Rpb25zKCk7XG5cdHZpZXdDb250YWluZXIuYWRkQ2hpbGQobm9kZUNvbnRhaW5lcik7XG5cdGRyYXdBbGxDb25uZWN0aW9ucygpO1xufVxuXG53aW5kb3cub25yZXNpemUgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciB2aWV3ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN2aWV3XCIpO1xuICAgIHZhciBzaWRlYmFyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzaWRlYmFyXCIpO1xuXG4gICAgc3RhZ2UuY2FudmFzLndpZHRoID0gdmlldy5vZmZzZXRXaWR0aDtcbiAgICBzdGFnZS5jYW52YXMuaGVpZ2h0ID0gdmlldy5vZmZzZXRIZWlnaHQ7XG5cblx0c3RhZ2UuZ2V0Q2hpbGRCeU5hbWUoXCJkcmFnQm94XCIpLmdyYXBoaWNzLmJlZ2luRmlsbChcIiM5OTlcIikuZHJhd1JlY3QoMCwwLHN0YWdlLmNhbnZhcy53aWR0aCwgc3RhZ2UuY2FudmFzLmhlaWdodCk7XG4gICAgLy9zdGFnZS51cGRhdGUoKTtcbn07XG5cbmZ1bmN0aW9uIGNsZWFyQWxsKCkge1xuXG5cdGZ1bmN0aW9uIGNsZWFyRXZlbnRzKGRpc09iaikge1xuXHRcdGNvbnNvbGUubG9nKGRpc09iaik7XG5cdFx0ZGlzT2JqLnJlbW92ZUFsbEV2ZW50TGlzdGVuZXJzKCk7XG5cdFx0Zm9yICh2YXIgaT0wOyBpIDwgZGlzT2JqLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAoZGlzT2JqLmNoaWxkcmVuW2ldLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0Y2xlYXJFdmVudHMoZGlzT2JqLmNoaWxkcmVuW2ldKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblx0aWYgKHN0YWdlICE9PSB1bmRlZmluZWQpIGNsZWFyRXZlbnRzKHN0YWdlKTtcbn1cblxuZnVuY3Rpb24gaW5pdHZpZXdDb250YWluZXIoKSB7XG5cdHZhciBkcmFnQm94O1xuXG5cdC8vdmFyIGNvcm5lcnMgPSBuZXcgY3JlYXRlanMuU2hhcGUoKTtcblxuXHR2aWV3Q29udGFpbmVyID0gbmV3IGNyZWF0ZWpzLkNvbnRhaW5lcigpO1xuXHR2aWV3U2NhbGUgPSB6b29tU3RlcFt6b29tTnVtYmVyXTtcblx0dmlld0NvbnRhaW5lci5zY2FsZVggPSB2aWV3U2NhbGU7XG5cdHZpZXdDb250YWluZXIuc2NhbGVZID0gdmlld1NjYWxlO1xuXHR2aWV3Q29udGFpbmVyLm5hbWUgPSBcIlZpZXcgQ29udGFpbmVyXCI7XG5cblx0ZnVuY3Rpb24gZHJhZ1ZpZXcoZXZ0KSB7XG5cdFx0Ly9jb25zb2xlLmxvZyhcIkRyYWdnaW4gdmlldyEgXCIgKyBldnQudGFyZ2V0KTtcblx0XHR2aWV3Q29udGFpbmVyLnggPSBldnQuc3RhZ2VYIC0gZHJhZ29mZnNldC54O1xuXHRcdHZpZXdDb250YWluZXIueSA9IGV2dC5zdGFnZVkgLSBkcmFnb2Zmc2V0Lnk7XG5cblx0XHRjZW50ZXJWaWV3T3JpZ2luKGV2dC5zdGFnZVggLSBkcmFnb2Zmc2V0LngsIGV2dC5zdGFnZVkgLSBkcmFnb2Zmc2V0LnkpO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2VudGVyVmlld09yaWdpbih4LHkpIHtcblx0XHR2aWV3Q29udGFpbmVyLnJlZ1ggPSAoKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdmlld1wiKS5vZmZzZXRXaWR0aCAtIDI4MCkvMiAtIHZpZXdDb250YWluZXIueCkvdmlld1NjYWxlO1xuXHRcdHZpZXdDb250YWluZXIucmVnWSA9ICgoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN2aWV3XCIpLm9mZnNldEhlaWdodC8yKSAtIHZpZXdDb250YWluZXIueSkvdmlld1NjYWxlO1xuXHRcdC8vY29ybmVycy5ncmFwaGljcy5jbGVhcigpO1xuXHRcdC8vY29ybmVycy5ncmFwaGljcy5mKFwicmVkXCIpLmRjKHZpZXdDb250YWluZXIueCx2aWV3Q29udGFpbmVyLnksMTUpLmYoXCJibHVlXCIpLmRjKHZpZXdDb250YWluZXIueCt2aWV3Q29udGFpbmVyLnJlZ1gqdmlld1NjYWxlLCB2aWV3Q29udGFpbmVyLnkrdmlld0NvbnRhaW5lci5yZWdZKnZpZXdTY2FsZSwgMTUpO1xuXHRcdHZpZXdDb250YWluZXIueCA9IHggKyB2aWV3Q29udGFpbmVyLnJlZ1ggKiB2aWV3U2NhbGU7XG5cdFx0dmlld0NvbnRhaW5lci55ID0geSArIHZpZXdDb250YWluZXIucmVnWSAqIHZpZXdTY2FsZTtcblx0fVxuXG5cdGRyYWdCb3ggPSBuZXcgY3JlYXRlanMuU2hhcGUobmV3IGNyZWF0ZWpzLkdyYXBoaWNzKCkuYmVnaW5GaWxsKFwiIzk5OVwiKS5kcmF3UmVjdCgwLDAsc3RhZ2UuY2FudmFzLndpZHRoLCBzdGFnZS5jYW52YXMuaGVpZ2h0KSk7XG5cdGRyYWdCb3gub24oXCJtb3VzZWRvd25cIiwgZnVuY3Rpb24oZXZ0KSB7XG5cdFx0aWYgKGN1cnJlbnRseVNlbGVjdGVkICE9PSB1bmRlZmluZWQgJiYgY3VycmVudGx5U2VsZWN0ZWQuc2VsZWN0ZWQgIT09IHVuZGVmaW5lZCkgY3VycmVudGx5U2VsZWN0ZWQuc2VsZWN0ZWQuZ3JhcGhpY3MuY2xlYXIoKTtcblx0XHRjdXJyZW50bHlTZWxlY3RlZCA9IG5vZGVDb250YWluZXI7XG5cdFx0b3BlblRhYihcInByb3BlcnR5VGFiXCIpO1xuXHRcdC8vbm9kZUNvbnRhaW5lci5zaG93UHJvcGVydGllcygpO1xuXHRcdGRyYWdvZmZzZXQueCA9IGV2dC5zdGFnZVggLSB2aWV3Q29udGFpbmVyLnggKyB2aWV3Q29udGFpbmVyLnJlZ1gqdmlld1NjYWxlO1xuXHRcdGRyYWdvZmZzZXQueSA9IGV2dC5zdGFnZVkgLSB2aWV3Q29udGFpbmVyLnkgKyB2aWV3Q29udGFpbmVyLnJlZ1kqdmlld1NjYWxlO1xuXHR9KTtcblx0ZHJhZ0JveC5vbihcInByZXNzbW92ZVwiLCBkcmFnVmlldyk7XG5cdC8vZHJhZ0JveC5jdXJzb3IgPSBcImdyYWJcIjtcblx0ZHJhZ0JveC5uYW1lID0gXCJkcmFnQm94XCI7XG5cblx0c3RhZ2UuYWRkQ2hpbGQoZHJhZ0JveCk7XG5cdC8vc3RhZ2UuYWRkQ2hpbGQoY29ybmVycyk7XG5cdHN0YWdlLmFkZENoaWxkKHZpZXdDb250YWluZXIpO1xuXG5cdGNlbnRlclZpZXdPcmlnaW4oMCwwKTtcbn1cblxuZnVuY3Rpb24gZHJhd0FsbENvbm5lY3Rpb25zKCkge1xuXHRmb3IgKHZhciBjID0gMDsgYyA8IG5vZGVDb250YWluZXIuY2hpbGRyZW4ubGVuZ3RoOyBjKyspIHtcblx0XHRub2RlQ29udGFpbmVyLmNoaWxkcmVuW2NdLmRyYXdDb25uZWN0aW9ucygpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIG5ld1BhbmVsKHgsIHksIGltYWdlKSB7XG5cdHZhciBvYmogPSBuZXcgT2JqZWN0KCk7XG5cdG9iai5pbWFnZSA9IGltYWdlO1xuXHRvYmouZWRpdG9yID0gbmV3IE9iamVjdCgpO1xuXHRvYmouZWRpdG9yLnBvc2l0aW9uID0ge1xuXHRcdHg6IHgsXG5cdFx0eTogeVxuXHR9XG5cdG5vZGVDb250YWluZXIuYWRkQ2hpbGQobmV3IFBhbmVsKG9iaikpO1xufVxuXG5mdW5jdGlvbiBuZXdQYW5lbEVsZW1lbnQoeCwgeSwgcGFuZWwsIGltYWdlKSB7XG5cdHZhciBlbG0gPSBuZXcgT2JqZWN0KCk7XG5cdGVsbS5wb3NpdGlvbiA9IHtcblx0XHR4OiB4LyhwYW5lbC5wYW5lbGJpdG1hcC5pbWFnZS53aWR0aCpwYW5lbC5wYW5lbGJpdG1hcC5zY2FsZVgpLFxuXHRcdHk6IHkvKHBhbmVsLnBhbmVsYml0bWFwLmltYWdlLmhlaWdodCpwYW5lbC5wYW5lbGJpdG1hcC5zY2FsZVkpXG5cdH07XG5cdGNvbnNvbGUubG9nKGVsbS5wb3NpdGlvbik7XG5cdGVsbS5pbWFnZSA9IGltYWdlO1xuXHQvL2RlZmF1bHQgYWxpZ25tZW50IG9wdGlvbiEgZm9yIG5vd1xuXHRlbG0uYnViYmxlX3R5cGUgPSBcImRvd25cIjtcblx0ZWxtLnRleHQgPSBcIlwiO1xuXG5cdHZhciBwYW5lbGVsZW1lbnQgPSBuZXcgUGFuZWxFbGVtZW50KGVsbSwgcGFuZWwucGFuZWxiaXRtYXApO1xuXG5cdGlmIChwYW5lbC5lbGVtZW50cyA9PSB1bmRlZmluZWQpIHBhbmVsLmVsZW1lbnRzID0gW107XG5cdHBhbmVsLmVsZW1lbnRzLnB1c2gocGFuZWxlbGVtZW50KTtcblx0cGFuZWwuYWRkQ2hpbGQocGFuZWxlbGVtZW50KTtcblxuXHR2YXIgc29ja2V0cG9zID0ge1xuXHRcdHg6IHBhbmVsZWxlbWVudC54ICsgcGFuZWxlbGVtZW50LndpZHRoKnBhbmVsZWxlbWVudC5zY2FsZVgsXG5cdFx0eTogcGFuZWxlbGVtZW50LnkgKyBwYW5lbGVsZW1lbnQuaGVpZ2h0LzIqcGFuZWxlbGVtZW50LnNjYWxlWVxuXHR9O1xuXHR2YXIgc29jayA9IHBhbmVsLmFkZFNvY2tldChzb2NrZXRwb3MueCwgc29ja2V0cG9zLnksIHBhbmVsZWxlbWVudC5nb3RvLCBwYW5lbCwgMywgXCIjZmZmXCIpO1xuXHRzb2NrLm93bmVyID0gcGFuZWxlbGVtZW50O1xuXHRzb2NrZXRwb3MgPSBzb2NrLm93bmVyLmxvY2FsVG9Mb2NhbChzb2NrLm93bmVyLndpZHRoLCBzb2NrLm93bmVyLmhlaWdodC8yLCBzb2NrLnBhcmVudCk7XG5cdHNvY2sueCA9IHNvY2tldHBvcy54O1xuXHRzb2NrLnkgPSBzb2NrZXRwb3MueTtcbn1cblxuZnVuY3Rpb24gem9vbSh6b29tTW9kaWZpZXIpIHtcblxuXHRpZiAoem9vbU51bWJlciArIHpvb21Nb2RpZmllciA8IDAgfHwgem9vbU51bWJlciArIHpvb21Nb2RpZmllciA+PSB6b29tU3RlcC5sZW5ndGgpIHJldHVybjtcblxuXHR2YXIgem9vbXNwZWVkID0gMjAwO1xuXG5cdHpvb21OdW1iZXIgKz0gem9vbU1vZGlmaWVyO1xuXHR2aWV3U2NhbGUgPSB6b29tU3RlcFt6b29tTnVtYmVyXTtcblx0Y29uc29sZS5sb2codmlld1NjYWxlKTtcblxuXHRjcmVhdGVqcy5Ud2Vlbi5nZXQodmlld0NvbnRhaW5lciwge292ZXJyaWRlOiB0cnVlfSlcblx0XHQudG8oeyBzY2FsZVg6IHZpZXdTY2FsZSwgc2NhbGVZOiB2aWV3U2NhbGUgfSwgem9vbXNwZWVkLCBjcmVhdGVqcy5FYXNlLmN1YmljT3V0KTtcblxuXHQvKmZvciAodmFyIGMgPSAwOyBjIDwgdmlld0NvbnRhaW5lci5jaGlsZHJlbi5sZW5ndGg7IGMrKykge1xuXHRcdHZhciBwcyA9IHZpZXdDb250YWluZXIuY2hpbGRyZW5bY10uZ2V0Q2hpbGRCeU5hbWUoXCJwYW5lbFNvY2tldFwiKTtcblx0XHRjcmVhdGVqcy5Ud2Vlbi5nZXQocHMsIHtvdmVycmlkZTogdHJ1ZX0pLnRvKHtzY2FsZVg6IDEgLyB2aWV3U2NhbGUsIHNjYWxlWTogMSAvIHZpZXdTY2FsZX0sIHpvb21zcGVlZCwgY3JlYXRlanMuRWFzZS5jdWJpY091dCk7XG5cdFx0c2V0VGltZW91dChkcmF3Q29ubmVjdGlvbnModmlld0NvbnRhaW5lci5jaGlsZHJlbltjXSksIDIwMCk7XG5cdH0qL1xufVxuXG52YXIgY3VycmVudGx5U2VsZWN0ZWQ7XG52YXIgY3VycmVudFRhYiA9IFwicHJvcGVydGllc1wiO1xuXG5mdW5jdGlvbiBvcGVuVGFiKHRhYikge1xuXG5cdC8vaWYgKHRhYiA9PSBjdXJyZW50VGFiKSByZXR1cm47XG5cdGN1cnJlbnRUYWIgPSB0YWI7XG5cblx0c3dpdGNoKHRhYikge1xuXG5cdFx0Y2FzZSBcInByb3BlcnR5VGFiXCI6XG5cdFx0Y29uc29sZS5sb2coXCJjb29sXCIpO1xuXHRcdGlmIChjdXJyZW50bHlTZWxlY3RlZCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0IFx0Y3VycmVudGx5U2VsZWN0ZWQuc2hvd1Byb3BlcnRpZXMoKTtcblx0XHR9XG5cdFx0ZWxzZSBub2RlQ29udGFpbmVyLnNob3dQcm9wZXJ0aWVzKCk7XG5cdFx0YnJlYWs7XG5cblx0XHRjYXNlIFwiaW1hZ2VzVGFiXCI6XG5cdFx0ZnVuY3Rpb24gaGFuZGxlRmlsZVNlbGVjdChldnQpIHtcblx0XHQgICAgdmFyIGZpbGVzID0gZXZ0LnRhcmdldC5maWxlczsgLy8gRmlsZUxpc3Qgb2JqZWN0XG5cdFx0ICAgIGN1cnJlbnRMb2NhbEltYWdlcyA9IGZpbGVzO1xuXHRcdCAgICAvLyBmaWxlcyBpcyBhIEZpbGVMaXN0IG9mIEZpbGUgb2JqZWN0cy4gTGlzdCBzb21lIHByb3BlcnRpZXMuXG5cdFx0ICAgIGxpc3RGaWxlcyhmaWxlcyk7XG5cdFx0ICAgIC8vZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2ltYWdlbGlzdCcpLmlubmVySFRNTCA9IG91dHB1dC5qb2luKCcnKTtcbiAgXHRcdH1cbiAgXHRcdGZ1bmN0aW9uIGxpc3RGaWxlcyhmaWxlYXJyYXkpIHtcbiAgXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGY7IGYgPSBmaWxlYXJyYXlbaV07IGkrKykge1xuXHRcdCAgICBcdGlmICghZi50eXBlLm1hdGNoKCdpbWFnZS4qJykpIHtcblx0XHRcdCAgICBcdGNvbnRpbnVlO1xuXHRcdFx0ICAgIH1cblxuXHRcdFx0ICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXG5cdFx0XHQgICAgcmVhZGVyLm9ubG9hZCA9IChmdW5jdGlvbih0aGVGaWxlKSB7XG5cdFx0XHQgICAgICAgIHJldHVybiBmdW5jdGlvbihlKSB7XG5cdFx0XHQgICAgICAgICAgLy8gUmVuZGVyIHRodW1ibmFpbC5cblx0XHRcdCAgICAgICAgICAvL3ZhciBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXHRcdFx0ICAgICAgICAgIHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdJTUcnKTtcblx0XHRcdCAgICAgICAgICBpbWcuc3JjID0gZS50YXJnZXQucmVzdWx0O1xuXHRcdFx0ICAgICAgICAgIGltZy53aWR0aCA9IDEwMDtcblx0XHRcdCAgICAgICAgICBpbWcuZHJhZ2dhYmxlID0gdHJ1ZTtcblx0XHRcdCAgICAgICAgICBpbWcudGl0bGUgPSBlc2NhcGUodGhlRmlsZS5uYW1lKTtcblx0XHRcdCAgICAgICAgICBpbWcub25kcmFnc3RhcnQgPSBmdW5jdGlvbigpIHsgZHJhZyhldmVudCwgZS50YXJnZXQucmVzdWx0KSB9O1xuXG5cdFx0XHQgICAgICAgICAgLypzcGFuLmlubmVySFRNTCA9IFsnPGltZyB3aWR0aD1cIjEwMFwiIHNyYz1cIicsIGUudGFyZ2V0LnJlc3VsdCxcblx0XHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAnXCIgdGl0bGU9XCInLCBlc2NhcGUodGhlRmlsZS5uYW1lKSwgJ1wiIGRyYWdnYWJsZT1cInRydWVcIiBvbmRyYWdzdGFydD1cImRyYWcoZXZlbnQsXFwnJywgZS50YXJnZXQucmVzdWx0ICwnXFwnKVwiLz4nXS5qb2luKCcnKTsqL1xuXHRcdFx0ICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbWFnZWxpc3QnKS5pbnNlcnRCZWZvcmUoaW1nLCBudWxsKTtcblx0XHRcdCAgICAgICAgfTtcblx0XHRcdCAgICB9KShmKTtcblxuXHRcdFx0ICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGYpO1xuXHRcdCAgICB9XG4gIFx0XHR9XG5cbiAgXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNwcm9wZXJ0aWVzJykuaW5uZXJIVE1MID0gJzxpbnB1dCB0eXBlPVwiZmlsZVwiIGlkPVwiaW1hZ2VmaWxlc1wiIG5hbWU9XCJmaWxlc1tdXCIgbXVsdGlwbGUgLz48b3V0cHV0IGlkPVwiaW1hZ2VsaXN0XCI+PC9vdXRwdXQ+JztcbiAgXHRcdGlmIChjdXJyZW50TG9jYWxJbWFnZXMgIT09IHVuZGVmaW5lZCkgeyBsaXN0RmlsZXMoY3VycmVudExvY2FsSW1hZ2VzKSB9O1xuICBcdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2ltYWdlZmlsZXMnKS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBoYW5kbGVGaWxlU2VsZWN0LCBmYWxzZSk7XG4gIFx0XHQvKlxuXHRcdGxvYWRlci5sb2FkQWxsSW1hZ2VzKGZ1bmN0aW9uKG9iaikge1xuXHRcdFx0dmFyIHByb3BlcnRpZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnRpZXNcIik7XG5cdFx0XHRwcm9wZXJ0aWVzLmlubmVySFRNTCA9IFwiXCI7XG5cdFx0XHRmb3IgKGk9MDsgaTxvYmoubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0Y29uc29sZS5sb2cob2JqW2ldKTtcblx0XHRcdFx0cHJvcGVydGllcy5pbm5lckhUTUwgKz0gJzxpbWcgd2lkdGg9XCIxMDBcIiBzdHlsZT1cIm1hcmdpbi1sZWZ0OjEwcHg7XCIgc3JjPVwiJyArIG9ialtpXS5yZXBsYWNlKFwiLi4vXCIsIFwiXCIpICsgJ1wiIGRyYWdnYWJsZT1cInRydWVcIiBvbmRyYWdzdGFydD1cImRyYWcoZXZlbnQsIFxcJycgKyBvYmpbaV0ucmVwbGFjZShcIi4uL1wiLCBcIlwiKSArICdcXCcpXCIgLz4nO1xuXHRcdFx0fVxuXHRcdH0pOyovXG5cdFx0YnJlYWs7XG5cdH1cblxuXHR2YXIgdGFicyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGFic1wiKTtcblx0Zm9yICh0PTA7IHQ8dGFicy5jaGlsZHJlbi5sZW5ndGg7IHQrKykge1xuXHRcdHRhYnMuY2hpbGRyZW5bdF0uY2xhc3NOYW1lID0gKHRhYnMuY2hpbGRyZW5bdF0uaWQgPT0gY3VycmVudFRhYikgPyBcInNlbGVjdGVkXCIgOiBcIlwiO1xuXHR9XG59XG5cblxudmFyIHNpZGViYXJDbG9zZWQgPSBmYWxzZTtcblxuZnVuY3Rpb24gaGlkZVNpZGViYXIoKSB7XG5cdHZhciBtaW4gPSBcIjMwcHhcIjtcblx0dmFyIG1heCA9IFwiMjgwcHhcIjtcblx0aWYgKCBzaWRlYmFyQ2xvc2VkICkge1xuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2lkZWJhclwiKS5zdHlsZS53aWR0aCA9IG1heDtcblx0XHRzaWRlYmFyQ2xvc2VkID0gZmFsc2U7XG5cdH1cblx0ZWxzZSB7XG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzaWRlYmFyXCIpLnN0eWxlLndpZHRoID0gbWluO1xuXHRcdHNpZGViYXJDbG9zZWQgPSB0cnVlO1xuXHR9XG59XG5cbmZ1bmN0aW9uIG1vdXNlVXAoKSB7XG5cdGNvbnNvbGUubG9nKFwiTW91c2UgVXAgb24gSFRNTCBFbGVtZW50XCIpO1xuXHRkcmFnZ2luZ19lbGVtZW50ID0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBtb3VzZURvd24oZWxtKSB7XG5cdGNvbnNvbGUubG9nKFwiTW91c2UgRG93biBvbiBIVE1MIEVsZW1lbnRcIik7XG5cdGRyYWdnaW5nX2VsZW1lbnQgPSBlbG07XG59XG5cbmZ1bmN0aW9uIGFsbG93RHJvcChldikge1xuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG59XG5cbmZ1bmN0aW9uIGRyYWcoZXYsIHBhdGgpIHtcbiAgICBldi5kYXRhVHJhbnNmZXIuc2V0RGF0YShcInRleHQvcGxhaW5cIiwgcGF0aCk7XG59XG5cbmZ1bmN0aW9uIGRyb3AoZXYpIHtcbiAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmIChldi50YXJnZXQgPT0gc3RhZ2UuY2FudmFzKSB7XG4gICAgXHQvL2NvbnNvbGUubG9nKFwiRHJvcHBlZCBvbiBTVEFHRSEgQ29vbCFcIiwgZXYuY2xpZW50WCwgZXYuY2xpZW50WSk7XG4gICAgXHR2YXIgbG9jYWwgPSBub2RlQ29udGFpbmVyLmdsb2JhbFRvTG9jYWwoZXYuY2xpZW50WCwgZXYuY2xpZW50WSk7XG4gICAgXHQvL2NvbnNvbGUubG9nKGV2LmRhdGFUcmFuc2Zlci5nZXREYXRhKFwidGV4dC9wbGFpblwiKSk7XG4gICAgXHR2YXIgcG5sID0gbm9kZUNvbnRhaW5lci5nZXRPYmplY3RVbmRlclBvaW50KGxvY2FsLngsIGxvY2FsLnkpO1xuICAgIFx0aWYgKHBubCAhPT0gbnVsbCAmJiBwbmwgaW5zdGFuY2VvZiBjcmVhdGVqcy5CaXRtYXApIHBubCA9IHBubC5wYXJlbnQ7XG4gICAgXHQvL2NvbnNvbGUubG9nKHBubCk7XG4gICAgXHRpZiAocG5sIGluc3RhbmNlb2YgUGFuZWwpIHtcbiAgICBcdFx0dmFyIHBvcyA9IHBubC5nbG9iYWxUb0xvY2FsKGV2LmNsaWVudFgsIGV2LmNsaWVudFkpO1xuICAgIFx0XHRjb25zb2xlLmxvZyhwb3MpO1xuICAgIFx0XHRuZXdQYW5lbEVsZW1lbnQocG9zLngsIHBvcy55LCBwbmwsIGV2LmRhdGFUcmFuc2Zlci5nZXREYXRhKFwidGV4dC9wbGFpblwiKSk7XG4gICAgXHR9XG4gICAgXHRlbHNlIG5ld1BhbmVsKGxvY2FsLngsIGxvY2FsLnksIGV2LmRhdGFUcmFuc2Zlci5nZXREYXRhKFwidGV4dC9wbGFpblwiKSk7XG4gICAgfVxuICAgIC8vdmFyIGRhdGEgPSBldi5kYXRhVHJhbnNmZXIuZ2V0RGF0YShcInRleHRcIik7XG4gICAgLy9ldi50YXJnZXQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGF0YSkpO1xufVxuXG5cbi8qKlxuKiBcbipcbipcdEVhc2VsanMgY2xhc3MgZGVmaW5pdGlvbnNcbipcbipcbioqL1xuXG4oZnVuY3Rpb24oKSB7XG5cblx0Ly8gLS0tLS0tLS0tLS0tIC8vXG5cdC8vICBOT0RFIGNsYXNzICAvL1xuXHQvLyAtLS0tLS0tLS0tLS0gLy9cblxuXHQvL3ZhciBlZGl0b3IgPSByZXF1aXJlKCcuL2VkaXRvci5qcycpO1xuXG5cdGZ1bmN0aW9uIE5vZGUoKSB7XG5cdFx0dGhpcy5Db250YWluZXJfY29uc3RydWN0b3IoKTtcblx0XHR0aGlzLnNvY2tldHMgPSBbXTtcblx0fVxuXHRjcmVhdGVqcy5leHRlbmQoTm9kZSwgY3JlYXRlanMuQ29udGFpbmVyKTtcblxuXHROb2RlLnByb3RvdHlwZS5oYW5kbGVNb3VzZURvd24gPSBmdW5jdGlvbihldnQpIHtcblx0XHRkcmFnb2Zmc2V0ID0ge1xuXHRcdFx0eDogZXZ0LnN0YWdlWC92aWV3U2NhbGUgLSBldnQudGFyZ2V0LnBhcmVudC54LFxuXHRcdFx0eTogZXZ0LnN0YWdlWS92aWV3U2NhbGUgLSBldnQudGFyZ2V0LnBhcmVudC55XG5cdFx0fTtcblxuXHRcdC8vZXZ0LnRhcmdldC5kcmFnb2Zmc2V0LnkgPSBldnQuc3RhZ2VZL3ZpZXdTY2FsZSAtIGV2dC50YXJnZXQucGFyZW50Lnk7XG5cdFx0aWYgKGN1cnJlbnRseVNlbGVjdGVkICE9PSB1bmRlZmluZWQgJiYgY3VycmVudGx5U2VsZWN0ZWQuc2VsZWN0ZWQgIT09IHVuZGVmaW5lZCkgY3VycmVudGx5U2VsZWN0ZWQuc2VsZWN0ZWQuZ3JhcGhpY3MuY2xlYXIoKTtcblx0XHRjdXJyZW50bHlTZWxlY3RlZCA9IGV2dC50YXJnZXQucGFyZW50O1xuXHRcdG9wZW5UYWIoXCJwcm9wZXJ0eVRhYlwiKTtcblx0fTtcblxuXHROb2RlLnByb3RvdHlwZS5oYW5kbGVNb3VzZU1vdmUgPSBmdW5jdGlvbihldnQpIHtcblx0XHQvL2NvbnNvbGUubG9nKGV2dC50YXJnZXQpO1xuXHRcdGV2dC50YXJnZXQucGFyZW50LnggPSBldnQuc3RhZ2VYL3ZpZXdTY2FsZSAtIGRyYWdvZmZzZXQueDtcblx0XHRldnQudGFyZ2V0LnBhcmVudC55ID0gZXZ0LnN0YWdlWS92aWV3U2NhbGUgLSBkcmFnb2Zmc2V0Lnk7XG5cblx0XHRldnQudGFyZ2V0LnBhcmVudC54ID0gTWF0aC5yb3VuZChldnQudGFyZ2V0LnBhcmVudC54KjAuMSkqMTA7XG5cdFx0ZXZ0LnRhcmdldC5wYXJlbnQueSA9IE1hdGgucm91bmQoZXZ0LnRhcmdldC5wYXJlbnQueSowLjEpKjEwO1xuXG5cdFx0Ly9jb25zb2xlLmxvZyhldnQudGFyZ2V0LnBhcmVudCk7XG5cdFx0Ly9kcmF3Q29ubmVjdGlvbnMoZXZ0LnRhcmdldC5wYXJlbnQpO1xuXHRcdGRyYXdBbGxDb25uZWN0aW9ucygpO1xuXHR9O1xuXG5cdE5vZGUucHJvdG90eXBlLmRyYXdDb25uZWN0aW9ucyA9IGZ1bmN0aW9uKCkge1xuXHRcdGZvciAocz0wOyBzIDwgdGhpcy5zb2NrZXRzLmxlbmd0aDsgcysrKSB7XG5cdFx0XHR2YXIgc29ja2V0ID0gdGhpcy5zb2NrZXRzW3NdO1xuXHRcdFx0c29ja2V0LmxpbmUuZ3JhcGhpY3MuY2xlYXIoKTtcblx0XHRcdGlmIChzb2NrZXQub3duZXIgaW5zdGFuY2VvZiBQYW5lbEVsZW1lbnQpIHtcblx0XHRcdFx0dmFyIHNvY2tldHBvcyA9IHNvY2tldC5vd25lci5sb2NhbFRvTG9jYWwoc29ja2V0Lm93bmVyLndpZHRoLCBzb2NrZXQub3duZXIuaGVpZ2h0LzIsIHNvY2tldC5wYXJlbnQpO1xuXHRcdFx0XHRzb2NrZXQueCA9IHNvY2tldHBvcy54O1xuXHRcdFx0XHRzb2NrZXQueSA9IHNvY2tldHBvcy55O1xuXHRcdFx0fVxuXHRcdFx0aWYgKHNvY2tldC5vd25lci5nb3RvICE9PSB1bmRlZmluZWQgJiYgdGhpcy5wYXJlbnQuY29udGFpbnMoc29ja2V0Lm93bmVyLmdvdG8pKSB7XG5cdFx0XHRcdHZhciBnb3RvID0gc29ja2V0Lm93bmVyLmdvdG87XG5cdFx0XHRcdHZhciBsb2NhbCA9IHRoaXMucGFyZW50LmxvY2FsVG9Mb2NhbChnb3RvLngsIGdvdG8ueStnb3RvLmhlaWdodC8yLCBzb2NrZXQpO1xuXHRcdFx0XHRcblx0XHRcdFx0aWYgKHNvY2tldC5vd25lciBpbnN0YW5jZW9mIFBhbmVsRWxlbWVudCkgc29ja2V0LmxpbmUuZ3JhcGhpY3Mucyhzb2NrZXQuY29sb3IpLnNzKHNvY2tldC5zdHJva2V3aWR0aCkuc2QoWzEwLDVdKS5tdCgwK3NvY2tldC5yYWRpdXMsIDApLmx0KGxvY2FsLngsIGxvY2FsLnkgKTtcblx0XHRcdFx0ZWxzZSBzb2NrZXQubGluZS5ncmFwaGljcy5zKHNvY2tldC5jb2xvcikuc3Moc29ja2V0LnN0cm9rZXdpZHRoKS5tdCgwK3NvY2tldC5yYWRpdXMsIDApLmx0KGxvY2FsLngsIGxvY2FsLnkgKTtcblx0XHRcdFx0c29ja2V0LmFscGhhID0gMTtcblx0XHRcdH1cblx0XHRcdGVsc2Ugc29ja2V0LmFscGhhID0gMC41O1xuXHRcdH1cblx0fTtcblxuXHROb2RlLnByb3RvdHlwZS5kcmFnTGluZSA9IGZ1bmN0aW9uKGV2dCkge1xuXHRcdHZhciBzb2NrID0gZXZ0LnRhcmdldC5wYXJlbnQ7XG5cdFx0dmFyIGxpbmUgPSBzb2NrLmxpbmU7XG5cdFx0bGluZS5ncmFwaGljcy5jbGVhcigpO1xuXHRcdHZhciBsb2NhbCA9IGxpbmUuZ2xvYmFsVG9Mb2NhbChldnQuc3RhZ2VYLCBldnQuc3RhZ2VZKTtcblx0XHRsaW5lLmdyYXBoaWNzLnMoc29jay5jb2xvcikuc3Moc29jay5zdHJva2V3aWR0aCkubXQoMCtjb25fciwgMCkubHQobG9jYWwueCxsb2NhbC55KTtcblx0fTtcblxuXHROb2RlLnByb3RvdHlwZS5yZWxlYXNlTGluZSA9IGZ1bmN0aW9uKGV2dCkge1xuXHRcdGV2dC50YXJnZXQucGFyZW50LmdvdG8gPSB1bmRlZmluZWQ7XG5cdFx0ZXZ0LnRhcmdldC5wYXJlbnQub3duZXIuZ290byA9IHVuZGVmaW5lZDtcblx0XHRldnQudGFyZ2V0LnBhcmVudC5saW5lLmdyYXBoaWNzLmNsZWFyKCk7XG5cdFx0dmFyIHRhcmcgPSBzdGFnZS5nZXRPYmplY3RVbmRlclBvaW50KGV2dC5zdGFnZVgsIGV2dC5zdGFnZVkpO1xuXHRcdGlmICh0YXJnLnBhcmVudCBpbnN0YW5jZW9mIE5vZGUpIHtcblx0XHRcdGV2dC50YXJnZXQucGFyZW50LmdvdG8gPSB0YXJnLnBhcmVudDtcblx0XHRcdGV2dC50YXJnZXQucGFyZW50Lm93bmVyLmdvdG8gPSB0YXJnLnBhcmVudDtcblx0XHR9XG5cdFx0ZXZ0LnRhcmdldC5wYXJlbnQucGFyZW50LmRyYXdDb25uZWN0aW9ucygpO1xuXHR9O1xuXG5cdE5vZGUucHJvdG90eXBlLmFkZFNvY2tldCA9IGZ1bmN0aW9uKHgsIHksIGdvdG8sIGFkZFRvLCByYWRpdXMsIGNvbG9yKSB7XG5cdFx0dmFyIHNvY2tldCA9IG5ldyBjcmVhdGVqcy5Db250YWluZXIoKTtcblx0XHRzb2NrZXQuc2hhcGUgPSBuZXcgY3JlYXRlanMuU2hhcGUoKTtcblx0XHRzb2NrZXQubGluZSA9IG5ldyBjcmVhdGVqcy5TaGFwZSgpO1xuXHRcdHNvY2tldC5yYWRpdXMgPSByYWRpdXM7XG5cblx0XHRzb2NrZXQueCA9IHg7XG5cdFx0c29ja2V0LnkgPSB5O1xuXG5cdFx0aWYgKGNvbG9yICE9PSB1bmRlZmluZWQpIHNvY2tldC5jb2xvciA9IGNvbG9yO1xuXHRcdGVsc2Ugc29ja2V0LmNvbG9yID0gXCIjMDAwXCI7XG5cblx0XHRpZiAoY29sb3IgPT0gXCIjZmZmXCIpIHRoaXMuYmdfY29sb3IgPSBcIiMwMDBcIjtcblx0XHRlbHNlIHRoaXMuYmdfY29sb3IgPSBcIiNmZmZcIjtcblxuXHRcdHZhciByID0gc29ja2V0LnJhZGl1cztcblx0XHRzb2NrZXQuc2hhcGUucmVnWSA9IHI7XG5cdFx0c29ja2V0LnNoYXBlLnJlZ1ggPSAwO1xuXG5cdFx0c29ja2V0LnNoYXBlLmdyYXBoaWNzLmYodGhpcy5iZ19jb2xvcikuZGMocixyLHIpLmYoc29ja2V0LmNvbG9yKS5kYyhyLHIsci1yLzMpO1xuXHRcdC8vc29ja2V0LnNoYXBlLnNjYWxlWCA9IDE7XG5cdFx0Ly9zb2NrZXQuc2hhcGUuc2NhbGVZID0gMTtcblxuXHRcdHNvY2tldC5zdHJva2V3aWR0aCA9IHNvY2tldC5yYWRpdXMvMjtcblx0XHRzb2NrZXQuY3Vyc29yID0gXCJwb2ludGVyXCI7XG5cblx0XHRzb2NrZXQuZ290byA9IGdvdG87XG5cblx0XHRzb2NrZXQuYWRkQ2hpbGQoc29ja2V0LnNoYXBlLCBzb2NrZXQubGluZSk7XG5cblx0XHRzb2NrZXQub24oXCJwcmVzc21vdmVcIiwgdGhpcy5kcmFnTGluZSk7XG5cdFx0c29ja2V0Lm9uKFwicHJlc3N1cFwiLCB0aGlzLnJlbGVhc2VMaW5lKTtcblxuXHRcdHRoaXMuc29ja2V0cy5wdXNoKHNvY2tldCk7XG5cdFx0aWYgKGFkZFRvID09PSB1bmRlZmluZWQpIHRoaXMuYWRkQ2hpbGQoc29ja2V0KTtcblx0XHRlbHNlIGFkZFRvLmFkZENoaWxkKHNvY2tldCk7XG5cblx0XHRyZXR1cm4gc29ja2V0O1xuXHR9O1xuXG5cdHdpbmRvdy5Ob2RlID0gY3JlYXRlanMucHJvbW90ZShOb2RlLCBcIkNvbnRhaW5lclwiKTtcblxuXHQvL1xuXHQvLyBQQU5FTCBjbGFzc1xuXHQvL1xuXG5cdGZ1bmN0aW9uIFBhbmVsKG9iaikge1xuXHRcdHRoaXMuTm9kZV9jb25zdHJ1Y3RvcigpO1xuXHRcdC8vdGhpcy5zb2NrZXRzID0gW107XG5cdFx0dGhpcy5zZXR1cChvYmopO1xuXHR9XG5cdGNyZWF0ZWpzLmV4dGVuZChQYW5lbCwgTm9kZSk7XG5cblx0UGFuZWwucHJvdG90eXBlLnNldHVwID0gZnVuY3Rpb24ob2JqKSB7XG5cdFx0dGhpcy5uYW1lID0gb2JqLm5hbWU7XG5cdFx0aWYgKG9iai5lZGl0b3IgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0dGhpcy54ID0gb2JqLmVkaXRvci5wb3NpdGlvbi54O1xuXHRcdFx0dGhpcy55ID0gb2JqLmVkaXRvci5wb3NpdGlvbi55O1xuXHRcdH1cblx0XHR0aGlzLnNlbGVjdGVkID0gbmV3IGNyZWF0ZWpzLlNoYXBlKCk7XG5cdFx0dGhpcy5hZGRDaGlsZCh0aGlzLnNlbGVjdGVkKTtcblxuXHRcdGlmIChvYmouaW1hZ2UgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0dGhpcy5wYW5lbGJpdG1hcCA9IG5ldyBjcmVhdGVqcy5CaXRtYXAob2JqLmltYWdlKTtcbiAgICAgICAgICAgIHRoaXMuaW1hZ2UgPSBvYmouaW1hZ2U7XG5cdFx0XHR2YXIgc2NhbGUgPSAwLjI1O1xuXHRcdFx0Ly9pZiAocGFuZWxzW2ldLnNpemUgPT0gNCkgc2NhbGUgPSAwLjM1O1xuICAgICAgICAgICAgaWYgKG9iai5zaXplID09PSB1bmRlZmluZWQpIHRoaXMuc2l6ZSA9IDE7XG4gICAgICAgICAgICBlbHNlIHRoaXMuc2l6ZSA9IG9iai5zaXplO1xuXHRcdFx0c2NhbGUgPSB0aGlzLnNpemUqNDAwKnNjYWxlIC8gdGhpcy5wYW5lbGJpdG1hcC5pbWFnZS53aWR0aDtcblx0XHRcdHRoaXMucGFuZWxiaXRtYXAuc2NhbGVYID0gc2NhbGU7XG5cdFx0XHR0aGlzLnBhbmVsYml0bWFwLnNjYWxlWSA9IHNjYWxlO1xuXHRcdFx0dGhpcy53aWR0aCA9IHRoaXMucGFuZWxiaXRtYXAuaW1hZ2Uud2lkdGgqdGhpcy5wYW5lbGJpdG1hcC5zY2FsZVg7XG5cdFx0XHR0aGlzLmhlaWdodCA9IHRoaXMucGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0KnRoaXMucGFuZWxiaXRtYXAuc2NhbGVZO1xuXHRcdFx0Ly90aGlzLnBhbmVsYml0bWFwLm9uKFwibW91c2Vkb3duXCIsIGhhbmRsZU1vdXNlRG93bik7XG5cdFx0XHQvL3RoaXMucGFuZWxiaXRtYXAub24oXCJwcmVzc21vdmVcIiwgaGFuZGxlTW91c2VNb3ZlKTtcblx0XHRcdC8vdGhpcy5wYW5lbGJpdG1hcC5vbihcInByZXNzdXBcIiwgaGFuZGxlTW91c2VVcCk7XG5cdFx0XHR0aGlzLnBhbmVsYml0bWFwLmN1cnNvciA9IFwibW92ZVwiO1xuXHRcdFx0dGhpcy5hZGRDaGlsZCh0aGlzLnBhbmVsYml0bWFwKTtcblx0XHRcdHRoaXMucGFuZWxiaXRtYXAub24oXCJtb3VzZWRvd25cIiwgdGhpcy5oYW5kbGVNb3VzZURvd24pO1xuXHRcdFx0dGhpcy5wYW5lbGJpdG1hcC5vbihcInByZXNzbW92ZVwiLCB0aGlzLmhhbmRsZU1vdXNlTW92ZSk7XG5cdFx0XHR0aGlzLnBhbmVsYml0bWFwLnNoYWRvdyA9IG5ldyBjcmVhdGVqcy5TaGFkb3coXCJyZ2JhKDAsMCwwLDAuMilcIiwgMywgMywgNCk7XG5cdFx0XHQvL3RoaXMucGFuZWxiaXRtYXAub24oXCJjbGlja1wiLCB0aGlzLnNob3dQcm9wZXJ0aWVzKTtcblx0XHR9XG4gICAgICAgIFxuXHRcdHZhciBzb2NrZXRwb3MgPSB7XG5cdFx0XHR4OiB0aGlzLnBhbmVsYml0bWFwLnNjYWxlWCp0aGlzLnBhbmVsYml0bWFwLmltYWdlLndpZHRoLFxuXHRcdFx0eTogdGhpcy5wYW5lbGJpdG1hcC5zY2FsZVkqdGhpcy5wYW5lbGJpdG1hcC5pbWFnZS5oZWlnaHQvMlxuXHRcdH07XG5cblx0XHR2YXIgc29jayA9IHRoaXMuYWRkU29ja2V0KHNvY2tldHBvcy54LHNvY2tldHBvcy55LG9iai5nb3RvLCB0aGlzLCA2KTtcblx0XHRzb2NrLm93bmVyID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIGlmIChvYmouZ290byAhPSAtMSkgdGhpcy5nb3RvID0gb2JqLmdvdG87XG5cblx0XHQvL3RoaXMuZWxlbWVudHMgPSBbXTtcblxuXHRcdGlmIChvYmouZWxlbWVudHMgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Zm9yIChlPTA7IGUgPCBvYmouZWxlbWVudHMubGVuZ3RoOyBlKyspIHtcblx0XHRcdFx0dmFyIGVsZW1lbnQgPSBuZXcgUGFuZWxFbGVtZW50KG9iai5lbGVtZW50c1tlXSwgdGhpcy5wYW5lbGJpdG1hcCk7XG5cblx0XHRcdFx0Ly90aGlzLmVsZW1lbnRzLnB1c2goZWxlbWVudCk7XG5cdFx0XHRcdHRoaXMuYWRkQ2hpbGQoZWxlbWVudCk7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coZWxlbWVudC5jaGlsZHJlbi5sZW5ndGgpO1xuXHRcdFx0XHRzb2NrZXRwb3MgPSB7XG5cdFx0XHRcdFx0eDogZWxlbWVudC54ICsgZWxlbWVudC53aWR0aCplbGVtZW50LnNjYWxlWCxcblx0XHRcdFx0XHR5OiBlbGVtZW50LnkgKyBlbGVtZW50LmhlaWdodC8yKmVsZW1lbnQuc2NhbGVZXG5cdFx0XHRcdH07XG5cdFx0XHRcdHNvY2sgPSB0aGlzLmFkZFNvY2tldChzb2NrZXRwb3MueCwgc29ja2V0cG9zLnksIGVsZW1lbnQuZ290bywgdGhpcywgMywgXCIjZmZmXCIpO1xuXHRcdFx0XHRzb2NrLm93bmVyID0gZWxlbWVudDtcblx0XHRcdFx0c29jay5kYXNoZXMgPSBbMTAsNV07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0XG5cdH07XG5cblx0UGFuZWwucHJvdG90eXBlLnNob3dQcm9wZXJ0aWVzID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG5vZGUgPSB0aGlzO1xuXHRcdC8vaWYgKGN1cnJlbnRseVNlbGVjdGVkID09IHRoaXMpIHJldHVybjtcblx0XHQvL2N1cnJlbnRseVNlbGVjdGVkID0gdGhpcztcblxuXHRcdC8vY29uc29sZS5sb2coXCJTaG93aW5nIHByb3BlcnRpZXMgZm9yIG5vZGUgXCIgKyBub2RlLm5hbWUgKTtcblx0XHR2YXIgdGhpY2tuZXNzID0gMztcblx0XHR0aGlzLnNlbGVjdGVkLmdyYXBoaWNzLmYoXCIjMDA5OWVlXCIpLmRyKC10aGlja25lc3MsLXRoaWNrbmVzcyx0aGlzLnBhbmVsYml0bWFwLmltYWdlLndpZHRoKnRoaXMucGFuZWxiaXRtYXAuc2NhbGVYK3RoaWNrbmVzcyoyLCB0aGlzLnBhbmVsYml0bWFwLmltYWdlLmhlaWdodCp0aGlzLnBhbmVsYml0bWFwLnNjYWxlWSt0aGlja25lc3MqMik7XG5cdFx0dmFyIHByb3BlcnR5X3BhbmVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNwcm9wZXJ0aWVzXCIpO1xuXG5cdFx0dmFyIHByb3BlcnR5X2hlYWRlciA9IFx0JzxkaXYgaWQ9XCJvYmplY3QtbmFtZVwiPicgK1xuXHRcdFx0XHRcdFx0XHRcdFx0JzxwPicgKyBub2RlLm5hbWUgKyAnPHNwYW4gY2xhc3M9XCJlbGVtZW50LWlkXCI+IycgKyBub2RlQ29udGFpbmVyLmdldENoaWxkSW5kZXgobm9kZSkgKyAnPC9zcGFuPjwvcD4nICtcblx0XHRcdFx0XHRcdFx0XHQnPC9kaXY+Jztcblx0XHRwcm9wZXJ0eV9wYW5lbC5pbm5lckhUTUwgPSBwcm9wZXJ0eV9oZWFkZXI7XG5cblx0XHR2YXIgbm9kZV9uYW1lID0gJzxkaXYgY2xhc3M9XCJmaWVsZCBsYWJlbHNpZGVcIj48cD5OYW1lOjwvcD48aW5wdXQgdHlwZT1cInRleHRcIiB2YWx1ZT1cIicgKyBub2RlLm5hbWUgKyAnXCIgaWQ9XCJwcm9wZXJ0eS1uYW1lXCI+PC9kaXY+Jztcblx0XHRwcm9wZXJ0eV9wYW5lbC5pbm5lckhUTUwgKz0gbm9kZV9uYW1lO1xuXG5cdFx0aWYgKG5vZGUgaW5zdGFuY2VvZiBQYW5lbCkge1xuXG5cdFx0XHR2YXIgcGFuZWxfaW1hZ2UgPSAnPGRpdiBjbGFzcz1cImZpZWxkIGxhYmVsdG9wXCI+PHA+SW1hZ2UgVVJMOjwvcD48aW5wdXQgdHlwZT1cInRleHRcIiB2YWx1ZT1cIicgKyBub2RlLmltYWdlICsgJ1wiIGlkPVwicHJvcGVydHktaW1hZ2VwYXRoXCI+PC9kaXY+Jztcblx0XHRcdHByb3BlcnR5X3BhbmVsLmlubmVySFRNTCArPSBwYW5lbF9pbWFnZTtcblxuXHRcdFx0dmFyIHBhbmVsX3NpemUgPSAnPGRpdiBjbGFzcz1cImZpZWxkIGxhYmVsc2lkZVwiPjxwPlNpemU6PC9wPjx1bCBpZD1cInByb3BlcnR5LXNpemVcIiBjbGFzcz1cImJ1dHRvbnMgbm9zZWxlY3RcIj4nO1xuXHRcdFx0XG5cdFx0XHQvL3BhbmVsX3NpemUgKz0gJzwvdWw+PC9kaXY+Jztcblx0XHRcdFxuXG5cdFx0XHQvL3ZhciBwcm9wc2l6ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcHJvcGVydHktc2l6ZVwiKTtcblx0XHRcdGZvciAocz0xOyBzIDw9IDQ7IHMrKykge1xuXHRcdFx0XHQvL3ZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcblx0XHRcdFx0Ly9pZiAobm9kZS5zaXplID09IHMpIGxpLmNsYXNzTmFtZSA9IFwic2VsZWN0ZWRcIjtcblx0XHRcdFx0Ly9saS5pbm5lckhUTUwgPSBzLnRvU3RyaW5nKCk7XG5cdFx0XHRcdC8qbGkub25jbGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwic2V0IHRvIHNpemUgXCIgKyBzKTtcblx0XHRcdFx0XHRub2RlLnNpemUgPSBzO1xuXHRcdFx0XHRcdHRoaXMuY2xhc3NOYW1lID0gXCJzZWxlY3RlZFwiO1xuXHRcdFx0XHR9OyovXG5cdFx0XHRcdC8vcHJvcHNpemUuYXBwZW5kQ2hpbGQobGkpO1xuXHRcdFx0XHR2YXIgc2VsZWN0ZWQgPSAocyA9PSBub2RlLnNpemUpID8gJ2NsYXNzPVwic2VsZWN0ZWRcIicgOiAnJztcblx0XHRcdFx0cGFuZWxfc2l6ZSArPSAnPGxpICcgKyBzZWxlY3RlZCArICcgb25jbGljaz1cImN1cnJlbnRseVNlbGVjdGVkLmNoYW5nZVNpemUoJyArIHMudG9TdHJpbmcoKSArICcpXCI+JyArIHMudG9TdHJpbmcoKSArICc8L2xpPic7XG5cdFx0XHR9XG5cdFx0XHRwYW5lbF9zaXplICs9ICc8L3VsPjwvZGl2Pic7XG5cdFx0XHRwcm9wZXJ0eV9wYW5lbC5pbm5lckhUTUwgKz0gcGFuZWxfc2l6ZTtcblxuXHRcdFx0dmFyIGRlbGV0ZV9idXR0b24gPSAnPGRpdiBjbGFzcz1cImZpZWxkXCI+PGlucHV0IGlkPVwiZGVsZXRlXCIgY2xhc3M9XCJidXR0b24gZGVsZXRlLWJ1dHRvblwiIHR5cGU9XCJzdWJtaXRcIiB2YWx1ZT1cIkRlbGV0ZSBQYW5lbFwiPjwvZGl2Pic7XG5cdFx0XHRwcm9wZXJ0eV9wYW5lbC5pbm5lckhUTUwgKz0gZGVsZXRlX2J1dHRvbjtcblx0XHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZGVsZXRlXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJsb2xcIik7XG5cdFx0XHRcdG5vZGVDb250YWluZXIucmVtb3ZlQ2hpbGQoY3VycmVudGx5U2VsZWN0ZWQpO1xuXHRcdFx0fTtcblxuXHRcdFx0dmFyIHByb3BuYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNwcm9wZXJ0eS1uYW1lXCIpO1xuXHRcdFx0cHJvcG5hbWUub25jaGFuZ2UgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0bm9kZS5uYW1lID0gcHJvcG5hbWUudmFsdWU7XG5cdFx0XHRcdHZhciBwcm9waGVhZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjb2JqZWN0LW5hbWVcIik7XG5cdFx0XHRcdHByb3BoZWFkLmlubmVySFRNTCA9ICc8ZGl2IGlkPVwib2JqZWN0LW5hbWVcIj4nICtcblx0XHRcdFx0XHRcdFx0XHRcdCc8cD4nICsgbm9kZS5uYW1lICsgJzxzcGFuIGNsYXNzPVwiZWxlbWVudC1pZFwiPiMnICsgbm9kZUNvbnRhaW5lci5nZXRDaGlsZEluZGV4KG5vZGUpICsgJzwvc3Bhbj48L3A+JyArXG5cdFx0XHRcdFx0XHRcdFx0JzwvZGl2Pic7XG5cdFx0XHR9XG5cblx0XHRcdHByb3BuYW1lLm9ua2V5dXAgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhwcm9wdGV4dC52YWx1ZSk7XG5cdFx0XHRcdG5vZGUubmFtZSA9IHByb3BuYW1lLnZhbHVlO1xuXHRcdFx0XHR2YXIgcHJvcGhlYWQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI29iamVjdC1uYW1lXCIpO1xuXHRcdFx0XHRwcm9waGVhZC5pbm5lckhUTUwgPSAnPGRpdiBpZD1cIm9iamVjdC1uYW1lXCI+JyArXG5cdFx0XHRcdFx0XHRcdFx0XHQnPHA+JyArIG5vZGUubmFtZSArICc8c3BhbiBjbGFzcz1cImVsZW1lbnQtaWRcIj4jJyArIG5vZGVDb250YWluZXIuZ2V0Q2hpbGRJbmRleChub2RlKSArICc8L3NwYW4+PC9wPicgK1xuXHRcdFx0XHRcdFx0XHRcdCc8L2Rpdj4nO1xuXHRcdFx0fTtcblxuXHRcdFx0dmFyIHByb3BpbWFnZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcHJvcGVydHktaW1hZ2VwYXRoXCIpO1xuXHRcdFx0cHJvcGltYWdlLm9uY2hhbmdlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vbm9kZS5pbWFnZSA9IHByb3BpbWFnZS52YWx1ZTtcblx0XHRcdFx0dmFyIGltZyA9IG5ldyBJbWFnZSgpO1xuXHRcdFx0XHRpbWcuc3JjID0gcHJvcGltYWdlLnZhbHVlO1xuXHRcdFx0XHRpbWcub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0bm9kZS5pbWFnZSA9IHByb3BpbWFnZS52YWx1ZTtcblx0XHRcdFx0XHRub2RlLnBhbmVsYml0bWFwLmltYWdlID0gaW1nO1xuXHRcdFx0XHRcdG5vZGUuc2VsZWN0ZWQuZ3JhcGhpY3MuY2xlYXIoKTtcblx0XHRcdFx0XHR2YXIgdGhpY2tuZXNzID0gMztcblx0XHRcdFx0XHRub2RlLnNlbGVjdGVkLmdyYXBoaWNzLmYoXCIjMDA5OWVlXCIpLmRyKC10aGlja25lc3MsLXRoaWNrbmVzcyxub2RlLnBhbmVsYml0bWFwLmltYWdlLndpZHRoKm5vZGUucGFuZWxiaXRtYXAuc2NhbGVYK3RoaWNrbmVzcyoyLCBub2RlLnBhbmVsYml0bWFwLmltYWdlLmhlaWdodCpub2RlLnBhbmVsYml0bWFwLnNjYWxlWSt0aGlja25lc3MqMik7XG5cdFx0XHRcdH1cblx0XHRcdFx0aW1nLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR2YXIgZGlhbG9nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNkaWFsb2dcIik7XG5cdFx0XHRcdFx0ZGlhbG9nLmlubmVySFRNTCA9IFwiPHA+J1wiICsgcHJvcGltYWdlLnZhbHVlICsgXCInIGNvdWxkIG5vdCBiZSBsb2FkZWQ8cD5cIjtcblx0XHRcdFx0XHQvL2RpYWxvZy5zdHlsZS50b3AgPSBcIjUwJVwiO1xuXHRcdFx0XHRcdC8vZGlhbG9nLnN0eWxlLmxlZnQgPSBcIjUwJVwiO1xuXHRcdFx0XHRcdGRpYWxvZy5zdHlsZS5vcGFjaXR5ID0gXCIwLjhcIjtcblx0XHRcdFx0XHRkaWFsb2cuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCIjNTIyXCI7XG5cdFx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdGRpYWxvZy5zdHlsZS5vcGFjaXR5ID0gXCIwXCI7XG5cdFx0XHRcdFx0fSwgMjAwMCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXHRcdFxuXHR9O1xuXG5cdFBhbmVsLnByb3RvdHlwZS5yZW1vdmVDaGlsZCA9IGZ1bmN0aW9uKGNoaWxkKSB7XG5cdFx0dmFyIHZpZXcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpZXdcIik7XG5cdFx0dmFyIGVsbSA9IGNoaWxkLmNoaWxkcmVuWzFdLmh0bWxFbGVtZW50O1xuXHRcdGNvbnNvbGUubG9nKGVsbSk7XG5cdFx0dmlldy5yZW1vdmVDaGlsZChlbG0pO1xuXHRcdHRoaXMuTm9kZV9yZW1vdmVDaGlsZChjaGlsZCk7XG5cdFx0ZHJhd0FsbENvbm5lY3Rpb25zKCk7XG5cdH1cblxuXHRQYW5lbC5wcm90b3R5cGUuY2hhbmdlU2l6ZSA9IGZ1bmN0aW9uKHNpemUpIHtcblx0XHR0aGlzLnNpemUgPSBzaXplO1xuXHRcdHZhciBzY2FsZSA9IDAuMjU7XG5cdFx0c2NhbGUgPSB0aGlzLnNpemUqNDAwKnNjYWxlIC8gdGhpcy5wYW5lbGJpdG1hcC5pbWFnZS53aWR0aDtcblx0XHR0aGlzLnBhbmVsYml0bWFwLnNjYWxlWCA9IHNjYWxlO1xuXHRcdHRoaXMucGFuZWxiaXRtYXAuc2NhbGVZID0gc2NhbGU7XG5cdFx0dmFyIHBzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNwcm9wZXJ0eS1zaXplXCIpO1xuXHRcdGZvciAocz0wOyBzIDwgcHMuY2hpbGRyZW4ubGVuZ3RoOyBzKyspIHtcblx0XHRcdHBzLmNoaWxkcmVuW3NdLmNsYXNzTmFtZSA9IChzKzEgPT0gdGhpcy5zaXplKSA/IFwic2VsZWN0ZWRcIiA6IFwiXCI7XG5cdFx0fVxuXHRcdHRoaXMuc2VsZWN0ZWQuZ3JhcGhpY3MuY2xlYXIoKTtcblx0XHR2YXIgdGhpY2tuZXNzID0gMztcblx0XHR0aGlzLnNlbGVjdGVkLmdyYXBoaWNzLmYoXCIjMDA5OWVlXCIpLmRyKC10aGlja25lc3MsLXRoaWNrbmVzcyx0aGlzLnBhbmVsYml0bWFwLmltYWdlLndpZHRoKnRoaXMucGFuZWxiaXRtYXAuc2NhbGVYK3RoaWNrbmVzcyoyLCB0aGlzLnBhbmVsYml0bWFwLmltYWdlLmhlaWdodCp0aGlzLnBhbmVsYml0bWFwLnNjYWxlWSt0aGlja25lc3MqMik7XG5cdH07XG5cblx0d2luZG93LlBhbmVsID0gY3JlYXRlanMucHJvbW90ZShQYW5lbCwgXCJOb2RlXCIpO1xuXG5cdC8vIC0tLS0tLS0tLS0tLSAvL1xuXHQvLyBQYW5lbEVsZW1lbnQgLy9cblx0Ly8gLS0tLS0tLS0tLS0tIC8vXG5cblx0ZnVuY3Rpb24gUGFuZWxFbGVtZW50KG9iaiwgYml0bWFwKSB7XG5cdFx0dGhpcy5Db250YWluZXJfY29uc3RydWN0b3IoKTtcblx0XHR0aGlzLnBhbmVsYml0bWFwID0gYml0bWFwO1xuXHRcdHRoaXMuc2V0dXAob2JqKTtcblx0fSBjcmVhdGVqcy5leHRlbmQoUGFuZWxFbGVtZW50LCBjcmVhdGVqcy5Db250YWluZXIpO1xuXG5cdFBhbmVsRWxlbWVudC5wcm90b3R5cGUuc2V0dXAgPSBmdW5jdGlvbihvYmopIHtcblx0XHRpZiAob2JqLmdvdG8gIT0gLTEpIHRoaXMuZ290byA9IG9iai5nb3RvO1xuXHRcdC8vdGhpcy50eXBlID0gb2JqLnR5cGU7XG5cdFx0dGhpcy5hbGlnbiA9IG9iai5hbGlnbjtcblx0XHR0aGlzLmJ1YmJsZV90eXBlID0gb2JqLmJ1YmJsZV90eXBlO1xuXHRcdHRoaXMudGV4dCA9IG9iai50ZXh0O1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gb2JqLnBvc2l0aW9uO1xuXG5cdFx0Ly92YXIgcGFuZWwgPSBwYW5lbHNbaV07XG5cdFx0dmFyIHNiID0gb2JqO1xuXG5cdFx0dmFyIGRpdiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdmlld1wiKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpKTtcblx0XHR2YXIgYnViYmxlX29yaWVudCA9IHNiLmJ1YmJsZV90eXBlO1xuXG5cdFx0aWYgKG9iai5pbWFnZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR0aGlzLmltYWdlID0gb2JqLmltYWdlO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHZhciBpbWFnZSA9IFwiXCI7XG5cdFx0XHR2YXIgYnViYmxlX3NpemUgPSBcIm1lZGl1bVwiO1xuXHRcdFx0aWYgKHNiLnRleHQubGVuZ3RoIDwgNCkge1xuXHRcdFx0XHRidWJibGVfc2l6ZSA9IFwic21hbGxcIjtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0aW1hZ2UgKz0gYnViYmxlX3NpemU7XG5cdFx0XHRpZiAoYnViYmxlX29yaWVudCA9PSBcImJveFwiKSB7XG5cdFx0XHRcdGltYWdlICs9IFwiX2JveC5wbmdcIjtcblx0XHRcdH1cblx0XHRcdGVsc2UgaW1hZ2UgKz0gXCJfYnViYmxlX1wiICsgYnViYmxlX29yaWVudCArIFwiLnBuZ1wiO1xuXHRcdFx0dGhpcy5pbWFnZSA9ICdnYW1lL2ltZy9idWJibGVzLycgKyBpbWFnZTtcblx0XHR9XG5cblx0XHRkaXYuaW5uZXJIVE1MID0gXCI8cD5cIiArIHNiLnRleHQucmVwbGFjZSgvXFxuL2csIFwiPGJyPlwiKSArIFwiPC9wPlwiO1xuXG5cdFx0ZGl2LmNsYXNzTmFtZSA9IFwiYnViYmxlXCI7XG5cdFx0aWYgKGJ1YmJsZV9vcmllbnQgPT0gXCJib3hcIikgZGl2LmNsYXNzTmFtZSArPSBcIiBib3hcIjtcblx0XHRkaXYuY2xhc3NOYW1lICs9IFwiIG5vc2VsZWN0XCI7XG5cdFx0ZGl2LnN0eWxlLm9wYWNpdHkgPSAnMCc7XG5cdFx0ZGl2LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9ICd1cmwoXCInICsgdGhpcy5pbWFnZSArJ1wiKSc7XG5cdFx0ZGl2LnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuXHRcdGRpdi5zdHlsZS50b3AgPSAwO1xuXHRcdGRpdi5zdHlsZS5sZWZ0ID0gMDtcblxuXHRcdC8vZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN2aWV3XCIpLmFwcGVuZENoaWxkKGRpdik7XG5cblx0XHRcblxuXG5cdFx0dGhpcy5zY2FsZVggPSAwLjY7XG5cdFx0dGhpcy5zY2FsZVkgPSAwLjY7XG5cblx0XHR0aGlzLnggPSBzYi5wb3NpdGlvbi54ICogdGhpcy5wYW5lbGJpdG1hcC5pbWFnZS53aWR0aCp0aGlzLnBhbmVsYml0bWFwLnNjYWxlWDtcblx0XHR0aGlzLnkgPSBzYi5wb3NpdGlvbi55ICogdGhpcy5wYW5lbGJpdG1hcC5pbWFnZS5oZWlnaHQqdGhpcy5wYW5lbGJpdG1hcC5zY2FsZVk7XG5cdFx0Ly90aGlzLnggPSBlbG0ueDtcblx0XHQvL3RoaXMueSA9IGVsbS55O1xuXHRcdHRoaXMucmVnWCA9IGRpdi5jbGllbnRXaWR0aC8yO1xuXHRcdHRoaXMucmVnWSA9IGRpdi5jbGllbnRIZWlnaHQ7XG5cdFx0dGhpcy53aWR0aCA9IGRpdi5jbGllbnRXaWR0aDtcblx0XHR0aGlzLmhlaWdodCA9IGRpdi5jbGllbnRIZWlnaHQ7XG5cdFx0aWYgKGJ1YmJsZV9vcmllbnQgPT0gXCJsZWZ0XCIpIHtcblx0XHRcdHRoaXMucmVnWCA9IDA7XG5cdFx0fVxuXG5cdFx0dmFyIGFsaWduX3ggPSBcImxlZnRcIjtcblx0XHR2YXIgYWxpZ25feSA9IFwidG9wXCI7XG5cdFx0aWYgKHNiLmFsaWduICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGFsaWduX3ggPSBzYi5hbGlnbi54O1xuXHRcdFx0YWxpZ25feSA9IHNiLmFsaWduLnk7XG5cdFx0fVxuXHRcdGlmIChhbGlnbl94ID09IFwicmlnaHRcIikge1xuXHRcdFx0dGhpcy5yZWdYID0gZGl2LmNsaWVudFdpZHRoO1xuXHRcdFx0dGhpcy54ID0gdGhpcy5wYW5lbGJpdG1hcC5pbWFnZS53aWR0aCp0aGlzLnBhbmVsYml0bWFwLnNjYWxlWC10aGlzLng7XG5cdFx0fVxuXHRcdGlmIChhbGlnbl95ID09IFwiYm90dG9tXCIpIHtcblx0XHRcdHRoaXMucmVnWSA9IGRpdi5jbGllbnRIZWlnaHQ7XG5cdFx0XHR0aGlzLnkgPSB0aGlzLnBhbmVsYml0bWFwLmltYWdlLmhlaWdodCp0aGlzLnBhbmVsYml0bWFwLnNjYWxlWS10aGlzLnk7XG5cdFx0fVxuXHRcdHZhciBzZWxlY3RlZCA9IG5ldyBjcmVhdGVqcy5TaGFwZSgpO1xuXHRcdHZhciBoaXRzaGFwZSA9IG5ldyBjcmVhdGVqcy5TaGFwZSgpO1xuXHRcdGhpdHNoYXBlLmdyYXBoaWNzLmYoXCIjMDAwXCIpLmRyKDAsMCx0aGlzLndpZHRoLHRoaXMuaGVpZ2h0KTtcblx0XHR0aGlzLmhpdEFyZWEgPSBoaXRzaGFwZTtcblx0XHR2YXIgZWxtID0gbmV3IGNyZWF0ZWpzLkRPTUVsZW1lbnQoZGl2KTtcblx0XHR0aGlzLmFkZENoaWxkKHNlbGVjdGVkLCBlbG0pO1xuXHRcdGRpdi5vcGFjaXR5ID0gJzEnO1xuXHRcdGVsbS54ID0gMDtcblx0XHRlbG0ueSA9IDA7XG5cdFx0Ly90aGlzLmFkZENoaWxkKGhpdHNoYXBlKTtcblx0XHR0aGlzLm9uKFwibW91c2Vkb3duXCIsIHRoaXMuc2V0RHJhZ09mZnNldCk7XG5cdFx0dGhpcy5vbihcInByZXNzbW92ZVwiLCB0aGlzLmRyYWdFbGVtZW50KTtcblx0XHQvL3RoaXMub24oXCJjbGlja1wiLCB0aGlzLnNob3dQcm9wZXJ0aWVzKTtcblx0XHQvL2VsbS5yZWdZID0gZWxtLmdldEJvdW5kcygpLmhlaWdodDtcblx0XHQvL2VsZW1lbnRzLmFkZENoaWxkKGVsbSk7XG5cdH07XG5cblx0UGFuZWxFbGVtZW50LnByb3RvdHlwZS51cGRhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGVsZW1lbnQgPSB0aGlzLmNoaWxkcmVuWzFdLmh0bWxFbGVtZW50OyBcblx0XHRlbGVtZW50LmlubmVySFRNTCA9ICc8cD4nICsgdGhpcy50ZXh0LnJlcGxhY2UoL1xcbi9nLCBcIjxicj5cIikgKyAnPC9wPic7XG5cdFx0dGhpcy53aWR0aCA9IGVsZW1lbnQuY2xpZW50V2lkdGg7XG5cdFx0dGhpcy5oZWlnaHQgPSBlbGVtZW50LmNsaWVudEhlaWdodDtcblx0XHR0aGlzLnJlZ1ggPSBlbGVtZW50LmNsaWVudFdpZHRoLzI7XG5cdFx0dGhpcy5yZWdZID0gZWxlbWVudC5jbGllbnRIZWlnaHQ7XG5cblx0XHQvKnZhciBpbWFnZSA9IFwiXCI7XG5cdFx0dmFyIGJ1YmJsZV9zaXplID0gXCJtZWRpdW1cIjtcblx0XHRpZiAodGhpcy50ZXh0Lmxlbmd0aCA8IDQpIHtcblx0XHRcdGJ1YmJsZV9zaXplID0gXCJzbWFsbFwiO1xuXHRcdH1cblx0XHR2YXIgYnViYmxlX29yaWVudCA9IHRoaXMuYnViYmxlX3R5cGU7XG5cdFx0aW1hZ2UgKz0gYnViYmxlX3NpemU7XG5cdFx0aWYgKGJ1YmJsZV9vcmllbnQgPT0gXCJib3hcIikge1xuXHRcdFx0aW1hZ2UgKz0gXCJfYm94LnBuZ1wiO1xuXHRcdH1cblx0XHRlbHNlIGltYWdlICs9IFwiX2J1YmJsZV9cIiArIGJ1YmJsZV9vcmllbnQgKyBcIi5wbmdcIjtcblx0XHRlbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IFwidXJsKFxcXCJnYW1lL2ltZy9idWJibGVzL1wiK2ltYWdlK1wiXFxcIilcIjsqL1xuXHRcdGVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5pbWFnZTtcblxuXHRcdGlmICh0aGlzLmFsaWduICE9PSB1bmRlZmluZWQgJiYgdGhpcy5hbGlnbi54ID09IFwicmlnaHRcIikge1xuXHRcdFx0dGhpcy5yZWdYID0gZWxlbWVudC5jbGllbnRXaWR0aDtcblx0XHR9XG5cdH07XG5cblx0UGFuZWxFbGVtZW50LnByb3RvdHlwZS5zaG93UHJvcGVydGllcyA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBub2RlID0gdGhpcztcblx0XHQvL2lmIChjdXJyZW50bHlTZWxlY3RlZCA9PSB0aGlzKSByZXR1cm47XG5cdFx0Ly9jdXJyZW50bHlTZWxlY3RlZCA9IHRoaXM7XG5cblx0XHQvL2NvbnNvbGUubG9nKFwiU2hvd2luZyBwcm9wZXJ0aWVzIGZvciBub2RlIFwiICsgbm9kZS5uYW1lICk7XG5cblx0XHR2YXIgcHJvcGVydHlfcGFuZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnRpZXNcIik7XG5cblx0XHR2YXIgcHJvcGVydHlfaGVhZGVyID0gXHQnPGRpdiBpZD1cIm9iamVjdC1uYW1lXCI+JyArXG5cdFx0XHRcdFx0XHRcdFx0XHQnPHA+JyArIG5vZGUucGFyZW50Lm5hbWUgKyAnPHNwYW4gY2xhc3M9XCJlbGVtZW50LWlkXCI+JyArIG5vZGUucGFyZW50LmNvbnN0cnVjdG9yLm5hbWUgKyAnICMnICsgbm9kZUNvbnRhaW5lci5nZXRDaGlsZEluZGV4KG5vZGUucGFyZW50KSArICcgLSAnICsgbm9kZS5jb25zdHJ1Y3Rvci5uYW1lICsgJzwvc3Bhbj48L3A+JyArXG5cdFx0XHRcdFx0XHRcdFx0JzwvZGl2Pic7XG5cdFx0cHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MID0gcHJvcGVydHlfaGVhZGVyO1xuXG5cdFx0Ly92YXIgbm9kZV9uYW1lID0gJzxkaXYgY2xhc3M9XCJmaWVsZCBsYWJlbHNpZGVcIj48cD5OYW1lOjwvcD48aW5wdXQgdHlwZT1cInRleHRcIiB2YWx1ZT1cIicgKyBub2RlLm5hbWUgKyAnXCIgaWQ9XCJwcm9wZXJ0eS1uYW1lXCI+PC9kaXY+Jztcblx0XHQvL3Byb3BlcnR5X3BhbmVsLmlubmVySFRNTCArPSBub2RlX25hbWU7XG5cblx0XHR2YXIgcHJvcF9pbWFnZSA9ICc8ZGl2IGNsYXNzPVwiZmllbGQgbGFiZWx0b3BcIj48cD5JbWFnZSBVUkw6PC9wPjxpbnB1dCB0eXBlPVwidGV4dFwiIHZhbHVlPVwiJyArIG5vZGUuaW1hZ2UgKyAnXCIgaWQ9XCJwcm9wZXJ0eS1pbWFnZXBhdGhcIj48L2Rpdj4nO1xuXHRcdHByb3BlcnR5X3BhbmVsLmlubmVySFRNTCArPSBwcm9wX2ltYWdlO1xuXG5cdFx0Y29uc29sZS5sb2coXCJZbyFcIik7XG5cblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnR5LWltYWdlcGF0aFwiKS5vbmNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJXaHV0IVwiKTtcblx0XHRcdC8vbm9kZS5pbWFnZSA9IHByb3BpbWFnZS52YWx1ZTtcblx0XHRcdHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRcdGltZy5zcmMgPSBwcm9waW1hZ2UudmFsdWU7XG5cdFx0XHRpbWcub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdG5vZGUuaW1hZ2UgPSBwcm9waW1hZ2UudmFsdWU7XG5cdFx0XHRcdG5vZGUudXBkYXRlRWxlbWVudCgpO1xuXHRcdFx0XHQvL25vZGUucGFuZWxiaXRtYXAuaW1hZ2UgPSBpbWc7XG5cdFx0XHRcdC8vbm9kZS5zZWxlY3RlZC5ncmFwaGljcy5jbGVhcigpO1xuXHRcdFx0XHQvL3ZhciB0aGlja25lc3MgPSAzO1xuXHRcdFx0XHQvL25vZGUuc2VsZWN0ZWQuZ3JhcGhpY3MuZihcIiMwMDk5ZWVcIikuZHIoLXRoaWNrbmVzcywtdGhpY2tuZXNzLG5vZGUucGFuZWxiaXRtYXAuaW1hZ2Uud2lkdGgqbm9kZS5wYW5lbGJpdG1hcC5zY2FsZVgrdGhpY2tuZXNzKjIsIG5vZGUucGFuZWxiaXRtYXAuaW1hZ2UuaGVpZ2h0Km5vZGUucGFuZWxiaXRtYXAuc2NhbGVZK3RoaWNrbmVzcyoyKTtcblx0XHRcdH1cblx0XHRcdGltZy5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBkaWFsb2cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2RpYWxvZ1wiKTtcblx0XHRcdFx0ZGlhbG9nLmlubmVySFRNTCA9IFwiPHA+J1wiICsgcHJvcGltYWdlLnZhbHVlICsgXCInIGNvdWxkIG5vdCBiZSBsb2FkZWQ8cD5cIjtcblx0XHRcdFx0Ly9kaWFsb2cuc3R5bGUudG9wID0gXCI1MCVcIjtcblx0XHRcdFx0Ly9kaWFsb2cuc3R5bGUubGVmdCA9IFwiNTAlXCI7XG5cdFx0XHRcdGRpYWxvZy5zdHlsZS5vcGFjaXR5ID0gXCIwLjhcIjtcblx0XHRcdFx0ZGlhbG9nLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiIzUyMlwiO1xuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGRpYWxvZy5zdHlsZS5vcGFjaXR5ID0gXCIwXCI7XG5cdFx0XHRcdH0sIDIwMDApO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR2YXIgcHJvcF90ZXh0ID0gJzxkaXYgY2xhc3M9XCJmaWVsZCBsYWJlbHRvcFwiPjxwPlRleHQ6PC9wPjx0ZXh0YXJlYSBpZD1cInByb3BlcnR5LXRleHRcIj4nICtcblx0XHRub2RlLnRleHQgK1xuXHRcdCc8L3RleHRhcmVhPjwvZGl2Pic7XG5cblx0XHQvL3ZhciBwYW5lbF9pbWFnZSA9ICc8ZGl2IGNsYXNzPVwiZmllbGQgbGFiZWx0b3BcIj48cD5JbWFnZSBVUkw6PC9wPjxpbnB1dCB0eXBlPVwidGV4dFwiIHZhbHVlPVwiJyArIG5vZGUuaW1hZ2UgKyAnXCIgaWQ9XCJwcm9wZXJ0eS1pbWFnZXBhdGhcIj48L2Rpdj4nO1xuXHRcdHByb3BlcnR5X3BhbmVsLmlubmVySFRNTCArPSBwcm9wX3RleHQ7XG5cblx0XHQvL3ZhciBwYW5lbF9zaXplID0gJzxkaXYgY2xhc3M9XCJmaWVsZCBsYWJlbHNpZGVcIj48cD5TaXplOjwvcD48dWwgaWQ9XCJwcm9wZXJ0eS1zaXplXCIgY2xhc3M9XCJudW1iZXJidXR0b25zIG5vc2VsZWN0XCI+Jztcblx0XHRcblx0XHQvL3BhbmVsX3NpemUgKz0gJzwvdWw+PC9kaXY+Jztcblx0XHRcblx0XHQvKnBhbmVsX3NpemUgKz0gJzwvdWw+PC9kaXY+Jztcblx0XHRwcm9wZXJ0eV9wYW5lbC5pbm5lckhUTUwgKz0gcGFuZWxfc2l6ZTsqL1xuXHRcdC8qdmFyIHByb3BuYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNwcm9wZXJ0eS1uYW1lXCIpO1xuXHRcdHByb3BuYW1lLm9uY2hhbmdlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRub2RlLm5hbWUgPSBwcm9wbmFtZS52YWx1ZTtcblx0XHR9Ki9cblxuXHRcdHZhciBkZWxldGVfYnV0dG9uID0gJzxkaXYgY2xhc3M9XCJmaWVsZFwiPjxpbnB1dCBpZD1cImRlbGV0ZVwiIGNsYXNzPVwiYnV0dG9uIGRlbGV0ZS1idXR0b25cIiB0eXBlPVwic3VibWl0XCIgdmFsdWU9XCJEZWxldGUgUGFuZWxcIj48L2Rpdj4nO1xuXHRcdHByb3BlcnR5X3BhbmVsLmlubmVySFRNTCArPSBkZWxldGVfYnV0dG9uO1xuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZGVsZXRlXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdGNvbnNvbGUubG9nKG5vZGUucGFyZW50KTtcblx0XHRcdG5vZGUucGFyZW50LnJlbW92ZUNoaWxkKGN1cnJlbnRseVNlbGVjdGVkKTtcblx0XHR9O1xuXG5cdFx0dmFyIHByb3B0ZXh0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNwcm9wZXJ0eS10ZXh0XCIpO1xuXHRcdHByb3B0ZXh0Lm9ua2V5dXAgPSBmdW5jdGlvbigpIHtcblx0XHRcdC8vY29uc29sZS5sb2cocHJvcHRleHQudmFsdWUpO1xuXHRcdFx0bm9kZS50ZXh0ID0gcHJvcHRleHQudmFsdWU7XG5cdFx0XHRub2RlLnVwZGF0ZUVsZW1lbnQoKTtcblx0XHR9O1xuXG5cdFx0XG5cdFx0XG5cdH07XG5cblx0UGFuZWxFbGVtZW50LnByb3RvdHlwZS5zZXREcmFnT2Zmc2V0ID0gZnVuY3Rpb24oZXZ0KSB7XG5cdFx0dmFyIGdsb2JhbCA9IGV2dC50YXJnZXQucGFyZW50LmxvY2FsVG9HbG9iYWwoZXZ0LnRhcmdldC54LCBldnQudGFyZ2V0LnkpO1xuXHRcdGRyYWdvZmZzZXQgPSB7XG5cdFx0XHR4OiBldnQuc3RhZ2VYIC0gZ2xvYmFsLngsXG5cdFx0XHR5OiBldnQuc3RhZ2VZIC0gZ2xvYmFsLnlcblx0XHR9O1xuXHRcdC8vY3VycmVudGx5U2VsZWN0ZWQgPSBldnQudGFyZ2V0LnBhcmVudDtcblx0XHRpZiAoY3VycmVudGx5U2VsZWN0ZWQgIT09IHVuZGVmaW5lZCAmJiBjdXJyZW50bHlTZWxlY3RlZC5zZWxlY3RlZCAhPT0gdW5kZWZpbmVkKSBjdXJyZW50bHlTZWxlY3RlZC5zZWxlY3RlZC5ncmFwaGljcy5jbGVhcigpO1xuXHRcdGN1cnJlbnRseVNlbGVjdGVkID0gZXZ0LnRhcmdldDtcblx0XHRvcGVuVGFiKFwicHJvcGVydHlUYWJcIik7XG5cdFx0Ly9ldnQudGFyZ2V0LnNob3dQcm9wZXJ0aWVzKCk7XG5cdH07XG5cblx0UGFuZWxFbGVtZW50LnByb3RvdHlwZS5kcmFnRWxlbWVudCA9IGZ1bmN0aW9uKGV2dCkge1xuXHRcdC8vY29uc29sZS5sb2coXCJDbGljayFcIik7XG5cdFx0dmFyIGxvY2FsID0gZXZ0LnRhcmdldC5wYXJlbnQuZ2xvYmFsVG9Mb2NhbChldnQuc3RhZ2VYIC0gZHJhZ29mZnNldC54LCBldnQuc3RhZ2VZIC0gZHJhZ29mZnNldC55KTtcblx0XHR2YXIgcGFuZWxiaXRtYXAgPSBldnQudGFyZ2V0LnBhcmVudC5wYW5lbGJpdG1hcDtcblx0XHR2YXIgcGFuZWwgPSB7XG5cdFx0XHR3aWR0aDogcGFuZWxiaXRtYXAuaW1hZ2Uud2lkdGgqcGFuZWxiaXRtYXAuc2NhbGVYLFxuXHRcdFx0aGVpZ2h0OiBwYW5lbGJpdG1hcC5pbWFnZS5oZWlnaHQqcGFuZWxiaXRtYXAuc2NhbGVZXG5cdFx0fTtcblx0XHRpZiAobG9jYWwueCA8IDApIGxvY2FsLnggPSAwO1xuXHRcdGlmIChsb2NhbC54ID4gcGFuZWwud2lkdGgpIGxvY2FsLnggPSBwYW5lbC53aWR0aDtcblx0XHRpZiAobG9jYWwueSA8IDApIGxvY2FsLnkgPSAwO1xuXHRcdGlmIChsb2NhbC55ID4gcGFuZWwuaGVpZ2h0KSBsb2NhbC55ID0gcGFuZWwuaGVpZ2h0O1xuXHRcdGV2dC50YXJnZXQueCA9IGxvY2FsLng7XG5cdFx0ZXZ0LnRhcmdldC55ID0gbG9jYWwueTtcbiAgICAgICAgLypldnQudGFyZ2V0LnBvc2l0aW9uID0geyBcbiAgICAgICAgICAgIHg6IGxvY2FsLngvZXZ0LnRhcmdldC5wYW5lbGJpdG1hcC5pbWFnZS53aWR0aC9ldnQudGFyZ2V0LnBhbmVsYml0bWFwLnNjYWxlWCoxMDAsIFxuICAgICAgICAgICAgeTogbG9jYWwueS9ldnQudGFyZ2V0LnBhbmVsYml0bWFwLmltYWdlLmhlaWdodC9ldnQudGFyZ2V0LnBhbmVsYml0bWFwLnNjYWxlWSoxMDAgfSovXG5cdFx0ZXZ0LnRhcmdldC5wYXJlbnQuZHJhd0Nvbm5lY3Rpb25zKCk7XG5cdH07XG5cblx0d2luZG93LlBhbmVsRWxlbWVudCA9IGNyZWF0ZWpzLnByb21vdGUoUGFuZWxFbGVtZW50LCBcIkNvbnRhaW5lclwiKTtcblxuXG5cdC8vIC0tLS0tLS0tLS0tLS0tLSAvL1xuXHQvLyAgTm9kZUNvbnRhaW5lciAgLy9cblx0Ly8gLS0tLS0tLS0tLS0tLS0tIC8vXG5cblx0ZnVuY3Rpb24gTm9kZUNvbnRhaW5lcigpIHtcblx0XHR0aGlzLkNvbnRhaW5lcl9jb25zdHJ1Y3RvcigpO1xuXHRcdHRoaXMuc3RhcnRub2RlID0gMDtcblx0fSBjcmVhdGVqcy5leHRlbmQoTm9kZUNvbnRhaW5lciwgY3JlYXRlanMuQ29udGFpbmVyKTtcblxuXG5cdE5vZGVDb250YWluZXIucHJvdG90eXBlLnNob3dQcm9wZXJ0aWVzID0gZnVuY3Rpb24oKSB7XG5cblx0XHQvL2NvbnNvbGUubG9nKHRoaXMpO1xuXG5cdFx0Ly9mIChjdXJyZW50bHlTZWxlY3RlZCA9PSB0aGlzKSByZXR1cm47XG5cdFx0Ly9jdXJyZW50bHlTZWxlY3RlZCA9IHRoaXM7XG5cblx0XHR2YXIgcHJvcGVydHlfcGFuZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnRpZXNcIik7XG5cblx0XHR2YXIgcHJvcGVydHlfaGVhZGVyID0gXHQnPGRpdiBpZD1cIm9iamVjdC1uYW1lXCI+JyArXG5cdFx0XHRcdFx0XHRcdFx0XHQnPHA+UHJvamVjdCBQcm9wZXJ0aWVzPC9wPicgK1xuXHRcdFx0XHRcdFx0XHRcdCc8L2Rpdj4nO1xuXHRcdHByb3BlcnR5X3BhbmVsLmlubmVySFRNTCA9IHByb3BlcnR5X2hlYWRlcjtcblxuXHRcdHZhciBwcm9wX3N0YXJ0bm9kZSA9ICc8ZGl2IGNsYXNzPVwiZmllbGQgbGFiZWxzaWRlXCI+PHA+U3RhcnQgbm9kZTo8L3A+PGlucHV0IHR5cGU9XCJudW1iZXJcIiB2YWx1ZT1cIicgKyB0aGlzLnN0YXJ0bm9kZSArICdcIiBpZD1cInByb3BlcnR5LXN0YXJ0bm9kZVwiPjwvZGl2Pic7XG5cdFx0cHJvcGVydHlfcGFuZWwuaW5uZXJIVE1MICs9IHByb3Bfc3RhcnRub2RlO1xuXG5cdFx0dmFyIHByb3BzdGFydCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcHJvcGVydHktc3RhcnRub2RlXCIpO1xuXHRcdHZhciBjb250YWluZXIgPSB0aGlzO1xuXHRcdHByb3BzdGFydC5vbmNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJTdGFydCBub2RlIGNoYW5nZWRcIiwgcHJvcHN0YXJ0LnZhbHVlKTtcblx0XHRcdGNvbnRhaW5lci5zdGFydG5vZGUgPSBwcm9wc3RhcnQudmFsdWU7XG5cdFx0XHRjb25zb2xlLmxvZyhjb250YWluZXIuc3RhcnRub2RlKTtcblx0XHR9O1xuXHRcdFxuXHR9O1xuXG5cdE5vZGVDb250YWluZXIucHJvdG90eXBlLm1ha2VDb25uZWN0aW9ucyA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0Zm9yIChpPTA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgbm9kZSA9IHRoaXMuY2hpbGRyZW5baV07XG5cdFx0XHRpZiAobm9kZS5nb3RvICE9PSB1bmRlZmluZWQpIG5vZGUuZ290byA9IHRoaXMuZ2V0Q2hpbGRBdChub2RlLmdvdG8pO1xuXHRcdFx0Zm9yIChlPTA7IGUgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgZSsrKSB7XG5cdFx0XHRcdHZhciBlbGVtID0gbm9kZS5jaGlsZHJlbltlXTtcblx0XHRcdFx0aWYgKGVsZW0gaW5zdGFuY2VvZiBQYW5lbEVsZW1lbnQgJiYgZWxlbS5nb3RvICE9PSB1bmRlZmluZWQpIGVsZW0uZ290byA9IHRoaXMuZ2V0Q2hpbGRBdChlbGVtLmdvdG8pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9O1xuXG5cdC8vIE92ZXJ3cml0ZSBDb250YWluZXIucmVtb3ZlQ2hpbGQoKVxuXHROb2RlQ29udGFpbmVyLnByb3RvdHlwZS5yZW1vdmVDaGlsZCA9IGZ1bmN0aW9uKGNoaWxkKSB7XG5cdFx0dmFyIHZpZXcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpZXdcIik7XG5cdFx0Zm9yIChlPTA7IGU8Y2hpbGQuY2hpbGRyZW4ubGVuZ3RoOyBlKyspIHtcblx0XHRcdHZhciBlbG0gPSBjaGlsZC5jaGlsZHJlbltlXTtcblx0XHRcdGNvbnNvbGUubG9nKGVsbSk7XG5cdFx0XHRpZiAoZWxtIGluc3RhbmNlb2YgUGFuZWxFbGVtZW50KSB7XG5cdFx0XHRcdGVsbSA9IGVsbS5jaGlsZHJlblsxXS5odG1sRWxlbWVudDtcblx0XHRcdFx0Y29uc29sZS5sb2coZWxtKTtcblx0XHRcdFx0dmlldy5yZW1vdmVDaGlsZChlbG0pO1xuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGlzLkNvbnRhaW5lcl9yZW1vdmVDaGlsZChjaGlsZCk7XG5cdFx0ZHJhd0FsbENvbm5lY3Rpb25zKCk7XG5cdH1cblxuXHQvLyB0b09iamVjdCAtIEZvciBvdXRwdXR0aW5nIGVkaXRvciBwYXJhbWV0ZXJzIHRvIGEgSlNPTiBvYmplY3RcblxuXHROb2RlQ29udGFpbmVyLnByb3RvdHlwZS50b09iamVjdCA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0dmFyIG91dHB1dCA9IG5ldyBPYmplY3QoKTtcblxuXHRcdG91dHB1dC5jb25maWcgPSB7XG5cdFx0XHRzdGFydG5vZGU6IHRoaXMuc3RhcnRub2RlXG5cdFx0fTtcblxuXHRcdG91dHB1dC5ub2RlcyA9IFtdO1xuXHRcdGZvciAoaT0wOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIHJlZiA9IHRoaXMuY2hpbGRyZW5baV07XG5cdFx0XHQvLyBjeWNsZSB0aHJvdWdoIGFsbCBub2Rlcywgc2F2aW5nIHRoZWlyIGRhdGEgdG8gYW4gb2JqZWN0XG5cdFx0XHR2YXIgbm9kZSA9IG5ldyBPYmplY3QoKTtcblxuXHRcdFx0aWYgKHJlZiBpbnN0YW5jZW9mIFBhbmVsKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2cobm9kZS5uYW1lKTtcblx0XHRcdFx0bm9kZS5uYW1lID0gcmVmLm5hbWU7XG5cdFx0XHRcdG5vZGUuc2l6ZSA9IHJlZi5zaXplO1xuXHRcdFx0XHRub2RlLmltYWdlID0gcmVmLmltYWdlO1xuXHRcdFx0XHRub2RlLmdvdG8gPSB0aGlzLmdldENoaWxkSW5kZXgocmVmLmdvdG8pO1xuXHRcdFx0XHRpZiAobm9kZS5nb3RvID09IC0xKSBub2RlLmdvdG8gPSB1bmRlZmluZWQ7XG5cdFx0XHRcdG5vZGUuZWRpdG9yID0ge1xuXHRcdFx0XHRcdHBvc2l0aW9uOiB7IHg6IHJlZi54LCB5OiByZWYueSB9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0bm9kZS5lbGVtZW50cyA9IFtdO1xuXG5cdFx0XHRcdGZvciAoZT0wOyBlIDwgcmVmLmNoaWxkcmVuLmxlbmd0aDsgZSsrKSB7XG5cdFx0XHRcdFx0dmFyIHJfZWxlbSA9IHJlZi5jaGlsZHJlbltlXTtcblx0XHRcdFx0XHRpZiAocl9lbGVtIGluc3RhbmNlb2YgUGFuZWxFbGVtZW50KSB7XG5cdFx0XHRcdFx0XHR2YXIgZWxlbSA9IG5ldyBPYmplY3QoKTtcblxuXHRcdFx0XHRcdFx0ZWxlbS50eXBlID0gcl9lbGVtLnR5cGU7XG5cdFx0XHRcdFx0XHRpZiAocl9lbGVtLnRleHQgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0XHRlbGVtLnRleHQgPSByX2VsZW0udGV4dDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsZW0uYnViYmxlX3R5cGUgPSByX2VsZW0uYnViYmxlX3R5cGU7XG5cdFx0XHRcdFx0XHRlbGVtLmltYWdlID0gcl9lbGVtLmltYWdlO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRlbGVtLnBvc2l0aW9uID0ge1xuXHRcdFx0XHRcdFx0XHR4OnJfZWxlbS54LyhyX2VsZW0ucGFuZWxiaXRtYXAuaW1hZ2Uud2lkdGgqcl9lbGVtLnBhbmVsYml0bWFwLnNjYWxlWCksXG5cdFx0XHRcdFx0XHRcdHk6cl9lbGVtLnkvKHJfZWxlbS5wYW5lbGJpdG1hcC5pbWFnZS5oZWlnaHQqcl9lbGVtLnBhbmVsYml0bWFwLnNjYWxlWSlcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGlmIChyX2VsZW0uYWxpZ24gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0XHRlbGVtLmFsaWduID0gcl9lbGVtLmFsaWduO1xuXHRcdFx0XHRcdFx0XHRpZiAoZWxlbS5hbGlnbi54ID09IFwicmlnaHRcIikgZWxlbS5wb3NpdGlvbi54ID0gMSAtIGVsZW0ucG9zaXRpb24ueDtcblx0XHRcdFx0XHRcdFx0aWYgKGVsZW0uYWxpZ24ueSA9PSBcImJvdHRvbVwiKSBlbGVtLnBvc2l0aW9uLnkgPSAxIC0gZWxlbS5wb3NpdGlvbi55O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxlbS5nb3RvID0gdGhpcy5nZXRDaGlsZEluZGV4KHJfZWxlbS5nb3RvKTtcblx0XHRcdFx0XHRcdGlmIChlbGVtLmdvdG8gPT0gLTEpIGVsZW0uZ290byA9IHVuZGVmaW5lZDtcblxuXHRcdFx0XHRcdFx0bm9kZS5lbGVtZW50cy5wdXNoKGVsZW0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cblx0XHRcdG91dHB1dC5ub2Rlcy5wdXNoKG5vZGUpO1xuXHRcdH1cblxuXHRcdHJldHVybiBvdXRwdXQ7XG5cdH07XG5cblx0d2luZG93Lk5vZGVDb250YWluZXIgPSBjcmVhdGVqcy5wcm9tb3RlKE5vZGVDb250YWluZXIsIFwiQ29udGFpbmVyXCIpO1xuXG59KCkpO1xuXG5cblxuXG5cblxuIiwidmFyIGxvY2FsZm9yYWdlID0gcmVxdWlyZSgnbG9jYWxmb3JhZ2UnKTtcbi8qZXhwb3J0cy5jaGVja1BhdGggPSBmdW5jdGlvbihwYXRoKVxue1xuXHRpZiAodHlwZW9mIHBhdGggPT0gXCJ1bmRlZmluZWRcIiB8fCBwYXRoID09PSBcIlwiICkge1xuXHRcdHdpbmRvdy5hbGVydChcIllvdSBmb3Jnb3QgdG8gZW50ZXIgYSBwYXRoIVwiKTtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHR2YXIgZmlsZW5hbWUgPSBwYXRoLnNwbGl0KFwiL1wiKS5wb3AoKTtcblx0dmFyIGV4dGVuc2lvbiA9IGZpbGVuYW1lLnNwbGl0KFwiLlwiKS5wb3AoKTtcblxuXHRpZiAoZXh0ZW5zaW9uICE9IFwianNvblwiICYmIGV4dGVuc2lvbiAhPSBcInR4dFwiKSB7XG5cdFx0d2luZG93LmFsZXJ0KFwiUGxlYXNlIHNwZWNpZnkgYSAuanNvbiBvciAudHh0IGZpbGUuXCIpO1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdHJldHVybiB0cnVlO1xufSovXG5cbmV4cG9ydHMubG9hZEFsbEltYWdlcyA9IGZ1bmN0aW9uKHBhdGgsIGNhbGxiYWNrKSB7XG5cdFxuICAgIHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cdHJlcXVlc3Qub3BlbignR0VUJywgXCIuL2pzL2ltZy1mb2xkZXIucGhwXCIsIHRydWUpO1xuXG5cdHJlcXVlc3Qub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHJlcXVlc3Quc3RhdHVzID49IDIwMCAmJiByZXF1ZXN0LnN0YXR1cyA8IDQwMCkge1xuXHRcdFx0Ly9kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Byb3BlcnRpZXNcIikuaW5uZXJIVE1MID0gcmVxdWVzdC5yZXNwb25zZVRleHQ7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHJlcXVlc3QucmVzcG9uc2VUZXh0KTtcblx0XHRcdGNhbGxiYWNrKEpTT04ucGFyc2UocmVxdWVzdC5yZXNwb25zZVRleHQpKTtcblx0XHR9IGVsc2Uge1xuXHRcdC8vIFdlIHJlYWNoZWQgb3VyIHRhcmdldCBzZXJ2ZXIsIGJ1dCBpdCByZXR1cm5lZCBhbiBlcnJvclxuXHRcdGFsZXJ0KHJlcXVlc3QucmVzcG9uc2VUZXh0KTtcblx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdH07XG5cblx0cmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG5cdFx0YWxlcnQocmVxdWVzdC5yZXNwb25zZVRleHQpO1xuXHR9O1xuXG5cdHJlcXVlc3Quc2VuZCgpO1xufVxuXG5leHBvcnRzLnNhdmUgPSBmdW5jdGlvbihvYmosIHBhdGgpIHtcblx0bG9jYWxmb3JhZ2Uuc2V0SXRlbSgnY3dpbmUnLCBvYmosIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7IFx0XG5cdFx0dmFyIGRpYWxvZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZGlhbG9nXCIpO1xuXHRcdGRpYWxvZy5pbm5lckhUTUwgPSBcIjxwPkN3aW5lIHNhdmVkIHN1Y2Nlc3NmdWxseTxwPlwiO1xuXHRcdGRpYWxvZy5zdHlsZS5vcGFjaXR5ID0gXCIwLjhcIjtcblx0XHRkaWFsb2cuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCIjMzMzXCI7XG5cdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdGRpYWxvZy5zdHlsZS5vcGFjaXR5ID0gXCIwXCI7XG5cdFx0fSwgMjAwMCk7XG5cdH0pO1xufVxuXG5leHBvcnRzLmxvYWQgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuXG5cdGxvY2FsZm9yYWdlLmdldEl0ZW0oJ2N3aW5lJywgZnVuY3Rpb24oZXJyLCB2YWx1ZSkge1xuXHRcdHByZWxvYWRJbWFnZXModmFsdWUsY2FsbGJhY2spOyBcdFxuXHRcdC8vY2FsbGJhY2sodmFsdWUpO1xuXHR9KTtcbn1cblxuZXhwb3J0cy5sb2FkSlNPTiA9IGZ1bmN0aW9uKHBhdGgsIGNhbGxiYWNrKSB7XG5cblx0Ly9pZiAoIWNoZWNrUGF0aChwYXRoKSkgcmV0dXJuO1xuXHQvL2NsZWFyQWxsKCk7XG5cblx0dmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0cmVxdWVzdC5vcGVuKCdHRVQnLCBwYXRoICsgJz9fPScgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKSwgdHJ1ZSk7XG5cblx0dmFyIG1vYmlsZV9zbWFsbF9wYW5lbHMgPSAwO1xuXG5cdHJlcXVlc3Qub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHJlcXVlc3Quc3RhdHVzID49IDIwMCAmJiByZXF1ZXN0LnN0YXR1cyA8IDQwMCkge1xuXHRcdFx0Ly8gU3VjY2VzcyFcblx0XHRcdC8vcGFuZWxzID0gSlNPTi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB2YXIgb2JqID0gSlNPTi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKG9iaik7XG5cdFx0XHRwcmVsb2FkSW1hZ2VzKG9iaiwgY2FsbGJhY2spO1xuXHRcdFx0Ly9jYWxsYmFjayhvYmopO1xuXHRcdH0gZWxzZSB7XG5cdFx0Ly8gV2UgcmVhY2hlZCBvdXIgdGFyZ2V0IHNlcnZlciwgYnV0IGl0IHJldHVybmVkIGFuIGVycm9yXG5cdFx0XHRpZiAocmVxdWVzdC5zdGF0dXMgPT0gNDA0KSB3aW5kb3cuYWxlcnQoXCJGaWxlIG5vdCBmb3VuZCFcIik7XG5cdFx0XHRlbHNlIHdpbmRvdy5hbGVydChyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG5cdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHR9O1xuXG5cdHJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuXHRcdGFsZXJ0KHJlcXVlc3QucmVzcG9uc2VUZXh0KTtcblx0fTtcblxuXHRyZXF1ZXN0LnNlbmQoKTtcbn1cblxuZnVuY3Rpb24gcHJlbG9hZEltYWdlcyhvYmosIGNhbGxiYWNrKSB7XG5cdHZhciBsb2FkZWQgPSAwO1xuXHR2YXIgaW1hZ2VzID0gW107XG5cdC8qaW1hZ2VzLnB1c2goXCJpbWcvYnViYmxlcy9tZWRpdW1fYnViYmxlX2xlZnQucG5nXCIpO1xuXHRpbWFnZXMucHVzaChcImltZy9idWJibGVzL21lZGl1bV9idWJibGVfZG93bi5wbmdcIik7XG5cdGltYWdlcy5wdXNoKFwiaW1nL2J1YmJsZXMvbWVkaXVtX2JveC5wbmdcIik7XG5cdGltYWdlcy5wdXNoKFwiaW1nL2J1YmJsZXMvc21hbGxfYm94LnBuZ1wiKTtcblx0aW1hZ2VzLnB1c2goXCJpbWcvYnViYmxlcy9zbWFsbF9idWJibGVfZG93bi5wbmdcIik7XG5cdGltYWdlcy5wdXNoKFwiaW1nL2J1YmJsZXMveF9zbWFsbF9idWJibGVfbGVmdC5wbmdcIik7Ki9cblx0Zm9yICh2YXIgaT0wOyBpPG9iai5ub2Rlcy5sZW5ndGg7IGkrKykge1xuXHRcdGltYWdlcy5wdXNoKG9iai5ub2Rlc1tpXS5pbWFnZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBpbWFnZUxvYWRlZCgpIHtcblx0XHRsb2FkZWQrKztcblx0XHQvL2NvbnNvbGUubG9nKFwiSW1hZ2UgbG9hZGVkLi5cIiArIGxvYWRlZCArIFwiL1wiICsgaW1hZ2VzLmxlbmd0aCk7XG5cdFx0dXBkYXRlUHJvZ3Jlc3MoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZVByb2dyZXNzKCkge1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicHJvZ3Jlc3NfYmFyXCIpLnN0eWxlLndpZHRoID0gKGxvYWRlZC9pbWFnZXMubGVuZ3RoICogMTAwKS50b1N0cmluZygpICsgXCIlXCI7XG5cdFx0Ly9jb25zb2xlLmxvZyhcInVwZGF0ZSBwcm9ncmVzcy4uXCIpO1xuXHRcdGlmIChsb2FkZWQgPT0gaW1hZ2VzLmxlbmd0aCkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJGaW5pc2hlZCBwcmVsb2FkaW5nIGltYWdlcy4uXCIpO1xuXHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwcm9ncmVzc1wiKS5zdHlsZS5vcGFjaXR5ID0gXCIwXCI7XG5cdFx0XHR9LCAxMDApO1xuXHRcdFx0Y2FsbGJhY2sob2JqKTtcblx0XHR9XG5cdH1cblxuXHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicHJvZ3Jlc3NcIikuc3R5bGUub3BhY2l0eSA9IFwiMVwiO1xuXHR9LCAxMDApO1xuXG5cdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0Ly8gcHJlbG9hZCBpbWFnZVxuXHRcdGZvciAodmFyIGw9MDsgbDxpbWFnZXMubGVuZ3RoOyBsKyspIHtcblx0XHRcdHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRcdGltZy5zcmMgPSBpbWFnZXNbbF07XG5cdFx0XHRpbWcub25sb2FkID0gaW1hZ2VMb2FkZWQ7XG5cdFx0fVxuXHR9LCA1MCk7XG59IiwidmFyIGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyLmpzJyk7XG52YXIgZWRpdG9yID0gcmVxdWlyZSgnLi9lZGl0b3IuanMnKTtcblxuLy92YXIgZ2FtZXBhdGggPSBfX2Rpcm5hbWUgKyAnL2FwcC9nYW1lLyc7XG5cbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblxuXHRcdC8vIENoZWNrIGZvciB0aGUgdmFyaW91cyBGaWxlIEFQSSBzdXBwb3J0LlxuXHRpZiAod2luZG93LkZpbGUgJiYgd2luZG93LkZpbGVSZWFkZXIgJiYgd2luZG93LkZpbGVMaXN0ICYmIHdpbmRvdy5CbG9iKSB7XG5cdCAgLy8gR3JlYXQgc3VjY2VzcyEgQWxsIHRoZSBGaWxlIEFQSXMgYXJlIHN1cHBvcnRlZC5cblx0fSBlbHNlIHtcblx0ICBhbGVydCgnVGhlIEZpbGUgQVBJcyBhcmUgbm90IGZ1bGx5IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXIuJyk7XG5cdH1cblx0Ly9kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3NhdmVcIik7XG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbG9hZGpzb25cIikub25jbGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdGxvYWRlci5sb2FkSlNPTihkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2ZpbGVwYXRoXCIpLnZhbHVlLCBlZGl0b3IuaW5pdCk7XG5cdH07XG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbG9hZFwiKS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0bG9hZGVyLmxvYWQoZWRpdG9yLmluaXQpO1xuXHR9O1xuXHRsb2FkZXIubG9hZChlZGl0b3IuaW5pdCk7XG59OyIsIi8qIVxuICAgIGxvY2FsRm9yYWdlIC0tIE9mZmxpbmUgU3RvcmFnZSwgSW1wcm92ZWRcbiAgICBWZXJzaW9uIDEuMy4wXG4gICAgaHR0cHM6Ly9tb3ppbGxhLmdpdGh1Yi5pby9sb2NhbEZvcmFnZVxuICAgIChjKSAyMDEzLTIwMTUgTW96aWxsYSwgQXBhY2hlIExpY2Vuc2UgMi4wXG4qL1xuKGZ1bmN0aW9uKCkge1xudmFyIGRlZmluZSwgcmVxdWlyZU1vZHVsZSwgcmVxdWlyZSwgcmVxdWlyZWpzO1xuXG4oZnVuY3Rpb24oKSB7XG4gIHZhciByZWdpc3RyeSA9IHt9LCBzZWVuID0ge307XG5cbiAgZGVmaW5lID0gZnVuY3Rpb24obmFtZSwgZGVwcywgY2FsbGJhY2spIHtcbiAgICByZWdpc3RyeVtuYW1lXSA9IHsgZGVwczogZGVwcywgY2FsbGJhY2s6IGNhbGxiYWNrIH07XG4gIH07XG5cbiAgcmVxdWlyZWpzID0gcmVxdWlyZSA9IHJlcXVpcmVNb2R1bGUgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJlcXVpcmVqcy5fZWFrX3NlZW4gPSByZWdpc3RyeTtcblxuICAgIGlmIChzZWVuW25hbWVdKSB7IHJldHVybiBzZWVuW25hbWVdOyB9XG4gICAgc2VlbltuYW1lXSA9IHt9O1xuXG4gICAgaWYgKCFyZWdpc3RyeVtuYW1lXSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGZpbmQgbW9kdWxlIFwiICsgbmFtZSk7XG4gICAgfVxuXG4gICAgdmFyIG1vZCA9IHJlZ2lzdHJ5W25hbWVdLFxuICAgICAgICBkZXBzID0gbW9kLmRlcHMsXG4gICAgICAgIGNhbGxiYWNrID0gbW9kLmNhbGxiYWNrLFxuICAgICAgICByZWlmaWVkID0gW10sXG4gICAgICAgIGV4cG9ydHM7XG5cbiAgICBmb3IgKHZhciBpPTAsIGw9ZGVwcy5sZW5ndGg7IGk8bDsgaSsrKSB7XG4gICAgICBpZiAoZGVwc1tpXSA9PT0gJ2V4cG9ydHMnKSB7XG4gICAgICAgIHJlaWZpZWQucHVzaChleHBvcnRzID0ge30pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVpZmllZC5wdXNoKHJlcXVpcmVNb2R1bGUocmVzb2x2ZShkZXBzW2ldKSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciB2YWx1ZSA9IGNhbGxiYWNrLmFwcGx5KHRoaXMsIHJlaWZpZWQpO1xuICAgIHJldHVybiBzZWVuW25hbWVdID0gZXhwb3J0cyB8fCB2YWx1ZTtcblxuICAgIGZ1bmN0aW9uIHJlc29sdmUoY2hpbGQpIHtcbiAgICAgIGlmIChjaGlsZC5jaGFyQXQoMCkgIT09ICcuJykgeyByZXR1cm4gY2hpbGQ7IH1cbiAgICAgIHZhciBwYXJ0cyA9IGNoaWxkLnNwbGl0KFwiL1wiKTtcbiAgICAgIHZhciBwYXJlbnRCYXNlID0gbmFtZS5zcGxpdChcIi9cIikuc2xpY2UoMCwgLTEpO1xuXG4gICAgICBmb3IgKHZhciBpPTAsIGw9cGFydHMubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICB2YXIgcGFydCA9IHBhcnRzW2ldO1xuXG4gICAgICAgIGlmIChwYXJ0ID09PSAnLi4nKSB7IHBhcmVudEJhc2UucG9wKCk7IH1cbiAgICAgICAgZWxzZSBpZiAocGFydCA9PT0gJy4nKSB7IGNvbnRpbnVlOyB9XG4gICAgICAgIGVsc2UgeyBwYXJlbnRCYXNlLnB1c2gocGFydCk7IH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBhcmVudEJhc2Uuam9pbihcIi9cIik7XG4gICAgfVxuICB9O1xufSkoKTtcblxuZGVmaW5lKFwicHJvbWlzZS9hbGxcIiwgXG4gIFtcIi4vdXRpbHNcIixcImV4cG9ydHNcIl0sXG4gIGZ1bmN0aW9uKF9fZGVwZW5kZW5jeTFfXywgX19leHBvcnRzX18pIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICAvKiBnbG9iYWwgdG9TdHJpbmcgKi9cblxuICAgIHZhciBpc0FycmF5ID0gX19kZXBlbmRlbmN5MV9fLmlzQXJyYXk7XG4gICAgdmFyIGlzRnVuY3Rpb24gPSBfX2RlcGVuZGVuY3kxX18uaXNGdW5jdGlvbjtcblxuICAgIC8qKlxuICAgICAgUmV0dXJucyBhIHByb21pc2UgdGhhdCBpcyBmdWxmaWxsZWQgd2hlbiBhbGwgdGhlIGdpdmVuIHByb21pc2VzIGhhdmUgYmVlblxuICAgICAgZnVsZmlsbGVkLCBvciByZWplY3RlZCBpZiBhbnkgb2YgdGhlbSBiZWNvbWUgcmVqZWN0ZWQuIFRoZSByZXR1cm4gcHJvbWlzZVxuICAgICAgaXMgZnVsZmlsbGVkIHdpdGggYW4gYXJyYXkgdGhhdCBnaXZlcyBhbGwgdGhlIHZhbHVlcyBpbiB0aGUgb3JkZXIgdGhleSB3ZXJlXG4gICAgICBwYXNzZWQgaW4gdGhlIGBwcm9taXNlc2AgYXJyYXkgYXJndW1lbnQuXG5cbiAgICAgIEV4YW1wbGU6XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIHZhciBwcm9taXNlMSA9IFJTVlAucmVzb2x2ZSgxKTtcbiAgICAgIHZhciBwcm9taXNlMiA9IFJTVlAucmVzb2x2ZSgyKTtcbiAgICAgIHZhciBwcm9taXNlMyA9IFJTVlAucmVzb2x2ZSgzKTtcbiAgICAgIHZhciBwcm9taXNlcyA9IFsgcHJvbWlzZTEsIHByb21pc2UyLCBwcm9taXNlMyBdO1xuXG4gICAgICBSU1ZQLmFsbChwcm9taXNlcykudGhlbihmdW5jdGlvbihhcnJheSl7XG4gICAgICAgIC8vIFRoZSBhcnJheSBoZXJlIHdvdWxkIGJlIFsgMSwgMiwgMyBdO1xuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgSWYgYW55IG9mIHRoZSBgcHJvbWlzZXNgIGdpdmVuIHRvIGBSU1ZQLmFsbGAgYXJlIHJlamVjdGVkLCB0aGUgZmlyc3QgcHJvbWlzZVxuICAgICAgdGhhdCBpcyByZWplY3RlZCB3aWxsIGJlIGdpdmVuIGFzIGFuIGFyZ3VtZW50IHRvIHRoZSByZXR1cm5lZCBwcm9taXNlcydzXG4gICAgICByZWplY3Rpb24gaGFuZGxlci4gRm9yIGV4YW1wbGU6XG5cbiAgICAgIEV4YW1wbGU6XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIHZhciBwcm9taXNlMSA9IFJTVlAucmVzb2x2ZSgxKTtcbiAgICAgIHZhciBwcm9taXNlMiA9IFJTVlAucmVqZWN0KG5ldyBFcnJvcihcIjJcIikpO1xuICAgICAgdmFyIHByb21pc2UzID0gUlNWUC5yZWplY3QobmV3IEVycm9yKFwiM1wiKSk7XG4gICAgICB2YXIgcHJvbWlzZXMgPSBbIHByb21pc2UxLCBwcm9taXNlMiwgcHJvbWlzZTMgXTtcblxuICAgICAgUlNWUC5hbGwocHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oYXJyYXkpe1xuICAgICAgICAvLyBDb2RlIGhlcmUgbmV2ZXIgcnVucyBiZWNhdXNlIHRoZXJlIGFyZSByZWplY3RlZCBwcm9taXNlcyFcbiAgICAgIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIC8vIGVycm9yLm1lc3NhZ2UgPT09IFwiMlwiXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBAbWV0aG9kIGFsbFxuICAgICAgQGZvciBSU1ZQXG4gICAgICBAcGFyYW0ge0FycmF5fSBwcm9taXNlc1xuICAgICAgQHBhcmFtIHtTdHJpbmd9IGxhYmVsXG4gICAgICBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlIHRoYXQgaXMgZnVsZmlsbGVkIHdoZW4gYWxsIGBwcm9taXNlc2AgaGF2ZSBiZWVuXG4gICAgICBmdWxmaWxsZWQsIG9yIHJlamVjdGVkIGlmIGFueSBvZiB0aGVtIGJlY29tZSByZWplY3RlZC5cbiAgICAqL1xuICAgIGZ1bmN0aW9uIGFsbChwcm9taXNlcykge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBQcm9taXNlID0gdGhpcztcblxuICAgICAgaWYgKCFpc0FycmF5KHByb21pc2VzKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGFuIGFycmF5IHRvIGFsbC4nKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdLCByZW1haW5pbmcgPSBwcm9taXNlcy5sZW5ndGgsXG4gICAgICAgIHByb21pc2U7XG5cbiAgICAgICAgaWYgKHJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgIHJlc29sdmUoW10pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcmVzb2x2ZXIoaW5kZXgpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIHJlc29sdmVBbGwoaW5kZXgsIHZhbHVlKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcmVzb2x2ZUFsbChpbmRleCwgdmFsdWUpIHtcbiAgICAgICAgICByZXN1bHRzW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICAgIGlmICgtLXJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHRzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb21pc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgcHJvbWlzZSA9IHByb21pc2VzW2ldO1xuXG4gICAgICAgICAgaWYgKHByb21pc2UgJiYgaXNGdW5jdGlvbihwcm9taXNlLnRoZW4pKSB7XG4gICAgICAgICAgICBwcm9taXNlLnRoZW4ocmVzb2x2ZXIoaSksIHJlamVjdCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc29sdmVBbGwoaSwgcHJvbWlzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBfX2V4cG9ydHNfXy5hbGwgPSBhbGw7XG4gIH0pO1xuZGVmaW5lKFwicHJvbWlzZS9hc2FwXCIsIFxuICBbXCJleHBvcnRzXCJdLFxuICBmdW5jdGlvbihfX2V4cG9ydHNfXykge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBicm93c2VyR2xvYmFsID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSA/IHdpbmRvdyA6IHt9O1xuICAgIHZhciBCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9IGJyb3dzZXJHbG9iYWwuTXV0YXRpb25PYnNlcnZlciB8fCBicm93c2VyR2xvYmFsLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7XG4gICAgdmFyIGxvY2FsID0gKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSA/IGdsb2JhbCA6ICh0aGlzID09PSB1bmRlZmluZWQ/IHdpbmRvdzp0aGlzKTtcblxuICAgIC8vIG5vZGVcbiAgICBmdW5jdGlvbiB1c2VOZXh0VGljaygpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgcHJvY2Vzcy5uZXh0VGljayhmbHVzaCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVzZU11dGF0aW9uT2JzZXJ2ZXIoKSB7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIoZmx1c2gpO1xuICAgICAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gICAgICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHsgY2hhcmFjdGVyRGF0YTogdHJ1ZSB9KTtcblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBub2RlLmRhdGEgPSAoaXRlcmF0aW9ucyA9ICsraXRlcmF0aW9ucyAlIDIpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1c2VTZXRUaW1lb3V0KCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBsb2NhbC5zZXRUaW1lb3V0KGZsdXNoLCAxKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIHF1ZXVlID0gW107XG4gICAgZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHF1ZXVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB0dXBsZSA9IHF1ZXVlW2ldO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSB0dXBsZVswXSwgYXJnID0gdHVwbGVbMV07XG4gICAgICAgIGNhbGxiYWNrKGFyZyk7XG4gICAgICB9XG4gICAgICBxdWV1ZSA9IFtdO1xuICAgIH1cblxuICAgIHZhciBzY2hlZHVsZUZsdXNoO1xuXG4gICAgLy8gRGVjaWRlIHdoYXQgYXN5bmMgbWV0aG9kIHRvIHVzZSB0byB0cmlnZ2VyaW5nIHByb2Nlc3Npbmcgb2YgcXVldWVkIGNhbGxiYWNrczpcbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHt9LnRvU3RyaW5nLmNhbGwocHJvY2VzcykgPT09ICdbb2JqZWN0IHByb2Nlc3NdJykge1xuICAgICAgc2NoZWR1bGVGbHVzaCA9IHVzZU5leHRUaWNrKCk7XG4gICAgfSBlbHNlIGlmIChCcm93c2VyTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgc2NoZWR1bGVGbHVzaCA9IHVzZU11dGF0aW9uT2JzZXJ2ZXIoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2NoZWR1bGVGbHVzaCA9IHVzZVNldFRpbWVvdXQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhc2FwKGNhbGxiYWNrLCBhcmcpIHtcbiAgICAgIHZhciBsZW5ndGggPSBxdWV1ZS5wdXNoKFtjYWxsYmFjaywgYXJnXSk7XG4gICAgICBpZiAobGVuZ3RoID09PSAxKSB7XG4gICAgICAgIC8vIElmIGxlbmd0aCBpcyAxLCB0aGF0IG1lYW5zIHRoYXQgd2UgbmVlZCB0byBzY2hlZHVsZSBhbiBhc3luYyBmbHVzaC5cbiAgICAgICAgLy8gSWYgYWRkaXRpb25hbCBjYWxsYmFja3MgYXJlIHF1ZXVlZCBiZWZvcmUgdGhlIHF1ZXVlIGlzIGZsdXNoZWQsIHRoZXlcbiAgICAgICAgLy8gd2lsbCBiZSBwcm9jZXNzZWQgYnkgdGhpcyBmbHVzaCB0aGF0IHdlIGFyZSBzY2hlZHVsaW5nLlxuICAgICAgICBzY2hlZHVsZUZsdXNoKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgX19leHBvcnRzX18uYXNhcCA9IGFzYXA7XG4gIH0pO1xuZGVmaW5lKFwicHJvbWlzZS9jb25maWdcIiwgXG4gIFtcImV4cG9ydHNcIl0sXG4gIGZ1bmN0aW9uKF9fZXhwb3J0c19fKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIGNvbmZpZyA9IHtcbiAgICAgIGluc3RydW1lbnQ6IGZhbHNlXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGNvbmZpZ3VyZShuYW1lLCB2YWx1ZSkge1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgY29uZmlnW25hbWVdID0gdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gY29uZmlnW25hbWVdO1xuICAgICAgfVxuICAgIH1cblxuICAgIF9fZXhwb3J0c19fLmNvbmZpZyA9IGNvbmZpZztcbiAgICBfX2V4cG9ydHNfXy5jb25maWd1cmUgPSBjb25maWd1cmU7XG4gIH0pO1xuZGVmaW5lKFwicHJvbWlzZS9wb2x5ZmlsbFwiLCBcbiAgW1wiLi9wcm9taXNlXCIsXCIuL3V0aWxzXCIsXCJleHBvcnRzXCJdLFxuICBmdW5jdGlvbihfX2RlcGVuZGVuY3kxX18sIF9fZGVwZW5kZW5jeTJfXywgX19leHBvcnRzX18pIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICAvKmdsb2JhbCBzZWxmKi9cbiAgICB2YXIgUlNWUFByb21pc2UgPSBfX2RlcGVuZGVuY3kxX18uUHJvbWlzZTtcbiAgICB2YXIgaXNGdW5jdGlvbiA9IF9fZGVwZW5kZW5jeTJfXy5pc0Z1bmN0aW9uO1xuXG4gICAgZnVuY3Rpb24gcG9seWZpbGwoKSB7XG4gICAgICB2YXIgbG9jYWw7XG5cbiAgICAgIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBsb2NhbCA9IGdsb2JhbDtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmRvY3VtZW50KSB7XG4gICAgICAgIGxvY2FsID0gd2luZG93O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbG9jYWwgPSBzZWxmO1xuICAgICAgfVxuXG4gICAgICB2YXIgZXM2UHJvbWlzZVN1cHBvcnQgPSBcbiAgICAgICAgXCJQcm9taXNlXCIgaW4gbG9jYWwgJiZcbiAgICAgICAgLy8gU29tZSBvZiB0aGVzZSBtZXRob2RzIGFyZSBtaXNzaW5nIGZyb21cbiAgICAgICAgLy8gRmlyZWZveC9DaHJvbWUgZXhwZXJpbWVudGFsIGltcGxlbWVudGF0aW9uc1xuICAgICAgICBcInJlc29sdmVcIiBpbiBsb2NhbC5Qcm9taXNlICYmXG4gICAgICAgIFwicmVqZWN0XCIgaW4gbG9jYWwuUHJvbWlzZSAmJlxuICAgICAgICBcImFsbFwiIGluIGxvY2FsLlByb21pc2UgJiZcbiAgICAgICAgXCJyYWNlXCIgaW4gbG9jYWwuUHJvbWlzZSAmJlxuICAgICAgICAvLyBPbGRlciB2ZXJzaW9uIG9mIHRoZSBzcGVjIGhhZCBhIHJlc29sdmVyIG9iamVjdFxuICAgICAgICAvLyBhcyB0aGUgYXJnIHJhdGhlciB0aGFuIGEgZnVuY3Rpb25cbiAgICAgICAgKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciByZXNvbHZlO1xuICAgICAgICAgIG5ldyBsb2NhbC5Qcm9taXNlKGZ1bmN0aW9uKHIpIHsgcmVzb2x2ZSA9IHI7IH0pO1xuICAgICAgICAgIHJldHVybiBpc0Z1bmN0aW9uKHJlc29sdmUpO1xuICAgICAgICB9KCkpO1xuXG4gICAgICBpZiAoIWVzNlByb21pc2VTdXBwb3J0KSB7XG4gICAgICAgIGxvY2FsLlByb21pc2UgPSBSU1ZQUHJvbWlzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBfX2V4cG9ydHNfXy5wb2x5ZmlsbCA9IHBvbHlmaWxsO1xuICB9KTtcbmRlZmluZShcInByb21pc2UvcHJvbWlzZVwiLCBcbiAgW1wiLi9jb25maWdcIixcIi4vdXRpbHNcIixcIi4vYWxsXCIsXCIuL3JhY2VcIixcIi4vcmVzb2x2ZVwiLFwiLi9yZWplY3RcIixcIi4vYXNhcFwiLFwiZXhwb3J0c1wiXSxcbiAgZnVuY3Rpb24oX19kZXBlbmRlbmN5MV9fLCBfX2RlcGVuZGVuY3kyX18sIF9fZGVwZW5kZW5jeTNfXywgX19kZXBlbmRlbmN5NF9fLCBfX2RlcGVuZGVuY3k1X18sIF9fZGVwZW5kZW5jeTZfXywgX19kZXBlbmRlbmN5N19fLCBfX2V4cG9ydHNfXykge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBjb25maWcgPSBfX2RlcGVuZGVuY3kxX18uY29uZmlnO1xuICAgIHZhciBjb25maWd1cmUgPSBfX2RlcGVuZGVuY3kxX18uY29uZmlndXJlO1xuICAgIHZhciBvYmplY3RPckZ1bmN0aW9uID0gX19kZXBlbmRlbmN5Ml9fLm9iamVjdE9yRnVuY3Rpb247XG4gICAgdmFyIGlzRnVuY3Rpb24gPSBfX2RlcGVuZGVuY3kyX18uaXNGdW5jdGlvbjtcbiAgICB2YXIgbm93ID0gX19kZXBlbmRlbmN5Ml9fLm5vdztcbiAgICB2YXIgYWxsID0gX19kZXBlbmRlbmN5M19fLmFsbDtcbiAgICB2YXIgcmFjZSA9IF9fZGVwZW5kZW5jeTRfXy5yYWNlO1xuICAgIHZhciBzdGF0aWNSZXNvbHZlID0gX19kZXBlbmRlbmN5NV9fLnJlc29sdmU7XG4gICAgdmFyIHN0YXRpY1JlamVjdCA9IF9fZGVwZW5kZW5jeTZfXy5yZWplY3Q7XG4gICAgdmFyIGFzYXAgPSBfX2RlcGVuZGVuY3k3X18uYXNhcDtcblxuICAgIHZhciBjb3VudGVyID0gMDtcblxuICAgIGNvbmZpZy5hc3luYyA9IGFzYXA7IC8vIGRlZmF1bHQgYXN5bmMgaXMgYXNhcDtcblxuICAgIGZ1bmN0aW9uIFByb21pc2UocmVzb2x2ZXIpIHtcbiAgICAgIGlmICghaXNGdW5jdGlvbihyZXNvbHZlcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhIHJlc29sdmVyIGZ1bmN0aW9uIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvcicpO1xuICAgICAgfVxuXG4gICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUHJvbWlzZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZhaWxlZCB0byBjb25zdHJ1Y3QgJ1Byb21pc2UnOiBQbGVhc2UgdXNlIHRoZSAnbmV3JyBvcGVyYXRvciwgdGhpcyBvYmplY3QgY29uc3RydWN0b3IgY2Fubm90IGJlIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLlwiKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fc3Vic2NyaWJlcnMgPSBbXTtcblxuICAgICAgaW52b2tlUmVzb2x2ZXIocmVzb2x2ZXIsIHRoaXMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGludm9rZVJlc29sdmVyKHJlc29sdmVyLCBwcm9taXNlKSB7XG4gICAgICBmdW5jdGlvbiByZXNvbHZlUHJvbWlzZSh2YWx1ZSkge1xuICAgICAgICByZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcmVqZWN0UHJvbWlzZShyZWFzb24pIHtcbiAgICAgICAgcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc29sdmVyKHJlc29sdmVQcm9taXNlLCByZWplY3RQcm9taXNlKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICByZWplY3RQcm9taXNlKGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGludm9rZUNhbGxiYWNrKHNldHRsZWQsIHByb21pc2UsIGNhbGxiYWNrLCBkZXRhaWwpIHtcbiAgICAgIHZhciBoYXNDYWxsYmFjayA9IGlzRnVuY3Rpb24oY2FsbGJhY2spLFxuICAgICAgICAgIHZhbHVlLCBlcnJvciwgc3VjY2VlZGVkLCBmYWlsZWQ7XG5cbiAgICAgIGlmIChoYXNDYWxsYmFjaykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHZhbHVlID0gY2FsbGJhY2soZGV0YWlsKTtcbiAgICAgICAgICBzdWNjZWVkZWQgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICBmYWlsZWQgPSB0cnVlO1xuICAgICAgICAgIGVycm9yID0gZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBkZXRhaWw7XG4gICAgICAgIHN1Y2NlZWRlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChoYW5kbGVUaGVuYWJsZShwcm9taXNlLCB2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIGlmIChoYXNDYWxsYmFjayAmJiBzdWNjZWVkZWQpIHtcbiAgICAgICAgcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9IGVsc2UgaWYgKGZhaWxlZCkge1xuICAgICAgICByZWplY3QocHJvbWlzZSwgZXJyb3IpO1xuICAgICAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBGVUxGSUxMRUQpIHtcbiAgICAgICAgcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9IGVsc2UgaWYgKHNldHRsZWQgPT09IFJFSkVDVEVEKSB7XG4gICAgICAgIHJlamVjdChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIFBFTkRJTkcgICA9IHZvaWQgMDtcbiAgICB2YXIgU0VBTEVEICAgID0gMDtcbiAgICB2YXIgRlVMRklMTEVEID0gMTtcbiAgICB2YXIgUkVKRUNURUQgID0gMjtcblxuICAgIGZ1bmN0aW9uIHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICAgICAgdmFyIHN1YnNjcmliZXJzID0gcGFyZW50Ll9zdWJzY3JpYmVycztcbiAgICAgIHZhciBsZW5ndGggPSBzdWJzY3JpYmVycy5sZW5ndGg7XG5cbiAgICAgIHN1YnNjcmliZXJzW2xlbmd0aF0gPSBjaGlsZDtcbiAgICAgIHN1YnNjcmliZXJzW2xlbmd0aCArIEZVTEZJTExFRF0gPSBvbkZ1bGZpbGxtZW50O1xuICAgICAgc3Vic2NyaWJlcnNbbGVuZ3RoICsgUkVKRUNURURdICA9IG9uUmVqZWN0aW9uO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHB1Ymxpc2gocHJvbWlzZSwgc2V0dGxlZCkge1xuICAgICAgdmFyIGNoaWxkLCBjYWxsYmFjaywgc3Vic2NyaWJlcnMgPSBwcm9taXNlLl9zdWJzY3JpYmVycywgZGV0YWlsID0gcHJvbWlzZS5fZGV0YWlsO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1YnNjcmliZXJzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgIGNoaWxkID0gc3Vic2NyaWJlcnNbaV07XG4gICAgICAgIGNhbGxiYWNrID0gc3Vic2NyaWJlcnNbaSArIHNldHRsZWRdO1xuXG4gICAgICAgIGludm9rZUNhbGxiYWNrKHNldHRsZWQsIGNoaWxkLCBjYWxsYmFjaywgZGV0YWlsKTtcbiAgICAgIH1cblxuICAgICAgcHJvbWlzZS5fc3Vic2NyaWJlcnMgPSBudWxsO1xuICAgIH1cblxuICAgIFByb21pc2UucHJvdG90eXBlID0ge1xuICAgICAgY29uc3RydWN0b3I6IFByb21pc2UsXG5cbiAgICAgIF9zdGF0ZTogdW5kZWZpbmVkLFxuICAgICAgX2RldGFpbDogdW5kZWZpbmVkLFxuICAgICAgX3N1YnNjcmliZXJzOiB1bmRlZmluZWQsXG5cbiAgICAgIHRoZW46IGZ1bmN0aW9uKG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKSB7XG4gICAgICAgIHZhciBwcm9taXNlID0gdGhpcztcblxuICAgICAgICB2YXIgdGhlblByb21pc2UgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihmdW5jdGlvbigpIHt9KTtcblxuICAgICAgICBpZiAodGhpcy5fc3RhdGUpIHtcbiAgICAgICAgICB2YXIgY2FsbGJhY2tzID0gYXJndW1lbnRzO1xuICAgICAgICAgIGNvbmZpZy5hc3luYyhmdW5jdGlvbiBpbnZva2VQcm9taXNlQ2FsbGJhY2soKSB7XG4gICAgICAgICAgICBpbnZva2VDYWxsYmFjayhwcm9taXNlLl9zdGF0ZSwgdGhlblByb21pc2UsIGNhbGxiYWNrc1twcm9taXNlLl9zdGF0ZSAtIDFdLCBwcm9taXNlLl9kZXRhaWwpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN1YnNjcmliZSh0aGlzLCB0aGVuUHJvbWlzZSwgb25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoZW5Qcm9taXNlO1xuICAgICAgfSxcblxuICAgICAgJ2NhdGNoJzogZnVuY3Rpb24ob25SZWplY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGhlbihudWxsLCBvblJlamVjdGlvbik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIFByb21pc2UuYWxsID0gYWxsO1xuICAgIFByb21pc2UucmFjZSA9IHJhY2U7XG4gICAgUHJvbWlzZS5yZXNvbHZlID0gc3RhdGljUmVzb2x2ZTtcbiAgICBQcm9taXNlLnJlamVjdCA9IHN0YXRpY1JlamVjdDtcblxuICAgIGZ1bmN0aW9uIGhhbmRsZVRoZW5hYmxlKHByb21pc2UsIHZhbHVlKSB7XG4gICAgICB2YXIgdGhlbiA9IG51bGwsXG4gICAgICByZXNvbHZlZDtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkEgcHJvbWlzZXMgY2FsbGJhY2sgY2Fubm90IHJldHVybiB0aGF0IHNhbWUgcHJvbWlzZS5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob2JqZWN0T3JGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgICAgICB0aGVuID0gdmFsdWUudGhlbjtcblxuICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHRoZW4pKSB7XG4gICAgICAgICAgICB0aGVuLmNhbGwodmFsdWUsIGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICAgICAgICBpZiAocmVzb2x2ZWQpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgICAgcmVzb2x2ZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdmFsKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShwcm9taXNlLCB2YWwpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZ1bGZpbGwocHJvbWlzZSwgdmFsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24odmFsKSB7XG4gICAgICAgICAgICAgIGlmIChyZXNvbHZlZCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgICByZXNvbHZlZCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgcmVqZWN0KHByb21pc2UsIHZhbCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBpZiAocmVzb2x2ZWQpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXNvbHZlKHByb21pc2UsIHZhbHVlKSB7XG4gICAgICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9IGVsc2UgaWYgKCFoYW5kbGVUaGVuYWJsZShwcm9taXNlLCB2YWx1ZSkpIHtcbiAgICAgICAgZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZnVsZmlsbChwcm9taXNlLCB2YWx1ZSkge1xuICAgICAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBQRU5ESU5HKSB7IHJldHVybjsgfVxuICAgICAgcHJvbWlzZS5fc3RhdGUgPSBTRUFMRUQ7XG4gICAgICBwcm9taXNlLl9kZXRhaWwgPSB2YWx1ZTtcblxuICAgICAgY29uZmlnLmFzeW5jKHB1Ymxpc2hGdWxmaWxsbWVudCwgcHJvbWlzZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVqZWN0KHByb21pc2UsIHJlYXNvbikge1xuICAgICAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBQRU5ESU5HKSB7IHJldHVybjsgfVxuICAgICAgcHJvbWlzZS5fc3RhdGUgPSBTRUFMRUQ7XG4gICAgICBwcm9taXNlLl9kZXRhaWwgPSByZWFzb247XG5cbiAgICAgIGNvbmZpZy5hc3luYyhwdWJsaXNoUmVqZWN0aW9uLCBwcm9taXNlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwdWJsaXNoRnVsZmlsbG1lbnQocHJvbWlzZSkge1xuICAgICAgcHVibGlzaChwcm9taXNlLCBwcm9taXNlLl9zdGF0ZSA9IEZVTEZJTExFRCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHVibGlzaFJlamVjdGlvbihwcm9taXNlKSB7XG4gICAgICBwdWJsaXNoKHByb21pc2UsIHByb21pc2UuX3N0YXRlID0gUkVKRUNURUQpO1xuICAgIH1cblxuICAgIF9fZXhwb3J0c19fLlByb21pc2UgPSBQcm9taXNlO1xuICB9KTtcbmRlZmluZShcInByb21pc2UvcmFjZVwiLCBcbiAgW1wiLi91dGlsc1wiLFwiZXhwb3J0c1wiXSxcbiAgZnVuY3Rpb24oX19kZXBlbmRlbmN5MV9fLCBfX2V4cG9ydHNfXykge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIC8qIGdsb2JhbCB0b1N0cmluZyAqL1xuICAgIHZhciBpc0FycmF5ID0gX19kZXBlbmRlbmN5MV9fLmlzQXJyYXk7XG5cbiAgICAvKipcbiAgICAgIGBSU1ZQLnJhY2VgIGFsbG93cyB5b3UgdG8gd2F0Y2ggYSBzZXJpZXMgb2YgcHJvbWlzZXMgYW5kIGFjdCBhcyBzb29uIGFzIHRoZVxuICAgICAgZmlyc3QgcHJvbWlzZSBnaXZlbiB0byB0aGUgYHByb21pc2VzYCBhcmd1bWVudCBmdWxmaWxscyBvciByZWplY3RzLlxuXG4gICAgICBFeGFtcGxlOlxuXG4gICAgICBgYGBqYXZhc2NyaXB0XG4gICAgICB2YXIgcHJvbWlzZTEgPSBuZXcgUlNWUC5Qcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICByZXNvbHZlKFwicHJvbWlzZSAxXCIpO1xuICAgICAgICB9LCAyMDApO1xuICAgICAgfSk7XG5cbiAgICAgIHZhciBwcm9taXNlMiA9IG5ldyBSU1ZQLlByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgIHJlc29sdmUoXCJwcm9taXNlIDJcIik7XG4gICAgICAgIH0sIDEwMCk7XG4gICAgICB9KTtcblxuICAgICAgUlNWUC5yYWNlKFtwcm9taXNlMSwgcHJvbWlzZTJdKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgICAgIC8vIHJlc3VsdCA9PT0gXCJwcm9taXNlIDJcIiBiZWNhdXNlIGl0IHdhcyByZXNvbHZlZCBiZWZvcmUgcHJvbWlzZTFcbiAgICAgICAgLy8gd2FzIHJlc29sdmVkLlxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgYFJTVlAucmFjZWAgaXMgZGV0ZXJtaW5pc3RpYyBpbiB0aGF0IG9ubHkgdGhlIHN0YXRlIG9mIHRoZSBmaXJzdCBjb21wbGV0ZWRcbiAgICAgIHByb21pc2UgbWF0dGVycy4gRm9yIGV4YW1wbGUsIGV2ZW4gaWYgb3RoZXIgcHJvbWlzZXMgZ2l2ZW4gdG8gdGhlIGBwcm9taXNlc2BcbiAgICAgIGFycmF5IGFyZ3VtZW50IGFyZSByZXNvbHZlZCwgYnV0IHRoZSBmaXJzdCBjb21wbGV0ZWQgcHJvbWlzZSBoYXMgYmVjb21lXG4gICAgICByZWplY3RlZCBiZWZvcmUgdGhlIG90aGVyIHByb21pc2VzIGJlY2FtZSBmdWxmaWxsZWQsIHRoZSByZXR1cm5lZCBwcm9taXNlXG4gICAgICB3aWxsIGJlY29tZSByZWplY3RlZDpcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgdmFyIHByb21pc2UxID0gbmV3IFJTVlAuUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgcmVzb2x2ZShcInByb21pc2UgMVwiKTtcbiAgICAgICAgfSwgMjAwKTtcbiAgICAgIH0pO1xuXG4gICAgICB2YXIgcHJvbWlzZTIgPSBuZXcgUlNWUC5Qcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwicHJvbWlzZSAyXCIpKTtcbiAgICAgICAgfSwgMTAwKTtcbiAgICAgIH0pO1xuXG4gICAgICBSU1ZQLnJhY2UoW3Byb21pc2UxLCBwcm9taXNlMl0pLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtcbiAgICAgICAgLy8gQ29kZSBoZXJlIG5ldmVyIHJ1bnMgYmVjYXVzZSB0aGVyZSBhcmUgcmVqZWN0ZWQgcHJvbWlzZXMhXG4gICAgICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgICAgICAvLyByZWFzb24ubWVzc2FnZSA9PT0gXCJwcm9taXNlMlwiIGJlY2F1c2UgcHJvbWlzZSAyIGJlY2FtZSByZWplY3RlZCBiZWZvcmVcbiAgICAgICAgLy8gcHJvbWlzZSAxIGJlY2FtZSBmdWxmaWxsZWRcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEBtZXRob2QgcmFjZVxuICAgICAgQGZvciBSU1ZQXG4gICAgICBAcGFyYW0ge0FycmF5fSBwcm9taXNlcyBhcnJheSBvZiBwcm9taXNlcyB0byBvYnNlcnZlXG4gICAgICBAcGFyYW0ge1N0cmluZ30gbGFiZWwgb3B0aW9uYWwgc3RyaW5nIGZvciBkZXNjcmliaW5nIHRoZSBwcm9taXNlIHJldHVybmVkLlxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQHJldHVybiB7UHJvbWlzZX0gYSBwcm9taXNlIHRoYXQgYmVjb21lcyBmdWxmaWxsZWQgd2l0aCB0aGUgdmFsdWUgdGhlIGZpcnN0XG4gICAgICBjb21wbGV0ZWQgcHJvbWlzZXMgaXMgcmVzb2x2ZWQgd2l0aCBpZiB0aGUgZmlyc3QgY29tcGxldGVkIHByb21pc2Ugd2FzXG4gICAgICBmdWxmaWxsZWQsIG9yIHJlamVjdGVkIHdpdGggdGhlIHJlYXNvbiB0aGF0IHRoZSBmaXJzdCBjb21wbGV0ZWQgcHJvbWlzZVxuICAgICAgd2FzIHJlamVjdGVkIHdpdGguXG4gICAgKi9cbiAgICBmdW5jdGlvbiByYWNlKHByb21pc2VzKSB7XG4gICAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgICAgdmFyIFByb21pc2UgPSB0aGlzO1xuXG4gICAgICBpZiAoIWlzQXJyYXkocHJvbWlzZXMpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYW4gYXJyYXkgdG8gcmFjZS4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXSwgcHJvbWlzZTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb21pc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgcHJvbWlzZSA9IHByb21pc2VzW2ldO1xuXG4gICAgICAgICAgaWYgKHByb21pc2UgJiYgdHlwZW9mIHByb21pc2UudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcHJvbWlzZS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc29sdmUocHJvbWlzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBfX2V4cG9ydHNfXy5yYWNlID0gcmFjZTtcbiAgfSk7XG5kZWZpbmUoXCJwcm9taXNlL3JlamVjdFwiLCBcbiAgW1wiZXhwb3J0c1wiXSxcbiAgZnVuY3Rpb24oX19leHBvcnRzX18pIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICAvKipcbiAgICAgIGBSU1ZQLnJlamVjdGAgcmV0dXJucyBhIHByb21pc2UgdGhhdCB3aWxsIGJlY29tZSByZWplY3RlZCB3aXRoIHRoZSBwYXNzZWRcbiAgICAgIGByZWFzb25gLiBgUlNWUC5yZWplY3RgIGlzIGVzc2VudGlhbGx5IHNob3J0aGFuZCBmb3IgdGhlIGZvbGxvd2luZzpcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgdmFyIHByb21pc2UgPSBuZXcgUlNWUC5Qcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1dIT09QUycpKTtcbiAgICAgIH0pO1xuXG4gICAgICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgICAgICAvLyBDb2RlIGhlcmUgZG9lc24ndCBydW4gYmVjYXVzZSB0aGUgcHJvbWlzZSBpcyByZWplY3RlZCFcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSAnV0hPT1BTJ1xuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgSW5zdGVhZCBvZiB3cml0aW5nIHRoZSBhYm92ZSwgeW91ciBjb2RlIG5vdyBzaW1wbHkgYmVjb21lcyB0aGUgZm9sbG93aW5nOlxuXG4gICAgICBgYGBqYXZhc2NyaXB0XG4gICAgICB2YXIgcHJvbWlzZSA9IFJTVlAucmVqZWN0KG5ldyBFcnJvcignV0hPT1BTJykpO1xuXG4gICAgICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgICAgICAvLyBDb2RlIGhlcmUgZG9lc24ndCBydW4gYmVjYXVzZSB0aGUgcHJvbWlzZSBpcyByZWplY3RlZCFcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSAnV0hPT1BTJ1xuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQG1ldGhvZCByZWplY3RcbiAgICAgIEBmb3IgUlNWUFxuICAgICAgQHBhcmFtIHtBbnl9IHJlYXNvbiB2YWx1ZSB0aGF0IHRoZSByZXR1cm5lZCBwcm9taXNlIHdpbGwgYmUgcmVqZWN0ZWQgd2l0aC5cbiAgICAgIEBwYXJhbSB7U3RyaW5nfSBsYWJlbCBvcHRpb25hbCBzdHJpbmcgZm9yIGlkZW50aWZ5aW5nIHRoZSByZXR1cm5lZCBwcm9taXNlLlxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQHJldHVybiB7UHJvbWlzZX0gYSBwcm9taXNlIHRoYXQgd2lsbCBiZWNvbWUgcmVqZWN0ZWQgd2l0aCB0aGUgZ2l2ZW5cbiAgICAgIGByZWFzb25gLlxuICAgICovXG4gICAgZnVuY3Rpb24gcmVqZWN0KHJlYXNvbikge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBQcm9taXNlID0gdGhpcztcblxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgcmVqZWN0KHJlYXNvbik7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBfX2V4cG9ydHNfXy5yZWplY3QgPSByZWplY3Q7XG4gIH0pO1xuZGVmaW5lKFwicHJvbWlzZS9yZXNvbHZlXCIsIFxuICBbXCJleHBvcnRzXCJdLFxuICBmdW5jdGlvbihfX2V4cG9ydHNfXykge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIGZ1bmN0aW9uIHJlc29sdmUodmFsdWUpIHtcbiAgICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZS5jb25zdHJ1Y3RvciA9PT0gdGhpcykge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG5cbiAgICAgIHZhciBQcm9taXNlID0gdGhpcztcblxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgICAgcmVzb2x2ZSh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBfX2V4cG9ydHNfXy5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgfSk7XG5kZWZpbmUoXCJwcm9taXNlL3V0aWxzXCIsIFxuICBbXCJleHBvcnRzXCJdLFxuICBmdW5jdGlvbihfX2V4cG9ydHNfXykge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIGZ1bmN0aW9uIG9iamVjdE9yRnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIGlzRnVuY3Rpb24oeCkgfHwgKHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmIHggIT09IG51bGwpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSBcImZ1bmN0aW9uXCI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNBcnJheSh4KSB7XG4gICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHgpID09PSBcIltvYmplY3QgQXJyYXldXCI7XG4gICAgfVxuXG4gICAgLy8gRGF0ZS5ub3cgaXMgbm90IGF2YWlsYWJsZSBpbiBicm93c2VycyA8IElFOVxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0RhdGUvbm93I0NvbXBhdGliaWxpdHlcbiAgICB2YXIgbm93ID0gRGF0ZS5ub3cgfHwgZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTsgfTtcblxuXG4gICAgX19leHBvcnRzX18ub2JqZWN0T3JGdW5jdGlvbiA9IG9iamVjdE9yRnVuY3Rpb247XG4gICAgX19leHBvcnRzX18uaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG4gICAgX19leHBvcnRzX18uaXNBcnJheSA9IGlzQXJyYXk7XG4gICAgX19leHBvcnRzX18ubm93ID0gbm93O1xuICB9KTtcbnJlcXVpcmVNb2R1bGUoJ3Byb21pc2UvcG9seWZpbGwnKS5wb2x5ZmlsbCgpO1xufSgpKTsoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJsb2NhbGZvcmFnZVwiXSA9IGZhY3RvcnkoKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJsb2NhbGZvcmFnZVwiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsIGZ1bmN0aW9uKCkge1xucmV0dXJuIC8qKioqKiovIChmdW5jdGlvbihtb2R1bGVzKSB7IC8vIHdlYnBhY2tCb290c3RyYXBcbi8qKioqKiovIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuLyoqKioqKi8gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4vKioqKioqLyBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4vKioqKioqLyBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuLyoqKioqKi8gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuLyoqKioqKi8gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuLyoqKioqKi8gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbi8qKioqKiovIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuLyoqKioqKi8gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbi8qKioqKiovIFx0XHRcdGV4cG9ydHM6IHt9LFxuLyoqKioqKi8gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuLyoqKioqKi8gXHRcdFx0bG9hZGVkOiBmYWxzZVxuLyoqKioqKi8gXHRcdH07XG5cbi8qKioqKiovIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbi8qKioqKiovIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuLyoqKioqKi8gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbi8qKioqKiovIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuLyoqKioqKi8gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4vKioqKioqLyBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuLyoqKioqKi8gXHR9XG5cblxuLyoqKioqKi8gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4vKioqKioqLyBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbi8qKioqKiovIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuLyoqKioqKi8gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8qKioqKiovIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG4vKioqKioqLyB9KVxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKioqKiovIChbXG4vKiAwICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0ZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuXHRmdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuXHQoZnVuY3Rpb24gKCkge1xuXHQgICAgJ3VzZSBzdHJpY3QnO1xuXG5cdCAgICAvLyBDdXN0b20gZHJpdmVycyBhcmUgc3RvcmVkIGhlcmUgd2hlbiBgZGVmaW5lRHJpdmVyKClgIGlzIGNhbGxlZC5cblx0ICAgIC8vIFRoZXkgYXJlIHNoYXJlZCBhY3Jvc3MgYWxsIGluc3RhbmNlcyBvZiBsb2NhbEZvcmFnZS5cblx0ICAgIHZhciBDdXN0b21Ecml2ZXJzID0ge307XG5cblx0ICAgIHZhciBEcml2ZXJUeXBlID0ge1xuXHQgICAgICAgIElOREVYRUREQjogJ2FzeW5jU3RvcmFnZScsXG5cdCAgICAgICAgTE9DQUxTVE9SQUdFOiAnbG9jYWxTdG9yYWdlV3JhcHBlcicsXG5cdCAgICAgICAgV0VCU1FMOiAnd2ViU1FMU3RvcmFnZSdcblx0ICAgIH07XG5cblx0ICAgIHZhciBEZWZhdWx0RHJpdmVyT3JkZXIgPSBbRHJpdmVyVHlwZS5JTkRFWEVEREIsIERyaXZlclR5cGUuV0VCU1FMLCBEcml2ZXJUeXBlLkxPQ0FMU1RPUkFHRV07XG5cblx0ICAgIHZhciBMaWJyYXJ5TWV0aG9kcyA9IFsnY2xlYXInLCAnZ2V0SXRlbScsICdpdGVyYXRlJywgJ2tleScsICdrZXlzJywgJ2xlbmd0aCcsICdyZW1vdmVJdGVtJywgJ3NldEl0ZW0nXTtcblxuXHQgICAgdmFyIERlZmF1bHRDb25maWcgPSB7XG5cdCAgICAgICAgZGVzY3JpcHRpb246ICcnLFxuXHQgICAgICAgIGRyaXZlcjogRGVmYXVsdERyaXZlck9yZGVyLnNsaWNlKCksXG5cdCAgICAgICAgbmFtZTogJ2xvY2FsZm9yYWdlJyxcblx0ICAgICAgICAvLyBEZWZhdWx0IERCIHNpemUgaXMgX0pVU1QgVU5ERVJfIDVNQiwgYXMgaXQncyB0aGUgaGlnaGVzdCBzaXplXG5cdCAgICAgICAgLy8gd2UgY2FuIHVzZSB3aXRob3V0IGEgcHJvbXB0LlxuXHQgICAgICAgIHNpemU6IDQ5ODA3MzYsXG5cdCAgICAgICAgc3RvcmVOYW1lOiAna2V5dmFsdWVwYWlycycsXG5cdCAgICAgICAgdmVyc2lvbjogMS4wXG5cdCAgICB9O1xuXG5cdCAgICAvLyBDaGVjayB0byBzZWUgaWYgSW5kZXhlZERCIGlzIGF2YWlsYWJsZSBhbmQgaWYgaXQgaXMgdGhlIGxhdGVzdFxuXHQgICAgLy8gaW1wbGVtZW50YXRpb247IGl0J3Mgb3VyIHByZWZlcnJlZCBiYWNrZW5kIGxpYnJhcnkuIFdlIHVzZSBcIl9zcGVjX3Rlc3RcIlxuXHQgICAgLy8gYXMgdGhlIG5hbWUgb2YgdGhlIGRhdGFiYXNlIGJlY2F1c2UgaXQncyBub3QgdGhlIG9uZSB3ZSdsbCBvcGVyYXRlIG9uLFxuXHQgICAgLy8gYnV0IGl0J3MgdXNlZnVsIHRvIG1ha2Ugc3VyZSBpdHMgdXNpbmcgdGhlIHJpZ2h0IHNwZWMuXG5cdCAgICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9tb3ppbGxhL2xvY2FsRm9yYWdlL2lzc3Vlcy8xMjhcblx0ICAgIHZhciBkcml2ZXJTdXBwb3J0ID0gKGZ1bmN0aW9uIChzZWxmKSB7XG5cdCAgICAgICAgLy8gSW5pdGlhbGl6ZSBJbmRleGVkREI7IGZhbGwgYmFjayB0byB2ZW5kb3ItcHJlZml4ZWQgdmVyc2lvbnNcblx0ICAgICAgICAvLyBpZiBuZWVkZWQuXG5cdCAgICAgICAgdmFyIGluZGV4ZWREQiA9IGluZGV4ZWREQiB8fCBzZWxmLmluZGV4ZWREQiB8fCBzZWxmLndlYmtpdEluZGV4ZWREQiB8fCBzZWxmLm1vekluZGV4ZWREQiB8fCBzZWxmLk9JbmRleGVkREIgfHwgc2VsZi5tc0luZGV4ZWREQjtcblxuXHQgICAgICAgIHZhciByZXN1bHQgPSB7fTtcblxuXHQgICAgICAgIHJlc3VsdFtEcml2ZXJUeXBlLldFQlNRTF0gPSAhIXNlbGYub3BlbkRhdGFiYXNlO1xuXHQgICAgICAgIHJlc3VsdFtEcml2ZXJUeXBlLklOREVYRUREQl0gPSAhIShmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIC8vIFdlIG1pbWljIFBvdWNoREIgaGVyZTsganVzdCBVQSB0ZXN0IGZvciBTYWZhcmkgKHdoaWNoLCBhcyBvZlxuXHQgICAgICAgICAgICAvLyBpT1MgOC9Zb3NlbWl0ZSwgZG9lc24ndCBwcm9wZXJseSBzdXBwb3J0IEluZGV4ZWREQikuXG5cdCAgICAgICAgICAgIC8vIEluZGV4ZWREQiBzdXBwb3J0IGlzIGJyb2tlbiBhbmQgZGlmZmVyZW50IGZyb20gQmxpbmsncy5cblx0ICAgICAgICAgICAgLy8gVGhpcyBpcyBmYXN0ZXIgdGhhbiB0aGUgdGVzdCBjYXNlIChhbmQgaXQncyBzeW5jKSwgc28gd2UganVzdFxuXHQgICAgICAgICAgICAvLyBkbyB0aGlzLiAqU0lHSCpcblx0ICAgICAgICAgICAgLy8gaHR0cDovL2JsLm9ja3Mub3JnL25vbGFubGF3c29uL3Jhdy9jODNlOTAzOWVkZjIyNzgwNDdlOS9cblx0ICAgICAgICAgICAgLy9cblx0ICAgICAgICAgICAgLy8gV2UgdGVzdCBmb3Igb3BlbkRhdGFiYXNlIGJlY2F1c2UgSUUgTW9iaWxlIGlkZW50aWZpZXMgaXRzZWxmXG5cdCAgICAgICAgICAgIC8vIGFzIFNhZmFyaS4gT2ggdGhlIGx1bHouLi5cblx0ICAgICAgICAgICAgaWYgKHR5cGVvZiBzZWxmLm9wZW5EYXRhYmFzZSAhPT0gJ3VuZGVmaW5lZCcgJiYgc2VsZi5uYXZpZ2F0b3IgJiYgc2VsZi5uYXZpZ2F0b3IudXNlckFnZW50ICYmIC9TYWZhcmkvLnRlc3Qoc2VsZi5uYXZpZ2F0b3IudXNlckFnZW50KSAmJiAhL0Nocm9tZS8udGVzdChzZWxmLm5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBpbmRleGVkREIgJiYgdHlwZW9mIGluZGV4ZWREQi5vcGVuID09PSAnZnVuY3Rpb24nICYmXG5cdCAgICAgICAgICAgICAgICAvLyBTb21lIFNhbXN1bmcvSFRDIEFuZHJvaWQgNC4wLTQuMyBkZXZpY2VzXG5cdCAgICAgICAgICAgICAgICAvLyBoYXZlIG9sZGVyIEluZGV4ZWREQiBzcGVjczsgaWYgdGhpcyBpc24ndCBhdmFpbGFibGVcblx0ICAgICAgICAgICAgICAgIC8vIHRoZWlyIEluZGV4ZWREQiBpcyB0b28gb2xkIGZvciB1cyB0byB1c2UuXG5cdCAgICAgICAgICAgICAgICAvLyAoUmVwbGFjZXMgdGhlIG9udXBncmFkZW5lZWRlZCB0ZXN0Lilcblx0ICAgICAgICAgICAgICAgIHR5cGVvZiBzZWxmLklEQktleVJhbmdlICE9PSAndW5kZWZpbmVkJztcblx0ICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSkoKTtcblxuXHQgICAgICAgIHJlc3VsdFtEcml2ZXJUeXBlLkxPQ0FMU1RPUkFHRV0gPSAhIShmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5sb2NhbFN0b3JhZ2UgJiYgJ3NldEl0ZW0nIGluIHNlbGYubG9jYWxTdG9yYWdlICYmIHNlbGYubG9jYWxTdG9yYWdlLnNldEl0ZW07XG5cdCAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0pKCk7XG5cblx0ICAgICAgICByZXR1cm4gcmVzdWx0O1xuXHQgICAgfSkodGhpcyk7XG5cblx0ICAgIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoYXJnKSB7XG5cdCAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcmcpID09PSAnW29iamVjdCBBcnJheV0nO1xuXHQgICAgfTtcblxuXHQgICAgZnVuY3Rpb24gY2FsbFdoZW5SZWFkeShsb2NhbEZvcmFnZUluc3RhbmNlLCBsaWJyYXJ5TWV0aG9kKSB7XG5cdCAgICAgICAgbG9jYWxGb3JhZ2VJbnN0YW5jZVtsaWJyYXJ5TWV0aG9kXSA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgdmFyIF9hcmdzID0gYXJndW1lbnRzO1xuXHQgICAgICAgICAgICByZXR1cm4gbG9jYWxGb3JhZ2VJbnN0YW5jZS5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGxvY2FsRm9yYWdlSW5zdGFuY2VbbGlicmFyeU1ldGhvZF0uYXBwbHkobG9jYWxGb3JhZ2VJbnN0YW5jZSwgX2FyZ3MpO1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICB9O1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBleHRlbmQoKSB7XG5cdCAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ3VtZW50c1tpXTtcblxuXHQgICAgICAgICAgICBpZiAoYXJnKSB7XG5cdCAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gYXJnKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKGFyZy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0FycmF5KGFyZ1trZXldKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzWzBdW2tleV0gPSBhcmdba2V5XS5zbGljZSgpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzWzBdW2tleV0gPSBhcmdba2V5XTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBhcmd1bWVudHNbMF07XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGlzTGlicmFyeURyaXZlcihkcml2ZXJOYW1lKSB7XG5cdCAgICAgICAgZm9yICh2YXIgZHJpdmVyIGluIERyaXZlclR5cGUpIHtcblx0ICAgICAgICAgICAgaWYgKERyaXZlclR5cGUuaGFzT3duUHJvcGVydHkoZHJpdmVyKSAmJiBEcml2ZXJUeXBlW2RyaXZlcl0gPT09IGRyaXZlck5hbWUpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgTG9jYWxGb3JhZ2UgPSAoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgIGZ1bmN0aW9uIExvY2FsRm9yYWdlKG9wdGlvbnMpIHtcblx0ICAgICAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIExvY2FsRm9yYWdlKTtcblxuXHQgICAgICAgICAgICB0aGlzLklOREVYRUREQiA9IERyaXZlclR5cGUuSU5ERVhFRERCO1xuXHQgICAgICAgICAgICB0aGlzLkxPQ0FMU1RPUkFHRSA9IERyaXZlclR5cGUuTE9DQUxTVE9SQUdFO1xuXHQgICAgICAgICAgICB0aGlzLldFQlNRTCA9IERyaXZlclR5cGUuV0VCU1FMO1xuXG5cdCAgICAgICAgICAgIHRoaXMuX2RlZmF1bHRDb25maWcgPSBleHRlbmQoe30sIERlZmF1bHRDb25maWcpO1xuXHQgICAgICAgICAgICB0aGlzLl9jb25maWcgPSBleHRlbmQoe30sIHRoaXMuX2RlZmF1bHRDb25maWcsIG9wdGlvbnMpO1xuXHQgICAgICAgICAgICB0aGlzLl9kcml2ZXJTZXQgPSBudWxsO1xuXHQgICAgICAgICAgICB0aGlzLl9pbml0RHJpdmVyID0gbnVsbDtcblx0ICAgICAgICAgICAgdGhpcy5fcmVhZHkgPSBmYWxzZTtcblx0ICAgICAgICAgICAgdGhpcy5fZGJJbmZvID0gbnVsbDtcblxuXHQgICAgICAgICAgICB0aGlzLl93cmFwTGlicmFyeU1ldGhvZHNXaXRoUmVhZHkoKTtcblx0ICAgICAgICAgICAgdGhpcy5zZXREcml2ZXIodGhpcy5fY29uZmlnLmRyaXZlcik7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gVGhlIGFjdHVhbCBsb2NhbEZvcmFnZSBvYmplY3QgdGhhdCB3ZSBleHBvc2UgYXMgYSBtb2R1bGUgb3IgdmlhIGFcblx0ICAgICAgICAvLyBnbG9iYWwuIEl0J3MgZXh0ZW5kZWQgYnkgcHVsbGluZyBpbiBvbmUgb2Ygb3VyIG90aGVyIGxpYnJhcmllcy5cblxuXHQgICAgICAgIC8vIFNldCBhbnkgY29uZmlnIHZhbHVlcyBmb3IgbG9jYWxGb3JhZ2U7IGNhbiBiZSBjYWxsZWQgYW55dGltZSBiZWZvcmVcblx0ICAgICAgICAvLyB0aGUgZmlyc3QgQVBJIGNhbGwgKGUuZy4gYGdldEl0ZW1gLCBgc2V0SXRlbWApLlxuXHQgICAgICAgIC8vIFdlIGxvb3AgdGhyb3VnaCBvcHRpb25zIHNvIHdlIGRvbid0IG92ZXJ3cml0ZSBleGlzdGluZyBjb25maWdcblx0ICAgICAgICAvLyB2YWx1ZXMuXG5cblx0ICAgICAgICBMb2NhbEZvcmFnZS5wcm90b3R5cGUuY29uZmlnID0gZnVuY3Rpb24gY29uZmlnKG9wdGlvbnMpIHtcblx0ICAgICAgICAgICAgLy8gSWYgdGhlIG9wdGlvbnMgYXJndW1lbnQgaXMgYW4gb2JqZWN0LCB3ZSB1c2UgaXQgdG8gc2V0IHZhbHVlcy5cblx0ICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCB3ZSByZXR1cm4gZWl0aGVyIGEgc3BlY2lmaWVkIGNvbmZpZyB2YWx1ZSBvciBhbGxcblx0ICAgICAgICAgICAgLy8gY29uZmlnIHZhbHVlcy5cblx0ICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnb2JqZWN0Jykge1xuXHQgICAgICAgICAgICAgICAgLy8gSWYgbG9jYWxmb3JhZ2UgaXMgcmVhZHkgYW5kIGZ1bGx5IGluaXRpYWxpemVkLCB3ZSBjYW4ndCBzZXRcblx0ICAgICAgICAgICAgICAgIC8vIGFueSBuZXcgY29uZmlndXJhdGlvbiB2YWx1ZXMuIEluc3RlYWQsIHdlIHJldHVybiBhbiBlcnJvci5cblx0ICAgICAgICAgICAgICAgIGlmICh0aGlzLl9yZWFkeSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3IoXCJDYW4ndCBjYWxsIGNvbmZpZygpIGFmdGVyIGxvY2FsZm9yYWdlIFwiICsgJ2hhcyBiZWVuIHVzZWQuJyk7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gb3B0aW9ucykge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChpID09PSAnc3RvcmVOYW1lJykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zW2ldID0gb3B0aW9uc1tpXS5yZXBsYWNlKC9cXFcvZywgJ18nKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICB0aGlzLl9jb25maWdbaV0gPSBvcHRpb25zW2ldO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvLyBhZnRlciBhbGwgY29uZmlnIG9wdGlvbnMgYXJlIHNldCBhbmRcblx0ICAgICAgICAgICAgICAgIC8vIHRoZSBkcml2ZXIgb3B0aW9uIGlzIHVzZWQsIHRyeSBzZXR0aW5nIGl0XG5cdCAgICAgICAgICAgICAgICBpZiAoJ2RyaXZlcicgaW4gb3B0aW9ucyAmJiBvcHRpb25zLmRyaXZlcikge1xuXHQgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0RHJpdmVyKHRoaXMuX2NvbmZpZy5kcml2ZXIpO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblx0ICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb25maWdbb3B0aW9uc107XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fY29uZmlnO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfTtcblxuXHQgICAgICAgIC8vIFVzZWQgdG8gZGVmaW5lIGEgY3VzdG9tIGRyaXZlciwgc2hhcmVkIGFjcm9zcyBhbGwgaW5zdGFuY2VzIG9mXG5cdCAgICAgICAgLy8gbG9jYWxGb3JhZ2UuXG5cblx0ICAgICAgICBMb2NhbEZvcmFnZS5wcm90b3R5cGUuZGVmaW5lRHJpdmVyID0gZnVuY3Rpb24gZGVmaW5lRHJpdmVyKGRyaXZlck9iamVjdCwgY2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcblx0ICAgICAgICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciBkcml2ZXJOYW1lID0gZHJpdmVyT2JqZWN0Ll9kcml2ZXI7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBsaWFuY2VFcnJvciA9IG5ldyBFcnJvcignQ3VzdG9tIGRyaXZlciBub3QgY29tcGxpYW50OyBzZWUgJyArICdodHRwczovL21vemlsbGEuZ2l0aHViLmlvL2xvY2FsRm9yYWdlLyNkZWZpbmVkcml2ZXInKTtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgbmFtaW5nRXJyb3IgPSBuZXcgRXJyb3IoJ0N1c3RvbSBkcml2ZXIgbmFtZSBhbHJlYWR5IGluIHVzZTogJyArIGRyaXZlck9iamVjdC5fZHJpdmVyKTtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8vIEEgZHJpdmVyIG5hbWUgc2hvdWxkIGJlIGRlZmluZWQgYW5kIG5vdCBvdmVybGFwIHdpdGggdGhlXG5cdCAgICAgICAgICAgICAgICAgICAgLy8gbGlicmFyeS1kZWZpbmVkLCBkZWZhdWx0IGRyaXZlcnMuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKCFkcml2ZXJPYmplY3QuX2RyaXZlcikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoY29tcGxpYW5jZUVycm9yKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoaXNMaWJyYXJ5RHJpdmVyKGRyaXZlck9iamVjdC5fZHJpdmVyKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QobmFtaW5nRXJyb3IpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIGN1c3RvbURyaXZlck1ldGhvZHMgPSBMaWJyYXJ5TWV0aG9kcy5jb25jYXQoJ19pbml0U3RvcmFnZScpO1xuXHQgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY3VzdG9tRHJpdmVyTWV0aG9kcy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VzdG9tRHJpdmVyTWV0aG9kID0gY3VzdG9tRHJpdmVyTWV0aG9kc1tpXTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjdXN0b21Ecml2ZXJNZXRob2QgfHwgIWRyaXZlck9iamVjdFtjdXN0b21Ecml2ZXJNZXRob2RdIHx8IHR5cGVvZiBkcml2ZXJPYmplY3RbY3VzdG9tRHJpdmVyTWV0aG9kXSAhPT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGNvbXBsaWFuY2VFcnJvcik7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICB2YXIgc3VwcG9ydFByb21pc2UgPSBQcm9taXNlLnJlc29sdmUodHJ1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKCdfc3VwcG9ydCcgaW4gZHJpdmVyT2JqZWN0KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkcml2ZXJPYmplY3QuX3N1cHBvcnQgJiYgdHlwZW9mIGRyaXZlck9iamVjdC5fc3VwcG9ydCA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VwcG9ydFByb21pc2UgPSBkcml2ZXJPYmplY3QuX3N1cHBvcnQoKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1cHBvcnRQcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCEhZHJpdmVyT2JqZWN0Ll9zdXBwb3J0KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIHN1cHBvcnRQcm9taXNlLnRoZW4oZnVuY3Rpb24gKHN1cHBvcnRSZXN1bHQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZHJpdmVyU3VwcG9ydFtkcml2ZXJOYW1lXSA9IHN1cHBvcnRSZXN1bHQ7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIEN1c3RvbURyaXZlcnNbZHJpdmVyTmFtZV0gPSBkcml2ZXJPYmplY3Q7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcblx0ICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuXHQgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJlamVjdChlKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfSk7XG5cblx0ICAgICAgICAgICAgcHJvbWlzZS50aGVuKGNhbGxiYWNrLCBlcnJvckNhbGxiYWNrKTtcblx0ICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cdCAgICAgICAgfTtcblxuXHQgICAgICAgIExvY2FsRm9yYWdlLnByb3RvdHlwZS5kcml2ZXIgPSBmdW5jdGlvbiBkcml2ZXIoKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzLl9kcml2ZXIgfHwgbnVsbDtcblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgTG9jYWxGb3JhZ2UucHJvdG90eXBlLmdldERyaXZlciA9IGZ1bmN0aW9uIGdldERyaXZlcihkcml2ZXJOYW1lLCBjYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuXHQgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cdCAgICAgICAgICAgIHZhciBnZXREcml2ZXJQcm9taXNlID0gKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIGlmIChpc0xpYnJhcnlEcml2ZXIoZHJpdmVyTmFtZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGRyaXZlck5hbWUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBzZWxmLklOREVYRUREQjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShfX3dlYnBhY2tfcmVxdWlyZV9fKDEpKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIHNlbGYuTE9DQUxTVE9SQUdFOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKF9fd2VicGFja19yZXF1aXJlX18oMikpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNhc2Ugc2VsZi5XRUJTUUw6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoX193ZWJwYWNrX3JlcXVpcmVfXyg0KSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKEN1c3RvbURyaXZlcnNbZHJpdmVyTmFtZV0pIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKEN1c3RvbURyaXZlcnNbZHJpdmVyTmFtZV0pO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdEcml2ZXIgbm90IGZvdW5kLicpKTtcblx0ICAgICAgICAgICAgfSkoKTtcblxuXHQgICAgICAgICAgICBnZXREcml2ZXJQcm9taXNlLnRoZW4oY2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spO1xuXHQgICAgICAgICAgICByZXR1cm4gZ2V0RHJpdmVyUHJvbWlzZTtcblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgTG9jYWxGb3JhZ2UucHJvdG90eXBlLmdldFNlcmlhbGl6ZXIgPSBmdW5jdGlvbiBnZXRTZXJpYWxpemVyKGNhbGxiYWNrKSB7XG5cdCAgICAgICAgICAgIHZhciBzZXJpYWxpemVyUHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgICAgIHJlc29sdmUoX193ZWJwYWNrX3JlcXVpcmVfXygzKSk7XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICBpZiAoY2FsbGJhY2sgJiYgdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgICAgICAgICBzZXJpYWxpemVyUHJvbWlzZS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcblx0ICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhyZXN1bHQpO1xuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZXJQcm9taXNlO1xuXHQgICAgICAgIH07XG5cblx0ICAgICAgICBMb2NhbEZvcmFnZS5wcm90b3R5cGUucmVhZHkgPSBmdW5jdGlvbiByZWFkeShjYWxsYmFjaykge1xuXHQgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgICAgICAgdmFyIHByb21pc2UgPSBzZWxmLl9kcml2ZXJTZXQudGhlbihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAoc2VsZi5fcmVhZHkgPT09IG51bGwpIHtcblx0ICAgICAgICAgICAgICAgICAgICBzZWxmLl9yZWFkeSA9IHNlbGYuX2luaXREcml2ZXIoKTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuX3JlYWR5O1xuXHQgICAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgICBwcm9taXNlLnRoZW4oY2FsbGJhY2ssIGNhbGxiYWNrKTtcblx0ICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cdCAgICAgICAgfTtcblxuXHQgICAgICAgIExvY2FsRm9yYWdlLnByb3RvdHlwZS5zZXREcml2ZXIgPSBmdW5jdGlvbiBzZXREcml2ZXIoZHJpdmVycywgY2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcblx0ICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG5cdCAgICAgICAgICAgIGlmICghaXNBcnJheShkcml2ZXJzKSkge1xuXHQgICAgICAgICAgICAgICAgZHJpdmVycyA9IFtkcml2ZXJzXTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHZhciBzdXBwb3J0ZWREcml2ZXJzID0gdGhpcy5fZ2V0U3VwcG9ydGVkRHJpdmVycyhkcml2ZXJzKTtcblxuXHQgICAgICAgICAgICBmdW5jdGlvbiBzZXREcml2ZXJUb0NvbmZpZygpIHtcblx0ICAgICAgICAgICAgICAgIHNlbGYuX2NvbmZpZy5kcml2ZXIgPSBzZWxmLmRyaXZlcigpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgZnVuY3Rpb24gaW5pdERyaXZlcihzdXBwb3J0ZWREcml2ZXJzKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50RHJpdmVySW5kZXggPSAwO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gZHJpdmVyUHJvbWlzZUxvb3AoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChjdXJyZW50RHJpdmVySW5kZXggPCBzdXBwb3J0ZWREcml2ZXJzLmxlbmd0aCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRyaXZlck5hbWUgPSBzdXBwb3J0ZWREcml2ZXJzW2N1cnJlbnREcml2ZXJJbmRleF07XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50RHJpdmVySW5kZXgrKztcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fZGJJbmZvID0gbnVsbDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3JlYWR5ID0gbnVsbDtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuZ2V0RHJpdmVyKGRyaXZlck5hbWUpLnRoZW4oZnVuY3Rpb24gKGRyaXZlcikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX2V4dGVuZChkcml2ZXIpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldERyaXZlclRvQ29uZmlnKCk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9yZWFkeSA9IHNlbGYuX2luaXRTdG9yYWdlKHNlbGYuX2NvbmZpZyk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuX3JlYWR5O1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlbJ2NhdGNoJ10oZHJpdmVyUHJvbWlzZUxvb3ApO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgc2V0RHJpdmVyVG9Db25maWcoKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVycm9yID0gbmV3IEVycm9yKCdObyBhdmFpbGFibGUgc3RvcmFnZSBtZXRob2QgZm91bmQuJyk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX2RyaXZlclNldCA9IFByb21pc2UucmVqZWN0KGVycm9yKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuX2RyaXZlclNldDtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gZHJpdmVyUHJvbWlzZUxvb3AoKTtcblx0ICAgICAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvLyBUaGVyZSBtaWdodCBiZSBhIGRyaXZlciBpbml0aWFsaXphdGlvbiBpbiBwcm9ncmVzc1xuXHQgICAgICAgICAgICAvLyBzbyB3YWl0IGZvciBpdCB0byBmaW5pc2ggaW4gb3JkZXIgdG8gYXZvaWQgYSBwb3NzaWJsZVxuXHQgICAgICAgICAgICAvLyByYWNlIGNvbmRpdGlvbiB0byBzZXQgX2RiSW5mb1xuXHQgICAgICAgICAgICB2YXIgb2xkRHJpdmVyU2V0RG9uZSA9IHRoaXMuX2RyaXZlclNldCAhPT0gbnVsbCA/IHRoaXMuX2RyaXZlclNldFsnY2F0Y2gnXShmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG5cdCAgICAgICAgICAgIH0pIDogUHJvbWlzZS5yZXNvbHZlKCk7XG5cblx0ICAgICAgICAgICAgdGhpcy5fZHJpdmVyU2V0ID0gb2xkRHJpdmVyU2V0RG9uZS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBkcml2ZXJOYW1lID0gc3VwcG9ydGVkRHJpdmVyc1swXTtcblx0ICAgICAgICAgICAgICAgIHNlbGYuX2RiSW5mbyA9IG51bGw7XG5cdCAgICAgICAgICAgICAgICBzZWxmLl9yZWFkeSA9IG51bGw7XG5cblx0ICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmdldERyaXZlcihkcml2ZXJOYW1lKS50aGVuKGZ1bmN0aW9uIChkcml2ZXIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBzZWxmLl9kcml2ZXIgPSBkcml2ZXIuX2RyaXZlcjtcblx0ICAgICAgICAgICAgICAgICAgICBzZXREcml2ZXJUb0NvbmZpZygpO1xuXHQgICAgICAgICAgICAgICAgICAgIHNlbGYuX3dyYXBMaWJyYXJ5TWV0aG9kc1dpdGhSZWFkeSgpO1xuXHQgICAgICAgICAgICAgICAgICAgIHNlbGYuX2luaXREcml2ZXIgPSBpbml0RHJpdmVyKHN1cHBvcnRlZERyaXZlcnMpO1xuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH0pWydjYXRjaCddKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHNldERyaXZlclRvQ29uZmlnKCk7XG5cdCAgICAgICAgICAgICAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IoJ05vIGF2YWlsYWJsZSBzdG9yYWdlIG1ldGhvZCBmb3VuZC4nKTtcblx0ICAgICAgICAgICAgICAgIHNlbGYuX2RyaXZlclNldCA9IFByb21pc2UucmVqZWN0KGVycm9yKTtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLl9kcml2ZXJTZXQ7XG5cdCAgICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICAgIHRoaXMuX2RyaXZlclNldC50aGVuKGNhbGxiYWNrLCBlcnJvckNhbGxiYWNrKTtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RyaXZlclNldDtcblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgTG9jYWxGb3JhZ2UucHJvdG90eXBlLnN1cHBvcnRzID0gZnVuY3Rpb24gc3VwcG9ydHMoZHJpdmVyTmFtZSkge1xuXHQgICAgICAgICAgICByZXR1cm4gISFkcml2ZXJTdXBwb3J0W2RyaXZlck5hbWVdO1xuXHQgICAgICAgIH07XG5cblx0ICAgICAgICBMb2NhbEZvcmFnZS5wcm90b3R5cGUuX2V4dGVuZCA9IGZ1bmN0aW9uIF9leHRlbmQobGlicmFyeU1ldGhvZHNBbmRQcm9wZXJ0aWVzKSB7XG5cdCAgICAgICAgICAgIGV4dGVuZCh0aGlzLCBsaWJyYXJ5TWV0aG9kc0FuZFByb3BlcnRpZXMpO1xuXHQgICAgICAgIH07XG5cblx0ICAgICAgICBMb2NhbEZvcmFnZS5wcm90b3R5cGUuX2dldFN1cHBvcnRlZERyaXZlcnMgPSBmdW5jdGlvbiBfZ2V0U3VwcG9ydGVkRHJpdmVycyhkcml2ZXJzKSB7XG5cdCAgICAgICAgICAgIHZhciBzdXBwb3J0ZWREcml2ZXJzID0gW107XG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBkcml2ZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgZHJpdmVyTmFtZSA9IGRyaXZlcnNbaV07XG5cdCAgICAgICAgICAgICAgICBpZiAodGhpcy5zdXBwb3J0cyhkcml2ZXJOYW1lKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHN1cHBvcnRlZERyaXZlcnMucHVzaChkcml2ZXJOYW1lKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gc3VwcG9ydGVkRHJpdmVycztcblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgTG9jYWxGb3JhZ2UucHJvdG90eXBlLl93cmFwTGlicmFyeU1ldGhvZHNXaXRoUmVhZHkgPSBmdW5jdGlvbiBfd3JhcExpYnJhcnlNZXRob2RzV2l0aFJlYWR5KCkge1xuXHQgICAgICAgICAgICAvLyBBZGQgYSBzdHViIGZvciBlYWNoIGRyaXZlciBBUEkgbWV0aG9kIHRoYXQgZGVsYXlzIHRoZSBjYWxsIHRvIHRoZVxuXHQgICAgICAgICAgICAvLyBjb3JyZXNwb25kaW5nIGRyaXZlciBtZXRob2QgdW50aWwgbG9jYWxGb3JhZ2UgaXMgcmVhZHkuIFRoZXNlIHN0dWJzXG5cdCAgICAgICAgICAgIC8vIHdpbGwgYmUgcmVwbGFjZWQgYnkgdGhlIGRyaXZlciBtZXRob2RzIGFzIHNvb24gYXMgdGhlIGRyaXZlciBpc1xuXHQgICAgICAgICAgICAvLyBsb2FkZWQsIHNvIHRoZXJlIGlzIG5vIHBlcmZvcm1hbmNlIGltcGFjdC5cblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBMaWJyYXJ5TWV0aG9kcy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgY2FsbFdoZW5SZWFkeSh0aGlzLCBMaWJyYXJ5TWV0aG9kc1tpXSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgTG9jYWxGb3JhZ2UucHJvdG90eXBlLmNyZWF0ZUluc3RhbmNlID0gZnVuY3Rpb24gY3JlYXRlSW5zdGFuY2Uob3B0aW9ucykge1xuXHQgICAgICAgICAgICByZXR1cm4gbmV3IExvY2FsRm9yYWdlKG9wdGlvbnMpO1xuXHQgICAgICAgIH07XG5cblx0ICAgICAgICByZXR1cm4gTG9jYWxGb3JhZ2U7XG5cdCAgICB9KSgpO1xuXG5cdCAgICB2YXIgbG9jYWxGb3JhZ2UgPSBuZXcgTG9jYWxGb3JhZ2UoKTtcblxuXHQgICAgZXhwb3J0c1snZGVmYXVsdCddID0gbG9jYWxGb3JhZ2U7XG5cdH0pLmNhbGwodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiBzZWxmKTtcblx0bW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG5cbi8qKiovIH0sXG4vKiAxICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHQvLyBTb21lIGNvZGUgb3JpZ2luYWxseSBmcm9tIGFzeW5jX3N0b3JhZ2UuanMgaW5cblx0Ly8gW0dhaWFdKGh0dHBzOi8vZ2l0aHViLmNvbS9tb3ppbGxhLWIyZy9nYWlhKS5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdGV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cdChmdW5jdGlvbiAoKSB7XG5cdCAgICAndXNlIHN0cmljdCc7XG5cblx0ICAgIHZhciBnbG9iYWxPYmplY3QgPSB0aGlzO1xuXHQgICAgLy8gSW5pdGlhbGl6ZSBJbmRleGVkREI7IGZhbGwgYmFjayB0byB2ZW5kb3ItcHJlZml4ZWQgdmVyc2lvbnMgaWYgbmVlZGVkLlxuXHQgICAgdmFyIGluZGV4ZWREQiA9IGluZGV4ZWREQiB8fCB0aGlzLmluZGV4ZWREQiB8fCB0aGlzLndlYmtpdEluZGV4ZWREQiB8fCB0aGlzLm1vekluZGV4ZWREQiB8fCB0aGlzLk9JbmRleGVkREIgfHwgdGhpcy5tc0luZGV4ZWREQjtcblxuXHQgICAgLy8gSWYgSW5kZXhlZERCIGlzbid0IGF2YWlsYWJsZSwgd2UgZ2V0IG91dHRhIGhlcmUhXG5cdCAgICBpZiAoIWluZGV4ZWREQikge1xuXHQgICAgICAgIHJldHVybjtcblx0ICAgIH1cblxuXHQgICAgdmFyIERFVEVDVF9CTE9CX1NVUFBPUlRfU1RPUkUgPSAnbG9jYWwtZm9yYWdlLWRldGVjdC1ibG9iLXN1cHBvcnQnO1xuXHQgICAgdmFyIHN1cHBvcnRzQmxvYnM7XG5cdCAgICB2YXIgZGJDb250ZXh0cztcblxuXHQgICAgLy8gQWJzdHJhY3RzIGNvbnN0cnVjdGluZyBhIEJsb2Igb2JqZWN0LCBzbyBpdCBhbHNvIHdvcmtzIGluIG9sZGVyXG5cdCAgICAvLyBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgdGhlIG5hdGl2ZSBCbG9iIGNvbnN0cnVjdG9yLiAoaS5lLlxuXHQgICAgLy8gb2xkIFF0V2ViS2l0IHZlcnNpb25zLCBhdCBsZWFzdCkuXG5cdCAgICBmdW5jdGlvbiBfY3JlYXRlQmxvYihwYXJ0cywgcHJvcGVydGllcykge1xuXHQgICAgICAgIHBhcnRzID0gcGFydHMgfHwgW107XG5cdCAgICAgICAgcHJvcGVydGllcyA9IHByb3BlcnRpZXMgfHwge307XG5cdCAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgcmV0dXJuIG5ldyBCbG9iKHBhcnRzLCBwcm9wZXJ0aWVzKTtcblx0ICAgICAgICB9IGNhdGNoIChlKSB7XG5cdCAgICAgICAgICAgIGlmIChlLm5hbWUgIT09ICdUeXBlRXJyb3InKSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyBlO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHZhciBCbG9iQnVpbGRlciA9IGdsb2JhbE9iamVjdC5CbG9iQnVpbGRlciB8fCBnbG9iYWxPYmplY3QuTVNCbG9iQnVpbGRlciB8fCBnbG9iYWxPYmplY3QuTW96QmxvYkJ1aWxkZXIgfHwgZ2xvYmFsT2JqZWN0LldlYktpdEJsb2JCdWlsZGVyO1xuXHQgICAgICAgICAgICB2YXIgYnVpbGRlciA9IG5ldyBCbG9iQnVpbGRlcigpO1xuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSArPSAxKSB7XG5cdCAgICAgICAgICAgICAgICBidWlsZGVyLmFwcGVuZChwYXJ0c1tpXSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIGJ1aWxkZXIuZ2V0QmxvYihwcm9wZXJ0aWVzLnR5cGUpO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgLy8gVHJhbnNmb3JtIGEgYmluYXJ5IHN0cmluZyB0byBhbiBhcnJheSBidWZmZXIsIGJlY2F1c2Ugb3RoZXJ3aXNlXG5cdCAgICAvLyB3ZWlyZCBzdHVmZiBoYXBwZW5zIHdoZW4geW91IHRyeSB0byB3b3JrIHdpdGggdGhlIGJpbmFyeSBzdHJpbmcgZGlyZWN0bHkuXG5cdCAgICAvLyBJdCBpcyBrbm93bi5cblx0ICAgIC8vIEZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNDk2NzY0Ny8gKGNvbnRpbnVlcyBvbiBuZXh0IGxpbmUpXG5cdCAgICAvLyBlbmNvZGUtZGVjb2RlLWltYWdlLXdpdGgtYmFzZTY0LWJyZWFrcy1pbWFnZSAoMjAxMy0wNC0yMSlcblx0ICAgIGZ1bmN0aW9uIF9iaW5TdHJpbmdUb0FycmF5QnVmZmVyKGJpbikge1xuXHQgICAgICAgIHZhciBsZW5ndGggPSBiaW4ubGVuZ3RoO1xuXHQgICAgICAgIHZhciBidWYgPSBuZXcgQXJyYXlCdWZmZXIobGVuZ3RoKTtcblx0ICAgICAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoYnVmKTtcblx0ICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgIGFycltpXSA9IGJpbi5jaGFyQ29kZUF0KGkpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gYnVmO1xuXHQgICAgfVxuXG5cdCAgICAvLyBGZXRjaCBhIGJsb2IgdXNpbmcgYWpheC4gVGhpcyByZXZlYWxzIGJ1Z3MgaW4gQ2hyb21lIDwgNDMuXG5cdCAgICAvLyBGb3IgZGV0YWlscyBvbiBhbGwgdGhpcyBqdW5rOlxuXHQgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL25vbGFubGF3c29uL3N0YXRlLW9mLWJpbmFyeS1kYXRhLWluLXRoZS1icm93c2VyI3JlYWRtZVxuXHQgICAgZnVuY3Rpb24gX2Jsb2JBamF4KHVybCkge1xuXHQgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0ICAgICAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIHVybCk7XG5cdCAgICAgICAgICAgIHhoci53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuXHQgICAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcblxuXHQgICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlICE9PSA0KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6IHhoci5yZXNwb25zZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogeGhyLmdldFJlc3BvbnNlSGVhZGVyKCdDb250ZW50LVR5cGUnKVxuXHQgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgcmVqZWN0KHsgc3RhdHVzOiB4aHIuc3RhdHVzLCByZXNwb25zZTogeGhyLnJlc3BvbnNlIH0pO1xuXHQgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICB4aHIuc2VuZCgpO1xuXHQgICAgICAgIH0pO1xuXHQgICAgfVxuXG5cdCAgICAvL1xuXHQgICAgLy8gRGV0ZWN0IGJsb2Igc3VwcG9ydC4gQ2hyb21lIGRpZG4ndCBzdXBwb3J0IGl0IHVudGlsIHZlcnNpb24gMzguXG5cdCAgICAvLyBJbiB2ZXJzaW9uIDM3IHRoZXkgaGFkIGEgYnJva2VuIHZlcnNpb24gd2hlcmUgUE5HcyAoYW5kIHBvc3NpYmx5XG5cdCAgICAvLyBvdGhlciBiaW5hcnkgdHlwZXMpIGFyZW4ndCBzdG9yZWQgY29ycmVjdGx5LCBiZWNhdXNlIHdoZW4geW91IGZldGNoXG5cdCAgICAvLyB0aGVtLCB0aGUgY29udGVudCB0eXBlIGlzIGFsd2F5cyBudWxsLlxuXHQgICAgLy9cblx0ICAgIC8vIEZ1cnRoZXJtb3JlLCB0aGV5IGhhdmUgc29tZSBvdXRzdGFuZGluZyBidWdzIHdoZXJlIGJsb2JzIG9jY2FzaW9uYWxseVxuXHQgICAgLy8gYXJlIHJlYWQgYnkgRmlsZVJlYWRlciBhcyBudWxsLCBvciBieSBhamF4IGFzIDQwNHMuXG5cdCAgICAvL1xuXHQgICAgLy8gU2FkbHkgd2UgdXNlIHRoZSA0MDQgYnVnIHRvIGRldGVjdCB0aGUgRmlsZVJlYWRlciBidWcsIHNvIGlmIHRoZXlcblx0ICAgIC8vIGdldCBmaXhlZCBpbmRlcGVuZGVudGx5IGFuZCByZWxlYXNlZCBpbiBkaWZmZXJlbnQgdmVyc2lvbnMgb2YgQ2hyb21lLFxuXHQgICAgLy8gdGhlbiB0aGUgYnVnIGNvdWxkIGNvbWUgYmFjay4gU28gaXQncyB3b3J0aHdoaWxlIHRvIHdhdGNoIHRoZXNlIGlzc3Vlczpcblx0ICAgIC8vIDQwNCBidWc6IGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD00NDc5MTZcblx0ICAgIC8vIEZpbGVSZWFkZXIgYnVnOiBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9NDQ3ODM2XG5cdCAgICAvL1xuXHQgICAgZnVuY3Rpb24gX2NoZWNrQmxvYlN1cHBvcnRXaXRob3V0Q2FjaGluZyhpZGIpIHtcblx0ICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHQgICAgICAgICAgICB2YXIgYmxvYiA9IF9jcmVhdGVCbG9iKFsnJ10sIHsgdHlwZTogJ2ltYWdlL3BuZycgfSk7XG5cdCAgICAgICAgICAgIHZhciB0eG4gPSBpZGIudHJhbnNhY3Rpb24oW0RFVEVDVF9CTE9CX1NVUFBPUlRfU1RPUkVdLCAncmVhZHdyaXRlJyk7XG5cdCAgICAgICAgICAgIHR4bi5vYmplY3RTdG9yZShERVRFQ1RfQkxPQl9TVVBQT1JUX1NUT1JFKS5wdXQoYmxvYiwgJ2tleScpO1xuXHQgICAgICAgICAgICB0eG4ub25jb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIC8vIGhhdmUgdG8gZG8gaXQgaW4gYSBzZXBhcmF0ZSB0cmFuc2FjdGlvbiwgZWxzZSB0aGUgY29ycmVjdFxuXHQgICAgICAgICAgICAgICAgLy8gY29udGVudCB0eXBlIGlzIGFsd2F5cyByZXR1cm5lZFxuXHQgICAgICAgICAgICAgICAgdmFyIGJsb2JUeG4gPSBpZGIudHJhbnNhY3Rpb24oW0RFVEVDVF9CTE9CX1NVUFBPUlRfU1RPUkVdLCAncmVhZHdyaXRlJyk7XG5cdCAgICAgICAgICAgICAgICB2YXIgZ2V0QmxvYlJlcSA9IGJsb2JUeG4ub2JqZWN0U3RvcmUoREVURUNUX0JMT0JfU1VQUE9SVF9TVE9SRSkuZ2V0KCdrZXknKTtcblx0ICAgICAgICAgICAgICAgIGdldEJsb2JSZXEub25lcnJvciA9IHJlamVjdDtcblx0ICAgICAgICAgICAgICAgIGdldEJsb2JSZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcblxuXHQgICAgICAgICAgICAgICAgICAgIHZhciBzdG9yZWRCbG9iID0gZS50YXJnZXQucmVzdWx0O1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKHN0b3JlZEJsb2IpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgX2Jsb2JBamF4KHVybCkudGhlbihmdW5jdGlvbiAocmVzKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoISEocmVzICYmIHJlcy50eXBlID09PSAnaW1hZ2UvcG5nJykpO1xuXHQgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShmYWxzZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwodXJsKTtcblx0ICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgIH07XG5cdCAgICAgICAgfSlbJ2NhdGNoJ10oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIGVycm9yLCBzbyBhc3N1bWUgdW5zdXBwb3J0ZWRcblx0ICAgICAgICB9KTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gX2NoZWNrQmxvYlN1cHBvcnQoaWRiKSB7XG5cdCAgICAgICAgaWYgKHR5cGVvZiBzdXBwb3J0c0Jsb2JzID09PSAnYm9vbGVhbicpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShzdXBwb3J0c0Jsb2JzKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIF9jaGVja0Jsb2JTdXBwb3J0V2l0aG91dENhY2hpbmcoaWRiKS50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuXHQgICAgICAgICAgICBzdXBwb3J0c0Jsb2JzID0gdmFsdWU7XG5cdCAgICAgICAgICAgIHJldHVybiBzdXBwb3J0c0Jsb2JzO1xuXHQgICAgICAgIH0pO1xuXHQgICAgfVxuXG5cdCAgICAvLyBlbmNvZGUgYSBibG9iIGZvciBpbmRleGVkZGIgZW5naW5lcyB0aGF0IGRvbid0IHN1cHBvcnQgYmxvYnNcblx0ICAgIGZ1bmN0aW9uIF9lbmNvZGVCbG9iKGJsb2IpIHtcblx0ICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHQgICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblx0ICAgICAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSByZWplY3Q7XG5cdCAgICAgICAgICAgIHJlYWRlci5vbmxvYWRlbmQgPSBmdW5jdGlvbiAoZSkge1xuXHQgICAgICAgICAgICAgICAgdmFyIGJhc2U2NCA9IGJ0b2EoZS50YXJnZXQucmVzdWx0IHx8ICcnKTtcblx0ICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuXHQgICAgICAgICAgICAgICAgICAgIF9fbG9jYWxfZm9yYWdlX2VuY29kZWRfYmxvYjogdHJ1ZSxcblx0ICAgICAgICAgICAgICAgICAgICBkYXRhOiBiYXNlNjQsXG5cdCAgICAgICAgICAgICAgICAgICAgdHlwZTogYmxvYi50eXBlXG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0JpbmFyeVN0cmluZyhibG9iKTtcblx0ICAgICAgICB9KTtcblx0ICAgIH1cblxuXHQgICAgLy8gZGVjb2RlIGFuIGVuY29kZWQgYmxvYlxuXHQgICAgZnVuY3Rpb24gX2RlY29kZUJsb2IoZW5jb2RlZEJsb2IpIHtcblx0ICAgICAgICB2YXIgYXJyYXlCdWZmID0gX2JpblN0cmluZ1RvQXJyYXlCdWZmZXIoYXRvYihlbmNvZGVkQmxvYi5kYXRhKSk7XG5cdCAgICAgICAgcmV0dXJuIF9jcmVhdGVCbG9iKFthcnJheUJ1ZmZdLCB7IHR5cGU6IGVuY29kZWRCbG9iLnR5cGUgfSk7XG5cdCAgICB9XG5cblx0ICAgIC8vIGlzIHRoaXMgb25lIG9mIG91ciBmYW5jeSBlbmNvZGVkIGJsb2JzP1xuXHQgICAgZnVuY3Rpb24gX2lzRW5jb2RlZEJsb2IodmFsdWUpIHtcblx0ICAgICAgICByZXR1cm4gdmFsdWUgJiYgdmFsdWUuX19sb2NhbF9mb3JhZ2VfZW5jb2RlZF9ibG9iO1xuXHQgICAgfVxuXG5cdCAgICAvLyBPcGVuIHRoZSBJbmRleGVkREIgZGF0YWJhc2UgKGF1dG9tYXRpY2FsbHkgY3JlYXRlcyBvbmUgaWYgb25lIGRpZG4ndFxuXHQgICAgLy8gcHJldmlvdXNseSBleGlzdCksIHVzaW5nIGFueSBvcHRpb25zIHNldCBpbiB0aGUgY29uZmlnLlxuXHQgICAgZnVuY3Rpb24gX2luaXRTdG9yYWdlKG9wdGlvbnMpIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cdCAgICAgICAgdmFyIGRiSW5mbyA9IHtcblx0ICAgICAgICAgICAgZGI6IG51bGxcblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgaWYgKG9wdGlvbnMpIHtcblx0ICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBvcHRpb25zKSB7XG5cdCAgICAgICAgICAgICAgICBkYkluZm9baV0gPSBvcHRpb25zW2ldO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gSW5pdGlhbGl6ZSBhIHNpbmdsZXRvbiBjb250YWluZXIgZm9yIGFsbCBydW5uaW5nIGxvY2FsRm9yYWdlcy5cblx0ICAgICAgICBpZiAoIWRiQ29udGV4dHMpIHtcblx0ICAgICAgICAgICAgZGJDb250ZXh0cyA9IHt9O1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIEdldCB0aGUgY3VycmVudCBjb250ZXh0IG9mIHRoZSBkYXRhYmFzZTtcblx0ICAgICAgICB2YXIgZGJDb250ZXh0ID0gZGJDb250ZXh0c1tkYkluZm8ubmFtZV07XG5cblx0ICAgICAgICAvLyAuLi5vciBjcmVhdGUgYSBuZXcgY29udGV4dC5cblx0ICAgICAgICBpZiAoIWRiQ29udGV4dCkge1xuXHQgICAgICAgICAgICBkYkNvbnRleHQgPSB7XG5cdCAgICAgICAgICAgICAgICAvLyBSdW5uaW5nIGxvY2FsRm9yYWdlcyBzaGFyaW5nIGEgZGF0YWJhc2UuXG5cdCAgICAgICAgICAgICAgICBmb3JhZ2VzOiBbXSxcblx0ICAgICAgICAgICAgICAgIC8vIFNoYXJlZCBkYXRhYmFzZS5cblx0ICAgICAgICAgICAgICAgIGRiOiBudWxsXG5cdCAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgIC8vIFJlZ2lzdGVyIHRoZSBuZXcgY29udGV4dCBpbiB0aGUgZ2xvYmFsIGNvbnRhaW5lci5cblx0ICAgICAgICAgICAgZGJDb250ZXh0c1tkYkluZm8ubmFtZV0gPSBkYkNvbnRleHQ7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gUmVnaXN0ZXIgaXRzZWxmIGFzIGEgcnVubmluZyBsb2NhbEZvcmFnZSBpbiB0aGUgY3VycmVudCBjb250ZXh0LlxuXHQgICAgICAgIGRiQ29udGV4dC5mb3JhZ2VzLnB1c2godGhpcyk7XG5cblx0ICAgICAgICAvLyBDcmVhdGUgYW4gYXJyYXkgb2YgcmVhZGluZXNzIG9mIHRoZSByZWxhdGVkIGxvY2FsRm9yYWdlcy5cblx0ICAgICAgICB2YXIgcmVhZHlQcm9taXNlcyA9IFtdO1xuXG5cdCAgICAgICAgZnVuY3Rpb24gaWdub3JlRXJyb3JzKCkge1xuXHQgICAgICAgICAgICAvLyBEb24ndCBoYW5kbGUgZXJyb3JzIGhlcmUsXG5cdCAgICAgICAgICAgIC8vIGp1c3QgbWFrZXMgc3VyZSByZWxhdGVkIGxvY2FsRm9yYWdlcyBhcmVuJ3QgcGVuZGluZy5cblx0ICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGJDb250ZXh0LmZvcmFnZXMubGVuZ3RoOyBqKyspIHtcblx0ICAgICAgICAgICAgdmFyIGZvcmFnZSA9IGRiQ29udGV4dC5mb3JhZ2VzW2pdO1xuXHQgICAgICAgICAgICBpZiAoZm9yYWdlICE9PSB0aGlzKSB7XG5cdCAgICAgICAgICAgICAgICAvLyBEb24ndCB3YWl0IGZvciBpdHNlbGYuLi5cblx0ICAgICAgICAgICAgICAgIHJlYWR5UHJvbWlzZXMucHVzaChmb3JhZ2UucmVhZHkoKVsnY2F0Y2gnXShpZ25vcmVFcnJvcnMpKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIFRha2UgYSBzbmFwc2hvdCBvZiB0aGUgcmVsYXRlZCBsb2NhbEZvcmFnZXMuXG5cdCAgICAgICAgdmFyIGZvcmFnZXMgPSBkYkNvbnRleHQuZm9yYWdlcy5zbGljZSgwKTtcblxuXHQgICAgICAgIC8vIEluaXRpYWxpemUgdGhlIGNvbm5lY3Rpb24gcHJvY2VzcyBvbmx5IHdoZW5cblx0ICAgICAgICAvLyBhbGwgdGhlIHJlbGF0ZWQgbG9jYWxGb3JhZ2VzIGFyZW4ndCBwZW5kaW5nLlxuXHQgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChyZWFkeVByb21pc2VzKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgZGJJbmZvLmRiID0gZGJDb250ZXh0LmRiO1xuXHQgICAgICAgICAgICAvLyBHZXQgdGhlIGNvbm5lY3Rpb24gb3Igb3BlbiBhIG5ldyBvbmUgd2l0aG91dCB1cGdyYWRlLlxuXHQgICAgICAgICAgICByZXR1cm4gX2dldE9yaWdpbmFsQ29ubmVjdGlvbihkYkluZm8pO1xuXHQgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKGRiKSB7XG5cdCAgICAgICAgICAgIGRiSW5mby5kYiA9IGRiO1xuXHQgICAgICAgICAgICBpZiAoX2lzVXBncmFkZU5lZWRlZChkYkluZm8sIHNlbGYuX2RlZmF1bHRDb25maWcudmVyc2lvbikpIHtcblx0ICAgICAgICAgICAgICAgIC8vIFJlb3BlbiB0aGUgZGF0YWJhc2UgZm9yIHVwZ3JhZGluZy5cblx0ICAgICAgICAgICAgICAgIHJldHVybiBfZ2V0VXBncmFkZWRDb25uZWN0aW9uKGRiSW5mbyk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIGRiO1xuXHQgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKGRiKSB7XG5cdCAgICAgICAgICAgIGRiSW5mby5kYiA9IGRiQ29udGV4dC5kYiA9IGRiO1xuXHQgICAgICAgICAgICBzZWxmLl9kYkluZm8gPSBkYkluZm87XG5cdCAgICAgICAgICAgIC8vIFNoYXJlIHRoZSBmaW5hbCBjb25uZWN0aW9uIGFtb25nc3QgcmVsYXRlZCBsb2NhbEZvcmFnZXMuXG5cdCAgICAgICAgICAgIGZvciAodmFyIGsgaW4gZm9yYWdlcykge1xuXHQgICAgICAgICAgICAgICAgdmFyIGZvcmFnZSA9IGZvcmFnZXNba107XG5cdCAgICAgICAgICAgICAgICBpZiAoZm9yYWdlICE9PSBzZWxmKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLy8gU2VsZiBpcyBhbHJlYWR5IHVwLXRvLWRhdGUuXG5cdCAgICAgICAgICAgICAgICAgICAgZm9yYWdlLl9kYkluZm8uZGIgPSBkYkluZm8uZGI7XG5cdCAgICAgICAgICAgICAgICAgICAgZm9yYWdlLl9kYkluZm8udmVyc2lvbiA9IGRiSW5mby52ZXJzaW9uO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSk7XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIF9nZXRPcmlnaW5hbENvbm5lY3Rpb24oZGJJbmZvKSB7XG5cdCAgICAgICAgcmV0dXJuIF9nZXRDb25uZWN0aW9uKGRiSW5mbywgZmFsc2UpO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBfZ2V0VXBncmFkZWRDb25uZWN0aW9uKGRiSW5mbykge1xuXHQgICAgICAgIHJldHVybiBfZ2V0Q29ubmVjdGlvbihkYkluZm8sIHRydWUpO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBfZ2V0Q29ubmVjdGlvbihkYkluZm8sIHVwZ3JhZGVOZWVkZWQpIHtcblx0ICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHQgICAgICAgICAgICBpZiAoZGJJbmZvLmRiKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAodXBncmFkZU5lZWRlZCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGRiSW5mby5kYi5jbG9zZSgpO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShkYkluZm8uZGIpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgdmFyIGRiQXJncyA9IFtkYkluZm8ubmFtZV07XG5cblx0ICAgICAgICAgICAgaWYgKHVwZ3JhZGVOZWVkZWQpIHtcblx0ICAgICAgICAgICAgICAgIGRiQXJncy5wdXNoKGRiSW5mby52ZXJzaW9uKTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHZhciBvcGVucmVxID0gaW5kZXhlZERCLm9wZW4uYXBwbHkoaW5kZXhlZERCLCBkYkFyZ3MpO1xuXG5cdCAgICAgICAgICAgIGlmICh1cGdyYWRlTmVlZGVkKSB7XG5cdCAgICAgICAgICAgICAgICBvcGVucmVxLm9udXBncmFkZW5lZWRlZCA9IGZ1bmN0aW9uIChlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIGRiID0gb3BlbnJlcS5yZXN1bHQ7XG5cdCAgICAgICAgICAgICAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZGIuY3JlYXRlT2JqZWN0U3RvcmUoZGJJbmZvLnN0b3JlTmFtZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLm9sZFZlcnNpb24gPD0gMSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkZWQgd2hlbiBzdXBwb3J0IGZvciBibG9iIHNoaW1zIHdhcyBhZGRlZFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGIuY3JlYXRlT2JqZWN0U3RvcmUoREVURUNUX0JMT0JfU1VQUE9SVF9TVE9SRSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXgubmFtZSA9PT0gJ0NvbnN0cmFpbnRFcnJvcicpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdsb2JhbE9iamVjdC5jb25zb2xlLndhcm4oJ1RoZSBkYXRhYmFzZSBcIicgKyBkYkluZm8ubmFtZSArICdcIicgKyAnIGhhcyBiZWVuIHVwZ3JhZGVkIGZyb20gdmVyc2lvbiAnICsgZS5vbGRWZXJzaW9uICsgJyB0byB2ZXJzaW9uICcgKyBlLm5ld1ZlcnNpb24gKyAnLCBidXQgdGhlIHN0b3JhZ2UgXCInICsgZGJJbmZvLnN0b3JlTmFtZSArICdcIiBhbHJlYWR5IGV4aXN0cy4nKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGV4O1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIG9wZW5yZXEub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHJlamVjdChvcGVucmVxLmVycm9yKTtcblx0ICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICBvcGVucmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHJlc29sdmUob3BlbnJlcS5yZXN1bHQpO1xuXHQgICAgICAgICAgICB9O1xuXHQgICAgICAgIH0pO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBfaXNVcGdyYWRlTmVlZGVkKGRiSW5mbywgZGVmYXVsdFZlcnNpb24pIHtcblx0ICAgICAgICBpZiAoIWRiSW5mby5kYikge1xuXHQgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgaXNOZXdTdG9yZSA9ICFkYkluZm8uZGIub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucyhkYkluZm8uc3RvcmVOYW1lKTtcblx0ICAgICAgICB2YXIgaXNEb3duZ3JhZGUgPSBkYkluZm8udmVyc2lvbiA8IGRiSW5mby5kYi52ZXJzaW9uO1xuXHQgICAgICAgIHZhciBpc1VwZ3JhZGUgPSBkYkluZm8udmVyc2lvbiA+IGRiSW5mby5kYi52ZXJzaW9uO1xuXG5cdCAgICAgICAgaWYgKGlzRG93bmdyYWRlKSB7XG5cdCAgICAgICAgICAgIC8vIElmIHRoZSB2ZXJzaW9uIGlzIG5vdCB0aGUgZGVmYXVsdCBvbmVcblx0ICAgICAgICAgICAgLy8gdGhlbiB3YXJuIGZvciBpbXBvc3NpYmxlIGRvd25ncmFkZS5cblx0ICAgICAgICAgICAgaWYgKGRiSW5mby52ZXJzaW9uICE9PSBkZWZhdWx0VmVyc2lvbikge1xuXHQgICAgICAgICAgICAgICAgZ2xvYmFsT2JqZWN0LmNvbnNvbGUud2FybignVGhlIGRhdGFiYXNlIFwiJyArIGRiSW5mby5uYW1lICsgJ1wiJyArICcgY2FuXFwndCBiZSBkb3duZ3JhZGVkIGZyb20gdmVyc2lvbiAnICsgZGJJbmZvLmRiLnZlcnNpb24gKyAnIHRvIHZlcnNpb24gJyArIGRiSW5mby52ZXJzaW9uICsgJy4nKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAvLyBBbGlnbiB0aGUgdmVyc2lvbnMgdG8gcHJldmVudCBlcnJvcnMuXG5cdCAgICAgICAgICAgIGRiSW5mby52ZXJzaW9uID0gZGJJbmZvLmRiLnZlcnNpb247XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKGlzVXBncmFkZSB8fCBpc05ld1N0b3JlKSB7XG5cdCAgICAgICAgICAgIC8vIElmIHRoZSBzdG9yZSBpcyBuZXcgdGhlbiBpbmNyZW1lbnQgdGhlIHZlcnNpb24gKGlmIG5lZWRlZCkuXG5cdCAgICAgICAgICAgIC8vIFRoaXMgd2lsbCB0cmlnZ2VyIGFuIFwidXBncmFkZW5lZWRlZFwiIGV2ZW50IHdoaWNoIGlzIHJlcXVpcmVkXG5cdCAgICAgICAgICAgIC8vIGZvciBjcmVhdGluZyBhIHN0b3JlLlxuXHQgICAgICAgICAgICBpZiAoaXNOZXdTdG9yZSkge1xuXHQgICAgICAgICAgICAgICAgdmFyIGluY1ZlcnNpb24gPSBkYkluZm8uZGIudmVyc2lvbiArIDE7XG5cdCAgICAgICAgICAgICAgICBpZiAoaW5jVmVyc2lvbiA+IGRiSW5mby52ZXJzaW9uKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgZGJJbmZvLnZlcnNpb24gPSBpbmNWZXJzaW9uO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBnZXRJdGVtKGtleSwgY2FsbGJhY2spIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgICAvLyBDYXN0IHRoZSBrZXkgdG8gYSBzdHJpbmcsIGFzIHRoYXQncyBhbGwgd2UgY2FuIHNldCBhcyBhIGtleS5cblx0ICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgZ2xvYmFsT2JqZWN0LmNvbnNvbGUud2FybihrZXkgKyAnIHVzZWQgYXMgYSBrZXksIGJ1dCBpdCBpcyBub3QgYSBzdHJpbmcuJyk7XG5cdCAgICAgICAgICAgIGtleSA9IFN0cmluZyhrZXkpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHQgICAgICAgICAgICBzZWxmLnJlYWR5KCkudGhlbihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgZGJJbmZvID0gc2VsZi5fZGJJbmZvO1xuXHQgICAgICAgICAgICAgICAgdmFyIHN0b3JlID0gZGJJbmZvLmRiLnRyYW5zYWN0aW9uKGRiSW5mby5zdG9yZU5hbWUsICdyZWFkb25seScpLm9iamVjdFN0b3JlKGRiSW5mby5zdG9yZU5hbWUpO1xuXHQgICAgICAgICAgICAgICAgdmFyIHJlcSA9IHN0b3JlLmdldChrZXkpO1xuXG5cdCAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHJlcS5yZXN1bHQ7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBudWxsO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoX2lzRW5jb2RlZEJsb2IodmFsdWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gX2RlY29kZUJsb2IodmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHZhbHVlKTtcblx0ICAgICAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgICAgIHJlcS5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXEuZXJyb3IpO1xuXHQgICAgICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgfSlbJ2NhdGNoJ10ocmVqZWN0KTtcblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIGV4ZWN1dGVDYWxsYmFjayhwcm9taXNlLCBjYWxsYmFjayk7XG5cdCAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cdCAgICB9XG5cblx0ICAgIC8vIEl0ZXJhdGUgb3ZlciBhbGwgaXRlbXMgc3RvcmVkIGluIGRhdGFiYXNlLlxuXHQgICAgZnVuY3Rpb24gaXRlcmF0ZShpdGVyYXRvciwgY2FsbGJhY2spIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgc2VsZi5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgdmFyIGRiSW5mbyA9IHNlbGYuX2RiSW5mbztcblx0ICAgICAgICAgICAgICAgIHZhciBzdG9yZSA9IGRiSW5mby5kYi50cmFuc2FjdGlvbihkYkluZm8uc3RvcmVOYW1lLCAncmVhZG9ubHknKS5vYmplY3RTdG9yZShkYkluZm8uc3RvcmVOYW1lKTtcblxuXHQgICAgICAgICAgICAgICAgdmFyIHJlcSA9IHN0b3JlLm9wZW5DdXJzb3IoKTtcblx0ICAgICAgICAgICAgICAgIHZhciBpdGVyYXRpb25OdW1iZXIgPSAxO1xuXG5cdCAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciBjdXJzb3IgPSByZXEucmVzdWx0O1xuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnNvcikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBjdXJzb3IudmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfaXNFbmNvZGVkQmxvYih2YWx1ZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gX2RlY29kZUJsb2IodmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBpdGVyYXRvcih2YWx1ZSwgY3Vyc29yLmtleSwgaXRlcmF0aW9uTnVtYmVyKyspO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgIT09IHZvaWQgMCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yWydjb250aW51ZSddKCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlcS5lcnJvcik7XG5cdCAgICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICB9KVsnY2F0Y2gnXShyZWplY3QpO1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKTtcblxuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBzZXRJdGVtKGtleSwgdmFsdWUsIGNhbGxiYWNrKSB7XG5cdCAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG5cdCAgICAgICAgLy8gQ2FzdCB0aGUga2V5IHRvIGEgc3RyaW5nLCBhcyB0aGF0J3MgYWxsIHdlIGNhbiBzZXQgYXMgYSBrZXkuXG5cdCAgICAgICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICAgIGdsb2JhbE9iamVjdC5jb25zb2xlLndhcm4oa2V5ICsgJyB1c2VkIGFzIGEga2V5LCBidXQgaXQgaXMgbm90IGEgc3RyaW5nLicpO1xuXHQgICAgICAgICAgICBrZXkgPSBTdHJpbmcoa2V5KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgdmFyIGRiSW5mbztcblx0ICAgICAgICAgICAgc2VsZi5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgZGJJbmZvID0gc2VsZi5fZGJJbmZvO1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIF9jaGVja0Jsb2JTdXBwb3J0KGRiSW5mby5kYik7XG5cdCAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKGJsb2JTdXBwb3J0KSB7XG5cdCAgICAgICAgICAgICAgICBpZiAoIWJsb2JTdXBwb3J0ICYmIHZhbHVlIGluc3RhbmNlb2YgQmxvYikge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBfZW5jb2RlQmxvYih2YWx1ZSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG5cdCAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYkluZm8uZGIudHJhbnNhY3Rpb24oZGJJbmZvLnN0b3JlTmFtZSwgJ3JlYWR3cml0ZScpO1xuXHQgICAgICAgICAgICAgICAgdmFyIHN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoZGJJbmZvLnN0b3JlTmFtZSk7XG5cblx0ICAgICAgICAgICAgICAgIC8vIFRoZSByZWFzb24gd2UgZG9uJ3QgX3NhdmVfIG51bGwgaXMgYmVjYXVzZSBJRSAxMCBkb2VzXG5cdCAgICAgICAgICAgICAgICAvLyBub3Qgc3VwcG9ydCBzYXZpbmcgdGhlIGBudWxsYCB0eXBlIGluIEluZGV4ZWREQi4gSG93XG5cdCAgICAgICAgICAgICAgICAvLyBpcm9uaWMsIGdpdmVuIHRoZSBidWcgYmVsb3chXG5cdCAgICAgICAgICAgICAgICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9tb3ppbGxhL2xvY2FsRm9yYWdlL2lzc3Vlcy8xNjFcblx0ICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdW5kZWZpbmVkO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICB2YXIgcmVxID0gc3RvcmUucHV0KHZhbHVlLCBrZXkpO1xuXHQgICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgICAgICAvLyBDYXN0IHRvIHVuZGVmaW5lZCBzbyB0aGUgdmFsdWUgcGFzc2VkIHRvXG5cdCAgICAgICAgICAgICAgICAgICAgLy8gY2FsbGJhY2svcHJvbWlzZSBpcyB0aGUgc2FtZSBhcyB3aGF0IG9uZSB3b3VsZCBnZXQgb3V0XG5cdCAgICAgICAgICAgICAgICAgICAgLy8gb2YgYGdldEl0ZW0oKWAgbGF0ZXIuIFRoaXMgbGVhZHMgdG8gc29tZSB3ZWlyZG5lc3Ncblx0ICAgICAgICAgICAgICAgICAgICAvLyAoc2V0SXRlbSgnZm9vJywgdW5kZWZpbmVkKSB3aWxsIHJldHVybiBgbnVsbGApLCBidXRcblx0ICAgICAgICAgICAgICAgICAgICAvLyBpdCdzIG5vdCBteSBmYXVsdCBsb2NhbFN0b3JhZ2UgaXMgb3VyIGJhc2VsaW5lIGFuZCB0aGF0XG5cdCAgICAgICAgICAgICAgICAgICAgLy8gaXQncyB3ZWlyZC5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IG51bGw7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh2YWx1ZSk7XG5cdCAgICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24ub25hYm9ydCA9IHRyYW5zYWN0aW9uLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIGVyciA9IHJlcS5lcnJvciA/IHJlcS5lcnJvciA6IHJlcS50cmFuc2FjdGlvbi5lcnJvcjtcblx0ICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcblx0ICAgICAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgIH0pWydjYXRjaCddKHJlamVjdCk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiByZW1vdmVJdGVtKGtleSwgY2FsbGJhY2spIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgICAvLyBDYXN0IHRoZSBrZXkgdG8gYSBzdHJpbmcsIGFzIHRoYXQncyBhbGwgd2UgY2FuIHNldCBhcyBhIGtleS5cblx0ICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgZ2xvYmFsT2JqZWN0LmNvbnNvbGUud2FybihrZXkgKyAnIHVzZWQgYXMgYSBrZXksIGJ1dCBpdCBpcyBub3QgYSBzdHJpbmcuJyk7XG5cdCAgICAgICAgICAgIGtleSA9IFN0cmluZyhrZXkpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHQgICAgICAgICAgICBzZWxmLnJlYWR5KCkudGhlbihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgZGJJbmZvID0gc2VsZi5fZGJJbmZvO1xuXHQgICAgICAgICAgICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGJJbmZvLmRiLnRyYW5zYWN0aW9uKGRiSW5mby5zdG9yZU5hbWUsICdyZWFkd3JpdGUnKTtcblx0ICAgICAgICAgICAgICAgIHZhciBzdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKGRiSW5mby5zdG9yZU5hbWUpO1xuXG5cdCAgICAgICAgICAgICAgICAvLyBXZSB1c2UgYSBHcnVudCB0YXNrIHRvIG1ha2UgdGhpcyBzYWZlIGZvciBJRSBhbmQgc29tZVxuXHQgICAgICAgICAgICAgICAgLy8gdmVyc2lvbnMgb2YgQW5kcm9pZCAoaW5jbHVkaW5nIHRob3NlIHVzZWQgYnkgQ29yZG92YSkuXG5cdCAgICAgICAgICAgICAgICAvLyBOb3JtYWxseSBJRSB3b24ndCBsaWtlIGAuZGVsZXRlKClgIGFuZCB3aWxsIGluc2lzdCBvblxuXHQgICAgICAgICAgICAgICAgLy8gdXNpbmcgYFsnZGVsZXRlJ10oKWAsIGJ1dCB3ZSBoYXZlIGEgYnVpbGQgc3RlcCB0aGF0XG5cdCAgICAgICAgICAgICAgICAvLyBmaXhlcyB0aGlzIGZvciB1cyBub3cuXG5cdCAgICAgICAgICAgICAgICB2YXIgcmVxID0gc3RvcmVbJ2RlbGV0ZSddKGtleSk7XG5cdCAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcblx0ICAgICAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlcS5lcnJvcik7XG5cdCAgICAgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICAgICAgICAvLyBUaGUgcmVxdWVzdCB3aWxsIGJlIGFsc28gYmUgYWJvcnRlZCBpZiB3ZSd2ZSBleGNlZWRlZCBvdXIgc3RvcmFnZVxuXHQgICAgICAgICAgICAgICAgLy8gc3BhY2UuXG5cdCAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmFib3J0ID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciBlcnIgPSByZXEuZXJyb3IgPyByZXEuZXJyb3IgOiByZXEudHJhbnNhY3Rpb24uZXJyb3I7XG5cdCAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG5cdCAgICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICB9KVsnY2F0Y2gnXShyZWplY3QpO1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKTtcblx0ICAgICAgICByZXR1cm4gcHJvbWlzZTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gY2xlYXIoY2FsbGJhY2spIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgc2VsZi5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgdmFyIGRiSW5mbyA9IHNlbGYuX2RiSW5mbztcblx0ICAgICAgICAgICAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiSW5mby5kYi50cmFuc2FjdGlvbihkYkluZm8uc3RvcmVOYW1lLCAncmVhZHdyaXRlJyk7XG5cdCAgICAgICAgICAgICAgICB2YXIgc3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShkYkluZm8uc3RvcmVOYW1lKTtcblx0ICAgICAgICAgICAgICAgIHZhciByZXEgPSBzdG9yZS5jbGVhcigpO1xuXG5cdCAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcblx0ICAgICAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uYWJvcnQgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciBlcnIgPSByZXEuZXJyb3IgPyByZXEuZXJyb3IgOiByZXEudHJhbnNhY3Rpb24uZXJyb3I7XG5cdCAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG5cdCAgICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICB9KVsnY2F0Y2gnXShyZWplY3QpO1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKTtcblx0ICAgICAgICByZXR1cm4gcHJvbWlzZTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gbGVuZ3RoKGNhbGxiYWNrKSB7XG5cdCAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG5cdCAgICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgIHNlbGYucmVhZHkoKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBkYkluZm8gPSBzZWxmLl9kYkluZm87XG5cdCAgICAgICAgICAgICAgICB2YXIgc3RvcmUgPSBkYkluZm8uZGIudHJhbnNhY3Rpb24oZGJJbmZvLnN0b3JlTmFtZSwgJ3JlYWRvbmx5Jykub2JqZWN0U3RvcmUoZGJJbmZvLnN0b3JlTmFtZSk7XG5cdCAgICAgICAgICAgICAgICB2YXIgcmVxID0gc3RvcmUuY291bnQoKTtcblxuXHQgICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlcS5yZXN1bHQpO1xuXHQgICAgICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlcS5lcnJvcik7XG5cdCAgICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICB9KVsnY2F0Y2gnXShyZWplY3QpO1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKTtcblx0ICAgICAgICByZXR1cm4gcHJvbWlzZTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24ga2V5KG4sIGNhbGxiYWNrKSB7XG5cdCAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG5cdCAgICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgIGlmIChuIDwgMCkge1xuXHQgICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcblxuXHQgICAgICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgc2VsZi5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgdmFyIGRiSW5mbyA9IHNlbGYuX2RiSW5mbztcblx0ICAgICAgICAgICAgICAgIHZhciBzdG9yZSA9IGRiSW5mby5kYi50cmFuc2FjdGlvbihkYkluZm8uc3RvcmVOYW1lLCAncmVhZG9ubHknKS5vYmplY3RTdG9yZShkYkluZm8uc3RvcmVOYW1lKTtcblxuXHQgICAgICAgICAgICAgICAgdmFyIGFkdmFuY2VkID0gZmFsc2U7XG5cdCAgICAgICAgICAgICAgICB2YXIgcmVxID0gc3RvcmUub3BlbkN1cnNvcigpO1xuXHQgICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgY3Vyc29yID0gcmVxLnJlc3VsdDtcblx0ICAgICAgICAgICAgICAgICAgICBpZiAoIWN1cnNvcikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIG1lYW5zIHRoZXJlIHdlcmVuJ3QgZW5vdWdoIGtleXNcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKG4gPT09IDApIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgaGF2ZSB0aGUgZmlyc3Qga2V5LCByZXR1cm4gaXQgaWYgdGhhdCdzIHdoYXQgdGhleVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvLyB3YW50ZWQuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoY3Vyc29yLmtleSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhZHZhbmNlZCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCBhc2sgdGhlIGN1cnNvciB0byBza2lwIGFoZWFkIG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlY29yZHMuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZHZhbmNlZCA9IHRydWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3IuYWR2YW5jZShuKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdoZW4gd2UgZ2V0IGhlcmUsIHdlJ3ZlIGdvdCB0aGUgbnRoIGtleS5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoY3Vyc29yLmtleSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICAgICAgICByZXEub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZWplY3QocmVxLmVycm9yKTtcblx0ICAgICAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgIH0pWydjYXRjaCddKHJlamVjdCk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBrZXlzKGNhbGxiYWNrKSB7XG5cdCAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG5cdCAgICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgIHNlbGYucmVhZHkoKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBkYkluZm8gPSBzZWxmLl9kYkluZm87XG5cdCAgICAgICAgICAgICAgICB2YXIgc3RvcmUgPSBkYkluZm8uZGIudHJhbnNhY3Rpb24oZGJJbmZvLnN0b3JlTmFtZSwgJ3JlYWRvbmx5Jykub2JqZWN0U3RvcmUoZGJJbmZvLnN0b3JlTmFtZSk7XG5cblx0ICAgICAgICAgICAgICAgIHZhciByZXEgPSBzdG9yZS5vcGVuQ3Vyc29yKCk7XG5cdCAgICAgICAgICAgICAgICB2YXIga2V5cyA9IFtdO1xuXG5cdCAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciBjdXJzb3IgPSByZXEucmVzdWx0O1xuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKCFjdXJzb3IpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShrZXlzKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIGtleXMucHVzaChjdXJzb3Iua2V5KTtcblx0ICAgICAgICAgICAgICAgICAgICBjdXJzb3JbJ2NvbnRpbnVlJ10oKTtcblx0ICAgICAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgICAgIHJlcS5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXEuZXJyb3IpO1xuXHQgICAgICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgfSlbJ2NhdGNoJ10ocmVqZWN0KTtcblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIGV4ZWN1dGVDYWxsYmFjayhwcm9taXNlLCBjYWxsYmFjayk7XG5cdCAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGV4ZWN1dGVDYWxsYmFjayhwcm9taXNlLCBjYWxsYmFjaykge1xuXHQgICAgICAgIGlmIChjYWxsYmFjaykge1xuXHQgICAgICAgICAgICBwcm9taXNlLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuXHQgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0KTtcblx0ICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG5cdCAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnJvcik7XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgdmFyIGFzeW5jU3RvcmFnZSA9IHtcblx0ICAgICAgICBfZHJpdmVyOiAnYXN5bmNTdG9yYWdlJyxcblx0ICAgICAgICBfaW5pdFN0b3JhZ2U6IF9pbml0U3RvcmFnZSxcblx0ICAgICAgICBpdGVyYXRlOiBpdGVyYXRlLFxuXHQgICAgICAgIGdldEl0ZW06IGdldEl0ZW0sXG5cdCAgICAgICAgc2V0SXRlbTogc2V0SXRlbSxcblx0ICAgICAgICByZW1vdmVJdGVtOiByZW1vdmVJdGVtLFxuXHQgICAgICAgIGNsZWFyOiBjbGVhcixcblx0ICAgICAgICBsZW5ndGg6IGxlbmd0aCxcblx0ICAgICAgICBrZXk6IGtleSxcblx0ICAgICAgICBrZXlzOiBrZXlzXG5cdCAgICB9O1xuXG5cdCAgICBleHBvcnRzWydkZWZhdWx0J10gPSBhc3luY1N0b3JhZ2U7XG5cdH0pLmNhbGwodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiBzZWxmKTtcblx0bW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG5cbi8qKiovIH0sXG4vKiAyICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQvLyBJZiBJbmRleGVkREIgaXNuJ3QgYXZhaWxhYmxlLCB3ZSdsbCBmYWxsIGJhY2sgdG8gbG9jYWxTdG9yYWdlLlxuXHQvLyBOb3RlIHRoYXQgdGhpcyB3aWxsIGhhdmUgY29uc2lkZXJhYmxlIHBlcmZvcm1hbmNlIGFuZCBzdG9yYWdlXG5cdC8vIHNpZGUtZWZmZWN0cyAoYWxsIGRhdGEgd2lsbCBiZSBzZXJpYWxpemVkIG9uIHNhdmUgYW5kIG9ubHkgZGF0YSB0aGF0XG5cdC8vIGNhbiBiZSBjb252ZXJ0ZWQgdG8gYSBzdHJpbmcgdmlhIGBKU09OLnN0cmluZ2lmeSgpYCB3aWxsIGJlIHNhdmVkKS5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdGV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cdChmdW5jdGlvbiAoKSB7XG5cdCAgICAndXNlIHN0cmljdCc7XG5cblx0ICAgIHZhciBnbG9iYWxPYmplY3QgPSB0aGlzO1xuXHQgICAgdmFyIGxvY2FsU3RvcmFnZSA9IG51bGw7XG5cblx0ICAgIC8vIElmIHRoZSBhcHAgaXMgcnVubmluZyBpbnNpZGUgYSBHb29nbGUgQ2hyb21lIHBhY2thZ2VkIHdlYmFwcCwgb3Igc29tZVxuXHQgICAgLy8gb3RoZXIgY29udGV4dCB3aGVyZSBsb2NhbFN0b3JhZ2UgaXNuJ3QgYXZhaWxhYmxlLCB3ZSBkb24ndCB1c2Vcblx0ICAgIC8vIGxvY2FsU3RvcmFnZS4gVGhpcyBmZWF0dXJlIGRldGVjdGlvbiBpcyBwcmVmZXJyZWQgb3ZlciB0aGUgb2xkXG5cdCAgICAvLyBgaWYgKHdpbmRvdy5jaHJvbWUgJiYgd2luZG93LmNocm9tZS5ydW50aW1lKWAgY29kZS5cblx0ICAgIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL21vemlsbGEvbG9jYWxGb3JhZ2UvaXNzdWVzLzY4XG5cdCAgICB0cnkge1xuXHQgICAgICAgIC8vIElmIGxvY2FsU3RvcmFnZSBpc24ndCBhdmFpbGFibGUsIHdlIGdldCBvdXR0YSBoZXJlIVxuXHQgICAgICAgIC8vIFRoaXMgc2hvdWxkIGJlIGluc2lkZSBhIHRyeSBjYXRjaFxuXHQgICAgICAgIGlmICghdGhpcy5sb2NhbFN0b3JhZ2UgfHwgISgnc2V0SXRlbScgaW4gdGhpcy5sb2NhbFN0b3JhZ2UpKSB7XG5cdCAgICAgICAgICAgIHJldHVybjtcblx0ICAgICAgICB9XG5cdCAgICAgICAgLy8gSW5pdGlhbGl6ZSBsb2NhbFN0b3JhZ2UgYW5kIGNyZWF0ZSBhIHZhcmlhYmxlIHRvIHVzZSB0aHJvdWdob3V0XG5cdCAgICAgICAgLy8gdGhlIGNvZGUuXG5cdCAgICAgICAgbG9jYWxTdG9yYWdlID0gdGhpcy5sb2NhbFN0b3JhZ2U7XG5cdCAgICB9IGNhdGNoIChlKSB7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXG5cdCAgICAvLyBDb25maWcgdGhlIGxvY2FsU3RvcmFnZSBiYWNrZW5kLCB1c2luZyBvcHRpb25zIHNldCBpbiB0aGUgY29uZmlnLlxuXHQgICAgZnVuY3Rpb24gX2luaXRTdG9yYWdlKG9wdGlvbnMpIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cdCAgICAgICAgdmFyIGRiSW5mbyA9IHt9O1xuXHQgICAgICAgIGlmIChvcHRpb25zKSB7XG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgaW4gb3B0aW9ucykge1xuXHQgICAgICAgICAgICAgICAgZGJJbmZvW2ldID0gb3B0aW9uc1tpXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGRiSW5mby5rZXlQcmVmaXggPSBkYkluZm8ubmFtZSArICcvJztcblxuXHQgICAgICAgIGlmIChkYkluZm8uc3RvcmVOYW1lICE9PSBzZWxmLl9kZWZhdWx0Q29uZmlnLnN0b3JlTmFtZSkge1xuXHQgICAgICAgICAgICBkYkluZm8ua2V5UHJlZml4ICs9IGRiSW5mby5zdG9yZU5hbWUgKyAnLyc7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgc2VsZi5fZGJJbmZvID0gZGJJbmZvO1xuXG5cdCAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgcmVzb2x2ZShfX3dlYnBhY2tfcmVxdWlyZV9fKDMpKTtcblx0ICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChsaWIpIHtcblx0ICAgICAgICAgICAgZGJJbmZvLnNlcmlhbGl6ZXIgPSBsaWI7XG5cdCAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcblx0ICAgICAgICB9KTtcblx0ICAgIH1cblxuXHQgICAgLy8gUmVtb3ZlIGFsbCBrZXlzIGZyb20gdGhlIGRhdGFzdG9yZSwgZWZmZWN0aXZlbHkgZGVzdHJveWluZyBhbGwgZGF0YSBpblxuXHQgICAgLy8gdGhlIGFwcCdzIGtleS92YWx1ZSBzdG9yZSFcblx0ICAgIGZ1bmN0aW9uIGNsZWFyKGNhbGxiYWNrKSB7XG5cdCAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXHQgICAgICAgIHZhciBwcm9taXNlID0gc2VsZi5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICB2YXIga2V5UHJlZml4ID0gc2VsZi5fZGJJbmZvLmtleVByZWZpeDtcblxuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gbG9jYWxTdG9yYWdlLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIga2V5ID0gbG9jYWxTdG9yYWdlLmtleShpKTtcblxuXHQgICAgICAgICAgICAgICAgaWYgKGtleS5pbmRleE9mKGtleVByZWZpeCkgPT09IDApIHtcblx0ICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICAvLyBSZXRyaWV2ZSBhbiBpdGVtIGZyb20gdGhlIHN0b3JlLiBVbmxpa2UgdGhlIG9yaWdpbmFsIGFzeW5jX3N0b3JhZ2Vcblx0ICAgIC8vIGxpYnJhcnkgaW4gR2FpYSwgd2UgZG9uJ3QgbW9kaWZ5IHJldHVybiB2YWx1ZXMgYXQgYWxsLiBJZiBhIGtleSdzIHZhbHVlXG5cdCAgICAvLyBpcyBgdW5kZWZpbmVkYCwgd2UgcGFzcyB0aGF0IHZhbHVlIHRvIHRoZSBjYWxsYmFjayBmdW5jdGlvbi5cblx0ICAgIGZ1bmN0aW9uIGdldEl0ZW0oa2V5LCBjYWxsYmFjaykge1xuXHQgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuXHQgICAgICAgIC8vIENhc3QgdGhlIGtleSB0byBhIHN0cmluZywgYXMgdGhhdCdzIGFsbCB3ZSBjYW4gc2V0IGFzIGEga2V5LlxuXHQgICAgICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgICBnbG9iYWxPYmplY3QuY29uc29sZS53YXJuKGtleSArICcgdXNlZCBhcyBhIGtleSwgYnV0IGl0IGlzIG5vdCBhIHN0cmluZy4nKTtcblx0ICAgICAgICAgICAga2V5ID0gU3RyaW5nKGtleSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHByb21pc2UgPSBzZWxmLnJlYWR5KCkudGhlbihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIHZhciBkYkluZm8gPSBzZWxmLl9kYkluZm87XG5cdCAgICAgICAgICAgIHZhciByZXN1bHQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShkYkluZm8ua2V5UHJlZml4ICsga2V5KTtcblxuXHQgICAgICAgICAgICAvLyBJZiBhIHJlc3VsdCB3YXMgZm91bmQsIHBhcnNlIGl0IGZyb20gdGhlIHNlcmlhbGl6ZWRcblx0ICAgICAgICAgICAgLy8gc3RyaW5nIGludG8gYSBKUyBvYmplY3QuIElmIHJlc3VsdCBpc24ndCB0cnV0aHksIHRoZSBrZXlcblx0ICAgICAgICAgICAgLy8gaXMgbGlrZWx5IHVuZGVmaW5lZCBhbmQgd2UnbGwgcGFzcyBpdCBzdHJhaWdodCB0byB0aGVcblx0ICAgICAgICAgICAgLy8gY2FsbGJhY2suXG5cdCAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcblx0ICAgICAgICAgICAgICAgIHJlc3VsdCA9IGRiSW5mby5zZXJpYWxpemVyLmRlc2VyaWFsaXplKHJlc3VsdCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKTtcblx0ICAgICAgICByZXR1cm4gcHJvbWlzZTtcblx0ICAgIH1cblxuXHQgICAgLy8gSXRlcmF0ZSBvdmVyIGFsbCBpdGVtcyBpbiB0aGUgc3RvcmUuXG5cdCAgICBmdW5jdGlvbiBpdGVyYXRlKGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuXHQgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuXHQgICAgICAgIHZhciBwcm9taXNlID0gc2VsZi5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICB2YXIgZGJJbmZvID0gc2VsZi5fZGJJbmZvO1xuXHQgICAgICAgICAgICB2YXIga2V5UHJlZml4ID0gZGJJbmZvLmtleVByZWZpeDtcblx0ICAgICAgICAgICAgdmFyIGtleVByZWZpeExlbmd0aCA9IGtleVByZWZpeC5sZW5ndGg7XG5cdCAgICAgICAgICAgIHZhciBsZW5ndGggPSBsb2NhbFN0b3JhZ2UubGVuZ3RoO1xuXG5cdCAgICAgICAgICAgIC8vIFdlIHVzZSBhIGRlZGljYXRlZCBpdGVyYXRvciBpbnN0ZWFkIG9mIHRoZSBgaWAgdmFyaWFibGUgYmVsb3dcblx0ICAgICAgICAgICAgLy8gc28gb3RoZXIga2V5cyB3ZSBmZXRjaCBpbiBsb2NhbFN0b3JhZ2UgYXJlbid0IGNvdW50ZWQgaW5cblx0ICAgICAgICAgICAgLy8gdGhlIGBpdGVyYXRpb25OdW1iZXJgIGFyZ3VtZW50IHBhc3NlZCB0byB0aGUgYGl0ZXJhdGUoKWBcblx0ICAgICAgICAgICAgLy8gY2FsbGJhY2suXG5cdCAgICAgICAgICAgIC8vXG5cdCAgICAgICAgICAgIC8vIFNlZTogZ2l0aHViLmNvbS9tb3ppbGxhL2xvY2FsRm9yYWdlL3B1bGwvNDM1I2Rpc2N1c3Npb25fcjM4MDYxNTMwXG5cdCAgICAgICAgICAgIHZhciBpdGVyYXRpb25OdW1iZXIgPSAxO1xuXG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIHZhciBrZXkgPSBsb2NhbFN0b3JhZ2Uua2V5KGkpO1xuXHQgICAgICAgICAgICAgICAgaWYgKGtleS5pbmRleE9mKGtleVByZWZpeCkgIT09IDApIHtcblx0ICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSk7XG5cblx0ICAgICAgICAgICAgICAgIC8vIElmIGEgcmVzdWx0IHdhcyBmb3VuZCwgcGFyc2UgaXQgZnJvbSB0aGUgc2VyaWFsaXplZFxuXHQgICAgICAgICAgICAgICAgLy8gc3RyaW5nIGludG8gYSBKUyBvYmplY3QuIElmIHJlc3VsdCBpc24ndCB0cnV0aHksIHRoZVxuXHQgICAgICAgICAgICAgICAgLy8ga2V5IGlzIGxpa2VseSB1bmRlZmluZWQgYW5kIHdlJ2xsIHBhc3MgaXQgc3RyYWlnaHRcblx0ICAgICAgICAgICAgICAgIC8vIHRvIHRoZSBpdGVyYXRvci5cblx0ICAgICAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gZGJJbmZvLnNlcmlhbGl6ZXIuZGVzZXJpYWxpemUodmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICB2YWx1ZSA9IGl0ZXJhdG9yKHZhbHVlLCBrZXkuc3Vic3RyaW5nKGtleVByZWZpeExlbmd0aCksIGl0ZXJhdGlvbk51bWJlcisrKTtcblxuXHQgICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB2b2lkIDApIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIGV4ZWN1dGVDYWxsYmFjayhwcm9taXNlLCBjYWxsYmFjayk7XG5cdCAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cdCAgICB9XG5cblx0ICAgIC8vIFNhbWUgYXMgbG9jYWxTdG9yYWdlJ3Mga2V5KCkgbWV0aG9kLCBleGNlcHQgdGFrZXMgYSBjYWxsYmFjay5cblx0ICAgIGZ1bmN0aW9uIGtleShuLCBjYWxsYmFjaykge1xuXHQgICAgICAgIHZhciBzZWxmID0gdGhpcztcblx0ICAgICAgICB2YXIgcHJvbWlzZSA9IHNlbGYucmVhZHkoKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgdmFyIGRiSW5mbyA9IHNlbGYuX2RiSW5mbztcblx0ICAgICAgICAgICAgdmFyIHJlc3VsdDtcblx0ICAgICAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgICAgIHJlc3VsdCA9IGxvY2FsU3RvcmFnZS5rZXkobik7XG5cdCAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG5cdCAgICAgICAgICAgICAgICByZXN1bHQgPSBudWxsO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBwcmVmaXggZnJvbSB0aGUga2V5LCBpZiBhIGtleSBpcyBmb3VuZC5cblx0ICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xuXHQgICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnN1YnN0cmluZyhkYkluZm8ua2V5UHJlZml4Lmxlbmd0aCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKTtcblx0ICAgICAgICByZXR1cm4gcHJvbWlzZTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24ga2V5cyhjYWxsYmFjaykge1xuXHQgICAgICAgIHZhciBzZWxmID0gdGhpcztcblx0ICAgICAgICB2YXIgcHJvbWlzZSA9IHNlbGYucmVhZHkoKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgdmFyIGRiSW5mbyA9IHNlbGYuX2RiSW5mbztcblx0ICAgICAgICAgICAgdmFyIGxlbmd0aCA9IGxvY2FsU3RvcmFnZS5sZW5ndGg7XG5cdCAgICAgICAgICAgIHZhciBrZXlzID0gW107XG5cblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgaWYgKGxvY2FsU3RvcmFnZS5rZXkoaSkuaW5kZXhPZihkYkluZm8ua2V5UHJlZml4KSA9PT0gMCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGtleXMucHVzaChsb2NhbFN0b3JhZ2Uua2V5KGkpLnN1YnN0cmluZyhkYkluZm8ua2V5UHJlZml4Lmxlbmd0aCkpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmV0dXJuIGtleXM7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICAvLyBTdXBwbHkgdGhlIG51bWJlciBvZiBrZXlzIGluIHRoZSBkYXRhc3RvcmUgdG8gdGhlIGNhbGxiYWNrIGZ1bmN0aW9uLlxuXHQgICAgZnVuY3Rpb24gbGVuZ3RoKGNhbGxiYWNrKSB7XG5cdCAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXHQgICAgICAgIHZhciBwcm9taXNlID0gc2VsZi5rZXlzKCkudGhlbihmdW5jdGlvbiAoa2V5cykge1xuXHQgICAgICAgICAgICByZXR1cm4ga2V5cy5sZW5ndGg7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICAvLyBSZW1vdmUgYW4gaXRlbSBmcm9tIHRoZSBzdG9yZSwgbmljZSBhbmQgc2ltcGxlLlxuXHQgICAgZnVuY3Rpb24gcmVtb3ZlSXRlbShrZXksIGNhbGxiYWNrKSB7XG5cdCAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG5cdCAgICAgICAgLy8gQ2FzdCB0aGUga2V5IHRvIGEgc3RyaW5nLCBhcyB0aGF0J3MgYWxsIHdlIGNhbiBzZXQgYXMgYSBrZXkuXG5cdCAgICAgICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICAgIGdsb2JhbE9iamVjdC5jb25zb2xlLndhcm4oa2V5ICsgJyB1c2VkIGFzIGEga2V5LCBidXQgaXQgaXMgbm90IGEgc3RyaW5nLicpO1xuXHQgICAgICAgICAgICBrZXkgPSBTdHJpbmcoa2V5KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgcHJvbWlzZSA9IHNlbGYucmVhZHkoKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgdmFyIGRiSW5mbyA9IHNlbGYuX2RiSW5mbztcblx0ICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oZGJJbmZvLmtleVByZWZpeCArIGtleSk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICAvLyBTZXQgYSBrZXkncyB2YWx1ZSBhbmQgcnVuIGFuIG9wdGlvbmFsIGNhbGxiYWNrIG9uY2UgdGhlIHZhbHVlIGlzIHNldC5cblx0ICAgIC8vIFVubGlrZSBHYWlhJ3MgaW1wbGVtZW50YXRpb24sIHRoZSBjYWxsYmFjayBmdW5jdGlvbiBpcyBwYXNzZWQgdGhlIHZhbHVlLFxuXHQgICAgLy8gaW4gY2FzZSB5b3Ugd2FudCB0byBvcGVyYXRlIG9uIHRoYXQgdmFsdWUgb25seSBhZnRlciB5b3UncmUgc3VyZSBpdFxuXHQgICAgLy8gc2F2ZWQsIG9yIHNvbWV0aGluZyBsaWtlIHRoYXQuXG5cdCAgICBmdW5jdGlvbiBzZXRJdGVtKGtleSwgdmFsdWUsIGNhbGxiYWNrKSB7XG5cdCAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG5cdCAgICAgICAgLy8gQ2FzdCB0aGUga2V5IHRvIGEgc3RyaW5nLCBhcyB0aGF0J3MgYWxsIHdlIGNhbiBzZXQgYXMgYSBrZXkuXG5cdCAgICAgICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICAgIGdsb2JhbE9iamVjdC5jb25zb2xlLndhcm4oa2V5ICsgJyB1c2VkIGFzIGEga2V5LCBidXQgaXQgaXMgbm90IGEgc3RyaW5nLicpO1xuXHQgICAgICAgICAgICBrZXkgPSBTdHJpbmcoa2V5KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgcHJvbWlzZSA9IHNlbGYucmVhZHkoKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgLy8gQ29udmVydCB1bmRlZmluZWQgdmFsdWVzIHRvIG51bGwuXG5cdCAgICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb3ppbGxhL2xvY2FsRm9yYWdlL3B1bGwvNDJcblx0ICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgIHZhbHVlID0gbnVsbDtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8vIFNhdmUgdGhlIG9yaWdpbmFsIHZhbHVlIHRvIHBhc3MgdG8gdGhlIGNhbGxiYWNrLlxuXHQgICAgICAgICAgICB2YXIgb3JpZ2luYWxWYWx1ZSA9IHZhbHVlO1xuXG5cdCAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgZGJJbmZvID0gc2VsZi5fZGJJbmZvO1xuXHQgICAgICAgICAgICAgICAgZGJJbmZvLnNlcmlhbGl6ZXIuc2VyaWFsaXplKHZhbHVlLCBmdW5jdGlvbiAodmFsdWUsIGVycm9yKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGRiSW5mby5rZXlQcmVmaXggKyBrZXksIHZhbHVlKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUob3JpZ2luYWxWYWx1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxvY2FsU3RvcmFnZSBjYXBhY2l0eSBleGNlZWRlZC5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IE1ha2UgdGhpcyBhIHNwZWNpZmljIGVycm9yL2V2ZW50LlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUubmFtZSA9PT0gJ1F1b3RhRXhjZWVkZWRFcnJvcicgfHwgZS5uYW1lID09PSAnTlNfRVJST1JfRE9NX1FVT1RBX1JFQUNIRUQnKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKTtcblx0ICAgICAgICByZXR1cm4gcHJvbWlzZTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKSB7XG5cdCAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG5cdCAgICAgICAgICAgIHByb21pc2UudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG5cdCAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHQpO1xuXHQgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcblx0ICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycm9yKTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICB2YXIgbG9jYWxTdG9yYWdlV3JhcHBlciA9IHtcblx0ICAgICAgICBfZHJpdmVyOiAnbG9jYWxTdG9yYWdlV3JhcHBlcicsXG5cdCAgICAgICAgX2luaXRTdG9yYWdlOiBfaW5pdFN0b3JhZ2UsXG5cdCAgICAgICAgLy8gRGVmYXVsdCBBUEksIGZyb20gR2FpYS9sb2NhbFN0b3JhZ2UuXG5cdCAgICAgICAgaXRlcmF0ZTogaXRlcmF0ZSxcblx0ICAgICAgICBnZXRJdGVtOiBnZXRJdGVtLFxuXHQgICAgICAgIHNldEl0ZW06IHNldEl0ZW0sXG5cdCAgICAgICAgcmVtb3ZlSXRlbTogcmVtb3ZlSXRlbSxcblx0ICAgICAgICBjbGVhcjogY2xlYXIsXG5cdCAgICAgICAgbGVuZ3RoOiBsZW5ndGgsXG5cdCAgICAgICAga2V5OiBrZXksXG5cdCAgICAgICAga2V5czoga2V5c1xuXHQgICAgfTtcblxuXHQgICAgZXhwb3J0c1snZGVmYXVsdCddID0gbG9jYWxTdG9yYWdlV3JhcHBlcjtcblx0fSkuY2FsbCh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHNlbGYpO1xuXHRtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcblxuLyoqKi8gfSxcbi8qIDMgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHRleHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXHQoZnVuY3Rpb24gKCkge1xuXHQgICAgJ3VzZSBzdHJpY3QnO1xuXG5cdCAgICAvLyBTYWRseSwgdGhlIGJlc3Qgd2F5IHRvIHNhdmUgYmluYXJ5IGRhdGEgaW4gV2ViU1FML2xvY2FsU3RvcmFnZSBpcyBzZXJpYWxpemluZ1xuXHQgICAgLy8gaXQgdG8gQmFzZTY0LCBzbyB0aGlzIGlzIGhvdyB3ZSBzdG9yZSBpdCB0byBwcmV2ZW50IHZlcnkgc3RyYW5nZSBlcnJvcnMgd2l0aCBsZXNzXG5cdCAgICAvLyB2ZXJib3NlIHdheXMgb2YgYmluYXJ5IDwtPiBzdHJpbmcgZGF0YSBzdG9yYWdlLlxuXHQgICAgdmFyIEJBU0VfQ0hBUlMgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyc7XG5cblx0ICAgIHZhciBCTE9CX1RZUEVfUFJFRklYID0gJ35+bG9jYWxfZm9yYWdlX3R5cGV+Jztcblx0ICAgIHZhciBCTE9CX1RZUEVfUFJFRklYX1JFR0VYID0gL15+fmxvY2FsX2ZvcmFnZV90eXBlfihbXn5dKyl+LztcblxuXHQgICAgdmFyIFNFUklBTElaRURfTUFSS0VSID0gJ19fbGZzY19fOic7XG5cdCAgICB2YXIgU0VSSUFMSVpFRF9NQVJLRVJfTEVOR1RIID0gU0VSSUFMSVpFRF9NQVJLRVIubGVuZ3RoO1xuXG5cdCAgICAvLyBPTUcgdGhlIHNlcmlhbGl6YXRpb25zIVxuXHQgICAgdmFyIFRZUEVfQVJSQVlCVUZGRVIgPSAnYXJiZic7XG5cdCAgICB2YXIgVFlQRV9CTE9CID0gJ2Jsb2InO1xuXHQgICAgdmFyIFRZUEVfSU5UOEFSUkFZID0gJ3NpMDgnO1xuXHQgICAgdmFyIFRZUEVfVUlOVDhBUlJBWSA9ICd1aTA4Jztcblx0ICAgIHZhciBUWVBFX1VJTlQ4Q0xBTVBFREFSUkFZID0gJ3VpYzgnO1xuXHQgICAgdmFyIFRZUEVfSU5UMTZBUlJBWSA9ICdzaTE2Jztcblx0ICAgIHZhciBUWVBFX0lOVDMyQVJSQVkgPSAnc2kzMic7XG5cdCAgICB2YXIgVFlQRV9VSU5UMTZBUlJBWSA9ICd1cjE2Jztcblx0ICAgIHZhciBUWVBFX1VJTlQzMkFSUkFZID0gJ3VpMzInO1xuXHQgICAgdmFyIFRZUEVfRkxPQVQzMkFSUkFZID0gJ2ZsMzInO1xuXHQgICAgdmFyIFRZUEVfRkxPQVQ2NEFSUkFZID0gJ2ZsNjQnO1xuXHQgICAgdmFyIFRZUEVfU0VSSUFMSVpFRF9NQVJLRVJfTEVOR1RIID0gU0VSSUFMSVpFRF9NQVJLRVJfTEVOR1RIICsgVFlQRV9BUlJBWUJVRkZFUi5sZW5ndGg7XG5cblx0ICAgIC8vIEdldCBvdXQgb2Ygb3VyIGhhYml0IG9mIHVzaW5nIGB3aW5kb3dgIGlubGluZSwgYXQgbGVhc3QuXG5cdCAgICB2YXIgZ2xvYmFsT2JqZWN0ID0gdGhpcztcblxuXHQgICAgLy8gQWJzdHJhY3RzIGNvbnN0cnVjdGluZyBhIEJsb2Igb2JqZWN0LCBzbyBpdCBhbHNvIHdvcmtzIGluIG9sZGVyXG5cdCAgICAvLyBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgdGhlIG5hdGl2ZSBCbG9iIGNvbnN0cnVjdG9yLiAoaS5lLlxuXHQgICAgLy8gb2xkIFF0V2ViS2l0IHZlcnNpb25zLCBhdCBsZWFzdCkuXG5cdCAgICBmdW5jdGlvbiBfY3JlYXRlQmxvYihwYXJ0cywgcHJvcGVydGllcykge1xuXHQgICAgICAgIHBhcnRzID0gcGFydHMgfHwgW107XG5cdCAgICAgICAgcHJvcGVydGllcyA9IHByb3BlcnRpZXMgfHwge307XG5cblx0ICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICByZXR1cm4gbmV3IEJsb2IocGFydHMsIHByb3BlcnRpZXMpO1xuXHQgICAgICAgIH0gY2F0Y2ggKGVycikge1xuXHQgICAgICAgICAgICBpZiAoZXJyLm5hbWUgIT09ICdUeXBlRXJyb3InKSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICB2YXIgQmxvYkJ1aWxkZXIgPSBnbG9iYWxPYmplY3QuQmxvYkJ1aWxkZXIgfHwgZ2xvYmFsT2JqZWN0Lk1TQmxvYkJ1aWxkZXIgfHwgZ2xvYmFsT2JqZWN0Lk1vekJsb2JCdWlsZGVyIHx8IGdsb2JhbE9iamVjdC5XZWJLaXRCbG9iQnVpbGRlcjtcblxuXHQgICAgICAgICAgICB2YXIgYnVpbGRlciA9IG5ldyBCbG9iQnVpbGRlcigpO1xuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSArPSAxKSB7XG5cdCAgICAgICAgICAgICAgICBidWlsZGVyLmFwcGVuZChwYXJ0c1tpXSk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4gYnVpbGRlci5nZXRCbG9iKHByb3BlcnRpZXMudHlwZSk7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICAvLyBTZXJpYWxpemUgYSB2YWx1ZSwgYWZ0ZXJ3YXJkcyBleGVjdXRpbmcgYSBjYWxsYmFjayAod2hpY2ggdXN1YWxseVxuXHQgICAgLy8gaW5zdHJ1Y3RzIHRoZSBgc2V0SXRlbSgpYCBjYWxsYmFjay9wcm9taXNlIHRvIGJlIGV4ZWN1dGVkKS4gVGhpcyBpcyBob3dcblx0ICAgIC8vIHdlIHN0b3JlIGJpbmFyeSBkYXRhIHdpdGggbG9jYWxTdG9yYWdlLlxuXHQgICAgZnVuY3Rpb24gc2VyaWFsaXplKHZhbHVlLCBjYWxsYmFjaykge1xuXHQgICAgICAgIHZhciB2YWx1ZVN0cmluZyA9ICcnO1xuXHQgICAgICAgIGlmICh2YWx1ZSkge1xuXHQgICAgICAgICAgICB2YWx1ZVN0cmluZyA9IHZhbHVlLnRvU3RyaW5nKCk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gQ2Fubm90IHVzZSBgdmFsdWUgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcmAgb3Igc3VjaCBoZXJlLCBhcyB0aGVzZVxuXHQgICAgICAgIC8vIGNoZWNrcyBmYWlsIHdoZW4gcnVubmluZyB0aGUgdGVzdHMgdXNpbmcgY2FzcGVyLmpzLi4uXG5cdCAgICAgICAgLy9cblx0ICAgICAgICAvLyBUT0RPOiBTZWUgd2h5IHRob3NlIHRlc3RzIGZhaWwgYW5kIHVzZSBhIGJldHRlciBzb2x1dGlvbi5cblx0ICAgICAgICBpZiAodmFsdWUgJiYgKHZhbHVlLnRvU3RyaW5nKCkgPT09ICdbb2JqZWN0IEFycmF5QnVmZmVyXScgfHwgdmFsdWUuYnVmZmVyICYmIHZhbHVlLmJ1ZmZlci50b1N0cmluZygpID09PSAnW29iamVjdCBBcnJheUJ1ZmZlcl0nKSkge1xuXHQgICAgICAgICAgICAvLyBDb252ZXJ0IGJpbmFyeSBhcnJheXMgdG8gYSBzdHJpbmcgYW5kIHByZWZpeCB0aGUgc3RyaW5nIHdpdGhcblx0ICAgICAgICAgICAgLy8gYSBzcGVjaWFsIG1hcmtlci5cblx0ICAgICAgICAgICAgdmFyIGJ1ZmZlcjtcblx0ICAgICAgICAgICAgdmFyIG1hcmtlciA9IFNFUklBTElaRURfTUFSS0VSO1xuXG5cdCAgICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG5cdCAgICAgICAgICAgICAgICBidWZmZXIgPSB2YWx1ZTtcblx0ICAgICAgICAgICAgICAgIG1hcmtlciArPSBUWVBFX0FSUkFZQlVGRkVSO1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgYnVmZmVyID0gdmFsdWUuYnVmZmVyO1xuXG5cdCAgICAgICAgICAgICAgICBpZiAodmFsdWVTdHJpbmcgPT09ICdbb2JqZWN0IEludDhBcnJheV0nKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgbWFya2VyICs9IFRZUEVfSU5UOEFSUkFZO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZVN0cmluZyA9PT0gJ1tvYmplY3QgVWludDhBcnJheV0nKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgbWFya2VyICs9IFRZUEVfVUlOVDhBUlJBWTtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWVTdHJpbmcgPT09ICdbb2JqZWN0IFVpbnQ4Q2xhbXBlZEFycmF5XScpIHtcblx0ICAgICAgICAgICAgICAgICAgICBtYXJrZXIgKz0gVFlQRV9VSU5UOENMQU1QRURBUlJBWTtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWVTdHJpbmcgPT09ICdbb2JqZWN0IEludDE2QXJyYXldJykge1xuXHQgICAgICAgICAgICAgICAgICAgIG1hcmtlciArPSBUWVBFX0lOVDE2QVJSQVk7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlU3RyaW5nID09PSAnW29iamVjdCBVaW50MTZBcnJheV0nKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgbWFya2VyICs9IFRZUEVfVUlOVDE2QVJSQVk7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlU3RyaW5nID09PSAnW29iamVjdCBJbnQzMkFycmF5XScpIHtcblx0ICAgICAgICAgICAgICAgICAgICBtYXJrZXIgKz0gVFlQRV9JTlQzMkFSUkFZO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZVN0cmluZyA9PT0gJ1tvYmplY3QgVWludDMyQXJyYXldJykge1xuXHQgICAgICAgICAgICAgICAgICAgIG1hcmtlciArPSBUWVBFX1VJTlQzMkFSUkFZO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZVN0cmluZyA9PT0gJ1tvYmplY3QgRmxvYXQzMkFycmF5XScpIHtcblx0ICAgICAgICAgICAgICAgICAgICBtYXJrZXIgKz0gVFlQRV9GTE9BVDMyQVJSQVk7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlU3RyaW5nID09PSAnW29iamVjdCBGbG9hdDY0QXJyYXldJykge1xuXHQgICAgICAgICAgICAgICAgICAgIG1hcmtlciArPSBUWVBFX0ZMT0FUNjRBUlJBWTtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKCdGYWlsZWQgdG8gZ2V0IHR5cGUgZm9yIEJpbmFyeUFycmF5JykpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgY2FsbGJhY2sobWFya2VyICsgYnVmZmVyVG9TdHJpbmcoYnVmZmVyKSk7XG5cdCAgICAgICAgfSBlbHNlIGlmICh2YWx1ZVN0cmluZyA9PT0gJ1tvYmplY3QgQmxvYl0nKSB7XG5cdCAgICAgICAgICAgIC8vIENvbnZlciB0aGUgYmxvYiB0byBhIGJpbmFyeUFycmF5IGFuZCB0aGVuIHRvIGEgc3RyaW5nLlxuXHQgICAgICAgICAgICB2YXIgZmlsZVJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cblx0ICAgICAgICAgICAgZmlsZVJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAvLyBCYWNrd2FyZHMtY29tcGF0aWJsZSBwcmVmaXggZm9yIHRoZSBibG9iIHR5cGUuXG5cdCAgICAgICAgICAgICAgICB2YXIgc3RyID0gQkxPQl9UWVBFX1BSRUZJWCArIHZhbHVlLnR5cGUgKyAnficgKyBidWZmZXJUb1N0cmluZyh0aGlzLnJlc3VsdCk7XG5cblx0ICAgICAgICAgICAgICAgIGNhbGxiYWNrKFNFUklBTElaRURfTUFSS0VSICsgVFlQRV9CTE9CICsgc3RyKTtcblx0ICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICBmaWxlUmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKHZhbHVlKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICAgICAgY2FsbGJhY2soSlNPTi5zdHJpbmdpZnkodmFsdWUpKTtcblx0ICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuXHQgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkNvdWxkbid0IGNvbnZlcnQgdmFsdWUgaW50byBhIEpTT04gc3RyaW5nOiBcIiwgdmFsdWUpO1xuXG5cdCAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCBlKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgLy8gRGVzZXJpYWxpemUgZGF0YSB3ZSd2ZSBpbnNlcnRlZCBpbnRvIGEgdmFsdWUgY29sdW1uL2ZpZWxkLiBXZSBwbGFjZVxuXHQgICAgLy8gc3BlY2lhbCBtYXJrZXJzIGludG8gb3VyIHN0cmluZ3MgdG8gbWFyayB0aGVtIGFzIGVuY29kZWQ7IHRoaXMgaXNuJ3Rcblx0ICAgIC8vIGFzIG5pY2UgYXMgYSBtZXRhIGZpZWxkLCBidXQgaXQncyB0aGUgb25seSBzYW5lIHRoaW5nIHdlIGNhbiBkbyB3aGlsc3Rcblx0ICAgIC8vIGtlZXBpbmcgbG9jYWxTdG9yYWdlIHN1cHBvcnQgaW50YWN0LlxuXHQgICAgLy9cblx0ICAgIC8vIE9mdGVudGltZXMgdGhpcyB3aWxsIGp1c3QgZGVzZXJpYWxpemUgSlNPTiBjb250ZW50LCBidXQgaWYgd2UgaGF2ZSBhXG5cdCAgICAvLyBzcGVjaWFsIG1hcmtlciAoU0VSSUFMSVpFRF9NQVJLRVIsIGRlZmluZWQgYWJvdmUpLCB3ZSB3aWxsIGV4dHJhY3Rcblx0ICAgIC8vIHNvbWUga2luZCBvZiBhcnJheWJ1ZmZlci9iaW5hcnkgZGF0YS90eXBlZCBhcnJheSBvdXQgb2YgdGhlIHN0cmluZy5cblx0ICAgIGZ1bmN0aW9uIGRlc2VyaWFsaXplKHZhbHVlKSB7XG5cdCAgICAgICAgLy8gSWYgd2UgaGF2ZW4ndCBtYXJrZWQgdGhpcyBzdHJpbmcgYXMgYmVpbmcgc3BlY2lhbGx5IHNlcmlhbGl6ZWQgKGkuZS5cblx0ICAgICAgICAvLyBzb21ldGhpbmcgb3RoZXIgdGhhbiBzZXJpYWxpemVkIEpTT04pLCB3ZSBjYW4ganVzdCByZXR1cm4gaXQgYW5kIGJlXG5cdCAgICAgICAgLy8gZG9uZSB3aXRoIGl0LlxuXHQgICAgICAgIGlmICh2YWx1ZS5zdWJzdHJpbmcoMCwgU0VSSUFMSVpFRF9NQVJLRVJfTEVOR1RIKSAhPT0gU0VSSUFMSVpFRF9NQVJLRVIpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UodmFsdWUpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgY29kZSBkZWFscyB3aXRoIGRlc2VyaWFsaXppbmcgc29tZSBraW5kIG9mIEJsb2Igb3Jcblx0ICAgICAgICAvLyBUeXBlZEFycmF5LiBGaXJzdCB3ZSBzZXBhcmF0ZSBvdXQgdGhlIHR5cGUgb2YgZGF0YSB3ZSdyZSBkZWFsaW5nXG5cdCAgICAgICAgLy8gd2l0aCBmcm9tIHRoZSBkYXRhIGl0c2VsZi5cblx0ICAgICAgICB2YXIgc2VyaWFsaXplZFN0cmluZyA9IHZhbHVlLnN1YnN0cmluZyhUWVBFX1NFUklBTElaRURfTUFSS0VSX0xFTkdUSCk7XG5cdCAgICAgICAgdmFyIHR5cGUgPSB2YWx1ZS5zdWJzdHJpbmcoU0VSSUFMSVpFRF9NQVJLRVJfTEVOR1RILCBUWVBFX1NFUklBTElaRURfTUFSS0VSX0xFTkdUSCk7XG5cblx0ICAgICAgICB2YXIgYmxvYlR5cGU7XG5cdCAgICAgICAgLy8gQmFja3dhcmRzLWNvbXBhdGlibGUgYmxvYiB0eXBlIHNlcmlhbGl6YXRpb24gc3RyYXRlZ3kuXG5cdCAgICAgICAgLy8gREJzIGNyZWF0ZWQgd2l0aCBvbGRlciB2ZXJzaW9ucyBvZiBsb2NhbEZvcmFnZSB3aWxsIHNpbXBseSBub3QgaGF2ZSB0aGUgYmxvYiB0eXBlLlxuXHQgICAgICAgIGlmICh0eXBlID09PSBUWVBFX0JMT0IgJiYgQkxPQl9UWVBFX1BSRUZJWF9SRUdFWC50ZXN0KHNlcmlhbGl6ZWRTdHJpbmcpKSB7XG5cdCAgICAgICAgICAgIHZhciBtYXRjaGVyID0gc2VyaWFsaXplZFN0cmluZy5tYXRjaChCTE9CX1RZUEVfUFJFRklYX1JFR0VYKTtcblx0ICAgICAgICAgICAgYmxvYlR5cGUgPSBtYXRjaGVyWzFdO1xuXHQgICAgICAgICAgICBzZXJpYWxpemVkU3RyaW5nID0gc2VyaWFsaXplZFN0cmluZy5zdWJzdHJpbmcobWF0Y2hlclswXS5sZW5ndGgpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICB2YXIgYnVmZmVyID0gc3RyaW5nVG9CdWZmZXIoc2VyaWFsaXplZFN0cmluZyk7XG5cblx0ICAgICAgICAvLyBSZXR1cm4gdGhlIHJpZ2h0IHR5cGUgYmFzZWQgb24gdGhlIGNvZGUvdHlwZSBzZXQgZHVyaW5nXG5cdCAgICAgICAgLy8gc2VyaWFsaXphdGlvbi5cblx0ICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcblx0ICAgICAgICAgICAgY2FzZSBUWVBFX0FSUkFZQlVGRkVSOlxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcblx0ICAgICAgICAgICAgY2FzZSBUWVBFX0JMT0I6XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gX2NyZWF0ZUJsb2IoW2J1ZmZlcl0sIHsgdHlwZTogYmxvYlR5cGUgfSk7XG5cdCAgICAgICAgICAgIGNhc2UgVFlQRV9JTlQ4QVJSQVk6XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEludDhBcnJheShidWZmZXIpO1xuXHQgICAgICAgICAgICBjYXNlIFRZUEVfVUlOVDhBUlJBWTpcblx0ICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheShidWZmZXIpO1xuXHQgICAgICAgICAgICBjYXNlIFRZUEVfVUlOVDhDTEFNUEVEQVJSQVk6XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGJ1ZmZlcik7XG5cdCAgICAgICAgICAgIGNhc2UgVFlQRV9JTlQxNkFSUkFZOlxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBJbnQxNkFycmF5KGJ1ZmZlcik7XG5cdCAgICAgICAgICAgIGNhc2UgVFlQRV9VSU5UMTZBUlJBWTpcblx0ICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVWludDE2QXJyYXkoYnVmZmVyKTtcblx0ICAgICAgICAgICAgY2FzZSBUWVBFX0lOVDMyQVJSQVk6XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEludDMyQXJyYXkoYnVmZmVyKTtcblx0ICAgICAgICAgICAgY2FzZSBUWVBFX1VJTlQzMkFSUkFZOlxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBVaW50MzJBcnJheShidWZmZXIpO1xuXHQgICAgICAgICAgICBjYXNlIFRZUEVfRkxPQVQzMkFSUkFZOlxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoYnVmZmVyKTtcblx0ICAgICAgICAgICAgY2FzZSBUWVBFX0ZMT0FUNjRBUlJBWTpcblx0ICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRmxvYXQ2NEFycmF5KGJ1ZmZlcik7XG5cdCAgICAgICAgICAgIGRlZmF1bHQ6XG5cdCAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua293biB0eXBlOiAnICsgdHlwZSk7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBzdHJpbmdUb0J1ZmZlcihzZXJpYWxpemVkU3RyaW5nKSB7XG5cdCAgICAgICAgLy8gRmlsbCB0aGUgc3RyaW5nIGludG8gYSBBcnJheUJ1ZmZlci5cblx0ICAgICAgICB2YXIgYnVmZmVyTGVuZ3RoID0gc2VyaWFsaXplZFN0cmluZy5sZW5ndGggKiAwLjc1O1xuXHQgICAgICAgIHZhciBsZW4gPSBzZXJpYWxpemVkU3RyaW5nLmxlbmd0aDtcblx0ICAgICAgICB2YXIgaTtcblx0ICAgICAgICB2YXIgcCA9IDA7XG5cdCAgICAgICAgdmFyIGVuY29kZWQxLCBlbmNvZGVkMiwgZW5jb2RlZDMsIGVuY29kZWQ0O1xuXG5cdCAgICAgICAgaWYgKHNlcmlhbGl6ZWRTdHJpbmdbc2VyaWFsaXplZFN0cmluZy5sZW5ndGggLSAxXSA9PT0gJz0nKSB7XG5cdCAgICAgICAgICAgIGJ1ZmZlckxlbmd0aC0tO1xuXHQgICAgICAgICAgICBpZiAoc2VyaWFsaXplZFN0cmluZ1tzZXJpYWxpemVkU3RyaW5nLmxlbmd0aCAtIDJdID09PSAnPScpIHtcblx0ICAgICAgICAgICAgICAgIGJ1ZmZlckxlbmd0aC0tO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihidWZmZXJMZW5ndGgpO1xuXHQgICAgICAgIHZhciBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG5cblx0ICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcblx0ICAgICAgICAgICAgZW5jb2RlZDEgPSBCQVNFX0NIQVJTLmluZGV4T2Yoc2VyaWFsaXplZFN0cmluZ1tpXSk7XG5cdCAgICAgICAgICAgIGVuY29kZWQyID0gQkFTRV9DSEFSUy5pbmRleE9mKHNlcmlhbGl6ZWRTdHJpbmdbaSArIDFdKTtcblx0ICAgICAgICAgICAgZW5jb2RlZDMgPSBCQVNFX0NIQVJTLmluZGV4T2Yoc2VyaWFsaXplZFN0cmluZ1tpICsgMl0pO1xuXHQgICAgICAgICAgICBlbmNvZGVkNCA9IEJBU0VfQ0hBUlMuaW5kZXhPZihzZXJpYWxpemVkU3RyaW5nW2kgKyAzXSk7XG5cblx0ICAgICAgICAgICAgLypqc2xpbnQgYml0d2lzZTogdHJ1ZSAqL1xuXHQgICAgICAgICAgICBieXRlc1twKytdID0gZW5jb2RlZDEgPDwgMiB8IGVuY29kZWQyID4+IDQ7XG5cdCAgICAgICAgICAgIGJ5dGVzW3ArK10gPSAoZW5jb2RlZDIgJiAxNSkgPDwgNCB8IGVuY29kZWQzID4+IDI7XG5cdCAgICAgICAgICAgIGJ5dGVzW3ArK10gPSAoZW5jb2RlZDMgJiAzKSA8PCA2IHwgZW5jb2RlZDQgJiA2Mztcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcblx0ICAgIH1cblxuXHQgICAgLy8gQ29udmVydHMgYSBidWZmZXIgdG8gYSBzdHJpbmcgdG8gc3RvcmUsIHNlcmlhbGl6ZWQsIGluIHRoZSBiYWNrZW5kXG5cdCAgICAvLyBzdG9yYWdlIGxpYnJhcnkuXG5cdCAgICBmdW5jdGlvbiBidWZmZXJUb1N0cmluZyhidWZmZXIpIHtcblx0ICAgICAgICAvLyBiYXNlNjQtYXJyYXlidWZmZXJcblx0ICAgICAgICB2YXIgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuXHQgICAgICAgIHZhciBiYXNlNjRTdHJpbmcgPSAnJztcblx0ICAgICAgICB2YXIgaTtcblxuXHQgICAgICAgIGZvciAoaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMykge1xuXHQgICAgICAgICAgICAvKmpzbGludCBiaXR3aXNlOiB0cnVlICovXG5cdCAgICAgICAgICAgIGJhc2U2NFN0cmluZyArPSBCQVNFX0NIQVJTW2J5dGVzW2ldID4+IDJdO1xuXHQgICAgICAgICAgICBiYXNlNjRTdHJpbmcgKz0gQkFTRV9DSEFSU1soYnl0ZXNbaV0gJiAzKSA8PCA0IHwgYnl0ZXNbaSArIDFdID4+IDRdO1xuXHQgICAgICAgICAgICBiYXNlNjRTdHJpbmcgKz0gQkFTRV9DSEFSU1soYnl0ZXNbaSArIDFdICYgMTUpIDw8IDIgfCBieXRlc1tpICsgMl0gPj4gNl07XG5cdCAgICAgICAgICAgIGJhc2U2NFN0cmluZyArPSBCQVNFX0NIQVJTW2J5dGVzW2kgKyAyXSAmIDYzXTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAoYnl0ZXMubGVuZ3RoICUgMyA9PT0gMikge1xuXHQgICAgICAgICAgICBiYXNlNjRTdHJpbmcgPSBiYXNlNjRTdHJpbmcuc3Vic3RyaW5nKDAsIGJhc2U2NFN0cmluZy5sZW5ndGggLSAxKSArICc9Jztcblx0ICAgICAgICB9IGVsc2UgaWYgKGJ5dGVzLmxlbmd0aCAlIDMgPT09IDEpIHtcblx0ICAgICAgICAgICAgYmFzZTY0U3RyaW5nID0gYmFzZTY0U3RyaW5nLnN1YnN0cmluZygwLCBiYXNlNjRTdHJpbmcubGVuZ3RoIC0gMikgKyAnPT0nO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBiYXNlNjRTdHJpbmc7XG5cdCAgICB9XG5cblx0ICAgIHZhciBsb2NhbGZvcmFnZVNlcmlhbGl6ZXIgPSB7XG5cdCAgICAgICAgc2VyaWFsaXplOiBzZXJpYWxpemUsXG5cdCAgICAgICAgZGVzZXJpYWxpemU6IGRlc2VyaWFsaXplLFxuXHQgICAgICAgIHN0cmluZ1RvQnVmZmVyOiBzdHJpbmdUb0J1ZmZlcixcblx0ICAgICAgICBidWZmZXJUb1N0cmluZzogYnVmZmVyVG9TdHJpbmdcblx0ICAgIH07XG5cblx0ICAgIGV4cG9ydHNbJ2RlZmF1bHQnXSA9IGxvY2FsZm9yYWdlU2VyaWFsaXplcjtcblx0fSkuY2FsbCh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHNlbGYpO1xuXHRtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcblxuLyoqKi8gfSxcbi8qIDQgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdC8qXG5cdCAqIEluY2x1ZGVzIGNvZGUgZnJvbTpcblx0ICpcblx0ICogYmFzZTY0LWFycmF5YnVmZmVyXG5cdCAqIGh0dHBzOi8vZ2l0aHViLmNvbS9uaWtsYXN2aC9iYXNlNjQtYXJyYXlidWZmZXJcblx0ICpcblx0ICogQ29weXJpZ2h0IChjKSAyMDEyIE5pa2xhcyB2b24gSGVydHplblxuXHQgKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cdCAqL1xuXHQndXNlIHN0cmljdCc7XG5cblx0ZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblx0KGZ1bmN0aW9uICgpIHtcblx0ICAgICd1c2Ugc3RyaWN0JztcblxuXHQgICAgdmFyIGdsb2JhbE9iamVjdCA9IHRoaXM7XG5cdCAgICB2YXIgb3BlbkRhdGFiYXNlID0gdGhpcy5vcGVuRGF0YWJhc2U7XG5cblx0ICAgIC8vIElmIFdlYlNRTCBtZXRob2RzIGFyZW4ndCBhdmFpbGFibGUsIHdlIGNhbiBzdG9wIG5vdy5cblx0ICAgIGlmICghb3BlbkRhdGFiYXNlKSB7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXG5cdCAgICAvLyBPcGVuIHRoZSBXZWJTUUwgZGF0YWJhc2UgKGF1dG9tYXRpY2FsbHkgY3JlYXRlcyBvbmUgaWYgb25lIGRpZG4ndFxuXHQgICAgLy8gcHJldmlvdXNseSBleGlzdCksIHVzaW5nIGFueSBvcHRpb25zIHNldCBpbiB0aGUgY29uZmlnLlxuXHQgICAgZnVuY3Rpb24gX2luaXRTdG9yYWdlKG9wdGlvbnMpIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cdCAgICAgICAgdmFyIGRiSW5mbyA9IHtcblx0ICAgICAgICAgICAgZGI6IG51bGxcblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgaWYgKG9wdGlvbnMpIHtcblx0ICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBvcHRpb25zKSB7XG5cdCAgICAgICAgICAgICAgICBkYkluZm9baV0gPSB0eXBlb2Ygb3B0aW9uc1tpXSAhPT0gJ3N0cmluZycgPyBvcHRpb25zW2ldLnRvU3RyaW5nKCkgOiBvcHRpb25zW2ldO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIGRiSW5mb1Byb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgIC8vIE9wZW4gdGhlIGRhdGFiYXNlOyB0aGUgb3BlbkRhdGFiYXNlIEFQSSB3aWxsIGF1dG9tYXRpY2FsbHlcblx0ICAgICAgICAgICAgLy8gY3JlYXRlIGl0IGZvciB1cyBpZiBpdCBkb2Vzbid0IGV4aXN0LlxuXHQgICAgICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICAgICAgZGJJbmZvLmRiID0gb3BlbkRhdGFiYXNlKGRiSW5mby5uYW1lLCBTdHJpbmcoZGJJbmZvLnZlcnNpb24pLCBkYkluZm8uZGVzY3JpcHRpb24sIGRiSW5mby5zaXplKTtcblx0ICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuc2V0RHJpdmVyKHNlbGYuTE9DQUxTVE9SQUdFKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5faW5pdFN0b3JhZ2Uob3B0aW9ucyk7XG5cdCAgICAgICAgICAgICAgICB9KS50aGVuKHJlc29sdmUpWydjYXRjaCddKHJlamVjdCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvLyBDcmVhdGUgb3VyIGtleS92YWx1ZSB0YWJsZSBpZiBpdCBkb2Vzbid0IGV4aXN0LlxuXHQgICAgICAgICAgICBkYkluZm8uZGIudHJhbnNhY3Rpb24oZnVuY3Rpb24gKHQpIHtcblx0ICAgICAgICAgICAgICAgIHQuZXhlY3V0ZVNxbCgnQ1JFQVRFIFRBQkxFIElGIE5PVCBFWElTVFMgJyArIGRiSW5mby5zdG9yZU5hbWUgKyAnIChpZCBJTlRFR0VSIFBSSU1BUlkgS0VZLCBrZXkgdW5pcXVlLCB2YWx1ZSknLCBbXSwgZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHNlbGYuX2RiSW5mbyA9IGRiSW5mbztcblx0ICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG5cdCAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAodCwgZXJyb3IpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgcmVzb2x2ZShfX3dlYnBhY2tfcmVxdWlyZV9fKDMpKTtcblx0ICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChsaWIpIHtcblx0ICAgICAgICAgICAgZGJJbmZvLnNlcmlhbGl6ZXIgPSBsaWI7XG5cdCAgICAgICAgICAgIHJldHVybiBkYkluZm9Qcm9taXNlO1xuXHQgICAgICAgIH0pO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBnZXRJdGVtKGtleSwgY2FsbGJhY2spIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgICAvLyBDYXN0IHRoZSBrZXkgdG8gYSBzdHJpbmcsIGFzIHRoYXQncyBhbGwgd2UgY2FuIHNldCBhcyBhIGtleS5cblx0ICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgZ2xvYmFsT2JqZWN0LmNvbnNvbGUud2FybihrZXkgKyAnIHVzZWQgYXMgYSBrZXksIGJ1dCBpdCBpcyBub3QgYSBzdHJpbmcuJyk7XG5cdCAgICAgICAgICAgIGtleSA9IFN0cmluZyhrZXkpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHQgICAgICAgICAgICBzZWxmLnJlYWR5KCkudGhlbihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgZGJJbmZvID0gc2VsZi5fZGJJbmZvO1xuXHQgICAgICAgICAgICAgICAgZGJJbmZvLmRiLnRyYW5zYWN0aW9uKGZ1bmN0aW9uICh0KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdC5leGVjdXRlU3FsKCdTRUxFQ1QgKiBGUk9NICcgKyBkYkluZm8uc3RvcmVOYW1lICsgJyBXSEVSRSBrZXkgPSA/IExJTUlUIDEnLCBba2V5XSwgZnVuY3Rpb24gKHQsIHJlc3VsdHMpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHJlc3VsdHMucm93cy5sZW5ndGggPyByZXN1bHRzLnJvd3MuaXRlbSgwKS52YWx1ZSA6IG51bGw7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoaXMgaXMgc2VyaWFsaXplZCBjb250ZW50IHdlIG5lZWQgdG9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLy8gdW5wYWNrLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBkYkluZm8uc2VyaWFsaXplci5kZXNlcmlhbGl6ZShyZXN1bHQpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuXHQgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICh0LCBlcnJvcikge1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG5cdCAgICAgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfSlbJ2NhdGNoJ10ocmVqZWN0KTtcblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIGV4ZWN1dGVDYWxsYmFjayhwcm9taXNlLCBjYWxsYmFjayk7XG5cdCAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGl0ZXJhdGUoaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG5cdCAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG5cdCAgICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgIHNlbGYucmVhZHkoKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBkYkluZm8gPSBzZWxmLl9kYkluZm87XG5cblx0ICAgICAgICAgICAgICAgIGRiSW5mby5kYi50cmFuc2FjdGlvbihmdW5jdGlvbiAodCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHQuZXhlY3V0ZVNxbCgnU0VMRUNUICogRlJPTSAnICsgZGJJbmZvLnN0b3JlTmFtZSwgW10sIGZ1bmN0aW9uICh0LCByZXN1bHRzKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciByb3dzID0gcmVzdWx0cy5yb3dzO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoID0gcm93cy5sZW5ndGg7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSByb3dzLml0ZW0oaSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gaXRlbS52YWx1ZTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoaXMgaXMgc2VyaWFsaXplZCBjb250ZW50XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSBuZWVkIHRvIHVucGFjay5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBkYkluZm8uc2VyaWFsaXplci5kZXNlcmlhbGl6ZShyZXN1bHQpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBpdGVyYXRvcihyZXN1bHQsIGl0ZW0ua2V5LCBpICsgMSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZvaWQoMCkgcHJldmVudHMgcHJvYmxlbXMgd2l0aCByZWRlZmluaXRpb25cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9mIGB1bmRlZmluZWRgLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gdm9pZCAwKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcblx0ICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAodCwgZXJyb3IpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcblx0ICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICB9KVsnY2F0Y2gnXShyZWplY3QpO1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKTtcblx0ICAgICAgICByZXR1cm4gcHJvbWlzZTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gc2V0SXRlbShrZXksIHZhbHVlLCBjYWxsYmFjaykge1xuXHQgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuXHQgICAgICAgIC8vIENhc3QgdGhlIGtleSB0byBhIHN0cmluZywgYXMgdGhhdCdzIGFsbCB3ZSBjYW4gc2V0IGFzIGEga2V5LlxuXHQgICAgICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgICBnbG9iYWxPYmplY3QuY29uc29sZS53YXJuKGtleSArICcgdXNlZCBhcyBhIGtleSwgYnV0IGl0IGlzIG5vdCBhIHN0cmluZy4nKTtcblx0ICAgICAgICAgICAga2V5ID0gU3RyaW5nKGtleSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgIHNlbGYucmVhZHkoKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIC8vIFRoZSBsb2NhbFN0b3JhZ2UgQVBJIGRvZXNuJ3QgcmV0dXJuIHVuZGVmaW5lZCB2YWx1ZXMgaW4gYW5cblx0ICAgICAgICAgICAgICAgIC8vIFwiZXhwZWN0ZWRcIiB3YXksIHNvIHVuZGVmaW5lZCBpcyBhbHdheXMgY2FzdCB0byBudWxsIGluIGFsbFxuXHQgICAgICAgICAgICAgICAgLy8gZHJpdmVycy4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vbW96aWxsYS9sb2NhbEZvcmFnZS9wdWxsLzQyXG5cdCAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gbnVsbDtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLy8gU2F2ZSB0aGUgb3JpZ2luYWwgdmFsdWUgdG8gcGFzcyB0byB0aGUgY2FsbGJhY2suXG5cdCAgICAgICAgICAgICAgICB2YXIgb3JpZ2luYWxWYWx1ZSA9IHZhbHVlO1xuXG5cdCAgICAgICAgICAgICAgICB2YXIgZGJJbmZvID0gc2VsZi5fZGJJbmZvO1xuXHQgICAgICAgICAgICAgICAgZGJJbmZvLnNlcmlhbGl6ZXIuc2VyaWFsaXplKHZhbHVlLCBmdW5jdGlvbiAodmFsdWUsIGVycm9yKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZGJJbmZvLmRiLnRyYW5zYWN0aW9uKGZ1bmN0aW9uICh0KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB0LmV4ZWN1dGVTcWwoJ0lOU0VSVCBPUiBSRVBMQUNFIElOVE8gJyArIGRiSW5mby5zdG9yZU5hbWUgKyAnIChrZXksIHZhbHVlKSBWQUxVRVMgKD8sID8pJywgW2tleSwgdmFsdWVdLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShvcmlnaW5hbFZhbHVlKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICh0LCBlcnJvcikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKHNxbEVycm9yKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgdHJhbnNhY3Rpb24gZmFpbGVkOyBjaGVja1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG8gc2VlIGlmIGl0J3MgYSBxdW90YSBlcnJvci5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcWxFcnJvci5jb2RlID09PSBzcWxFcnJvci5RVU9UQV9FUlIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSByZWplY3QgdGhlIGNhbGxiYWNrIG91dHJpZ2h0IGZvciBub3csIGJ1dFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGl0J3Mgd29ydGggdHJ5aW5nIHRvIHJlLXJ1biB0aGUgdHJhbnNhY3Rpb24uXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXZlbiBpZiB0aGUgdXNlciBhY2NlcHRzIHRoZSBwcm9tcHQgdG8gdXNlXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbW9yZSBzdG9yYWdlIG9uIFNhZmFyaSwgdGhpcyBlcnJvciB3aWxsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYmUgY2FsbGVkLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogVHJ5IHRvIHJlLXJ1biB0aGUgdHJhbnNhY3Rpb24uXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHNxbEVycm9yKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH0pWydjYXRjaCddKHJlamVjdCk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiByZW1vdmVJdGVtKGtleSwgY2FsbGJhY2spIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgICAvLyBDYXN0IHRoZSBrZXkgdG8gYSBzdHJpbmcsIGFzIHRoYXQncyBhbGwgd2UgY2FuIHNldCBhcyBhIGtleS5cblx0ICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgZ2xvYmFsT2JqZWN0LmNvbnNvbGUud2FybihrZXkgKyAnIHVzZWQgYXMgYSBrZXksIGJ1dCBpdCBpcyBub3QgYSBzdHJpbmcuJyk7XG5cdCAgICAgICAgICAgIGtleSA9IFN0cmluZyhrZXkpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHQgICAgICAgICAgICBzZWxmLnJlYWR5KCkudGhlbihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgZGJJbmZvID0gc2VsZi5fZGJJbmZvO1xuXHQgICAgICAgICAgICAgICAgZGJJbmZvLmRiLnRyYW5zYWN0aW9uKGZ1bmN0aW9uICh0KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdC5leGVjdXRlU3FsKCdERUxFVEUgRlJPTSAnICsgZGJJbmZvLnN0b3JlTmFtZSArICcgV0hFUkUga2V5ID0gPycsIFtrZXldLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcblx0ICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAodCwgZXJyb3IpIHtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuXHQgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH0pWydjYXRjaCddKHJlamVjdCk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICBleGVjdXRlQ2FsbGJhY2socHJvbWlzZSwgY2FsbGJhY2spO1xuXHQgICAgICAgIHJldHVybiBwcm9taXNlO1xuXHQgICAgfVxuXG5cdCAgICAvLyBEZWxldGVzIGV2ZXJ5IGl0ZW0gaW4gdGhlIHRhYmxlLlxuXHQgICAgLy8gVE9ETzogRmluZCBvdXQgaWYgdGhpcyByZXNldHMgdGhlIEFVVE9fSU5DUkVNRU5UIG51bWJlci5cblx0ICAgIGZ1bmN0aW9uIGNsZWFyKGNhbGxiYWNrKSB7XG5cdCAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG5cdCAgICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgIHNlbGYucmVhZHkoKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBkYkluZm8gPSBzZWxmLl9kYkluZm87XG5cdCAgICAgICAgICAgICAgICBkYkluZm8uZGIudHJhbnNhY3Rpb24oZnVuY3Rpb24gKHQpIHtcblx0ICAgICAgICAgICAgICAgICAgICB0LmV4ZWN1dGVTcWwoJ0RFTEVURSBGUk9NICcgKyBkYkluZm8uc3RvcmVOYW1lLCBbXSwgZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG5cdCAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKHQsIGVycm9yKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG5cdCAgICAgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfSlbJ2NhdGNoJ10ocmVqZWN0KTtcblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIGV4ZWN1dGVDYWxsYmFjayhwcm9taXNlLCBjYWxsYmFjayk7XG5cdCAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cdCAgICB9XG5cblx0ICAgIC8vIERvZXMgYSBzaW1wbGUgYENPVU5UKGtleSlgIHRvIGdldCB0aGUgbnVtYmVyIG9mIGl0ZW1zIHN0b3JlZCBpblxuXHQgICAgLy8gbG9jYWxGb3JhZ2UuXG5cdCAgICBmdW5jdGlvbiBsZW5ndGgoY2FsbGJhY2spIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgc2VsZi5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgdmFyIGRiSW5mbyA9IHNlbGYuX2RiSW5mbztcblx0ICAgICAgICAgICAgICAgIGRiSW5mby5kYi50cmFuc2FjdGlvbihmdW5jdGlvbiAodCkge1xuXHQgICAgICAgICAgICAgICAgICAgIC8vIEFoaGgsIFNRTCBtYWtlcyB0aGlzIG9uZSBzb29vb29vIGVhc3kuXG5cdCAgICAgICAgICAgICAgICAgICAgdC5leGVjdXRlU3FsKCdTRUxFQ1QgQ09VTlQoa2V5KSBhcyBjIEZST00gJyArIGRiSW5mby5zdG9yZU5hbWUsIFtdLCBmdW5jdGlvbiAodCwgcmVzdWx0cykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gcmVzdWx0cy5yb3dzLml0ZW0oMCkuYztcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG5cdCAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKHQsIGVycm9yKSB7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcblx0ICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICB9KVsnY2F0Y2gnXShyZWplY3QpO1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKTtcblx0ICAgICAgICByZXR1cm4gcHJvbWlzZTtcblx0ICAgIH1cblxuXHQgICAgLy8gUmV0dXJuIHRoZSBrZXkgbG9jYXRlZCBhdCBrZXkgaW5kZXggWDsgZXNzZW50aWFsbHkgZ2V0cyB0aGUga2V5IGZyb20gYVxuXHQgICAgLy8gYFdIRVJFIGlkID0gP2AuIFRoaXMgaXMgdGhlIG1vc3QgZWZmaWNpZW50IHdheSBJIGNhbiB0aGluayB0byBpbXBsZW1lbnRcblx0ICAgIC8vIHRoaXMgcmFyZWx5LXVzZWQgKGluIG15IGV4cGVyaWVuY2UpIHBhcnQgb2YgdGhlIEFQSSwgYnV0IGl0IGNhbiBzZWVtXG5cdCAgICAvLyBpbmNvbnNpc3RlbnQsIGJlY2F1c2Ugd2UgZG8gYElOU0VSVCBPUiBSRVBMQUNFIElOVE9gIG9uIGBzZXRJdGVtKClgLCBzb1xuXHQgICAgLy8gdGhlIElEIG9mIGVhY2gga2V5IHdpbGwgY2hhbmdlIGV2ZXJ5IHRpbWUgaXQncyB1cGRhdGVkLiBQZXJoYXBzIGEgc3RvcmVkXG5cdCAgICAvLyBwcm9jZWR1cmUgZm9yIHRoZSBgc2V0SXRlbSgpYCBTUUwgd291bGQgc29sdmUgdGhpcyBwcm9ibGVtP1xuXHQgICAgLy8gVE9ETzogRG9uJ3QgY2hhbmdlIElEIG9uIGBzZXRJdGVtKClgLlxuXHQgICAgZnVuY3Rpb24ga2V5KG4sIGNhbGxiYWNrKSB7XG5cdCAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG5cdCAgICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgIHNlbGYucmVhZHkoKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBkYkluZm8gPSBzZWxmLl9kYkluZm87XG5cdCAgICAgICAgICAgICAgICBkYkluZm8uZGIudHJhbnNhY3Rpb24oZnVuY3Rpb24gKHQpIHtcblx0ICAgICAgICAgICAgICAgICAgICB0LmV4ZWN1dGVTcWwoJ1NFTEVDVCBrZXkgRlJPTSAnICsgZGJJbmZvLnN0b3JlTmFtZSArICcgV0hFUkUgaWQgPSA/IExJTUlUIDEnLCBbbiArIDFdLCBmdW5jdGlvbiAodCwgcmVzdWx0cykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gcmVzdWx0cy5yb3dzLmxlbmd0aCA/IHJlc3VsdHMucm93cy5pdGVtKDApLmtleSA6IG51bGw7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcblx0ICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAodCwgZXJyb3IpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcblx0ICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICB9KVsnY2F0Y2gnXShyZWplY3QpO1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKTtcblx0ICAgICAgICByZXR1cm4gcHJvbWlzZTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24ga2V5cyhjYWxsYmFjaykge1xuXHQgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuXHQgICAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHQgICAgICAgICAgICBzZWxmLnJlYWR5KCkudGhlbihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgZGJJbmZvID0gc2VsZi5fZGJJbmZvO1xuXHQgICAgICAgICAgICAgICAgZGJJbmZvLmRiLnRyYW5zYWN0aW9uKGZ1bmN0aW9uICh0KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdC5leGVjdXRlU3FsKCdTRUxFQ1Qga2V5IEZST00gJyArIGRiSW5mby5zdG9yZU5hbWUsIFtdLCBmdW5jdGlvbiAodCwgcmVzdWx0cykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIga2V5cyA9IFtdO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzdWx0cy5yb3dzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlzLnB1c2gocmVzdWx0cy5yb3dzLml0ZW0oaSkua2V5KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoa2V5cyk7XG5cdCAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKHQsIGVycm9yKSB7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcblx0ICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICB9KVsnY2F0Y2gnXShyZWplY3QpO1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKTtcblx0ICAgICAgICByZXR1cm4gcHJvbWlzZTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gZXhlY3V0ZUNhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKSB7XG5cdCAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG5cdCAgICAgICAgICAgIHByb21pc2UudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG5cdCAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHQpO1xuXHQgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcblx0ICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycm9yKTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICB2YXIgd2ViU1FMU3RvcmFnZSA9IHtcblx0ICAgICAgICBfZHJpdmVyOiAnd2ViU1FMU3RvcmFnZScsXG5cdCAgICAgICAgX2luaXRTdG9yYWdlOiBfaW5pdFN0b3JhZ2UsXG5cdCAgICAgICAgaXRlcmF0ZTogaXRlcmF0ZSxcblx0ICAgICAgICBnZXRJdGVtOiBnZXRJdGVtLFxuXHQgICAgICAgIHNldEl0ZW06IHNldEl0ZW0sXG5cdCAgICAgICAgcmVtb3ZlSXRlbTogcmVtb3ZlSXRlbSxcblx0ICAgICAgICBjbGVhcjogY2xlYXIsXG5cdCAgICAgICAgbGVuZ3RoOiBsZW5ndGgsXG5cdCAgICAgICAga2V5OiBrZXksXG5cdCAgICAgICAga2V5czoga2V5c1xuXHQgICAgfTtcblxuXHQgICAgZXhwb3J0c1snZGVmYXVsdCddID0gd2ViU1FMU3RvcmFnZTtcblx0fSkuY2FsbCh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHNlbGYpO1xuXHRtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcblxuLyoqKi8gfVxuLyoqKioqKi8gXSlcbn0pO1xuOyIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIl19
