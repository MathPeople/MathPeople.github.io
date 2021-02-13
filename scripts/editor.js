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
    ), eraseProblemButton = xmlImporter.makeButton(
        "Erase Problem",
        editor,
        "eraseProblem",
        eraseActiveProblem,
        ["hide", ""]
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
        ["change", tryNewMetaTypeIn],
        ["placeholder", "new metatype name"]
    ), newMetaTypeType = xmlImporter.element(
        "select",
        newMetaTypeIn.parentElement,
        ["id", "newMetaTypeType"]
    ), putMetasHere = xmlImporter.element(
        "div",
        metainformationDetails,
        ["id", "putMetasHere"]
    ), renameMetainformation = xmlImporter.labeledInput(
        "Rename Metainformation",
        metainformationDetails,
        "renameMetainformation",
        ["change", hardRename],
        ["placeholder", "metaType newName | metaType metaValue newName"]
    ), renameSoftMetainformation = xmlImporter.labeledInput(
        "Alternate Name Metainformation",
        metainformationDetails,
        "renameSoftMetainformation",
        ["change", softRename]
    ), wholeListDetails = xmlImporter.makeDetails(
        "List View",
        editor,
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
    ), saveButton = xmlImporter.makeButton(
        "Save",
        texSection,
        "save",
        saveActiveProblem
    ), codeOut =xmlImporter.element(
        "textarea",
        texSection,
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
    
    typeset(texSection);
    xmlImporter.makeTabbable(texProblem);
    xmlImporter.makeTabbable(texSolution);
    texSolution.parentElement.setAttribute("paironly", "");
}

if (announceFunctions) xmlImporter.makeButton("print stamp", editor, "printstamp", function() {console.log("\r\nstamp")});
// script global variables
let activeProblem = "changeMe", // id of the problem currently in the gui
    idBlacklist = ["changeMe", "problem", "solution"], // don't name a problem one of these
    changeMeOption, // option for putting in loadedProblems in between clicking clear/new problem and renaming the problem
    autosave = false,
    pairMode = true, // problem/solution pair or solo mode
    justJax = false; // render just jax or render all the metainformation gui elements as well

// jax configuration, short so that typing tex updates live
jaxLoopWait = 200;

// overrides from problems.js
{
    let override;
    // as we add metas, put the little buttons in the metainformation GUI section
    let oldAddingMetaOverride = addingMetaOverride;
    override = function() {
        addingMetaOverride = function addingMetaOverrideEditor(metaType, values) {
            if (announceFunctions) console.log("addingMetaOverride "+metaType+" "+Object.keys(values));
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
            if (announceFunctions) console.log("loadProblemOverride "+problem);
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

    let oldLoadPracticeTestOverride = loadPracticeTestOverride;
    override = function() {
        loadPracticeTestOverride = function loadPracticeTestOverrideEditor(config) {
            if (announceFunctions) console.log("loadPracticeTest");
            practiceTestsSpot.appendChild(config.div);
            config.rawText = xmlImporter.element("textarea", null, ["class", "texinput", "spellcheck", "false"]);
            config.div.insertBefore(config.rawText, config.div.firstChild.nextElementSibling);
            xmlImporter.makeTabbable(config.rawText);
            config.rawText.value = xmlImporter.nodeToString(config.doc);
            xmlImporter.fixTextHeight({target: config.rawText});
            config.rawText.addEventListener("input", xmlImporter.fixTextHeight);
            config.rawText.addEventListener("input", function() {
                config.compileButton.removeAttribute("hide");
                config.button.setAttribute("hide", "");
                config.testOut.setAttribute("hide", "");
            });
            config.compileButton = xmlImporter.element("button", null, ["hide", ""]);
            config.div.insertBefore(config.compileButton, config.rawText.nextElementSibling);
            xmlImporter.text("compile", config.compileButton);
            config.compileButton.addEventListener("click", function() {compilePracticeTest(config)});
            if (autosave) {
                Store.store("local practiceTest "+config.name, config.rawText.value);
                Store.store("local practiceTests list", practiceTestsListString());
            }
            sortPracticeTests();
            oldLoadPracticeTestOverride(config);
        }
    }
    override();
    // read in from rawText and save if autosaving
    let compilePracticeTest = function compilePracticeTest(config) {
        config.compileButton.setAttribute("hide", "");
        let doc = xmlImporter.parseDoc(config.rawText.value);
        if (xmlImporter.isParserError(doc)) return practiceTestErrorOut(config, "<h4>Parser error, not a valid XML file. The structure of these parser errors varies from browser to browser, see below for the specific error.</h4><pre class='errorout'>"+xmlImporter.nodeToInnerHTML(doc)+"</pre>");
        let root = xmlImporter.getRoot(doc);
        // test for name conflict
        for (let otherName in practiceTests) if (practiceTests[otherName] !== config && otherName === root.nodeName) return practiceTestErrorOut(config, "name conflict: "+otherName+" is already in use");
        erasePracticeTest(config);
        loadPracticeTest(xmlImporter.trim(doc));
    }

    let oldErasePracticeTestOverride = erasePracticeTestOverride;
    override = function() {
        erasePracticeTestOverride = function erasePracticeTestOverrideEditor(config) {
            if (announceFunctions) console.log("erasePracticeTest");
            if (autosave) Store.erase("local practiceTest "+config.name);
        }
    }
    override();
    
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
        if (autosave) Store.store("local problems list", problemsListString());
        if (autosave && problem !== "changeMe") Store.store("local "+problem, codeOut.value);
        if (texProblem.value === "" && (!pairMode || texSolution.value === "")) eraseProblemButton.removeAttribute("hide");
        else eraseProblemButton.setAttribute("hide", "");
        oldLoadProblemOverride(problem);
    }
    
    //afterProblemsAreSetOverride
    let oldAfterProblemsAreSetOverride = afterProblemsAreSetOverride;
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
            oldAfterProblemsAreSetOverride();
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
    list = Store.fetch("local practiceTests list");
    if (!list) list = "";
    lines = list.split(" ");
    for (let practiceTest of lines) {
        if (practiceTest !== "") loadPracticeTest(xmlImporter.trim(xmlImporter.parseDoc(Store.fetch("local practiceTest "+practiceTest))));
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
function clearLocalQual(e) {
    if (announceFunctions) console.log("clearLocalQual");
    let deleteMe = Object.assign({}, problems);
    for (let problem in deleteMe) eraseProblem(problem);
    Store.erase("local problems list");
    deleteMe = Object.assign({}, practiceTests);
    for (let practiceTest in deleteMe) erasePracticeTest(practiceTests[practiceTest]);
    Store.erase("local practiceTests list");
    qualNameIn.value = "";
    qualNameIn.removeAttribute("disabled");
    // remove the erase button
    if (e && e.target && e.target.parentElement) e.target.parentElement.removeChild(e.target);
    // start fresh
    resetDoc();
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
    for (let problem in problems) if (problem !== "changeMe") {
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
    // codeOut already has the contents of the intended XML file so just copy it into a file
    let file = new File([codeOut.value], activeProblem+".xml", {type: "text/xml"});
    // make and click an appropriate download link
    let url = URL.createObjectURL(file);
    let a = xmlImporter.element("a", document.body, ["href", url, "download", ""]);
    xmlImporter.text("download link", a);
    a.click();
    document.body.removeChild(a);
}

// make a new practice test configuration zone
function offerNewPracticeTest() {
    if (announceFunctions) console.log("offerNewPracticeTest");
    let num = 0;
    while (("practiceTest"+(++num)) in practiceTests);
    let plainDoc = xmlImporter.parseDoc("<practiceTest"+num+"/>");
    loadPracticeTest(plainDoc);
}

function sortPracticeTests() {
    let testNames = [];
    for (let testName in practiceTests) testNames.push(testName);
    testNames.sort();
    for (let testName of testNames) practiceTestsSpot.insertBefore(practiceTests[testName].div, newPracticeTestButton);
}

// use JSZip magic to save all loaded problems in one .zip file/folder
let zip;
function saveAll() {
    if (announceFunctions) console.log("saveAll");
    // this url is where JSZip source code is available
    if (!zip) {
        xmlImporter.element("script", document.head, ["src", "https://stuk.github.io/jszip/dist/jszip.js"]).addEventListener("load", function() {
            zip = new JSZip();
            saveAllButton.removeAttribute("disabled");
            saveAll();
        });
        saveAllButton.setAttribute("disabled", "");
        return;
    }
    let bigFolder = zip.folder(qualName), folder = bigFolder.folder("problems");
    for (let problem in problems) if (problem != "changeMe") folder.file(problem+".xml", xmlImporter.nodeToString(problems[problem].doc));
    bigFolder.file("problemsList.txt", problemsListString());
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

function recoverData(name, value) {
    let dataOut = xmlImporter.element("textarea", xmlImporter.makeDetails(name, dataRecovery, true), ["class", "texoutput"]);
    dataOut.value = value;
    dataRecovery.removeAttribute("hide");
    xmlImporter.fixTextHeight({target: dataOut});
}