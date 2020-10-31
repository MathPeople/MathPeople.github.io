{
    let link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("href", filePrefix + "css/xmlViewer.css");
    document.head.appendChild(link);
}

var xmlViewer = function xmlViewer(file) {
    xmlImporter.trim(file);
    file = xmlImporter.getRoot(file);
    let div = document.createElement("div");
    this.div = div;
    div.setAttribute("class", "xmlViewer");
    let asDetails = document.createElement("div");
    this.div.appendChild(asDetails);
    asDetails.setAttribute("class", "asDetails");
    this.readNode(file, asDetails);
}

xmlViewer.prototype.readNode = function readNode(node, inDetails) {
    if (node.nodeType == 3) {
        inDetails.appendChild(document.createTextNode(node.nodeValue));
        return;
    }
    let deets = document.createElement("details");
    inDetails.appendChild(deets);
    let summary = document.createElement("summary");
    deets.appendChild(summary);
    summary.appendChild(document.createTextNode(node.nodeName));
    for (let i = 0; i < node.attributes.length; ++i) {
        let att = node.attributes[i];
        summary.appendChild(document.createTextNode(" " + att.name + ": " + att.value));
    }
    for (let i = 0; i < node.childNodes.length; ++i) this.readNode(node.childNodes[i], deets);
}