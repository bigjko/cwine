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
		for (var s=0; s < this.sockets.length; s++) {
			var socket = this.sockets[s];
			if (socket.goto !== undefined) {
				var goto = nodeContainer.children[socket.goto];
				var local = nodeContainer.localToLocal(goto.x, goto.y+goto.height/2, socket);
				socket.line.graphics.clear();
				socket.line.graphics.s(socket.color).ss(socket.strokewidth).mt(0+con_r, 0).lt(local.x, local.y );
			}
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
		evt.target.parent.parent.drawConnections();
	};
	
	Node.prototype.addSocket = function(x, y, goto, radius, color) {
		var socket = new createjs.Container();
		socket.shape = new createjs.Shape();
		socket.line = new createjs.Shape();
		socket.radius = radius;
		
		socket.x = x;
		socket.y = y;
		
		if (color !== undefined) socket.color = color;
		else socket.color = "#000";
		
		var r = socket.radius;
		socket.shape.regY = r;
		socket.shape.regX = 0;
		
		socket.shape.graphics.f("#fff").dc(r,r,r).f(socket.color).dc(r,r,r-r/3);
		socket.shape.scaleX = 1 / viewScale;
		socket.shape.scaleY = 1 / viewScale;
		
		socket.strokewidth = socket.radius/2;
		socket.cursor = "pointer";
		
		socket.goto = goto;
		
		socket.addChild(socket.shape, socket.line);
		
		socket.on("pressmove", this.dragLine);
		socket.on("pressup", this.releaseLine);
		
		this.sockets.push(socket);
		this.addChild(socket);
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
		
		if (obj.image !== undefined && obj.size !== undefined) {
			this.panelbitmap = new createjs.Bitmap("game/img/" + obj.image);
			var scale = 0.25;
			//if (panels[i].size == 4) scale = 0.35;
			scale = obj.size*400*scale / this.panelbitmap.image.width;
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
		
		this.addSocket(socketpos.x,socketpos.y,obj.goto, 6);
		
		this.elements = [];
		for (var e=0; e < obj.elements.length; e++) {
			var element = new PanelElement(obj.elements[e], this.panelbitmap);
			
			this.elements.push(element);
			this.addChild(element);
			
			socketpos = {
				x: element.x + (-element.regX+element.width)*element.scaleX,
				y: element.y + (-element.regY+element.height/2)*element.scaleY
			};
			this.addSocket(socketpos.x,socketpos.y,element.goto, 3, "#fff");
		}
	};
	
	window.Panel = createjs.promote(Panel, "Node");
	
	// ------------ //
	// PanelElement //
	// ------------ //
	
	function PanelElement(obj, bitmap) {
		
		this.panelbitmap = bitmap;
		this.setup(obj);
	} createjs.extend(PanelElement, createjs.DOMElement);
	
	PanelElement.prototype.setup = function(obj) {
		this.goto = obj.goto;
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

		this.DOMElement_constructor(div);

		this.scaleX = 0.6;
		this.scaleY = 0.6;
		/*if (panel.size == 4) {
			elm.scaleX = 0.4;
			elm.scaleY = 0.4;
			console.log("COOL SCALE. Fuck dig Mads!");
		}*/
		//div.style.transformOrigin = "0% -100%";
		//div.style.transform = "translate(0, -100%)";
		this.x = (sb.position.x/100) * this.panelbitmap.image.width*this.panelbitmap.scaleX;
		this.y = (sb.position.y/100) * this.panelbitmap.image.height*this.panelbitmap.scaleY;
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
		//elm.regY = elm.getBounds().height;
		//elements.addChild(elm);
	};
	
	window.PanelElement = createjs.promote(PanelElement, "DOMElement");
}());
