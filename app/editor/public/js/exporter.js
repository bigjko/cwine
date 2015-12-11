// EXPORTER

const JSZip = require('jszip');
const JSZipUtils = require('jszip-utils');
const saveAs = require('filesaverjs').saveAs;

const containsImage = function(image, list) {
    var i;
	let imagedata = image.split('base64,').pop()
    for (let i = 0; i < list.length; i++) {
        if (list[i].data === imagedata) {
            return list[i].name;
        }
    }

    return undefined;
};

const handleImages = function(json) {
	let images = [];
	
	for (let n=0; n<json.nodes.length; n++) {
		let node = json.nodes[n];
		if (node !== null && node.image !== undefined) {
			let exists = containsImage(node.image, images);
			if (exists !== undefined) {
				node.image = 'img/' + exists;
			} else {
				let extension = '.jpeg';
				if (node.image.indexOf('image/png') != -1) extension = '.png';
				let newimage = { name: 'image_' + images.length + extension,
								data: node.image.split('base64,').pop() };
				images.push(newimage);
				node.image = 'img/' + newimage.name;
			}
			if (node.elements !== undefined) {
				for (let e=0; e < node.elements.length; e++) {
					let element = node.elements[e];
					if (element !== null && element.image !== undefined) {
						let exists = containsImage(element.image, images);
						if (exists !== undefined) {
							element.image = 'img/' + exists;
						} else {
							let extension = '.jpeg';
							if (element.image.indexOf('image/png') != -1) extension = '.png';
							let newimage = { name: 'image_' + images.length + extension,
											data: element.image.split('base64,').pop() };
							images.push(newimage);
							element.image = 'img/' + newimage.name;
						}
					}
				}
			}
		}
	}
	return images;
};

exports.exportToZip = function(json) {
	let zip = new JSZip();
	let images = handleImages(json);
	console.log(images);
	//let done = 3;
	
	JSZipUtils.getBinaryContent('js/runtime-export.zip', function(err, data) {
		if(err) {
    	  throw err; // or handle the error
   		}
   		zip.load(data);
		
   		zip.file('game.json', JSON.stringify(json, null, 4));
		for (let i=0; i<images.length; i++) {
			zip.file('img/'+images[i].name, images[i].data, {base64:true});
		}
   		JSZipUtils.getBinaryContent('js/cwine-runtime.js', function(err, data) {
			if(err) {
	    	  throw err; // or handle the error
	   		}
			zip.file('js/cwine-runtime.js', data, {binary:true});
			JSZipUtils.getBinaryContent('css/style.css', function(err, data) {
				if(err) {
		    	  throw err; // or handle the error
		   		}
				zip.file('css/style.css', data, {binary:true});
				let blob = zip.generate({type:"blob"});
				saveAs(blob, "cwine.zip");
			});
		});
   	});
};

exports.exportToJSON = function(json) {
	console.log('export to json!');
	let string = JSON.stringify(json, null, 4);
	let blob = new Blob ([string], {type:'application/json'});
	saveAs(blob, 'cwine.json');
}

