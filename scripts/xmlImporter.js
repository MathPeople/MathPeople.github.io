/*
xmlImporter handles the various parts of interpreting a raw xml file into a form ready for the rest of the managers
it also has some of the xml managing abilities
*/

var xmlImporter = {};

// remove empty text nodes
xmlImporter.trim = function trim(node) {
    let child = node.firstChild;
    while (child) {
        if (child.nodeType == 3 && child.nodeValue.trim() == "") {
            let nextChild = child.previousSibling? child.previousSibling: child.nextSibling;
            node.removeChild(child);
            child = nextChild;
        } else {
            if (child.nodeType == 1) xmlImporter.trim(child);
            child = child.nextSibling;
        }
    }
}
// fetch xml file at location and call finished(responseXML, pass) when done
xmlImporter.openXMLFile = function openXMLFile(location, pass, finished, failed=function(){console.warn("failed HTTP request " + location)}) {
    let req = new XMLHttpRequest();
    function trimAndFinish() {
        let response = req.responseXML;
        xmlImporter.trim(response);
        finished(response, pass);
    }
    req.onload = trimAndFinish;
    req.onerror = failed;
    req.open("GET",location);
    req.overrideMimeType("text/xml");
    req.send();
}

// fetch text file at location and call finished(responseText, pass) when done
xmlImporter.openTextFile = function openTextFile(location, pass, finished, failed=function(){console.warn("failed HTTP request " + location)}) {
    let req = new XMLHttpRequest();
    req.onload = function() {finished(req.responseText, pass)}
    req.onerror = failed;
    req.open("GET",location);
    req.overrideMimeType("text/plain");
    req.send();
}

// descend from a document to its root node if necessary
xmlImporter.getRoot = function getRoot(xml) {
    if (xml.nodeType == 1) return xml;
    if (xml.nodeType == 9) return xml.firstChild;
    throw new Error("cannot find root node of " + xml.nodeName);
}

// create a new node in arbitrary xml document
xmlImporter.elementDoc = function elementDoc(doc, type, loadHere, atts = []) {
    let returner = doc.createElement(type);
    if (loadHere) loadHere.appendChild(returner);
    for (let i = 0; i < atts.length; i += 2) returner.setAttribute(atts[i], atts[i+1]);
    return returner;
}

// create a new node in current DOM
xmlImporter.element = function element(type, loadHere, atts) {return xmlImporter.elementDoc(document, type, loadHere, atts)}

xmlImporter.text = function text(line, loadHere) {
    let returner = document.createTextNode(line);
    if (loadHere) loadHere.appendChild(returner);
    return returner;
}

xmlImporter.newDocument = function() {return document.implementation.createDocument(null, "")}

xmlImporter.parser = new DOMParser();

xmlImporter.parseDoc = function parseDoc(line) {return xmlImporter.parser.parseFromString(line, "application/xml")}

xmlImporter.serializer = new XMLSerializer();

xmlImporter.nodeToString = function nodeToString(node) {return xmlImporter.serializer.serializeToString(node)}

// very important functionality
xmlImporter.rickRollLink = function rickRollLink(a) {
    a.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        let rr = xmlImporter.element("a", document.body, ["href", "https://www.youtube.com/watch?v=QMW4AqbuSGg&t=2m41s", "target", "_blank"]);
        rr.click();
        document.body.removeChild(rr);
    });
}