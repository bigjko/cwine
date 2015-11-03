var express = require("express");
var app = express();
var path = __dirname + '/';
//var editor = require(path + "app/editor/js/editor.js");
// respond with "Hello World!" on the homepage
app.get('/', function (req, res) {
  res.sendFile(path + 'app/game/views/index.html');
});

app.get('/edit', function (req, res) {
  res.sendFile(path + 'app/editor/views/index.html');
});

app.use(express.static('app/shared/public'));
app.use(express.static('app/editor/public'));
app.use(express.static('app/game/public'));


app.use('*', function (req, res) {
  res.sendFile(path + 'app/shared/views/error/404.html');
});

app.listen(8080,function(){
  console.log("Live at Port 8080");
});