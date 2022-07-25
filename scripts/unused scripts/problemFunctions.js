/*
    This script is used for the foundational infrastructure of importing a problems repository. That is, it fetches the problems from the server and sets them up in the local holder object. It also has the functionality of collecting all the metainformation and executing the XPath searches.
    
    In an effort to automate page design, this script will load things it needs. It loads xmlImporter.js, jax.js, and practiceTests.js every time. If a DOM element with id "problemsSpot" is found, it will load showProblems.js and import the qual saved as the qual attribute on that DOM element. If a DOM element with id "editor" is found, it will load editor.js and prepare for editor mode. If values are given for page hiding during a test, it loads pageHider.js.
    
    This script also interacts with local storage. Other scripts can just use the infrastructure here.
*/

// Initialize the holding object for problems and for metainformation types
var problems = {}, metas = {}, practiceTests = {};

// Used for interacting with local storage
var Store = {};
setupLocalStorage();



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
    };
    
    Store.eraseAll = function eraseAll() {
        if (Store.canStore()) localStorage.clear();
    };
}


function clearErrorOut() {
    globalErrorOut.innerHTML = "";
}




// Functions which display the problems, metas, and practicetests arrays
function printProblemsArray(docID){
    document.getElementById(docID).innerHTML = JSON.stringify(problems);
    console.log(JSON.stringify(problems));
}

function printMetasArray(docID){
    document.getElementById(docID).innerHTML = JSON.stringify(metas);
    console.log(JSON.stringify(metas));
}





// Miscellaneous functions used only for debugging. Delete when development is done

function initSearchData() {
    let myProblems = getProblemsFromSelector("//topics[and RiemannSurfaces]",problems);

    console.log(JSON.stringify(myProblems));
}

function doStuff() {
    
    // Print a JSON file to the console
    // fetch("/quals/complex/problemsJSON/ArgumentPrinciple.json")
    // .then(response => {
    // return response.json();
    // })
    // .then(jsondata => console.log(jsondata));

    

    // var xhttp = new XMLHttpRequest();
    // xhttp.onreadystatechange = function() {
    //     if (this.readyState == 4 && this.status == 200) {
    //         myFunction(this);
    //     }
    // };
    // xhttp.open("GET", "../quals/complex/problems/ArgumentPrinciple.xml", true);
    // xhttp.send();

    // function myFunction(xml) {
    //     var x, i, xmlDoc, txt;
    //     xmlDoc = xml.responseXML;
    //     txt = "";
    //     x = xmlDoc.getElementsByTagName('problem');
    //     for (i = 0; i < x.length; i++) {
    //         txt += x[i].getAttribute('tex') + "<br>";
    //     }
    //     document.getElementById("displayhere").innerHTML = txt;
    // }

    console.log(JSON.stringify(problems));

    //console.log(problems[0].getElementsByTagName("problem").getAttribute("tex"));
}

// Functions which display the problems, metas, and practicetests arrays
function printProblemsArray(docID){
    document.getElementById(docID).innerHTML = JSON.stringify(problems);
    console.log(JSON.stringify(problems));
}

function printMetasArray(docID){
    document.getElementById(docID).innerHTML = JSON.stringify(metas);
    console.log(JSON.stringify(metas));
}