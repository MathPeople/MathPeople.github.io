/*
    This is a WIP problem search UI adapted from the editor script
*/
// Toggle for whether function calls are announced for debugging or not
var announceFunctions = true;

// Initialize document elements 
let editor = document.getElementById("searchLoc"),
    clearNewProblemButton = xmlImporter.makeButton(
        "Clear / New Problem",
        searchLoc,
        "clearNewProblem",
        clearNewProblem
    ), pairSoloButton = xmlImporter.makeButton(
        "To Solo Mode",
        searchLoc,
        "pairSolo",
        pairSoloClicked
    ), eraseProblemButton = xmlImporter.makeButton(
        "Erase Problem",
        searchLoc,
        "eraseProblem",
        eraseActiveProblem,
        ["hide", ""]
    ), idInput = xmlImporter.labeledInput(
        "Problem ID: ",
        searchLoc,
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
        searchLoc,
        ["id", "showForChangeMe",
        "hide", ""]
    ), hideForChangeMe = xmlImporter.element(
        "div",
        searchLoc,
        ["id", "hideForChangeMe"]
    ),metainformationDetails = xmlImporter.makeDetails(
        "Searchable Metainformation Options",
        hideForChangeMe,
        true
    ), putMetasHere = xmlImporter.element(
        "div",
        metainformationDetails,
        ["id", "putMetasHere"]
    ), wholeListDetails = xmlImporter.makeDetails(
        "List View",
        searchLoc,
        true
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
    ), texSection = xmlImporter.makeDetails(
        "\\(\\TeX\\) Content",
        hideForChangeMe,
        true
    ), texProblem = xmlImporter.labeledElement(
        "Problem",
        "textarea",
        texSection,
        "texProblem",
        ["input", xmlImporter.fixTextHeight,
        "input", resetDocTexOnly],
        ["class", "texinput",
        "spellcheck", "false"]
    ), texSolution = xmlImporter.labeledElement(
        "Solution",
        "textarea",
        texSection,
        "texSolution",
        ["input", xmlImporter.fixTextHeight,
        "input", resetDocTexOnly],
        ["class", "texinput",
        "spellcheck", "false"]
    ), texLiveOut = xmlImporter.element(
        "div",
        texSection,
        ["id", "texLiveOut"]
    );

// Further setup of the above DOM elements
{
    loadedProblems.parentElement.setAttribute("floatright", "");
    
    typeset(texSection);
    xmlImporter.makeTabbable(texProblem);
    xmlImporter.makeTabbable(texSolution);
    texSolution.parentElement.setAttribute("paironly", "");
}

//if (announceFunctions) xmlImporter.makeButton("print stamp", searchLoc, "printstamp", function() {console.log("\r\nstamp")});

// script global variables
let activeProblem = "changeMe", // id of the problem currently in the gui
    idBlacklist = ["changeMe", "problem", "solution"], // don't name a problem one of these
    changeMeOption, // option for putting in loadedProblems in between clicking clear/new problem and renaming the problem
    autosave = false,
    pairMode = true, // problem/solution pair or solo mode
    justJax = false; // render just jax or render all the metainformation gui elements as well

// jax configuration, short so that typing tex updates live
jaxLoopWait = 200;

// Load the qual problems. Change this if you are creating a new page from the template
loadQual("complex");

// overrides from problems.js
{
    let override;
    // as we add metas, put the little buttons in the metainformation GUI section
    let oldAddingMetaOverride = addingMetaOverride;
    override = function() {
        addingMetaOverride = function addingMetaOverrideEditor(metaType, values) {
            //if (announceFunctions) console.log("addingMetaOverride "+metaType+" "+Object.keys(values));
            let meta = metas[metaType];
            if (!meta.div) {
                meta.div = xmlImporter.makeDetails(metaType, putMetasHere, false, ["class", "meta"]);
                switch (meta.metaType) {
                    case "checkbox":
                        meta.div.setAttribute("checkbox", "");
                        meta.newButtonIn = xmlImporter.element("input", meta.div, ["type", "text", "placeholder", "new option"]);
                        meta.newButtonIn.addEventListener("change", function(test) {
                            test = test.target.value;
                            if (!xmlImporter.nodeNameScreen(test)) return xmlImporter.inputMessage(meta.newButtonIn, "invalid");
                            for (let value in meta.values) if (value == test) return xmlImporter.inputMessage(meta.newButtonIn, "already an option");
                            meta.newButtonIn.value = "";
                            let doc = problems[activeProblem].doc;
                            xmlImporter.elementDoc(
                                doc,
                                test,
                                doc.querySelector("problem "+metaType)
                            );
                            loadProblem(doc);
                            afterProblemsAreSet();
                        });
                    break; case "radio":
                        meta.div.setAttribute("radio", "");
                        //newRadio(metaName, defaultValue);
                        meta.newButtonIn = xmlImporter.element("input", meta.div, ["type", "text", "placeholder", "new option"]);
                        meta.newButtonIn.addEventListener("change", function(test) {
                            test = test.target.value;
                            if (!xmlImporter.nodeNameScreen(test)) return xmlImporter.inputMessage(meta.newButtonIn, "invalid");
                            for (let value in meta.values) if (value == test) return xmlImporter.inputMessage(meta.newButtonIn, "already an option");
                            meta.newButtonIn.value = "";
                            let doc = problems[activeProblem].doc, metaNode = doc.querySelector(metaType);
                            if (!metaNode) metaNode = xmlImporter.elementDoc(doc, metaNode, doc.querySelector("problem"), ["radio", meta.defaultValue]);
                            xmlImporter.elementDoc(doc, test, metaNode);
                            loadProblem(doc);
                            afterProblemsAreSet();
                        });
                    break; case "scale":
                        meta.div.setAttribute("scale", "");
                        meta.input = xmlImporter.element("input", meta.div, ["type", "number", "step", "any"]);
                        meta.input.value = 0;
                        meta.input.addEventListener("change", function() {
                            let doc = problems[activeProblem].doc, metaNode = doc.querySelector(metaType);
                            if (!metaNode) metaNode = xmlImporter.elementDoc(doc, metaType, doc.querySelector("problem"));
                            metaNode.setAttribute("scale", meta.input.value);
                            if (meta.input.value == 0) metaNode.parentElement.removeChild(metaNode);
                            loadProblem(doc);
                            afterProblemsAreSet();
                        });
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
                            if (value == meta.defaultValue) bunch.input.parentElement.setAttribute("default", "");
                        }
                        if (!bunch.alternateName) bunch.alternateName = xmlImporter.text(Store.fetch(qualName + " " + metaType + " " + value), xmlImporter.element("span", bunch.div));
                    break;
                }
            }
            oldAddingMetaOverride(metaType, values);
        }
    }
    override();
    // as a problem is loaded, set all the gui elements to apply to the loading problem
    let oldLoadProblemOverride = loadProblemOverride;
    override = function () {
        loadProblemOverride = function loadProblemOverrideEditor(problem) {
            //if (announceFunctions) console.log("loadProblemOverride "+problem);
            if (!problems[problem]) return;
            activeProblem = problem;
            idInput.value = problem;
            changeNameFirst(problem === "changeMe");
            if (!problems[problem].loadedProblemsOption && (problem !== "changeMe")) {
                problems[problem].loadedProblemsOption = xmlImporter.element("option", loadedProblems, ["value", problem]);
                xmlImporter.text(problem, problems[problem].loadedProblemsOption);
            }
            if (!problems[problem].idListOption && (problem !== "changeMe")) {
                problems[problem].idListOption = xmlImporter.element("option", idList, ["value", problem]);
                xmlImporter.text(problem, problems[problem].idListOption);
            }
            if ((problem === "changeMe") && !changeMeOption) {
                changeMeOption = xmlImporter.element("option", loadedProblems);
                xmlImporter.text(problem, changeMeOption);
            }
            if ((problem !== "changeMe") && changeMeOption) {
                loadedProblems.removeChild(changeMeOption);
                changeMeOption = undefined;
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
    }
    override();
    
    function changeNameFirst(isChangeMe) {
        (isChangeMe? changeNameFirstP: hideForChangeMe).removeAttribute("hide");
        (isChangeMe? hideForChangeMe: changeNameFirstP).setAttribute("hide", "");
    }
    function outputTexFromProblem(problem = activeProblem) {
        //if (announceFunctions) console.log("outputTexFromProblem "+problem);
        let problemNode = problems[problem].doc.querySelector("problem"), solutionNode = problems[problem].doc.querySelector("solution");
        pairMode = solutionNode != null;
        pairSoloRefresh();
        texProblem.value = problemNode? problemNode.getAttribute("tex"): "";
        xmlImporter.fixTextHeight({target: texProblem});
        texSolution.value = solutionNode? solutionNode.getAttribute("tex"): "";
        xmlImporter.fixTextHeight({target: texSolution});
        texLiveOut.innerHTML = solutionNode? "<h4>Problem</h4>"+texProblem.value+"<h4>Solution</h4>"+texSolution.value: texProblem.value;
        if (!holdJax) typeset(texLiveOut);
        if (texProblem.value === "" && (!pairMode || texSolution.value === "")) eraseProblemButton.removeAttribute("hide");
        else eraseProblemButton.setAttribute("hide", "");
        oldLoadProblemOverride(problem);
    }
    
    //afterProblemsAreSetOverride
    //let oldAfterProblemsAreSetOverride = afterProblemsAreSetOverride;
    override = function() {
        afterProblemsAreSetOverride = function afterProblemsAreSetOverrideEditor() {
            if (announceFunctions) console.log("afterProblemsAreSetOverride");
            loadProblemOverride(activeProblem); // populate GUI with the current problem
            let metaNames = [];
            for (let meta in metas) metaNames.push(meta);
            metaNames.sort();
            for (let meta of metaNames) {
                putMetasHere.removeChild(metas[meta].div);
                putMetasHere.appendChild(metas[meta].div);
            }
            for (let meta in metas) sortMeta(meta);
            fixWholeList();
            sortList(loadedProblems);
            if (changeMeOption) loadedProblems.insertBefore(changeMeOption, loadedProblems.firstChild);
            sortList(idList);
        }
    }
    override();
    
    function sortMeta(metaType) {
        let meta = metas[metaType];
        if (meta.metaType === "scale") return;
        let valueNames = [];
        for (let value in meta.values) valueNames.push(value);
        valueNames.sort();
        for (let value of valueNames) {
            meta.div.removeChild(meta.values[value].div);
            meta.div.insertBefore(meta.values[value].div, meta.newButtonIn);
        }
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
    override = function() {
        eraseProblemOverride = function eraseProblemOverrideEditor(problem) {
            if (announceFunctions) console.log("eraseProblemOverride "+problem);
            let e = problems[problem].idListOption;
            if (e) e.parentElement.removeChild(e);
            e = problems[problem].loadedProblemsOption;
            if (e) e.parentElement.removeChild(e);
            if (autosave) Store.erase("local " + problem);
            if (problem === activeProblem && problem !== "changeMe") clearNewProblem();
        }
    }
    override();
    
    //eraseWhole/PartMetainformationOverride
    let oldEraseWholeMetainformationOverride = eraseWholeMetainformationOverride;
    override = function() {
        eraseWholeMetainformationOverride = function eraseWholeMetainformationOverrideEditor(metaType) {
            if (announceFunctions) console.log("eraseWholeMetainformationOverride "+metaType);
            metas[metaType].div.parentElement.removeChild(metas[metaType].div);
            oldEraseWholeMetainformationOverride(metaType);
        }
    }
    override();
    
    let oldErasePartMetainformationOverride = erasePartMetainformationOverride;
    override = function() {
        erasePartMetainformationOverride = function erasePartMetainformationOverrideEditor(metaType, metaValue) {
            if (announceFunctions) console.log("erasePartMetainformationOverride "+metaType+" "+metaValue);
            let div = metas[metaType].values[metaValue].div;
            div.parentElement.removeChild(div);
            oldErasePartMetainformationOverride(metaType, metaValue);
        }
    }
    override();
}

// this initializes a blank doc in a new session
resetDoc();

// Take qualNameIn's value and load the corresponding problems
function loadQual(qualNameIn) {
    if (announceFunctions) console.log("loadQual");
    
    importProblemsRepository(
        qualNameIn,
        function() {},
        cantFindQual
    );
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

function eraseActiveProblem() {
    if (activeProblem !== "changeMe") eraseProblem(activeProblem);
    fixWholeList();
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
    let newMeta = newMetaTypeIn.value;
    if (!xmlImporter.nodeNameScreen(newMeta)) return xmlImporter.inputMessage(newMetaTypeIn, "invalid node name");
    if (idBlacklist.includes(newMeta)) return xmlImporter.inputMessage(newMetaTypeIn, "cannot use that name");
    if (newMeta in metas) return xmlImporter.inputMessage(newMetaTypeIn, "already in use");
    // Add a node which induces this metainformation. Add necessary default values, they can be renamed/changed later.
    let doc = problems[activeProblem].doc, problemNode = doc.querySelector("problem");
    switch (newMetaTypeType.selectedIndex) {
        case 1: // checkbox
            xmlImporter.elementDoc(
                doc,
                "defaultValue",
                xmlImporter.elementDoc(
                    doc,
                    newMeta,
                    problemNode
                )
            );
        break; case 2: // radio
            xmlImporter.elementDoc(
                doc,
                "otherValue",
                xmlImporter.elementDoc(
                    doc,
                    newMeta,
                    problemNode,
                    ["radio", "defaultValue"]
                )
            );
        break; case 3: // scale
            xmlImporter.elementDoc(
                doc,
                newMeta,
                problemNode,
                ["scale", "1"]
            );
        break;
    }
    newMetaTypeIn.value = "First choose metainformation type -->";
    newMetaTypeIn.setAttribute("disabled", "");
    newMetaTypeType.selectedIndex = 0;
    loadProblem(doc);
}

function newMetaTypeTypeChange() {
    if (announceFunctions) console.log("newMetaTypeTypeChange");
    if (newMetaTypeIn.hasAttribute("disabled")) {
        newMetaTypeIn.removeAttribute("disabled");
        newMetaTypeIn.value = "";
    }
}

let hardRenameHelperFunctions = {
    errorOut: function errorOut(message) {xmlImporter.inputMessage(renameMetainformation, message)},
    renameMetaType: function renameMetaType(oldMeta, newMeta, doc) {
        let metaNode = doc.querySelector("problem > "+oldMeta);
        if (metaNode) {
            let copy = xmlImporter.elementDoc(doc, newMeta);
            for (let att of metaNode.attributes) copy.setAttribute(att.name, att.value);
            while (metaNode.firstChild) copy.appendChild(metaNode.firstChild);
            metaNode.parentNode.replaceChild(copy, metaNode);
            loadProblem(doc);
        }
    },
    renameMetaValue: function renameMetaValue(metaType, oldValue, newValue, doc, isRadioDefault) {
        if (isRadioDefault) {
            let metaNode = doc.querySelector("problem > "+metaType);
            if (metaNode) metaNode.setAttribute("radio", newValue);
        } else {
            let metaNode = doc.querySelector("problem > "+metaType+" > "+oldValue);
            if (metaNode) metaNode.parentElement.replaceChild(xmlImporter.elementDoc(doc, newValue), metaNode);
        }
        loadProblem(doc);
    }
}

function hardRename() {
    if (announceFunctions) console.log("hardRename");
    let lines = renameMetainformation.value.split(" ");
    let metaType = lines[0];
    if (lines.length === 2) { // renaming metatype
        if (!(metaType in metas)) return hardRenameHelperFunctions.errorOut("cannot find that metainformation");
        let newName = lines[1];
        if (!xmlImporter.nodeNameScreen(newName)) return hardRenameHelperFunctions.errorOut("not a valid node name");
        if (idBlacklist.includes(newName)) return hardRenameHelperFunctions.errorOut("cannot name metainformation that");
        if (newName in metas) return hardRenameHelperFunctions.errorOut("that name is already in use");
        // name is good, do the rename
        let currentlyActive = activeProblem;
        holdJax = true;
        for (let problem in problems) if (problem !== activeProblem) hardRenameHelperFunctions.renameMetaType(metaType, newName, problems[problem].doc);
        holdJax = false;
        hardRenameHelperFunctions.renameMetaType(metaType, newName, problems[currentlyActive].doc);
        afterProblemsAreSet();
    } else if (lines.length === 3) { // renaming an option
        if (metas[metaType].metaType === "scale") return hardRenameHelperFunctions.errorOut("scale metas don't have named values");
        let oldValue = lines[1], newValue = lines[2];
        if (!(metaType in metas) || !(oldValue in metas[metaType].values)) return hardRenameHelperFunctions.errorOut("cannot find that metainformation");
        if (!xmlImporter.nodeNameScreen(newValue)) return hardRenameHelperFunctions.errorOut("not a valid node name");
        if (idBlacklist.includes(newValue)) return hardRenameHelperFunctions.errorOut("cannot name metainformation that");
        if (newValue in metas[metaType].values) return hardRenameHelperFunctions.errorOut("that name is already in use");
        if (!problems[activeProblem].doc.querySelector("problem > "+metaType)) return hardRenameHelperFunctions.errorOut("cannot rename default value from this problem");
        // name is good, do the rename
        let isRadioDefault = oldValue === metas[metaType].defaultValue;
        let currentlyActive = activeProblem;
        holdJax = true;
        for (let problem in problems) if (problem !== activeProblem) hardRenameHelperFunctions.renameMetaValue(metaType, oldValue, newValue, problems[problem].doc, isRadioDefault);
        holdJax = false;
        hardRenameHelperFunctions.renameMetaValue(metaType, oldValue, newValue, problems[currentlyActive].doc, isRadioDefault);
        afterProblemsAreSet();
    } else return hardRenameHelperFunctions.errorOut("rename instructions are either 2 or 3 words long");
    renameMetainformation.value = "";
    hardRenameHelperFunctions.errorOut("successfully renamed");
}

function softRename() {
    if (announceFunctions) console.log("softRename");
    let line = renameSoftMetainformation.value, lines = line.split(" ");
    let meta = lines[0], tag = lines[1];
    if (!metas[meta]) return xmlImporter.inputMessage(renameSoftMetainformation, "cannot find metainformation " + meta);
    let bunch = metas[meta];
    if (!bunch.values || !(tag in bunch.values)) return xmlImporter.inputMessage(renameSoftMetainformation, "cannot find " + tag + " in " + meta);
    let value = line.substring(meta.length + tag.length + 2);
    // just a little fun
    if (value == "Dr. Ian Malcolm") value = "Dr. Ian Malcolm, renowned chaos theorist and proponent of fundamental biological understanding";
    Store.store(qualName + " " + meta + " " + tag, value);
    bunch.values[tag].alternateName.nodeValue = value;
    renameSoftMetainformation.value = "";
    xmlImporter.inputMessage(renameSoftMetainformation, "successfully soft renamed " + qualName + " " + meta + " " + tag + " to " + value);
}

function toggleColumnListener() {
    if (announceFunctions) console.log("toggleColumnListener");
    let metaName = toggleColumn.value, meta = metas[metaName];
    if (meta) {
        meta.hide = !meta.hide;
        fixWholeList();
        toggleColumn.value = "";
        xmlImporter.inputMessage(toggleColumn, (meta.hide? "hid ": "showed ") + metaName);
    } else xmlImporter.inputMessage(toggleColumn, "cannot find that metainformation");
}

// update the whole list of problems with the current values
function fixWholeList() {
    if (announceFunctions) console.log("fixWholeList");
    let matches = getProblemsFromSelector(practiceSearch.value);
    wholeListHere.innerHTML = "";
    let header = xmlImporter.element("tr", wholeListHere);
    xmlImporter.text("🔍", xmlImporter.element("th", header));
    function buttonListener(e) {
        let button = e.target;
        let wasIncreasing = button.getAttribute("order") === "increasing";
        for (let otherButton of header.querySelectorAll("button")) otherButton.removeAttribute("order");
        button.setAttribute("order", wasIncreasing? "decreasing": "increasing");
        sortTable(button.getAttribute("colnumber"), !wasIncreasing);
    }
    function sortTable(column, increasing) {
        let rows = [];
        for (let child of wholeListHere.childNodes) if (child !== header) rows.push(child);
        rows.sort(function(a, b) {
            // first any matched problem is before any unmatched problem
            if (a.childNodes[1].firstChild.nodeValue in matches) {
                if (!(b.childNodes[1].firstChild.nodeValue in matches)) return -1;
            } else if (b.childNodes[1].firstChild.nodeValue in matches) return 1;
            // reverse order if decreasing
            if (!increasing) {
                let c = b;
                b = a;
                a = c;
            }
            // sort by value in column
            return a.childNodes[column].innerText.localeCompare(b.childNodes[column].innerText);
        });
        for (let row of rows) {
            wholeListHere.removeChild(row);
            wholeListHere.appendChild(row);
        }
    }
    let colNumber = 1; // skip the first column (xpath match column)
    function makeColumnHeader(text) {
        let button = xmlImporter.element("button", xmlImporter.element("th", header), ["colnumber", colNumber++]);
        xmlImporter.text(text, button);
        button.addEventListener("click", buttonListener);
        return button;
    }
    let idButton = makeColumnHeader("problem id");
    let showMetas = [];
    for (let meta in metas) if (!metas[meta].hide) {
        showMetas.push(meta);
        makeColumnHeader(meta);
    }
    for (let problem in problems) if (problem !== "changeMe") {
        let row = xmlImporter.element("tr", wholeListHere);
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
    idButton.click();
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
