var panels;
var stage;
var viewContainer;
//var firstLoad = true;
var viewScale = 1;
var dragoffset = {x:0, y:0};
//var dragBox;
var zoomNumber = 3;
var zoomStep = [0.2, 0.3, 0.5, 0.75, 1, 1.5, 2];

var defaultGamePath = "game/";
var con_r = 6;
/*window.onload = function() {
  setTimeout(function() {
    // preload image
    new Image().src = "game/img/panel_01.png";
  }, 1000);
}; */

window.onload = function() { 
	document.querySelector("#load").onclick = function() {
		loadJSON(defaultGamePath + document.querySelector("#filepath").value);
	};
	document.querySelector("#save").onclick = function() {
		saveJSON(defaultGamePath + document.querySelector("#filepath").value);
	};
	//document.querySelector("#save");
	loadJSON(defaultGamePath + "panels.json"); 
};

function checkPath(path)
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
}

function saveJSON (path) {
	
	if (!checkPath(path)) return;
	
	var filename = path.split("/").pop();
	
	doesFileExist(path);
	
	function doesFileExist(urlToFile)
	{
		var xhr = new XMLHttpRequest();
		xhr.open('HEAD', urlToFile, true);
		xhr.send();
		
		xhr.onload = function() {
			if (xhr.status == "404") {
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
				var dialog = document.querySelector("#dialog");
				dialog.innerHTML = "<p>'" + path + "' saved successfully<p>";
				//dialog.style.top = "50%";
				//dialog.style.left = "50%";
				dialog.style.opacity = 0.8;
				setTimeout(function() {
					dialog.style.opacity = 0;
				}, 2000);
			}
			//window.alert(sendrequest.status + " - " + sendrequest.responseText);	
		};
		sendrequest.open("POST","json.php",true);
		sendrequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		//sendrequest.responseType = 'json';
		console.log(path);
		sendrequest.send("json=" + JSON.stringify(panels, null, 4) + "&path=" + path);
	}
}

function loadJSON (path) {
	
	if (!checkPath(path)) return;
	//clearAll();
	
	var request = new XMLHttpRequest();
	request.open('GET', path + '?_=' + new Date().getTime(), true);

	var mobile_small_panels = 0;

	request.onload = function() {
		if (request.status >= 200 && request.status < 400) {
			// Success!
			panels = JSON.parse(request.responseText);
			preloadImages(panels, init);
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
}

//request.send();

function initPanels() {
	
	function handleMouseDown(evt) {
		dragoffset.x = evt.stageX/viewScale - evt.target.parent.x;
		dragoffset.y = evt.stageY/viewScale - evt.target.parent.y;
	}
	
	function handleMouseMove(evt) {
		//console.log(evt.target);
		evt.target.parent.x = evt.stageX/viewScale - dragoffset.x;
		evt.target.parent.y = evt.stageY/viewScale - dragoffset.y;

		evt.target.parent.x = Math.round(evt.target.parent.x*0.1)*10;
		evt.target.parent.y = Math.round(evt.target.parent.y*0.1)*10;
		
		//console.log(evt.target.parent);
		//drawConnections(evt.target.parent);
		drawAllConnections();
	}
	
	function handleMouseUp(evt) {
		panelCt = evt.target.parent;
		panelNr = viewContainer.getChildIndex(panelCt);
		
		panels[panelNr].editor.position.x = panelCt.x;
		panels[panelNr].editor.position.y = panelCt.y;
		console.log("Mouse Up! " + panelCt.x + ", " + panelCt.y );
	}
	
	function dragLine(evt) {
		var pan = evt.target.parent;
		var cl = pan.getChildByName("connectionLines");
		var sock = pan.getChildByName("panelSocket");
		var id = viewContainer.getChildIndex(pan);
		cl.graphics.clear();
		var local = pan.globalToLocal(evt.stageX, evt.stageY);
		//console.log(pan.globalToLocal(evt.stageX, evt.stageY));
		cl.graphics.s("#000").mt(sock.x+con_r*viewScale, sock.y).lt(local.x,local.y);
	}
	
	function releaseLine(evt) {		
		var id = viewContainer.getChildIndex(evt.target.parent);
		panels[id].goto = undefined;
		drawConnections(viewContainer.children[id]);
		
		var targ = stage.getObjectUnderPoint(evt.stageX, evt.stageY);
		
		console.log("target name: " + targ.name + " parent: " + targ.parent.name + ", evt target: " + evt.target.name + " " + (targ.parent != evt.target.parent));
		
		if (targ.parent.name == "PanelContainer" && targ.parent != evt.target.parent) {
			var goto_id = viewContainer.getChildIndex(targ.parent);
			panels[id].goto = goto_id;
			
		}
		else {
			panels[id].goto = undefined;
		}
		drawConnections(viewContainer.children[id]);
	}
	
	for (var i=0; i < panels.length; i++) {
		var container = new createjs.Container();
		
		if (panels[i].editor === undefined) {
			container.x = 200 + 120*i;
			container.y = 200;
			panels[i].editor = {}; 
			panels[i].editor.position = { x : container.x, y : container.y };
		}
		else {
			container.x = panels[i].editor.position.x;
			container.y = panels[i].editor.position.y;
		}
		
		var bitmap = new createjs.Bitmap("game/img/" + panels[i].image);
				
		bitmap.name = "panelBitmap";
		
		var conn_out = new createjs.Shape();
		conn_out.name = "connectionLines";
		conn_out.cursor = "pointer";
		
		var scale = 0.25;
		//if (panels[i].size == 4) scale = 0.35;
		
		scale = panels[i].size*400*scale / bitmap.image.width;
		
		bitmap.scaleX = scale;
		bitmap.scaleY = scale;
		bitmap.on("mousedown", handleMouseDown);
		bitmap.on("pressmove", handleMouseMove);
		bitmap.on("pressup", handleMouseUp);
		bitmap.cursor = "move";
		
		var connection = new createjs.Shape();
		//connection.graphics.f("#000").dr(0,0,15,15).dc(0,0,30).f("#fff").dc(2,2,11);
		connection.name = "panelSocket";
		connection.regY = con_r;
		connection.x = bitmap.image.width * bitmap.scaleX;
		connection.y = bitmap.image.height/2 * bitmap.scaleY;
		connection.graphics.f("#000").dr(0,0,con_r,con_r*2).dc(con_r,con_r,con_r).f("#fff").dc(con_r,con_r,con_r-2);
		connection.scaleX = 1 / viewScale;
		connection.scaleY = 1 / viewScale;
		connection.cursor = "pointer";
		
		var elements = new createjs.Container();
		elements.name = "Elements";
		
		container.addChild(bitmap, conn_out, connection, elements);
		container.name = "PanelContainer";
		
		connection.on("pressmove", dragLine);
		connection.on("pressup", releaseLine);
		conn_out.on("pressmove", dragLine);	
		conn_out.on("pressup", releaseLine);
		
		// ELEMENTS (speech bubbles, etc.)
		for (var e=0; e < panels[i].elements.length; e++) {
			var panel = panels[i];
			var sb = panels[i].elements[e];
			console.log(sb.text);
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
				box_class = "box";
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

			var elm = new createjs.DOMElement(div);
			
			elm.scaleX = 0.6;
			elm.scaleY = 0.6;
			/*if (panel.size == 4) {
				elm.scaleX = 0.4;
				elm.scaleY = 0.4;
				console.log("COOL SCALE. Fuck dig Mads!");
			}*/
			//div.style.transformOrigin = "0% -100%";
			//div.style.transform = "translate(0, -100%)";
			elm.x = (sb.position.x/100) * bitmap.image.width*bitmap.scaleX;
			elm.y = (sb.position.y/100) * bitmap.image.height*bitmap.scaleY;
			elm.regX = div.clientWidth/2;
			elm.regY = div.clientHeight;
			if (bubble_orient == "left") {
				elm.regX = 0;
			}
			
			var align_x = "left";
			var align_y = "top";
			if (sb.align !== undefined) {
				align_x = sb.align.x;
				align_y = sb.align.y;
			}
			if (align_x == "right") {
				elm.regX = div.clientWidth;
				elm.x = bitmap.image.width*bitmap.scaleX-elm.x;
				console.log(bitmap.image.width*bitmap.scaleX);
				console.log(elm.x);
			}
			if (align_y == "bottom") {
				elm.regY = div.clientHeight;
				elm.y = bitmap.image.height*bitmap.scaleY-elm.y;
				console.log(bitmap.image.height*bitmap.scaleY);
				console.log(elm.y);
			}
			
			//elm.regY = elm.getBounds().height;
			elements.addChild(elm);
		}
		
		viewContainer.addChild(container);
		
		//drawConnections(container);
	  }
	
	drawAllConnections();
  //stage.update();
}



window.onresize = function(event) {
    var view = document.querySelector("#view");
    var sidebar = document.querySelector("#sidebar");

    stage.canvas.width = view.offsetWidth;
    stage.canvas.height = view.offsetHeight;
	
	stage.getChildByName("dragBox").graphics.beginFill("#ccc").drawRect(0,0,stage.canvas.width, stage.canvas.height);
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

function init() {	
	if (stage === undefined) {
		stage = new createjs.Stage("edit_canvas");
		createjs.Ticker.setFPS(60);
		createjs.Ticker.addEventListener("tick", stage);
	}
	else {
		stage.removeAllChildren();
	}
	
	//stage.canvas.width = document.documentElement.clientWidth;
	//stage.canvas.height = document.documentElement.clientHeight;

	stage.canvas.width = document.querySelector("#view").offsetWidth;
	stage.canvas.height = document.querySelector("#view").offsetHeight;
	stage.enableMouseOver(15);
	stage.on("mousedown", function() { document.activeElement.blur(); });

	stage.mouseMoveOutside = true;

	initviewContainer();

	initPanels();

	//stage.update();
	
	//createjs.Ticker.removeAllEventListeners();


	
	/*var tree = "";
	function printTree(disObj) {
		//console.log(disObj);
		for (var i=0; i < disObj.children.length; i++) {
			tree += disObj.children[i].name;
			if (disObj.children[i].children !== undefined) {
				tree += " { ";
				printTree(disObj.children[i]);
				tree += " }";
			}
			tree += ", ";
		}
	}
	printTree(stage);
	console.log(tree);*/
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
	
	dragBox = new createjs.Shape(new createjs.Graphics().beginFill("#ccc").drawRect(0,0,stage.canvas.width, stage.canvas.height));
	dragBox.on("mousedown", function(evt) {
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
	for (var c = 0; c < viewContainer.children.length; c++) {
		drawConnections(viewContainer.children[c]);
	}
}

function drawConnections(panel) {
	var conn_shape = panel.getChildByName("connectionLines");
	var bitmap = panel.getChildByName("panelBitmap");
	//console.log(bitmap);

	conn_shape.graphics.clear();
	//console.log(viewContainer.getChildIndex(panel));
	var goto = panels[viewContainer.getChildIndex(panel)].goto;
	//var connections = panels[panelContainers.getChildIndex(panel)].connected;
	
	if (goto !== undefined) {
		
		var gotoPanel = viewContainer.children[goto];
		var gotoBitmap = gotoPanel.getChildByName("panelBitmap");
		var start = { 
			x: bitmap.image.width*bitmap.scaleX + con_r, 
			y: bitmap.image.height*bitmap.scaleY / 2
		};
		var end = { 
			x: gotoPanel.x - panel.x, 
			y: gotoPanel.y + gotoBitmap.image.height*gotoBitmap.scaleY/2 - panel.y
		};
		//console.log("line to panel: " + goto + " - from (" + start.x + "," + start.y + ") to (" + end.x + "," + end.y + ")" );
		
		conn_shape.graphics.s("#222").ss(3/viewScale).mt(start.x, start.y).lt(end.x, end.y).es();
	}
	
	for (var e=0; e < panels[viewContainer.getChildIndex(panel)].elements.length; e++) {
		var id = panels[viewContainer.getChildIndex(panel)].elements[e].goto;
		if (id !== undefined) {
			var elementToPanel = viewContainer.children[id];
			var elementToBitmap = elementToPanel.getChildByName("panelBitmap");
			var element = panel.getChildByName("Elements").children[e];
			var start = { 
				x: element.x - element.regX*element.scaleX + element.htmlElement.clientWidth*element.scaleX/2, 
				y: element.y - element.regY*element.scaleY + element.htmlElement.clientHeight*element.scaleY/2
			};
			var end = { 
				x: elementToPanel.x - panel.x, 
				y: elementToPanel.y + elementToBitmap.image.height*elementToBitmap.scaleY/2 - panel.y
			};
		
			conn_shape.graphics.s("#fff").ss(2/viewScale).sd([10,5],0).mt(start.x, start.y).lt(end.x, end.y).es();
		}
	}
}

function zoom(zoomModifier) {
	
	if (zoomNumber + zoomModifier < 0 || zoomNumber + zoomModifier >= zoomStep.length) return;
	
	var zoomspeed = 200;
	
	zoomNumber += zoomModifier;
	viewScale = zoomStep[zoomNumber];
	console.log(viewScale);
	
	createjs.Tween.get(viewContainer, {override: true})
		.to({ scaleX: viewScale, scaleY: viewScale }, zoomspeed, createjs.Ease.cubicOut);
	
	for (var c = 0; c < viewContainer.children.length; c++) {
		var ps = viewContainer.children[c].getChildByName("panelSocket");
		createjs.Tween.get(ps, {override: true}).to({scaleX: 1 / viewScale, scaleY: 1 / viewScale}, zoomspeed, createjs.Ease.cubicOut);
		setTimeout(drawConnections(viewContainer.children[c]), 200);
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

