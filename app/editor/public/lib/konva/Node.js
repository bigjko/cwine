// ------------ //
//  NODE class  //
// ------------ //

//var editor = require('./editor.js');

import Konva from 'konva';

export default class Node extends Konva.Group {
    constructor(options) {
        super({options});
        this.sockets = [];
        this.ctrldrag = false;
        this.setup(options);
    }

    cool() {
        console.log('FUNCTION WORKS!');
    }

    setup(obj) {
        console.log("Setup Node!");
        this.draggable(true);
        this.name(obj.name);
        this.type = obj.type;
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
        let rect = new Konva.Rect({
            x:0,
            y:0,
            width:100,
            height:100,
            fill:'blue',
            stroke:'black',
            strokeWidth:1
        });
        this.add(rect);
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
    }

    /*handleMouseDown(evt) {
        let node = evt.target.parent;
        node.ctrldrag = { dragging: false, socket: null };
        if (navigator.platform.match("Mac") ? evt.nativeEvent.metaKey : evt.nativeEvent.ctrlKey) {
            evt.preventDefault();
            
            for (let s=0; s < node.sockets.length; s++) {
                let socket = node.sockets[s];
                if (socket.owner == node) {
                    let socketEvt = evt.clone();
                    let nodeEvt = evt.clone();
                    node.ctrldrag = {dragging:true, socket: socket};
                    socketEvt.set({type: 'pressmove', target: socket});
                    //nodeEvt.set({type: 'mouseup'});
                    //node.dispatchEvent(nodeEvt);
                    
                    socket.dispatchEvent(socketEvt);
                }
            }

            return false;
        }
        dragoffset = {
            x: evt.stageX/viewScale - evt.target.parent.x,
            y: evt.stageY/viewScale - evt.target.parent.y
        };

        //evt.target.dragoffset.y = evt.stageY/viewScale - evt.target.parent.y;

        if (currentlySelected !== undefined && currentlySelected.selected !== undefined) currentlySelected.selected.graphics.clear();
        currentlySelected = evt.target.parent;
        handleSelection({ node: nodeContainer.nodes.indexOf(evt.target.parent) });

        //openTab("propertyTab");
    }

    handleMouseUp(evt) {
        let node = evt.target.parent;
        if (node.ctrldrag.dragging) {
            let socketEvt = evt.clone();
            socketEvt.set({type: 'pressup', target: node.ctrldrag.socket});
            
            node.ctrldrag.socket.dispatchEvent(socketEvt);

            node.ctrldrag = { dragging: false, socket: null };
            return false;
        }
    }

    handleMouseMove(evt) {
        let node = evt.target.parent;
        if (node.ctrldrag.dragging) {
            let socketEvt = evt.clone();
            socketEvt.set({type: 'pressmove', target: node.ctrldrag.socket});
            
            node.ctrldrag.socket.dispatchEvent(socketEvt);
            return false;
        }

        let panel = evt.target.parent;
        let old = {x: panel.x, y: panel.y};
        
        panel.x = evt.stageX/viewScale - dragoffset.x;
        panel.y = evt.stageY/viewScale - dragoffset.y;

        panel.x = Math.round(panel.x*0.1)*10;
        panel.y = Math.round(panel.y*0.1)*10;
        
        if (old.x != panel.x || old.y != panel.y) {
            let sel = {node: nodeContainer.nodes.indexOf(panel)};
            handleChange(sel, {editor: {position: {x:panel.x, y:panel.y}}});
            //drawAllConnections();
        }
    
    }

    drawConnections() {
        for (let s=0; s < this.sockets.length; s++) {
            var socket = this.sockets[s];
            socket.line.graphics.clear();
            if (socket.owner instanceof PanelElement) {
                let socketpos = socket.owner.localToLocal(socket.owner.width, socket.owner.height/2, socket.parent);
                socket.x = socketpos.x;
                socket.y = socketpos.y;
            }
            else {
                let socketpos = { x: socket.owner.width, y: socket.owner.height/2 };
                socket.x = socketpos.x;
                socket.y = socketpos.y;
            }
            if (socket.owner.goto !== undefined && this.parent.contains(socket.owner.goto)) {
                var goto = socket.owner.goto;
                var local = this.parent.localToLocal(goto.x, goto.y+goto.height/2, socket);
                
                if (socket.owner instanceof PanelElement) socket.line.graphics.s(socket.color).ss(socket.strokewidth).sd([10,5]).mt(0+socket.radius, 0).lt(local.x, local.y );
                else socket.line.graphics.s(socket.color).ss(socket.strokewidth).mt(0+socket.radius, 0).lt(local.x, local.y );
                socket.alpha = 1;
            }
            else socket.alpha = 0.5;
        }
    }

    dragLine(evt) {
        console.log("dragline!");
        let sock = evt.target;
        if (sock instanceof createjs.Shape) sock = evt.target.parent;
        var line = sock.line;
        line.graphics.clear();
        var local = line.globalToLocal(evt.stageX, evt.stageY);
        line.graphics.s(sock.color).ss(sock.strokewidth).mt(0+con_r, 0).lt(local.x,local.y);
    }

    releaseLine(evt) {
        let socket = evt.target;
        if (socket instanceof createjs.Shape) socket = evt.target.parent;
        let panel = socket.parent;
        let owner = socket.owner;
        socket.goto = undefined;
        owner.goto = undefined;
        socket.line.graphics.clear();
        let gotoindex = null;
        let nodeindex = null;
        let elmindex = null;
        if (owner instanceof PanelElement) {
            nodeindex = nodeContainer.nodes.indexOf(panel);
            elmindex = panel.elements.indexOf(owner);
        } else {
            nodeindex = nodeContainer.nodes.indexOf(owner);
        }
        var target = stage.getObjectUnderPoint(evt.stageX, evt.stageY).parent;
        if (target instanceof Node) {
            socket.goto = target;
            owner.goto = target;			
            gotoindex = nodeContainer.nodes.indexOf(socket.goto);
        }
        handleChange({node: nodeindex, element: elmindex}, {goto: gotoindex});
        panel.drawConnections();
    }

    addSocket(x, y, goto, addTo, radius, color) {
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

        return socket;
    }*/
}