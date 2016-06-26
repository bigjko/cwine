//
// PANEL class
//

import Node from './Node';

export default class Panel extends Node {
    constructor(options) {
        super(options);
    }

    setup(obj) {
        this.name = obj.name;
        if (obj.editor !== undefined) {
            this.x = obj.editor.position.x;
            this.y = obj.editor.position.y;
        }
        this.selected = new createjs.Shape();
        this.addChild(this.selected);

        if (obj.image !== undefined) {
            this.panelbitmap = new createjs.Bitmap(obj.image);
            this.image = obj.image;
            var scale = 0.25;
            //if (panels[i].size == 4) scale = 0.35;
            if (obj.size === undefined) this.size = 1;
            else this.size = obj.size;
            scale = this.size*400*scale / this.panelbitmap.image.width;
            this.panelbitmap.scaleX = scale;
            this.panelbitmap.scaleY = scale;
            this.width = this.panelbitmap.image.width*this.panelbitmap.scaleX;
            this.height = this.panelbitmap.image.height*this.panelbitmap.scaleY;
            //this.panelbitmap.on("mousedown", handleMouseDown);
            //this.panelbitmap.on("pressmove", handleMouseMove);
            //this.panelbitmap.on("pressup", handleMouseUp);
            this.panelbitmap.cursor = "move";
            this.addChild(this.panelbitmap);
            this.panelbitmap.on("mousedown", this.handleMouseDown);
            this.panelbitmap.on("pressmove", this.handleMouseMove);
            this.panelbitmap.on("pressup", this.handleMouseUp);
            this.panelbitmap.shadow = new createjs.Shadow("rgba(0,0,0,0.2)", 3, 3, 4);
            //this.panelbitmap.on("click", this.showProperties);
        }
        
        var socketpos = {
            x: this.panelbitmap.scaleX*this.panelbitmap.image.width,
            y: this.panelbitmap.scaleY*this.panelbitmap.image.height/2
        };

        var sock = this.addSocket(socketpos.x,socketpos.y,obj.goto, this, 6);
        sock.owner = this;
        
        if (obj.goto != -1) this.goto = obj.goto;

        //this.elements = [];
        this.elements = [];
        if (obj.elements !== undefined) {
            for (let e=0; e < obj.elements.length; e++) {
                if (obj.elements[e] !== null) {
                    var element = new PanelElement(obj.elements[e], this.panelbitmap);

                    //this.elements.push(element);
                    this.addChild(element);
                    this.elements.push(element);
                    //console.log(element.children.length);
                    socketpos = {
                        x: element.x + element.width*element.scaleX,
                        y: element.y + element.height/2*element.scaleY
                    };
                    sock = this.addSocket(socketpos.x, socketpos.y, element.goto, this, 3, "#fff");
                    sock.owner = element;
                    sock.dashes = [10,5];
                } else {
                    this.elements.push(null);
                }
                
            }
        }	
    }

    newImage(image) {
        console.log('IMAGE SHIT!');
        //this.removeChild(this.panelbitmap)
        this.image = image;
        let img = new Image();
        img.onload = function() {
            this.update();
        }.bind(this);
        img.src = this.image;
        //console.log(img);
        this.panelbitmap.image = img;
    }

    update(update) {
        //this.x = update.editor.position.x;
        //this.y = update.editor.position.y;
        for (let property in update) {
            this[property] = update[property];
            /*if (property == 'image') {
                // FIX THIS IMAGE SHIT!
                console.log('IMAGE SHIT!');
                //this.removeChild(this.panelbitmap)
                this.image = update.image;
                let img = new Image();
                img.src = this.image;
                //console.log(img);
                this.panelbitmap.image = img;
            }*/
            console.log("Changed", property, update[property]);
        }
        let scale = 0.25;
        scale = this.size*400*scale / this.panelbitmap.image.width;
        this.panelbitmap.scaleX = scale;
        this.panelbitmap.scaleY = scale;
        this.width = this.panelbitmap.image.width*this.panelbitmap.scaleX;
        this.height = this.panelbitmap.image.height*this.panelbitmap.scaleY;
        for (let p=0; p < this.elements.length; p++) {
            let elm = this.elements[p];
            if (elm !== null) {
                this.elements[p].update();
            }
        }
        //drawAllConnections();
    }

    removeChild(child) {
        var view = document.querySelector("#view");
        var elm = child.children[1].htmlElement;
        console.log(elm);
        view.removeChild(elm);
        this.Node_removeChild(child);
        //drawAllConnections();
    }

    toObject() {
        let obj = {};
        obj.name = this.name;
        obj.size = this.size;
        obj.goto = this.goto;
        obj.image = this.image;
        obj.editor = { position: { x: this.x, y: this.y }};

        return obj;
    }
}