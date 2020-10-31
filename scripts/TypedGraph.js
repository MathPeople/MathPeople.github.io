// Typed graphs are the context structures of statements as graphs. Functionality includes type declaring, type matching, and a universal dictionary of types
var TypedGraph = {};

TypedGraph.universe = Dictionary.newDictionary("typed graphs");

TypedGraph.protoModel = Object.create(Graph.protoModel);
TypedGraph.protoModel.thisIs = "TypedGraph";

// Most statement types will be extensions of TypedGraph, which is itself an extension of plain graph. TypedGraph.phraseTypes stores the extensions
// Each phrase type comes with a protoModel, a toWords, a readStatement, and a trigger for nodes to reference
TypedGraph.phraseTypes = {};

TypedGraph.newGraph = function newGraph(ui, protoModel = Graph.TypedGraph.protoModel) {
    let returner = Graph.newGraph(ui, protoModel);
    returner.assumptionLevels = {};
    return returner;
}

{
    // this is where a term is type checked
    // graph is this graph, type is the definition graph, term is the term currently being checked in this graph, template is the corresponding term in the definition
    let checkTerm = function checkTerm(graph, type, term, template, encountered) {
        let member = graph.members[term], inType = type.members[template];
        // check that term itself matches template
        if (!(member.type in Graph.universe)) throw Error("cannot find type " + member.type + " from " + term);
        if (member.type != inType.type) throw Error("type of " + term + " is " + member.type + " but it should be " + inType.type);
        // check that the required descendant sctructure is present
        for (let childName in inType.children) {
            if (!(childName in member.children)) throw Error(term + " does not have child named " + childName);
            let child = member.children[childName], typeChild = inType.children[childName];
            if (!(typeChild in encountered)) encountered[typeChild] = child;
            if (child != encountered[typeChild]) throw Error("definition mismatch, " + child + " should be " + encountered[typeChild]);
            // recursive step to exhaust the descendants
            checkTerm(graph, type, child, typeChild, encountered);
        }
    }
    // check that the terms in this typed graph match their types
    TypedGraph.protoModel.checkDefinitionsConsistent = function checkDefinitionsConsistent() {
        for (let member in this.members) {
            let term = this.members[member], type = Graph.universe[term.type];
            try {
                checkTerm(this, type, member, type.root, {});
            } catch (e) {
                console.log("error making member " + member + " in " + this.ui);
                throw e;
            }
        }
    }
}

// Check that all types are matched and cap off the graph with a new vertex named me
TypedGraph.protoModel.finalize = function finalize(me) {
    let maxs = {};
    for (let member in this.members) if (isEmpty(this.members[member].ancestors)) maxs[member] = undefined;
    this.addMember(me, this.ui, "self");
    this.root = me;
    for (let max in maxs) this.setChild(me, max, max);
    this.checkDefinitionsConsistent();
    TypedGraph.universe.addMember(this.ui, this.ui);
    for (let member in this.members) if (member != this.root) TypedGraph.universe.setChild(this.ui, member, this.members[member].type);
    Graph.protoModel.finalize.call(this);
}
// reader for typed graphs
TypedGraph.plainReader = function readStatement(node, ui, hook = Graph.readerHooks.definition) {
    let returner = Graph.plainGraphReader(node, ui, hook);
    returner.finalize(node.nodeName);
    return returner;
}
// a genesis graph is an empty statement. The typed graph consists of only the cap
TypedGraph.makeGenesisGraph = function makeGenesisGraph(name, ui) {
    return TypedGraph.plainReader(xmlImporter.domParser.parseFromString("<"+name+"><requiredUIs/><statements/></"+name+">", "application/xml"), ui);
}
// for extending statement types into new statement types
TypedGraph.newPhraseType = function newPhraseType(trigger, extending = TypedGraph.protoModel, reader = TypedGraph.plainReader) {
    let returner = {};
    TypedGraph.phraseTypes[trigger] = returner;
    returner.trigger = trigger;
    returner.protoModel = Object.create(extending);
    returner.protoModel.thisIs = trigger;
    returner.reader = reader;
    Graph.readerHooks[trigger] = returner;
    return returner;
}

TypedGraph.protoModel.listChildren = function listChildren(member) {
    member = this.members[member];
    let line = "";
    if (!isEmpty(member.children)) {
        line += isMultiple(member.children)? ": ": " ";
        for (let child in member.children) line += child + " " + member.children[child] + ", ";
        line = line.substring(0, line.length - 2);
    }
    return line;
}

// Definition phrase type is a plain typed graph. This is how object definitions are made
{
    let Definition = TypedGraph.newPhraseType("definition");
    
    Definition.reader = function readDefinition(node, ui, hook) {
        let returner = TypedGraph.plainReader.call(this, node, ui, hook);
        for (let member in returner.members) returner.members[member].assumptionLevel = "context";
        return returner;
    }
    // for printing the contents of this definition to a DOM
    Definition.protoModel.toWords = function toWords(loadHere) {
        let div = gui.element("div", loadHere, ["class", "graphWords"]);
        gui.text(this.root, gui.element("h5", div));
        let out = gui.element("p", div);
        for (let name of this.memberOrder) {
            let member = this.members[name];
            let line;
            if (name == this.root) {
                line = "Define the type " + name;
                if (!isEmpty(member.children)) {
                    line += " to have children which match ";
                    for (let child in member.children) line += child + ", ";
                    line = line.substring(0, line.length - 2);
                }
                line += ".";
            } else {
                let type = this.definitionsKeyReverse[member.type];
                line = "Let " + name + " be " + aan(type) + this.listChildren(name) + ". ";
            }
            gui.text(line, out);
        }
    }
}

// Testable phrase type is a definition which is either true or false in the classical sense. This allows boolean statements and analysis with our statements
{
    let Testable = TypedGraph.newPhraseType("testable", TypedGraph.phraseTypes.definition.protoModel, TypedGraph.phraseTypes.definition.reader);
    
    Testable.reader = function readStatement(node, ui, hook = Graph.readerHooks.testable) {
        let returner = TypedGraph.phraseTypes.definition.reader(node, ui, hook);
        return returner;
    }
    
    Testable.protoModel.toWords = function toWords(loadHere) {
        let div = gui.element("div", loadHere, ["class", "graphWords"]);
        gui.text(this.root, gui.element("h5", div));
        let out = gui.element("p", div);
        for (let name of this.memberOrder) {
            let member = this.members[name];
            let line;
            if (name == this.root) {
                line = "Define the testable " + name;
                if (!isEmpty(member.children)) {
                    line += " to have children which match ";
                    for (let child in member.children) line += child + ", ";
                    line = line.substring(0, line.length - 2);
                }
                line += ".";
            } else {
                let type = this.definitionsKeyReverse[member.type];
                line = "Let " + name + " be " + aan(type) + this.listChildren(name) + ". ";
            }
            gui.text(line, out);
        }
    }
}