
let debug = true; // Announces function calls to the console

let problems = loadJSONProblemsMain();
console.log("End script?");

async function loadJSONProblemsMain() {

    qualName = "complex";
    let probs = [];

    // Start an HTTP request to load the list of problems
    // This list has the names of the files which need to be loaded
    let jsonProbs = await openTextFile(
        "/quals/"+qualName+"/problemsList.txt", // File to open-- the problem list for a given qual
        probs, qualName, // Parameters to pass to the function below
        loadJSONProblems,
        function() {
            console.log("Failed to load problems list text file.")
        }
    );
    
    for (let jsonP in jsonProbs){
        let p = await loadJSONProblem(jsonP);
        probs.push(p);
    }

    console.log(probs);


    if(debug) console.log("Finished.");
    return probs;
}

// On successful load of the file names, load each of those files
async function loadJSONProblems(probsList, probs, qualName) {
    if(debug) console.log("loadJSONProblems");
    if (probsList === "") {
        console.log("Problem names text file is empty.")
        return;
    }
    probsList = probsList.split(" ");

    let jsonProbs = [];

    for (let problem of probsList) {
        p = await fetchJSONFile(
            "/quals/"+qualName+"/jsonProblems/"+problem+".json",
            probs,
            function () {},
            function() {console.log("A problem failed to load.")}
        );
        jsonProbs.push(p);
    }

    return jsonProbs;
}

// Parse the JSON file into a javascript object, then add it to the array of problems
async function loadJSONProblem(jsonProblem){
    if(debug) console.log("loadJSONProblem");
    //let p = jsonProblem;
    probs.push(jsonProblem);
    //console.log(p.name);
    return jsonProblem;
}

// Open a text file at a given location, then if successful execute the function:
// finished(result text, pass1, pass2)
async function openTextFile(location, pass1, pass2, finished,
    failed=function(){
        console.warn("Failed HTTP request at " + location)
    }) 
{
    if(debug) console.log("openTextFile");
    let req = new XMLHttpRequest();
    req.onload = function() {
        if (req.status == 404) return failed();
        finished(req.responseText, pass1, pass2)
    }
    req.onerror = failed;
    req.open("GET",location);
    req.overrideMimeType("text/plain");
    req.send();
    return req.responseText;
}

// Open a JSON file with the given address, then if successful execute the function:
// finished(json result, pass1, pass2)
function openJSONFile(location, pass1, pass2, finished,
    failed=function(){
        console.warn("Failed HTTP request at " + location)
    })
{
    if(debug) console.log("openJSONFile");
    let req = new XMLHttpRequest();
    req.onload = function() {
        if (req.status == 404) return failed();
        finished(req.responseText, pass1, pass2)
    }
    req.onerror = failed;
    req.open("GET",location);
    req.overrideMimeType("text/json"); // This is the only difference b/w this and the text file 
    req.send();
}

// Another approach to loading a JSON file
async function fetchJSONFile(location, pass1, pass2, finished, 
    failed=function(){
        console.warn("Failed HTTP request at " + location)
    })
{
    if(debug) console.log("fetchJSONFile");
    //console.log(location);
    fetch(location)
    .then(response => function() {
        if (!response.ok) {
            throw new Error("HTTP error " + response.status);
        }
        return response.json();
    })
    .then(json => function() {
        finished(json,pass1,pass2);
        return json
    });
}