<?php
define('IMAGEPATH', '../game/img/');
//$folder_path = '../game/img/'; //image's folder path
//echo "Hallo Mads!<br>";
//foreach(glob(IMAGEPATH.'*.{jpg,gif,png}', GLOB_BRACE) as $filename){
//    echo '<img width="60" src="game/img/' . basename($filename) . '" />';
//}
$filenames = glob(IMAGEPATH.'*.{jpg,gif,png}', GLOB_BRACE);
header('Content-Type: application/json');
echo json_encode($filenames);

?>