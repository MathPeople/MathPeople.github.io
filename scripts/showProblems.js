//----------------------------------------------------------------------------------------------------------------
// Load css for these show problems
xmlImporter.element("link", document.head, ["rel", "stylesheet", "href", "/css/showProblems.css"]);

function scanAndProcessDOMProblems(element = document) {
    if (typeof qualName !== "string") {
        let link = document.querySelector("link[rel='problems-repository']");
        if (!link) return;
        importProblemsRepository(link.getAttribute("href"), scanAndProcessDOMProblems, function() {alert("cannot find qual "+link.getAttribute("href"))});
        return;
    }
    for (let element of document.querySelectorAll("[problems-repository-xpath], [problems-repository-practice-test]")) processElement(element);
}

function processElement(element) {
    if (element.hasAttribute("problems-repository-xpath")) { // display list of problems
        element.innerHTML = "";
        let showThese = getProblemsFromSelector(element.getAttribute("problems-repository-xpath"));
        for (let problem in showThese) showProblem(problem, element, false);
        typeset(element);
        return;
    }
    if (element.hasAttribute("problems-repository-practice-test")) { // display practice test
        element.innerHTML = "";
        showTest(element.getAttribute("problems-repository-practice-test"), element);
        return;
    }
    console.log("do not know how to process:");
    console.log(element);
}

function showProblem(problem, element, typesetElement = true) {
    let doc = problems[problem].doc, problemNode = doc.querySelector("problem"), solutionNode = doc.querySelector("solution");
    let div;
    if (solutionNode) { // pair mode
        div = xmlImporter.element("details", element, ["class", "problem"]);
        let summary = xmlImporter.element("summary", div);
        xmlImporter.text(xmlImporter.getRoot(doc).nodeName, xmlImporter.element("h6", summary, ["class", "id"]));
        summary.innerHTML += problemNode.getAttribute("tex");
        div.innerHTML += solutionNode.getAttribute("tex");
    } else { // solo act
        div = xmlImporter.element("div", element,["class", "problem"]);
        div.innerHTML = "<h6 class='id'>"+xmlImporter.getRoot(doc).nodeName+"</h6>"+problemNode.getAttribute("tex");
    }
    if (typesetElement) typeset(element);
}

function showTest(practiceTest, loadHere) {
    loadHere.appendChild(practiceTests[practiceTest].div);
}