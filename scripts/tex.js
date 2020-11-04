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

let pairMode = true, qual = "", serializer = new XMLSerializer(), doc = xmlImporter.newDocument(), id = "changeMe", topics = {}, instructors = [], problems = {};

// set event listeners
{
    function setListener(element, type, func) {
        try {
            element.addEventListener(type, func);
        } catch (e) {}
    }
    
    setListener(qualName, "change", loadQual);
    qualName.value = "complex";loadQual();
    
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
    newInstructorButton.addEventListener("click", newInstructor);
    //topicsPlace = document.getElementById("topics"),
    
    setListener(newTopicIn, "change", function() {
        let line = newTopicIn.value;
        if (!nodeNameScreen(line)) {
            if (line == "") return;
            return inputMessage(newTopicIn, "invalid name");
        }
        if (newTopicButton.checked) {
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
    
    for (let e of [texProblem, texSolution]) setListener(e, "input", resetDoc);

    for (let textarea of document.getElementsByTagName("textarea")) {
        setListener(textarea, "input", fixTextHeight);
        setListener(textarea, "change", fixTextHeight);
    }
    
    saveButton.addEventListener("click", function() {
        let file = new File([codeOut.value], idInput.value+".xml", {type: "text/xml"});
        let url = URL.createObjectURL(file);
        let a = xmlImporter.element("a", document.body, ["href", url, "download", ""]);
        xmlImporter.text("download link", a);
        a.click();
        document.body.removeChild(a);
    });
}

function fixTextHeight(event) {
        event = event.target;
        while (event.nodeName.toLowerCase() != "textarea") event = event.parentNode;
        event.style.height = "5px";
        event.style.height = (event.scrollHeight)+"px";
    }

function loadQual() {
    let exchange = refreshMathJax;
    refreshMathJax = function() {}
    if (!nodeNameScreen(qualName.value)) return inputMessage(qualName, "invalid name");
    xmlImporter.openTextFile("../quals/"+qualName.value+"/problemsList.txt", null, function(list) {
        qual = qualName.value;
        qualName.value = "working on " + qual;
        qualName.setAttribute("disabled", "");
        let lines = list.split(" "), numLines = lines.length;
        for (let problem of lines) {
            let p = problem;
            if (problem in problems) throw Error("duplicate in problems list: " + problem);
            problems[problem] = undefined;
            xmlImporter.openXMLFile("../quals/"+qual+"/problems/"+p+".xml", null, function(problemDoc) {
                problems[p] = xmlImporter.getRoot(problemDoc);
                doc = problemDoc;
                outputFromDoc();
                if (--numLines == 0) clearTex();
            }, function() {
                throw Error("cannot find " + p);
            });
        }
    }, function() {
        inputMessage(qualName, "that qual has not been successfully initiated", 3000);
    });
    refreshMathJax = exchange;
}

function handleIdChange() {
    if (nodeNameScreen(idInput.value)) {
        id = idInput.value;
        if (id in problems) {
            while (doc.firstChild) doc.removeChild(doc.firstChild);
            doc.appendChild(problems[id].cloneNode(true));
            outputFromDoc();
        } else resetDoc();
    } else inputMessage(idInput, "invalid nodeName");
}

function resetDoc() {
    while (doc.firstChild) doc.removeChild(doc.firstChild);
    let problem = xmlImporter.elementDoc(doc, "problem", xmlImporter.elementDoc(doc, id, doc), [
        "tex", texProblem.value,
        "solutionCompleteness", solutionFull.checked? "full": solutionPartial.checked? "partial": "none",
        "questionViability", questionGreat.checked? "great": questionGood.checked? "good": "bad"
    ]);
    let instructorsNode = xmlImporter.elementDoc(doc, "instructors", problem);
    for (let instructor of instructors) if (instructor.checkbox.checked) xmlImporter.elementDoc(doc, instructor.id, instructorsNode);
    let topicsNode = xmlImporter.elementDoc(doc, "topics", problem);
    for (let topic in topics) if (topics[topic].checkbox.checked) xmlImporter.elementDoc(doc, topic, topicsNode);
    if (pairMode) xmlImporter.elementDoc(doc, "solution", problem, ["tex", texSolution.value]);
    outputFromDoc();
}
resetDoc();

function outputFromDoc() {
    idInput.value = id = xmlImporter.getRoot(doc).nodeName;
    let problem = doc.querySelector("problem"), solution = doc.querySelector("solution"), instructorsNode = doc.querySelector("instructors"), topicsNode = doc.querySelector("topics");
    ensureInstructors(instructorsNode);
    for (let i of instructors) i.checkbox.checked = false;
    if (instructorsNode) {
        let i = instructorsNode.firstChild;
        while (i) {
            getBy(instructors, "id", i.nodeName).checkbox.checked = true;
            i = i.nextSibling;
        }
    }
    ensureTopics(topicsNode);
    for (let topic in topics) topics[topic].checkbox.checked = false;
    if (topicsNode) {
        let topic = topicsNode.firstChild;
        while (topic) {
            topics[topic.nodeName].checkbox.checked = true;
            topic = topic.nextSibling;
        }
    }
    texProblem.value = problem.getAttribute("tex");
    fixTextHeight({target: texProblem});
    if (pairMode) {
        texSolution.value = solution.getAttribute("tex");
        fixTextHeight({target: texSolution});
    }
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
    if (pairMode) texLiveOut.innerHTML = "<h4>Problem</h4><p>"+fixLineBreaksToP(problem.getAttribute("tex"))+"</p><h4>Solution</h4><p>"+fixLineBreaksToP(solution.getAttribute("tex"))+"</p>";
    else texLiveOut.innerHTML = "<p>"+fixLineBreaksToP(problem.getAttribute("tex"))+"</p>";
    codeOut.value = serializer.serializeToString(doc);
    refreshMathJax();
}

function ensureInstructors(instructorsNode) {
    if (!instructorsNode) return;
    let i = instructorsNode.firstChild;
    while (i) {
        ensureInstructor(i.nodeName);
        i = i.nextSibling;
    }
}

function ensureInstructor(instructorID) {
    if (getBy(instructors, "id", instructorID)) return;
    for (let instructor of instructors) if (instructor.id == instructorID) return;
    try {while (newInstructor().id != instructorID);} catch (e) {throw Error(instructorID + " is not a working instructor ID")}
}

function ensureTopics(topicsNode) {
    if (!topicsNode) return;
    let t = topicsNode.firstChild;
    while (t) {
        ensureTopic(t.nodeName);
        t = t.nextSibling;
    }
}

function ensureTopic(topic) {
    if (topic in topics) return;
    newTopic(topic);
}

function refreshMathJax() {try {MathJax.Hub.Queue(["Typeset", MathJax.Hub])} catch (e) {}}

function fixLineBreaksToP(line) {
    //line = line.replaceAll(/</g, "&lt;").replaceAll(/>/g, "&gt;").replaceAll(/&/g, "&amp;").replaceAll(/'/g, "&apos;").replaceAll(/"/g, "&quot;");
    let lines = line.split("$");
    line = "";
    let opening = false;
    for (let sub of lines) {
        line += sub + "\\" + ((opening = !opening)? "(": ")");
    }
    line = line.substring(0, line.length - 2);
    return line.replaceAll(/\n/g, "</p><p>");
}

function inputMessage(input, message, time = 1000) {
    let line = input.value, able = !input.hasAttribute("disabled");
    window.setTimeout(function() {input.value = message}, 10); // delay is to let blur happen
    input.setAttribute("disabled", "");
    window.setTimeout(function() {
        input.value = line;
        if (able) input.removeAttribute("disabled");
    }, time);
}

function newTopic(topic) {
    if (topic in topics) throw Error("already a topic");
    let returner = {topic: topic};
    topics[topic] = returner;
    returner.div = xmlImporter.element("div", topicsPlace, ["class", "checkbox"]);
    returner.label = xmlImporter.element("label", returner.div, ["for", "topic"+topic]);
    xmlImporter.text(topic, returner.label);
    returner.checkbox = xmlImporter.element("input", returner.div, ["type", "checkbox", "id", "topic"+topic, "value", topic]);
    returner.checkbox.addEventListener("change", resetDoc);
    return returner;
}

function removeTopic(topic) {
    if (!(topic in topics)) throw Error("not a topic");
    let e = topics[topic];
    if (e.checkbox.checked) throw Error(topic + " must not be in use");
    delete topics[topic];
    e.div.parentElement.removeChild(e.div);
}

let instructorLetters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function newInstructor() {
    if (instructors.length == instructorLetters.length) throw Error("too many instructors");
    let num = instructors.length, id = instructorLetters.charAt(num);
    let returner = {id: id};
    instructors[num] = returner;
    returner.div = xmlImporter.element("div", instructorsPlace, ["class", "checkbox"]);
    returner.label = xmlImporter.element("label", returner.div, ["for", "instructor_"+id]);
    xmlImporter.text(id, returner.label);
    returner.checkbox = xmlImporter.element("input", returner.div, ["type", "checkbox", "id", "instructor_"+id]);
    returner.checkbox.addEventListener("change", resetDoc);
    returner.nameIn = xmlImporter.element("input", null, ["type", "text"]);
    
    returner.label.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        returner.div.replaceChild(returner.nameIn, returner.label);
        returner.nameIn.focus();
    });
    returner.nameIn.addEventListener("change", function() {returner.setRealName(returner.nameIn.value)});
    returner.nameIn.addEventListener("blur", function() {if (returner.nameIn.parentElement) returner.div.replaceChild(returner.label, returner.nameIn)});
    returner.setRealName = function setRealName(realName) {
        returner.name = realName;
        returner.label.firstChild.nodeValue = realName;
        returner.nameIn.value = realName;
        Store.saveInstructor(id, realName);
        if (returner.nameIn.parentElement) returner.div.replaceChild(returner.label, returner.nameIn);
    };
    Store.fetchInstructorName(id);
    return returner;
}

// metainformation should include where the problem came from / is used
// number scales for test viability

function clearTex() {
    idInput.value = "changeMe";
    texProblem.value = "";
    texSolution.value = "";
    solutionNone.checked = true;
    questionBad.checked = true;
    for (let instructor of instructors) instructor.checkbox.checked = false;
    for (let topic in topics) topics[topic].checkbox.checked = false;
    newTopicButton.checked = false;
    newTopicIn.value = "";
    doc = xmlImporter.newDocument();
    texLiveOut.innerHTML = "";
    codeOut.value = "";
}

function noJax(line) {
    return line.replace(/&/g, "&amp;").replace(/\\/g, "\\<span\\>");
}

function nodeNameScreen(line) {
    try {
        document.createElement(line); return true;
    } catch (e) {return false}
}

let converter = document.getElementById("converter");
converter.addEventListener("change", function() {
    let id = converter.value;
    xmlImporter.openTextFile("../quals/complex/problems/"+id+".txt", null, function(line) {
        let newdoc = new DOMParser().parseFromString("<q"+id+">"+line+"</q"+id+">", "text/xml");
        let problem = newdoc.querySelector("problem"), solution = newdoc.querySelector("solution"), instructors = newdoc.querySelector("instructors"), topics = newdoc.querySelector("topics");
        doc = xmlImporter.newDocument();
        let root = xmlImporter.elementDoc(doc, id, doc);
        let problemNode = xmlImporter.elementDoc(doc, "problem", root, ["tex", fixOldLine(problem.innerHTML.substring(3))]);
        let solutionNode = xmlImporter.elementDoc(doc, "solution", problemNode, ["tex", fixOldLine(solution.innerHTML.substring(3))]);
        let instructorsNode = xmlImporter.elementDoc(doc, "instructors", problemNode);
        if (instructors) for (let child of instructors.childNodes) xmlImporter.elementDoc(doc, child.nodeName, instructorsNode);
        let topicsNode = xmlImporter.elementDoc(doc, "topics", problemNode);
        if (topics) for (let child of topics.childNodes) xmlImporter.elementDoc(doc, child.nodeName, topicsNode);
        outputFromDoc();
    }, function () {});
});

function fixOldLine(oldLine) {
    return oldLine.replaceAll(/(\\\(|\\\))/g, "$").replaceAll(/<p>/g, "\n").replaceAll(/<\/p>/g, "").replaceAll(/&lt;/g, "<").replaceAll(/&gt;/g, ">").replaceAll(/&amp;/g, "&").replaceAll(/&apos;/g, "'").replaceAll(/&quot;/g, "\"");
}

function getBy(array, prop, value) {
    for (let element of array) if (element[prop] == value) return element;
}

var Store = {};

Store.canStore = function() {return typeof (Storage) !== "undefined"}

Store.fetchInstructorName = function fetchInstructorName(id) {if (Store.canStore()) {
    let realName = localStorage[qual + " instructor " + id];
    if (realName) getBy(instructors, "id", id).setRealName(realName);
}}

Store.saveInstructor = function saveInstructor(id, name) {if (Store.canStore()) {
    localStorage.setItem(qual + " instructor " + id, name);
}}