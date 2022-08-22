/*
 * Contains the functions needed to load and display problems
 *
 * Main logic: loadProblemsArray() then afterProblemsLoaded()
 * Requires problemSearch for creating search UI creation
 * 
 */

// Announces functions calls to the console if true
let debug = false;
var AllProbs;

// Load problems from a single JSON file containing an array of json problem objects
function loadProblemsArray(qualName) {
    let probs = [];
    if(debug) console.log("loadProblemsArray("+qualName+")");

    fetch("/quals/"+qualName+"/problemsArray.json")
    .then(response => {
        if (!response.ok) {
            console.log("Failed to fetch problemsArray.json");
            throw new Error("HTTP error " + response.status);
        }
        if(debug) console.log("Fetch resolving");
        return response.json();
    })
    .then(jsonResp => {
        if(debug) console.log("Fetch finishing");
        probs = jsonResp;
        if(debug) console.log(probs);
        afterProblemsLoaded(probs);
    });
}

// To be run after all problems are loaded into an array
function afterProblemsLoaded(probs){
    AllProbs = probs;
    displayProblems(probs);
    makeTopicsUI(probs);
    makeTestCreatorUI();
}

// This displays all problems in the div with id "problemsHere"
function displayProblems(probs){
    if(debug) console.log("displayAllProblems");

    str = "";     
    for (let i in probs){
        probText = formatTex(probs[i].probTex);
        solnText = formatTex(probs[i].solnTex);
        summary = "<strong>"+probs[i].name+":</strong> "+probText+"<br>";
        content = "<strong>Solution: </strong>"+solnText;
        pstring = "\n\t<details class = \'problem\'>\n\t\t<summary>"+summary+"<br></summary>\n\t\t<p>"+content+"</p>\n\t</details>";

        str += pstring;
    }

    document.getElementById("problemsHere").innerHTML = str;
    //console.log(str); //Use this to get a copy of the html. Can be used to load onto a static page listing all problems
    MathJax.typeset();
}

// Processes raw tex code stored in json formatting for replacement into html text
// Currently unused; all instances of '\\n' have been manually removed 
function formatTex(tex){
    //oldTex=tex;//If old tex is needed

    // tex = tex.replaceAll("\\neq", "%NotEqualToPlaceHolder%");
    // tex = tex.replaceAll("\\n", "<br>");
    // tex = tex.replaceAll("%NotEqualToPlaceHolder%", "\\neq");

    return tex;
}

//------------------------------------------------------------------------------------------------------------------------------------
// Starts the process of loading problems one by one, and then calls the function afterProblemsLoaded
// This is much slower for many problems, and has since been depreciated in favor of loading from one file
function loadProblems(qualName="complex"){
    let probs = [];
    if(debug) console.log("loadProblems("+qualName+")");

    loadTextFile("/quals/"+qualName+"/problemsList.txt",
        probs, qualName, 
        afterProblemsLoaded,
        sequentialLoadProblems,
        function() {
            console.log("Failed to load problems list text file.")
        }
    );
}

// Open a text file at a given location, then if successful execute the function:
// finished(result text, args)
function loadTextFile(location, pass1, pass2, pass3, finished,
    failed=function(){
        console.warn("Failed HTTP request at " + location)
    }) 
{
    if(debug) console.log("openTextFile");
    let req = new XMLHttpRequest();
    req.onload = function() {
        if (req.status == 404) return failed();
        finished(req.responseText, pass1, pass2, pass3)
    }
    req.onerror = failed;
    req.open("GET",location);
    req.overrideMimeType("text/plain");
    req.send();
}

// Splits problems list into an array and then calls a recursive function to load each problem in sequence. At the end of the last problem loading, lastFunction() is called.
function sequentialLoadProblems(probsList, probs, qualName, lastFunction) {
    if(debug) console.log("loadJSONProblems");
    if (probsList === "") {
        console.log("Problem names text file is empty.")
        return;
    }
    probsList = probsList.split(" ");
    
    // Recursively loads problems in nested fetch.then().then() statements, then executes processProblems
    fetchAndLoad(0, probsList, probs, qualName, lastFunction);

}

// A recursive function to fetch a file, then fetch the next file, then... until the last file is fetched, and then calls lastFunction. 
function fetchAndLoad(index, probsList, probs, qualName, lastFunction) {
    if(index < 0 || index > probsList.length ){
        if(debug) console.log("Invalid index in fetchAndLoad.");
        return;
    }else if(index == probsList.length){
        if(debug) console.log("Calling last function.")
        lastFunction(probs);
    }else {
        fetch("/quals/"+qualName+"/jsonProblems/"+probsList[index]+".json")
        .then(response => {
            if (!response.ok) {
                console.log("Failed to fetch "+probsList[index]+".json");
                throw new Error("HTTP error " + response.status);
            }
            if(debug) console.log("Fetch resolving");
            return response.json();
        })
        .then(jsonResp => {
            if(debug) console.log("Fetch finishing");
            probs[index] = jsonResp;
            fetchAndLoad(index+1,probsList,probs,qualName,lastFunction);
        });
    }
}