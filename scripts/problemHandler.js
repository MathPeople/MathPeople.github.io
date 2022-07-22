/* 
The following program is meant for handling problems dynamically through UI interaction. It is meant to be an object oriented rewrite of "problems.js" which allows for accessing individual problems and their properties. 

Loads problems and their metadata
Creates a list of searchable properties
Creates UI elements to filter which problems are displayed
Displays problems matching current filter properties

Dependencies:
    * problemLoader
    * problemFunctions
    * xmlImporter
    * others?

*/


// Load scripts and then run the start() function
// Scripts start with xmlImporter so that we can use its functionality to autoload the rest
let loader = document.createElement("script");
loader.setAttribute("type", "text/javascript");
loader.setAttribute("src", "/scripts/xmlImporter.js");
// Load the other scripts
loader.addEventListener("load", function() {
    loadScript("jax", function() {
        loadScript("problemLoader", function() {
            loadScript("problemFunctions", function() {
                loadScript("practiceTests", function() {
                    loadScript("showProblems", start);
                });
            });
        });                        
    });
});
document.head.appendChild(loader);

//----------------------------------------------------------------------------------------------------------------

// xmlImporter.js, jax.js, and practiceTests.js are all loaded so see what application we are being used in and start that application.
function start() {
    if (document.getElementById("searchLoc")) {
        // set up editor
        loadScript("problemSearch");
        return;
    }
    scanAndProcessDOMProblems();
    // any other applications beyond the two already created can be linked in here

}

//----------------------------------------------------------------------------------------------------------------

// Loads an individual javascript of the form "scripts/NAME_HERE.js", where NAME_HERE = location
// This function must be declared here
function loadScript(location, finished = function() {}) {
    xmlImporter.element(
        "script",
        document.head,
        ["type", "text/javascript",
         "src", "/scripts/"+location+".js"]
    ).addEventListener("load", finished);
}

//----------------------------------------------------------------------------------------------------------------
let globalErrorOut = document.createElement("p");
window.setTimeout(function() {document.body.appendChild(globalErrorOut)}, 2000);
globalErrorOut.setAttribute("id", "globalErrorOut");
window.addEventListener("error", function(e) {
    globalErrorOut.innerHTML = "<pre class='message'>"+e.error.message+"</pre><pre class='stack'>"+e.error.stack+"</pre>";
});
//----------------------------------------------------------------------------------------------------------------

