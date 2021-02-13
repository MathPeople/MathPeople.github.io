/*
    This script is for displaying the problems. The main function which you have to call to use this is updateShows(), which goes through the current problems/metas repository and makes sure everything is displayed.
*/

//----------------------------------------------------------------------------------------------------------------
// Load css for these show problems
xmlImporter.element("link", document.head, ["rel", "stylesheet", "href", "/css/showProblems.css"]);
//----------------------------------------------------------------------------------------------------------------
// Initialize where in the documents problems will load, creating div tags for "metainformation" and "problems"
//      Locate this spot using the <div id="problemsSpot"/> tag
let mainDiv = document.getElementById("problemsSpot"),
    metaDiv = xmlImporter.element("details", mainDiv, ["class", "metainformation"]),
    problemsDiv = xmlImporter.element("div", mainDiv, ["class", "problems"]);
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
// Set up information box with its gui elements
// First the globally accessible elements have to be declared...
let renameIn, selectorIn;
// Now do the setting up
{
    xmlImporter.text("Metainformation", xmlImporter.element("summary", metaDiv));
    
    // renameIn is for soft renaming of metainformation (e.g. instructor names)
    renameIn = xmlImporter.element(
        "input",
        xmlImporter.element("div", metaDiv),
        ["type", "text", "id", "renameIn", "placeholder", "metaName optionName renamed value"]
    );
    renameIn.addEventListener("change", tryRename);
    let label = xmlImporter.element("label", null, ["for", "renameIn"]);
    renameIn.parentElement.insertBefore(label, renameIn);
    xmlImporter.text("Soft Rename an Option (e.g. instructor names):", label);
    
    selectorIn = xmlImporter.element(
        "input",
        xmlImporter.element("div", metaDiv),
        ["type", "text", "id", "selectorIn", "placeholder", "//metaName/optionName | //problem[not(radioMetaName)]"]
    );
    selectorIn.addEventListener("change", updateHides);
    selectorIn.value = "*"; // ensures that all problems will display initially
    label = xmlImporter.element("label", null, ["for", "selectorIn"]);
    selectorIn.parentElement.insertBefore(label, selectorIn);
    label.innerHTML = "<a href='https://github.com/MathPeople/MathPeople.github.io/wiki/XPath'>XPath</a> to Show/Hide Problems:";
}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
// Work in progress; intended to create html selection tags for meta options
// function createSelectionBoxes(){
//     // let metaObject;
//     // let outputString = "";
//     // for (let meta in metas){ // For each different metainformation option...
//     //     alert(meta);
//     //     metaObject = metas[meta];
//     //     for(let option in metaObject.values){
            
//     //     }
//     // }

//     // for (let meta in metas) {
//     //     let bunch = metas[meta];
//     //     if (!bunch.div) {
//     //         bunch.div = xmlImporter.element("div", metaDiv, ["class", "metaBunch", "metaType", bunch.metaType]);
//     //         bunch.title = xmlImporter.element("h5", bunch.div, ["class", "metaTitle"]);
//     //         bunch.titleText = xmlImporter.text(meta, bunch.title);
//     //     }
//     //     switch (bunch.metaType) {
//     //         case "checkboxes": // Remark: This case will also run the checkboxes, as there is no break statement. I do not know if this is intentional
//     //         case "radio":
//     //             let b = bunch.values[value] = {};
//     //             for (let value in bunch.values) if (!bunch.values[value]) {
//     //                 b.pair = xmlImporter.element("div", bunch.div, ["class", "metaOption"]);
//     //                 b.name = xmlImporter.text(value, xmlImporter.element("span", b.pair));
//     //                 b.alternateName = xmlImporter.text(
//     //                     Store.fetch(qualName + " " + meta + " " + value), 
//     //                     xmlImporter.element("span", b.pair, ["class", "alternateName"])
//     //                 );
//     //             }
//     //             break; 
//     //         case "scale":
//     //     }
//     // }
// }

//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
// Display and typeset this problem
function showProblem(problem) {
    let bunch = problems[problem];
    let doc = bunch.doc, problemNode = doc.querySelector("problem"), solutionNode = doc.querySelector("solution");
    // remove the old display if it was previously shown
    if (bunch.div) bunch.div.parentElement.removeChild(bunch.div);
    bunch.div = xmlImporter.element((solutionNode)? "details": "div", problemsDiv, ["class", "problem"]);
    if (solutionNode) {
        bunch.summary = xmlImporter.element("summary", bunch.div);
        bunch.summary.innerHTML = "<h5 class=\"id\">"+problem+"</h5><br>"+texAttToInnerHTML(problemNode.getAttribute("tex"));
        bunch.div.innerHTML += texAttToInnerHTML(solutionNode.getAttribute("tex"));
    } else bunch.div.innerHTML = texAttToInnerHTML(problemNode.getAttribute("tex"));
    // set unfinished attribute depending on solutionCompleteness, this colors the border of unfinished and partially finished problems
    if (!doc.querySelector("solutionCompleteness")) bunch.div.setAttribute("unfinished", "");
    else if (doc.querySelector("solutionCompleteness > partial")) bunch.div.setAttribute("unfinished", "partial");
    // just a little fun
    for (let a of document.querySelectorAll("[href=\"https://ncatlab.org/nlab/show/Fubini+theorem\"]")) xmlImporter.rickRollLink(a);
    typeset(bunch.div);
}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
// Override to include removing from DOM
{
    let oldEraseProblem = eraseProblem;
    eraseProblem = function eraseProblem(problem) {
        let bunch = problems[problem];
        if (bunch.div) bunch.div.parentElement.removeChild(bunch.div);
        oldEraseProblem(problem);
    }
}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
/*
    This populates the metainformation GUI elements. They are not currently interactive, they just show every value which has been discovered in the problems. Checkbox and radio display the same way as a list of possible values, and scale shows the highest discovered value.
*/
// Ensure each meta and option has an element in GUI
function updateMetas() {
    for (let meta in metas) {
        let bunch = metas[meta];
        if (!bunch.div) {
            bunch.div = xmlImporter.element("div", metaDiv, ["class", "metaBunch", "metaType", bunch.metaType]);
            bunch.title = xmlImporter.element("h5", bunch.div, ["class", "metaTitle"]);
            bunch.titleText = xmlImporter.text(meta, bunch.title);
            if (bunch.metaType === "scale") bunch.maxValueOut = xmlImporter.text(bunch.maxValue, xmlImporter.element("span", bunch.div));
        }
        switch (bunch.metaType) {
            case "checkboxes": // checkbox and radio display the same way
            case "radio":
                for (let value in bunch.values) if (!bunch.values[value]) {
                    b = bunch.values[value] = {};
                    b.pair = xmlImporter.element("div", bunch.div, ["class", "metaOption"]);
                    b.name = xmlImporter.text(value, xmlImporter.element("span", b.pair));
                    b.alternateName = xmlImporter.text(
                        Store.fetch(qualName + " " + meta + " " + value), 
                        xmlImporter.element("span", b.pair, ["class", "alternateName"])
                    );
                    if (bunch.defaultValue === value) b.name.parentElement.setAttribute("default", "");
                }
                break; 
            case "scale":
                bunch.maxValueOut.nodeValue = bunch.maxValue;
        }
    }
}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
// make sure every problem is displayed, all the metainformation is updated, and the proper problems are hidden
function updateShows() {
    // halt jax typesetting while we do this
    holdJax = true;
    for (let problem in problems) showProblem(problem);
    holdJax = false;
}

//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
// search problems for any node which matches the selector, show if one is found else hide
function updateHides() {
    let shows = getProblemsFromSelector(selectorIn.value);
    for (let id in problems) {
        if (id in shows) problems[id].div.removeAttribute("hide");
        else problems[id].div.setAttribute("hide", "");
    }
}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
// make sure every problem is displayed, all the metainformation is updated, and the proper problems are hidden
function refresh() {
    updateMetas();
    updateShows();
    updateHides();
}
// In case a problems repository is already imported. This is timeoutted for performance.
window.setTimeout(refresh, 1000);
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
//
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
//----------------------------------------------------------------------------------------------------------------