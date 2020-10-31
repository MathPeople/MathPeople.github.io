function checkAndHideDuringTest() {
    if((Date.now() > 1601481600000) && (Date.now() < 1601492400000)) document.body.innerHTML = "Good luck on the test!"; 
}
checkAndHideDuringTest();
window.setInterval(checkAndHideDuringTest, 100000);

for (let e of document.querySelectorAll("[filePrefix]")) for (let att of  e.getAttribute("filePrefix").split(" ")) {
    e.setAttribute(att, filePrefix + e.getAttribute(att));
}

var problemsLoaderButton = document.getElementById("problemsLoader"),
    theoremsLoaderButton = document.getElementById("theoremsLoader"),
    topicsPlace = document.getElementById("topics"),
    newTopicIn = document.getElementById("newTopic"),
    topicp = document.getElementById("topicp"),
    idP = document.getElementById("idP"),
    idSpan = document.getElementById("idSpan"),
    instructorsPlace = document.getElementById("instructors"),
    solutionFull = document.getElementById("solutionFull"),
    solutionPartial = document.getElementById("solutionPartial"),
    solutionNone = document.getElementById("solutionNone"),
    texProblem = document.getElementById("texProblem"),
    texSolution = document.getElementById("texSolution"),
    texOut = document.getElementById("texOut"),
    texLiveOut = document.getElementById("texLiveOut"),
    enteringLaTeX = document.getElementById("enteringLaTeX"),
    clearTexButton = document.getElementById("clearTex"),
    problemsSection = document.getElementById("problemsSection"),
    problemsPlace = document.getElementById("problems"),
    theoremsSection = document.getElementById("theoremsSection"),
    problemsHide = document.getElementById("problemsHide"),
    metainformation = document.getElementById("metainformation"),
    metainformationTex = document.getElementById("metainformationTex"),
    metainformationProblems = document.getElementById("metainformationProblems"),
    testDiv = document.getElementById("practiceTest"),
    practiceTestSection = document.getElementById("practiceTestSection");
    newTestButton = document.getElementById("makePracticeTest");

// set event listeners
{
    let initialRender = function() {
        window.setTimeout(fixTex, 100);
        enteringLaTeX.removeEventListener("click", initialRender);
        enteringLaTeX.addEventListener("click", function() {
            claimNode(metainformationTex, metainformation);
            metainformation.mode = "enteringLaTeX";
        })
    }

    function setListener(element, type, func) {
        try {
            element.addEventListener(type, func);
        } catch (e) {}
    }

    setListener(problemsLoaderButton, "click", function(e) {
        e = e.target;
        e.parentElement.removeChild(e);
        loadFromList("problems", problemsLoader);
    });
    setListener(theoremsLoaderButton, "click", function(e) {
        e = e.target;
        e.parentElement.removeChild(e);
        loadFromList("theorems", theoremsLoader);
    });
    setListener(newTopicIn, "change", function() {
        let line = newTopicIn.value;
        if (!goodTagName(line)) {
            if (line == "") return;
            return inputMessage(newTopicIn, "invalid name");
        }
        if (topicp.isOnRemove) {
            try {
                removeTopic(line);
            } catch (e) {
                return inputMessage(newTopicIn, e.message);
            }
            newTopicIn.value = "";
        } else {
            try {
                newTopic(line);
                newTopicIn.value="";
            } catch (e) {
                return inputMessage(newTopicIn, e.message);
            }
        }
    });
    setListener(topicp, "click", function(e) {
        e.stopPropagation();
        topicp.blur();
        topicp.isOnRemove = ! topicp.isOnRemove;
        if (topicp.isOnRemove) {
            topicp.firstChild.nodeValue = "Remove topic:";
            newTopicIn.setAttribute("placeholder", "topic you wish to remove from the list above");
        } else {
            topicp.firstChild.nodeValue = "New topic:";
            newTopicIn.setAttribute("placeholder", "other topic which some problems may or may not include");
            newTopicIn.value = "";
        }
    });
    setListener(enteringLaTeX, "click", initialRender);
    setListener(clearTexButton, "click", clearTex);
    setListener(texOut, "click", copyTex);
    setListener(problemsSection, "click", function() {
        claimNode(metainformationProblems, metainformation)
        metainformation.mode = "problemsSection";
    });

    for (let e of [texProblem, texSolution]) setListener(e, "input", fixTex);
    for (let e of [solutionFull, solutionPartial, solutionNone]) setListener(e, "change", changeInMetainformation);

    function fixTextHeight(element) {
        element.style.height = "5px";
        element.style.height = (element.scrollHeight)+"px";
    }

    for (let textarea of document.getElementsByTagName("textarea")) {
        setListener(textarea, "input", function() {fixTextHeight(textarea)});
        setListener(textarea, "change", function() {fixTextHeight(textarea)});
    }
    
    newTestButton.addEventListener("click", makePracticeTest);
}

function claimNode(newParent, child) {
    newParent.appendChild(child);
}

var pairs = {}, problems = {};
var serializer = new XMLSerializer();

function problemsLoader(skip, details, id) {
    details.titleSpot.nodeValue = id + ":";
    problemsPlace.appendChild(details);
    problems[id] = {details: details, id: id, topics: {}, instructors: {}};
    let meta = details.xml.querySelector("topics");
    if (meta) for (let topic of meta.childNodes) problems[id].topics[topic.nodeName] = true;
    meta = details.xml.querySelector("instructors");
    if (meta) for (let instructor of meta.childNodes) problems[id].instructors[instructor.nodeName] = true;
}

function theoremsLoader(theorems, details, id) {
    let theorem = details.xml.querySelector("theorem").firstChild.nodeValue;
    let outerDetails = document.createElement("details");
    theorems.appendChild(outerDetails);
    outerDetails.setAttribute("class", "problems");
    let summary = document.createElement("summary");
    outerDetails.appendChild(summary);
    summary.appendChild(document.createTextNode(theorem + " (" + id + ")"));
    outerDetails.appendChild(details);
    let proof = document.createElement("p");
    details.insertBefore(proof, details.firstChild.nextSibling);
    proof.appendChild(document.createTextNode("Proof:"));
}

function loadFromList(type, alter = function(loadHere, details, id) {loadHere.appendChild(details)}) {
    let list = document.getElementById(type);
    let req = new XMLHttpRequest();
    req.open("GET", filePrefix + "qual/" + type + "List.txt");
    req.overrideMimeType("text/plain");
    req.onload = function() {
        list.hasBeenLoaded = true;
        let line = req.responseText.split(" ");
        for (let single of line) {
            let req2 = new XMLHttpRequest();
            req2.open("GET", filePrefix + "qual/" + type + "/" + single + ".txt");
            req2.overrideMimeType("text/plain");
            req2.onload = function() {
                alter(list, loadPair(((new DOMParser()).parseFromString("<?xml version=\"1.0\" encoding=\"UTF-8\"?><root>" + single + ": " + req2.responseText + "</root>", "text/xml")), type, single), single);
            }
            req2.send();
        }
    }
    req.send();
}

function loadPair(xml, type, id) {
    let returner = document.createElement("details");
    returner.xml = xml;
    returner.setAttribute("class", type);
    let summary = document.createElement("summary");
    returner.appendChild(summary);
    let sSpan = document.createElement("span");
    summary.appendChild(sSpan);
    let sSpanText = document.createTextNode("");
    sSpan.appendChild(sSpanText);
    returner.titleSpot = sSpanText;
    let sDiv = document.createElement("div");
    summary.appendChild(sDiv);
    let problem = xml.querySelector("problem");
    let child = problem.firstChild;
    while (child) {
        sDiv.appendChild(child.cloneNode(true));
        child = child.nextSibling;
    }
    let solution = xml.querySelector("solution");
    child = solution.firstChild;
    while (child) {
        returner.appendChild(child.cloneNode(true));
        child = child.nextSibling;
    }
    if (solution.hasAttribute("notWrittenYet")) returner.setAttribute("unfinished", "");
    if (solution.hasAttribute("partiallyFinished")) returner.setAttribute("unfinished", "partial");
    try {
        MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
    } catch (e) {}
    pairs[id] = returner;
    returner.topics = [];
    let topics = xml.querySelector("topics");
    if (topics) {
        for (let topicNode of topics.childNodes) {
            returner.topics.push(topicNode.nodeName);
            try {newTopic(topicNode.nodeName)} catch (e) {}
        }
    } else {
        //console.log("no topics for " + id);
    }
    returner.instructors = {};
    let instructorsNode = xml.querySelector("instructors");
    if (instructorsNode) for (let instructorNode of instructorsNode.childNodes) {
        let instructorID = instructorNode.nodeName;
        if (!(instructorID in instructors)) {
            newInstructor(instructorID);
        }
    }
    return returner;
}

var topics = {}, numTopics = 0;

function inputMessage(input, message) {
    let line = input.value, able = !input.hasAttribute("disabled");
    input.value = message;
    input.setAttribute("disabled", "");
    window.setTimeout(function() {
        input.value = line + "<";
        if (able) input.removeAttribute("disabled");
    }, 1000);
}

function changeInMetainformation() {
    switch (metainformation.mode) {
        case "enteringLaTeX":
            fixTex();
        break; case "problemsSection":
            for (let id in problems) {
                claimNode(problemsHide, problems[id].details);
                for (let topic in problems[id].topics) if (topics[topic].checkbox.checked) claimNode(problemsPlace, problems[id].details);
                for (let i in problems[id].instructors) if (instructors[i].checkbox.checked) claimNode(problemsPlace, problems[id].details);
            }
        break; default: console.log("change in metainformation but mode is " + metainformation.mode);
    }
}

function newTopic(topic) {
    if (topic in topics) throw Error("already a topic");
    let returner = {topic: topic, id: numTopics++};
    topics[topic] = returner;
    returner.div = document.createElement("div");
    topicsPlace.appendChild(returner.div);
    returner.div.setAttribute("class", "checkbox");
    returner.label = document.createElement("label");
    returner.div.appendChild(returner.label);
    returner.label.setAttribute("for", "topic" + returner.id);
    returner.label.appendChild(document.createTextNode(topic));
    returner.checkbox = document.createElement("input");
    returner.div.appendChild(returner.checkbox);
    returner.checkbox.setAttribute("type", "checkbox");
    returner.checkbox.setAttribute("id", "topic" + returner.id);
    returner.checkbox.setAttribute("value", topic);
    returner.checkbox.addEventListener("change", changeInMetainformation);
    Store.saveTopic(topic);
}

function removeTopic(topic) {
    if (!(topic in topics)) throw Error("not a topic");
    let e = topics[topic];
    if (e.checkbox.checked) throw Error("checkbox must not be checked");
    delete topics[topic];
    e.div.parentElement.removeChild(e.div);
    Store.removeTopic(topic);
}

var instructors = {};

function newInstructor(id) {
    let returner = {id: id, name: id};
    instructors[id] = returner;
    returner.div = document.createElement("div");
    instructorsPlace.appendChild(returner.div);
    returner.label = document.createElement("label");
    returner.div.appendChild(returner.label);
    returner.checkbox = document.createElement("input");
    returner.div.appendChild(returner.checkbox);
    returner.checkbox.setAttribute("type", "checkbox");
    returner.checkbox.setAttribute("id", "instructor" + id);
    returner.label.setAttribute("for", "instructor" + id);
    returner.label.appendChild(document.createTextNode(id));
    returner.checkbox.addEventListener("change", changeInMetainformation);
    returner.nameIn = document.createElement("input");
    returner.nameIn.setAttribute("type", "text");
    
    returner.label.addEventListener("click", function(e) {
        e.stopPropagation();
        returner.div.replaceChild(returner.nameIn, returner.label);
    });
    returner.nameIn.addEventListener("change", function() {returner.setRealName(returner.nameIn.value)});
    returner.nameIn.addEventListener("click", function(e) {e.stopPropagation()});
    returner.setRealName = function setRealName(realName) {
        returner.name = realName;
        returner.label.firstChild.nodeValue = realName;
        returner.nameIn.value = realName;
        Store.saveInstructor(id, realName);
        if (returner.nameIn.parentElement) returner.div.replaceChild(returner.label, returner.nameIn);
    };
    Store.fetchInstructorName(id);
}

function readPair(id) {
    idSpan.firstChild.nodeValue = id;
    idP.removeAttribute("class");
    let details = pairs[id], problem = details.xml.querySelector("problem"), solution = details.xml.querySelector("solution"), problemLine = unfixLine(serializer.serializeToString(problem)), solutionLine = unfixLine(serializer.serializeToString(solution));
    problemLine = problemLine.replace(/<problem><p>|<\/p><\/problem>/g,"");
    if (solutionLine == "<solution/>") {
        solutionFull.checked = true;
        solutionLine = "";
    } else if (solutionLine.substring(0, 11) == "<solution p") {
        solutionPartial.checked = true;
        solutionLine = solutionLine.replace(/<solution partiallyFinished=\"\"><p>|<\/p><\/solution partiallyFinished=\"\">|<solution partiallyFinished=\"\"\/>/g,"");
    } else if (solutionLine.substring(0, 11) == "<solution n") {
        solutionNone.checked = true;
        solutionLine = solutionLine.replace(/<solution notWrittenYet=\"\"><p>|<\/p><\/solution notWrittenYet=\"\">|<solution notWrittenYet=\"\"\/>/g,"");
    } else {
        solutionFull.checked = true;
        solutionLine = solutionLine.replace(/<solution><p>|<\/p><\/solution>/g,"");
    }
    texProblem.value = problemLine;
    texSolution.value = solutionLine;
    let topicsNode = details.xml.querySelector("topics");
    if (topicsNode) for (let topic in topics) topics[topic].checkbox.checked = topicsNode.querySelector(topic)? true: false;
    else for (let topic in topics) topics[topic].checkbox.checked = false;
    let instructorsNode = details.xml.querySelector("instructors");
    if (instructorsNode) for (let instructor in instructors) instructors[instructor].checkbox.checked = instructorsNode.querySelector(instructor)? true: false;
    else for (let instructor in instructors) instructors[instructor].checkbox.checked = false;
    fixTex();
}

function fixTex() {
    if (texProblem.value in pairs) return readPair(texProblem.value);
    let problem = fixLine(texProblem.value), solution = "<p>"+fixLine(texSolution.value)+"</p>";
    if (solution == "<p></p>") solution = "";
    texLiveOut.innerHTML = "<p>Problem:</p><div><div><p>" + problem + "</p></div></div><p>Solution:</p><div><div>" + solution + "</div></div>";
    texOut.firstChild.nodeValue = "<problem><p>" + problem + "</p></problem><solution" + (solutionPartial.checked? " partiallyFinished=\"\"": solutionNone.checked? " notWrittenYet=\"\"": "") + ">" + solution + "</solution>";
    let checkedTopics = [];
    for (let topic in topics) {
        if (topics[topic].checkbox.checked) checkedTopics.push(topic);
    }
    if (checkedTopics.length > 0) {
        let line = "<topics>";
        for (let topic of checkedTopics) line += "<" + topic +"/>";
        line += "</topics>";
        texOut.firstChild.nodeValue += line;
    }
    let haveInstructors = false;
    for (let instructor in instructors) if (instructors[instructor].checkbox.checked) haveInstructors = true;
    if (haveInstructors) {
        let line = "<instructors>";
        for (let instructor in instructors) if (instructors[instructor].checkbox.checked) line += "<" + instructors[instructor].id + "/>";
        line += "</instructors>";
        texOut.firstChild.nodeValue += line;
    }
    try {
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, "texLiveOut"]);
    } catch (e) {}
    for (let ta of [texProblem, texSolution, texOut]) fixTextHeight(ta);
}

function clearTex() {
    texProblem.value = "";
    texSolution.value = "";
    idP.setAttribute("class", "hide");
    solutionNone.checked = true;
    for (let topic in topics) topics[topic].checkbox.checked = false;
    fixTex();
}

function copyTex() {
    texOut.focus();
    texOut.setSelectionRange(0, texOut.value.length);
    document.execCommand("copy");
}

function fixLine(line) {
    line = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/\\\[/g,"</p><p>\\\[").replace(/\\\]/g,"\\\]</p><p>").replace(/\n/g,"</p><p>").replace(/<p><\/p>/g,"");
    let opening = false, returner = "";
    for (let i = 0; i < line.length; ++i) {
        if (line.charAt(i) == "$") {
            returner += (opening = !opening)? "\\(": "\\)";
        } else returner += line.charAt(i);
    }
    if (returner.length >= 7) if (returner.substring(0,7) == "</p><p>") returner = returner.substring(7);
    if (returner.length >= 7) if (returner.substring(returner.length - 7, returner.length) == "</p><p>") returner = returner.substring(0, returner.length - 7);
    return returner;
}

function unfixLine(line) {
    return line.replace(/\\\(|\\\)/g,"$").replace(/<\/p><p>/g,"\n\n").replace(/&apos;/g,"\'").replace(/&quot;/g,"\"").replace(/&gt;/g,">").replace(/&lt;/g,"<").replace(/&amp;/g,"&");
}

function noJax(line) {
    return line.replace(/&/g, "&amp;").replace(/\\/g, "\\<span\\>");
}

function goodTagName(line) {
    try {
        document.createElement(line); return true;
    } catch (e) {return false}
}

var testsBlacklist = {};

function makePracticeTest() {
    newTestButton.innerHTML = "making test, please hold for ten seconds";
    window.setTimeout(function() {newTestButton.innerHTML = "New Test"}, 10000);
    for (let section of [enteringLaTeX, problemsSection, theoremsSection]) section.setAttribute("class", "hide");
    if(!problemsPlace.hasBeenLoaded) loadFromList("problems", problemsLoader);
    if (isEmpty(testsBlacklist)) {
        let req = new XMLHttpRequest();
        req.open("GET", filePrefix + "qual/testsBlacklist.txt");
        req.overrideMimeType("text/plain");
        req.onload = function() {
            for (let problem of req.responseText.split(" ")) testsBlacklist[problem] = problems[problem];
            window.setTimeout(makePracticeTest, 10000);
        }
        req.send();
        return;
    }
    let ab = [], c = [];
    for (let problem in problems) if (!(problem in testsBlacklist)) {
        if ("RiemannSurfaces" in problems[problem].topics) c.push(problems[problem]);
        else ab.push(problems[problem]);
    }
    let chosenAB = [], chosenC = [];
    for (let i = 0; i < 6; ++i) {
        let choice;
        do {
            choice = ab[Math.floor(ab.length * Math.random())]
        } while (chosenAB.includes(choice));
        chosenAB.push(choice);
    }
    for (let i = 0; i < 3; ++i) {
        let choice;
        do {
            choice = c[Math.floor(c.length * Math.random())]
        } while (chosenC.includes(choice));
        chosenC.push(choice);
    }
    while (testDiv.firstChild) testDiv.removeChild(testDiv.firstChild);
    let chosens = chosenAB.concat(chosenC), problemNum = 0;
    for (let choice of chosens) {
        let p = document.createElement("p");
        testDiv.appendChild(p);
        let problemNumber = document.createElement("span");
        p.appendChild(problemNumber);
        problemNumber.innerHTML = (++problemNum) + ": ";
        p.appendChild(choice.details.firstChild.firstChild.nextSibling);
    }
}

var Store = {};

Store.canStore = function() {return typeof (Storage) !== "undefined"}

Store.getTopics = function() {if (Store.canStore()) {
    let topics = localStorage.topics;
    if (!topics) topics = "";
    return topics == ""? []: topics.split("\n");
} else return []}

Store.saveTopics = function saveTopics(topics) {if (Store.canStore()) {
    let line = "";
    for (let t of topics) line+= "\n" + t;
    localStorage.setItem("topics", line.substring(1));
}}

Store.saveTopic = function saveTopic(topic) {if (Store.canStore()) {
    let topics = Store.getTopics();
    if (topics.includes(topic)) return;
    topics.push(topic);
    Store.saveTopics(topics);
}}

Store.loadTopics = function loadTopics() {if (Store.canStore()) {
    let topics = Store.getTopics();
    for (let topic of topics) try {
        newTopic(topic);
    } catch (e) {}
}}

Store.removeTopic = function removeTopic(topic) {if (Store.canStore()) {
    let topics = Store.getTopics();
    topics.splice(topics.indexOf(topic), 1);
    Store.saveTopics(topics);
}}

Store.fetchInstructorName = function fetchInstructorName(id) {if (Store.canStore()) {
    let realName = localStorage["instructor" + id];
    if (realName) instructors[id].setRealName(realName);
}}

Store.saveInstructor = function saveInstructor(id, name) {if (Store.canStore()) {
    localStorage.setItem("instructor" + id, name);
}}

Store.loadTopics();

function isEmpty(object) {for (let anything in object) return false; return true}