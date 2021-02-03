/*
    First read the wiki for using this editor, in particular the parts about how problem focus works. The active problem is the problem with current focus and is the only one which can be changed through interaction with the GUI. The editor works by letting the user focus on a problem and interact with the GUI to make changes to it. The problem exists as an XML DOM. Any change directed to the problem first changes that problem's DOM and then repopulates the document HTML DOM with information from the problem XML DOM. Saving consists of saving these problem XML DOMs.
*/

// editor DOM elements
let qualNameIn = document.getElementById("qualName"),
    loadedProblems = document.getElementById("loadedProblems"),
    clearTexButton = document.getElementById("clearTex"),
    pairSoloButton = document.getElementById("pairSolo"),
    putMetasHere = document.getElementById("putMetasHere"),
    idInput = document.getElementById("problemID"),
    idList = document.getElementById("idList"),
    newMetaTypeIn = document.getElementById("newMetatype"),
    newMetatypeType = document.getElementById("newMetatypeType"),
    defaultIn = document.getElementById("defaultOption"),
    renameMetainformation = document.getElementById("renameMetainformation"),
    renameSoftMetainformation = document.getElementById("renameSoftMetainformation"),
    texProblem = document.getElementById("texProblem"),
    texSolution = document.getElementById("texSolution"),
    texLiveOut = document.getElementById("texLiveOut"),
    saveButton = document.getElementById("save"),
    codeOut = document.getElementById("codeOut"),
    saveAllButton = document.getElementById("saveAll"),
    errorOutP = document.getElementById("errorOut");
// script global variables
let pairMode = true, qual = "", problemsTags = {}, editorMetas = {};

// jax configuration
jaxLoopWait = 100;

// these define the active problem
let doc = xmlImporter.newDocument(), id = "changeMe";

// set event listeners. Read the comments for the event handlers if you want to see what they do, this section just links event handlers to the GUI elements
{
    // fireblock in case something has an error
    function setListener(element, type, func) {try {element.addEventListener(type, func)} catch (e) {}}
    
    qualNameIn.value = ""; // reset in case the value is cached by the browser
    setListener(qualNameIn, "change", loadQual);
    
    setListener(loadedProblems, "change", function() {
        idInput.value = loadedProblems.value;
        handleIdChange();
    });
    
    setListener(clearTexButton, "click", clearTex);
    
    setListener(pairSoloButton, "click", function() {
        pairSoloButton.firstChild.nodeValue = "To " + (pairMode? "Pair": "Solo") + " mode";
        pairMode = !pairMode;
        if (pairMode) for (let hideMe of document.querySelectorAll("[pairOnly]")) hideMe.removeAttribute("hide");
        else for (let hideMe of document.querySelectorAll("[pairOnly]")) hideMe.setAttribute("hide", "");
        resetDoc();
    })
    
    setListener(idInput, "change", handleIdChange);
    setListener(idInput, "blur", function() {idInput.value = id});
    
    setListener(newMetaTypeIn, "change", tryNewMetatypeIn);
    newMetaTypeIn.value = "First choose metainformation type -->";
    newMetaTypeIn.setAttribute("disabled", "");
    
    setListener(newMetatypeType, "change", newMetatypeTypeChange);
    
    newMetatypeType.selectedIndex = 0;
    
    renameMetainformation.value = ""; // reset in case the value is cached by the browser
    setListener(renameMetainformation, "change", hardRename);
    
    renameSoftMetainformation.value = ""; // reset in case the value is cached by the browser
    setListener(renameSoftMetainformation, "change", softRename);
    
    for (let e of [texProblem, texSolution]) setListener(e, "input", resetDoc);

    for (let textarea of document.getElementsByTagName("textarea")) {
        setListener(textarea, "input", fixTextHeight);
        setListener(textarea, "change", fixTextHeight);
    }
    
    setListener(saveButton, "click", saveActiveProblem);
    
    setListener(saveAllButton, "click", saveAll);
}

// for auto-resizing textareas
function fixTextHeight(event) {
    event = event.target;
    while (event.nodeName.toLowerCase() != "textarea") event = event.parentNode;
    event.style.height = "auto";
    event.style.height = (event.scrollHeight)+"px";
}

// load all problems from a qual repository
function importRemoteQuestions(nameOfQual, finished = function() {}) {
    holdJax = true;
    xmlImporter.openTextFile("../quals/"+nameOfQual+"/problemsList.txt", null, function(list) {
        list = list.trim();
        if (list === "") {
            clearTex();
            return finished();
        }
        let lines = list.split(" "), numLines = lines.length;
        for (let problem of lines) if (problem !== "" && problem != "changeMe") {
            let p = problem;
            if (problem in problems) {
                if (qual == "local") {
                    if (--numLines === 0) {
                        finished();
                    }
                    continue;
                } else errorOut("duplicate in problems list: " + problem);
            }
            problems[problem] = undefined;
            problemsTags[problem] = {
                idList: xmlImporter.element("option", idList, ["value", problem]),
                loadedProblems: xmlImporter.element("option", loadedProblems, ["value", problem])
            };
            xmlImporter.text(problem, problemsTags[problem].loadedProblems);
            xmlImporter.openXMLFile(
                "../quals/"+nameOfQual+"/problems/"+p+".xml",
                null,
                function(problemDoc) {
                    doc = problems[p] = problemDoc;
                    convertDoc();
                    outputFromDoc();
                    if (--numLines === 0) {
                        holdJax = false;
                        typeset(texLiveOut);
                        finished();
                    }
                }, 
                function() {
                        errorOut("cannot find " + p);
                }
            );
        }
    }, function() {
        inputMessage(qualNameIn, "that qual has not been successfully initiated", 3000);
        window.setTimeout(function() {qualNameIn.removeAttribute("disabled")}, 3000);
    });
}

// load all locally stored problems and set up for local autosaving
function initializeLocal() {
    let list = Store.fetch("local problems list");
    if (!list) list = "";
    let lines = list.split(" ");
    for (let problem of lines) if (problem !== "" && problem !== "changeMe") {
        if (problem in problems) errorOut("duplicate in problems list: " + problem);
        doc = problems[problem] = xmlImporter.parseDoc(Store.fetch("local " + problem));
        outputFromDoc();
    }
    qualNameIn.value = "working locally";
    let button = xmlImporter.element("button", null, ["type", "button"]);
    qualNameIn.parentElement.insertBefore(button, qualNameIn.nextSibling);
    button.innerHTML = "Erase Local Storage";
    button.addEventListener("click", clearLocalQual);
}

// 3 successful cases: import qual, initialize local, or do both
function loadQual() {
    if (!nodeNameScreen(qualNameIn.value)) {
        if (qualNameIn.value.substring(0, 6) == "local ") {
            // import qual then initialize local autosaving
            qual = "local";
            let nameOfQual = qualNameIn.value.substring(6);
            initializeLocal();
            importRemoteQuestions(nameOfQual, function() {
                qualNameIn.value = "working locally on " + nameOfQual;
                qualNameIn.setAttribute("disabled", "");
            });
            return;
        } else return inputMessage(qualNameIn, "invalid name");
    }
    qual = qualNameIn.value;
    qualNameIn.value = "loading " + qual;
    qualNameIn.setAttribute("disabled", "");
    // import qual or initialize local
    if (qual == "local") {
        initializeLocal();
    } else {
        importRemoteQuestions(qual, function() {
            qualNameIn.value = "working on " + qual;
        });
    }
}

/*
    Two cases here, either opening an existing problem or renaming a problem.
    Renaming consists of deleting under the old name and rewriting under the new name.
    Loading consists of saving the old name (which is actually already saved, so just not deleting it) and then opening the existing problem
*/
function handleIdChange() {
    if (nodeNameScreen(idInput.value)) {
        let oldID = id;
        id = idInput.value;
        if (id in problems) {
            doc = problems[id];
            outputFromDoc();
        } else {
            delete (problems[oldID]);
            if (problemsTags[oldID]) {
                problemsTags[oldID].idList.parentElement.removeChild(problemsTags[oldID].idList);
                problemsTags[oldID].loadedProblems.parentElement.removeChild(problemsTags[oldID].loadedProblems);
                delete problemsTags[oldID];
            }
            if (qual == "local") Store.erase("local " + oldID);
            resetDoc();
        }
    } else inputMessage(idInput, "invalid nodeName");
}

function newMetatypeTypeChange() {
    if (newMetaTypeIn.hasAttribute("disabled")) {
        newMetaTypeIn.removeAttribute("disabled");
        newMetaTypeIn.value = "";
    }
    switch (newMetatypeType.selectedIndex) {
        case 1: // checkboxes
            defaultIn.setAttribute("hide", "");
            newMetaTypeIn.setAttribute("placeholder", "new metatype name");
        break; case 2: // radio
            defaultIn.removeAttribute("hide");
            defaultIn.value = "defaultValue";
            newMetaTypeIn.setAttribute("placeholder", "new metatype name, enter default value first -->");
        break; case 3: // scale
            defaultIn.setAttribute("hide", "new metatype name");
    }
}

function hardRename() {
    try {
        let line = renameMetainformation.value, lines = line.split(" ");
        switch (lines.length) {
            case 2:
                // rename meta itself
                let oldMeta = lines[0], newMeta = lines[1];
                if (!(oldMeta in editorMetas)) return inputMessage(renameMetainformation, "cannot find " + oldMeta);
                if (newMeta in editorMetas) return inputMessage(renameMetainformation, "naming conflict");
                // rename meta in problem files
                for (let problem in problems) {
                    let doc = problems[problem], oldMetaNode = doc.querySelector(oldMeta);
                    if (oldMetaNode) {
                        let newMetanode = xmlImporter.elementDoc(doc, newMeta);
                        for (let child of oldMetaNode.childNodes) newMetanode.appendChild(child.cloneNode(true));
                        for (let att of oldMetaNode.attributes) newMetanode.setAttribute(att.name, att.value);
                        oldMetaNode.parentElement.replaceChild(newMetanode, oldMetaNode);
                    }
                }
                // rename in editorMetas
                editorMetas[newMeta] = editorMetas[oldMeta];
                delete editorMetas[oldMeta];
                editorMetas[newMeta].nameText.nodeValue = newMeta;
                resetDoc();
                renameMetainformation.value = "";
                inputMessage(renameMetainformation, "successfully renamed " + oldMeta + " to " + newMeta);
            break; case 3:
                // rename tag
                let meta = lines[0], oldTag = lines[1], newTag = lines[2];
                if (!(meta in editorMetas)) return inputMessage("cannot find " + meta);
                if (editorMetas[meta].metaType == "scale") return inputMessage("scale metainformation has no tags to rename");
                let metaBunch = editorMetas[meta];
                if (!(oldTag in metaBunch.values)) return inputMessage("cannot find " + oldTag + " in " + meta);
                let oldBunch = metaBunch.values[oldTag];
                if (newTag in metaBunch.values) return inputMessage("naming conflict");
                let newDefault = oldTag == metaBunch.defaultValue? newTag: metaBunch.defaultValue;
                // rename tag in problem files
                for (let problem in problems) {
                    let doc = problems[problem], metaNode = doc.querySelector(meta);
                    if (metaNode) {
                        if (metaBunch.metaType == "radio") metaNode.setAttribute("radio", newDefault);
                        let oldTagNode = doc.querySelector(meta + " " + oldTag);
                        if (oldTagNode) {
                            let newTagNode = xmlImporter.elementDoc(doc, newTag);
                            for (let att of oldTagNode.attributes) newTagNode.setAttribute(att.name, att.value);
                            for (let child of oldTagNode.childNodes) newTagNode.appendChild(child.cloneNode(true));
                            oldTagNode.parentElement.replaceChild(newTagNode, oldTagNode);
                        }
                    }
                }
                // rename in editorMetas
                let newBunch;
                switch (metaBunch.metaType) {
                    case "checkbox":
                        newBunch = newCheckbox(meta, newTag);
                        oldBunch.div.parentElement.replaceChild(newBunch.div, oldBunch.div);
                        newBunch.input.checked = oldBunch.input.checked;
                        delete metaBunch.values[oldTag];
                    break; case "radio":
                        newBunch = newRadio(meta, newTag);
                        oldBunch.div.parentElement.replaceChild(newBunch.div, oldBunch.div);
                        newBunch.input.checked = oldBunch.input.checked;
                    break; default: errorOut("unsupported name change");
                }
                delete metaBunch.values[oldTag];
                resetDoc();
                renameMetainformation.value = "";
                inputMessage(renameMetainformation, "successfully renamed " + oldTag + " in " + meta + " to " + newTag);
            break; default: inputMessage("invalid syntax");
        }
    } catch (e) {
        console.log(e);
        inputMessage(renameMetainformation, "cannot do that");
    }
}

function softRename() {
    let line = renameSoftMetainformation.value, lines = line.split(" ");
    let meta = lines[0], tag = lines[1];
    if (!editorMetas[meta]) return inputMessage(renameSoftMetainformation, "cannot find metainformation " + meta);
    let bunch = editorMetas[meta];
    if (!bunch.values || !(tag in bunch.values)) return inputMessage(renameSoftMetainformation, "cannot find " + tag + " in " + meta);
    let value = line.substring(meta.length + tag.length + 2);
    // just a little fun
    if (value == "Dr. Ian Malcolm") value = "Dr. Ian Malcolm, renowned chaos theorist and proponent of fundamental biological understanding";
    Store.store(qual + " " + meta + " " + tag, value);
    bunch.values[tag].alternateName.nodeValue = value;
    renameSoftMetainformation.value = "";
    inputMessage(renameSoftMetainformation, "successfully soft renamed " + qual + " " + meta + " " + tag + " to " + value);
}

function tryNewMetatypeIn() {
    let meta = newMetaTypeIn.value;
    if (nodeNameScreen(meta)) ensureMetatype(meta, newMetatypeType.value, defaultIn.value);
    newMetaTypeIn.value = "";
}

function newCheckbox(metaName, value) {
    let meta = editorMetas[metaName];
    if (meta.values[value]) return;
    let bunch = meta.values[value] = {};
    bunch.div = xmlImporter.element("div");
    if (meta.div.firstChild != meta.div.lastChild) meta.div.insertBefore(bunch.div, meta.div.lastChild);
    else meta.div.appendChild(bunch.div);
    xmlImporter.text(value, xmlImporter.element("label", bunch.div, ["for", "metainformation"+meta+"value"+value]));
    bunch.input = xmlImporter.element("input", bunch.div, ["type", "checkbox"]);
    bunch.input.addEventListener("change", resetDoc);
    bunch.alternateName = xmlImporter.text(Store.fetch(qual + " " + metaName + " " + value), xmlImporter.element("span", bunch.div));
    return bunch;
}

function newRadio(metaName, value) {
    let meta = editorMetas[metaName];
    if (meta.values[value]) return;
    let bunch = meta.values[value] = {};
    bunch.div = xmlImporter.element("div");
    if (meta.div.firstChild != meta.div.lastChild) meta.div.insertBefore(bunch.div, meta.div.lastChild);
    else meta.div.appendChild(bunch.div);
    xmlImporter.text(value, xmlImporter.element("label", bunch.div, ["for", "metainformation"+meta+"value"+value]));
    bunch.input = xmlImporter.element("input", bunch.div, ["type", "radio", "name", "metainformation"+metaName, "id", "metainformation"+meta+"value"+value]);
    bunch.input.addEventListener("change", resetDoc);
    bunch.alternateName = xmlImporter.text(Store.fetch(qual + " " + metaName + " " + value), xmlImporter.element("span", bunch.div));
    return bunch;
}

// only populates editor's metainformation gui
function ensureMetatype(metaName, type = "checkbox", defaultValue) {
    type = type.toLowerCase();
    if (editorMetas[metaName]) return;
    let meta = editorMetas[metaName] = {values: {}, metaType: type, div: xmlImporter.element("div", putMetasHere, ["class", "meta"])};
    meta.nameText = xmlImporter.text(metaName, xmlImporter.element("h5", meta.div));
    switch (type) {
        case "checkbox":
            meta.div.setAttribute("checkbox", "");
            meta.newButtonIn = xmlImporter.element("input", meta.div, ["type", "text", "placeholder", "new option"]);
            meta.newButtonIn.addEventListener("change", function(test) {
                test = test.target.value;
                if (!nodeNameScreen(test)) return inputMessage(meta.newButtonIn, "invalid");
                for (let value in meta.values) if (value == test) return inputMessage(meta.newButtonIn, "already an option");
                newCheckbox(metaName, test);
                meta.newButtonIn.value = "";
                meta.values[test].input.checked = true;
                resetDoc();
            });
        break; case "radio":
            meta.div.setAttribute("radio", "");
            newRadio(metaName, defaultValue);
            meta.defaultValue = defaultValue;
            meta.newButtonIn = xmlImporter.element("input", meta.div, ["type", "text", "placeholder", "new option"]);
            meta.newButtonIn.addEventListener("change", function(test) {
                test = test.target.value;
                if (!nodeNameScreen(test)) return inputMessage(meta.newButtonIn, "invalid");
                for (let value in meta.values) if (value == test) return inputMessage(meta.newButtonIn, "already an option");
                newRadio(metaName, test);
                meta.newButtonIn.value = "";
                meta.values[test].input.checked = true;
                resetDoc();
            });
        break; case "scale":
            meta.div.setAttribute("scale", "");
            meta.input = xmlImporter.element("input", meta.div, ["type", "number", "step", "any"]);
            meta.input.value = 0;
            meta.input.addEventListener("change", resetDoc);
    }
}

// update doc to represent what is present in the interface
function resetDoc() {
    while (doc.firstChild) doc.removeChild(doc.firstChild);
    let problem = xmlImporter.elementDoc(doc, "problem", xmlImporter.elementDoc(doc, id, doc), ["tex", texProblem.value]);
    for (let metaName in editorMetas) {
        let meta = editorMetas[metaName];
        switch (meta.metaType) {
            case "checkbox":
                let metaNode = xmlImporter.elementDoc(doc, metaName, problem);
                for (let value in meta.values) if (meta.values[value].input.checked) xmlImporter.elementDoc(doc, value, metaNode);
                if (!metaNode.hasChildNodes()) problem.removeChild(metaNode);
            break; case "radio":
                if (!meta.values[meta.defaultValue].input.checked) for (let value in meta.values) if (meta.values[value].input.checked) xmlImporter.elementDoc(doc, value, xmlImporter.elementDoc(doc, metaName, problem, ["radio", meta.defaultValue])); 
            break; case "scale":
                if (meta.input.value != 0) xmlImporter.elementDoc(doc, metaName, problem, ["scale", meta.input.value]);
            break;
        }
    }
    if (pairMode) xmlImporter.elementDoc(doc, "solution", problem.parentElement, ["tex", texSolution.value]);
    outputFromDoc();
}
// this initializes a blank doc in a new session
resetDoc();

// populate values in interface to match what is present in doc
function outputFromDoc() {
    idInput.value = id = xmlImporter.getRoot(doc).nodeName;
    // update problemsTags
    if (id != "changeMe") problems[id] = doc;
    if (!(id in problemsTags) && id != "changeMe") {
        problemsTags[id] = {idList: xmlImporter.element("option", idList, ["value", id]), loadedProblems: xmlImporter.element("option", loadedProblems, ["value", id])};
        xmlImporter.text(id, problemsTags[id].loadedProblems);
    }
    {
        // set loadedProblems <select> to this problem's <option>
        let i = 0;
        if (id != "changeMe") while (loadedProblems.childNodes[i] != problemsTags[id].loadedProblems) ++i;
        loadedProblems.selectedIndex = i;
    }
    let problem = doc.querySelector("problem"), solution = doc.querySelector("solution");
    if ((pairMode && !solution) || (!pairMode && solution)) swapPairMode();
    // set texs
    if (problem) texProblem.value = problem.getAttribute("tex");
    else texProblem.value = "";
    fixTextHeight({target: texProblem});
    if (solution) texSolution.value = solution.getAttribute("tex");
    fixTextHeight({target: texSolution});
    if (problem) {
        if (solution) texLiveOut.innerHTML = "<h4>Problem</h4>"+texAttToInnerHTML(problem.getAttribute("tex"))+"<h4>Solution</h4>"+texAttToInnerHTML(solution.getAttribute("tex"));
        else texLiveOut.innerHTML = texAttToInnerHTML(problem.getAttribute("tex"));
        // just a little fun
        for (let a of document.querySelectorAll("[href=\"https://ncatlab.org/nlab/show/Fubini+theorem\"]")) xmlImporter.rickRollLink(a);
    } else {
        if (solution) texLiveOut.innerHTML = "<h4>Problem</h4><p></p><h4>Solution</h4><p></p>";
        else texLiveOut.innerHTML = "<h4>Problem</h4><p></p>";
    }
    if (!holdJax) typeset(texLiveOut);
    // reset metainformation
    for (let meta in editorMetas) {
        switch (editorMetas[meta].metaType) {
            case "checkbox":
                for (let value in editorMetas[meta].values) editorMetas[meta].values[value].input.checked = false;
            break; case "radio":
                editorMetas[meta].values[editorMetas[meta].defaultValue].input.checked = true;
            break; case "scale":
                editorMetas[meta].input.value = 0;
        }
    }
    // handle metainformation
    if (problem) for (let metaNode of problem.childNodes) {
        if (metaNode.hasAttribute("radio")) {
            ensureMetatype(metaNode.nodeName, "radio", metaNode.getAttribute("radio"));
            let value = metaNode.firstChild;
            if (value) {
                if (!(value.nodeName in editorMetas[metaNode.nodeName].values)) newRadio(metaNode.nodeName, value.nodeName);
                editorMetas[metaNode.nodeName].values[value.nodeName].input.checked = true;
            }
        } else if (metaNode.hasAttribute("scale")) {
            ensureMetatype(metaNode.nodeName, "scale", metaNode.getAttribute("scale"));
            editorMetas[metaNode.nodeName].input.value = metaNode.getAttribute("scale");
        } else {
            ensureMetatype(metaNode.nodeName, "checkbox");
            for (let valueNode of metaNode.childNodes) {
                if (!(valueNode.nodeName in editorMetas[metaNode.nodeName].values)) newCheckbox(metaNode.nodeName, valueNode.nodeName);
                editorMetas[metaNode.nodeName].values[valueNode.nodeName].input.checked = true;
            }
        }
    }
    codeOut.value = xmlImporter.nodeToString(doc);
    fixTextHeight({target: codeOut});
    if (qual == "local" && id != "changeMe") {
        Store.store("local " + id, codeOut.value);
        Store.store("local problems list", problemsListString());
    }
}

function convertDoc() {
    // if you need to convert from a previous format to a new format then do so here
    // this function is in the load process so it will convert all files as they are loaded
    // take doc and process it from old format to new format, return nothing because the change is done directly to doc
    
    // Here is an example of a conversion. This takes the checkbox metadata "instructors" and renames it to "instructor"
    
    /*
    if (doc.querySelector("instructors")) {
        let node = doc.querySelector("instructor");
        let newNode = xmlImporter.elementDoc(doc, "instructor", node);
        for (let valueNode of node.childNodes) newNode.appendChild(valueNode);
        node.parentElement.removeChild(node);
    }
    */
}

// get ids of all loaded problems
function problemsListString() {
    let returner = "";
    for (let problem in problems) if (problem != "changeMe") returner += " " + problem;
    return returner.substring(1);
}

// temporary message displayed in an input element
function inputMessage(input, message, time = 1000) {
    let line = input.value, able = !input.hasAttribute("disabled");
    window.setTimeout(function() {input.value = message}, 10); // delay is to let blur happen
    input.setAttribute("disabled", "");
    window.setTimeout(function() {
        input.value = line;
        if (able) input.removeAttribute("disabled");
    }, time);
}

// This empties the interface and make doc a new problem document. This does not erase the active problem.
function clearTex() {
    doc = xmlImporter.newDocument();
    xmlImporter.elementDoc(doc, "changeMe", doc); // root node, required for xml files
    outputFromDoc();
    texProblem.value = texSolution.value = "";
    if (!pairMode) swapPairMode();
}

// start a session with a blank slate
clearTex();

function swapPairMode() {
    let exchange = resetDoc;
    resetDoc = function() {}
    pairSoloButton.click();
    resetDoc = exchange;
}

// in case you want to show TeX without MathJax rendering it
function noJax(line) {
    return line.replace(/&/g, "&amp;").replace(/\\/g, "\\<span\\>");
}

// this defines which strings are valid node names
function nodeNameScreen(line) {
    try {
        document.createElement(line); return true;
    } catch (e) {return false}
}

// return the first instance in array of an object which has a value of value in property prop
function getBy(array, prop, value) {
    for (let element of array) if (element[prop] == value) return element;
}

// show the error to users even if they don't have the console open
function errorOut(message) {
    errorOutP.innerHTML = message;
    throw Error(message);
}

// offer the currently active problem as an XML file for the user to download, named id.xml
function saveActiveProblem() {
    // codeOut already has the contents of the intended XML file so just copy it into a file
    let file = new File([codeOut.value], id+".xml", {type: "text/xml"});
    // make and click an appropriate download link
    let url = URL.createObjectURL(file);
    let a = xmlImporter.element("a", document.body, ["href", url, "download", ""]);
    xmlImporter.text("download link", a);
    a.click();
    document.body.removeChild(a);
}

// use JSZip magic to save all loaded problems in one .zip file/folder
let zip;
function saveAll() {
    // this url is where JSZip source code is available
    if (!zip) return xmlImporter.element("script", document.head, ["src", "https://stuk.github.io/jszip/dist/jszip.js"]).addEventListener("load", function() {
        zip = new JSZip();
        saveAll();
    });
    let bigFolder = zip.folder(qual), folder = bigFolder.folder("problems");
    for (let problem in problems) if (problem != "changeMe") folder.file(problem+".xml", xmlImporter.nodeToString(problems[problem]));
    bigFolder.file("problemsList.txt", allProps(problems));
    bigFolder.generateAsync({type:"blob"}).then(function (file) {
        // rename file from some machine name to "problems.zip"
        file = new File([file.slice(0, file.size, "application/zip")], "problems.zip", {type: "application/zip"});
        // save problems.zip
        let url = URL.createObjectURL(file);
        let a = xmlImporter.element("a", document.body, ["href", url, "download", ""]);
        xmlImporter.text("download link", a);
        a.click();
        document.body.removeChild(a);
    });
}

// remove all locally stored problems
function clearLocalQual() {
    for (let problem of (Store.fetch("local problems list") || "").split(" ")) Store.erase("local " + problem);
    Store.erase("local problems list");
    // give up on trying to reinitialize a local session, force a refresh and start anew
    // not really necessary but I didn't want to work out a local refresh
    Store.canStore = function() {return false}
    document.body.innerHTML = "<p>Please refresh page now</p>";
    window.location.reload(true);
}

function allProps(object) {
    let props = [];
    for (let prop in object) props.push(prop);
    if (props.length == 0) return "";
    props.sort();
    let line = "";
    for (let prop of props) line += " " + prop;
    return line.substring(1);
}