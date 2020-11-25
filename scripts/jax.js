var MathJax = {
    tex2jax: {
        inlineMath: [['$','$'],["\\(","\\)"]],
        processEscapes: true,
    }
}

xmlImporter.element("script", document.head, ["src", "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/latest.js?config=TeX-MML-AM_CHTML", "defer", ""]);

// processing of TeX to make it MathJax-ready
function texAttToInnerHTML(line, blockElement = "p") {
    return line.replaceAll(/\n/g, "<br />");
}