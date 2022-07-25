/* 
    This file contains functions necessary to load problems from the XML files. 

*/

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

// --- Practice Test Loading ---

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

// Parse an XML file into an Object 
/* 
From https://stackoverflow.com/questions/4200913/xml-to-javascript-object

Description by author Maylow Hayes:

"The following function parses XML and returns a JavaScript object with a scheme that corresponds to the XML. XML siblings w/ the same name are collapsed into arrays. nodes with names that can be found in the arrayTags parameter (array of tag name strings) always yield arrays even in case of only one tag occurrence. arrayTags can be omitted. Text nodes with only spaces are discarded."
*/
function parseXml(xml, arrayTags) {
    let dom = null;
    if (window.DOMParser) dom = (new DOMParser()).parseFromString(xml, "text/xml");
    else if (window.ActiveXObject) {
        dom = new ActiveXObject('Microsoft.XMLDOM');
        dom.async = false;
        if (!dom.loadXML(xml)) throw dom.parseError.reason + " " + dom.parseError.srcText;
    }
    else throw new Error("cannot parse xml string!");

    function parseNode(xmlNode, result) {
        if (xmlNode.nodeName == "#text") {
            let v = xmlNode.nodeValue;
            if (v.trim()) result['#text'] = v;
            return;
        }

        let jsonNode = {},
            existing = result[xmlNode.nodeName];
        if (existing) {
            if (!Array.isArray(existing)) result[xmlNode.nodeName] = [existing, jsonNode];
            else result[xmlNode.nodeName].push(jsonNode);
        }
        else {
            if (arrayTags && arrayTags.indexOf(xmlNode.nodeName) != -1) result[xmlNode.nodeName] = [jsonNode];
            else result[xmlNode.nodeName] = jsonNode;
        }

        if (xmlNode.attributes) for (let attribute of xmlNode.attributes) jsonNode[attribute.nodeName] = attribute.nodeValue;

        for (let node of xmlNode.childNodes) parseNode(node, jsonNode);
    }

    let result = {};
    for (let node of dom.childNodes) parseNode(node, result);

    return result;
}

//----------------------------------------------------------------------------------------------------------------