var problemsData;

begin();

// The initial function to be called. When problems are loaded, the main function is called
function begin() {
    // Global declaration of qual name
    qualName = "complex";
    dir = "../quals/"+qualName+"/problems.json";
    loadProblems(dir);
}

// Called once the problems.json file is loaded
function main(probs) {
    console.log(probs);
    problems = probs.problemsArray;
    document.getElementById("problemsHere").innerHTML = JSON.stringify(problems[0]);
    //MathJax.typeset();

    document.getElementById("problemsHere").innerHTML = JSON.stringify(problems[0]);

    //text = formatProblems(problems);
    
}


// Load problems.json from the appropriate qual directory
// Seems to return a promise instead of the result, unfortunately 
async function getJsonFromFile(dir) {
    let response = await fetch(dir);
    let jsondata = await response.value;
    return jsondata;
}

// Prints the contents of the problems json file to the console
function loadProblems(dir) {
    fetch(dir)
    .then(response => {
        return response.json();
    })
    .then(jsondata => main(jsondata));
}

// Create a formatted string with the specified problems
function formatProblems(problems,selector) {
    //problems.filter(selector)
    output = "";
    for (let p in problems) {

    }

}