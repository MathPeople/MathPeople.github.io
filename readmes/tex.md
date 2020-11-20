# Browser TeX Guide

This page allows you to enter a problem/solution pair in LaTeX (ish) and save it in the format required for display on the rest of the site. Problems are saved in xml files and, as long as you use this editor to obtain them, you don't have to worry about the specific file structure or even what xml is. You just enter the TeX, apply the appropriate metainformation, and upload the resulting file appropriately. The whatIsGitHub readme describes how to upload problems to the repository.

LaTeX is completely handled by MathJax. MathJax struggles with dollar signs for math mode. This page processes the text so that dollar signs work, but not double dollar signs. Don't use double dollar signs.

If you are writing a problem for a specific qual which is supported on this site, be sure to enter which qual before you do any work. This will make sure all the existing metainformation corresponding to that qual is loaded and will avoid naming conflicts.

# xmlNodeName Format

Everything is ultimately saved in XML on this site, so the metainformation has to follow xmlNodeName syntax rules. There are official standardized rules declared somewhere, but browsers don't strictly follow them and we don't care so much about them. Just don't use spaces or commas (underscores and periods are ok) and, while numbers are allowed in the string, the string must start with a letter. You will be stopped if you try an invalid string, so if that happens change it to a valid nodeName.

# Problem/Solution or Solo Act?

The intended purpose of this tool is to write problem/solution pairs, but sometimes you may want to write something which more naturally exists on its own, like a summary of some topic. There is a button to toggle between pair mode and solo mode. This basically just writes everything into the problem slot and hides the solution spot.

# Metainformation

One of the major benefits to using this editor over a homemade TeX document to host the problems is the metainformation feature. Ultimately, metainformation is just a collection of extra tags which a problem may or may not have. It is up to you, the user of this editor, to choose your metainformation to be useful for the problems you are adding.

There are three types of metainformation: checkbox, radio, and scale. Checkbox is a list of tags and you choose which apply to this problem. Radio is the same except one and only one tag is applied at a time. Radio comes with a default option for if a problem file does not declare an explicit option. Scale is a number scale, an integer between 1 and the maximum for that type.

Metainformation is read from the problem files and the options are populated into the editor upon loading a qual -- this is one reason why you should load a qual before working on the problems for that qual. If you want to add new metainformation, there are tools in the metainformation section for that. These changes are not directly saved anywhere and only persist if you use them in a problem in your qual. Doing so makes them automatically load in when the qual is loaded. This means don't spend a lot of time creating a lot of options for metainformation and then close the browser before using the options -- they will be lost if hey are not used on a problem somewhere and saved in the problem files.

It is possible to add a feature to this editor for renaming metainformation, but that is not built yet. For now, think hard about the names of metainformation before investing time into applying it to problems because changing the names involves going into the javascript file to the section where problems are converted while being loaded and making changes there, reloading the qual, saving the converted problems, and pushing that new folder to the repository. It is far simpler to start off with good names for metainformation.