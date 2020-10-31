/*{
    let link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("href", filePrefix + "css/PhraseBuilder.css");
    document.head.appendChild(link);
}

var PhraseBuilder = {protoModel: {}, reqProto: {}, termProto: {}};

PhraseBuilder.newBuilder = function(item, prototype = PhraseBuilder.protoModel) {
    let returner = Object.create(prototype);
    returner.item = item;
    item.builder = returner;
    returner.book = item.book;
    returner.doc = document.implementation.createDocument("", "root");
    returner.terms = [];
    returner.modules = {};
    
    returner.boundCompile = function() {returner.book.compile()};
    returner.boundTermNameTest = function(id) {return returner.newNameTest(id)};
    
    returner.div = gui.element("div", item.div, ["class", "phraseBuilder"]);
    returner.reqsMaker = PhraseBuilder.dictionaryMaker(item, returner.div);
    returner.termsDiv = gui.element("div", returner.div, ["class", "termsDiv"]);
    returner.newTermIn = gui.screenedInput(returner.termsDiv, "new term name", function(name) {
        returner.newTerm(name);
        returner.book.compile();
    }, returner.boundTermNameTest);
    returner.newTermIn.setAttribute("disabled", "");
    returner.newModuleIn = gui.button("new module", returner.termsDiv, function() {
        let inPopup = gui.element("div");
        let newModuleName = gui.screenedInput(inPopup, "module name", emptyFunction, returner.boundTermNameTest, undefined, undefined, false), newModuleType = gui.element("select", inPopup), newModuleButton = gui.button("make module", inPopup, function() {
            returner.newModule(newModuleName.value, newModuleType.value);
            returner.book.popup.closePopup();
            returner.book.compile();
        });
        newModuleName.setAttribute("class", "popupItem");
        newModuleType.setAttribute("class", "popupItem");
        newModuleButton.setAttribute("class", "popupItem");
        for (let type in Graph.moduleReaders) gui.option(type, newModuleType);
        returner.book.popup.openPopup(inPopup, returner.newModuleIn);
        newModuleName.focus();
    });
    
    let details = gui.element("details", item.div, ["class", "viewDiv"]);
    gui.summary("In words", details);
    returner.viewDiv = gui.element("div", details);
    returner.fileDiv = gui.element("div", item.div);
    returner.errorOut = gui.element("pre", item.div, ["class", "errorOut"]);
    
    returner.importReqButton = gui.button("import by click", returner.reqsMaker.div, function() {
        let text = returner.importReqButton.firstChild;
        if (text.nodeValue == "import by click") {
            returner.importReqButton.firstChild.nodeValue = "stop importing";
            let listeners = returner.listeners = [];
            for (let i = 0; i < item.itemIndex; ++i) if (returner.book.items[i].isPhrase) {
                let other = returner.book.items[i];
                other.div.setAttribute("clickable", "");
                let listener = function(e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    other.div.removeAttribute("clickable");
                    other.div.setAttribute("clicked", "");
                    let name = other.title, uri = other.uri, type = "definition", nameNumber = "";
                    while (getBy(returner.reqsMaker.reqs, "name", name + nameNumber)) {
                        if (nameNumber === "") nameNumber = 0;
                        else nameNumber++;
                    }
                    name = name + nameNumber;
                    returner.reqsMaker.newReqName.value = name;
                    returner.reqsMaker.newReqURI.value = uri;
                    returner.reqsMaker.newReqType.value = type;
                    returner.reqsMaker.tryNewReq();
                }
                listeners.push({node: other.div, listener: listener});
                other.div.addEventListener("click", listener, true);
            }
        } else {
            for (let l of returner.listeners) l.node.removeEventListener("click", l.listener, true);
            returner.listeners = [];
            for (let i = 0; i < item.itemIndex; ++i) if (returner.book.items[i].isPhrase) {
                returner.book.items[i].div.removeAttribute("clickable");
                returner.book.items[i].div.removeAttribute("clicked");
            }
            text.nodeValue = "import by click";
        }
    });
    
    let label = gui.element("label", returner.div);
    gui.text("cap vertex assumption level: ", label);
    
    return returner;
}

PhraseBuilder.protoModel.saveToDoc = function saveToDoc() {
    let doc = this.doc;
    clearChildren(doc);
    let root = gui.elementDoc(doc, this.item.title, doc);
    let reqs = gui.elementDoc(doc, "requiredUIs", root);
    for (let req of this.reqsMaker.reqs) {
        gui.text(req.uri, gui.elementDoc(doc, req.type, reqs, ["id", req.name]));
        if (savedFiles[req.uri]) req.row.removeAttribute("error");
        else req.row.setAttribute("error", "");
    }
    let statements = gui.elementDoc(doc, "statements", root);
    let modules = {};
    for (let term of this.terms) {
        let termNode = gui.elementDoc(doc, "dunno", statements, ["id", term.id]);
        for (let child of term.children) gui.text(child.inPhrase, gui.elementDoc(doc, child.roleOf, termNode));
        if (term.module) {
            if (!(term.module.id in modules)) {
                let module = modules[term.module.id] = gui.elementDoc(doc, "module", statements);
                module.setAttribute("type", term.module.type);
                module.setAttribute("id", term.module.id);
            }
            modules[term.module.id].appendChild(termNode);
        }
    }
    clearChildren(this.fileDiv);
    this.fileDiv.appendChild((new xmlViewer(doc)).div);
}

PhraseBuilder.protoModel.postError = function postError(e) {
    clearChildren(this.errorOut);
    gui.text(e.message, this.errorOut);
    throw e;
}

PhraseBuilder.protoModel.newNameTest = function newNameTest(id) {
    return gui.nodeNameScreen(id) && !getBy(this.terms, "id", id);
}

Book.phraseProto.readPhrase = function readPhrase(node) {
    let builder = this.builder;
    for (let section of node.childNodes) {
        switch (section.nodeName) {
            case "requiredUIs":
                for (let req of section.childNodes) {
                    PhraseBuilder.newReq(builder, req.getAttribute("id"), req.firstChild.nodeValue, req.nodeName);
                }
            break; case "statements": for (let statement of section.childNodes) this.readNode(statement);
        }
    }
}

Book.phraseProto.readNode = function readNode(node, inModule) {
    let builder = this.builder;
    if (node.nodeName == "module") {
        let module = builder.newModule(node.getAttribute("id"), node.getAttribute("type"));
        for (let term of node.childNodes) this.readNode(term, module);
    } else {
        let term = builder.newTerm(node.getAttribute("id"));
        term.setType(getBy(builder.reqsMaker.reqs, "name", node.nodeName));
        for (let child of node.childNodes) term.setChild(child.nodeName, child.firstChild.nodeValue);
        if (inModule) inModule.addTerm(term);
    }
}

Book.phraseProto.compile = function compile() {
    let me = this.builder;
    clearChildren(me.viewDiv);
    this.compiled = false;
    this.div.setAttribute("compiled", "false");
    clearChildren(me.errorOut);
    delete savedDocs[this.uri];
    delete savedFiles[this.uri];
    try {
        me.saveToDoc();
        savedDocs[this.uri] = me.doc;
        let uri = this.uri;
        me.phrase = getFile(this.uri, function(graph) {return Graph.readStatement(graph, uri)});
        me.phrase.toWords(me.viewDiv);
        this.compiled = true;
        this.div.setAttribute("compiled", "true");
    } catch (e) {
        me.postError(e);
    }
    for (let req of me.reqsMaker.reqs) req.fetchURILink();
}

Book.phraseProto.onActivation = function onActivation() {
    let me = this.builder;
    for (let req of me.reqsMaker.reqs) if (!req.isUsed()) {
        let td = gui.element("td", req.row);
        gui.deleteBundle(td, function() {
            req.deleteReq();
            me.book.compile();
        });
        req.deleteDeleteBundle = function() {td.parentElement.removeChild(td); delete req.deleteDeleteBundle};
    }
    for (let term of me.terms) if (!term.isUsed()) {
        let bundle = gui.deleteBundle(term.titleDiv, function() {
            term.deleteTerm();
            me.book.compile();
        });
        term.deleteDeleteBundle = function() {bundle.deleteLaunch.parentNode.removeChild(bundle.deleteLaunch); delete term.deleteDeleteBundle};
    }
}

Book.phraseProto.unactivate = function unactivate() {
    for (let req of this.builder.reqsMaker.reqs) if (req.deleteDeleteBundle) req.deleteDeleteBundle();
    for (let term of this.builder.terms) if (term.deleteDeleteBundle) term.deleteDeleteBundle();
}

PhraseBuilder.reqProto = {};

PhraseBuilder.newReq = function newReq(dictionaryMakerOrBuilder, name, uri, type, prototype = PhraseBuilder.reqProto) {
    let returner = Object.create(prototype);
    let dictionaryMaker;
    if (dictionaryMakerOrBuilder.reqs) {
        dictionaryMaker = dictionaryMakerOrBuilder;
    } else {
        returner.builder = dictionaryMakerOrBuilder;
        dictionaryMaker = dictionaryMakerOrBuilder.reqsMaker;
    }
    dictionaryMaker.reqs.push(returner);
    returner.dictionaryMaker = dictionaryMaker;
    returner.manager = new varManager();
    returner.cleanup = [returner.manager.clearAll];
    returner.manager.setVarValue("name", name);
    returner.manager.setVarValue("uri", uri);
    returner.manager.setVarValue("type", type);
    returner.manager.linkProperty("name", returner, "name");
    returner.manager.linkProperty("uri", returner, "uri");
    returner.manager.linkProperty("type", returner, "type");
    returner.dictionaryMaker = dictionaryMaker;
    returner.book = dictionaryMaker.item.book;
    returner.unlinkItemReferenced = emptyFunction; // for fetching item to keep updated with uri changes
    returner.cleanup.push(function() {returner.unlinkItemReferenced()});
    returner.manager.linkListener("uri", function() {returner.fetchURILink()}, true);
    
    returner.row = gui.element("tr", null, ["class", "reqRow"]);
    returner.nameText = gui.linkedText(gui.element("span", gui.element("td", returner.row), ["tabindex", "0"]), returner.manager, "name");
    returner.uriText = gui.linkedText(gui.element("span", gui.element("td", returner.row)), returner.manager, "uri");
    returner.typeText = gui.linkedText(gui.element("span", gui.element("td", returner.row)), returner.manager, "type");
    gui.popupLinkedValue(returner.book.popup, returner.nameText.textNode.parentNode, returner.manager, "name", gui.nodeNameScreen, this.boundCompile);
    gui.popupLinkedValue(returner.book.popup, returner.uriText.textNode.parentNode, returner.manager, "uri", gui.savedFileScreen, this.boundCompile);
    gui.popupLinkedValue(returner.book.popup, returner.typeText.textNode.parentNode, returner.manager, "type", gui.nodeNameScreen, this.boundCompile);
    dictionaryMaker.reqsTable.insertBefore(returner.row, dictionaryMaker.inputRow);
    
    returner.deleteBundle = emptyFunction;
    
    if (returner.builder) returner.builder.newTermIn.removeAttribute("disabled");
    return returner;
}

PhraseBuilder.reqProto.isUsed = function isUsed() {
    if (this.builder) for (let term of this.builder.terms) if (term.type == this) return true;
    return false;
}

PhraseBuilder.reqProto.fetchURILink = function fetchURILink() {
    this.unlinkItemReferenced();
    let itemReferenced = getBy(this.book.items, "uri", this.uri);
    let that = this;
    if (itemReferenced) {
        this.unlinkItemReferenced = itemReferenced.manager.linkListener("uri", function(newURI) {that.manager.setVarValue("uri", newURI)});
    }
}

PhraseBuilder.reqProto.deleteReq = function deleteReq() {
    for (let f of this.cleanup) f();
    this.row.parentElement.removeChild(this.row);
    this.dictionaryMaker.reqs.splice(this.dictionaryMaker.reqs.indexOf(this), 1);
    if (this.builder) if (this.dictionaryMaker.reqs.length == 0) this.builder.newTermIn.setAttribute("disabled", "");
}

{
    let tryNewReq = function tryNewReq() {
        if (!(gui.nodeNameScreen(this.newReqName.value) && gui.savedFileScreen(this.newReqURI.value) && gui.nodeNameScreen(this.newReqType.value))) return;
        PhraseBuilder.newReq(this.builder? this.builder: this, this.newReqName.value, this.newReqURI.value, this.newReqType.value);
        this.newReqName.value = this.newReqURI.value = this.newReqType.value = "";
        this.item.book.compile();
    }
    
    PhraseBuilder.dictionaryMaker = function dictionaryMaker(item, loadHere = item.div) {
        let returner = {reqs: [], item: item};
        if (item.isPhrase) returner.builder = item.builder;
        returner.div = gui.element("div", loadHere, ["class", "reqsDiv"]);
        returner.reqsTable = gui.element("table", returner.div, ["class", "reqsTable"]);
        gui.table.titleRow(returner.reqsTable, ["Name", "URI", "Type"]);
        returner.tryNewReq = tryNewReq;
        let boundTryNewReq = function() {returner.tryNewReq()};
        returner.newReqName = gui.screenedInput(null, "name", boundTryNewReq, gui.nodeNameScreen, "invalid", 1000, false);
        returner.newReqURI = gui.screenedInput(null, "uri", boundTryNewReq, gui.savedFileScreen, "cannot find file", 1000, false);
        returner.newReqType = gui.screenedInput(null, "type", boundTryNewReq, gui.nodeNameScreen, "invalid", 1000, false);
        returner.inputRow = gui.table.row(returner.reqsTable, [returner.newReqName, returner.newReqURI, returner.newReqType]);
        return returner;
    }
}

PhraseBuilder.termProto = {};

PhraseBuilder.protoModel.newTerm = function newTerm(id) {
    let returner = Object.create(PhraseBuilder.termProto);
    returner.builder = this;
    returner.book = this.book;
    returner.manager = new varManager();
    returner.manager.setVarValue("id", id);
    returner.manager.linkProperty("id", returner, "id");
    returner.typeChangeCleanup = [];
    
    returner.div = gui.element("div", null, ["class", "termDiv"]);
    this.termsDiv.insertBefore(returner.div, this.newTermIn);
    returner.body = gui.element("span", returner.div, ["class", "term"]);
    
    returner.titleDiv = gui.element("div", returner.body, ["class", "termTitleDiv"]);
    returner.typeSpot = gui.element("span", returner.titleDiv, ["class", "termTypeSpot", "tabindex", "0"]);
    returner.typeText = gui.text("Type", returner.typeSpot);
    returner.typeSpot.addEventListener("click", function() {
        let select = gui.select(null, "Term type");
        let reqs = returner.builder.reqsMaker.reqs;
        for (let i = 0; i < reqs.length; ++i) {
            let graph = savedFiles[reqs[i].uri];
            let foundAll = true;
            for (let max in graph.subMaximalElements()) {
                let foundMax = false;
                for (let term of returner.builder.terms) if (term == returner) break; else if (graph.vertices[max].definition == savedFiles[term.type.uri].asDefinition) foundMax = true;
                foundAll = foundAll && foundMax;
            }
            if (!foundAll) continue;
            gui.option(reqs[i].name, select, [], i);
            if (returner.type == reqs[i]) select.selectedIndex = i+1;
        }
        select.addEventListener("change", function() {
            returner.setType(reqs[select.value]);
            returner.book.compile();
        });
        select.addEventListener("keypress", returner.book.keyEnterClosePopup);
        returner.book.popup.openPopup(select, returner.typeSpot);
    });
    returner.idText = gui.linkedText(gui.element("span", returner.titleDiv, ["tabindex", "0"]), returner.manager, "id");
    gui.popupLinkedValue(returner.book.popup, returner.idText.textNode.parentNode, returner.manager, "id", this.boundTermNameTest, this.boundCompile);
    
    returner.children = [];
    returner.childrenDiv = gui.element("table", returner.body, ["class", "childrenDiv"]);
    returner.setType(this.reqsMaker.reqs[0]);
    
    let label = gui.element("label", returner.body);
    gui.text("assumption level: ", label);
    
    this.terms.push(returner);
    return returner;
}

PhraseBuilder.termProto.setType = function setType(req) {
    
}

PhraseBuilder.termProto.isUsed = function isUsed() {
    for (let term of this.builder.terms) if (getBy(term.children, "inPhrase", this.id)) return true;
    return false;
}

PhraseBuilder.termProto.deleteTerm = function deleteTerm() {
    for (let f of this.typeChangeCleanup) f();
    this.manager.clearAll();
    this.builder.terms.splice(this.builder.terms.indexOf(this), 1);
    this.div.parentNode.removeChild(this.div);
}

PhraseBuilder.termProto.makeChild = function makeChild(roleOf, type) {
    let child = Object.create(PhraseBuilder.termChildProto);
    child.term = this;
    child.roleOf = roleOf;
    child.type = type;
    this.children.push(child);
    
    child.row = gui.element("tr", this.childrenDiv, ["class", "child"]);
    child.roleOfText = gui.text(roleOf, gui.element("td", child.row));
    child.inPhraseSpan = gui.element("span", gui.element("td", child.row), ["tabindex", "0"]);
    child.inPhraseText = gui.text("", child.inPhraseSpan);
    
    let book = this.book, builder = this.builder, term = this;
    child.inPhraseSpan.addEventListener("click", function() {
        let select = gui.element("select");
        for (let otherTerm of builder.terms) {
            if (otherTerm == term) break;
            if (otherTerm.type == type) {
                gui.option(otherTerm.id, select);
                if (otherTerm.id == child.inPhrase) select.selectedIndex = select.childElementCount - 1;
            }
        }
        select.focus();
        select.addEventListener("change", function() {
            term.setChild(roleOf, select.value);
            book.compile();
        });
        select.addEventListener("keypress", child.term.builder.book.keyEnterClosePopup);
        book.popup.openPopup(select, child.inPhraseSpan);
    });
}

PhraseBuilder.termChildProto = {};

PhraseBuilder.termProto.setChild = function setChild(roleOf, inPhrase) {
    let child = getBy(this.children, "roleOf", roleOf);
    //child.inPhraseText.nodeValue = child.inPhrase = inPhrase;
}

PhraseBuilder.termChildProto.deleteChild = function deleteChild() {
    this.row.parentNode.removeChild(this.row);
}

PhraseBuilder.moduleProto = {};

PhraseBuilder.protoModel.newModule = function newModule(id, type) {
    let returner = this.modules[id] = Object.create(PhraseBuilder.moduleProto);
    returner.builder = this;
    returner.book = this.book;
    returner.manager = new varManager();
    returner.manager.setVarValue("id", id);
    returner.manager.linkListener("id", function(newId) {
        delete returner.builder.modules[returner.id];
        returner.builder.modules[newId] = returner;
    });
    returner.manager.linkProperty("id", returner, "id");
    returner.manager.setVarValue("type", type);
    returner.manager.linkProperty("type", returner, "type");
    
    returner.div = gui.element("details", null, ["class", "module"]);
    this.termsDiv.insertBefore(returner.div, this.newTermIn);
    
    returner.titleDiv = gui.element("summary", returner.div, ["class", "moduleTitle"]);
    returner.nameText = gui.linkedText(gui.element("span", returner.titleDiv, ["tabindex", "0"]), returner.manager, "id");
    gui.popupLinkedValue(returner.book.popup, returner.nameText.textNode.parentNode, returner.manager, "id", gui.nodeNameScreen, this.boundCompile);
    returner.meta = {div: gui.element("span", returner.div, ["class", "floatRight"])};
    returner.typeSelect = gui.element("select", returner.meta.div);
    returner.typeSelect.addEventListener("change", function() {
        returner.manager.setVarValue("type", returner.typeSelect.value);
        returner.book.compile();
    });
    for (let moduleType in Graph.moduleReaders) gui.option(moduleType, returner.typeSelect);
    returner.manager.linkListener("type", function(newType) {
        for (let i = 0; i < returner.typeSelect.childNodes.length; ++i) if (returner.typeSelect.childNodes[i].firstChild.nodeValue == newType) returner.typeSelect.selectedIndex = i;}, true);
    returner.newTermIn = gui.screenedInput(returner.div, "new term name", function(name) {
        returner.addTerm(returner.builder.newTerm(name));
        returner.book.compile();
    }, returner.builder.boundTermNameTest);
    
    return returner;
}

PhraseBuilder.moduleProto.addTerm = function addTerm(term) {
    this.div.insertBefore(term.div, this.newTermIn);
    term.module = this;
}
*/
