// processing of TeX to make it MathJax-ready
function texAttToInnerHTML(line, blockElement = "p") {
    if (typeof line != "string") line = "";
    let lines = line.split("$");
    line = "";
    let opening = false;
    for (let sub of lines) {
        line += sub + "\\" + ((opening = !opening)? "(": ")");
    }
    line = line.substring(0, line.length - 2);
    return "<"+blockElement+">"+line.replaceAll(/\n/g, "</"+blockElement+"><"+blockElement+">")+"</"+blockElement+">";
}