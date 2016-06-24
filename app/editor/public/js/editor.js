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
};

function initNodes() {
	nodeContainer = new NodeContainer();
	nodeContainer.nodes = [];
	nodeContainer.startnode = config.startnode;
	for (var p=0; p<panels.length;p++) {
		if (panels[p] !== null) {
			let node;
			if (panels[p].type !== undefined) {
				if (panels[p].type == 'varnode') {
					node = new Node();
					node.setup(panels[p]);
				}
			} else {
				node = new Panel(panels[p]);
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
	let panel = new Panel(obj);
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
	//  NODE class  //
	// ------------ //

	//var editor = require('./editor.js');

	function Node() {
		this.Container_constructor();
		this.sockets = [];
		this.ctrldrag = false;
	}
	createjs.extend(Node, createjs.Container);
	
	Node.prototype.setup = function(obj) {
		this.name = obj.name;
		this.type = obj.type;
		if (obj.editor !== undefined) {
			this.x = obj.editor.position.x;
			this.y = obj.editor.position.y;
		}
		//this.selected = new createjs.Shape();
		//this.addChild(this.selected);
		//let pos = nodeContainer.globalToLocal(x,y);
		//console.log('new node', pos.x, pos.y);
		//node.x = pos.x;
		//node.y = pos.y;
		if (obj.goto != -1) this.goto = obj.goto;
		this.width = 100;
		this.height = 100;
		this.shape = new createjs.Shape();
		this.shape.graphics.ss(2).s('#222').f('#444').dr(0,0,100,100);
		this.shape.on("mousedown", this.handleMouseDown);
		this.shape.on("pressmove", this.handleMouseMove);
		this.shape.on("pressup", this.handleMouseUp);
		if (this.type == 'varnode') {
			let socket = this.addSocket(this.x+100, this.y+50, undefined, this, 6, '#000');
			socket.owner = this;
			this.sockets.push(socket);
		} else if (this.type == 'ifnode') {
			
		}
		this.addChild(this.shape);
	}
	
	Node.prototype.handleMouseDown = function(evt) {
		let node = evt.target.parent;
		node.ctrldrag = { dragging: false, socket: null };
		if (navigator.platform.match("Mac") ? evt.nativeEvent.metaKey : evt.nativeEvent.ctrlKey) {
			evt.preventDefault();
			
			for (let s=0; s < node.sockets.length; s++) {
				let socket = node.sockets[s];
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
		dragoffset = {
			x: evt.stageX/viewScale - evt.target.parent.x,
			y: evt.stageY/viewScale - evt.target.parent.y
		};

		//evt.target.dragoffset.y = evt.stageY/viewScale - evt.target.parent.y;
		if (currentlySelected !== undefined && currentlySelected.selected !== undefined) currentlySelected.selected.graphics.clear();
		currentlySelected = evt.target.parent;
		handleSelection({ node: nodeContainer.nodes.indexOf(evt.target.parent) });
		//openTab("propertyTab");
	};

	Node.prototype.handleMouseMove = function(evt) {
		//console.log(evt.target);
		let node = evt.target.parent;
		if (node.ctrldrag.dragging) {
			let socketEvt = evt.clone();
			socketEvt.set({type: 'pressmove', target: node.ctrldrag.socket});
			
			node.ctrldrag.socket.dispatchEvent(socketEvt);
			return false;
		}
		/*if (navigator.platform.match("Mac") ? evt.nativeEvent.metaKey : evt.nativeEvent.ctrlKey) {
			for (let s=0; s < node.sockets.length; s++) {
				let socket = node.sockets[s];
				if (socket.owner == node) {
					let newEvent = evt.clone();
					newEvent.set({type: 'pressmove', target: socket});
					socket.dispatchEvent(newEvent);
				}
			}
			return;
		}*/

		let panel = evt.target.parent;
		let old = {x: panel.x, y: panel.y};
		
		panel.x = evt.stageX/viewScale - dragoffset.x;
		panel.y = evt.stageY/viewScale - dragoffset.y;

		panel.x = Math.round(panel.x*0.1)*10;
		panel.y = Math.round(panel.y*0.1)*10;
		
		if (old.x != panel.x || old.y != panel.y) {
			let sel = {node: nodeContainer.nodes.indexOf(panel)};
			handleChange(sel, {editor: {position: {x:panel.x, y:panel.y}}});
			drawAllConnections();
		}

		//console.log(evt.target.parent);
		//drawConnections(evt.target.parent);
		
	};

	Node.prototype.handleMouseUp = function(evt) {
		let node = evt.target.parent;
		if (node.ctrldrag.dragging) {
			let socketEvt = evt.clone();
			socketEvt.set({type: 'pressup', target: node.ctrldrag.socket});
			
			node.ctrldrag.socket.dispatchEvent(socketEvt);

			node.ctrldrag = { dragging: false, socket: null };
			return false;
		}
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
		console.log("dragline!");
		let sock = evt.target;
		if (sock instanceof createjs.Shape) sock = evt.target.parent;
		var line = sock.line;
		line.graphics.clear();
		var local = line.globalToLocal(evt.stageX, evt.stageY);
		line.graphics.s(sock.color).ss(sock.strokewidth).mt(0+con_r, 0).lt(local.x,local.y);
	};

	Node.prototype.releaseLine = function(evt) {
		let socket = evt.target;
		if (socket instanceof createjs.Shape) socket = evt.target.parent;
		let panel = socket.parent;
		let owner = socket.owner;
		socket.goto = undefined;
		owner.goto = undefined;
		socket.line.graphics.clear();
		let gotoindex = null;
		let nodeindex = null;
		let elmindex = null;
		if (owner instanceof PanelElement) {
			nodeindex = nodeContainer.nodes.indexOf(panel);
			elmindex = panel.elements.indexOf(owner);
		} else {
			nodeindex = nodeContainer.nodes.indexOf(owner);
		}
		var target = stage.getObjectUnderPoint(evt.stageX, evt.stageY).parent;
		if (target instanceof Node) {
			socket.goto = target;
			owner.goto = target;			
			gotoindex = nodeContainer.nodes.indexOf(socket.goto);
		}
		handleChange({node: nodeindex, element: elmindex}, {goto: gotoindex});
		panel.drawConnections();
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
			this.panelbitmap.on("pressup", this.handleMouseUp);
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
				if (obj.elements[e] !== null) {
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
				} else {
					this.elements.push(null);
				}
				
			}
		}	
	};

	Panel.prototype.newImage = function(image) {
		console.log('IMAGE SHIT!');
		//this.removeChild(this.panelbitmap)
		this.image = image;
		let img = new Image();
		img.onload = function() {
			this.update();
		}.bind(this);
		img.src = this.image;
		//console.log(img);
		this.panelbitmap.image = img;
	};

	Panel.prototype.update = function(update) {
		//this.x = update.editor.position.x;
		//this.y = update.editor.position.y;
		for (let property in update) {
			this[property] = update[property];
			/*if (property == 'image') {
				// FIX THIS IMAGE SHIT!
				console.log('IMAGE SHIT!');
				//this.removeChild(this.panelbitmap)
				this.image = update.image;
				let img = new Image();
				img.src = this.image;
				//console.log(img);
				this.panelbitmap.image = img;
			}*/
			console.log("Changed", property, update[property]);
		}
		let scale = 0.25;
		scale = this.size*400*scale / this.panelbitmap.image.width;
		this.panelbitmap.scaleX = scale;
		this.panelbitmap.scaleY = scale;
		this.width = this.panelbitmap.image.width*this.panelbitmap.scaleX;
		this.height = this.panelbitmap.image.height*this.panelbitmap.scaleY;
		for (let p=0; p < this.elements.length; p++) {
			let elm = this.elements[p];
			if (elm !== null) {
				this.elements[p].update();
			}
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

	Panel.prototype.toObject = function() {
		let obj = {};
		obj.name = this.name;
		obj.size = this.size;
		obj.goto = this.goto;
		obj.image = this.image;
		obj.editor = { position: { x: this.x, y: this.y }};

		return obj;
	};

	window.Panel = createjs.promote(Panel, "Node");

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






