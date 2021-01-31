
// These appear to be global script variables.

let mainDiv = document.getElementById("problemsSpot"), 
    metaDiv = xmlImporter.element("details", mainDiv, ["class", "metainformation"]), 
    problemsDiv = xmlImporter.element("div", mainDiv, ["class", "problems"]);

let renameIn = xmlImporter.element(
        "input",
        xmlImporter.element("div", metaDiv),
        ["type", "text", "id", "renameIn", "placeholder", "metaName optionName renamed value"]
    );

let selectorIn = xmlImporter.element(
        "input",
        xmlImporter.element("div", metaDiv),
        ["type", "text", "id", "selectorIn", "placeholder", "//metaName/optionName | //problem[not(radioMetaName)]"]
    );

//selectorIn.value = "*";

setUpMetainformation();


// This function creates the input boxes for renaming options and filtering problems with XPath
function setUpMetainformation() {
    xmlImporter.text("Metainformation", xmlImporter.element("summary", metaDiv));
    
    let label = xmlImporter.element("label", null, ["for", "renameIn"]);
    renameIn.parentElement.insertBefore(label, renameIn);
    xmlImporter.text("Locally Rename an Option:", label);
    renameIn.addEventListener("change", tryRename);
    
    label = xmlImporter.element("label", null, ["for", "selectorIn"]);
    selectorIn.parentElement.insertBefore(label, selectorIn);
    xmlImporter.text("XPath to Show/Hide Problems:", label);
    selectorIn.addEventListener("change", updateHides);
}


var problems = {}, metas = {};

// ensure metas has a spot for this meta and its values
function handleMetaNode(node) {
    if (!(node.nodeName in metas)) metas[node.nodeName] = {values: {}, metaType: "checkboxes"}; // default to checkboxes, change later if needed
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


// This is the main function which imports and displays the problems.
function importQual(qualName) {
    xmlImporter.openTextFile(
        "../quals/"+qualName+"/problemsList.txt",
        null,
        function(list) {
            if (list === "") {
                mainDiv.innerHTML = "could not find any problems";
                return mainDiv.innerHTML;
            }
            list = list.split(" ");
            let toGo = list.length;
            for (let problem of list) {
                xmlImporter.openXMLFile(
                    "../quals/"+qualName+"/problems/"+problem+".xml",
                    null,
                    function(doc) {
                        loadProblem(doc);
                        if (--toGo === 0) show();
                    }
                );
            }
            refreshMathJax();
            //alert("Refresh");
        }
    );
}

// if the page was initialized with qualName then this will set up for that qual
try {
    importQual(qualName);
    //refreshMathJax();
} catch (e) {}


function showProblem(problem, showCompleteness = true) {
    let bunch = problems[problem];
    let doc = bunch.doc, problemNode = doc.querySelector("problem"), solutionNode = doc.querySelector("solution");
    bunch.div = xmlImporter.element((showCompleteness && solutionNode)? "details": "div", problemsDiv, ["class", "problem"]);
    if (solutionNode) {
        if (showCompleteness) {
            bunch.summary = xmlImporter.element("summary", bunch.div);
            bunch.summary.innerHTML = "<h5 class=\"id\">"+problem+"</h5><br />"+texAttToInnerHTML(problemNode.getAttribute("tex"));
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

// ensure each meta and option has an element in GUI
function updateMetas() {
    for (let meta in metas) {
        let bunch = metas[meta];
        if (!bunch.div) {
            bunch.div = xmlImporter.element("div", metaDiv, ["class", "metaBunch", "metaType", bunch.metaType]);
            bunch.title = xmlImporter.element("h5", bunch.div, ["class", "metaTitle"]);
            bunch.titleText = xmlImporter.text(meta, bunch.title);
        }
        switch (bunch.metaType) {
            case "checkboxes": case "radio":
                let b = bunch.values[value] = {};
                for (let value in bunch.values) if (!bunch.values[value]) {
                    b.pair = xmlImporter.element("div", bunch.div, ["class", "metaOption"]);
                    b.name = xmlImporter.text(value, xmlImporter.element("span", b.pair));
                    b.alternateName = xmlImporter.text(
                        Store.fetch(qualName + " " + meta + " " + value), 
                        xmlImporter.element("span", b.pair, ["class", "alternateName"])
                    );
                }
            break; case "scale":
                
        }
    }
}

function bunchCheckboxIsSelected() {return this.option.checked}

// all problem docs are loaded and all metas are declared, make corresponding DOM elements
function show() {
    for (let problem in problems) showProblem(problem);
    updateMetas();
    updateHides();
    alert("Show has executed.");
}

function getProblemsFromSelector() {
    let selector = selectorIn.value, returner = {};
    for (let id in problems) {
        try {if (problems[id].doc.evaluate(selector, problems[id].doc, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue) returner[id] = undefined} catch (e) {}
    }
    return returner;
}

// search problems for any node which matches the selector, show if one is found else hide
function updateHides() {
    let shows = getProblemsFromSelector();
    for (let id in problems) {
        if (id in shows) problems[id].div.removeAttribute("hide");
        else problems[id].div.setAttribute("hide", "");
    }
}

function tryRename() {
    let line = renameIn.value, lines = line.split(" ");
    let meta = lines[0], tag = lines[1];
    if (!metas[meta]) return;
    let bunch = metas[meta];
    if (!bunch.values || !(tag in bunch.values)) return inputMessage(renameIn, "cannot find " + tag + " in " + meta);
    let value = line.substring(meta.length + tag.length + 2);
    // just a little fun
    if (value == "Dr. Ian Malcolm") value = "Dr. Ian Malcolm, renowned chaos theorist and proponent of fundamental biological understanding";
    Store.store(qualName + " " + meta + " " + tag, value);
    bunch.values[tag].alternateName.nodeValue = value;
    renameIn.value = "";
}

// interact with browser local storage in a fail-safe way
var Store = {};

Store.canStore = function() {return typeof (Storage) !== "undefined"};

// returns empty string if not saved
Store.fetch = function fetch(name) {
    if (!Store.canStore()) return "";
    let value = localStorage.getItem(name);
    if (typeof value == "string") return value; else return "";
};

Store.store = function store(name, value) {
    if (Store.canStore()) localStorage.setItem(name, value);
};

Store.erase = function erase(name) {
    if (Store.canStore()) localStorage.removeItem(name);
};

// Refreshes MathJax script which typesets LaTeX
function refreshMathJax() {
    try {
        MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
    } 
    catch (e) {}
}