# Browser TeX Guide

This page allows you to enter a problem/solution pair in LaTeX (ish) and save it in the format required for display on the rest of the site. Problems are saved in xml files and, as long as you use this editor to obtain them, you don't have to worry about the specific file structure or even what xml is. You just enter the TeX, apply the appropriate metadata, and upload the resulting file appropriately. The whatIsGitHub readme describes how to upload problems to the repository.

LaTeX is completely handled by MathJax. MathJax struggles with dollar signs for math mode. This page processes the text so that dollar signs work, but not double dollar signs. Don't use double dollar signs.

If you are writing a problem for a specific qual which is supported on this site, be sure to enter which qual before you do any work. This will make sure all the existing metadata corresponding to that qual is loaded and will avoid naming conflicts.

# xmlNodeName Format

Everything is ultimately saved in XML on this site, so the metadata has to follow xmlNodeName syntax rules. There are official standardized rules declared somewhere, but browsers don't strictly follow them and we don't care so much about them. Just don't use spaces or commas (underscores and periods are ok) and, while numbers are allowed in the string, the string must start with a letter. You will be stopped if you try an invalid string, so if that happens change it to a valid nodeName.

# Problem/Solution or Solo Act?

The intended purpose of this tool is to write problem/solution pairs, but sometimes you may want to write something which more naturally exists on its own, like a summary of some topic. There is a button to toggle between pair mode and solo mode.

Problem-solution pairs are displayed either in answer-available mode or answer-hidden mode, depending on whether the problem is being used as a study guide or a practice test.

# Metadata

Here is the list of recognized metadata. If you add a feature, be sure to update this readme accordingly.

- Completeness of solution
- Instructor
- Topics
- Test viability

# Completeness of Solution

Sometimes, especially at first, you just want to add the problems to the repository and not work out the whole solution. You can mark a pair as being complete, being partially complete, or being left open. This corresponds to a red/yellow/green coloring when the problem is answer-available displayed.

# Instructor

Many people are interested in studying problems a particular instructor has given in the past. This is a public site so we do not want to publish who the instructor is. The way we do this is to use an instructor id system, giving each instructor an alphabetical id. When this id is displayed, you can click on the id and type in a different string. This alternate name is saved in your browser's storage (the browser readme has a description of how browser storage works). Problems can be assigned multiple instructors because sometimes we can only narrow it down to a group of people and not a single person who gave it.

# Topics

Problems can be marked as involving various topics. Topics can be a particular theorem, a class of calculation style, a common trick, or anything. Explicitly a topic is just a single xmlNodeName string which is either present or not in the problem file. You can add a topic which is already in use or create a new topic depending on your needs.

Topics are used for searching through the problem repository. Once we have hundreds of problems written up, this tool helps greatly with finding which problem we are looking for. They are also available for use in the practice test generator, though I never quite got around to putting that together.

Enter a qual type to the appropriate box and you will see all topics currently used in that repository of questions. It is best that you check for a slightly-differently-spelled duplicate before creating a new topic.

# Test Viability

Some problems are important for the theory but don't fit well on a test, some are interesting applications, and some are just excellent test questions even if they don't seem important to the theory. You can flag a question as being a good test question, a potential test question, or an unreasonable test question. This is used by the practice test generator.