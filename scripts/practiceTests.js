/*
    This script is dynamically imported from problems.js and handles generation of practice tests.
    
    Outline of test generation:
        - Preprocess by adding an id to each node in the configuration file. This will be used for error out messages, telling the user which node is related to an error.
        - Choose sections. This involves finding any weighted sections and running the weighted choice process to choose which section stays and which are removed.
        - Get groups, both regular and forced. Force all the forced groups.
        - Combine question weight groups. This replaces any sequence of weighted questions with a single `weightGroup` node whose children are the weighted question nodes. The weight group will be treated as a single question from here on out.
        - Randomize question choice order. We don't want position to play a role in question choices so we choose questions in a random order. This is not randomizing the location, only the order in which they are chosen.
        - Choose questions
        - Typeset test
    
    Many of the generator processes are recursive.
    You can probably figure out what is happening at each stage of generation if you look through the error tracing.
*/
// test display stylesheet
xmlImporter.element("link", document.head, ["rel", "stylesheet", "type", "text/css", "href", "/css/tests.css"]);

// classic shuffle algorithm
function shuffle(array) {
    for (let x, j, i = array.length - 1; i > 0; --i) {
        j = Math.floor((i+1) * Math.random());
        x = array[i];
        array[i] = array[j];
        array[j] = x;
    }
    return array;
}

{// stuff only useful for the test generator is scoped so it doesn't interfere with the rest of the scripts
    let generatorStuff = {};
    // accessor function for weighted list construction
    generatorStuff.sectionGroupWeightChooser = function(node) {return node.getAttribute("weight")}
    // do the section choice process
    generatorStuff.resolveWeightedSections = function resolveWeightedSections(parentNode) {
        let trace = generatorStuff.errorTrace = errorTrace.newErrorTrace("resolving weighted sections", {node: parentNode});
        let sectionGroups = [], activeSectionGroup; // acticeSectionGroup is for building a current weight group of sections, sectionGroups holds all encountered weight groups
        trace.substep("combining subsections into weight groups");
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
            trace.substep("\tdid a subsection");
        }
        if (activeSectionGroup) sectionGroups.push(activeSectionGroup);
        trace.substep("choosing a subsection from each weight group");
        for (let sectionGroup of sectionGroups) {
            let selection = weightedList(sectionGroup, generatorStuff.sectionGroupWeightChooser).chooseOne();
            for (let remove of sectionGroup) if (remove !== selection) {parentNode.removeChild(remove)}
            trace.substep("\tsuccesfully chose from a weight group");
        }
        for (let child of parentNode.childNodes) if (child.nodeName === "section") generatorStuff.resolveWeightedSections(child);
        generatorStuff.errorTrace = trace.substep("finished recursive call");
    }
    // take a question node and return a weighted list of possible choices for that question
    generatorStuff.getWeightedQuestions = function getWeightedQuestions(theseProblems, unavailableProblems, questionNode) {
        let trace = generatorStuff.errorTrace = errorTrace.newErrorTrace("computing weighted list from question node", {node: questionNode});
        if (!questionNode.hasAttribute("xpath")) questionNode.setAttribute("xpath", "*"); // default value
        trace.substep("grabbing problems which match xpath");
        let matches = getProblemsFromSelector(questionNode.getAttribute("xpath"), theseProblems);
        let returner = [];
        trace.substep("getting problem weights");
        for (let match in matches) if (!(match in unavailableProblems)) {
            trace.substep(match, false);
            let pusher = {problem: match, originalWeight: 1}; // default weight is 1, modify later if necessary
            returner.push(pusher);
            if (questionNode.hasAttribute("weight")) {
                let weight = questionNode.getAttribute("weight");
                if (isFinite(weight)) pusher.originalWeight = weight;
                else {
                    // here weight depends on meta value, so do eval to get it
                    let evaluateMe = weight;
                    // replace attribute calls (@scale-meta-name) with the appropriate values
                    for (let meta in metas) if (metas[meta].metaType == "scale") {
                        let metaNode = theseProblems[match].doc.querySelector(meta + "[scale]");
                        evaluateMe = evaluateMe.replaceAll(
                            RegExp("@"+meta, "g"),
                            "(" + (metaNode? metaNode.getAttribute("scale"): 0) + ")"
                        );
                    }
                    // security check: no letters allowed in eval
                    if (evaluateMe.match(/\p{L}/)) throw generatorStuff.errorTrace = errorTrace.newErrorTrace("bad eval", {node: questionNode}).substep(evaluateMe);
                    pusher.originalWeight = eval(evaluateMe);
                }
            }
        }
        generatorStuff.errorTrace = trace.substep("compiling into weighted list");
        return weightedList(returner, generatorStuff.originalWeightAccessor);
    }
    
    generatorStuff.originalWeightAccessor = function(e) {return e.originalWeight}
    
    generatorStuff.copyConfig = function copyConfig(configuration) {
        let trace = generatorStuff.errorTrace = errorTrace.newErrorTrace("identifying nodes for error tracking", {node: xmlImporter.getRoot(configuration)});
        let id = 0;
        function identify(node) {
            node.setAttribute("configId", id++);
            for (let child of node.childNodes) if (child.nodeType === 1) identify(child);
        }
        identify(xmlImporter.getRoot(configuration));
        trace.substep("getting a copy");
        return configuration.cloneNode(true);
    }
    
    generatorStuff.getProblemsFromGroup = function getProblemsFromGroup(theseProblems, groupNode, thisGroup = {}) {
        let trace = generatorStuff.errorTrace = errorTrace.newErrorTrace("computing group's problems", {node: groupNode});
        for (let child of groupNode.childNodes) {
            if (child.nodeName === "section") getProblemsFromGroup(theseProblems, child, thisGroup);
            else if (child.nodeName == "question") {
                generatorStuff.errorTrace = trace.substep("getting matches from a question node");
                for (let match in getProblemsFromSelector(child.getAttribute("xpath"), theseProblems)) thisGroup[match] = undefined;
            }
        }
        return thisGroup;
    }
    
    generatorStuff.combineQuestionWeightGroups = function combineQuestionWeightGroups(sectionNode, doc) {
        let trace = generatorStuff.errorTrace = errorTrace.newErrorTrace("combining question weight groups", {node: sectionNode});
        let child = sectionNode.firstChild, activeGroup;
        while (child) {
            if (child.nodeName === "section") {
                generatorStuff.combineQuestionWeightGroups(child, doc);
                generatorStuff.errorTrace = trace;
            } else if (child.nodeName !== "question") {
                child = child.nextSibling;
                continue;
            }
            trace.substep("processing question node");
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
        generatorStuff.errorTrace = trace.substep("finished question nodes");
    }
    
    generatorStuff.countQuestions = function countQuestions(sectionNode) {
        generatorStuff.errorTrace = errorTrace.newErrorTrace("counting questions", {node: sectionNode});
        let returner = 0;
        for (let child of sectionNode.childNodes) {
            if (child.nodeName === "section") returner += generatorStuff.countQuestions(child);
            else if (child.nodeName === "question" || child.nodeName === "weightGroup") ++returner;
        }
        return returner;
    }
    
    generatorStuff.setQuestionOrder = function setQuestionOrder(sectionNode, order) {
        generatorStuff.errorTrace = errorTrace.newErrorTrace("setting question order", {node: sectionNode});
        for (let child of sectionNode.childNodes) {
            if (child.nodeName === "section") generatorStuff.setQuestionOrder(child, order);
            else if (child.nodeName === "question" || child.nodeName === "weightGroup") child.setAttribute("order", order.pop());
        }
    }
    
    generatorStuff.typeset = function typeset(node, loadHere, theseProblems, nestLevel = 0) {
        let trace = generatorStuff.errorTrace = errorTrace.newErrorTrace("typesetting", {node: node});
        if (node.nodeName === "section") {
            trace.substep("typesetting section");
            let doShuffle = false, name = node.hasAttribute("displayName");
            for (let child of node.childNodes) doShuffle = doShuffle || child.nodeName === "shuffle";
            if (name) {
                trace.substep("setting section title");
                ++nestLevel;
                loadHere = xmlImporter.element("div", loadHere, ["class", "testsection"]);
                xmlImporter.text(node.getAttribute("displayName"), xmlImporter.element("h"+Math.max(nestLevel, 6), loadHere));
            }
            if (doShuffle) loadHere = xmlImporter.element("div", loadHere);
            for (let child of node.childNodes) generatorStuff.typeset(child, loadHere, theseProblems, nestLevel);
            generatorStuff.errorTrace = trace;
            if (doShuffle) {
                trace.substep("shuffling");
                let children = [], child;
                while (child = loadHere.firstChild) {
                    loadHere.removeChild(child);
                    children.push(child);
                }
                shuffle(children);
                for (let c of children) loadHere.appendChild(c);
            }
        } else if (node.hasAttribute("chosenProblem")) {
            trace.substep("typesetting question");
            loadHere = xmlImporter.element("div", loadHere, ["class", "question"]);
            xmlImporter.text("question number", xmlImporter.element("span", loadHere, ["class", "questionnumber"]));
            loadHere.insertAdjacentHTML("beforeend", texAttToInnerHTML(theseProblems[node.getAttribute("chosenProblem")].doc.querySelector("problem").getAttribute("tex")));
        }
    }
    
    generatorStuff.setQuestionNumbers = function setQuestionNumbers(node, questionNumberHere) {
        generatorStuff.errorTrace = errorTrace.newErrorTrace("setting question numbers", {node: node});
        if (node.getAttribute("class") === "questionnumber") node.firstChild.nodeValue = questionNumberHere.value++;
        else for (let child of node.childNodes) if (child.getAttribute) generatorStuff.setQuestionNumbers(child, questionNumberHere);
    }
    
    generatorStuff.errors = {};
    
    function makePracticeTest(theseProblems, configuration, callback, numTries = 100) {
        let startedWith = numTries;
        // Why the internal function makeTest? To allow for window.setTimeout callbacks which give time between each try so as to update the number of tries displayed to the user in putTestCountHere
        function makeTest() {
            if (putTestCountHere) putTestCountHere.nodeValue = "tries left: " + numTries;
            let trace = generatorStuff.errorTrace = errorTrace.newErrorTrace("making practice test", {node: xmlImporter.getRoot(configuration)});
            try {
                let usedProblems = {};
                generatorStuff.errorTrace = trace.substep("obtaining mutable copy of configuration");
                let identifiedConfig = generatorStuff.copyConfig(xmlImporter.trim(configuration));
                let configRoot = xmlImporter.getRoot(identifiedConfig);
                generatorStuff.errorTrace = trace.substep("choosing from weighted sections");
                generatorStuff.resolveWeightedSections(configRoot);
                let groups = [], forcedGroups = [];
                generatorStuff.errorTrace = trace.substep("computing question groups");
                for (let child of configRoot.childNodes) if (child.nodeName === "group") (child.hasAttribute("force")? forcedGroups: groups).push(generatorStuff.getProblemsFromGroup(theseProblems, child));
                generatorStuff.errorTrace = trace.substep("removing forced group questions");
                for (let group of forcedGroups) for (let blocked in group) usedProblems[blocked] = undefined;
                let rootSections = [];
                generatorStuff.errorTrace = trace.substep("setting primary sections");
                for (let child of configRoot.childNodes) if (child.nodeName === "section") rootSections.push(child);
                let numQuestions = 0;
                for (let section of rootSections) {
                    generatorStuff.errorTrace = trace.substep("processing section");
                    generatorStuff.combineQuestionWeightGroups(section, identifiedConfig);
                    numQuestions += generatorStuff.countQuestions(section);
                }
                generatorStuff.errorTrace = trace.substep("setting question choosing order");
                let order = [numQuestions];
                for (let i = 0; i < numQuestions; ++i) order[i] = i;
                shuffle(order);
                generatorStuff.setQuestionOrder(configRoot, order);
                generatorStuff.errorTrace = trace.substep("choosing questions");
                for (let i = 0; i < numQuestions; ++i) {
                    let questionNode = identifiedConfig.querySelector("[order='"+i+"']");
                    let questionTrace = generatorStuff.errorTrace = errorTrace.newErrorTrace("choosing question", {node: questionNode});
                    questionTrace.substep("collecting possible choices");
                    let possibleQuestions;
                    if (questionNode.nodeName === "question") possibleQuestions = generatorStuff.getWeightedQuestions(theseProblems, usedProblems, questionNode);
                    else {
                        possibleQuestions = weightedList([]);
                        for (let q of questionNode.childNodes) possibleQuestions.addAll(generatorStuff.getWeightedQuestions(theseProblems, usedProblems, q));
                    }
                    generatorStuff.errorTrace = questionTrace.substep("choosing from "+possibleQuestions.array.length+" possible questions");
                    let chosenProblem = possibleQuestions.chooseOne().problem;
                    questionNode.setAttribute("chosenProblem", chosenProblem);
                    usedProblems[chosenProblem] = undefined;
                    generatorStuff.errorTrace = questionTrace.substep("marking chosen question and related questions as used");
                    for (let i = 0; i < groups.length; ++i) if (chosenProblem in groups[i]) {
                        for (let relative in groups[i]) usedProblems[relative] = undefined;
                        groups.splice(i--, 1);
                    }
                }
                generatorStuff.errorTrace = trace.substep("typesetting test");
                let test = xmlImporter.element("div", null, ["class", "practicetest"]);
                for (let section of rootSections) generatorStuff.typeset(section, test, theseProblems);
                generatorStuff.errorTrace = trace.substep("setting question numbers");
                generatorStuff.setQuestionNumbers(test, {value: 1});
                generatorStuff.errors = {};
                callback(test, true);
            } catch (e) {
                // found error, interpret and return interpretation
                let trace = generatorStuff.errorTrace;
                let message = "<h5>Error found while " + trace.step+"</h5>";
                for (let substep of generatorStuff.errorTrace.substeps) message += "<h6>  --  "+substep+"</h6>";
                if ((typeof trace.lastSubstep !== "undefined") && trace.lastSubstep !== trace.substeps[trace.substeps.length-1]) message += "<h6> -- "+trace.lastSubstep+"</h6>";
                message += "<br>";
                message += "<h6>Erroneous node:</h6>";
                let errorNode = generatorStuff.errorTrace.arguments.node, ogNode = configuration.querySelector("[configId=\""+errorNode.getAttribute("configId")+"\"]");
                let erase = function(node) {
                    if (node.removeAttribute) node.removeAttribute("configId");
                    for (let child of node.childNodes) erase(child);
                }
                erase(configuration);
                message += xmlImporter.nodeToInnerHTML(configuration, ogNode);
                if (message in generatorStuff.errors) ++generatorStuff.errors[message];
                else generatorStuff.errors[message] = 1;
                if (numTries > 1) {
                    --numTries;
                    window.setTimeout(makeTest, 10);
                } else {
                    let max = 0;
                    for (let m in generatorStuff.errors) max = Math.max(max, generatorStuff.errors[m]);
                    for (let m in generatorStuff.errors) callback("<h6>Failed "+startedWith+" times. Coming in with "+max+" fails, the most common error was:</h6>"+m, false);
                }
            }
        }
        makeTest();
    }
}
/*
    Weigted list process:
    A weighted list is an array where each member is given a weight. The model is based on half open intervals in the number line: the weight is the width and they are stacked adjacently so that they combine into one total half open interval. The primary functionality of a weighted list is the random choice function which picks a random number in the total interval and returns which element claims that region of space.
*/
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
        return returner;
    }
}
/*
    Error tracing:
    We want to be able to tell what was happening if an error is thrown. We also want to do this without try-catching every single operation. To get around lots of try-catching, we instead plant error messages in an error tracer.
    
    Only the outermost function has to be try-catched. Upon catching an error in this outermost catch, the error tracker will have the most recent error message saved and ready to display. These messages are intended to describe what is about to happen, so that the user can tell which step was started but not stopped.
    
    The benefit of doing this instead of printing a stack trace is that the messages can be planted at the structural level instead of the javascript function call level, so a user can tell which step caused an issue without knowing the javascript structure.
    
    Structure:
        - The process: This is what contains the try-catch and what knows how to interpret the error messages.
        - Step: A major step in the process. Each step comes with a separate errorTrace object, descibed below. Each step stores its arguments in its errorTrace.
        - Substep: A step in a step. These do not get their own errorTrace objects, they instead append a message to the step's errorTrace. This message is supposed to say what is about to be done in the major step.
    
    The end user is supposed to know the structure of the process in terms of steps and substeps. That way, when an errorTracer is interpreted and given to the user, they can tell which part of which step failed so they can fix whatever was wrong in that step.
    
    The errorTrace object:
        - step: String, name of the step
        - arguments: Object, holds the arguments given to the step
        - substeps: Array of Strings, holds the messages planted in each substep
    
    Using an errorTrace: The process has a holding object which holds the most recently seeded errorTrace. That is, the process' holding object always points to the active step/substep. The process also has an interpreter which can take this active errorTrace and present its contents to the user in the event of an error.
*/
let errorTrace = {};

errorTrace.protoModel = {};

errorTrace.newErrorTrace = function newErrorTrace(stepName, arguments) {
    let returner = Object.create(errorTrace.protoModel);
    returner.step = stepName;
    returner.arguments = arguments;
    returner.substeps = [];
    return returner;
}

errorTrace.protoModel.substep = function substep(message, save = true) {
    this.lastSubstep = message;
    if (save) this.substeps.push(message);
    return this; // return is for focusing on the active step
}