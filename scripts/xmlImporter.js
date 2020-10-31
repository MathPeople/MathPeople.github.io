/*
xmlImporter handles the various parts of interpreting a raw xml file into a form ready for the rest of the managers
it also has some of the xml managing abilities
*/

var xmlImporter = {};
xmlImporter.fileSuffix = ".txt";
// remove empty text nodes
xmlImporter.trim = function trim(node) {
    let removes = [];
    for (let i = 0; i < node.childNodes.length; ++i) if (node.childNodes[i].nodeType == 3) if (node.childNodes[i].nodeValue.trim() == "") removes.push(node.childNodes[i]);
    for (let i = 0; i < removes.length; ++i) node.removeChild(removes[i]);
    for (let i = 0; i < node.childNodes.length; ++i) xmlImporter.trim(node.childNodes[i]);
}
// fetch file at location, store into savedDocs, and call finished(pass) when done
xmlImporter.openFile = function openFile(location, pass, finished, failed = function() {console.log("failed HTTP request");}) {
    if (savedDocs[location]) {
        if (savedDocs[location] == "incomplete") {
            let timeout = window.setInterval(function() {
                if (savedDocs[location] != "incomplete") {
                    window.clearInterval(timeout);
                    finished(savedDocs[location], pass);
                }
            }, 300);
        } else finished(savedDocs[location], pass);
        return;
    }
    let req = new XMLHttpRequest();
    function trimAndFinish() {
        if (savedDocs[location]) {
            if (savedDocs[location] == "incomplete") {
                let timeout = window.setInterval(function() {
                    if (savedDocs[location] != "incomplete") {
                        window.clearInterval(timeout);
                        finished(savedDocs[location], pass);
                    }
                }, 300);
            } else finished(savedDocs[location], pass);
            return;
        }
        let response = typeof location == "string"? req.responseXML: location;
        savedDocs[location] = "incomplete";
        xmlImporter.trim(response);
        let requireds = [];
        let locations = response.querySelectorAll("requiredUIs > *");
        for (let i = 0; i < locations.length; ++i) {
            let loc = locations[i];
            if (loc.nodeType != 1) continue;
            let e = Error("cannot open " + loc.nodeName + " from " + location);
            if (loc.childNodes.length != 1) throw e;
            if (loc.firstChild.nodeType != 3) throw e;
            requireds.push(loc.firstChild.nodeValue);
        }
        if (requireds.length == 0) {
            savedDocs[location] = response;
            finished(response, pass);
        } else {
            let passer = {doc: response, count: requireds.length, pass: pass, finished: finished};
            for (let i = 0; i < requireds.length; ++i) {
                let required = requireds[i];
                xmlImporter.openFile(required, passer, function(doc, passed) {
                    if (--passed.count == 0) {
                        savedDocs[location] = response;
                        passed.finished(passed.doc, passed.pass);
                    }
                });
            }
        }
    }
    req.onload = trimAndFinish;
    req.onerror = failed;
    req.open("GET", filePrefix + location + xmlImporter.fileSuffix);
    req.overrideMimeType("text/xml");
    req.send();
}
// get the external references from a SCRML file
xmlImporter.getrequiredUIs = function getrequiredUIs(fileClean) {
    let returner = {};
    let requireds;
    let list = xmlImporter.getRoot(fileClean).childNodes;
    for (let i = 0; i < list.length; ++i) {
        if (list[i].nodeName == "requiredUIs") requireds = list[i].childNodes;
    }
    if (!requireds) requireds = [];
    for (let i = 0; i < requireds.length; ++i) {
        let req = requireds[i];
        if (req.nodeType != 1) continue;
        returner[req.nodeName] = req.firstChild.nodeValue;
    }
    return returner;
}
// descend from a document to its root node if necessary
xmlImporter.getRoot = function getRoot(xml) {
    if (xml.nodeType == 1) return xml;
    if (xml.nodeType == 9) return xml.firstChild;
    throw new Error("cannot find root node of " + xml.nodeName);
}

xmlImporter.nodeToString = function nodeToString(node, indent = "", tab = "  ", newLine = "\r\n") {
    if (node.nodeType == 3) return node.nodeValue;
    if (node.nodeType == 9) return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + xmlImporter.nodeToString(node.firstChild, indent, tab, newLine);
    let line = newLine;
    line += indent+"<"+node.nodeName;
    for (let i = 0; i < node.attributes.length; ++i) line += " "+node.attributes[i].name+"=\""+node.attributes[i].value+"\"";
    line += node.childNodes.length == 0? "/>": ">";
    if (node.childNodes.length > 0) {
        let isText = node.childNodes.length == 1;
        if (isText) isText = node.firstChild.nodeType == 3;
        if (isText) line += node.firstChild.nodeValue + "</"+node.nodeName+">";
        else {
            for (let i = 0; i < node.childNodes.length; ++i) line += xmlImporter.nodeToString(node.childNodes[i], indent + tab, tab, newLine);
            line += newLine+indent+"</"+node.nodeName+">";
        }
    }
    return line;
}
// pull this node from the document, setting its children to be children of its parent
xmlImporter.collapseNode = function collapseNode(node) {
    let parent = node.parentNode;
    let index = 0;
    for (let i = 0; i < parent.childNodes.length; ++i) if (parent.childNodes[i] == node) index = i;
    parent.removeChild(node);
    let length = parent.childNodes.length;
    while (node.firstChild) parent.appendChild(node.firstChild);
    for (let i = index; i < length; ++i) {
        let child = parent.childNodes[index];
        parent.removeChild(child);
        parent.appendChild(child);
    }
}

xmlImporter.copyAttributes = function copyAttributes(from, to) {
    for (let i = 0; i < from.attributes.length; ++i) to.setAttribute(from.attributes[i].name, from.attributes[i].value);
}

xmlImporter.copyNode = function copyNode(fromNode, toDoc) {
    if (fromNode.nodeType == 3) return toDoc.createTextNode(fromNode.nodeValue);
    if (fromNode.nodeType == 9) throw Error("can only copy nodes, not document");
    let returner = toDoc.createElement(fromNode.nodeName);
    xmlImporter.copyAttributes(fromNode, returner);
    for (let i = 0; i < fromNode.childNodes.length; ++i) returner.appendChild(xmlImporter.copyNode(fromNode.childNodes[i], toDoc));
    return returner;
}

xmlImporter.copyDoc = function copyDoc(doc) {
    let returner = doc.implementation.createDocument(doc.namespaceURI, "deleteMe");
    returner.firstChild.appendChild(xmlImporter.copyNode(doc.firstChild, returner));
    xmlImporter.collapseNode(returner.firstChild);
    return returner;
}

xmlImporter.domParser = new DOMParser();