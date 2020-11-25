# Welcome

Hello, fellow mathematician! So you are interested in using this site to host a repository of questions? Welcome!

This feature was designed for hosting qual prep seminars, but it could be tweaked to house much more general classes of repositories of questions. We will focus on the intended use, however, in case you are reading this to find how to create a spot for your qual seminar on this site. First things first, make sure that you actually have to create a new qual. If your qual has been initialized then you don't have to follow the instructions here and can go straight to working on the problems.

# Overview

There are a few places you will have to make modifications. First and foremost you will have to add the repository of problems; that lives in the `/quals` folder. You will also have to make a new HTML file for your page and you will probably want to add a link to it from the home page. We will go over how to do that below. If you don't yet know Git, it may be worth your time to check out the whatIsGitHub readme for an overview of how you can navigate and make changes to the repository which is this site.

# Problems Repository

In the `/quals` folder you will find a separate folder for each of the currently supported quals. To support a new qual, you first have to add a new folder with your qual's name. Name your qual something with no spaces or punctuation in it to make everything run smoothly across different systems.

In this folder you need to add two things. First, add a folder named `problems` which will house your problems but which starts off empty. Next add a text file named `problemsList.txt` which also starts empty. If you use the editor to generate your problems then you will never again have to actually look inside these files/folders you just created, but it's still good to know what they are for. The problems folder holds all the `.xml` problem files and the `problemsList.txt` file lists the id of each problem in the folder. Together they form the repository of problems for your qual.

# Your Page

You now have to create the HTML file which is the page for your qual seminar. This will go into the `/content` folder. It is easiest if you copy the `templatePage.html` file, rename it to your qual's name, and then make the obvious changes in that file for initializing your page. You have total control over the HTML content of your page, so if you know HTML then feel free to structure it however you want. The template includes the just enough to get your site linked up with the problems in the repository.

If you prefer to make your page a different way, here is the bare minimum of what you need to include to hook in the problems list:

```
<script> var qualName = "yourQual"</script>
<script src="../scripts/xmlImporter.js"></script>
<script src="../scripts/problems.js" async defer></script>
```

This really is bare minimum though. If you want MathJax to work, add the script tag `<script src="../scripts/jax.js"></script>` (after the `xmlImporter` script) instead of adding a script pointing directly to MathJax -- this `jax.js` file has the MathJax configuration as well as the MathJax import.

If you want your page to hide itself during the qual (not that we don't trust our students, but you should do this) then add the script `<script src="../scripts/pageHider.js" async defer></script>` and change the variable initialization script to contain `testStart` and `testEnd`:

```
<script>
    var qualName = "template";
    var testStart = 1601481600000;
    var testEnd = 1601492400000;
</script>
```

Where do those numbers come from? They are your time as represented in number of milliseconds since the beginning of January 1, 1970. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date for description and how to obtain these numbers easily.

# Home Page Link

In the `/index.html` file, you will find a list of links (HTML `a` elements) to all the different qual pages hosted on this site. Just insert the following with your qual's name in place of `qualName` into the file below the last existing qual link:

```
<p><a href="content/qualName.html">qualName qual site</a></p>
```
