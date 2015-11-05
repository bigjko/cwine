var panels;
var config;
var mobile_small_panels = 0;

var $ = require('jquery');

function loadJSON(path) {
  var request = new XMLHttpRequest();
  request.open('GET', path, true);

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

  request.send();
}

function loadLocal() {
  var localforage = require('localforage');

  localforage.getItem('cwine', function(err, value) {
    panels = value.nodes;
    config = value.config;
    preloadImages(panels,start);
    //callback(value);
  });
}

function preloadImages(array, callback) {
  var loaded = 0;
  var images = [];
  /*images.push("game/img/bubbles/medium_bubble_left.png");
  images.push("game/img/bubbles/medium_bubble_down.png");
  images.push("game/img/bubbles/medium_box.png");
  images.push("game/img/bubbles/small_box.png");
  images.push("game/img/bubbles/small_bubble_down.png");
  images.push("game/img/bubbles/x_small_bubble_left.png");*/
  for (var i=0; i<array.length; i++) {
    images.push(array[i].image);
  }

  function updateProgress() {
    document.getElementById("progress_bar").style.width = (loaded/images.length * 100).toString() + "%";
    if (loaded == images.length) {
      setTimeout(function() {
        document.getElementById("progress").style.opacity = 0;
      }, 100);
      console.log("Preloading done!");
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



function speechBubble(sb) {
/*
  var bubble_html = "";
  var image = "";
  var center = "";
  var box_class = "";
  var bubble_orient = sb.bubble_type;
  
  image = sb.image;

  if (bubble_orient == "down") center = "center-origin";

  if (bubble_orient == "box") {
    //image += "_box.png";
    box_class = "box";
  }
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

  //var transform = "transform: translate(" + sb.position.x.toString() + "%, " + sb.position.y.toString() + "%);";
  var position = align_x + ":" + Math.round(sb.position.x*100).toString() + "%;" + align_y + ":" + Math.round(sb.position.y*100).toString() + "%;";

  bubble_html = "<div class='bubble " + center + " " + box_class + " " + clickable + " noselect'" +
                "style='background-image:url(\"" + image + "\");" + 
                position + "'" + onclick + ">" +
                "<p>" + sb.text.replace(/\n/g, "<br>") + "</p></div>";


  return bubble_html;*/

  var speechbubble = document.createElement('DIV');

  if (sb.image !== undefined) {
    speechbubble.style.backgroundImage = 'url("' + sb.image + '")';
  }
  var align_x = "left";
  var align_y = "top";
  if (sb.align !== undefined) {
    align_x = sb.align.x;
    align_y = sb.align.y;
  }
  var position = {
    x: Math.round(sb.position.x*100).toString() + "%",
    y: Math.round(sb.position.y*100).toString() + "%"
  };
  console.log(position);
  if (align_x == "left") speechbubble.style.left = position.x;
  else speechbubble.style.right = position.x;
  if (align_y == "top") speechbubble.style.top = position.y;
  else speechbubble.style.bottom = position.y;
  speechbubble.classList.add('bubble');
  if (sb.bubble_type == 'down') speechbubble.classList.add('center-origin');
  if (sb.bubble_type == 'box') speechbubble.classList.add('box');

  // INTERACTIVE BUBBLE!
  if (sb.goto !== undefined) {
    speechbubble.classList.add('clickable');
    speechbubble.onclick = function() {
      addPanel(sb.goto);
    }
  }

  speechbubble.innerHTML = '<p>' + sb.text.replace(/\n/g, '<br>') + '</p>';

  return speechbubble;
}


var row_size = 0;
var row_count = 0;


function start() {
  var start_id = config.startnode;
  
  //var id = start_id;
  //var count = 0;
  
  document.getElementById("panels").innerHTML = "<div class='row'></div>";
  addPanel(start_id);
}

/*function movePanels(row, size) {
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
}*/

function addPanel(id) {
  var bubbles = document.querySelectorAll(".clickable");
  for (b=0; b<bubbles.length; b++) {
    removeClass(bubbles[b], "clickable");
    bubbles[b].removeAttribute('onclick');
  }

  //var output = "";
  var count = 0;
  //output += newPanelElement(id);
  
  var p = newPanelElement(id);
  if (panels[id].size + row_size > 4) {
    p.addClass('first');
    row_size = 0;
  }
  $('#panels').append(p);
  //document.getElementById("panels").appendChild(p);
  //document.getElementById("panels").children[row_count].appendChild(newPanelElement(id));
  row_size += panels[id].size;
  
  while (panels[id].goto !== undefined && panels[id].goto != -1 && panels[id].goto !== null) {
    id = panels[id].goto;
    console.log(id);
    count++;
    p = newPanelElement(id);
    if (panels[id].size + row_size > 4) {
      p.addClass('first');
      row_size = 0;
    }
    $('#panels').append(p);
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
  //var output = "";

  //var panel_html = "";

  var mobile_small = "";

  if (panels[id].size == 1) {
  if (mobile_small_panels === 0) {
    mobile_small = "mobile-margin";
    mobile_small_panels++;
  }
  else mobile_small_panels = 0;
  }
  else mobile_small_panels = 0;

  var column_size;
  switch (panels[id].size) {
    case 1:
    column_size = "three";
    break;
    case 2:
    column_size = "six";
    break;
    case 3:
    column_size = "nine";
    break;
    case 4:
    column_size = "twelve";
    break;
  }
  /*var paneldiv = document.createElement('DIV');
  paneldiv.classList.add('panel');
  paneldiv.classList.add('noselect');*/
  var paneldiv = $('<div>').addClass('panel noselect');
  if (column_size != "" && column_size !== undefined) {
    paneldiv.addClass(column_size + ' columns');
  }
  if (mobile_small != "" && mobile_small !== undefined) paneldiv.addClass(mobile_small);
  paneldiv.css('opacity', 0);
    //panel_html += "<div class='panel noselect " + column_size + " " + mobile_small + "' style='opacity:0;'>";   

  var height = 280;
  if (panels[id].height !== undefined) height = panels[id].height;

  //panel_html += "<img class='u-max-full-width' src='game/img/" + panels[i].image + "' />";
  var panelimg = $('<img>');
  panelimg.addClass('u-max-full-width');
  panelimg.attr('src', panels[id].image);
  //panel_html += "<img class='u-max-full-width' src='" + panels[i].image + "' />";

  panelimg.appendTo(paneldiv);

  for (var e=0; e < panels[id].elements.length; e++) {
    var el = panels[id].elements[e];
    
    paneldiv.append(speechBubble(el));
    /*"<div class='bubble center-bubble' " + 
    "style='"+ speechBubble(el.bubble_type) +
    align_x + ":"+ el.position.x +"%; " + 
    align_y + ":"+ el.position.y +"%;'>" +
    "<p>" + el.text + "</p>" +
    "</div>";*/
  }

  //panel_html += "</div>";

  //output += panel_html;

  //output = "IS THIS WORKING?!";


  return paneldiv;
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



//// LOAD COMIC

loadLocal();

