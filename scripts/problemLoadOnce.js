
// Code to run on start. All code to be run after problems are loaded should go in afterProblemsLoaded()
if(typeof qualName == 'undefined')
    console.log("No qual name specified; unable to load problems.")
else 
    loadProblemsArray(qualName);