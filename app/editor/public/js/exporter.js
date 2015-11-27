// EXPORTER

const JSZip = require('jszip');
const JSZipUtils = require('jszip-utils');
const saveAs = require('filesaverjs').saveAs;

exports.exportToZip = function(json) {
	let zip = new JSZip();
	let done = 3;
	
	JSZipUtils.getBinaryContent('js/runtime-export.zip', function(err, data) {
		if(err) {
    	  throw err; // or handle the error
   		}
   		zip.load(data);
   		zip.file('game.json', JSON.stringify(json, null, 4));
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
