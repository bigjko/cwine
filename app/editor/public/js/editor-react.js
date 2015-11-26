//var classes = require('./classes.js');
var loader = require("./loader.js");
var $ = require('jquery');

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
var currentlySelected;
var currentLocalImages;

let handleSelection;
let handleChange;

exports.init = function(obj, onselect, onchange) {

	handleSelection = onselect;
	handleChange = onchange;

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
			nodeContainer.children[sel.node].elements[sel.element].update(update);
		}
		nodeContainer.children[sel.node].update(update);
	}
};

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

function newPanel(x, y, image) {
	var obj = {};
	obj.image = image;
	obj.editor = {};
	obj.editor.position = {
		x: x,
		y: y
	};
	nodeContainer.addChild(new Panel(obj));
}

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
    		newPanelElement(pos.x, pos.y, pnl, ev.dataTransfer.getData("text/plain"));
    	}
    	else newPanel(local.x, local.y, ev.dataTransfer.getData("text/plain"));
    }
    //var data = ev.dataTransfer.getData("text");
    //ev.target.appendChild(document.getElementById(data));
};


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
		handleSelection({ node: nodeContainer.getChildIndex(evt.target.parent) });
		//openTab("propertyTab");
	};

	Node.prototype.handleMouseMove = function(evt) {
		//console.log(evt.target);
		let panel = evt.target.parent;

		panel.x = evt.stageX/viewScale - dragoffset.x;
		panel.y = evt.stageY/viewScale - dragoffset.y;

		panel.x = Math.round(panel.x*0.1)*10;
		panel.y = Math.round(panel.y*0.1)*10;

		let sel = {node: nodeContainer.getChildIndex(panel)};
		handleChange(sel, {editor: {position: {x:panel.x, y:panel.y}}});

		//console.log(evt.target.parent);
		//drawConnections(evt.target.parent);
		drawAllConnections();
	};

	Node.prototype.drawConnections = function() {
		for (let s=0; s < this.sockets.length; s++) {
			var socket = this.sockets[s];
			socket.line.graphics.clear();
			if (socket.owner instanceof PanelElement) {
				let socketpos = socket.owner.localToLocal(socket.owner.width, socket.owner.height/2, socket.parent);
				socket.x = socketpos.x;
				socket.y = socketpos.y;
			}
			else {
				let socketpos = { x: socket.owner.width, y: socket.owner.height/2 };
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
		this.elements = [];
		if (obj.elements !== undefined) {
			for (let e=0; e < obj.elements.length; e++) {
				var element = new PanelElement(obj.elements[e], this.panelbitmap);

				//this.elements.push(element);
				this.addChild(element);
				this.elements.push(element);
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

	Panel.prototype.update = function(update) {
		//this.x = update.editor.position.x;
		//this.y = update.editor.position.y;
		for (let property in update) {
			this[property] = update[property];
			if (property == 'image') {
				// FIX THIS IMAGE SHIT!
				this.panelbitmap = new Bitmap(this.image);
			}
			console.log("Changed", property, update[property]);
		}
		let scale = 0.25;
		scale = this.size*400*scale / this.panelbitmap.image.width;
		this.panelbitmap.scaleX = scale;
		this.panelbitmap.scaleY = scale;
		this.width = this.panelbitmap.image.width*this.panelbitmap.scaleX;
		this.height = this.panelbitmap.image.height*this.panelbitmap.scaleY;
		for (let p=0; p < this.elements.length; p++) {
			this.elements[p].setPosition();
		}
		drawAllConnections();

	};

	Panel.prototype.removeChild = function(child) {
		var view = document.querySelector("#view");
		var elm = child.children[1].htmlElement;
		console.log(elm);
		view.removeChild(elm);
		this.Node_removeChild(child);
		drawAllConnections();
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
		this.align = obj.align;
		this.bubble_type = obj.bubble_type;
		this.text = obj.text;
        this.position = obj.position;

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
		//this.addChild(hitshape);
		this.on("mousedown", this.setDragOffset);
		this.on("pressmove", this.dragElement);
		//this.on("click", this.showProperties);
		//elm.regY = elm.getBounds().height;
		//elements.addChild(elm);
	};

	PanelElement.prototype.update = function(update) {

		for (let property in update) {
			this[property] = update[property];
		}
		/*if (update.text !== undefined) this.text = update.text;
		if (update.bubble_type !== undefined) this.bubble_type = update.bubble_type;
		if (update.image !== undefined) this.image = update.image;
		if (update.position !== undefined) this.position = update.position;
		if (update.align !== undefined) this.align = update.align;*/

		var element = this.children[1].htmlElement;
		element.innerHTML = '<p>' + this.text.replace(/\n/g, "<br>") + '</p>';
		this.width = element.clientWidth;
		this.height = element.clientHeight;
		this.regX = element.clientWidth/2;
		this.regY = element.clientHeight;
		this.hitArea.graphics.clear().f("#000").dr(0,0,this.width,this.height);
		element.style.backgroundImage = this.image;

		if (this.align !== undefined && this.align.x == "right") {
			this.regX = element.clientWidth;
		}



		drawAllConnections();
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
		handleSelection({node: nodeContainer.getChildIndex(evt.target.parent), element: evt.target.parent.elements.indexOf(evt.target)});
		//openTab("propertyTab");
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
		this.position = evt.target.outputPosition();
		let sel = {node: nodeContainer.getChildIndex(evt.target.parent), element: evt.target.parent.elements.indexOf(evt.target)};
		let pos = evt.target.outputPosition();
		handleChange(sel, {position: pos});
        /*evt.target.position = { 
            x: local.x/evt.target.panelbitmap.image.width/evt.target.panelbitmap.scaleX*100, 
            y: local.y/evt.target.panelbitmap.image.height/evt.target.panelbitmap.scaleY*100 }*/
		evt.target.parent.drawConnections();
	};

	PanelElement.prototype.setPosition = function() {
		var panelbitmap = this.panelbitmap;
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

		for (let i=0; i < this.children.length; i++) {
			var node = this.children[i];
			if (node.goto !== undefined) node.goto = this.getChildAt(node.goto);
			for (let e=0; e < node.children.length; e++) {
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
	};

	// toObject - For outputting editor parameters to a JSON object

	NodeContainer.prototype.toObject = function() {

		var output = {};

		output.config = {
			startnode: this.startnode
		};

		output.nodes = [];
		for (i=0; i < this.children.length; i++) {
			var ref = this.children[i];
			// cycle through all nodes, saving their data to an object
			var node = {};

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






