var inBackspace = false;
window.addEventListener('beforeunload', function(event) {
    if (inBackspace) {
      event.preventDefault();
      event.returnValue = "";
        inBackspace = false;
    }
});
window.addEventListener("keydown", function(event) {
    inBackspace = true;
})
window.addEventListener("keyup", function(event) {
    inBackspace = false;
})
// raw documents
var savedDocs = {};

// compiled files
var savedFiles = {};
var svgns = "http://www.w3.org/2000/svg", mathns = "http://www.w3.org/1998/Math/MathML";
var id = 0;
var isLocal = filePrefix == "Public/";

function getFile(uri, loader, deleteDoc = true) {
    if (!(uri in savedFiles)) {
        if (uri in savedDocs) {
            savedFiles[uri] = loader(savedDocs[uri], uri);
            if (deleteDoc) delete savedDocs[uri];
        }
        else throw Error("cannot find file " + uri);
    }
    return savedFiles[uri]
}

let scripts = {
    globalBackgrounds: "scripts/globalBackgrounds.js",
    xmlImporter: "scripts/xmlImporter.js",
    Graph: "scripts/Graph.js",
    Dictionary: "scripts/Dictionary.js",
    TypedGraph: "scripts/TypedGraph.js",
    Claims: "scripts/Claims.js",
    gui: "scripts/gui.js",
    xmlViewer: "scripts/xmlViewer.js"
}, scriptLocations = [];

for (let script in scripts) scriptLocations.push(scripts[script]);

function compileJS(line) {
    let script = document.createElement("script");
    script.appendChild(document.createTextNode(line));
    document.head.appendChild(script);
    document.head.removeChild(script);
}

function loadJS(src, pass, finished) {
    let script = document.createElement("script");
    script.setAttribute("src", filePrefix + src);
    script.addEventListener("load", function finisher() {finished(pass);});
    document.head.appendChild(script);
    document.head.removeChild(script);
}

function loadJSs(srcs, pass, finished) {
    if (srcs.length == 0) finished(pass);
    else loadJS(srcs.shift(), null, function() {
        loadJSs(srcs, pass, finished);
    });
}

function loadCSS(location) {
    let link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("href", filePrefix + location);
    document.head.appendChild(link);
}

/*function words(words) {
    let orderMe = [];
    for (let word in words) orderMe.push(word);
    orderMe.sort();
    return orderMe.toString();
}*/

loadJSs(scriptLocations, null, start);

function start() {
    let p = document.createElement("p");
    document.body.appendChild(p);
    p.appendChild(document.createTextNode("The math language project is compiled and running on this site, but it is certainly not at the point where it can be successfully shown off yet. If you see a list below of somewhat cryptic statements about defining things then that is a successful execution of the program. This is currently being used as the live testing site for project development."))
    if (document.getElementById("remove")) document.body.removeChild(document.getElementById("remove"));
    let req = new XMLHttpRequest();
    req.onload = function(result) {
        let doc = new DOMParser().parseFromString(req.responseText, "text/xml");
        Graph.readBook(doc, "book", document.body);
    };
    req.onfail = function() {alert("failed loading book from " + url)};
    req.open("GET", filePrefix + "/Books/fromPaper.txt");
    req.send();
    let button = document.createElement("button");
    document.body.appendChild(button);
    button.innerHTML = "for complex";
    button.addEventListener("click", function() {
        while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
        loadPage("qualPrep");
    });
}

/*function openViewer(file, putHere = document.body, onPass = function() {}) {
    xmlImporter.openFile(file, null, function(doc, passed) {
        onPass();
        let graph = Graph.readGraph(doc, file);
        let viewer = new GraphViewer(graph);
        putHere.appendChild(viewer.div);
    });
}

function openGraphWords(file, putHere = document.body, onPass = function() {}) {
    xmlImporter.openFile(file, null, function(doc, passed) {
        onPass();
        let div = document.createElement("div");
        putHere.appendChild(div);
        div.setAttribute("class", "GraphViewer");
        div.appendChild(GraphViewer.toWords(Graph.readGraph(doc, file)));
    });
}*/

function copyNode(node, namespace) {
    if (node.nodeType == 3) return document.createTextNode(node.nodeValue);
    if (node.nodeName == "math") namespace = mathns;
    if (node.nodeName == "mi") if (!node.hasAttribute("mathvariant")) node.setAttribute("mathvariant", "italic");
    if (node.nodeName == "a") node.setAttribute("target", "_blank");
    let returner = node.namespaceURI? document.createElementNS(node.namespaceURI, node.nodeName): document.createElement(node.nodeName);
    if (namespace == mathns) returner = document.createElementNS(namespace, node.nodeName);
    if (node.hasAttribute("trigger")) {
        let req, temp = document.createElement("p");;
        switch (node.getAttribute("trigger")) {
            case "xmlFile":
                returner.appendChild(temp);
                temp.innerHTML = "loading resource, should be xml file viewing of " + filePrefix + node.getAttribute("src") + xmlImporter.fileSuffix;
                req = new XMLHttpRequest();
                req.onload = function(doc) {
                    returner.removeChild(temp);
                    doc = doc.target.responseXML;
                    returner.appendChild((new xmlViewer(doc)).div);
                }
                req.open("GET", filePrefix + node.getAttribute("src") + xmlImporter.fileSuffix);
                req.overrideMimeType("text/xml");
                req.send();
                node.removeAttribute("src");
            break; case "GraphViewer":
                returner.appendChild(temp);
                temp.innerHTML = "loading graph viewer for " + node.getAttribute("src");
                openViewer(node.getAttribute("src"), returner, function() {returner.removeChild(temp);});
            break; case "GraphWords":
                returner.appendChild(temp);
                temp.innerHTML = "loading graph words for " + node.getAttribute("src");
                openGraphWords(node.getAttribute("src"), returner, function() {returner.removeChild(temp);});
            break; case "xmlFile and GraphViewer": {
                let fdiv = document.createElement("div"), vdiv = document.createElement("div");
                node.appendChild(fdiv);
                node.appendChild(vdiv);
                fdiv.setAttribute("src", node.getAttribute("src"));
                fdiv.setAttribute("trigger", "xmlFile");
                vdiv.setAttribute("src", node.getAttribute("src"));
                vdiv.setAttribute("trigger", "GraphViewer");
            } break; case "xmlFile and GraphWords": {
                let fdiv = document.createElement("div"), vdiv = document.createElement("div");
                node.appendChild(fdiv);
                node.appendChild(vdiv);
                fdiv.setAttribute("src", node.getAttribute("src"));
                fdiv.setAttribute("trigger", "xmlFile");
                vdiv.setAttribute("src", node.getAttribute("src"));
                vdiv.setAttribute("trigger", "GraphWords");
            } break; case "internal link":
                node.setAttribute("href", filePrefix + node.getAttribute("src") + xmlImporter.fileSuffix);
                node.removeAttribute("src");
            break; case "direct":
                returner.appendChild(temp);
                temp.innerHTML = "loading resource, should be contents of " + filePrefix + node.getAttribute("src") + xmlImporter.fileSuffix;
                req = new XMLHttpRequest();
                req.onload = function(doc) {
                    returner.removeChild(temp);
                    try {
                        doc = copyNode(xmlImporter.getRoot(doc.target.responseXML), namespace);
                        returner.appendChild(doc);
                    } catch (e) {
                        returner.appendChild(document.createTextNode("error loading resource"));
                    }
                }
                req.open("GET", filePrefix + node.getAttribute("src") + xmlImporter.fileSuffix);
                req.overrideMimeType("text/xml");
                req.send();
                node.removeAttribute("src");
            break; case "section":
                let newNode = document.createElement("details");
                newNode.setAttribute("class", "section");
                let summary = document.createElement("summary");
                newNode.appendChild(summary);
                let title = document.createElement("h3")
                summary.appendChild(document.createTextNode(node.getAttribute("title")));
                node.removeAttribute("title");
                while (node.firstChild) newNode.appendChild(node.firstChild);
                node.appendChild(newNode);
            break; case "change page":
                node.setAttribute("onclick", "loadPage(\"" + node.getAttribute("page") + "\");");
            break; case "css":
                node.setAttribute("href", filePrefix + node.getAttribute("src") + ".css");
                node.removeAttribute("src");
            break; case "js":
                node.setAttribute("src", filePrefix + node.getAttribute("src") + ".js");
            break; case "tex input":
                returner.setAttribute("class", "texInput");
                let ins = node.getAttribute("inputs").split(",");
                node.removeAttribute("inputs");
                let list = [];
                for (let i = 0; i < ins.length; ++i) returner.appendChild(makeTexInput(ins[i], list));
                let compile = document.createElement("button");
                returner.appendChild(compile);
                compile.appendChild(document.createTextNode("compile"));
                let textOut = document.createElement("details");
                returner.appendChild(textOut);
                textOut.setAttribute("class", "copyBox");
                let textOutSummary = document.createElement("summary");
                textOut.appendChild(textOutSummary);
                textOutSummary.appendChild(document.createTextNode("copy my contents"));
                let printHere = document.createElement("p");
                textOut.appendChild(printHere);
                let compileOut = document.createElement("div");
                returner.appendChild(compileOut);
                function read() {
                    let line = "", lineout = "";
                    for (let i = 0; i < ins.length; ++i) {
                        line += "<p>" + ins[i] + ": " + fixLine(list[i].value) + "</p>";
                        lineout += "&lt;"+ins[i]+"&gt;"+noJax(fixLine(list[i].value))+"&lt;/"+ins[i]+"&gt;";
                    }
                    compileOut.innerHTML = line;
                    while (printHere.firstChild) printHere.removeChild(printHere.firstChild);
                    printHere.innerHTML = lineout;
                    try {
                        MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
                    } catch (e) {}
                }
                compile.addEventListener("click", read);
        }
        node.removeAttribute("trigger");
    }
    for (let i = 0; i < node.attributes.length; ++i) returner.setAttribute(node.attributes[i].name, node.attributes[i].value);
    for (let i = 0; i < node.childNodes.length; ++i) {
        returner.appendChild(copyNode(node.childNodes[i], namespace));
    }
    return returner;
}

function loadPage(location) {
    let removes = document.querySelectorAll("[fromPage]");
    for (let i = 0; i < removes.length; ++i) removes[i].parentElement.removeChild(removes[i]);
    let req = new XMLHttpRequest();
    req.onload = function(doc) {
        doc = doc.target.responseXML;
        let part = doc.querySelector("head");
        if (part) if  (part.hasChildNodes()) {
            for (let i = 0; i < part.childNodes.length; ++i) if (part.childNodes[i].nodeType == 1) {
                part.childNodes[i].setAttribute("fromPage", location);
                document.head.appendChild(copyNode(part.childNodes[i]));
            }
        }
        part = doc.querySelector("body");
        if (part) if (part.hasChildNodes()) {
            for (let i = 0; i < part.childNodes.length; ++i) if (part.childNodes[i].nodeType == 1) {
                part.childNodes[i].setAttribute("fromPage", location);
                document.body.appendChild(copyNode(part.childNodes[i]));
            }
        }
    }
    req.open("GET", filePrefix + "pages/" + location + "/index" + xmlImporter.fileSuffix);
    req.overrideMimeType("text/xml");
    req.send();
}

function openProblems(location, update) {
    let req = new XMLHttpRequest();
    req.onload = function() {
        let line = req.responseText.split(" ");
        for (let i = 0; i < line.length; ++i) {
            let req2 = new XMLHttpRequest();
            req2.onload = function() {
                update((new DOMParser()).parseFromString("<?xml version=\"1.0\" encoding=\"UTF-8\"?><root>" + id + ": " + req2.responseText.replace("<problem>", "<problem>" + line[i] + ": ") + "</root>", "text/xml"));
            }
            req2.open("GET", filePrefix + location + "/problems/" + line[i] + ".txt");
            req2.overrideMimeType("text/plain");
            req2.send();
        }
    }
    req.open("GET", filePrefix + location + "/list.txt");
    req.overrideMimeType("text/plain");
    req.send();
}

function fixLine(line) {
    line = line.replace(/&/g, "&amp;");
    line = line.replace(/</g, "&lt;");
    line = line.replace(/>/g, "&gt;");
    line = line.replace(/"/g, "&quot;");
    line = line.replace(/'/g, "&apos;");
    let opening = true, returner = "";
    for (let i = 0; i < line.length; ++i) {
        if (line.charAt(i) == "$") {
            returner += opening? "\\(": "\\)";
            opening = !opening;
        } else returner += line.charAt(i);
    }
    return returner;
}

function noJax(line) {
    return line.replace(/&/g, "&amp;").replace(/\\/g, "\\<span\\>");
}

function makeTexInput(title, list) {
    let returner = document.createElement("div");
    returner.setAttribute("class", "tex input section");
    let name = document.createElement("p");
    returner.appendChild(name);
    name.appendChild(document.createTextNode(title + ":"));
    let input = document.createElement("textarea");
    returner.appendChild(input);
    list.push(input);
    return returner;
}

function mmi(name) {
    let math = document.createElementNS(mathns, "math");
    let mi = document.createElementNS(mathns, "mi");
    math.appendChild(mi);
    mi.setAttribute("mathvariant", "italic");
    mi.appendChild(document.createTextNode(name));
    return math;
}

function propertyMatches(a, b) {
    for (let A in a) if (!(A in b)) return false;
    for (let B in b) if (!(B in a)) return false;
    return true;
}

function hide(e) {
    if (!e.hasAttribute("realClass")) e.setAttribute("realClass", e.getAttribute("class"));
    e.setAttribute("class", "hide");
}

function unhide(e) {
    e.setAttribute("class", e.getAttribute("realClass"));
    e.removeAttribute("realClass");
}

function varManager() {
    this.vars = {};
    this.setVarValue = function setVarValue(name, value) {
        if (!(name in this.vars)) this.vars[name] = {properties: [], listeners: [], unlinks: []};
        this.vars[name].value = value;
        this.update(name);
    }
    this.update = function update(name) {
        let change = this.vars[name];
        for (let i = 0; i < change.properties.length; ++i) change.properties[i].object[change.properties[i].value] = change.value;
        for (let i = 0; i < change.listeners.length; ++i) change.listeners[i](change.value);
    }
    this.deleteVar = function deleteVar(varName) {
        while (this.vars[varName].unlinks.length > 0) this.vars[varName].unlinks[0]();
        delete this.vars[varName];
    }
    this.linkProperty = function linkProperty(varName, object, propertyName) {
        let pushing = {object: object, value: propertyName};
        this.vars[varName].properties.push(pushing);
        object[propertyName] = this.vars[varName].value;
        let that = this;
        let unlink = function unlink() {
            let index = that.vars[varName].properties.indexOf(pushing);
            that.vars[varName].properties.splice(index, 1);
            index = that.vars[varName].unlinks.indexOf(unlink);
            that.vars[varName].unlinks.splice(index, 1);
        }
        this.vars[varName].unlinks.push(unlink);
        return unlink;
    }
    this.linkListener = function linkListener(varName, listener, fire = false) {
        this.vars[varName].listeners.push(listener);
        if (fire) listener(this.vars[varName].value);
        let that = this;
        let unlink = function unlink() {
            let index = that.vars[varName].listeners.indexOf(listener);
            that.vars[varName].listeners.splice(index, 1);
            index = that.vars[varName].unlinks.indexOf(unlink);
            that.vars[varName].unlinks.splice(index, 1);
        }
        this.vars[varName].unlinks.push(unlink);
        return unlink;
    }
    this.clearAll = function clearAll() {
        for (let v in this.vars) this.deleteVar(v);
    }
}

function inParentChain(me, parent) {
    if (me == parent) return true;
    if (me.parent) return inParentChain(me.parent, parent);
    return false; 
}

function clearChildren(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
}

function getBy(array, property, value) {
    for (let o of array) if (o[property] == value) return o;
}

function emptyFunction() {};