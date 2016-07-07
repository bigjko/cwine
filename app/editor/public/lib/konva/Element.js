//
// PANEL class
//

import Konva from 'konva';
import Node from './Node';

const selectFill = '#005480';
const selectStroke = 'white';

export default class Element extends Node {
    constructor(options) {
        options.header = false;
        options.outline = false;
        options.bg = false;
        super(options);
        //this.setup(options);
    }

    setup(obj) {
        super.setup(obj);
        this.dragBoundFunc(function(pos) { return {x: pos.x, y: pos.y}});
        //console.log(obj.x, obj.y, obj.width, obj.height);
        this.x(obj.x);
        this.y(obj.y);
        this.fitToText = obj.fitToText;
        let imageObj = new Image();
        if (obj.locked) this.draggable(false);
        imageObj.onload = function() {
            if (obj.width !== undefined && obj.height === undefined) {
                let aspect = obj.width / imageObj.width;
                obj.height = imageObj.height * aspect;
            }

            let text;
            if (obj.text !== undefined) {
                text = new Konva.Text({
                    x:0,
                    y:0,
                    padding: 20,
                    fontSize: 18,
                    fill: 'black',
                    align: 'left',
                    fontFamily: 'KomikaHand',
                    text: obj.text.toUpperCase(),
                    name: 'elemText'
                });
                   
            }
            
            if (text !== undefined && obj.fitToText) {
                obj.width = text.getWidth();
                obj.height = text.getHeight();
            }

            let elemImage = new Konva.Image({
                x:0,
                y:0,
                width: obj.width,
                height: obj.height,
                image: imageObj,
                name: 'elemImage'
            });
            
            this.width(obj.width);
            this.height(obj.height);
            this.content.add(elemImage);
            if (text !== undefined) {
                this.content.add(text);
            }
            this.updateSize(obj.width, obj.height);
            this.getStage().find('.nodeContainer').draw();
            if (text !== undefined) {
                //debugger;
            }
        }.bind(this);
        imageObj.src = obj.image;
    }

    /*draw() {
        super.draw();
        if (this.fitToText) {
            let text = this.findOne('.elemText');
            let img = this.findOne('.elemImg');
            if (text !== undefined && img !== undefined) {
                console.log('resize element to fit text');
                img.setSize(text.getWidth(), text.getHeight());
                this.updateSize(text.getWidth(), text.getHeight());
            }
        }
    }*/

    setSelection(val) {
        let rect = this.findOne('.bgRect');
        let head = this.findOne('.headerRect');
        if (val) {
            rect.opacity(0.5);
            rect.stroke(selectStroke);
            rect.strokeWidth(4);
            rect.fill(selectFill);
            //head.stroke('blue');
            //head.fill('yellow');
            
        } else {
            rect.opacity(0);
            //head.stroke('black');
            //head.fill('#333');
        }
        this.getStage().find('.nodeContainer').draw();
    }
}