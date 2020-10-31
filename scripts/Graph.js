loadCSS("css/Graphs.css");

// First we create plain graphs. Structure consists of ui (universal identifier), typed members, named edges, and ancestry.
var Graph = {};

// Repository of all graphs stored by ui
Graph.universe = {};

Graph.protoModel = {thisIs: "graph"};// object to be used as prototype of instances of graph
    
Graph.newGraph = function newGraph(ui, protoModel = Graph.protoModel) {
    if (ui in Graph.universe) throw Error(ui + " is already a graph");
    let returner = Object.create(protoModel);
    Graph.universe[ui] = returner;
    returner.ui = ui;
    returner.members = {};// members are stored by id in this members object
    returner.memberOrder = [];// remembers the order in which members were added
    return returner;
}

// Adds a member to the graph, checking that there are no duplicate members, and sets up the member to have children, descendants, and ancestors
// The only place a member is stored is in the graph's members object. Everywhere else members are referred to by id
Graph.protoModel.addMember = function addMember(id, type) {
    if (id in this.members) throw Error(id + " is already a member");
    this.members[id] = {children: {}, ancestors: {}, descendants: {}, id: id, type: type};
    this.memberOrder.push(id);
}

// Forges a relationship between two members, storing the child in the childName position in the parent's children object. Checks that this does not introduce a cycle and then updates the family registry for the new relationship.
{
    let relate = function relate(members, old, young) {
        if (old in members[young].descendants) throw Error("Graph must be acyclic");
        if (old in members[young].ancestors) return;
        members[old].descendants[young] = undefined;
        members[young].ancestors[old] = undefined;
        for (let younger in members[young].descendants) relate(members, old, younger);
        for (let older in members[old].ancestors) relate(members, older, young);
    }
    Graph.protoModel.setChild = function setChild(parent, childName, child) {
        if (!((parent in this.members) && (child in this.members))) throw Error(parent + " or " + child + " is not a member");
        if (childName in this.members[parent].children) throw Error(parent + " already has a child named " + childName);
        this.members[parent].children[childName] = child;
        relate(this.members, parent, child);
    }
}

// Graph finalization overwrites the modification functions to throw errors
Graph.throwFinalizedError = function () {throw Error("cannot modify a finalized graph")}
Graph.protoModel.finalize = function finalize() {
    this.addMember = this.setChild = this.finalize = Graph.throwFinalizedError;
}

// Read members and edges into a graph and store it in Graph's universe. Intended to be the base reader which further statement types can extend
Graph.plainGraphReader = function plainGraphReader(node, ui, hook = Graph.readerHooks.plainGraph) {
    node = xmlImporter.getRoot(node);
    let returner = Graph.newGraph(ui, hook.protoModel);
    let reqsNode = node.firstChild, statementsNode = reqsNode.nextSibling;
    returner.definitionsKey = {}, returner.definitionsKeyReverse = {};// for translating between reference and external ui
    // get external references
    let reqName, reqUI;
    for (let req of reqsNode.childNodes) {
        reqName = req.getAttribute("id");
        reqUI = req.firstChild.nodeValue;
        returner.definitionsKey[reqName] = reqUI;
        returner.definitionsKeyReverse[reqUI] = reqName;
    }
    // read statements
    for (let statement of statementsNode.childNodes) {
        if (!statement.hasAttribute("id")) throw Error("every member needs an id");
        let id = statement.getAttribute("id"), type = statement.nodeName;
        returner.addMember(id, returner.definitionsKey[type]);
        let atts = {};
        returner.members[id].attributesFromNode = atts;
        for (let att of statement.attributes) atts[att.name] = att.value;
        for (let child of statement.childNodes) returner.setChild(id, child.nodeName, child.firstChild.nodeValue);
    }
    return returner;
}

// Read the terms in a SCRML file. This involves checking which process to follow for each term, this is done with reader hooks. If a term desclares itself to be of some type, and if this compiler recognizes that type, it will follow that proces, otherwise it will do the default processing steps.

// If a node declares itself as a particular statement type the reader hook will follow that
Graph.readerHooks = {};
Graph.readerHooks.plainGraph = {protoModel: Graph.protoModel, reader: Graph.plainGraphReader};

// Decide if a hook is required and follow that hook, defaulting to plain graph
Graph.readGraph = function readGraph(node, ui) {
    let hook;
    if (node.hasAttribute("statementType")) {
        let statementType = node.getAttribute("statementType");
        if (statementType in Graph.readerHooks) {
            hook = Graph.readerHooks[statementType];
        } else {
            console.log("unrecognized statement type " + statementType + " in " + ui);
            hook = Graph.readerHooks.plainGraph;
        }
    } else hook = Graph.readerHooks.plainGraph;
    return hook.reader(node, ui, hook);
}

// miscellaneous functions which have not been organized yet

Graph.protoModel.listChildren = function listChildren(member) {
    member = this.members[member];
    let line = "";
    if (!isEmpty(member.children)) {
        line += ": ";
        for (let child in member.children) line += child + " " + member.children[child] + ", ";
        line = line.substring(0, line.length - 2);
    }
    return line;
}

Graph.protoModel.toWords = function toWords(loadHere) {
    let out = gui.element("div", loadHere, ["class", "graphWords"]);
    for (let name of this.memberOrder) {
        let member = this.members[name];
        let line = member.type + " " + name + this.listChildren(name);
        gui.text(line, gui.element("p", out));
    }
}

function Section(title, parent) {
    this.title = title;
    parent.items.push(this);
    this.ui = function() {return parent.ui() + "/" + title};
}

Graph.readBook = function readBook(doc, ui, loadHere) {
    xmlImporter.trim(doc);
    let book = {};
    book.ui = function() {return ui};
    let node = xmlImporter.getRoot(doc);
    node = node.firstChild;
    book.items = [];
    for (let item of node.childNodes) {
        if (item.getAttribute("itemType") == "section") {
            let section = new Section(item.getAttribute("title"), item.hasAttribute("parent")? book.items[item.getAttribute("parent")]: book);
        } else {
            let newItem = {};
            book.items.push(newItem);
            let statement = item.firstChild.firstChild;
            if (!statement.hasAttribute("statementType")) statement.setAttribute("statementType", "definition");
            newItem.graph = Graph.readGraph(statement, book.items[item.getAttribute("parent")].ui() + "/" + item.getAttribute("title"));
            newItem.graph.toWords(loadHere);
        }
    }
}