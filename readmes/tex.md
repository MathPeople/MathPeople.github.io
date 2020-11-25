# Browser TeX Guide

This page allows you to enter a problem/solution pair in LaTeX (ish) and save it in the format required for display on the rest of the site. Problems are saved in xml files and, as long as you use this editor to obtain them, you don't have to worry about the specific file structure or even what xml is. You just enter the TeX, apply the appropriate metainformation, and upload the resulting file appropriately. The whatIsGitHub readme describes how to interact with the repository and what role GitHub plays in this project.

If you are writing a problem for a specific qual which is supported on this site, be sure to enter which qual before you do any work. This will make sure all the problems corresponding to that qual are loaded, all the existing metainformation is set up, and it will help with avoiding naming conflicts.

# MathJax

LaTeX is completely handled by MathJax, which sacrifices some functionality in order to make TeX work on a website. Check out their site (http://docs.mathjax.org/en/latest/input/tex/differences.html) to see what you can and cannot use in your TeX. MathJax' approach is HTML first, TeX second, and it is worth knowing that you are technically writing HTML when you enter TeX. Specifically, the text you enter into the TeX input boxes is displayed by directly adding it to the innerHTML properties of certain DOM elements. It is possible for you to add HTML content in the TeX itself, for example `... gives us $a+b$, which by <a href="https://ncatlab.org/nlab/show/Fubini+theorem">Fubini's Theorem</a> equals $b+a$, ...`, and it will function.

This also means that newline characters wouldn't have an effect because they are ignored in HTML. In order for new lines to appear, the text you enter is preprocessed to replace every newline character `"\n"` with the `<br />` (line break) HTML element.

# xmlNodeName Format

Everything is ultimately saved in XML on this site, so values have to follow xmlNodeName syntax rules. There are official standardized rules declared somewhere, but browsers don't strictly follow them and we don't care so much about them. Just don't use spaces or commas (underscores and periods are ok) and, while numbers are allowed in the string, the string must start with a letter. You will be stopped if you try an invalid string, so if that happens change it to a valid nodeName.

# Saving Changes

There are several ways to save a problem after writing it. All problems are kept internally for the duration of an editor session, but if you do nothing to save the problems you write then they will be erased when you close the site in your browser. The ways of saving problems are covered in the dataStorage readme.

# Problem/Solution or Solo Act?

The intended purpose of this tool is to write problem/solution pairs, but sometimes you may want to write something which more naturally exists on its own, like a summary of some topic or theorem. There is a button to toggle between pair mode and solo mode. Solo mode basically just writes everything into the problem slot and hides the solution spot upon displaying.

# Metainformation

One of the major benefits to using this editor over a homemade TeX document to host the problems is the metainformation feature. Ultimately, metainformation is just a collection of extra tags which a problem file may or may not have. They are used for searching through the problem repository, but they have potential uses which reach beyond just searching. It is up to you, the user of this editor to author problems, to choose your metainformation to be useful for the problems you are adding.

There are three types of metainformation: checkbox, radio, and scale. Checkbox is a list of tags and you choose which apply to this problem. Radio is the same except one and only one tag is applied at a time. Radio metainformation comes with a default option. Scale is a number scale, and the default value is 0.

Metainformation is read from the problem files and the options are populated into the editor upon loading a qual -- this is one reason why you should load a qual before working on the problems for that qual. If you want to add new metainformation, there are tools in the metainformation section for that. These additions are not immediately saved anywhere, they only persist if you use them in a problem in your qual. Doing so makes them automatically load in when the qual is loaded. This means don't spend a lot of time creating a lot of options for metainformation and then close the browser before using the options -- they will be lost if hey are not used on a problem somewhere and saved in the problem files.

It is possible to add a feature to this editor for renaming metainformation, but that is not built yet. For now, think hard about the names of metainformation before investing time into applying them to problems because changing the names involves going into the javascript file to the section where problems are converted while being loaded and making changes there, reloading the qual, saving the converted problems, and pushing that new folder to the repository. It is far simpler to start off with good names for metainformation.