var panels;

var request = new XMLHttpRequest();
request.open('GET', 'game/panels.json', true);

var mobile_small_panels = 0;

request.onload = function() {
  if (request.status >= 200 && request.status < 400) {
    // Success!
	//alert(request.responseText);
    panels = JSON.parse(request.responseText);
    preloadImages(panels, showPanels);
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
    images.push("game/img/" + array[i].image);
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

  if (bubble_orient == "down") center = "center-bubble";

  var align_x = "left";
  var align_y = "top";
  if (sb.align !== undefined) {
    align_x = sb.align.x;
    align_y = sb.align.y;
  }

  bubble_html = "<div class='bubble " + center + " " + box_class + "'" +
                "style='background-image:url(\"game/img/bubbles/" + image + "\");" + 
                align_x + ":"+ sb.position.x +"%; " + 
                align_y + ":"+ sb.position.y +"%;'>" +
                "<p>" + sb.text + "</p></div>";


  return bubble_html;
}

function showPanels() {
  var output = "";
  var row_size = 0;
  output += "<div class='row'>";
	for (var i = 0; i < panels.length; i++) {

    var panel_html = "";

    if (panels[i].size + row_size > 4) {
      // NEW ROW
      output += "</div><div class='row'>";
      row_size = 0;
    }

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
		panel_html += "<div class='panel " + column_size + " " + mobile_small + "' style='opacity:0;'>";   

    var height = 280;
    if (panels[i].height !== undefined) height = panels[i].height;

		//panel_html += "<img class='u-max-full-width' src='game/img/" + panels[i].image + "' />";
    panel_html += "<img class='u-max-full-width' src='game/img/" + panels[i].image + "' />";
    
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

    row_size += panels[i].size;
	}
  output += "</div>";
  //output = "IS THIS WORKING?!";
  document.getElementById("panels").innerHTML = output;
  setTimeout(function() {
    var panel_divs = document.querySelectorAll(".panel");
    for (var p=0; p<panel_divs.length;p++) { panel_divs[p].style.opacity = 1; }
  },50);
}