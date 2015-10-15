var panels;
var stage;
var viewContainer;
var panelContainers;
var viewScale = 1;
var dragoffset = {"x":0, "y":0};
var dragBox;
var zoomStep = 0.2;
/*window.onload = function() {
  setTimeout(function() {
    // preload image
    new Image().src = "game/img/panel_01.png";
  }, 1000);
}; */

var request = new XMLHttpRequest();
request.open('GET', 'game/panels.json', true);

var mobile_small_panels = 0;

request.onload = function() {
  if (request.status >= 200 && request.status < 400) {
    // Success!
    panels = JSON.parse(request.responseText);
    preloadImages(panels, init);
  } else {
    // We reached our target server, but it returned an error
    
  }
};

//request.send();

function initPanels() {
	
	panelContainers = [];
	
	function handleMouseDown(evt) {
		dragoffset.x = evt.stageX/viewScale - evt.target.parent.x;
		dragoffset.y = evt.stageY/viewScale - evt.target.parent.y;
	}
	
	function handleMouseMove(evt) {
		evt.target.parent.x = evt.stageX/viewScale - dragoffset.x;
		evt.target.parent.y = evt.stageY/viewScale - dragoffset.y;

		evt.target.parent.x = Math.round(evt.target.parent.x*0.1)*(10);
		evt.target.parent.y = Math.round(evt.target.parent.y*0.1)*(10);
		
		//console.log(evt.target.parent);
		//drawConnections(evt.target.parent);
		drawAllConnections();
	}
	
	for (var i=0; i < panels.length; i++) {
		var container = new createjs.Container();
		container.x = 200 + 120*i;
		container.y = 200;
		
		var bitmap = new createjs.Bitmap("game/img/" + panels[i].image);
				
		bitmap.name = "panelBitmap";
		
		var conn_out = new createjs.Shape();
		conn_out.name = "connectionsOut";
		
		var scale = 0.25;
		bitmap.scaleX = scale;
		bitmap.scaleY = scale;
		bitmap.on("mousedown", handleMouseDown);
		bitmap.on("pressmove", handleMouseMove);
		
		container.addChild(bitmap, conn_out);
				
		panelContainers.push(container);

		viewContainer.addChild(container);
		
		//drawConnections(container);
	  }
	
	drawAllConnections();
  //stage.update();
}

window.onload = function() { request.send(); };

window.onresize = function(event) {
    var view = document.querySelector("#view");
    var sidebar = document.querySelector("#sidebar");

    stage.canvas.width = view.offsetWidth;
    stage.canvas.height = view.offsetHeight;
    //stage.update();
};

function init() {
  stage = new createjs.Stage("edit_canvas");

  //stage.canvas.width = document.documentElement.clientWidth;
  //stage.canvas.height = document.documentElement.clientHeight;

  stage.canvas.width = document.querySelector("#view").offsetWidth;
  stage.canvas.height = document.querySelector("#view").offsetHeight;

  stage.mouseMoveOutside = true;

  initviewContainer();

  initPanels();

  //stage.update();
  createjs.Ticker.setFPS(60);
  createjs.Ticker.addEventListener("tick", stage);
}

function initviewContainer() {
	function dragView(evt) {
		viewContainer.x = evt.stageX - dragoffset.x;
		viewContainer.y = evt.stageY - dragoffset.y;
	}
	
	dragBox = new createjs.Shape(new createjs.Graphics().beginFill("#ccc").drawRect(0,0,stage.canvas.width, stage.canvas.height));
	dragBox.on("mousedown", function(evt) {
	dragoffset.x = evt.stageX - viewContainer.x;
	dragoffset.y = evt.stageY - viewContainer.y;
	});
	dragBox.on("pressmove", dragView);

	viewContainer = new createjs.Container();
	viewScale = 0.5;
	viewContainer.scaleX = viewScale;
	viewContainer.scaleY = viewScale;

	stage.addChild(dragBox);
	stage.addChild(viewContainer);
}


function preloadImages(array, callback) {
	var loaded = 0;
	var images = [];
	images.push("game/img/bubbles/medium_bubble_left.png");
	images.push("game/img/bubbles/medium_bubble_down.png");
	images.push("game/img/bubbles/medium_box.png");
	images.push("game/img/bubbles/small_box.png");
	images.push("game/img/bubbles/small_bubble_down.png");
	images.push("game/img/bubbles/x_small_bubble_left.png");
	for (var i=0; i<array.length; i++) {
		images.push("game/img/" + array[i].image);
	}

	function imageLoaded() {
		loaded++;
		updateProgress();
	}
	
	function updateProgress() {
		document.getElementById("progress_bar").style.width = (loaded/images.length * 100).toString() + "%";
		if (loaded == images.length) {
			setTimeout(function() {
			document.getElementById("progress").style.opacity = 0;
			}, 100);
			callback();
		}
	}

	setTimeout(function() {
		document.getElementById("progress").style.opacity = 1;
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

function drawAllConnections() {
	for (var c = 0; c < panelContainers.length; c++) {
		drawConnections(panelContainers[c]);
	}
}

function drawConnections(panel) {
	var conn_shape = panel.getChildByName("connectionsOut");
	var bitmap = panel.getChildByName("panelBitmap");
	console.log(bitmap);

	conn_shape.graphics.clear();
	//console.log(viewContainer.getChildIndex(panel));
	var goto = panels[viewContainer.getChildIndex(panel)].goto;
	//var connections = panels[panelContainers.getChildIndex(panel)].connected;
	
	if (goto !== undefined) {
		
		var gotoPanel = panelContainers[goto];
		var gotoBitmap = gotoPanel.getChildByName("panelBitmap");
		start = { 
			x: bitmap.image.width*bitmap.scaleX, 
			y: bitmap.image.height*bitmap.scaleY / 2
		};
		end = { 
			x: gotoPanel.x - panel.x, 
			y: gotoPanel.y + gotoBitmap.image.height*gotoBitmap.scaleY/2 - panel.y
		};
		//console.log("line to panel: " + goto + " - from (" + start.x + "," + start.y + ") to (" + end.x + "," + end.y + ")" );
		
		conn_shape.graphics.s("#222").mt(start.x, start.y).lt(end.x, end.y).es();
	}
}

function zoom(zoomModifier) {
	
	viewScale += zoomStep * zoomModifier;
	
	createjs.Tween.get(viewContainer, {override: true})
		.to({ scaleX: viewScale, scaleY: viewScale }, 200, createjs.Ease.cubicOut);
	
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

