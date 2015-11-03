var localforage = require('localforage');
/*exports.checkPath = function(path)
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
}*/

exports.loadAllImages = function(path, callback) {
	
    var request = new XMLHttpRequest();
	request.open('GET', "./js/img-folder.php", true);

	request.onload = function() {
		if (request.status >= 200 && request.status < 400) {
			//document.querySelector("#properties").innerHTML = request.responseText;
			//console.log(request.responseText);
			callback(JSON.parse(request.responseText));
		} else {
		// We reached our target server, but it returned an error
		alert(request.responseText);
		return null;
		}
	};

	request.onerror = function() {
		alert(request.responseText);
	};

	request.send();
}

exports.save = function(obj, path) {
	//if (!checkPath(path)) return;

	/*var filename = path.split("/").pop();

	//doesFileExist(path);
	writeToFile();

	function doesFileExist(urlToFile)
	{
		var xhr = new XMLHttpRequest();
		xhr.open('HEAD', urlToFile, true);
		xhr.send();

		xhr.onload = function() {
			if (xhr.status == 404) {
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
                //window.alert(sendrequest.responseText);
				var dialog = document.querySelector("#dialog");
				dialog.innerHTML = "<p>'" + path + "' saved successfully<p>";
				//dialog.style.top = "50%";
				//dialog.style.left = "50%";
				dialog.style.opacity = "0.8";
				dialog.style.backgroundColor = "#333";
				setTimeout(function() {
					dialog.style.opacity = "0";
				}, 2000);
			}
			//window.alert(sendrequest.status + " - " + sendrequest.responseText);
		};
		sendrequest.open("POST","./json.php",true);
		sendrequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		//sendrequest.responseType = 'json';
		console.log(path);
		sendrequest.send("json=" + JSON.stringify(obj, null, 4) + "&path=" + path);
	}*/

	localforage.setItem('cwine', obj, function(err, result) { 	
		var dialog = document.querySelector("#dialog");
		dialog.innerHTML = "<p>Cwine saved successfully<p>";
		dialog.style.opacity = "0.8";
		dialog.style.backgroundColor = "#333";
		setTimeout(function() {
			dialog.style.opacity = "0";
		}, 2000);
	});
}

exports.load = function(callback) {

	localforage.getItem('cwine', function(err, value) {
		preloadImages(value,callback); 	
		//callback(value);
	});
}

exports.loadJSON = function(path, callback) {

	//if (!checkPath(path)) return;
	//clearAll();

	var request = new XMLHttpRequest();
	request.open('GET', path + '?_=' + new Date().getTime(), true);

	var mobile_small_panels = 0;

	request.onload = function() {
		if (request.status >= 200 && request.status < 400) {
			// Success!
			//panels = JSON.parse(request.responseText);
            var obj = JSON.parse(request.responseText);
            //console.log(obj);
			preloadImages(obj, callback);
			//callback(obj);
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
}

function preloadImages(obj, callback) {
	var loaded = 0;
	var images = [];
	/*images.push("img/bubbles/medium_bubble_left.png");
	images.push("img/bubbles/medium_bubble_down.png");
	images.push("img/bubbles/medium_box.png");
	images.push("img/bubbles/small_box.png");
	images.push("img/bubbles/small_bubble_down.png");
	images.push("img/bubbles/x_small_bubble_left.png");*/
	for (var i=0; i<obj.nodes.length; i++) {
		images.push(obj.nodes[i].image);
	}

	function imageLoaded() {
		loaded++;
		//console.log("Image loaded.." + loaded + "/" + images.length);
		updateProgress();
	}

	function updateProgress() {
		document.getElementById("progress_bar").style.width = (loaded/images.length * 100).toString() + "%";
		//console.log("update progress..");
		if (loaded == images.length) {
			console.log("Finished preloading images..");
			setTimeout(function() {
				document.getElementById("progress").style.opacity = "0";
			}, 100);
			callback(obj);
		}
	}

	setTimeout(function() {
		document.getElementById("progress").style.opacity = "1";
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