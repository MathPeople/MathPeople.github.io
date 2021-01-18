// configuration
var MathJax = {
    tex2jax: {
        inlineMath: [['$','$'],["\\(","\\)"]],
        processEscapes: true,
    }
}

// import MathJax
xmlImporter.element("script", document.head, ["src", "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/latest.js?config=TeX-MML-AM_CHTML", "defer", ""]);

// processing of TeX in a node attribute to make it ready to display as the innerHTML of something
function texAttToInnerHTML(line, blockElement = "p") {
    return line.replaceAll(/\n/g, "<br />");
}