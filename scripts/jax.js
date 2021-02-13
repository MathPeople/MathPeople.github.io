/*
    This is a queue-based MathJax rendering system. You only need to call typeset(element) at any point and then wait a couple seconds.
    Plot summary:
    - configure MathJax
    - load MathJax 
        this requires xmlImporter to be loaded but can be made not so if you want, xmlImporter is just offering syntactic shortcuts
    - start jax loop
        this checks every few seconds whether anything is queued
    - when queued, start to clear the queue
        close jax loop
        render one element, wait a few milliseconds, then repeat
        these few milliseconds allow the broswer to catch up on whatever happened in the meantime, avoiding a giant halt of the page whie rendering occurs
    - when queue is empty, start up loop again
    
    At any point any script can call typeset(element). All that does is add to the queue. When jax is ready it will typeset that element.
    
    Special feature: in your script, make holdJax true and jax won't be asked to typeset anything. This is for initial loading of a problems repository. Still call typeset as you add things to be typeset, doing so won't hang any scripts. When you set holdJax to false the jax loop will un-halt itself and begin typesetting anything it finds.
*/

var holdJax = false;

// configuration
var MathJax = {
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']]
    }
}

// import MathJax
let jaxScript = xmlImporter.element("script", document.head, ["type", "text/javascript", "id", "MathJax-script", "src", "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"]);

// typeset queue so jax doesn't hang up the page
let typesetThese = []

// Add to the typeset queue. This is the only function you should call outside of jax.js
function typeset(element) {typesetThese.push(element)}

// id for loop checking if there is anything queued up for jax
let jaxLoop, jaxLoopWait = 2000;

function startJaxLoop() {
    jaxLoop = window.setInterval(checkTypesetting, jaxLoopWait);
}

// if anything to typeset, stop jax loop and start clearing the typeset queue
function checkTypesetting() {
    if (holdJax || typesetThese.length == 0) return;
    window.clearInterval(jaxLoop);
    doTypeset();
}

// cooldown between typeset calls, longer means less lag but also slower typesetting
let typesetCooldown = 100;

// typeset one element then wait and try again
function doTypeset() {
    if (typesetThese.length == 0) {return startJaxLoop();}
    MathJax.typeset([typesetThese.shift()]);
    window.setTimeout(doTypeset, typesetCooldown);
}


// When MathJax finishes loading check for typesetting every so often
jaxScript.addEventListener("load", function() {
    window.setTimeout(startJaxLoop, 5000);
});

// processing of TeX in a node attribute to make it ready to display as the innerHTML of something
function texAttToInnerHTML(line) {
    return line.replaceAll(/\n/g, "<br>");
}