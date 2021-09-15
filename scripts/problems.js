/*
    This script is used for the foundational infrastructure of importing a problems repository. That is, it fetches the problems from the server and sets them up in the local holder object. It also has the functionality of collecting all the metainformation and executing the XPath searches.
    
    In an effort to automate page design, this script will load things it needs. It loads xmlImporter.js, jax.js, and practiceTests.js every time. If a DOM element with id "problemsSpot" is found, it will load showProblems.js and import the qual saved as the qual attribute on that DOM element. If a DOM element with id "editor" is found, it will load editor.js and prepare for editor mode. If values are given for page hiding during a test, it loads pageHider.js.
    
    This script also interacts with local storage. Other scripts can just use the infrastructure here.
*/

// Autoloading of other scripts
// Start with xmlImporter so that we can use its functionality to autoload the rest
let loader = document.createElement("script");
loader.setAttribute("type", "text/javascript");
loader.setAttribute("src", "/scripts/xmlImporter.js");
loader.addEventListener("load", function() {
    loadScript("jax", function() {
        loadScript("practiceTests", function() {
            loadScript("showProblems", start);
        });
    });
});
document.head.appendChild(loader);

// shortcut for loading a script, adds the location prefix/suffix too
function loadScript(location, finished = function() {}) {
    xmlImporter.element(
        "script",
        document.head,
        ["type", "text/javascript",
         "src", "/scripts/"+location+".js"]
    ).addEventListener("load", finished);
}

// Initialize the holding object for problems and for metainformation types
var problems = {}, metas = {}, practiceTests = {};

// Used for interacting with local storage
var Store = {};
setupLocalStorage();

/*
    Structure of a metanode is described in the wiki.
    
    There are three types of metainformation: checkbox, radio, and scale. Checkbox has child nodes, one for each value, where the values are the names of the child nodes. Radio has one child node whose name is the value. Scale has only the `scale` attribute on the metanode itself.
    
    Checkbox is the default type because it is the structurally simplest.
*/

// Ensure metas holder object has a spot for this meta and its values
function handleMetaNode(node) {
    let introducedNewType, newMetaValues = {};
    if (!(node.nodeName in metas)) {
        introducedNewType = true;
        metas[node.nodeName] = {values: {}, metaType: "checkbox"}; // default to checkbox, change later if needed
    }
    let bunch = metas[node.nodeName], value = node.firstChild, numValues = 0; // count number of values to later make sure it is 1 in case this is a radio type
    while (value) {
        if (!(value.nodeName in bunch.values)) {
            newMetaValues[value.nodeName] = undefined;
            bunch.values[value.nodeName] = undefined;
        }
        value = value.nextSibling;
        ++numValues;
    }
    if (node.hasAttribute("radio")) {
        if (numValues !== 1) throw Error("radio must have one and only one child node but this radio has " + numValues + " children");
        bunch.metaType = "radio"; // recognize this value
        if (!(node.getAttribute("radio") in bunch.values)) {
            bunch.values[node.getAttribute("radio")] = undefined; // set the default value
            bunch.defaultValue = node.getAttribute("radio");
            newMetaValues[node.getAttribute("radio")] = undefined;
        }
    } else if (node.hasAttribute("scale")) {
        if (numValues !== 0) throw Error("scale metainformation cannot have any child nodes but this one has " + numValues + " children");
        bunch.metaType = "scale";
        if (typeof bunch.maxValue !== "number") bunch.maxValue = 0;
        bunch.maxValue = Math.max(bunch.maxValue, node.getAttribute("scale"));
    }
    if (introducedNewType || !isEmpty(newMetaValues)) addingMetaOverride(node.nodeName, newMetaValues);
}
function addingMetaOverride() {}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
/*
    Problems holds the doc for each problem, indexed by id (root node name). This doc is always assumed to be mutable so don't cache information from it, instead query the doc whenever information has to be gathered from the problem, information such as metainformation or TeX for problem/solution.
*/

// Import problem from XML doc and update problems and metas acordingly. Pass a function in as convertDoc if you want to convert the doc before loading it.
function loadProblem(doc, convertDoc) {
    if (convertDoc) doc = convertDoc(doc);
    let problem = xmlImporter.getRoot(doc).nodeName;
    if (problem in problems) eraseProblem(problem);
    problems[problem] = {doc: doc};
    let problemNode = doc.querySelector("problem");
    if (problemNode) {
        let meta = problemNode.firstChild;
        while (meta) {
            handleMetaNode(meta);
            meta = meta.nextSibling;
        }
    }
    loadProblemOverride(problem);
}
function loadProblemOverride() {}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
var qualName;
// Import the problems from a repository, storing the docs and populating metas with the encountered values.
function importProblemsRepository(qual, onSuccess = function() {}, onfail = function() {}) {
    let allLoaded = {
        problems: false,
        tests: false
    };
    function checkIfAllLoaded() {
        for (let stage in allLoaded) if (!allLoaded[stage]) return;
        onSuccess();
        afterProblemsAreSet();
    }
    qualName = qual; // globally declare that this is the loaded qual
    xmlImporter.openTextFile(
        "/quals/"+qual+"/problemsList.txt",               // File to open-- the problem list for a given qual

        null,                                                   // Parameters to pass to the function below; here no additional

        function(list) {                                        // Function to be run after fetching text, if the request is successful
            if (list === "") {                                  //      "list" will be the problems retreived
                mainDiv.innerHTML = "could not find any problems";
                return;
            }
            list = list.split(" ");
            let toGo = list.length;
            for (let problem of list) {
                xmlImporter.openXMLFile(
                    "/quals/"+qual+"/problems/"+problem+".xml",
                    null,
                    function(doc) {
                        holdJax = true;
                        loadProblem(doc);
                        if (--toGo === 0) {
                            allLoaded.problems = true;
                            checkIfAllLoaded();
                        }
                    }
                );
            }
        }, function() {
            qualName = undefined; // the qual failed so don't say it is loaded
            onfail();
        }
    );
    xmlImporter.openTextFile(
        "/quals/"+qual+"/practiceTestsList.txt",
        null,
        function(list) {
            if (list === "") return; // no practice tests to load
            list = list.split(" ");
            let toGo = list.length;
            for (let practiceTest of list) {
                xmlImporter.openXMLFile(
                    "/quals/"+qual+"/practiceTests/"+practiceTest+".xml",
                    null,
                    function(doc) {
                        loadPracticeTest(doc);
                        if (--toGo === 0) {
                            allLoaded.tests = true;
                            checkIfAllLoaded();
                        }
                    }
                );
            }
        }, function() {
            // no practice tests found
        }
    );
}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
// things which use the whole problems set
function afterProblemsAreSet() {
    holdJax = false;
    cleanupMetainformation();
    afterProblemsAreSetOverride();
}
function afterProblemsAreSetOverride() {}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
let practiceTestsLoadHere = null;
function loadPracticeTest(configDoc) {
    let root = xmlImporter.getRoot(configDoc);
    let config = practiceTests[root.nodeName] = {};
    config.doc = configDoc;
    config.name = root.nodeName;
    config.displayName = root.hasAttribute("displayName")? root.getAttribute("displayName"): root.nodeName;
    config.div = xmlImporter.makeDetails(config.displayName, practiceTestsLoadHere, true, ["class", "practicetestholder"]);
    config.button = xmlImporter.makeButton("new test", config.div, "practiceTestMakeTestButton-"+config.name, function() {makeTest(config)});
    config.errorOutPlace = xmlImporter.element("div", config.div, ["class", "errorout"]);
    config.testOut = xmlImporter.element("div", config.div, ["class", "testout", "hide", ""]);
    xmlImporter.text("test goes here", config.test = xmlImporter.element("div", config.testOut));
    loadPracticeTestOverride(config);
}
function loadPracticeTestOverride() {}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
function practiceTestErrorOut(config, message) {
    config.errorOutPlace.innerHTML = message;
    config.testOut.setAttribute("hide", "");
}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
function makeTest(config) {
    practiceTestErrorOut(config, "");
    config.countSpot = xmlImporter.element("p", config.div);
    config.putTestCountHere = xmlImporter.text("tries left", config.countSpot);
    makePracticeTest(problems, config);
}

function processPracticeTest(config, result, success) {
    if (success) {
        let oldTest = config.test;
        config.test = result;
        config.testOut.replaceChild(config.test, oldTest);
        practiceTestErrorOut(config, "");
        config.testOut.removeAttribute("hide");
    } else {
        practiceTestErrorOut(config, result);
    }
    typeset(config.testOut);
    config.putTestCountHere = undefined;
    config.div.removeChild(config.countSpot);
    config.countSpot = config.putTestCountHere = undefined;
}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
function erasePracticeTest(config) {
    if (config.div.parentElement) config.div.parentElement.removeChild(config.div);
    delete practiceTests[config.name];
    erasePracticeTestOverride(config);
}
function erasePracticeTestOverride() {}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
let currentlyErasing;
function eraseProblem(problem) {
    currentlyErasing = problem;
    eraseProblemOverride(problem);
    delete problems[problem];
    currentlyErasing = undefined;
}
function eraseProblemOverride(problem) {}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
// Checks if a metainformation is in use and if not then it erases it. Returns whether something was erased.
function tryEraseMetainformation(metaType, metaValue) {
    if (typeof metaValue === "string") {
        // special case for default radio value
        if (metas[metaType].metaType === "radio" && metaValue === metas[metaType].defaultValue) return tryEraseMetainformation(metaType);
        // erasing just the value
        if (isEmpty(getProblemsFromSelector("//problem/"+metaType+"/"+metaValue))) {
            erasePartMetainformation(metaType, metaValue);
            return true;
        }
    } else {
        // erasing the whole metainformation
        if (isEmpty(getProblemsFromSelector("//problem/"+metaType))) {
            eraseWholeMetainformation(metaType);
            return true;
        }
    }
    return false;
}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
function eraseWholeMetainformation(metaType) {
    eraseWholeMetainformationOverride(metaType);
    delete metas[metaType];
}
function eraseWholeMetainformationOverride() {}
function erasePartMetainformation(metaType, metaValue) {
    erasePartMetainformationOverride(metaType, metaValue);
    delete metas[metaType].values[metaValue];
}
function erasePartMetainformationOverride() {}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
// find any unused metainformation and erase them
function cleanupMetainformation() {
    for (let meta in metas) if (!tryEraseMetainformation(meta)) if (metas[meta].values) for (let value in metas[meta].values) tryEraseMetainformation(meta, value);
}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
// Find which problems out of theseProblems match the XPath selector.
function getProblemsFromSelector(selector, theseProblems = problems) {
    let returner = {};
    for (let id in theseProblems) {
        try {
            if (theseProblems[id].doc.evaluate( // structure of this function documented in MDN
                selector,
                theseProblems[id].doc,
                null,
                XPathResult.ANY_UNORDERED_NODE_TYPE, // any node match is a successful match
                null
            ).singleNodeValue)
                returner[id] = undefined; // save this problem as matched
        } catch (e) {}
    }
    return returner;
}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
// xmlImporter.js, jax.js, and practiceTests.js are all loaded so see what application we are being used in and start that application.
function start() {
    if (document.getElementById("editor")) {
        // set up editor
        loadScript("editor");
        return;
    }
    scanAndProcessDOMProblems();
    // any other applications beyond the two already created can be linked in here
}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
// checks if an object has any properties
function isEmpty(o) {
    return Object.keys(o).length === 0;
}

function sortedProperties(object) {
    if (isEmpty(object)) return "";
    let list = [];
    for (let prop in object) list.push(prop);
    list.sort();
    let returner = "";
    for (let prop of list) returner += " " + prop;
    return returner.substring(1);
}

// get ids of all loaded problems
function problemsListString() {
    let copy  = {};
    for (let problem in problems) if (problem !== "changeMe" && problem !== currentlyErasing) copy[problem] = undefined;
    return sortedProperties(copy);
}

function practiceTestsListString() {
    return sortedProperties(practiceTests);
}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
// Sets up a browser local storage object used here and elsewhere to interact with browser local storage in a fail-safe way
function setupLocalStorage() {

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
    
    Store.move = function move(oldName, newName) {
        if (oldName === newName) return;
        Store.store(newName, Store.fetch(oldName));
        Store.erase(oldName);
    }
    
    Store.eraseAll = function eraseAll() {
        if (Store.canStore()) localStorage.clear();
    }
}
//----------------------------------------------------------------------------------------------------------------
let globalErrorOut = document.createElement("p");
window.setTimeout(function() {document.body.appendChild(globalErrorOut)}, 2000);
globalErrorOut.setAttribute("id", "globalErrorOut");
window.addEventListener("error", function(e) {
    globalErrorOut.innerHTML = "<pre class='message'>"+e.error.message+"</pre><pre class='stack'>"+e.error.stack+"</pre>";
});

function clearErrorOut() {
    globalErrorOut.innerHTML = "";
}