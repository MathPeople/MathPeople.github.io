var qualName = document.getElementById("qualName"),
    clearTexButton = document.getElementById("clearTex"),
    pairSoloButton = document.getElementById("pairSolo"),
    idInput = document.getElementById("problemID"),
    solutionFull = document.getElementById("solutionFull"),
    solutionPartial = document.getElementById("solutionPartial"),
    solutionNone = document.getElementById("solutionNone"),
    questionGreat = document.getElementById("greatQuestion"),
    questionGood = document.getElementById("goodQuestion"),
    questionBad = document.getElementById("badQuestion"),
    instructorsPlace = document.getElementById("instructors"),
    newInstructorButton = document.getElementById("newInstructor"),
    topicsPlace = document.getElementById("topics"),
    newTopicButton = document.getElementById("newTopicButton"),
    newTopicIn = document.getElementById("newTopic"),
    texProblem = document.getElementById("texProblem"),
    texSolution = document.getElementById("texSolution"),
    texLiveOut = document.getElementById("texLiveOut"),
    saveButton = document.getElementById("save"),
    codeOut = document.getElementById("codeOut");

let pairMode = true, serializer = new XMLSerializer(), doc = xmlImporter.newDocument(), id = "changeMe";

// set event listeners
{
    function setListener(element, type, func) {
        try {
            element.addEventListener(type, func);
        } catch (e) {}
    }
    
    setListener(clearTexButton, "click", clearTex);
    
    pairSoloButton = document.getElementById("pairSolo"),
    
    setListener(pairSoloButton, "click", function() {
        pairSoloButton.firstChild.nodeValue = (pairMode? "Pair": "Solo") + " mode";
        pairMode = !pairMode;
        resetDoc();
    })
    
    idInput.addEventListener("change", handleIdChange);
    idInput.addEventListener("blur", function() {idInput.value = id});
    
    for (let e of [solutionFull, solutionPartial, solutionNone, questionGreat, questionGood, questionBad]) setListener(e, "change", resetDoc);
    
    //instructorsPlace = document.getElementById("instructors"),
    //newInstructorButton = document.getElementById("newInstructor"),
    //topicsPlace = document.getElementById("topics"),
    //newTopicButton = document.getElementById("newTopicButton"),
    //newTopicIn = document.getElementById("newTopic"),
    
    for (let e of [texProblem, texSolution]) setListener(e, "input", resetDoc);
    
    texLiveOut = document.getElementById("texLiveOut"),
    saveButton = document.getElementById("save"),
    codeOut = document.getElementById("codeOut");
    setListener(newTopicButton, "click", function(e) {
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
    
    setListener(newTopicIn, "change", function() {
        let line = newTopicIn.value;
        if (!nodeNameScreen(line)) {
            if (line == "") return;
            return inputMessage(newTopicIn, "invalid name");
        }
        if (newTopicButton.hasAttribute("removingTopic")) {
            try {
                removeTopic(line);
            } catch (e) {
                return inputMessage(newTopicIn, e.message);
            }
        } else {
            try {
                newTopic(line);
                newTopicIn.value="";
            } catch (e) {
                return inputMessage(newTopicIn, e.message);
            }
        }
    });

    function fixTextHeight(element) {
        element.style.height = "5px";
        element.style.height = (element.scrollHeight)+"px";
    }

    for (let textarea of document.getElementsByTagName("textarea")) {
        setListener(textarea, "input", function() {fixTextHeight(textarea)});
        setListener(textarea, "change", function() {fixTextHeight(textarea)});
    }

    saveButton.addEventListener("click", function() {
        let file = new File([codeOut.value], idInput.value, {type: "text/xml"});
        let url = URL.createObjectURL(file);
        let a = xmlImporter.element("a", document.body, ["href", url, "download", ""]);
        xmlImporter.text("download link", a);
        a.click();
        document.body.removeChild(a);
    });
}

function handleIdChange() {
    if (nodeNameScreen(idInput.value)) {
        id = idInput.value;
        resetDoc();
    } else inputMessage(idInput, "invalid nodeName");
}

function resetDoc() {
    while (doc.firstChild) doc.removeChild(doc.firstChild);
    let problem = xmlImporter.elementDoc(doc, "problem", xmlImporter.elementDoc(doc, id, doc), [
        "tex", texProblem.value,
        "solutionCompleteness", solutionFull.checked? "full": solutionPartial.checked? "partial": "none",
        "questionViability", questionGreat.checked? "great": questionGood.checked? "good": "bad"
    ]);
    if (pairMode) xmlImporter.elementDoc(doc, "solution", problem, ["tex", texSolution.value]);
    outputFromDoc();
}
resetDoc();

function outputFromDoc() {
    idInput.value = xmlImporter.getRoot(doc).nodeName;
    let problem = doc.querySelector("problem");
    switch (problem.getAttribute("solutionCompleteness")) {
        case "full": solutionFull.checked = true; break;
        case "partial": solutionPartial.checked = true; break;
        default: solutionNone.checked = true;
    }
    switch (problem.getAttribute("questionViability")) {
        case "great": questionGreat.checked = true; break;
        case "good": questionGood.checked = true; break;
        default: questionBad.checked = true;
    }
    if (pairMode) texLiveOut.innerHTML = "<h4>Problem</h4><p>"+fixLineBreaksToP(problem.getAttribute("tex"))+"</p><h4>Solution</h4><p>"+fixLineBreaksToP(doc.querySelector("solution").getAttribute("tex"))+"</p>";
    else texLiveOut.innerHTML = "<p>"+fixLineBreaksToP(doc.querySelector("problem").getAttribute("tex"))+"</p>";
    codeOut.value = serializer.serializeToString(doc);
    refreshMathJax();
}

function refreshMathJax() {try {MathJax.Hub.Queue(["Typeset", MathJax.Hub])} catch (e) {}}

function fixLineBreaksToP(line) {
    let lines = line.split("$");
    line = "";
    let opening = false;
    for (let sub of lines) {
        line += sub + "\\" + ((opening = !opening)? "(": ")");
    }
    line = line.substring(0, line.length - 2);
    return line.replaceAll(/\n/g, "</p><p>");
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
    window.setTimeout(function() {input.value = message}, 10); // delay is to let blur happen
    input.setAttribute("disabled", "");
    window.setTimeout(function() {
        input.value = line;
        if (able) input.removeAttribute("disabled");
    }, 1000);
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
    returner.checkbox.addEventListener("change", resetDoc);
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
    returner.checkbox.addEventListener("change", resetDoc);
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

function clearTex() {
    idInput.value = "changeMe";
    texProblem.value = "";
    texSolution.value = "";
    solutionNone.checked = true;
    questionBad.checked = true;
    for (let topic in topics) topics[topic].checkbox.checked = false;
    resetDoc();
}

function noJax(line) {
    return line.replace(/&/g, "&amp;").replace(/\\/g, "\\<span\\>");
}

function nodeNameScreen(line) {
    try {
        document.createElement(line); return true;
    } catch (e) {return false}
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