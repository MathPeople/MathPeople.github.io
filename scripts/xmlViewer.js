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

xmlViewer.prototype.readNode = function readNode(node, loadHere) {
    if (node.nodeType == 3) {
        loadHere.appendChild(document.createTextNode(node.nodeValue));
        return;
    }
    let deets = document.createElement("details");
    loadHere.appendChild(deets);
    let summary = document.createElement("summary");
    deets.appendChild(summary);
    summary.appendChild(document.createTextNode(node.nodeName));
    for (let i = 0; i < node.attributes.length; ++i) {
        let att = node.attributes[i];
        summary.appendChild(document.createTextNode(" " + att.name + ": " + att.value));
    }
    for (let i = 0; i < node.childNodes.length; ++i) this.readNode(node.childNodes[i], deets);
}