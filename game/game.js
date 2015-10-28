var panels;
var config;

var request = new XMLHttpRequest();
request.open('GET', 'game/panels.json', true);

var mobile_small_panels = 0;

request.onload = function() {
  if (request.status >= 200 && request.status < 400) {
    // Success!
	//alert(request.responseText);
    var json = JSON.parse(request.responseText)
    panels = json.nodes;
    config = json.config;
    preloadImages(panels, start);
  } else {
    // We reached our target server, but it returned an error
    document.getElementById("panels").innerHTML = "What?" + request.responseText;
  }
};

request.onerror = function() {
  document.getElementById("panels").innerHTML = "Huh?!";
};

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
    images.push(array[i].image);
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
	
  function imageLoaded() {
	loaded++;
	updateProgress();
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

request.send();

function speechBubble(sb) {

  var bubble_html = "";
  var image = "";
  var center = "";
  var box_class = "";

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

  if (bubble_orient == "down") center = "center-origin";

  var align_x = "left";
  var align_y = "top";
  if (sb.align !== undefined) {
    align_x = sb.align.x;
    align_y = sb.align.y;
  }

  var clickable = "";
  var onclick = "";
  if (sb.goto !== undefined) {

    clickable = "clickable";
    onclick = ' onclick="addPanel(' + sb.goto + ')" '

  }

  var transform = "transform: translate(" + sb.position.x.toString() + "%, " + sb.position.y.toString() + "%);";
  var position = align_x + ":" + Math.round(sb.position.x).toString() + "%;" + align_y + ":" + Math.round(sb.position.y).toString() + "%;";

  bubble_html = "<div class='bubble " + center + " " + box_class + " " + clickable + " noselect'" +
                "style='background-image:url(\"game/img/bubbles/" + image + "\");" + 
                position + "'" + onclick + ">" +
                "<p>" + sb.text.replace(/\n/g, "<br>") + "</p></div>";


  return bubble_html;
}


var row_size = 0;
var row_count = 0;


function start() {
	var start_id = config.startnode;
	
	var id = start_id;
	var count = 0;
	
	document.getElementById("panels").innerHTML = "<div class='row'></div>";
	addPanel(start_id);
}

function movePanels(row, size) {
	console.log("row: " + row + ", row size: " + size);
	switch (size) {
		case 3:
		document.querySelector("#panels").children[row].children[0].className += " offset-by-one-half";
		break;
		
		case 2:
		document.querySelector("#panels").children[row].children[0].className += " offset-by-three";
		break;
		
		case 1:
		document.querySelector("#panels").children[row].children[0].className += " offset-by-five";
		break;
	}
}

function addPanel(id) {
  var bubbles = document.querySelectorAll(".clickable");
  for (b=0; b<bubbles.length; b++) {
    removeClass(bubbles[b], "clickable");
  }

	//var output = "";
	var count = 0;
	//output += newPanelElement(id);
	
	if (panels[id].size + row_size > 4) {
	  // NEW ROW
		//output += "</div><div class='row'>";
		//if (row_size < 4) movePanels(row_count,row_size);
		document.getElementById("panels").innerHTML += "<div class='row'></div>";
		row_size = 0;
		row_count++;
	}
	document.getElementById("panels").children[row_count].innerHTML += newPanelElement(id);
	
	row_size += panels[id].size;
	
	while (panels[id].goto !== undefined) {
		id = panels[id].goto;
		count++;
		if (panels[id].size + row_size > 4) {
		  // NEW ROW
			//if (row_size < 4) movePanels(row_count,row_size);
			document.getElementById("panels").innerHTML += "<div class='row'></div>";
			row_size = 0;
			row_count++;
		}
		document.getElementById("panels").children[row_count].innerHTML += newPanelElement(id);
		row_size += panels[id].size;

    // In case of infinite looping comic: Abort
		if (count > 50) break;
	}

  setTimeout(function() {
    var panel_divs = document.querySelectorAll(".panel");
    for (var p=0; p<panel_divs.length;p++) { panel_divs[p].style.opacity = 1; }
  },100);
	/*
	setTimeout(function() {
		var panel_divs = document.querySelectorAll(".panel");
		for (var p=0; p<panel_divs.length;p++) { panel_divs[p].style.opacity = 1; }
	},100);*/
}

function newPanelElement(id) {
	
	var i = id;
	var output = "";

	var panel_html = "";

    var mobile_small = "";

    if (panels[i].size == 1) {
		if (mobile_small_panels === 0) {
			mobile_small = "mobile-margin";
			mobile_small_panels++;
		}
		else mobile_small_panels = 0;
    }
    else mobile_small_panels = 0;

    var column_size;
    switch (panels[i].size) {
      case 1:
      column_size = "three columns";
      break;
      case 2:
      column_size = "six columns";
      break;
      case 3:
      column_size = "nine columns";
      break;
      case 4:
      column_size = "twelve columns";
      break;
    }
		panel_html += "<div class='panel noselect " + column_size + " " + mobile_small + "' style='opacity:0;'>";   

    var height = 280;
    if (panels[i].height !== undefined) height = panels[i].height;

		//panel_html += "<img class='u-max-full-width' src='game/img/" + panels[i].image + "' />";
    panel_html += "<img class='u-max-full-width' src='" + panels[i].image + "' />";
    
    for (var e=0; e < panels[i].elements.length; e++) {
      var el = panels[i].elements[e];
      
      panel_html += speechBubble(el);
      /*"<div class='bubble center-bubble' " + 
      "style='"+ speechBubble(el.bubble_type) +
      align_x + ":"+ el.position.x +"%; " + 
      align_y + ":"+ el.position.y +"%;'>" +
      "<p>" + el.text + "</p>" +
      "</div>";*/
    }

    panel_html += "</div>";

    output += panel_html;
	
	//output = "IS THIS WORKING?!";
	
	
	return output;
}

function hasClass(ele,cls) {
    return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}

function removeClass(ele,cls) {
    if (hasClass(ele,cls)) {
        var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
        ele.className=ele.className.replace(reg,' ');
    }
}