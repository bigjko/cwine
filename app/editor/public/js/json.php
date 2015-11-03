<?php
	$json = $_POST['json'];
	$path = $_POST['path'];
	echo $path;
	
	if (json_decode($json) != null) { /* sanity check */
		file_put_contents($path,$json);
		echo "Fuck dig Mads! File has been saved!";
	} else {
		// handle error
		echo "Uh oh! Error";
	}
?>
	