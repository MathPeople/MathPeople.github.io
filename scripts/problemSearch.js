var AllProbs;
var TopicsList;

function makeTopicsUI(probs){
    if(debug) console.log("makeTopicsUI");
    AllProbs = probs;

    let topicsList = [];
    for (let i in probs){
        //console.log(probs[i].topics);
        for (let j in probs[i].topics)
            topicsList.push(probs[i].topics[j]);
    }
    topicsList = [...new Set(topicsList)]; // Convert to a mathematical set (with no duplicates), then back to an array
    //console.log(topicsList);
    TopicsList = topicsList;

    topicsHTML = "<div class=\'grid\'>";
    for( let topic of topicsList){
        topicsHTML = topicsHTML + "\n<div>\n\t<label for=\'"+topic+"\'>\n\t\t<input type=\'checkbox\' id=\'"+topic+"\' name=\'"+topic+"\' value=\'yes\'>"+topic+"\n\t</label>\n</div>";
    }
    topicsHTML += "\n</div>";
    topicsHTML += "\n<button onclick=\'filterProblemsByTopics()\'>Filter Problems</button>";
    topicsHTML += "\n<button onclick=\'displayAllProblems()\'>Display All</button>";
    document.getElementById("topicsUIHere").innerHTML = topicsHTML;

}

//Display only those problems which match at least one of the selected topics checkboxes
function filterProblemsByTopics(){
    displayedProbs = [];

    // Filter the problems by topic
    probsByTopic = [];

    for(let p of AllProbs){
        for(let topic of p.topics){
            if(typeof probsByTopic[topic] === 'undefined')
                probsByTopic[topic] = [];
            
            probsByTopic[topic].push(p);
        }
    }
    for(let t in probsByTopic){
        probsByTopic[t] = [...new Set(probsByTopic[t])]; // Remove duplicates
    }
    //console.log(probsByTopic);

    //Query topics option. If topic is selected, add all problems to displayed problems
    for(let t in probsByTopic){
        // console.log('#'+t);
        // console.log(document.querySelector('#'+t));
        if(document.querySelector('#'+t).checked){
            for(let p of probsByTopic[t])
                displayedProbs.push(p);
        }
    }

    //Remove duplicates
    displayedProbs = [... new Set(displayedProbs)];
    //console.log(displayedProbs);
    displayProblems(displayedProbs);
}

//Display all problems. For use in buttons/where arguments are unavailable
function displayAllProblems() {
    displayProblems(AllProbs);
}