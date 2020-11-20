# Welcome

Hello, fellow mathematician! So you are interested in using this site to host a repository of questions? Welcome!

This feature was designed for hosting qual prep seminars, but it could be tweaked to house much more general classes of repositories of questions. We will focus on the intended use, however, in case you are reading this to find how to create a spot for your qual seminar on this site. First things first, make sure that you actually have to create a new qual. If your qual has been initialized then you don't have to follow the instructions here and can go straight to working on the problems.

# Overview

There are a few places you will have to make modifications. First and foremost you will have to add the repository of questions; that lives in the `/quals` folder. You will also have to make a new HTML file for your site and you will probably want to add a link to it from the main site. We will go over how to do that below. It may be worth your time to check out the whatIsGitHub readme for an overview of how you can navigate and make changes to this site.

# Problems Repository

In the `/quals` folder you will find a separate folder for each of the currently supported quals. To support a new qual, you first have to add a new folder with your qual's name. Name your qual something with no spaces or punctuation in it to make everything run smoothly across different systems.

In this folder you need to add two things. First, add a folder named `problems` which will house your problems but which starts off empty. Next add a text file named `problemsList.txt` which also starts empty. If you use the editor to generate your problems then you will never actually have to look inside these files/folders you just created, but it's still good to know what they are for. The problems folder holds all the `.xml` problem files and the `problemsList.txt` file lists the id of each problem in the folder. Together they form the repository of problems for your qual.

# Your Page

You now have to create the HTML file which is the page for your qual seminar. This will go into the `/content` folder. It is easiest if you copy the `templatePage.html` file, rename it to your qual's name, and then make the obvious changes in that file for initializing your page. You have total control over the HTML content of your page, so if you know HTML then feel free to structure it however you want. The template includes the just enough to get your site linked up with the problems in the repository.

# Home Page Link

In the `/index.html` file, you will find a list of links (HTML `a` elements) to all the different qual pages hosted on this site. Just insert the following with your qual's name in place of qualName into the file below the last existing qual link:

```
<p><a href="content/qualName.html">qualName qual site</a></p>
```
