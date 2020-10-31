loadCSS("css/Book.css");

var Book = {protoModel: {}, knownPhraseTypes: ["definition", "lemma", "definingProperty", "dictionary"], recognizedSettableAssLevels: ["assumed", "freebie", "definingProperty", "tfae"]};

{
    let phraseTypes = gui.element("datalist", document.head);
    phraseTypes.setAttribute("id", "BookKnownPhraseTypes");
    for (let type of Book.knownPhraseTypes) {
        let o = gui.element("option", phraseTypes);
        o.setAttribute("value", type);
    };
}

Book.newBook = function newBook(uri = document.baseURI, title = "book", loadHere = document.body, protoModel = Book.protoModel) {
    let returner = Object.create(protoModel);
    returner.items = [];
    returner.manager = new varManager();
    returner.manager.setVarValue("uri", uri);
    returner.manager.linkProperty("uri", returner, "baseURI");
    returner.manager.setVarValue("title", title);
    returner.manager.linkProperty("title", returner, "title");
    returner.div = gui.element("div", loadHere, ["class", "book"]);
    
    returner.popup = gui.popup(returner.div);
    returner.keyEnterClosePopup = function(e) {
        if (e.key == "Enter" || e.code == "Enter" || e.keyCode == 13) {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            returner.popup.closePopup();
        }
    }
    returner.collapseButton = gui.button("collapse all", returner.div, function() {returner.collapseAll()});
    
    returner.orphanDivs = gui.element("div", returner.div);
    returner.newPhraseInput = gui.screenedInput(returner.div, "new phrase name", function(name) {
        returner.newPhrase(name);
        returner.compile;
    });
    returner.newSectionInput = gui.screenedInput(returner.div, "new section name", function(name) {
        returner.newSection(name);
        returner.compile;
    });
    let saveButton = gui.button("save", returner.div, function() {
        returner.compile();
        localStorage.setItem("savedBook", xmlImporter.nodeToString(returner.saveToXML(), "", "", ""));
        gui.inputOutput.button(saveButton, "successfully saved", 1000);
    });
    
    // itemDiv moves to whichever item is active
    returner.itemDiv = document.createElement("div");
    returner.moveToSectionButton = gui.button("move item", returner.itemDiv, function() {returner.onMoveButton()}, ["disabled", ""]);
    returner.moveToButtonClick = function(e) {
        let button = e.target;
        returner.activeItem.moveToSection(returner.items[button.getAttribute("itemIndex")], button.getAttribute("intoIndex"));
        returner.moveToSectionButton.dispatchEvent(new Event("click"));
        returner.compile();
    }
    returner.isMovingItem = false;
    returner.itemDeleteBundle = gui.deleteBundle(returner.itemDiv, function() {
        returner.activeItem.deleteItem();
        returner.sortItems();
    });
    returner.uriListPhrase = gui.element("datalist", returner.div);
    returner.assLevels = gui.element("datalist", returner.div);
    returner.manager.linkListener("title", function(title) {
        returner.uriListPhrase.setAttribute("id", title + "URIListPhrase");
        returner.assLevels.setAttribute("id", title + "AssLevels");
    }, true);
    for (let assLevel of Book.recognizedSettableAssLevels) gui.option(assLevel, returner.assLevels);
    
    return returner;
}

Book.itemProto = {};

Book.protoModel.newItem = function newItem(title, protoModel = Book.itemProto) {
    let returner = Object.create(protoModel);
    returner.book = this;
    let index = this.items.length;
    this.items[index] = returner;
    returner.manager = new varManager();
    returner.cleanup = [returner.manager.clearAll];
    returner.manager.setVarValue("itemIndex", index);
    returner.manager.linkProperty("itemIndex", returner, "itemIndex");
    returner.manager.setVarValue("title", title);
    returner.manager.linkProperty("title", returner, "title");
    returner.manager.setVarValue("uri", returner.getURI());
    returner.manager.linkProperty("uri", returner, "uri");
    returner.manager.linkListener("title", function() {returner.manager.setVarValue("uri", returner.getURI())});
    returner.div = gui.element("details", this.orphanDivs, ["open", "", "class", "bookItem"]);
    returner.cleanup.push(function() {returner.div.parentNode.removeChild(returner.div)});
    returner.titleDiv = gui.element("summary", returner.div);
    returner.hoverButton = gui.hoverButton(title, returner.titleDiv, function(e) {
        e.preventDefault();
        let label = gui.element("label", null);
        gui.text("Title:", label);
        let input = gui.screenedInput(label, returner.title, function(value) {
            returner.manager.setVarValue("title", value);
            returner.book.compile();
        });
        returner.book.popup.openPopup(label, returner.hoverButton.button);
        input.focus();
        input.select();
    });
    returner.manager.linkProperty("title", returner.hoverButton.text, "nodeValue");
    returner.titleURI = gui.element("input", returner.titleDiv, ["class", "infoInSummary", "tabindex", "-1", "title", "click uri to copy"]);
    returner.titleURI.addEventListener("click", gui.copyToClipboard);
    returner.manager.linkProperty("uri", returner.titleURI, "value");
    
    returner.div.addEventListener("mouseover", function(e) {
        e.stopPropagation();
        if (returner.book.activeItem == returner) return;
        returner.book.activateItem(returner);
    });
    
    returner.uriListPhraseOption = gui.linkedOption(null, returner.manager, "uri");
    
    return returner;
}

Book.itemProto.setTitle = function setTitle(newTitle) {this.manager.setVarValue("title", newTitle)}
Book.itemProto.collapse = function collapse() {this.div.removeAttribute("open")}
Book.itemProto.getURI = function getURI() {return (this.parent? this.parent.getURI():this.book.baseURI) + "/" + this.title}

Book.itemProto.moveToSection = function moveToSection(section, intoIndex) {
    if (this.parent == section && intoIndex > this.sectionIndex) --intoIndex;
    if (this.parent) this.parent.removeItem(this);
    if (section) section.addItem(this, intoIndex);
    if (!this.parent && !section) this.book.orphanItem(this);
}

Book.itemProto.saveToXML = function saveToXML(doc) {
    let node = gui.elementDoc(doc, "item", null, ["title", this.title]);
    if (this.contentsToXML) gui.elementDoc(doc, "contents", node).appendChild(this.contentsToXML(doc));
    if (this.parent) node.setAttribute("parent", this.parent.itemIndex);
    return node;
}

Book.itemProto.copy = function copy() {
    let doc = document.implementation.createDocument("", "doc");
    let node = this.saveToXML(doc);
    node.setAttribute("title", node.getAttribute("title") + "Copy");
    this.book.readItemNode(node);
}

Book.itemProto.deleteItem = function deleteItem() {
    for (let f of this.cleanup) f();
    if (this.parent) this.parent.removeItem(this);
    if (this.div.parentNode) this.div.parentNode.removeChild(this.div);
    let book = this.book;
    book.items.splice(this.itemIndex, 1);
    for (let i = this.itemIndex; i < book.items.length; ++i) book.items[i].manager.setVarValue("itemIndex", i);
    delete savedDocs[this.uri];
    delete savedFiles[this.uri];
    this.book.compile();
}

Book.sectionProto = Object.create(Book.itemProto);

Book.protoModel.newSection = function newSection(title) {
    let returner = this.newItem(title, Book.sectionProto);
    returner.isSection = true;
    returner.div.setAttribute("class", "bookSection");
    let childrenDiv = returner.childrenDiv = gui.element("div", returner.div, ["childrenDiv", ""]);
    returner.children = [];
    returner.sectionOption = gui.linkedOption(null, returner.manager, "uri", "itemIndex");
    return returner;
}

Book.sectionProto.addItem = function addItem(item, intoIndex) {
    let before = this.children[intoIndex];
    if (intoIndex) {
        for (let i = this.children.length-1; i >= intoIndex; --i) {
            this.children[i+1] = this.children[i];
            this.children[i].sectionIndex = i+1;
        }
    } else intoIndex = this.children.length;
    this.children[intoIndex] = item;
    if (before) {
        this.childrenDiv.insertBefore(item.div, before.div);
    } else {
        this.childrenDiv.appendChild(item.div);
    }
    item.parent = this;
    item.sectionIndex = intoIndex;
}

Book.sectionProto.removeItem = function removeItem(item) {
    if (item.parent != this) throw Error(item.title + " is not a child of me, " + this.title);
    this.children.splice(item.sectionIndex, 1);
    for (let i = item.sectionIndex; i < this.children.length; ++i) this.children[i].sectionIndex = i;
    item.parent = undefined;
    item.sectionIndex = undefined;
    this.book.orphanDivs.appendChild(item.div);
}

Book.sectionProto.moveToButtons = function moveToButtons() {
    let returner = [];
    for (let child of this.children) {
        let button = gui.button("move here", null, this.book.moveToButtonClick, ["itemIndex", this.itemIndex, "intoIndex", child.sectionIndex]);
        this.childrenDiv.insertBefore(button, child.div);
        returner.push(button);
    }
    returner.push(gui.button("move here", this.childrenDiv, this.book.moveToButtonClick, ["itemIndex", this.itemIndex, "intoIndex", this.children.length]));
    return returner;
}

Book.sectionProto.saveToXML = function saveToXML(doc) {
    let node = Book.itemProto.saveToXML.call(this, doc);
    node.setAttribute("itemType", "section");
    return node;
}

Book.sectionProto.deleteItem = function deleteItem() {
    if (this.parent) {
        let pos = this.sectionIndex + 1;
        while (this.children.length > 0) {
            let child = this.children[0];
            this.removeItem(child);
            this.parent.addItem(child, pos++);
        }
    } else while (this.children.length > 0) {
        this.removeItem(this.children[0]);
    }
    if (this.sectionOption.parentNode) this.sectionOption.parentNode.removeChild(this.sectionOption);
    Book.itemProto.deleteItem.call(this);
}

Book.phraseProto = Object.create(Book.itemProto);

Book.protoModel.newPhrase = function newPhrase(title) {
    let returner = this.newItem(title, Book.phraseProto);
    returner.isPhrase = true;
    returner.builder = PhraseBuilder.newBuilder(returner);
    return returner;
}

Book.phraseProto.saveToXML = function saveToXML(doc) {
    let node = Book.itemProto.saveToXML.call(this, doc);
    node.setAttribute("itemType", "phrase");
    let contents = gui.elementDoc(doc, "contents", node);
    this.builder.saveToDoc();
    contents.appendChild(xmlImporter.copyNode(this.builder.doc.firstChild, doc));
    return node;
}

Book.protoModel.activateItem = function activateItem(item) {
    if (this.isMovingItem) return;
    if (this.activeItem) if (this.activeItem.unactivate) this.activeItem.unactivate();
    this.activeItem = item;
    this.itemDeleteBundle.resetBundle();
    item.div.appendChild(this.itemDiv);
    this.moveToSectionButton.removeAttribute("disabled");
    let text = this.moveToSectionButton.firstChild;
    if (item.div.hasAttribute("moving")) text.nodeValue = "cancel move";
    else text.nodeValue = "move " + (item.isPhrase?"phrase":item.isSection?"section":"item");
    if (item.onActivation) item.onActivation();
}

Book.protoModel.onMoveButton = function onMoveButton() {
    let item = this.activeItem;
    if (!item) throw Error("no item is selected");
    if (this.isMovingItem) {
        this.moveToSectionButton.firstChild.nodeValue = "move " + (item.isPhrase?"phrase":item.isSection?"section":"item");
        item.div.removeAttribute("moving");
        for (let button of this.moveToButtons) button.parentNode.removeChild(button);
    } else {
        this.moveToSectionButton.firstChild.nodeValue = "cancel move";
        item.div.setAttribute("moving", "");
        this.moveToButtons = [];
        for (let i of this.items) if (i.isSection) if (!inParentChain(i, item)) this.moveToButtons = this.moveToButtons.concat(i.moveToButtons());
    }
    this.isMovingItem = !this.isMovingItem;
}

Book.protoModel.collapseAll = function collapseAll() {
    for (let item of this.items) item.collapse();
}

Book.protoModel.orphanItem = function orphanItem(item) {
    if (item.parent) {
        item.moveToSection();
        return;
    }
    let last = this.items.length - 1;
    for (let i = item.itemIndex; i < last; ++i) {
        this.items[i] = this.items[i+1];
        this.items[i].manager.setVarValue("itemIndex", i);
    }
    this.items[last] = item;
    item.manager.setVarValue("itemIndex", last);
    item.div.parentNode.removeChild(item.div);
    this.orphanDivs.appendChild(item.div);
}

Book.protoModel.saveToXML = function saveToXML() {
    let doc = document.implementation.createDocument(null, this.title);
    let root = doc.firstChild;
    let items = doc.createElement("items");
    for (let i = 0; i < this.items.length; ++i) items.appendChild(this.items[i].saveToXML(doc));
    root.appendChild(items);
    return doc;
}

Book.protoModel.compile = function compile() {
    this.sortItems();
    for (item of this.items) {
        if (item.uri != item.getURI()) throw Error("uris dont match up " + item.uri + " and " + item.getURI());
        if (item.compile) item.compile();
    }
    if (this.activeItem) this.activateItem(this.activeItem);
}

Book.protoModel.toURI = function getURI() {return this.uri}

Book.protoModel.readItemNode = function readItemNode(node) {
    let title = node.getAttribute("title"), item;
    switch (node.getAttribute("itemType")) {
        case "phrase":
            item = this.newPhrase(title);
            let contents;
            for (let i = 0; i < node.childNodes.length; ++i) if (node.childNodes[i].nodeName == "contents") contents = node.childNodes[i];
            contents = contents.firstChild;
            item.readPhrase(contents);
        break; case "section": item = this.newSection(title);
        break; default: throw Error("do not recognize book item of type " + node.getAttribute("itemType"));
    }
    if (node.hasAttribute("parent")) item.moveToSection(this.items[node.getAttribute("parent")]);
    item.manager.setVarValue("uri", item.getURI());
    if (item.compile) item.compile();
}

{
    let genCount = function genCount(item) {
        if (item.parent) return genCount(item.parent) + 1;
        else return 0;
    }
    
    let lca = function lca(i1, i2) {
        if (!(i1.parent && i2.parent)) return;
        let g1 = genCount(i1), g2 = genCount(i2);
        let p1 = i1, p2 = i2;
        while (g1 < g2) {
            --g2;
            p2 = p2.parent;
        }
        while (g2 < g1) {
            --g1;
            p1 = p1.parent;
        }
        while (p1 != p2) {
            p1 = p1.parent;
            p2 = p2.parent;
        }
        return p1;
    }
    
    let adam = function eve(item) {
        if (item.parent) return adam(item.parent);
        return item;
    }
    
    let sort = function sort(i1, i2) {
        if (i1 == i2) return 0;
        if (inParentChain(i1, i2)) return 1;
        if (inParentChain(i2, i1)) return -1;
        if (i1.parent) {
            if (i2.parent) {
                let ancestor = lca(i1, i2);
                if (ancestor) {
                    while (i1.parent != ancestor) i1 = i1.parent;
                    while (i2.parent != ancestor) i2 = i2.parent;
                    return i1.sectionIndex - i2.sectionIndex;
                } else {
                    return adam(i1).itemIndex - adam(i2).itemIndex;
                }
            } else {
                return -1;
            }
        } else if (i2.parent) {
            return 1;
        } else return i1.itemIndex - i2.itemIndex;
    }
    
    Book.protoModel.sortItems = function sortItems() {
        this.items.sort(sort);
        clearChildren(this.uriListPhrase);
        let item;
        for (let i = 0; i < this.items.length; ++i) {
            item = this.items[i];
            item.manager.setVarValue("itemIndex", i);
            item.manager.setVarValue("uri", item.getURI());
            this.uriListPhrase.appendChild(item.uriListPhraseOption.option);
        }
    }
} // sort

Book.loadFromStorage = function loadFromStorage(storage, uri) {
    return Book.load(storage.getItem(uri));
}

Book.load = function load(text, title = "book") {
    let doc = new DOMParser().parseFromString(text, "text/xml");
    let root = doc.firstChild;
    let book = Book.newBook(title);
    for (let i = 0; i < root.childNodes.length; ++i) {
        let section = root.childNodes[i];
        switch (section.nodeName) {
            case "items": for (let j = 0; j < section.childNodes.length; ++j) book.readItemNode(section.childNodes[j]);
            break;
        }
    }
    book.collapseAll();
    book.compile();
    return book;
}

Book.loadFromURL = function loadFromURL(url, pass, finished = emptyFunction) {
    let req = new XMLHttpRequest();
    req.onload = function(result) {finished(pass, Book.load(result.target.responseText))};
    req.onfail = function() {alert("failed loading book from " + url)};
    req.open("GET", url);
    req.send();
}