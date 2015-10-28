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

var defaultGamePath = "game/";
var con_r = 6;
/*window.onload = function() {
  setTimeout(function() {
    // preload image
    new Image().src = "game/img/panel_01.png";
  }, 1000);
}; */

document.addEventListener("keydown", function(e) {
  if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
    e.preventDefault();
    // Process event...
      saveJSON(nodeContainer.toObject(), defaultGamePath + document.querySelector("#filepath").value);
  }
}, false);


window.onload = function() {

	document.querySelector("#load").onclick = function() {
		loadJSON(defaultGamePath + document.querySelector("#filepath").value, init);
	};
	document.querySelector("#save").onclick = function() {
		saveJSON(nodeContainer.toObject(), defaultGamePath + document.querySelector("#filepath").value);
	};
	//document.querySelector("#save");
	loadJSON(defaultGamePath + "panels.json", init);
};

//request.send();

function initNodes() {
	nodeContainer = new NodeContainer();
	nodeContainer.startnode = config.startnode;
	for (var p=0; p<panels.length;p++) {
		var panel = new Panel(panels[p]);
		nodeContainer.addChild(panel);
	}
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

function init(obj) {
    
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

	function stageMouseMove(evt) {
		if (dragging_element !== undefined && dragging_element !== null) {
			var local = dragging_element.parent.globalToLocal(evt.stageX - dragoffset.x, evt.stageY - dragoffset.y);
			dragging_element.x = local.x;
			dragging_element.y = local.y;
		}
	}
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
		nodeContainer.showProperties();
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

	if (tab == currentTab) return;
	currentTab = tab;

	switch(tab) {

		case "propertyTab":
		console.log("cool");
		if (currentlySelected !== undefined) currentlySelected.showProperties();
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
    	console.log("Dropped on STAGE! Cool!", ev.clientX, ev.clientY);
    	var local = nodeContainer.globalToLocal(ev.clientX, ev.clientY);
    	console.log(ev.dataTransfer.getData("text/plain"));
    	newPanel(local.x, local.y, ev.dataTransfer.getData("text/plain"));
    }
    //var data = ev.dataTransfer.getData("text");
    //ev.target.appendChild(document.getElementById(data));
}
