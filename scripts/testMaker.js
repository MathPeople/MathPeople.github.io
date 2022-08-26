/*
 * Contains the functionality for creating practice tests
 * Requires problems to be loaded
 * 
 */

// Makes a button for creating a new practice test. Called in afterProblemsLoaded()
function makeTestCreatorUI(){
    if(debug) console.log("makeTestCreatorUI");
    
    if(document.getElementById("testMakerUIHere") !== null){

        // Make a button
        var button = document.createElement('button');
        button.innerText = "Make New Test";
        button.addEventListener('click', function(){
            makeNewTest(qualName);
        });

        document.getElementById("testMakerUIHere").appendChild(button);
    }   
}

// Generates a practice test for the specified format (typically, the qual name)
function makeNewTest(testFormat) {
    if(AllProbs == null) 
        console.log("Problems not loaded. Cannot make test.");
    else{
        viableProbs = filterViableProblems(AllProbs);
                
        switch(testFormat) {
            case "complex": 
                makeComplexTest(viableProbs);
                break;
            case "real":
                makeRealTest(viableProbs);
                break;
            default: 
                if(debug) console.log("makeNewTest() called with unknown test format.")
        }
    }
}

/*
 * Creates a complex analysis practice test with the following format:
 *     - At least one Montel, one RealIntegral, and one Liouville problem
 *     - First six problems from Parts A & B material
 *     - Three random problems from Part C
 * 
 */
function makeComplexTest(viableProbs) {
    probsByTopic = sortProblemsByTopic(viableProbs);
    
    // Create new arrarys without any Part C problems, aka those tagged RiemannSurfaces
    abProbs = [...viableProbs]; 
    for(i = abProbs.length; i--;){
        if(abProbs[i].topics.includes("RiemannSurfaces") || abProbs[i].topics.includes("PartC")){
            abProbs.splice(i,1);
        }
    }
    abProbsByTopic = sortProblemsByTopic(abProbs);

    testProbs = [];
    // Add problems of the specified topics.
    testProbs.push(getRandomProblems(abProbsByTopic["Montel"],1)[0]);
    testProbs.push(getRandomProblems(abProbsByTopic["RealIntegral"],1)[0]);
    testProbs.push(getRandomProblems(abProbsByTopic["Liouville"],1)[0]);

    // Remove duplicate problems. Occurs if the same problem is chosen more than once above
    testProbs = [... new Set(testProbs)];

    // Fill remaining first six problems with distinct problems from Parts A & B
    while(testProbs.length<6){
        if(abProbs.length <= 0) 
            break; //Loop will eventually terminate when all problems are removed from abProbs. Forces loop to end if there are not enough abProblems to populate testProbs

        newProb = getRandomProblems(abProbs,1)[0];
        abProbs.splice(abProbs.indexOf(newProb),2);
        testProbs.push(newProb);

        testProbs = [... new Set(testProbs)];
    }

    // Add three random Part C problems
    cProbs = getRandomProblems(probsByTopic["RiemannSurfaces"],3);
    for(p in cProbs)
        testProbs.push(cProbs[p]);

    // Test is output as the displayed problems. 
    // Todo: make a printable version output
    if(debug) console.log(testProbs);
    displayProblems(testProbs);
    
}

/*
 *  Create an eight question practice test, taking two problems from each of the four categories
 *
 * 
 */
function makeRealTest(viableProbs){
    probsByTopic = sortProblemsByTopic(viableProbs);

    testProbs = [];
    for(p of getRandomProblems(probsByTopic["UndergradProblem"],2)){
        testProbs.push(p);
    }
    for(p of getRandomProblems(probsByTopic["PartA"],2)){
        testProbs.push(p);
    }
    for(p of getRandomProblems(probsByTopic["PartB"],2)){
        testProbs.push(p);
    }
    for(p of getRandomProblems(probsByTopic["PartC"],2)){
        testProbs.push(p);
    }
    displayProblems(testProbs);
}

// Remove any problems which are specified as non-viable. Returns a filtered list
// Todo: add a boolean "isViable" property versus a string
function filterViableProblems(probs){
    // Remove non-viable problems. Starts from end of list to avoid 
    for(var i = probs.length; i--;){
        if(probs[i].viability == "bad")
            probs.splice(i,1);
    }
    return probs;
}

// Get n random problems from the given list
function getRandomProblems(probs, n){
    probs.sort(() => Math.random()-0.5);
    return probs.splice(0,n);
}

// Create an array, indexed by the topic name, containing a list of problems with that topic. Used to quickly find all problems with a given topic
function sortProblemsByTopic(probs){
    probsByTopic = [];
    for(let p of probs){
        for(let topic of p.topics){
            if(typeof probsByTopic[topic] === 'undefined')
                probsByTopic[topic] = [];
            
            probsByTopic[topic].push(p);
        }
    }
    for(let t in probsByTopic){
        probsByTopic[t] = [...new Set(probsByTopic[t])]; // Remove duplicates
    }
    return probsByTopic;
}