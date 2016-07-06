// ------------ //
//  NODE class  //
// ------------ //
//var editor = require('./editor.js');

import Konva from 'konva';

const headerHeight = 40;
const snapThreshold = 10;

const selectFill = '#005480';
const selectStroke = '#355';

export default class Node extends Konva.Group {
    constructor(options) {
        //if (options.width === undefined) options.width = 100;
        //if (options.height === undefined) options.width = 100;
        super(options);
        this.sockets = [];
        this.ctrldrag = false;
        //this.setup(options);
    }

    setup(obj) {
        //console.log('setup node');
        this.draggable(true);
        this.dragBoundFunc(function(pos) {
            let stage = this.getStage();
            let diff = { x: stage.x() % snapThreshold, y: stage.y() % snapThreshold };
            console.log(diff);
            return {
                x: Math.round((pos.x-diff.x) / snapThreshold) * snapThreshold + diff.x,
                y: Math.round((pos.y-diff.y) / snapThreshold) * snapThreshold + diff.y
            }
        }.bind(this));
        this.name(obj.name);
        this.type = obj.type;
        this.width(obj.width);
        this.height(obj.height);
        this.content = new Konva.Group({
            x:0,
            y:0,
            clip: {
                x:0,
                y:0,
                height:this.height(),
                width:this.width()
            }
        });
        if (obj.editor !== undefined) {
            this.x(obj.editor.position.x);
            this.y(obj.editor.position.y);
        }
        //this.selected = new createjs.Shape();
        //this.addChild(this.selected);
        //let pos = nodeContainer.globalToLocal(x,y);
        //console.log('new node', pos.x, pos.y);
        //node.x = pos.x;
        //node.y = pos.y;
        if (obj.goto != -1) this.goto = obj.goto;
        //this.shape = new createjs.Shape();
        //this.shape.graphics.ss(2).s('#222').f('#444').dr(0,0,100,100);
        if (obj.bg || obj.bg === undefined) obj.fill = '#444';
        if (obj.outline || obj.outline === undefined) { obj.stroke = 'black'; obj.strokeWidth = 4 }
        else { obj.stroke = undefined; obj.strokeWidth = undefined; }
        let rect = new Konva.Rect({
            x:0,
            y:0,
            width:obj.width,
            height:obj.height,
            fill:obj.fill,
            stroke:obj.stroke,
            strokeWidth:obj.strokeWidth,
            name: 'bgRect'
        });
        this.add(rect);
        this.add(this.content);
        if (obj.header || obj.header === undefined) { this.add(generateHeader(obj.width, this.name())); }
        this.on('mousemove', function(evt) {
            this.setSelection(true);
            evt.cancelBubble = true;
        }.bind(this));
        this.on('mouseout', function(evt) {
            this.setSelection(false);
            evt.cancelBubble = true;
        }.bind(this));

        //this.add(newBubble(90,75,25));
        
        /*this.shape.on("mousedown", this.handleMouseDown);
        this.shape.on("pressmove", this.handleMouseMove);
        this.shape.on("pressup", this.handleMouseUp);*/
        /*if (this.type == 'varnode') {
            let socket = this.addSocket(this.x+100, this.y+50, undefined, this, 6, '#000');
            socket.owner = this;
            this.sockets.push(socket);
        } else if (this.type == 'ifnode') {
            
        }
        this.addChild(this.shape);*/
        let socket = this.addSocket(this.width(), this.height()/2, this.goto, this, 12, '#000');
        this.add(socket);
        //socket.owner = this;
        //this.sockets.push(socket);
    }

    setSelection(val) {
        let rect = this.findOne('.bgRect');
        let head = this.findOne('.headerRect');
        if (val) {
            rect.stroke(selectStroke);
            rect.fill(selectFill);
            head.stroke(selectStroke);
            head.fill(selectFill);
            this.parent.draw();
        } else {
            rect.stroke('black');
            rect.fill('#444');
            head.stroke('black');
            head.fill('#333');
            this.parent.draw();
        }
    }

    updateSize(width, height) {
        this.width(width);
        this.height(height);
        let rect = this.findOne('.bgRect');
        rect.width(width);
        rect.height(height);
        let socket = this.findOne('.socket');
        socket.x(width);
        socket.y(height/2);
        this.content.clipWidth(width);
        this.content.clipHeight(height);
    }

    addSocket(x, y, goto, addTo, radius, color) {

        let socket = new Konva.Circle({
           x: x,
           y: y,
           offsetX: -radius,
           radius: radius,
           fill: '#999',
           stroke: '#666',
           strokeWidth: 2,
           name: 'socket'
        });
        socket.goto = goto;
        return socket;
        //addTo.add(socket);
/*
        var socket = new createjs.Container();
        socket.shape = new createjs.Shape();
        socket.line = new createjs.Shape();
        socket.radius = radius;

        socket.x = x;
        socket.y = y;

        if (color !== undefined) socket.color = color;
        else socket.color = "#000";

        if (color == "#fff") this.bg_color = "#000";
        else this.bg_color = "#fff";

        var r = socket.radius;
        socket.shape.regY = r;
        socket.shape.regX = 0;

        socket.shape.graphics.f(this.bg_color).dc(r,r,r).f(socket.color).dc(r,r,r-r/3);
        //socket.shape.scaleX = 1;
        //socket.shape.scaleY = 1;

        socket.strokewidth = socket.radius/2;
        socket.cursor = "pointer";

        socket.goto = goto;

        socket.addChild(socket.shape, socket.line);

        socket.on("pressmove", this.dragLine);
        socket.on("pressup", this.releaseLine);

        this.sockets.push(socket);
        if (addTo === undefined) this.addChild(socket);
        else addTo.addChild(socket);

        return socket;*/
    }
}

function generateHeader(width, text) {
    if (text === undefined) text = "";
    let maxText = width/(headerHeight*0.6);
    if (text.length > maxText) text.substring(0,maxText) + "..";

    let header = new Konva.Group({
        x: 0,
        y: -headerHeight,
        name: 'header'
    });
    let title = new Konva.Text({
        x:5,
        y:headerHeight*0.4/2,
        text: text,
        fill: '#ccc',
        fontSize: headerHeight * 0.6
    });
    let rect = new Konva.Rect({
        name: 'headerRect',
        x:0,
        y: 0,
        width: width,
        height: headerHeight,
        fill: '#333',
        stroke: 'black',
        strokeWidth: 4,
        opacity:0.7
    });

    header.add(rect);
    header.add(title);
    return header;
}

function newBubble(width,height,radius) {
    let radiusX = (radius > width/2) ? width/2 : radius;
    let radiusY = (radius > height/2) ? height/2 : radius;

    function roundedRect(context,width,height,radiusX, radiusY) {
            context.beginPath();
            context.moveTo(width-radiusX,0);
            context.quadraticCurveTo(width,0,width,radiusY);
            context.lineTo(width,height-radiusY);
            context.quadraticCurveTo(width,height,width-radiusX,height);
            context.lineTo(radiusX,height);
            context.quadraticCurveTo(0,height,0,height-radiusY);
            context.lineTo(0,radiusY);
            context.quadraticCurveTo(0,0,radiusX,0);
            context.closePath();

            return context;
    }

    let bubble = new Konva.Shape({
        sceneFunc: function (context) {
            roundedRect(context, width, height, radiusX, radiusY)

            context.strokeShape(this);

            context.beginPath();
            context.moveTo(width/2,height-5);
            context.lineTo(width/2+5,height+10);
            context.lineTo(width/2+10,height-5);
            context.closePath();

            context.strokeShape(this);

            roundedRect(context, width, height, radiusX, radiusY);

            context.fillShape(this);

            context.beginPath();
            context.moveTo(width/2,height-5);
            context.lineTo(width/2+5,height+10);
            context.lineTo(width/2+10,height-5);
            context.closePath();

            context.fillShape(this);
        },
        fill: 'white',
        stroke: 'black',
        strokeWidth: 3,
        draggable: true
    });

    return bubble;
}