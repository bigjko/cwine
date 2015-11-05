var panels;
var config;

var $ = require('jquery');
var jQBridget = require('jquery-bridget');
var Packery = require('packery');
var imagesLoaded = require('imagesloaded');
$.bridget('packery', Packery);

function loadJSON(path) {
  var request = new XMLHttpRequest();
  request.open('GET', path, true);

  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      // Success!
    //alert(request.responseText);
      var json = JSON.parse(request.responseText);
      panels = json.nodes;
      config = json.config;
      preloadImages(panels, start);
    } else {
      // We reached our target server, but it returned an error

    }
  };

  request.onerror = function() {

  };

  request.send();
}

function loadLocal() {
  var localforage = require('localforage');

  localforage.getItem('cwine', function(err, value) {
    panels = value.nodes;
    config = value.config;
    preloadImages(panels,start);
  });
}

function preloadImages(array, callback) {
  var loaded = 0;
  var images = [];
  for (var i=0; i<array.length; i++) {
    images.push(array[i].image);
  }

  function updateProgress() {
    document.getElementById('progress_bar').style.width = (loaded/images.length * 100).toString() + "%";
    if (loaded == images.length) {
      setTimeout(function() {
        document.getElementById('progress').style.opacity = 0;
      }, 100);
      callback();
    }
  }
  
  function imageLoaded() {
  loaded++;
  updateProgress();
   }

  setTimeout(function() {
    document.getElementById('progress').style.opacity = 1;
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
  if (align_x == 'left') speechbubble.style.left = position.x;
  else speechbubble.style.right = position.x;
  if (align_y == 'top') speechbubble.style.top = position.y;
  else speechbubble.style.bottom = position.y;
  speechbubble.classList.add('bubble');
  if (sb.bubble_type == 'down') speechbubble.classList.add('center-origin');
  if (sb.bubble_type == 'box') speechbubble.classList.add('box');

  // INTERACTIVE BUBBLE!
  if (sb.goto !== undefined) {
    speechbubble.classList.add('clickable');
    speechbubble.onclick = function() {
      addPanel(sb.goto);
    };
  }

  speechbubble.innerHTML = '<p>' + sb.text.replace(/\n/g, '<br>') + '</p>';

  return speechbubble;
}

var $container;

function start() {
  var start_id = config.startnode;
  
  var panels = getPanel(start_id);

  $container = $('#panels');

  $container
    .append(panels)
    .packery({
      itemSelector: '.panel',
      gutter: '.gutter-size',
      percentPosition: true
    });

  /*setTimeout(function() {
    var panel_divs = document.querySelectorAll(".panel");
    for (var p=0; p<panel_divs.length;p++) { panel_divs[p].style.opacity = 1; }
  },100);*/
}

function addPanel(id) {
  var panels = getPanel(id);

  $container
    .append(panels)
    .packery('appended', panels);

  $container.packery();

  /*setTimeout(function() {
    var panel_divs = document.querySelectorAll(".panel");
    for (var p=0; p<panel_divs.length;p++) { panel_divs[p].style.opacity = 1; }
  },100);*/
}

function getPanel(id) {
  var elems = [];

  var bubbles = document.querySelectorAll(".clickable");
  for (var b=0; b<bubbles.length; b++) {
    removeClass(bubbles[b], "clickable");
    bubbles[b].removeAttribute('onclick');
  }

  var count = 0;
  
  var p = newPanelElement(id);
 
  elems.push(p);

  
  while (panels[id].goto !== undefined && panels[id].goto != -1 && panels[id].goto !== null) {
    id = panels[id].goto;
    count++;
    p = newPanelElement(id);
    elems.push(p);

    // In case of infinite looping comic: Abort
    if (count > 50) break;
  }

  return elems;
}

function newPanelElement(id) {

  var paneldiv = $('<div>').addClass('panel noselect ' + 'w' + panels[id].size).css('opacity', 1);
  var panelimg = $('<img>').attr('src', panels[id].image);

  paneldiv.append(panelimg);

  for (var e=0; e < panels[id].elements.length; e++) {
    var el = panels[id].elements[e];
    paneldiv.append(speechBubble(el));
  }
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

