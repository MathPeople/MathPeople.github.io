
// Loads the problemSearch script
var newScript = document.createElement('script');
newScript.type = 'text/javascript';
newScript.src = '/scripts/problemSearch.js';
document.getElementsByTagName('head')[0].appendChild(newScript);

// Announces functions calls if true
let debug = false;

// Code to run on start. All code to be run after problems are loaded should go in afterProblemsLoaded()
if(typeof qualName == 'undefined')
    console.log("No qual name specified; unable to load problems.")
else 
    loadProblems(qualName);


// Starts the process of loading problems, and then calls the function afterProblemsLoaded
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

function afterProblemsLoaded(probs){
    displayProblems(probs);
    makeTopicsUI(probs);
}

// This displays all problems in the div with id "problemsHere"
function displayProblems(probs){
    if(debug) console.log("displayAllProblems");
    //console.log(probs);

    str = ""; //"Problems:<br>"
    
    for (let i in probs){
        probText = formatTex(probs[i].probTex);
        solnText = formatTex(probs[i].solnTex);
        summary = "<strong>"+probs[i].name+":</strong> "+probText+"<br>";
        content = "<strong>Solution: </strong>"+solnText;
        pstring = "\n\t<details class = \'problem\'>\n\t\t<summary>"+summary+"<br></summary>\n\t\t<p>"+content+"</p>\n\t</details>";

        //console.log(probs[i]);
        str = str + pstring;
    }

    document.getElementById("problemsHere").innerHTML = str;
    //console.log(str); //Use this to get a copy of the html to load onto a static page listing all problems
    MathJax.typeset();

    //console.log(str);
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

// Processes raw tex code stored in json formatting for replacement into html text
function formatTex(tex){
    //oldTex=tex;//If old tex is needed
    tex = tex.replaceAll("\\neq", "%NotEqualToPlaceHolder%");
    tex = tex.replaceAll("\\n", "<br>");
    tex = tex.replaceAll("%NotEqualToPlaceHolder%", "\\neq");
    return tex;
}