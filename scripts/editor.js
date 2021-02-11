/*
    First read the wiki for using this editor, in particular the parts about how problem focus works. The active problem is the problem with current focus and is the only one which can be changed through interaction with the GUI. The editor works by letting the user focus on a problem and interact with the GUI to make changes to it. The problem exists as an XML DOM. Any change directed to the problem first changes that problem's DOM and then repopulates the document HTML DOM with information from the problem XML DOM. Saving consists of saving these problem XML DOMs.
*/
var announceFunctions = false;
// editor DOM elements
let editor = document.getElementById("editor"),
    qualNameIn = xmlImporter.labeledInput(
        "This is for qual",
        editor,
        "qualName",
        ["change", loadQual]
    ), clearNewProblemButton = xmlImporter.makeButton(
        "Clear / New Problem",
        editor,
        "clearNewProblem",
        clearNewProblem
    ), pairSoloButton = xmlImporter.makeButton(
        "To Solo Mode",
        editor,
        "pairSolo",
        pairSoloClicked
    ), idInput = xmlImporter.labeledInput(
        "Problem ID: ",
        editor,
        "problemID",
        ["change", handleIdChange,
        "blur", function() {idInput.value = activeProblem}],
        ["list", "idList"]
    ), idList = xmlImporter.element(
        "datalist",
        idInput.parentElement,
        ["id", "idList"]
    ), loadedProblems = xmlImporter.labeledElement(
        "Loaded problems:",
        "select",
        idInput.parentElement,
        "loadedProblems",
        ["change", function() {
            idInput.value = loadedProblems.value;
            handleIdChange();
        }]
    ), changeNameFirstP = xmlImporter.element(
        "p",
        editor,
        ["id", "showForChangeMe",
        "hide", ""]
    ), hideForChangeMe = xmlImporter.element(
        "div",
        editor,
        ["id", "hideForChangeMe"]
    ),metainformationDetails = xmlImporter.makeDetails(
        "Set the Metainformation",
        hideForChangeMe,
        true
    ), newMetaTypeIn = xmlImporter.labeledInput(
        "New Metainformation Type",
        metainformationDetails,
        "newMetaType",
        ["change", tryNewMetaTypeIn]
    ), newMetaTypeType = xmlImporter.element(
        "select",
        newMetaTypeIn.parentElement,
        ["id", "newMetaTypeType"]
    ), defaultIn = xmlImporter.element(
        "input",
        newMetaTypeIn.parentElement,
        ["id", "defaultOption",
         "hide", ""]
    ), putMetasHere = xmlImporter.element(
        "div",
        metainformationDetails,
        ["id", "putMetasHere"]
    ), renameMetainformation = xmlImporter.labeledInput(
        "Rename Metainformation",
        metainformationDetails,
        "renameMetainformation",
        ["change", hardRename]
    ), renameSoftMetainformation = xmlImporter.labeledInput(
        "Alternate Name Metainformation",
        metainformationDetails,
        "renameSoftMetainformation",
        ["change", softRename]
    ), wholeListDetails = xmlImporter.makeDetails(
        "List View",
        editor
    ), toggleColumn = xmlImporter.labeledInput(
        "Toggle Column",
        wholeListDetails,
        "toggleColumn",
        ["change", toggleColumnListener]
    ), practiceSearch = xmlImporter.labeledInput(
        "Find Matches",
        wholeListDetails,
        "practiceSearch",
        ["change", fixWholeList]
    ), wholeListHere = xmlImporter.element(
        "table",
        wholeListDetails,
        ["id", "wholeListHere"]
    ), texProblem = xmlImporter.labeledElement(
        "Problem",
        "textarea",
        hideForChangeMe,
        "texProblem",
        ["input", xmlImporter.fixTextHeight,
        "input", resetDocTexOnly],
        ["class", "texinput",
        "spellcheck", "false"]
    ), texSolution = xmlImporter.labeledElement(
        "Solution",
        "textarea",
        hideForChangeMe,
        "texSolution",
        ["input", xmlImporter.fixTextHeight,
        "input", resetDocTexOnly],
        ["class", "texinput",
        "spellcheck", "false"]
    ), texLiveOut = xmlImporter.element(
        "div",
        hideForChangeMe,
        ["id", "texLiveOut"]
    ), saveButton = xmlImporter.makeButton(
        "Save",
        hideForChangeMe,
        "save",
        saveActiveProblem
    ), codeOut =xmlImporter.element(
        "textarea",
        hideForChangeMe,
        ["id", "codeOut",
        "class", "texoutput",
        "readonly", "",
        "spellcheck", "false"]
    ), practiceTestsSpot = xmlImporter.makeDetails(
        "Practice Tests",
        editor,
        true
    ), newPracticeTestButton = xmlImporter.makeButton(
        "New Practice Test Configuration",
        practiceTestsSpot,
        "newPracticeTestButton",
        offerNewPracticeTest
    ), saveAllButton = xmlImporter.makeButton(
        "Save All (.zip)",
        editor,
        "saveAll",
        saveAll
    ), errorOutP = xmlImporter.element(
        "p",
        editor,
        ["id", "errorOut"]
    ), dataRecovery = xmlImporter.makeDetails(
        "Data Recovery",
        editor,
        true,
        ["id", "dataRecovery",
        "hide", ""]
    );

// Further setup of the above DOM elements
{
    loadedProblems.parentElement.setAttribute("floatright", "");
    
    xmlImporter.text("Change the name before working on this problem", changeNameFirstP);
    
    newMetaTypeIn.value = "First choose metainformation type -->";
    newMetaTypeIn.setAttribute("disabled", "");
    
    newMetaTypeType.addEventListener("change", newMetaTypeTypeChange);
    xmlImporter.text("Select Type", xmlImporter.element("option", newMetaTypeType, ["disabled", ""]));
    xmlImporter.text("Checkbox", xmlImporter.element("option", newMetaTypeType));
    xmlImporter.text("Radio", xmlImporter.element("option", newMetaTypeType));
    xmlImporter.text("Scale", xmlImporter.element("option", newMetaTypeType));
    newMetaTypeType.selectedIndex = 0;
    
    xmlImporter.makeTabbable(texProblem);
    xmlImporter.makeTabbable(texSolution);
    texSolution.parentElement.setAttribute("paironly", "");
}

if (announceFunctions) xmlImporter.makeButton("print stamp", editor, "printstamp", function() {console.log("\r\nstamp")});
// script global variables
let activeProblem = "changeMe", // id of the problem currently in the gui
    idBlacklist = ["problem", "solution"], // don't name a problem one of these
    autosave = false,
    pairMode = true, // problem/solution pair or solo mode
    justJax = false, // render just jax or render all the metainformation gui elements as well
    practiceTestConfigs = []; // holds all practice test configurations

// jax configuration, short so that typing tex updates live
jaxLoopWait = 200;

// overrides from problems.js
{
    // as we add metas, put the little buttons in the metainformation GUI section
    let oldAddingMetaOverride = addingMetaOverride;
    addingMetaOverride = function addingMetaOverride(metaType, values) {
        if (announceFunctions) console.log("addingMetaOverride "+metaType+" "+Object.keys(values));
        let meta = metas[metaType];
        if (!meta.div) {
            meta.div = xmlImporter.element("div", putMetasHere, ["class", "meta"]);
            meta.nameText = xmlImporter.text(metaType, xmlImporter.element("h5", meta.div));
            switch (meta.metaType) {
                case "checkbox":
                    meta.div.setAttribute("checkbox", "");
                    meta.newButtonIn = xmlImporter.element("input", meta.div, ["type", "text", "placeholder", "new option"]);
                    meta.newButtonIn.addEventListener("change", function(test) {
                        /*test = test.target.value;
                        if (!xmlImporter.nodeNameScreen(test)) return inputMessage(meta.newButtonIn, "invalid");
                        for (let value in meta.values) if (value == test) return inputMessage(meta.newButtonIn, "already an option");
                        newCheckbox(metaName, test);
                        meta.newButtonIn.value = "";
                        meta.values[test].input.checked = true;
                        resetDoc();*/
                        console.log("new checkbox button");
                    });
                break; case "radio":
                    meta.div.setAttribute("radio", "");
                    //newRadio(metaName, defaultValue);
                    meta.newButtonIn = xmlImporter.element("input", meta.div, ["type", "text", "placeholder", "new option"]);
                    meta.newButtonIn.addEventListener("change", function(test) {
                        /*test = test.target.value;
                        if (!nodeNameScreen(test)) return inputMessage(meta.newButtonIn, "invalid");
                        for (let value in meta.values) if (value == test) return inputMessage(meta.newButtonIn, "already an option");
                        newRadio(metaName, test);
                        meta.newButtonIn.value = "";
                        meta.values[test].input.checked = true;
                        resetDoc();*/
                        console.log("new radio button");
                    });
                    // add the default value
                    let value = meta.defaultValue;
                    if (!meta.values[value]) meta.values[value] = {};
                    bunch = meta.values[value];
                    if (!bunch.div) {
                        bunch.div = xmlImporter.element("div");
                        if (meta.div.firstChild != meta.div.lastChild) meta.div.insertBefore(bunch.div, meta.div.lastChild);
                        else meta.div.appendChild(bunch.div);
                    }
                    if (!bunch.input) {
                        bunch.input = xmlImporter.labeledInput(
                            value,
                            bunch.div,
                            "metainformation-"+metaType+"-value-"+value,
                            ["change", resetDoc],
                            ["type", "radio",
                            "name", "metainformation-"+metaType]
                        );
                        bunch.input.parentElement.setAttribute("default", "");
                        bunch.input.parentElement.setAttribute("class", "metavalue");
                    }
                    if (!bunch.alternateName) bunch.alternateName = xmlImporter.text(Store.fetch(qualName + " " + metaType + " " + value), xmlImporter.element("span", bunch.div));
                break; case "scale":
                    meta.div.setAttribute("scale", "");
                    meta.input = xmlImporter.element("input", meta.div, ["type", "number", "step", "any"]);
                    meta.input.value = 0;
                    //meta.input.addEventListener("change", resetDoc);
            }
        }
        for (let value in values) {
            let bunch;
            switch (meta.metaType) {
                case "checkbox":
                    if (!meta.values[value]) meta.values[value] = {};
                    bunch = meta.values[value];
                    if (!bunch.div) {
                        bunch.div = xmlImporter.element("div");
                        if (meta.div.firstChild != meta.div.lastChild) meta.div.insertBefore(bunch.div, meta.div.lastChild);
                        else meta.div.appendChild(bunch.div);
                    }
                    if (!bunch.input) {
                        bunch.input = xmlImporter.labeledInput(
                            value,
                            bunch.div,
                            "metainformation-"+meta+"-value-"+value,
                            ["change", resetDoc],
                            ["type", "checkbox"]
                        );
                        bunch.input.parentElement.setAttribute("class", "metavalue");
                    }
                    if (!bunch.alternateName) bunch.alternateName = xmlImporter.text(Store.fetch(qualName + " " + metaType + " " + value), xmlImporter.element("span", bunch.div));
                break; case "radio":
                    if (!meta.values[value]) meta.values[value] = {};
                    bunch = meta.values[value];
                    if (!bunch.div) {
                        bunch.div = xmlImporter.element("div");
                        if (meta.div.firstChild != meta.div.lastChild) meta.div.insertBefore(bunch.div, meta.div.lastChild);
                        else meta.div.appendChild(bunch.div);
                    }
                    if (!bunch.input) {
                        bunch.input = xmlImporter.labeledInput(
                            value,
                            bunch.div,
                            "metainformation-"+meta+"-value-"+value,
                            ["change", resetDoc],
                            ["type", "radio",
                            "name", "metainformation-"+metaType]
                        );
                        bunch.input.parentElement.setAttribute("class", "metavalue");
                    }
                    if (!bunch.alternateName) bunch.alternateName = xmlImporter.text(Store.fetch(qualName + " " + metaType + " " + value), xmlImporter.element("span", bunch.div));
                break;
            }
        }
        oldAddingMetaOverride(metaType, values);
    }
    // as a problem is loaded, set all the gui elements to apply to the loading problem
    let oldLoadProblemOverride = loadProblemOverride;
    loadProblemOverride = function loadProblemOverride(problem) {
        if (announceFunctions) console.log("loadProblemOverride "+problem);
        if (!problems[problem]) return;
        activeProblem = problem;
        idInput.value = problem;
        changeNameFirst(problem === "changeMe");
        if (!problems[problem].loadedProblemsOption) {
            problems[problem].loadedProblemsOption = xmlImporter.element("option", loadedProblems, ["value", problem]);
            xmlImporter.text(problem, problems[problem].loadedProblemsOption);
        }
        if (!problems[problem].idListOption) {
            problems[problem].idListOption = xmlImporter.element("option", idList, ["value", problem]);
            xmlImporter.text(problem, problems[problem].idListOption);
        }
        for (let i = 0; i < loadedProblems.childNodes.length; ++i) if (loadedProblems.childNodes[i].value === problem) loadedProblems.selectedIndex = i;
        if (!holdJax) {
            for (let meta in metas) {
                let node;
                switch (metas[meta].metaType) {
                    case "checkbox":
                        for (let value in metas[meta].values) {
                            if (problems[problem].doc.querySelector("problem >"+meta+" > "+value)) metas[meta].values[value].input.checked = true;
                            else metas[meta].values[value].input.checked = false;
                        }
                    break; case "radio":
                        for (let value in metas[meta].values) {
                            node = problems[problem].doc.querySelector("problem > "+meta);
                            if (node) {
                                metas[meta].values[node.firstChild.nodeName].input.checked = true;
                            } else {
                                metas[meta].values[metas[meta].defaultValue].input.checked = true;
                            }
                        }
                    break; case "scale":
                        node = problems[problem].doc.querySelector("problem > "+meta);
                        metas[meta].input.value = node? node.getAttribute("scale"): 0;
                }
            }
        }
        outputTexFromProblem();
        oldLoadProblemOverride(problem);
    }
    function changeNameFirst(isChangeMe) {
        (isChangeMe? changeNameFirstP: hideForChangeMe).removeAttribute("hide");
        (isChangeMe? hideForChangeMe: changeNameFirstP).setAttribute("hide", "");
    }
    function outputTexFromProblem(problem = activeProblem) {
        if (announceFunctions) console.log("outputTexFromProblem "+problem);
        let problemNode = problems[problem].doc.querySelector("problem"), solutionNode = problems[problem].doc.querySelector("solution");
        pairMode = solutionNode != null;
        pairSoloRefresh();
        texProblem.value = problemNode? problemNode.getAttribute("tex"): "";
        xmlImporter.fixTextHeight({target: texProblem});
        texSolution.value = solutionNode? solutionNode.getAttribute("tex"): "";
        xmlImporter.fixTextHeight({target: texSolution});
        texLiveOut.innerHTML = solutionNode? "<h4>Problem</h4>"+texProblem.value+"<h4>Solution</h4>"+texSolution.value: texProblem.value;
        if (!holdJax) typeset(texLiveOut);
        codeOut.value = xmlImporter.nodeToString(problems[problem].doc);
        xmlImporter.fixTextHeight({target: codeOut});
        if (autosave && problem !== "changeMe") {
            Store.store("local "+problem, codeOut.value);
            Store.store("local problems list", problemsListString());
        }
        oldLoadProblemOverride(problem);
    }
    
    //afterProblemsAreSetOverride
    let oldAfterProblemsAreSetOverride = afterProblemsAreSetOverride;
    afterProblemsAreSetOverride = function afterProblemsAreSetOverride() {
        if (announceFunctions) console.log("afterProblemsAreSetOverride");
        loadProblemOverride(activeProblem); // populate GUI with the current problem
        fixWholeList();
        sortList(loadedProblems);
        sortList(idList);
        oldAfterProblemsAreSetOverride();
    }
    // take an element whose children are options and sort them alphabetically
    function sortList(listElement) {
        if (announceFunctions) console.log("sortList "+listElement.getAttribute("id"));
        let options = [];
        while (listElement.firstChild) options.push(listElement.removeChild(listElement.firstChild));
        options.sort(optionComparator);
        for (let option of options) listElement.appendChild(option);
    }
    // sort alphabetically
    function optionComparator(a, b) {
        return a.firstChild.nodeValue.localeCompare(b.firstChild.nodeValue);
    }
    
    // remove this problem from lists
    let oldEraseProblemOverride = eraseProblemOverride;
    eraseProblemOverride = function eraseProblemOverride(problem) {
        if (announceFunctions) console.log("eraseProblemOverride "+problem);
        let e = problems[problem].idListOption;
        if (e) e.parentElement.removeChild(e);
        e = problems[problem].loadedProblemsOption;
        if (e) e.parentElement.removeChild(e);
        if (autosave) Store.erase("local " + problem);
        if (problem === activeProblem) clearNewProblem();
    }
    
    //eraseWhole/PartMetainformationOverride
    let oldEraseWholeMetainformationOverride = eraseWholeMetainformationOverride;
    eraseWholeMetainformationOverride = function eraseWholeMetainformationOverride(metaType) {
        if (announceFunctions) console.log("eraseWholeMetainformationOverride "+metaType);
        metas[metaType].div.parentElement.removeChild(metas[metaType].div);
        oldEraseWholeMetainformationOverride(metaType);
    }
    
    let oldErasePartMetainformationOverride = erasePartMetainformationOverride;
    erasePartMetainformationOverride = function erasePartMetainformationOverride(metaType, metaValue) {
        if (announceFunctions) console.log("erasePartMetainformationOverride "+metaType+" "+metaValue);
        let div = metas[metaType].values[metaValue].div;
        div.parentElement.removeChild(div);
        oldErasePartMetainformationOverride(metaType, metaValue);
    }
}

// Take qualNameIn's value and load the corresponding problems
function loadQual() {
    if (announceFunctions) console.log("loadQual");
    if (xmlImporter.nodeNameScreen(qualNameIn.value)) {
        if (qualNameIn.value === "local") {
            qualNameIn.value = "working locally";
            qualNameIn.setAttribute("disabled", "");
            qualName = "local";
            loadFromLocalStorage();
            afterProblemsAreSet();
            return;
        }
        else {
            importProblemsRepository(
                qualNameIn.value,
                function() {
                    qualNameIn.value = "working on " + qualName;
                    qualNameIn.setAttribute("disabled", "");
                }, cantFindQual
            );
        }
    } else {
        if (qualNameIn.value.substring(0, 6) == "local ") {
            // import qual then initialize local autosaving
            let nameOfQual = qualNameIn.value.substring(6);
            if (!xmlImporter.nodeNameScreen(nameOfQual)) {
                xmlImporter.inputMessage(qualNameIn, "invalid name");
                return;
            }
            importProblemsRepository(
                nameOfQual,
                function() {
                    qualNameIn.value = "working locally on " + qualName;
                    qualNameIn.setAttribute("disabled", "");
                    loadFromLocalStorage();
                    let realTypeset = typeset;
                    typeset = function() {}
                    for (let problem in problems) outputTexFromProblem(problem); // this saves all problems to local storage
                    typeset = realTypeset;
                    loadProblemOverride(activeProblem); // bring focus back to active problem
                }, cantFindQual
            );
            return;
        } else {
            xmlImporter.inputMessage(qualNameIn, "invalid name");
            return;
        }
    }
}

// load problems from local storage
function loadFromLocalStorage() {
    if (announceFunctions) console.log("loadFromLocalStorage");
    autosave = true;
    holdJax = true;
    let list = Store.fetch("local problems list"); // same as problemsList.txt, space separated list of ids
    if (!list) list = "";
    let lines = list.split(" ");
    for (let problem of lines) {
        if (problem !== "" && problem !== "changeMe") {
            loadProblem(xmlImporter.trim(xmlImporter.parseDoc(Store.fetch("local " + problem))));
        }
    }
    qualNameIn.parentElement.insertBefore(
        xmlImporter.makeButton(
            "Erase Local Storage",
            null,
            "eraseLocalStorage",
            clearLocalQual
        ), qualNameIn.nextElementSibling
    );
}

// remove all locally stored problems
function clearLocalQual() {
    if (announceFunctions) console.log("clearLocalQual");
    let deleteMe = Object.assign({}, problems);
    for (let problem in deleteMe) eraseProblem(problem);
    Store.erase("local problems list");
}

// what to do if importing the qual failed
function cantFindQual() {
    if (announceFunctions) console.log("cantFindQual");
    xmlImporter.inputMessage(qualNameIn, "that qual has not been successfully initiated", 3000);
}

// This empties the interface and make doc a new problem document. This does not erase the active problem.
function clearNewProblem() {
    if (announceFunctions) console.log("clearNewProblem");
    doc = xmlImporter.parseDoc("<changeMe><problem tex=''/>"+(pairMode?"<solution tex=''/>":"")+"</changeMe>");
    loadProblem(doc);
    afterProblemsAreSet();
}

// switch between pair mode and solo mode
function pairSoloClicked() {
    if (announceFunctions) console.log("pairSoloClicked");
    pairMode = !pairMode;
    pairSoloRefresh();
    resetDoc();
}

function pairSoloRefresh() {
    pairSoloButton.firstChild.nodeValue = "To " + (pairMode? "Solo": "Pair") + " Mode";
    if (pairMode) for (let hideMe of document.querySelectorAll("[paironly]")) hideMe.removeAttribute("hide");
    else for (let hideMe of document.querySelectorAll("[paironly]")) hideMe.setAttribute("hide", "");
}

function handleIdChange() {
    if (announceFunctions) console.log("handleIdChange");
    if (idBlacklist.includes(idInput.value)) return xmlImporter.inputMessage(idInput, "cannot name a problem that");
    if (xmlImporter.nodeNameScreen(idInput.value)) {
        let oldID = activeProblem;
        activeProblem = idInput.value;
        if (activeProblem in problems) {
            loadProblemOverride(activeProblem);
        } else {
            let doc = problems[oldID].doc;
            eraseProblem(oldID);
            let root = xmlImporter.getRoot(doc), newRoot = xmlImporter.elementDoc(doc, activeProblem);
            for (let att of root.attributes) newRoot.setAttribute(att.name, att.value);
            while (root.firstChild) newRoot.appendChild(root.firstChild);
            doc.replaceChild(newRoot, root);
            loadProblem(doc);
            afterProblemsAreSet();
        }
    } else xmlImporter.inputMessage(idInput, "invalid nodeName");
}

function tryNewMetaTypeIn() {
    if (announceFunctions) console.log("tryNewMetTypeIn");
    /*let meta = newMetaTypeIn.value;
    if (nodeNameScreen(meta)) ensureMetatype(meta, newMetatypeType.value, defaultIn.value);
    newMetaTypeIn.value = "";*/
    console.log("trying new metatype in");
}

function hardRename() {
    if (announceFunctions) console.log("hardRename");
    /*try {
        let line = renameMetainformation.value, lines = line.split(" ");
        switch (lines.length) {
            case 2:
                // rename meta itself
                let oldMeta = lines[0], newMeta = lines[1];
                if (!(oldMeta in metas)) return inputMessage(renameMetainformation, "cannot find " + oldMeta);
                if (newMeta in metas) return inputMessage(renameMetainformation, "naming conflict");
                // rename meta in problem files
                for (let problem in problems) {
                    let doc = problems[problem].doc, oldMetaNode = doc.querySelector(oldMeta);
                    if (oldMetaNode) {
                        let newMetanode = xmlImporter.elementDoc(doc, newMeta);
                        for (let child of oldMetaNode.childNodes) newMetanode.appendChild(child.cloneNode(true));
                        for (let att of oldMetaNode.attributes) newMetanode.setAttribute(att.name, att.value);
                        oldMetaNode.parentElement.replaceChild(newMetanode, oldMetaNode);
                    }
                }
                // rename in metas
                metas[newMeta] = metas[oldMeta];
                delete metas[oldMeta];
                metas[newMeta].nameText.nodeValue = newMeta;
                resetDoc();
                renameMetainformation.value = "";
                inputMessage(renameMetainformation, "successfully renamed " + oldMeta + " to " + newMeta);
            break; case 3:
                // rename tag
                let meta = lines[0], oldTag = lines[1], newTag = lines[2];
                if (!(meta in metas)) return inputMessage("cannot find " + meta);
                if (metas[meta].metaType == "scale") return inputMessage("scale metainformation has no tags to rename");
                let metaBunch = metas[meta];
                if (!(oldTag in metaBunch.values)) return inputMessage("cannot find " + oldTag + " in " + meta);
                let oldBunch = metaBunch.values[oldTag];
                if (newTag in metaBunch.values) return inputMessage("naming conflict");
                let newDefault = oldTag == metaBunch.defaultValue? newTag: metaBunch.defaultValue;
                // rename tag in problem files
                for (let problem in problems) {
                    let doc = problems[problem].doc, metaNode = doc.querySelector(meta);
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
                // rename in metas
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
    }*/
    console.log("hard renaming");
}

function softRename() {
    if (announceFunctions) console.log("softRename");
    /*let line = renameSoftMetainformation.value, lines = line.split(" ");
    let meta = lines[0], tag = lines[1];
    if (!metas[meta]) return inputMessage(renameSoftMetainformation, "cannot find metainformation " + meta);
    let bunch = metas[meta];
    if (!bunch.values || !(tag in bunch.values)) return inputMessage(renameSoftMetainformation, "cannot find " + tag + " in " + meta);
    let value = line.substring(meta.length + tag.length + 2);
    // just a little fun
    if (value == "Dr. Ian Malcolm") value = "Dr. Ian Malcolm, renowned chaos theorist and proponent of fundamental biological understanding";
    Store.store(qual + " " + meta + " " + tag, value);
    bunch.values[tag].alternateName.nodeValue = value;
    renameSoftMetainformation.value = "";
    inputMessage(renameSoftMetainformation, "successfully soft renamed " + qual + " " + meta + " " + tag + " to " + value);*/
    console.log("soft renaming");
}

function toggleColumnListener() {
    if (announceFunctions) console.log("toggleColumnListener");
    /*let meta = metas[toggleColumn.value];
    if (meta) {
        meta.hide = !meta.hide;
        fixWholeList();
        toggleColumn.setAttribute("placeholder", (meta.hide? "hid ": "showed ") + toggleColumn.value);
        toggleColumn.value = "";
        window.setTimeout(function() {toggleColumn.setAttribute("placeholder", "")}, 3000);
    } else {
        let value = toggleColumn.value;
        toggleColumn.value = "cannot find " + value;
        toggleColumn.setAttribute("disabled", "");
        window.setTimeout(function() {
            toggleColumn.value = value;
            toggleColumn.removeAttribute("disabled");
        }, 3000);
    }*/
    console.log("toggling column");
}

// update the whole list of problems with the current values
function fixWholeList() {
    if (announceFunctions) console.log("fixWholeList");
    wholeListHere.innerHTML = "";
    let header = xmlImporter.element("tr", wholeListHere);
    xmlImporter.text("🔍", xmlImporter.element("th", header));
    xmlImporter.text("problem id", xmlImporter.element("th", header));
    let showMetas = [];
    for (let meta in metas) if (!metas[meta].hide) {
        showMetas.push(meta);
        xmlImporter.text(meta, xmlImporter.element("th", header));
    }
    let rows = [];
    let matches = getProblemsFromSelector(practiceSearch.value);
    for (let problem in problems) {
        let row = xmlImporter.element("tr", null);
        rows.push(row);
        xmlImporter.text((problem in matches)? "✓": "X", xmlImporter.element("td", row)); // the X here is not the unicode fancy X so that it shows up as different even if the user doesn't have a powerful enough font for unicode check mark and fancy X
        xmlImporter.text(problem, xmlImporter.element("td", row));
        for (let meta of showMetas) {
            let metaNode = problems[problem].doc.querySelector("problem > " + meta);
            switch (metas[meta].metaType) {
                case "checkbox":
                    let td = xmlImporter.element("td", row, ["class", "checkboxlist"]);
                    if (metaNode) for (let child of metaNode.childNodes) {
                        xmlImporter.text(child.nodeName, td);
                        xmlImporter.element("br", td);
                    }
                    if (td.lastChild) td.removeChild(td.lastChild);
                break; case "radio":
                    xmlImporter.text(metaNode? metaNode.firstChild.nodeName: metas[meta].defaultValue, xmlImporter.element("td", row));
                break; case "scale":
                    xmlImporter.text(metaNode? metaNode.getAttribute("scale"): 0, xmlImporter.element("td", row));
                break;
            }
        }
    }
    let comparator = function(a, b) {
        let aName = a.firstChild.nextSibling.firstChild.nodeValue, bName = b.firstChild.nextSibling.firstChild.nodeValue;
        if ((aName in matches) && !(bName in matches)) return -1;
        if (!(aName in matches) && (bName in matches)) return 1;
        return aName.localeCompare(bName);
    }
    rows.sort(comparator);
    for (let row of rows) wholeListHere.appendChild(row);
}

// Update active problem to represent what is present in the interface. This consists of creating a new document from the GUI values, deleting the old problem, and reloading it with the new doc.
function resetDoc() {
    if (announceFunctions) console.log("resetDoc");
    let doc = xmlImporter.newDocument();
    let root = xmlImporter.elementDoc(doc, activeProblem, doc);
    let problemNode = xmlImporter.elementDoc(doc, "problem", root, ["tex", texProblem.value]);
    for (let metaName in metas) {
        let meta = metas[metaName];
        switch (meta.metaType) {
            case "checkbox":
                let metaNode = xmlImporter.elementDoc(doc, metaName, problemNode);
                for (let value in meta.values) if (meta.values[value].input.checked) xmlImporter.elementDoc(doc, value, metaNode);
                if (metaNode.childElementCount === 0) problemNode.removeChild(metaNode);
            break; case "radio":
                if (!meta.values[meta.defaultValue].input.checked) for (let value in meta.values) if (meta.values[value].input.checked) xmlImporter.elementDoc(doc, value, xmlImporter.elementDoc(doc, metaName, problemNode, ["radio", meta.defaultValue])); 
            break; case "scale":
                if (meta.input.value != 0) xmlImporter.elementDoc(doc, metaName, problemNode, ["scale", meta.input.value]);
            break;
        }
    }
    if (pairMode) xmlImporter.elementDoc(doc, "solution", problemNode.parentElement, ["tex", texSolution.value]);
    else if (texSolution.value != "") recoverData("former "+activeProblem+" solution", texSolution.value);
    if (problems[activeProblem]) eraseProblem(activeProblem);
    loadProblem(doc);
    afterProblemsAreSet();
}
// same as above but much quicker because it doesn't change any of the metainformation
function resetDocTexOnly() {
    if (announceFunctions) console.log("resetDocTexOnly");
    problems[activeProblem].doc.querySelector("problem").setAttribute("tex", texProblem.value);
    if (pairMode) problems[activeProblem].doc.querySelector("solution").setAttribute("tex", texSolution.value);
    outputTexFromProblem();
}
// this initializes a blank doc in a new session
resetDoc();

// offer the currently active problem as an XML file for the user to download, named id.xml
function saveActiveProblem() {
    if (announceFunctions) console.log("saveActiveProblem");
    /*// codeOut already has the contents of the intended XML file so just copy it into a file
    let file = new File([codeOut.value], id+".xml", {type: "text/xml"});
    // make and click an appropriate download link
    let url = URL.createObjectURL(file);
    let a = xmlImporter.element("a", document.body, ["href", url, "download", ""]);
    xmlImporter.text("download link", a);
    a.click();
    document.body.removeChild(a);*/
    console.log("save active probleming");
}

let practiceTestProto = {};

// make a new practice test configuration zone
function offerNewPracticeTest() {
    if (announceFunctions) console.log("offerNewPracticeTest");
    /*let config = Object.create(practiceTestProto);
    practiceTestConfigs.push(config);
    config.div = xmlImporter.element("div", practiceTestsSpot, ["class", "practicetestconfig"]);
    config.rawText = xmlImporter.element("textarea", config.div, ["class", "xmlin"]);
    xmlImporter.makeTabbable(config.rawText);
    config.rawText.addEventListener("input", xmlImporter.fixTextHeight);
    config.rawText.addEventListener("input", function() {
        config.compileButton.removeAttribute("hide");
        config.makeTestButton.setAttribute("hide", "");
        config.testOut.setAttribute("hide", "");
    });
    config.compileButton = xmlImporter.element("button", config.div);
    xmlImporter.text("compile", config.compileButton);
    config.compileButton.addEventListener("click", function() {config.compile()});
    config.makeTestButton = xmlImporter.element("button", config.div, ["hide", ""]);
    xmlImporter.text("make test", config.makeTestButton);
    config.makeTestButton.addEventListener("click", function() {config.makeTest()});
    config.errorOutPlace = xmlImporter.element("div", config.div, ["class", "errorout"]);
    config.testOut = xmlImporter.element("details", config.div, ["class", "testout", "hide", "", "open", ""]);
    config.testNameNode = xmlImporter.text("", xmlImporter.element("summary", config.testOut));
    xmlImporter.text("test goes here", config.test = xmlImporter.element("p", config.testOut));
    return config;*/
    console.log("offering new practice test");
}

// use JSZip magic to save all loaded problems in one .zip file/folder
let zip;
function saveAll() {
    if (announceFunctions) console.log("saveAll");
    /*// this url is where JSZip source code is available
    if (!zip) return xmlImporter.element("script", document.head, ["src", "https://stuk.github.io/jszip/dist/jszip.js"]).addEventListener("load", function() {
        zip = new JSZip();
        saveAll();
    });
    let bigFolder = zip.folder(qual), folder = bigFolder.folder("problems");
    for (let problem in problems) if (problem != "changeMe") folder.file(problem+".xml", xmlImporter.nodeToString(problems[problem].doc));
    bigFolder.file("problemsList.txt", allProps(problems, "doc"));
    bigFolder.generateAsync({type:"blob"}).then(function (file) {
        // rename file from some machine name to "problems.zip"
        file = new File([file.slice(0, file.size, "application/zip")], "problems.zip", {type: "application/zip"});
        // save problems.zip
        let url = URL.createObjectURL(file);
        let a = xmlImporter.element("a", document.body, ["href", url, "download", ""]);
        xmlImporter.text("download link", a);
        a.click();
        document.body.removeChild(a);
    });*/
    console.log("save alling");
}

function newMetaTypeTypeChange() {
    if (announceFunctions) console.log("newMetaTypeTypeChange");
    /*if (newMetaTypeIn.hasAttribute("disabled")) {
        newMetaTypeIn.removeAttribute("disabled");
        newMetaTypeIn.value = "";
    }
    switch (newMetatypeType.selectedIndex) {
        case 1: // checkbox
            defaultIn.setAttribute("hide", "");
            newMetaTypeIn.setAttribute("placeholder", "new metatype name");
        break; case 2: // radio
            defaultIn.removeAttribute("hide");
            defaultIn.value = "defaultValue";
            newMetaTypeIn.setAttribute("placeholder", "new metatype name, enter default value first -->");
        break; case 3: // scale
            defaultIn.setAttribute("hide", "new metatype name");
    }*/
    console.log("new metatype type change");
}

function recoverData(name, value) {
    xmlImporter.fixTextHeight(xmlImporter.element("textarea", xmlImporter.makeDetails(name, dataRecovery), ["class", "texoutput"])).value = value;
    dataRecovery.removeAttribute("hide");
}

/*

// start a session with a blank slate
clearNewProblem();

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

// return the first instance in array of an object which has a value of value in property prop
function getBy(array, prop, value) {
    for (let element of array) if (element[prop] == value) return element;
}

// read in from rawText
practiceTestProto.compile = function compile() {
    this.compileButton.setAttribute("hide", "");
    this.doc = xmlImporter.parseDoc(this.rawText.value);
    if (xmlImporter.isParserError(this.doc)) return this.errorOut("<h4>Parser error, not a valid XML file. The structure of these parser errors varies from browser to browser, see below for the specific error.</h4><pre class='errorout'>"+xmlImporter.nodeToInnerHTML(this.doc)+"</pre>");
    else this.errorOut("");
    let root = xmlImporter.getRoot(this.doc);
    this.name = root.hasAttribute("displayName")? root.getAttribute("displayName"): root.nodeName;
    for (let c of practiceTestConfigs) if (c !== this && c.name === this.name) return this.errorOut("duplicated test name: " + this.name);
    this.makeTest();
}

practiceTestProto.errorOut = function errorOut(message) {
    this.errorOutPlace.innerHTML = message;
    this.testOut.setAttribute("hide", "");
    if (message === "") this.makeTestButton.removeAttribute("hide");
    else this.makeTestButton.setAttribute("hide", "");
}

var putTestCountHere;

practiceTestProto.makeTest = function makeTest() {
    let oldTest = this.test;
    this.testNameNode.nodeValue = this.name;
    this.errorOut("");
    let countSpot = xmlImporter.element("p", this.div);
    putTestCountHere = xmlImporter.text("tries left", countSpot);
    // timeout is to remove generator from the main thread
    let me = this;
    makePracticeTest(problems, me.doc, function(result, success) {
        if (success) {
            me.test = result;
            me.testOut.replaceChild(me.test, oldTest);
            me.errorOut("");
            me.testOut.removeAttribute("hide");
        } else {
            me.errorOut(result);
        }
        typeset(me.testOut);
        putTestCountHere = undefined;
        me.div.removeChild(countSpot);
    }, 100);
}

function onPracticeTestReady() {
    // this is one place to automatically load a practice test, but since this is the editor and we don't know what problems will be loaded automatic loading may not be a good idea
}

// show the error to users even if they don't have the console open
function errorOut(message) {
    errorOutP.innerHTML = message;
    throw Error(message);
}


function allProps(object, accessor) {
    let props = [];
    if (typeof accessor !== "undefined") for (let prop in object) props.push(prop[accessor]);
    else for (let prop in object) props.push(prop);
    if (props.length == 0) return "";
    props.sort();
    let line = "";
    for (let prop of props) line += " " + prop;
    return line.substring(1);
}*/