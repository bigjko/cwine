//
// PANEL class
//

import Konva from 'konva';
import Node from './Node';

export default class Element extends Node {
    constructor(options) {
        options.header = false;
        options.outline = false;
        options.bg = false;
        super(options);
        this.setup(options);
    }

    setup(obj) {
        console.log('panel:', this.parent);
        super.setup(obj);
        this.dragBoundFunc(function(pos) { return {x: pos.x, y: pos.y}});
        //console.log(obj.x, obj.y, obj.width, obj.height);
        this.x(obj.position.x);
        this.y(obj.position.y);
        let imageObj = new Image();
        imageObj.onload = function() {
            let elemImage = new Konva.Image({
                x:0,
                y:0,
                width: imageObj.width,
                height: imageObj.height,
                image: imageObj
            });
            this.width = imageObj.width;
            this.height = imageObj.height;
            this.add(elemImage);
        }.bind(this);
        imageObj.src = obj.image;
    }
}