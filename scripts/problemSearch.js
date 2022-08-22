/*
 * Contains the functions for creating search UI functionality
 * Currently supports filtering problems by topic 
 * 
 * 
 */

// Global variables; needed for buttons in HTML which cannot pass parameters
// var AllProbs; // Moved to problemLoading.js
var TopicsList;

// Creates a checkboxes UI and a filter problems button in the div tag "topicsUIHere"
function makeTopicsUI(probs){
    if(debug) console.log("makeTopicsUI");
    //AllProbs = probs; //Loaded elsewhere now

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
    // topicsHTML += "\n<button onclick=\'filterProblemsByTopics()\'>Filter Problems</button>";
    // topicsHTML += "\n<button onclick=\'displayAllProblems()\'>Display All</button>";
    document.getElementById("topicsUIHere").innerHTML = topicsHTML;
    document.getElementById("topicButtonsHere").innerHTML = "<button onclick=\'filterProblemsByTopics()\'>Filter Problems</button>\n<button onclick=\'displayAllProblems()\'>Display All</button>";

}

// Display only those problems which match at least one of the selected topics checkboxes
// Designed to be used by a button or otherwise
function filterProblemsByTopics(){
    displayedProbs = [];

    // Create an array indexed by topic of matching problems
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

    //Query all topics selectors (used in checkboxes.) If topic is selected, add all problems to displayed problems array
    for(let t in probsByTopic){
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

// Display all problems. For use in buttons or other places where arguments are unavailable
function displayAllProblems() {
    displayProblems(AllProbs);
}