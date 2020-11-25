let mainDiv = document.getElementById("problemsSpot"), metaDiv = xmlImporter.element("details", mainDiv, ["class", "metainformation"]), problemsDiv = xmlImporter.element("div", mainDiv, ["class", "problems"]);

xmlImporter.text("Metainformation", xmlImporter.element("summary", metaDiv));

let andOrButton = xmlImporter.element("select", metaDiv);
xmlImporter.text("And mode", xmlImporter.element("option", andOrButton));
xmlImporter.text("Or mode", xmlImporter.element("option", andOrButton));
andOrButton.addEventListener("change", updateHides);

var problems = {}, metas = {};

function handleMetaNode(node) {
    if (!(node.nodeName in metas)) metas[node.nodeName] = {values: {}, metaType: "checkboxes"};
    let value = node.firstChild;
    while (value) {
        metas[node.nodeName].values[value.nodeName] = undefined;
        value = value.nextSibling;
    }
    if (node.hasAttribute("radio")) {
        metas[node.nodeName].metaType = "radio";
        metas[node.nodeName].values[node.getAttribute("radio")] = undefined;
        metas[node.nodeName].defaultValue = node.getAttribute("radio");
    }
    if (node.hasAttribute("scale")) {
        metas[node.nodeName].metaType = "scale";
        for (let i = 0; i <= node.getAttribute("scale"); ++i) metas[node.nodeName].values["n"+i] = undefined;
        metas[node.nodeName].defaultValue = "n1";
    }
}

function loadProblem(doc) {
    let problem = xmlImporter.getRoot(doc).nodeName;
    problems[problem] = {doc: doc};
    let problemNode = doc.querySelector("problem");
    if (problemNode) {
        let meta = problemNode.firstChild;
        while (meta) {
            handleMetaNode(meta);
            meta = meta.nextSibling;
        }
    }
}

function importQual(qualName) {
    xmlImporter.openTextFile("../quals/"+qualName+"/problemsList.txt", null, function(list) {
        if (list == "") return mainDiv.innerHTML = "could not find any problems";
        list = list.split(" ");
        let toGo = list.length;
        for (let problem of list) {
            xmlImporter.openXMLFile("../quals/"+qualName+"/problems/"+problem+".xml", null, function(doc) {
                loadProblem(doc);
                if (--toGo == 0) show();
            });
        }
    });
}

// if the page was initialized with qualName then this will set up for that qual
try {importQual(qualName)} catch (e) {}

function showProblem(problem, showCompleteness = true) {
    let bunch = problems[problem];
    let doc = bunch.doc, problemNode = doc.querySelector("problem"), solutionNode = doc.querySelector("solution");
    bunch.div = xmlImporter.element((showCompleteness && solutionNode)? "details": "div", problemsDiv, ["class", "problem"]);
    if (solutionNode) {
        if (showCompleteness) {
            bunch.summary = xmlImporter.element("summary", bunch.div);
            bunch.summary.innerHTML = "<span>"+problem+"</span>"+texAttToInnerHTML(problemNode.getAttribute("tex"));
        }
        bunch.div.innerHTML += texAttToInnerHTML(solutionNode.getAttribute("tex"));
    } else bunch.div.innerHTML = texAttToInnerHTML(problemNode.getAttribute("tex"));
    if (showCompleteness && !doc.querySelector("solutionCompleteness")) bunch.div.setAttribute("unfinished", "");
    else if (showCompleteness && doc.querySelector("solutionCompleteness > partial")) bunch.div.setAttribute("unfinished", "partial");
    // just a little fun
    for (let a of document.querySelectorAll("[href=\"https://ncatlab.org/nlab/show/Fubini+theorem\"]")) xmlImporter.rickRollLink(a);
}

function eraseProblem(problem) {
    let bunch = problems[problem];
    if (bunch.div) bunch.div.parentElement.removeChild(bunch.div);
    delete problems[problem];
}

function updateMetas() {
    for (let meta in metas) {
        let bunch = metas[meta];
        if (!bunch.div) {
            bunch.div = xmlImporter.element("div", metaDiv, ["class", "metaBunch"]);
            bunch.title = xmlImporter.element("p", bunch.div, ["class", "metaTitle"]);
            bunch.titleText = xmlImporter.text(meta, bunch.title);
        }
        if (!bunch.checkboxes) bunch.checkboxes = xmlImporter.element("div", bunch.div, ["class", "checkboxes"]);
        for (let value in bunch.values) if (!bunch.values[value]) {
            let pair = xmlImporter.element("div", bunch.checkboxes, ["class", "checkbox"]);
            bunch.values[value] = {
                value: value,
                pair: pair,
                label: xmlImporter.element("label", pair, ["for", "metadata-"+meta+"-value-"+value]),
                option: xmlImporter.element("input", pair, ["type", "checkbox", "value", value, "id", "metadata-"+meta+"-value-"+value]),
                isSelected: bunchCheckboxIsSelected
            };
            xmlImporter.text(value, bunch.values[value].label);
            bunch.values[value].option.addEventListener("click", updateHides);
        }
    }
}

function bunchCheckboxIsSelected() {return this.option.checked}

// all problem docs are loaded and all metas are declared, make corresponding DOM elements
function show() {
    for (let problem in problems) showProblem(problem);
    updateMetas();
    updateHides();
}

function updateHides() {
    let orMode = andOrButton.selectedIndex == 1, logic = orMode? function(b1, b2) {return b1 || b2}: function(b1, b2) {return b1 && b2};
    for (let problem in problems) if (orMode) problems[problem].div.setAttribute("hide", ""); else problems[problem].div.removeAttribute("hide");
    for (let meta in metas) for (let value in metas[meta].values) if (metas[meta].values[value].isSelected()) for (let problem in problems) {
        // if already shown in or mode or already hidden in and mode then skip
        if (problems[problem].div.hasAttribute("hide") != orMode) continue;
        let doc = problems[problem].doc;
        let metanode = doc.querySelector("problem " + meta);
        if (metanode) {
            let valueNode = doc.querySelector("problem " + meta + " " + value);
            if (valueNode) {
                if (orMode) problems[problem].div.removeAttribute("hide");
            } else {
                if (!orMode) problems[problem].div.setAttribute("hide", "");
            }
        } else {
            // metanode is missing so check if we are looking for the default value
            if (("defaultValue" in metas[meta]) && value == metas[meta].defaultValue) {
                if (orMode) problems[problem].div.removeAttribute("hide");
            } else {
                if (!orMode) problems[problem].div.setAttribute("hide", "");
            }
        }
    }
}

// interact with browser local storage in a fail-safe way
var Store = {};

Store.canStore = function() {return typeof (Storage) !== "undefined"}

Store.fetchInstructorName = function fetchInstructorName(id) {if (Store.canStore()) {
    let realName = localStorage[qual + " instructor " + id];
    if (realName) getBy(instructors, "id", id).setRealName(realName);
}}

Store.saveInstructor = function saveInstructor(id, name) {if (Store.canStore()) {
    localStorage.setItem(qual + " instructor " + id, name);
}}

Store.fetch = function fetch(name) {
    if (Store.canStore()) return localStorage.getItem(name);
}

Store.store = function store(name, value) {
    if (Store.canStore()) localStorage.setItem(name, value);
}

Store.erase = function erase(name) {
    if (Store.canStore()) localStorage.removeItem(name);
}