//
// PANEL class
//

import Node from './Node';
import Element from './Element';

export default class Panel extends Node {
    constructor(options) {
        super(options);
        this.setup(options);
    }

    setup(obj) {
        super.setup(obj);
        this.elements = [];
        if (obj.elements !== undefined) {
            for (let e=0; e < obj.elements.length; e++) {
                if (obj.elements[e] !== null) {
                    //obj.elements[e].panel = this;
                    var element = new Element(obj.elements[e]);

                    //this.elements.push(element);
                    this.add(element);
                    this.elements.push(element);
                    //console.log(element.children.length);
                    let socketpos = {
                        x: element.x + element.width,
                        y: element.y + element.height/2
                    };
                    let sock = this.addSocket(socketpos.x, socketpos.y, element.goto, this, 3, "#fff");
                    sock.owner = element;
                    sock.dashes = [10,5];
                } else {
                    this.elements.push(null);
                }
                
            }
        }
    }
}