/*
    xmlImporter handles the various parts of interacting with raw xml files.
    Because the DOM itself is so closely related, xmlIMporter also handles direct interaction with the DOM.
*/

var xmlImporter = {};

// trim text node values and remove empty text nodes
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
    return node;
}
// fetch xml file at location and call finished(responseXML, pass) when done
xmlImporter.openXMLFile = function openXMLFile(location, pass, finished, failed=function(){console.warn("failed HTTP request " + location)}) {
    let req = new XMLHttpRequest();
    function trimAndFinish() {
        if (req.status == 404) return failed();
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
    req.onload = function() {
        if (req.status == 404) return failed();
        finished(req.responseText, pass)
    }
    req.onerror = failed;
    req.open("GET",location);
    req.overrideMimeType("text/plain");
    req.send();
}

// descend from a document to its root node if necessary
xmlImporter.getRoot = function getRoot(xml) {
    if (xml.nodeType == 1) return xml;
    if (xml.nodeType == 9) return xml.firstElementChild;
    throw new Error("cannot find root node of " + xml.nodeName);
}

// this defines which strings are valid node names
xmlImporter.nodeNameScreen = function nodeNameScreen(line) {
    try {return document.createElement(line) !== false} catch (e) {return false}
}

// create a new node in arbitrary xml document
xmlImporter.elementDoc = function elementDoc(doc, type, loadHere, atts = []) {
    let returner = doc.createElement(type);
    if (loadHere) loadHere.appendChild(returner);
    for (let i = 0; i < atts.length; i += 2) returner.setAttribute(atts[i], atts[i+1]);
    return returner;
}

// create a new node in window document
xmlImporter.element = function element(type, loadHere, atts) {return xmlImporter.elementDoc(document, type, loadHere, atts)}

// create and insert a text node
xmlImporter.text = function text(line, loadHere) {
    let returner = document.createTextNode(line);
    if (loadHere) loadHere.appendChild(returner);
    return returner;
}

// Make a div to hold the element and a label for it, returns the element
xmlImporter.labeledElement = function labeledElement(labelText, elementType, loadHere, id, listeners = [], attributes = []) {
    let div = xmlImporter.element("div", loadHere);
    xmlImporter.text(labelText, xmlImporter.element("label", div));
    let returner = xmlImporter.element(elementType, div, ["id", id].concat(attributes));
    let i = 0;
    while (i < listeners.length) returner.addEventListener(listeners[i++], listeners[i++]);
    return returner;
}

// Specialization for input is just the attribute type="text", otherwise this is xmlImporter.labeledElement
xmlImporter.labeledInput = function labeledInput(labelText, loadHere, inputId, listeners = [], otherInputAtts = []) {
    return xmlImporter.labeledElement(labelText, "input", loadHere, inputId, listeners, ["type", "text"].concat(otherInputAtts));
}

// Make a button and add text and a click event listener
xmlImporter.makeButton = function makeButton(text, loadHere, buttonId, onclick, otherButtonAtts = []) {
    let returner = xmlImporter.element("button", loadHere, ["type", "button", "id", buttonId].concat(otherButtonAtts));
    xmlImporter.text(text, returner);
    returner.addEventListener("click", onclick);
    return returner;
}

// Make a details element with prescribed summary text
xmlImporter.makeDetails = function makeDetails(text, loadHere, open = false, attributes) {
    let returner = xmlImporter.element("details", loadHere, attributes);
    if (open) returner.setAttribute("open", "");
    xmlImporter.text(text, xmlImporter.element("summary", returner));
    return returner;
}

// Event listener for auto-resizing textareas, returns the textarea itself
xmlImporter.fixTextHeight = function fixTextHeight(event) {
    // stash scroll location to avoid jumps
    let scrollLeft = window.pageXOffset || (document.documentElement || document.body.parentNode || document.body).scrollLeft,
        scrollTop = window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop;
    
    // resize textarea
    event = event.target;
    while (event.nodeName.toLowerCase() != "textarea") event = event.parentNode;
    event.style.height = "auto";
    event.style.height = event.scrollHeight+"px";
    
    // reset scroll location
    window.scrollTo(scrollLeft, scrollTop);
    return event;
}

// temporary message displayed in an input element
xmlImporter.inputMessage = function inputMessage(input, message, time = 1000) {
    let line = input.value, able = !input.hasAttribute("disabled");
    window.setTimeout(function() {input.value = message}, 10); // delay is to let blur happen
    input.setAttribute("disabled", "");
    window.setTimeout(function() {
        input.value = line;
        if (able) input.removeAttribute("disabled");
    }, time);
}

// create a blank XML document
xmlImporter.newDocument = function() {return document.implementation.createDocument(null, "")}

// parse a string into an XML document
xmlImporter.parseDoc = function parseDoc(line) {return xmlImporter.parser.parseFromString(line, "application/xml")}

xmlImporter.parser = new DOMParser();

xmlImporter.serializer = new XMLSerializer();

// serialize an XML document. this could be done with an XMLSerializer but that doesn't seem to add indentation, so we do it manually here
xmlImporter.nodeToString = function nodeToString(node, indent = "", tab = "  ", newLine = "\n") {
    if (node.nodeType === 3) return node.nodeValue;
    if (node.nodeType === 9) return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + xmlImporter.nodeToString(node.firstChild, indent, tab, newLine);
    if (node.nodeType !== 1) return xmlImporter.serializer.serializeToString(node);
    let line = newLine+indent+"<"+xmlImporter.nodeToStringOpeningTagInsides(node);
    line += node.childNodes.length == 0? "/>": ">";
    if (node.childNodes.length > 0) {
        let isText = node.childNodes.length == 1;
        if (isText) isText = node.firstChild.nodeType == 3;
        if (isText) line += node.firstChild.nodeValue + "</"+node.nodeName+">";
        else {
            for (child of node.childNodes) line += nodeToString(child, indent + tab, tab, newLine);
            line += newLine+indent+"</"+node.nodeName+">";
        }
    }
    return line;
}

// use the serializer to get the attributes all formatted right
xmlImporter.nodeToStringOpeningTagInsides = function nodeToStringOpeningTagInsides(node) {
    let clone = node.cloneNode(true);
    while (clone.firstChild) clone.removeChild(clone.firstChild);
    xmlImporter.text("d", clone);
    let line = xmlImporter.serializer.serializeToString(clone);
    return line.substring(1, line.length - (clone.nodeName.length + 5));
}

// node to string but for display inside an element
xmlImporter.nodeToInnerHTML = function nodeToInnerHTML(node, highlight) {
    if (node.nodeType === 3) return "<span class=\"prenode\">"+node.nodeValue+"</span>";
    if (node.nodeType === 9) return xmlImporter.nodeToInnerHTML(xmlImporter.getRoot(node), highlight);
    let line = "<span class=\"prenode\"" + (node === highlight? " highlight=\"\"": "") + ">";
    line += "&lt;"+(xmlImporter.nodeToStringOpeningTagInsides(node).replaceAll(/</g, "&lt;").replaceAll(/>/g, "&gt;"));
    if (node.hasChildNodes()) {
        line += "&gt;";
        for (let child of node.childNodes) line += xmlImporter.nodeToInnerHTML(child, highlight);
        line += "&lt;/"+node.nodeName+"&gt;";
    } else line += "/&gt;";
    line += "</span>";
    return line;
}



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

// Makes a textarea tabbable instead of the default behavior which is to tab out of elements. This is taken from a stackexchange post.
{
    let tabber = function(e) {
        if (e.key == 'Tab') {
            e.preventDefault();
            let start = this.selectionStart, end = this.selectionEnd;
            e.target.value = e.target.value.substring(0, start)+"\t"+e.target.value.substring(end);
            e.target.selectionStart = e.target.selectionEnd = start + 1;
        }
    }
    xmlImporter.makeTabbable = function makeTabbable(element) {
        element.addEventListener('keydown', tabber);
    }

}

// check if a string successfully parses to an xml document
{
    let parserErrorNS = "";
    try {
        parserErrorNS = window.localStorage.getItem("parserErrorNS");
        if (!parserErrorNS) {
            console.groupCollapsed();
            console.log("about to run a practice parser error");
            let badDoc = xmlImporter.parseDoc("<");
            console.log("practice parser error done");
            parserErrorNS = badDoc.querySelector("parsererror").namespaceURI;
            console.groupEnd();
            window.localStorage.setItem("parserErrorNS", parserErrorNS);
        }
    } catch (e) {}

    xmlImporter.isParserError = function isParseError(doc) {
        return doc.getElementsByTagNameNS(parserErrorNS, 'parsererror').length > 0;
    }
    
    xmlImporter.parsesTest = function parsesTest(line) {
        let returner = xmlImporter.parseDoc(line);
        return xmlImporter.isParserError(returner)? false: returner;
    }
}