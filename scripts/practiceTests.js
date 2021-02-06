/*
    This script is dynamically imported from problems.js and handles generation of practice tests.
*/

xmlImporter.element("link", document.head, ["rel", "stylesheet", "type", "text/css", "href", "/css/tests.css"]);

function shuffle(array) {
    for (let x, j, i = array.length - 1; i > 0; --i) {
        j = Math.floor((i+1) * Math.random());
        x = array[i];
        array[i] = array[j];
        array[j] = x;
    }
    return array;
}

{
    let generatorStuff = {};
    
    generatorStuff.sectionGroupWeightChooser = function(node) {return node.getAttribute("weight")}
    
    generatorStuff.resolveWeightedSections = function resolveWeightedSections(parentNode) {
        let sectionGroups = [], activeSectionGroup;
        for (let child of parentNode.childNodes) if (child.nodeName === "section") {
            if (child.hasAttribute("weight")) {
                if (activeSectionGroup) activeSectionGroup.push(child);
                else activeSectionGroup = [child];
            } else {
                if (activeSectionGroup) {
                    sectionGroups.push(activeSectionGroup);
                    activeSectionGroup = undefined;
                }
            }
        }
        if (activeSectionGroup) sectionGroups.push(activeSectionGroup);
        for (let sectionGroup of sectionGroups) {
            let selection = weightedList(sectionGroup, generatorStuff.sectionGroupWeightChooser).chooseOne();
            for (let remove of sectionGroup) if (remove !== selection) {parentNode.removeChild(remove)}
        }
        for (let child of parentNode.childNodes) if (child.nodeName == "section") generatorStuff.resolveWeightedSections(child);
    }
    
    generatorStuff.getWeightedQuestions = function getWeightedQuestions(theseProblems, unavailableProblems, questionNode) {
        let matches = getProblemsFromSelector(questionNode.getAttribute("xpath"), theseProblems);
        let a = [];
        if (questionNode.hasAttribute("weight")) if (!isFinite(questionNode.getAttribute("weight"))) {
            valuesDoc = xmlImporter.parseDoc("<?xml version='1.0'?><values/>");
            valuesNode = xmlImporter.getRoot(valuesDoc);
        }
        for (let match in matches) if (!(match in unavailableProblems)) {
            let pusher = {problem: match, originalWeight: 1};
            a.push(pusher);
            if (questionNode.hasAttribute("weight")) {
                let weight = questionNode.getAttribute("weight");
                if (isFinite(weight)) pusher.originalWeight = weight;
                else {
                    // weight depends on meta value, so do eval to get it
                    let evaluateMe = weight;
                    for (let meta in metas) if (metas[meta].metaType == "scale") {
                        let metaNode = theseProblems[match].doc.querySelector(meta + "[scale]");
                        evaluateMe = evaluateMe.replaceAll(
                            RegExp("@"+meta, "g"),
                            "(" + (metaNode? metaNode.getAttribute("scale"): 0) + ")"
                        );
                    }
                    pusher.originalWeight = eval(evaluateMe);
                }
            }
        }
        return weightedList(a, generatorStuff.originalWeightAccessor);
    }
    
    generatorStuff.originalWeightAccessor = function(e) {return e.originalWeight}
    
    generatorStuff.copyConfig = function copyConfig(configuration) {
        let id = 0;
        function identify(node) {
            node.setAttribute("configId", id++);
            for (let child of node.childNodes) if (child.nodeType === 1) identify(child);
        }
        identify(xmlImporter.getRoot(configuration));
        return configuration.cloneNode(true);
    }
    
    generatorStuff.testError = function testError(node, message) {
        // do something fancy to tell the user which node was the issue in the original configuration file
        throw Error(message);
    }
    
    generatorStuff.getProblemsFromGroup = function getProblemsFromGroup(theseProblems, groupNode, thisGroup = {}) {
        for (let child of groupNode.childNodes) {
            if (child.nodeName === "section") getProblemsFromGroup(theseProblems, child, thisGroup);
            else if (child.nodeName == "question") for (let match in getProblemsFromSelector(child.getAttribute("xpath"), theseProblems)) thisGroup[match] = undefined;
        }
        return thisGroup;
    }
    
    generatorStuff.combineQuestionWeightGroups = function combineQuestionWeightGroups(sectionNode, doc) {
        let child = sectionNode.firstChild, activeGroup;
        while (child) {
            if (child.nodeName === "section") {
                generatorStuff.combineQuestionWeightGroups(child, doc);
            } else if (child.nodeName !== "question") {
                child = child.nextSibling;
                continue;
            }
            if (child.hasAttribute("weight")) {
                if (activeGroup) activeGroup.push(child);
                else activeGroup = [child];
            } else if (activeGroup) {
                let groupNode = xmlImporter.elementDoc(doc, "weightGroup");
                child.parentElement.insertBefore(groupNode, child);
                for (let member of activeGroup) groupNode.appendChild(member);
                activeGroup = undefined;
            }
            child = child.nextSibling;
        }
        if (activeGroup) {
            let groupNode = xmlImporter.elementDoc(doc, "weightGroup");
            activeGroup[0].parentElement.insertBefore(groupNode, activeGroup[0]);
            for (let member of activeGroup) groupNode.appendChild(member);
            activeGroup = undefined;
        }
    }
    
    generatorStuff.countQuestions = function countQuestions(sectionNode) {
        let returner = 0;
        for (let child of sectionNode.childNodes) {
            if (child.nodeName === "section") returner += generatorStuff.countQuestions(child);
            else if (child.nodeName === "question" || child.nodeName === "weightGroup") ++returner;
        }
        return returner;
    }
    
    generatorStuff.setQuestionOrder = function setQuestionOrder(sectionNode, order) {
        for (let child of sectionNode.childNodes) {
            if (child.nodeName === "section") generatorStuff.setQuestionOrder(child, order);
            else if (child.nodeName === "question" || child.nodeName === "weightGroup") child.setAttribute("order", order.pop());
        }
    }
    
    generatorStuff.typeset = function typeset(node, loadHere, theseProblems, nestLevel = 0) {
        if (node.nodeName === "section") {
            let doShuffle = false, name = node.hasAttribute("displayName");
            for (let child of node.childNodes) doShuffle = doShuffle || child.nodeName === "shuffle";
            if (name) {
                ++nestLevel;
                loadHere = xmlImporter.element("div", loadHere, ["class", "testsection"]);
                xmlImporter.text(node.getAttribute("displayName"), xmlImporter.element("h"+Math.max(nestLevel, 6), loadHere));
            }
            if (doShuffle) loadHere = xmlImporter.element("div", loadHere);
            for (let child of node.childNodes) generatorStuff.typeset(child, loadHere, theseProblems, nestLevel);
            if (doShuffle) {
                let children = [], child;
                while (child = loadHere.firstChild) {
                    loadHere.removeChild(child);
                    children.push(child);
                }
                shuffle(children);
                for (let c of children) loadHere.appendChild(c);
            }
        } else if (node.hasAttribute("chosenProblem")) {
            loadHere = xmlImporter.element("div", loadHere, ["class", "question"]);
            xmlImporter.text("question number", xmlImporter.element("span", loadHere, ["class", "questionnumber"]));
            loadHere.insertAdjacentHTML("beforeend", texAttToInnerHTML(theseProblems[node.getAttribute("chosenProblem")].doc.querySelector("problem").getAttribute("tex")));
        }
    }
    
    generatorStuff.setQuestionNumbers = function setQuestionNumbers(node, questionNumberHere) {
        if (node.getAttribute("class") === "questionnumber") node.firstChild.nodeValue = questionNumberHere.value++;
        else for (let child of node.childNodes) if (child.getAttribute) generatorStuff.setQuestionNumbers(child, questionNumberHere);
    }
    
    function makePracticeTest(theseProblems, configuration, numTries = 1) {
        let usedProblems = {};
        let identifiedConfig = generatorStuff.copyConfig(xmlImporter.trim(configuration));
        let configRoot = xmlImporter.getRoot(identifiedConfig);
        generatorStuff.resolveWeightedSections(configRoot);
        let groups = [], forcedGroups = [];
        for (let child of configRoot.childNodes) if (child.nodeName === "group") (child.hasAttribute("force")? forcedGroups: groups).push(generatorStuff.getProblemsFromGroup(theseProblems, child));
        for (let group of forcedGroups) for (let blocked in group) usedProblems[blocked] = undefined;
        let rootSections = [];
        for (let child of configRoot.childNodes) if (child.nodeName === "section") rootSections.push(child);
        let numQuestions = 0;
        for (let section of rootSections) {
            generatorStuff.combineQuestionWeightGroups(section, identifiedConfig);
            numQuestions += generatorStuff.countQuestions(section);
        }
        let order = [numQuestions];
        for (let i = 0; i < numQuestions; ++i) order[i] = i;
        shuffle(order);
        generatorStuff.setQuestionOrder(configRoot, order);
        for (let i = 0; i < numQuestions; ++i) {
            let questionNode = identifiedConfig.querySelector("[order='"+i+"']");
            let possibleQuestions;
            if (questionNode.nodeName === "question") possibleQuestions = generatorStuff.getWeightedQuestions(theseProblems, usedProblems, questionNode);
            else {
                possibleQuestions = weightedList([]);
                for (let q of questionNode.childNodes) possibleQuestions.addAll(generatorStuff.getWeightedQuestions(theseProblems, usedProblems, q));
            }
            let chosenProblem = possibleQuestions.chooseOne().problem;
            questionNode.setAttribute("chosenProblem", chosenProblem);
            usedProblems[chosenProblem] = undefined;
            for (let i = 0; i < groups.length; ++i) if (chosenProblem in groups[i]) {
                for (let relative in groups[i]) usedProblems[relative] = undefined;
                groups.splice(i--, 1);
            }
        }
        let test = xmlImporter.element("div", null, ["class", "practicetest"]);
        for (let section of rootSections) generatorStuff.typeset(section, test, theseProblems);
        generatorStuff.setQuestionNumbers(test, {value: 1});
        return test;
    }
}
{
    let weightedListAccessor = function weightedListAccessor(element) {return element.weight}
    
    let protoModel = {
        normalize: function normalize() {
            if (this.totalWeight > 0) this.scale(1/this.totalWeight);
        }, addAll: function addAll(other) {
            this.array.splice(this.array.length, 0, ...other.array);
            this.totalWeight += other.totalWeight;
        }, chooseOne: function chooseOne() {
            if (this.array.length == 0) throw Error("nothing to choose from");
            let find = Math.random() * this.totalWeight;
            for (let e of this.array) if (e.lowerBound <= find && e.lowerBound+e.weight > find) return e.element;
        }, remove: function remove(index) {
            let decrement = this.array[index].weight;
            this.totalWeight -= decrement;
            this.array.splice(index, 1);
            for (let i = index; i < this.array.length; ++i) this.array[i].lowerBound -= decrement;
            this.normalize();
        }, scale: function scale(factor) {
            if (!isFinite(factor)) factor = 0;
            this.totalWeight *= factor;
            for (let e of this.array) {
                e.lowerBound *= factor;
                e.weight *= factor;
            }
        }
    };
    
    function weightedList(array, getWeightOf = weightedListAccessor) {
        let returner = Object.create(protoModel);
        returner.totalWeight = 0;
        returner.array = [];
        for (let element of array) {
            let e = {element: element, weight: Math.max(0, getWeightOf(element))};
            returner.array.push(e);
            e.lowerBound = returner.totalWeight;
            returner.totalWeight += e.weight;
        }
        returner.normalize();
        return returner;
    }
}