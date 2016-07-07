//
// PANEL class
//

import Node from './Node';
import Element from './Element';

const headerHeight = 40;

export default class Panel extends Node {
    constructor(options) {
        super(options);
        //this.setup(options);
    }

    setup(obj) {
        super.setup(obj);
        this.elements = [];
        if (obj.elements !== undefined) {
            for (let e=0; e < obj.elements.length; e++) {
                if (obj.elements[e] !== null) {
                    //obj.elements[e].panel = this;
                    let elemObj = obj.elements[e];

                    elemObj = updateOldElement(elemObj, this);

                    var element = new Element(elemObj);
                    var underelement = new Element(elemObj);
                    element.setup(elemObj);
                    underelement.setup(elemObj);
                    //this.elements.push(element);
                    this.under.add(underelement);
                    this.content.add(element);
                    
                    this.elements.push(element);
                    //console.log(element.children.length);
                    /*let socketpos = {
                        x: element.x() + element.width(),
                        y: element.y() + element.height()/2
                    };
                    let sock = this.addSocket(socketpos.x, socketpos.y, element.goto, this, 3, "#fff");
                    sock.owner = element;
                    sock.dashes = [10,5];*/
                } else {
                    this.elements.push(null);
                }
                
            }
        }
        function updateOldElement(elm, panel) {
            // Make sure old elements still work
            if (elm.fitToText === undefined) {
                elm.fitToText = true;
            }
            if (elm.width === undefined) {
                elm.width = 100;
                if (elm.height === undefined) {
                    elm.height = 100;
                }
            }
            if (elm.x === undefined) {
                elm.x = elm.position.x * panel.width();
            }
            if (elm.y === undefined) {
                elm.y = elm.position.y * panel.height();
            }

            return elm;
        }
    }
}

