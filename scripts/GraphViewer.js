loadCSS("css/GraphViewer.css");

var GraphViewer = function GraphViewer(graph) {
    let viewer = this;
    viewer.graph = graph;
    let vars = new varManager();
    vars.setVarValue("selectedPoint");
    this.varManager = vars;
    this.div = document.createElement("div");
    this.div.setAttribute("class", "GraphViewer");
    this.sidebar = document.createElement("div");
    this.div.appendChild(this.sidebar);
    this.sidebar.setAttribute("class", "sidebar");
    let svg = document.createElementNS(svgns, "svg");
    this.svg = svg;
    this.div.appendChild(svg);
    svg.dragging = false;
    svg.addEventListener("mouseup", function() {svg.dragging = false;});
    document.addEventListener("mousemove", function(e) {
        if (svg.dragging) viewer.movePoint(svg.dragging, e.movementX, e.movementY);
    });
    
    this.colors = new varManager();
    this.colorSelector = document.createElement("input");
    this.sidebar.appendChild(this.colorSelector);
    this.colorSelector.setAttribute("type", "color");
    vars.linkListener("selectedPoint", function(vertex) {
        viewer.colorSelector.value = viewer.colors.vars[graph.vertices[viewer.varManager.vars.selectedPoint.value].declaredAs].value.fill;
    });
    this.colorSelector.addEventListener("input", function(e) {
        viewer.colors.setVarValue(graph.vertices[viewer.varManager.vars.selectedPoint.value].declaredAs, {fill: e.target.value, stroke: GraphViewer.shade(e.target.value)});
    });
    
    this.assLevelShapes = function(assLevel) {
        switch (assLevel) {
            case "assumed": return GraphViewer.icons.square;
            case "freebie": return GraphViewer.icons.star;
            case "proved": return GraphViewer.icons.triangle;
            default: return GraphViewer.icons.circle;
        }
    }
    
    this.points = {};
    for (let v in graph.vertices) this.points[v] = new GraphViewer.point(this, graph, v);
    
    this.written = GraphViewer.toWords(graph);
    this.div.appendChild(this.written);
    
    this.pName = document.createElement("p");
    this.sidebar.appendChild(this.pName);
    let nameText = document.createTextNode("");
    this.pName.appendChild(nameText);
    vars.linkListener("selectedPoint", function(point) {
        nameText.nodeValue = graph.vertices[point].declaredAs + " " + point;
    });
    
    this.textIn = document.createElement("input");
    this.sidebar.appendChild(this.textIn);
    this.textIn.setAttribute("type", "text");
    this.textIn.addEventListener("change", function(e) {
        viewer.gotText(e.target.value);
    });
    
    this.prevStep = document.createElement("button");
    this.sidebar.appendChild(this.prevStep);
    this.prevStep.setAttribute("type", "button");
    this.prevStep.innerHTML = "back";
    this.prevStep.addEventListener("click", function() {viewer.stepBack();});
    this.prevStep.setAttribute("style", "visibility: hidden");
    this.nextStep = document.createElement("button");
    this.sidebar.appendChild(this.nextStep);
    this.nextStep.setAttribute("type", "button");
    this.nextStep.innerHTML = "forward";
    this.nextStep.addEventListener("click", function() {viewer.stepForward();});
    this.nextStep.setAttribute("style", "visibility: hidden");
    
    this.save = document.createElement("a");
    this.sidebar.appendChild(this.save);
    this.save.appendChild(document.createTextNode("save"));
    this.save.setAttribute("download", "");
    this.save.addEventListener("mousedown", function() {
        viewer.makeSave();
    });
    let fromFile = graph.file.querySelector("GraphViewer");
    if (fromFile) this.readFile(fromFile);
    vars.setVarValue("selectedPoint", graph.maxVertex);
}

GraphViewer.prototype.makeSave = function makeSave() {
    let line = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
    line = "";
    line += "<pts>";
    for (let pt in this.points) {
        line += "<" + pt;
        for (let prop of ["x","y"]) line += " " + prop + "=\"" + this.points[pt][prop] + "\"";
        if (this.points[pt].hidden) line += " hidden = \"\"";
        line += "/>";
    }
    line += "</pts>";
    alert(line);
    /*let blob = new Blob([line], {type: "text/xml"});
    this.save.setAttribute("href", URL.createObjectURL(blob));*/
}

GraphViewer.prototype.readLayout = function readLayout(doc) {
    doc = xmlImporter.getRoot(doc);
    for (let i = 0; i < doc.childNodes.length; ++i) {
        let v = doc.childNodes[i];
        let pt = this.points[v.nodeName];
        if (pt == undefined) {console.log(this);console.log("could not find " + v.nodeName);}
        this.movePoint(pt, -pt.x, -pt.y);
        this.movePoint(pt, v.getAttribute("x"), v.getAttribute("y"));
        if (v.hasAttribute("hidden")) this.hidePoint(v.nodeName);
        else this.showPoint(v.nodeName);
    }
}

GraphViewer.prototype.readFile = function readFile(doc) {
    this.file = doc;
    for (let i = 0; i < this.file.attributes.length; ++i) this.svg.setAttributeNS(svgns, this.file.attributes[i].name, this.file.attributes[i].value);
    let pts = doc.querySelectorAll("pts");
    if (pts.length == 0) return;
    if (pts.length == 1) {this.readLayout(pts[0]); return;}
    this.prevStep.setAttribute("style", "visibility: visible");
    this.nextStep.setAttribute("style", "visibility: visible");
    this.steps = pts;
    this.onStep = 0;
    this.readLayout(pts[0]);
}

{
    function randHex() {return "0123456789abcdef".charAt(Math.floor(16*Math.random()));}
    function randColor() {
        let returner = "#";
        for (let i = 0; i < 6; ++i) returner += randHex();
        return returner;
    }
    GraphViewer.point = function point(viewer, graph, vertex, x = 8, y = x) {
        if (!(vertex in graph.vertices)) throw Error(vertex + " is not a vertex");
        this.graph = graph;
        this.vertex = vertex;
        this.assLevel = graph.vertices[vertex].assumptionLevel;
        this.defType = graph.vertices[vertex].declaredAs;
        this.x = x;
        this.y = y;
        this.g = document.createElementNS(svgns, "g");
        viewer.svg.appendChild(this.g);
        function arrow() {
            this.top = document.createElementNS(svgns, "line");
            this.bottom = document.createElementNS(svgns, "line");
            this.top.setAttribute("class", "arrowTop");
            this.bottom.setAttribute("class", "arrowBottom");
        }
        this.arrows = {};
        this.parentArrows = {};
        for (let child in graph.vertices[vertex].children) {
            let cv = graph.vertices[vertex].children[child];
            if (!(cv in viewer.points)) viewer.points[cv] = new GraphViewer.point(viewer, graph, cv);
            if (!(cv in this.arrows)) {
                this.arrows[cv] = new arrow(this, cv);
                this.g.appendChild(this.arrows[cv].top);
                this.g.appendChild(this.arrows[cv].bottom);
                viewer.points[cv].parentArrows[vertex] = this.arrows[cv];
            }
            viewer.svg.appendChild(viewer.points[cv].dot);
        }
        viewer.points[vertex] = this;
        let dot = document.createElementNS(svgns, "g");
        dot.appendChild(copyNode(viewer.assLevelShapes(graph.vertices[vertex].assumptionLevel)));
        viewer.svg.appendChild(dot);
        this.dot = dot;
        dot.setAttribute("class", "dot");
        let me = this;
        dot.addEventListener("mousedown", function() {viewer.svg.dragging = me;});
        dot.addEventListener("mouseover", function() {
            viewer.varManager.setVarValue("selectedPoint", vertex);
        });
        viewer.movePoint(this, 0, 0);
        let type = graph.vertices[vertex].declaredAs;
        if (!(type in viewer.colors.vars)) {
            let c = randColor();
            viewer.colors.setVarValue(type, {fill: c, stroke: GraphViewer.shade(c)});
        }
        viewer.colors.linkListener(type, function(color) {
            dot.setAttribute("fill", color.fill);
            dot.setAttribute("stroke", color.stroke);
        });
        dot.setAttribute("fill", viewer.colors.vars[type].value.fill);
        dot.setAttribute("stroke", viewer.colors.vars[type].value.stroke);
    }
}

GraphViewer.prototype.movePoint = function movePoint(pt, dx, dy) {
    pt.x += Number(dx);
    pt.y += Number(dy);
    pt.dot.setAttribute("transform", "translate("+pt.x+" "+pt.y+")");
    for (let child in pt.arrows) {
        let top = pt.arrows[child].top, bottom = pt.arrows[child].bottom;
        top.setAttribute("x1", pt.x);
        top.setAttribute("y1", pt.y);
        top.setAttribute("x2", (pt.x + this.points[child].x)/2);
        top.setAttribute("y2", (pt.y + this.points[child].y)/2);
        bottom.setAttribute("x1", (pt.x + this.points[child].x)/2);
        bottom.setAttribute("y1", (pt.y + this.points[child].y)/2);
    }
    for (let parent in pt.parentArrows) {
        let top = pt.parentArrows[parent].top, bottom = pt.parentArrows[parent].bottom;
        top.setAttribute("x2", (this.points[parent].x + pt.x)/2);
        top.setAttribute("y2", (this.points[parent].y + pt.y)/2);
        bottom.setAttribute("x1", (this.points[parent].x + pt.x)/2);
        bottom.setAttribute("y1", (this.points[parent].y + pt.y)/2);
        bottom.setAttribute("x2", pt.x);
        bottom.setAttribute("y2", pt.y);
    }
}

GraphViewer.prototype.hidePoint = function hidePoint(pt) {
    let point = this.points[pt];
    point.hidden = true;
    point.dot.setAttribute("visibility", "hidden");
    for (let other in this.points) {
        if (other in point.arrows) {
            for (let arrow in point.arrows[other]) point.arrows[other][arrow].setAttribute("visibility", "hidden");
        } else if (other in point.parentArrows) {
            for (let arrow in point.parentArrows[other]) point.parentArrows[other][arrow].setAttribute("visibility", "hidden");
        }
    }
}

GraphViewer.prototype.showPoint = function hidePoint(pt) {
    let point = this.points[pt];
    point.hidden = false;
    point.dot.setAttribute("visibility", "visible");
    for (let other in this.points) {
        if (other in point.arrows) {
            for (let arrow in point.arrows[other]) if (!this.points[other].hidden) point.arrows[other][arrow].setAttribute("visibility", "visible");
        } else if (other in point.parentArrows) {
            for (let arrow in point.parentArrows[other]) if (!this.points[other].hidden) point.parentArrows[other][arrow].setAttribute("visibility", "visible");
        }
    }
}

GraphViewer.prototype.updateColors = function updateColors() {
    for (let pt in this.points) {
        this.points[pt].dot.setAttribute("fill", this.colors.defs[this.points[pt].defType]);
        this.points[pt].dot.setAttribute("stroke", this.colors.assLevels[this.points[pt].assLevel]);
    }
}

GraphViewer.prototype.gotText = function gotText(line) {
    if (line.substring(0, 7) == "select ") {
        line = line.substring(7);
        if (!(line in this.points)) {
            this.pName.innerHTML = line + " is not a point";
            return;
        } else {
            this.pName.innerHTML = line;
            return;
        }
    }
    let pt = this.pName.firstChild.nodeValue;
    if (!(pt in this.points)) return;
    if (line == "hide") this.hidePoint(pt);
    if (line == "show") this.showPoint(pt);
}

GraphViewer.prototype.stepBack = function stepBack() {
    if (this.onStep > 0) this.readLayout(this.steps[--this.onStep]);
}

GraphViewer.prototype.stepForward = function stepForward() {
    if (this.onStep+1 < this.steps.length) this.readLayout(this.steps[++this.onStep]);
}

GraphViewer.toWords = function toWords(graph) {
    let written = document.createElement("details");
    written.setAttribute("class", "words");
    let summary = document.createElement("summary");
    written.appendChild(summary);
    summary.appendChild(document.createTextNode("Written in words"));
    graph.toWords(written);
    return written;
}

GraphViewer.icons = {};
{
    let circle = document.createElementNS(svgns, "circle");
    circle.setAttribute("r", 8);
    GraphViewer.icons.circle = circle;
    let square = document.createElementNS(svgns, "rect");
    square.setAttribute("x", -8);
    square.setAttribute("y", -8);
    square.setAttribute("width", 16);
    square.setAttribute("height", 16);
    square.setAttribute("rx", 4);
    square.setAttribute("ry", 4);
    GraphViewer.icons.square = square;
    let triangle = document.createElementNS(svgns, "polyline");
    triangle.setAttribute("points", "8,8 -8,8 0,-8 8,8");
    GraphViewer.icons.triangle = triangle;
    let star = document.createElementNS(svgns, "polyline");
    star.setAttribute("points", "0,-12 3.5,-4.9 11.4,-3.7 5.7,1.9 7.1,9.7 0,6 -7.1,9.7 -5.7,1.9 -11.4,-3.7 -3.5,-4.9 0,-12");
    GraphViewer.icons.star = star;
}

GraphViewer.shade = function shade(color) {
    let r = parseInt(color.substring(1,3), 16), g = parseInt(color.substring(3,5), 16), b = parseInt(color.substring(5), 16);
    r = r + (r>205?-40:40);
    g = g + (g>205?-40:40);
    b = b + (b>205?-40:40);
    return "#" + r.toString(16) + g.toString(16) + b.toString(16);
}