refreshMathJax();

function refreshMathJax() {
  try {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
    //alert("refresh");
  } 
  catch (e) {}
}