# Browser TeX Guide

This page allows you to enter a problem/solution pair in LaTeX (ish) and save it in the format required for display on the rest of the site. Problems are saved in xml files and, as long as you use this editor to obtain them, you don't have to worry about the specific file structure or even what xml is (described in the fileFormat readme). You just enter the TeX, apply the appropriate metainformation, and upload the resulting file appropriately. The dataStorage readme covers the various levels through which work is saved, and the whatIsGitHub readme describes how to interact with the repository and what role GitHub plays in this project (which is the final level of saving your work).

If you are writing a problem for a specific qual which is supported on this site, be sure to enter which qual before you do any work. This will make sure all the problems corresponding to that qual are loaded, all the existing metainformation is set up, and it will help with avoiding naming conflicts. See the newQual readme if you need to initialize a new qual.

# Dispalying Tex with MathJax

LaTeX is completely handled by MathJax, which sacrifices some functionality in order to make TeX work on a website. For the most part things work how you want them to, but the curious author can check out their site (http://docs.mathjax.org/en/latest/input/tex/differences.html) to see what can and cannot be done with MathJax.

MathJax' approach is HTML first, TeX second, and it is worth knowing that you are technically writing HTML when you enter TeX. Specifically, the text you enter into the TeX input boxes is displayed by directly adding it to the innerHTML properties of certain DOM elements. It is possible for you to add HTML content in the TeX itself, for example `... gives us $a+b$, which by <a href="https://ncatlab.org/nlab/show/Fubini+theorem">Fubini's Theorem</a> equals $b+a$, ...`, and it will function. For those of you unfamiliar with HTML, this example adds a link to nlab's page on Fubini's Theorem (or does it?).

This HTML first approach also means that newline characters don't have an effect because they are ignored in HTML. In order for new lines to appear, the text you enter is preprocessed to replace every newline character `"\n"` with the `<br />` (line break) HTML element. It is hard to imagine a situation in which this information would be necessary to know, but there it is.

# xmlNodeName Format

Everything is ultimately saved in XML on this site, so values have to follow xmlNodeName syntax rules. There are official standardized rules declared somewhere, but browsers don't follow them very strictly and we don't care so much about them. Just don't use spaces or commas (underscores and periods are ok) and, while numbers are allowed in the string, the string must start with a letter. You will be stopped if you try an invalid string, so there isn't much to worry about in terms of what is or isn't allowed as long as you keep your eye out for naming rejections.

# Saving Changes

There are several ways to save a problem after writing it. All problems are kept internally for the duration of an editor session, but if you do nothing to save the problems you write then they will be erased when you close the site in your browser. The ways of saving problems are covered in the dataStorage readme.

# Problem/Solution or Solo Act?

The intended purpose of this tool is to write problem/solution pairs, but sometimes you may want to write something which more naturally exists on its own, like a summary of some topic or theorem. There is a button to toggle between pair mode and solo mode. Solo mode basically just writes everything into the problem slot and hides the solution spot upon displaying.

# Metainformation

One of the major benefits to using this editor over a homemade TeX document to host the problems is the metainformation feature. Ultimately, metainformation is just a collection of extra tags which a problem file may or may not have. The metainformation can be used by the students directly as a means of searching through the problems. The other use is in the practice test generator, which takes a configuration in the form of a description via metainformation when it generates tests. Both of these are covered in the xpath readme. It is up to you, the user of this editor to author problems, to choose your metainformation to be useful for the problems you are adding.

There are three types of metainformation: checkbox, radio, and scale. Checkbox is a list of tags and you choose which apply to this problem. Radio is the same except one and only one tag is applied at a time. Radio metainformation comes with a default option. Scale is a number scale, and the default value is 0.

Metainformation is read from the problem files and the options are populated into the editor upon loading a qual -- this is one reason why you should load a qual before working on the problems for that qual. If you want to add new metainformation, there are tools in the metainformation section for that. These additions are not directly saved anywhere, they only persist if you use them in a problem in your qual. Doing so makes them automatically load in when the qual is loaded. This means don't spend a lot of time creating a lot of options for metainformation and then close the browser before using the options -- they will be lost if they are not used in a problem somewhere and saved in the problems files.

There are no tools for erasing metainformation because there don't need to be. Any metainformation which is not in use will not be saved. If you remove all references to a certain metainformation option or type and want the associated GUI element to disappear, save your work and reload the page. It will not be found so the editor won't make a GUI option for it.

# Renaming Metainformation

There are two types of metainformation renaming: hard and soft. A hard renaming is what you would probably think of when you think of renaming. Hard means it goes through each problem and modifies the corresponding tags to the new name. Enter `oldMetaName newMetaName` to rename a metainformation type or `metaName oldOption newOption` to rename a single option.

Soft renaming is different. It doesn't actually change any of the problem files, it just changes how the metainformation is displayed. Instead of saying directly what soft renaming does, let's see why it's here. When studying for a qual, many students find it valuable to know which instructor wrote which problems. We, being qual prep seminar leaders, want to accomodate their desire to know this information. However, this site is public and it doesn't feel right to just post the names of the instructors directly onto the website. We get around this by giving each instructor an id and then telling our students which id corresponds to which instructor. That way, instead of saying that this problem was given by Dr. Ian Malcolm, renowned chaos theorist and proponent of fundamental biological understanding, we instead say it was given by instructor a and tell our students that instructor a is Dr. Ian Malcolm.

This works well enough, but it is annoying to have to keep that list around every time you want to check who the instructor is. After all, we are cramming as much information about the qual as we can into our heads and we don't need to waste precious brain space memorizing which instructor has which id. This is what a soft rename is. If we soft rename instructor a to something more useful, like `"Dr. Ian Malcolm"`, then that name is stored in browser local storage and is displayed alongside `a` in the `instructors` metainformation box.

Being stored in local storage, this soft rename persists as long as we don't clear browser memory. That way we don't have to keep remembering who is who, our browser just tells us, and we only have to enter it the first time we use the site (or at least the first time on a fresh browser, we do have to enter it again with each new device we use).

To actually do a soft rename, just enter `metaName optionName custom name`. Anything after the space following `optionName` is inserted as the soft rename (this does not need to follow nodeName sytax). These soft renames are stored by qual, so you will have to import the qual in the editor before you can do the rename (not necessary if the rename is done from the qual's page, where the appropriate qual is automatically imported). Soft renames across the various quals won't interfere with each other but they are shared between the editor and the qual page.