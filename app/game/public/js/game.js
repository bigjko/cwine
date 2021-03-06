var panels;
var config;

var $ = require('jquery');
//var jQBridget = require('jquery-bridget');
//var Packery = require('packery');
//$.bridget('packery', Packery);

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

window.loadJSON = loadJSON;

function loadLocal() {
  var localforage = require('localforage');

  localforage.getItem('cwine', function(err, value) {
    panels = value.nodes;
    config = value.config;
    preloadImages(panels,start);
  });
}

window.loadLocal = loadLocal;

function preloadImages(array, callback) {
  var loaded = 0;
  var images = [];
  for (var i=0; i<array.length; i++) {
    if (array[i] !== null && array[i] !== undefined && array.indexOf(array[i].image) == -1) images.push(array[i].image);
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

  //ar bubble = document.createElement('DIV');
  var bubble = $('<div>');

  if (sb.image !== undefined) {
    bubble.css('background-image', 'url("' + sb.image + '")');
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
  if (align_x == 'left') bubble.css('left', position.x);
  else bubble.css('right', position.x);
  if (align_y == 'top') bubble.css('top', position.y);
  else bubble.css('bottom', position.y);
  bubble.addClass('bubble');
  if (sb.bubble_type == 'down') bubble.addClass('center-origin');
  if (sb.bubble_type == 'box') bubble.addClass('box');
  if (sb.width !== undefined && sb.width !== "") bubble.css('width',sb.width+'%');
  if (sb.height !== undefined && sb.height !== "") bubble.css('height', sb.height+'%');
  if ((sb.width === undefined || sb.width === "") && (sb.height === undefined || sb.height === "")) bubble.css('white-space', 'nowrap');
  if (sb.hideOnProgress) { bubble.addClass('hidenext'); }

  // INTERACTIVE BUBBLE!
  if (sb.goto !== undefined && sb.goto !== null && panels[sb.goto] !== null) {
    bubble.addClass('clickable');
    bubble.on('click', function() {
      $(this).addClass('clicked');
      //debugger;
      $(this).parent().children('.hidenext:not(.clicked)').fadeOut();
      addPanel(sb.goto);
    });
  }

  bubble.html('<p>' + sb.text.replace(/\n/g, '<br>') + '</p>');
  
  if (sb.padding !== undefined) {
    bubble.children('p').data('padding', sb.padding);
    console.log(bubble.children('p').data('padding'));
  }

  return bubble;
}

var $container;

function start() {

  var start_id = config.startnode;
  
  var panels = getPanel(start_id);

  /*var diff = $('#panels').clientWidth / $('#panels').css('width');
  $('#panels').css('font-size', 13*diff + 'px');*/
  if (config.comic_width !== undefined) $('#panels').css('width', config.comic_width+'%');
  if (config.comic_maxwidth !== undefined) $('#panels').css('max-width', config.comic_maxwidth+'px');
  if (config.comic_font !== undefined) {
      $('#panels').css('font-family', '\'' + config.comic_font + '\', Verdana, Geneva, sans-serif');
  }

  $( window ).resize(function() {
    resizePanels();
  });

  var lineheight = 0.85;
  if (config.comic_lineheight !== undefined) lineheight = config.comic_lineheight * 0.6;
  $container = $('#panels');
  $container.append(panels);
  $('.panel').animate({ opacity: 1 });
  resizePanels();

  /*setTimeout(function() {
    var panel_divs = document.querySelectorAll(".panel");
    for (var p=0; p<panel_divs.length;p++) { panel_divs[p].style.opacity = 1; }
  },100);*/
}

function resizePanels() {
  var diff = $('#panels').innerWidth() / 800;
  var fontsize = 12;
  var lineheight = 0.85;
  if (config.comic_fontsize !== undefined) fontsize = config.comic_fontsize;
  if (config.comic_lineheight !== undefined) lineheight = config.comic_lineheight * 0.6;
  $('.bubble p').each( function(index) {
    if ($(this).data('padding') !== undefined) {
      console.log('element has padding');
      padding = $(this).data('padding');
    } else if (config.default_padding !== undefined) {
      padding = config.default_padding;
    } else padding = '12 18 20';
    for (var p=0; p<padding.length; p++) {
      padding[p] *= diff;
    }
    padding = padding.split(' ').join('px ') + 'px';
    console.log(padding);
    $(this).css({'padding': padding, 'line-height': lineheight*diff+'rem'});
  });
  
  $('#panels').css({'font-size': fontsize*diff + 'px'});
}

function addPanel(id) {

  $('.bubble').removeClass('clickable').off('click');

  var panels = getPanel(id);

  $container.append(panels);
  $('.panel').animate({ opacity: 1 });
  
  resizePanels();

  //$container.packery('appended', panels);

  /*setTimeout(function() {
    var panel_divs = document.querySelectorAll(".panel");
    for (var p=0; p<panel_divs.length;p++) { panel_divs[p].style.opacity = 1; }
  },100);*/
}

function getPanel(id) {
  var elems = [];

  var count = 0; 
  var p = newPanelElement(id);
 
  elems.push(p);

  
  while (panels[id].goto !== undefined && panels[id].goto != -1 && panels[id].goto !== null && panels[panels[id].goto] !== null) {
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
  console.log(id);
  var li = $('<li>').addClass('panel-list');
  var paneldiv = $('<div>').addClass('panel noselect hidden ' + 'w' + panels[id].size);
  var panelimg = $('<img>').attr('src', panels[id].image);

  paneldiv.append(panelimg);

  if (panels[id].elements !== undefined && panels[id].elements !== null) {
    for (var e=0; e < panels[id].elements.length; e++) {
      var el = panels[id].elements[e];
      if (el !== null) paneldiv.append(speechBubble(el));
    }
  } 
  return paneldiv;
}

//// LOAD COMIC

//loadLocal();

