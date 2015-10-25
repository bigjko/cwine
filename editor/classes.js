(function() {

	// ------------ //
	//  NODE class  //
	// ------------ //

	function Node() {
		this.Container_constructor();
		this.sockets = [];
	}
	createjs.extend(Node, createjs.Container);

	Node.prototype.handleMouseDown = function(evt) {
		dragoffset.x = evt.stageX/viewScale - evt.target.parent.x;
		dragoffset.y = evt.stageY/viewScale - evt.target.parent.y;
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
			if (socket.owner instanceof PanelElement) {
				var socketpos = socket.owner.localToLocal(socket.owner.width, socket.owner.height/2, socket.parent);
				socket.x = socketpos.x;
				socket.y = socketpos.y;
			}
			if (socket.goto !== undefined) {
				var goto = nodeContainer.children[socket.goto];
				var local = nodeContainer.localToLocal(goto.x, goto.y+goto.height/2, socket);
				socket.line.graphics.clear();
				if (socket.owner instanceof PanelElement) socket.line.graphics.s(socket.color).ss(socket.strokewidth).sd([10,5]).mt(0+con_r, 0).lt(local.x, local.y );
				else socket.line.graphics.s(socket.color).ss(socket.strokewidth).mt(0+con_r, 0).lt(local.x, local.y );
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
		evt.target.parent.line.graphics.clear();
		var targ = stage.getObjectUnderPoint(evt.stageX, evt.stageY);
		if (targ.parent instanceof Node) {
			evt.target.parent.goto = nodeContainer.getChildIndex(targ.parent);
		}
        else evt.target.owner.goto = nodeContainer.getChildIndex(targ.parent);
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
		socket.shape.scaleX = 1 / viewScale;
		socket.shape.scaleY = 1 / viewScale;

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

		if (obj.editor !== undefined) {
			this.x = obj.editor.position.x;
			this.y = obj.editor.position.y;
		}

		if (obj.image !== undefined) {
			this.panelbitmap = new createjs.Bitmap("game/img/" + obj.image);
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
		}
        
		var socketpos = {
			x: this.panelbitmap.scaleX*this.panelbitmap.image.width,
			y: this.panelbitmap.scaleY*this.panelbitmap.image.height/2
		};

		var sock = this.addSocket(socketpos.x,socketpos.y,obj.goto, this, 6);
		sock.owner = this;
        
        this.goto = obj.goto;

		this.elements = [];
		for (e=0; e < obj.elements.length; e++) {
			var element = new PanelElement(obj.elements[e], this.panelbitmap);

			this.elements.push(element);
			this.addChild(element);
			console.log(element.children.length);
			socketpos = {
				x: element.x + element.width*element.scaleX,
				y: element.y + element.height/2*element.scaleY
			};
			sock = this.addSocket(socketpos.x, socketpos.y, element.goto, this, 3, "#fff");
			sock.owner = element;
			sock.dahesh = [10,5];
		}
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
		this.goto = obj.goto;
		this.align = obj.align;
		this.bubble_type = obj.bubble_type;
		this.text = obj.text;
        this.position = obj.position;

		//var panel = panels[i];
		var sb = obj;

		var div = document.querySelector("#view").appendChild(document.createElement("DIV"));

		var image = "";
		var bubble_size = "medium";
		if (sb.text.length < 4) {
			bubble_size = "small";
		}
		var bubble_orient = sb.bubble_type;
		image += bubble_size;
		if (bubble_orient == "box") {
			image += "_box.png";
		}
		else image += "_bubble_" + bubble_orient + ".png";

		div.innerHTML = "<p>" + sb.text + "</p>";

		div.className = "bubble";
		if (bubble_orient == "box") div.className += " box";
		div.className += " noselect";

		div.style.backgroundImage = "url(\"game/img/bubbles/"+image+"\")";
		div.style.position = "absolute";
		div.style.top = 0;
		div.style.left = 0;

		//document.querySelector("#view").appendChild(div);

		var elm = new createjs.DOMElement(div);

		this.scaleX = 0.6;
		this.scaleY = 0.6;

		this.x = (sb.position.x/100) * this.panelbitmap.image.width*this.panelbitmap.scaleX;
		this.y = (sb.position.y/100) * this.panelbitmap.image.height*this.panelbitmap.scaleY;
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

		var hitshape = new createjs.Shape();
		hitshape.graphics.f("#000").dr(0,0,this.width,this.height);
		this.hitArea = hitshape;

		this.addChild(elm);
		//this.addChild(hitshape);
		this.on("mousedown", this.setDragOffset);
		this.on("pressmove", this.dragElement);
		//elm.regY = elm.getBounds().height;
		//elements.addChild(elm);
	};

	PanelElement.prototype.setDragOffset = function(evt) {
		var global = evt.target.parent.localToGlobal(evt.target.x, evt.target.y);
		dragoffset = {
			x: evt.stageX - global.x,
			y: evt.stageY - global.y
		};
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
        evt.target.position = { 
            x: local.x/evt.target.panelbitmap.image.width/evt.target.panelbitmap.scaleX*100, 
            y: local.y/evt.target.panelbitmap.image.height/evt.target.panelbitmap.scaleY*100 }
		evt.target.parent.drawConnections();
	};

	window.PanelElement = createjs.promote(PanelElement, "Container");


	// --------------- //
	//  NodeContainer  //
	// --------------- //

	function NodeContainer() {
		this.Container_constructor();
	} createjs.extend(NodeContainer, createjs.Container);


	// toObject - For outputting editor parameters to a JSON object

	NodeContainer.prototype.toObject = function() {

		var output = new Object();

		output.config = {
			startnode: 0
		};

		output.nodes = [];
		for (i=0; i < this.children.length; i++) {
			var ref = this.children[i];
			// cycle through all nodes, saving their data to an object
			var node = new Object();

			if (ref instanceof Panel) {

				node.name = ref.name;
				node.size = ref.size;
				node.image = ref.image;
				node.goto = ref.goto;
				node.editor = {
					position: { x: ref.x, y: ref.y }
				};

				if (ref.elements !== undefined) {
					node.elements = [];

					for (e=0; e < ref.elements.length; e++) {
						var r_elem = ref.elements[e];
						var elem = new Object();

						elem.type = r_elem.type;
						if (r_elem.text !== undefined) {
							elem.text = r_elem.text;
						}
						elem.bubble_type = r_elem.bubble_type;
						if (r_elem.align !== undefined) {
							elem.align = { x: r_elem.align.x, y:r_elem.align.y };
						}
						elem.position = r_elem.position;
						elem.goto = r_elem.goto;

						node.elements.push(elem);
					}
				}

			}

			output.nodes.push(node);
		}

		return output;
	}

	window.NodeContainer = createjs.promote(NodeContainer, "Container");

}());
