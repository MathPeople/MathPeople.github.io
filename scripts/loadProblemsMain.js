/*
 * This is the main code to be run on a page loading required to display problems
 * See problemLoading.js for the functions to be run and documentation thereof 
 * 
 */

// Code to run on start. All code to be run after problems are loaded should go in afterProblemsLoaded()
if(typeof qualName == 'undefined')
    console.log("No qual name specified; unable to load problems.")
else 
    loadProblemsArray(qualName);