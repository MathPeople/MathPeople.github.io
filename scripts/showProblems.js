//----------------------------------------------------------------------------------------------------------------
// Load css for these show problems
xmlImporter.element("link", document.head, ["rel", "stylesheet", "href", "/css/showProblems.css"]);

// search through element for any nodes which are set up to be filled with problems stuff and them process them
function scanAndProcessDOMProblems(element = document) {
    if (typeof qualName !== "string") {
        let link = document.querySelector("link[rel='problems-repository']");
        if (!link) return;
        importProblemsRepository(link.getAttribute("href"), scanAndProcessDOMProblems, function() {alert("cannot find qual "+link.getAttribute("href"))});
        return;
    }
    for (let element of document.querySelectorAll("[problems-repository-xpath], [problems-repository-practice-test]")) processElement(element);
}

// take a single node which is set up to be filled with problems stuff and process it
function processElement(element) {
    // clear element
    element.innerHTML = "";
    
    // add the search bar if requested
    if (element.hasAttribute("problems-repository-searchable")) makeSearchable(element);
    
    if (element.hasAttribute("problems-repository-xpath")) { // display list of problems
        let showThese = getProblemsFromSelector(element.getAttribute("problems-repository-xpath"));
        for (let problem in showThese) showProblem(problem, element);
    } else if (element.hasAttribute("problems-repository-practice-test")) { // display practice test
        showTest(element.getAttribute("problems-repository-practice-test"), element);
    } else {
        element.innerHTML += "do not know how to process this element";
    }
}

// display the problem in element, following the rules declared on element
function showProblem(problem, element) {
    // declaring things which are used throughout the displaying process
    let doc = problems[problem].doc, problemNode = doc.querySelector("problem"), solutionNode = doc.querySelector("solution");
    let div;
    
    // typesetting options
    let displayMode = "default";
    if (element.hasAttribute("problems-repository-display-mode")) displayMode = element.getAttribute("problems-repository-display-mode");
    
    // do the displaying
    switch (displayMode) {
        case "default": default:
            // Default is to put in a details whose summary is the problem and whose contents is the solution. Solo act is not a details but is instead just a div with the contents.
            if (solutionNode) { // pair mode
                div = xmlImporter.element("details", element, ["class", "problem"]);
                
                // problem title
                let summary = xmlImporter.element("summary", div);
                xmlImporter.text(xmlImporter.getRoot(doc).nodeName, xmlImporter.element("h6", summary, ["class", "id"]));
                
                summary.innerHTML += problemNode.getAttribute("tex"); // problem tex
                div.innerHTML += solutionNode.getAttribute("tex"); // solution tex
            } else { // solo act
                div = xmlImporter.element("div", element,["class", "problem"]);
                div.innerHTML = "<h6 class='id'>"+xmlImporter.getRoot(doc).nodeName+"</h6>"+problemNode.getAttribute("tex");
            }
        break; case "questiononly":
            // just a div with the problem
            div = xmlImporter.element("div", element,["class", "problem"]);
            div.innerHTML = "<h6 class='id'>"+xmlImporter.getRoot(doc).nodeName+"</h6>"+problemNode.getAttribute("tex");
        break; case "solutiononly":
            // just a div with the solution, or the empty string if no solution is saved
            div = xmlImporter.element("div", element,["class", "problem"]);
            div.innerHTML = "<h6 class='id'>"+xmlImporter.getRoot(doc).nodeName+" Solution</h6>"+(solutionNode? solutionNode.getAttribute("tex"): "");
    }
    
    // set some information on this div which identifies its contents
    div.setAttribute("problems-repository-problem", problem);
    
    typeset(div);
}

// add a search bar based on the problems-repository-searchable attribute
function makeSearchable(element) {
    let input = xmlImporter.labeledInput(
        "XPath Search",
        element,
        xmlImporter.getNewId(),
        ["change", searchbarListener(element)],
        ["class", "searchbar"]
    );
    input.value = element.getAttribute("problems-repository-searchable");
}

// element is the element whose children are problems, this function returns the listener for a search bar input corresponding to element
function searchbarListener(element) {
    return function(e) {
        let input = e.target;
        let showThese = getProblemsFromSelector(input.value);
        for (let child of element.childNodes) {
            if (child.hasAttribute("problems-repository-problem")) {
                if (child.getAttribute("problems-repository-problem") in showThese) child.removeAttribute("hide");
                else child.setAttribute("hide", "");
            }
        }
    }
}

// add a standard test widget to loadHere corresponding to practiceTest
function showTest(practiceTest, loadHere) {
    loadHere.appendChild(practiceTests[practiceTest].div);
}