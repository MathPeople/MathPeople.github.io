

let probs = [];
let debug = true;

//loadJSONProblemsMain().then(probs => processProblems(probs));
loadJSONProblemsMain();
//processProblems();

function loadJSONProblemsMain() {
    if(debug) console.log("loadJSONProblemsMain");

    qualName = "complex";
    probs = [];

    // Start an HTTP request to load the list of problems
    // This list has the names of the files which need to be loaded
    openTextFile(
        "/quals/"+qualName+"/problemsList.txt", // File to open-- the problem list for a given qual
        probs, qualName, // Parameters to pass to the function below
        loadJSONProblems,
        function() {
            console.log("Failed to load problems list text file.")
        }
    );

    // Warning -- the rest of this code executes before problems are loaded
    if(debug) console.log("loadJSONProblemsMain finished");

}

function processProblems(){
    if(debug) console.log("processProblems");
    console.log(probs);

    str = "Problems:<br>"

    for (let i in probs){
        console.log(probs[i]);
        str = str + probs[i].name + "<br>";
    }

    document.getElementById("problemsHere").innerHTML = str;

    //console.log(str);
}

// On successful load of the file names, load each of those files
function loadJSONProblems(probsList, probs, qualName) {
    if(debug) console.log("loadJSONProblems");
    if (probsList === "") {
        console.log("Problem names text file is empty.")
        return;
    }
    probsList = probsList.split(" ");
    //if(debug) console.log(probsList);

    for (let problem of probsList) {
        fetchJSONFile(
            "/quals/"+qualName+"/jsonProblems/"+problem+".json",
            probs,
            loadJSONProblem,
            function() {console.log("Problem "+problem+" failed to load.")}
        );

    }

}

// Parse the JSON file into a javascript object, then add it to the array of problems
function loadJSONProblem(jsonProblem, probs){
    if(debug) console.log("loadJSONProblem");
    // console.log(jsonProblem);
    // console.log(jsonProblem.name);
    let p = jsonProblem;


    //let p = JSON.parse(jsonProblem); // JSON problem is already an object apparently
    //console.log(p.name);
    probs.push(p);
    //console.log(p);
    //document.getElementById("problemsHere").innerHTML = p.name;
}

// Open a text file at a given location, then if successful execute the function:
// finished(result text, pass1, pass2)
function openTextFile(location, pass1, pass2, finished,
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
function fetchJSONFile(location, pass1, finished, 
    failed=function(){
        console.warn("Failed HTTP request at " + location)
    })
{
    if(debug) console.log("fetchJSONFile");
    //console.log(location);
    fetch(location)
    .then(response => {
        if (!response.ok) {
            console.log("Failed to fetch json file.");
            throw new Error("HTTP error " + response.status);
        }
        if(debug) console.log("Fetch resolving");
        return response.json();
    })
    .then(jsonResp => {
        if(debug) console.log("Fetch finishing");
        finished(jsonResp,pass1);
        return jsonResp;
    });
}




