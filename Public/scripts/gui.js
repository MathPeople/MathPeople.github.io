loadCSS("css/gui.css");

var gui = {constantTrueFunction: function() {return true}};

gui.elementDoc = function elementDoc(doc, type, loadHere, atts = []) {
    let returner = doc.createElement(type);
    if (loadHere) loadHere.appendChild(returner);
    for (let i = 0; i < atts.length; i += 2) returner.setAttribute(atts[i], atts[i+1]);
    return returner;
}

gui.element = function element(type, loadHere, atts) {return gui.elementDoc(document, type, loadHere, atts)}

gui.text = function text(line, loadHere) {
    let returner = document.createTextNode(line);
    if (loadHere) loadHere.appendChild(returner);
    return returner;
}

gui.inputOutput = {};

gui.inputOutput.textNode = function textNode(textNode, message, time) {
    let text = textNode.nodeValue;
    textNode.nodeValue = message;
    window.setTimeout(function() {if (textNode.nodeValue == message) textNode.nodeValue = text}, time);
}

gui.inputOutput.inputText = function inputText(input, message, time = 1000) {
    let text = input.value, wasAble = !input.hasAttribute("disabled");
    input.value = message;
    input.setAttribute("disabled", "");
    window.setTimeout(function() {
        if (input.value == message) input.value = text;
        if (wasAble) input.removeAttribute("disabled");
    }, time);
}

gui.inputOutput.button = function button(button, message, time) {
    let textNode = button.firstChild, text = textNode.nodeValue, wasAble = !button.hasAttribute("disabled");
    textNode.nodeValue = message;
    button.setAttribute("disabled", "");
    window.setTimeout(function() {
        if (textNode.nodeValue == message) textNode.nodeValue = text;
        if (wasAble) button.removeAttribute("disabled");
    }, time);
}

gui.nodeNameScreen = function nodeNameScreen(line) {
    try {
        document.createElement(line);
        return true;
    } catch (e) {
        return false;
    }
}

gui.dataListScreen = function dataListScreen(dataList) {
    return function(line) {
        for (let i = 0; i < dataList.childNodes.length; ++i) {
            let o = dataList.childNodes[i];
            if (o.getAttribute("value") == line) return !o.hasAttribute("disabled");
        }
        return false;
    }
}

gui.savedFileScreen = function savedFileScreen(location) {
    return (location in savedDocs) || (location in savedFiles);
}

gui.screenedInput = function screenedInput(loadHere, placeholder = "", onchange = emptyFunction, screen = gui.nodeNameScreen, failMessage = "invalid", messageTime = 1000, clearOnSuccess = true) {
    let returner = gui.element("input", loadHere, ["type", "text", "placeholder", placeholder]);
    returner.addEventListener("change", function() {
        let line = returner.value;
        if (screen(line)) {
            if (clearOnSuccess) returner.value = "";
            onchange(line);
        } else gui.inputOutput.inputText(returner, failMessage, messageTime)
    });
    return returner;
}

gui.linkedScreenedInput = function linkedScreenedInput(loadHere, manager, property, screen, onchange) {
    return gui.screenedInput(loadHere, manager.vars[property].value, function(value) {
        manager.setVarValue(property, value);
        if (onchange) onchange(value);
    }, screen);
}

gui.button = function button(text, loadHere, onclick, atts) {
    let returner = gui.element("button", loadHere, atts);
    gui.text(text, returner);
    if (onclick) returner.addEventListener("click", onclick);
    return returner;
}

gui.option = function option(text, loadHere, atts, value = text) {
    let returner = gui.element("option", loadHere, atts);
    gui.text(text, returner);
    returner.setAttribute("value", value);
    return returner;
}

gui.select = function select(loadHere, disabledDescriptionOptionTexts) {
    if (typeof disabledDescriptionOptionTexts == "string") disabledDescriptionOptionTexts = [disabledDescriptionOptionTexts];
    let returner = gui.element("select", loadHere);
    for (let line of disabledDescriptionOptionTexts) gui.option(line, returner, ["disabled", "true"], -1);
    return returner;
}

{
    let animationend = function(e) {
        let trigger = e.target, button = trigger.previousSibling;
        if (trigger.hasAttribute("opening")) {
            trigger.removeAttribute("opening");
            trigger.setAttribute("open", "");
            button.removeAttribute("disabled");
            button.setAttribute("flashing", "");
        } else if (trigger.hasAttribute("closing")) {
            trigger.removeAttribute("closing");
            trigger.setAttribute("closed", "");
        }
    }
    let clickTrigger = function(e) {
        let trigger = e.target, button = trigger.previousSibling;
        if (trigger.hasAttribute("open")) {
            trigger.removeAttribute("open");
            trigger.setAttribute("closing", "");
            button.setAttribute("disabled", "");
            button.removeAttribute("flashing");
        } else {
            trigger.removeAttribute("closed");
            trigger.setAttribute("opening", "");
        }
    }
    
    // these are called on a bundle
    let resetBundle = function resetBundle() {
        this.deleteButton.setAttribute("disabled", "");
        this.deleteButton.removeAttribute("flashing");
        for (att of ["open", "closing", "opening"]) this.deleteTrigger.removeAttribute(att);
        this.deleteTrigger.setAttribute("closed", "");
    }
    function hideDelete() {
        this.deleteLaunch.setAttribute("hide", "");
        this.resetBundle();
    }
    function showDelete() {
        this.resetBundle();
        this.deleteLaunch.removeAttribute("hide");
    }
    
    gui.deleteBundle = function deleteBundle(loadHere, buttonClick) {
        let returner = {};
        let deleteLaunch = returner.deleteLaunch = gui.element("div", loadHere, ["class", "missileLaunch"]);
        let deleteButton = returner.deleteButton = gui.button("delete", deleteLaunch, buttonClick, ["class", "missileLaunchButton", "disabled", ""]);
        let deleteTrigger = returner.deleteTrigger = gui.element("div", deleteLaunch, ["class", "trigger"]);
        deleteTrigger.addEventListener("animationend", animationend);
        deleteTrigger.addEventListener("click", clickTrigger);
        returner.resetBundle = resetBundle;
        returner.hideDelete = hideDelete;
        returner.showDelete = showDelete;
        return returner;
    }
}

gui.linkedOption = function linkedOption(loadHere, manager, textProp, valueProp, atts) {
    let returner = {option: gui.element("option", loadHere, atts)};
    let cleanup = [];
    let text = gui.text("", returner.option);
    cleanup.push(manager.linkProperty(textProp, text, "nodeValue"));
    if (typeof valueProp != "undefined") cleanup.push(manager.linkListener(valueProp, function(value) {
        returner.option.setAttribute("value", value);
    }, true));
    returner.deleteMe = function deleteMe() {
        for (let f of cleanup) f();
        if (returner.option.parentNode) returner.option.parentNode.removeChild(returner.option);
    }
    return returner;
}

gui.linkedText = function linkedText(loadHere, manager, property) {
    let returner = {textNode: gui.text("", loadHere)};
    returner.cleanup = [manager.linkProperty(property, returner.textNode, "nodeValue")];
    return returner;
}

gui.summary = function summary(text, loadHere, atts) {
    let returner = gui.element("summary", loadHere, atts);
    gui.text(text, returner);
    return returner;
}

gui.hoverButton = function hoverButton(text, loadHere, onclick, spanAtts) {
    let returner = {};
    returner.button = gui.element("button", loadHere, ["class", "hoverHide"]);
    returner.button.addEventListener("click", onclick);
    returner.span = gui.element("span", returner.button, spanAtts);
    returner.text = gui.text(text, returner.span);
    return returner;
}

gui.highlight = function highlight(node) {
    let highlight = gui.element("div", null, ["class", "highlight"]);
    node.parentNode.replaceChild(highlight, node);
    highlight.appendChild(node);
    return function closeHighlight() {xmlImporter.collapseNode(highlight)};
}

{
    // on popup
    let openPopup = function openPopup(inPopup, highlight) {
        this.closePopup();
        this.div.appendChild(inPopup);
        this.main.removeAttribute("hide");
        if (highlight) this.closeHighlight = gui.highlight(highlight);
        if (inPopup.focus) inPopup.focus();
    }
    let closePopup = function closePopup() {
        clearChildren(this.div);
        this.main.setAttribute("hide", "");
        this.closeHighlight();
        this.closeHighlight = emptyFunction;
    }
    gui.popup = function popup(loadHere, atts = []) {
        let returner = {};
        returner.main = gui.element("div", loadHere, ["class", "popup", "hide", ""]);
        returner.div = gui.element("div", returner.main, atts);
        returner.closeButton = gui.button("close", returner.main, function() {returner.closePopup()}, ["class", "closeButton"]);
        returner.openPopup = openPopup;
        returner.closePopup = closePopup;
        returner.closeHighlight = emptyFunction;
        return returner;
    }
}

gui.table = {};

gui.table.titleRow = function titleRow(table, lines) {
    let row = gui.element("tr", table);
    for (let line of lines) gui.text(line, gui.element("th", row));
    return row;
}

gui.table.textRow =  function textRow(table, lines) {
    let row = gui.element("tr", table);
    for (let line of lines) gui.text(line, gui.element("td", row));
    return row;
}

gui.table.row =  function row(table, nodes) {
    let row = gui.element("tr", table);
    for (let node of nodes) gui.element("td", row).appendChild(node);
    return row;
}

gui.copyToClipboard = function copyToClipboard(e) {
    e.preventDefault();
    let input = e.target, wasInDesignMode = input.contentEditable;
    input.contentEditable = true;
    input.select();
    document.execCommand("copy");
    input.blur();
    gui.inputOutput.inputText(input, "copied", 500);
    input.contentEditable = wasInDesignMode;
}

gui.popupLinkedValue = function popupLinkedValue(popup, triggerNode, manager, property, screen, onchange) {
    triggerNode.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        popup.openPopup(gui.linkedScreenedInput(null, manager, property, screen, function(value) {
            popup.closePopup();
            if (onchange) onchange(value);
        }), triggerNode)
    });
}