# Data Storage

The primary purpose of this editor is to create a folder of files, one file for each problem, which you download to your computer and then upload to GitHub where they become accessible to the site. There are a few levels of storage between a blank page and a finished problems folder, so we describe them here.

# Standalone Problem

You can write problems and save them one at a time. Click the save button and this site will generate a file containing the active problem and will offer it to you to save somewhere on your computer. This is the simplest way to obtain a single problem file. The downside to this is that you have to manually add the problem id to the `problemsList.txt` file, and then repeat this process with each new problem you write.

# Problem in a Qual

If you have succesfully initiated a qual on this site and have given the qual some problems, you will want to preload the whole qual page's set of problems before you work on new problems for that qual. Doing this lets the editor populate metainformation lists with the metainformation from all the problems in the qual, and this helps organize the whole folder at once. To do this, enter the name of your qual in the appropriate input.

When a qual is loaded you can open a saved problem by entering the id into the problem id box. This allows you to modify existing problems. Remember this does not actually affect the site -- you have to change the folder in the master branch on GitHub in order for your changes to actually be made live.

If you want to create a new problem in a qual, click the Clear/New Problem button. This will generate a blank problem with an id of changeMe, which you have to change or else your problem will be ignored by the editor. You can create multiple new problems in a session without saving each one independently because the whole list of problems is held by the page while it is open. Once you have finished your session and are ready to download the new problems all at once (along with all the old problems too), click the save all button to get a `.zip` folder with all problems in that qual. You have to unzip the folder on your own computer and then put that new folder onto GitHub to make the changes affect the website.

# Local Problems

There is a way to work with auto saving, where each problem is kept stored in browser storage so that they are not lost when you close the window. To do this, enter `local` as the qual when you begin. This creates and maintains a local repository of questions inside your browser, so you only have to click save when you are ready to use the folder. Enter `local qualName` to initialize the local repository and then load the current set of problems for the corresponding qual.

The erase button for local storage will erase all the locally stored problems from browser memory. It does not actually erase any files (browsers can't do that), it just clears the autosaved data.

# The Least-Git Qual Authorship Process

If you have a bunch of problems stored elsewhere and you want to make a qual on this site using those problems, here is the way to do it which minimizes your interaction with Git. First choose which computer and which browser you will use for all the editing. We will be using the autosave feature, which is browser specific, so this only works if you do all the editing in the same browser on the same machine. ALso make sure you are not in private/incognito mode because these modes intentionally disable browser storage.

You may want to have a gameplan for metainformation before writing all the problems. If you already have your list of problems written up elsewhere then you probably have a good idea of how you want to be able to sort them, and that is what metainformation is for. It is, at least for me, more tedious to go through the problems after they are written and apply tags to them than it is to apply them as you write the problem. You can always add more metainformation on the fly, and they will retroactively apply to previous problems by virtue of default values.

It is possible to start a new qual enitrely from scratch, just enter `local` as the qual name. Now you have set up autosave and are ready to add problems. Go through your list of problems and copy/paste (or otherwise enter) the TeX in the problem and solution spots. Make sure you click "New Problem" for every new problem and that you give each problem an id. Clicking "New Problem" does not erase the old problem, the old problem is already safely stashed away in browser storage. It just clears the GUI fields and lets you enter stuff for another problem.

At this point you can enter the problems in batches. As long as you don't clear your browser's memory, the problems you write will continue to be accessible under the `local` qualName. You can close the browser and come back to it if you don't get all the problems done in one session. That said, it is always a good idea to save your work periodically to actual files using the "Save All" button. It is also a good idea to test the autosave by closing your browser (tab and window) after writing the first problem to make sure it is successfully retrieved when you reopen the editor and reenter `local` as the qualName.

Once you have entered all the problems from your previous stash of problems, and once you are satisfied with the metainformation, you are ready to do the Git stuff. Save the problems all at once ("Save All" button) and unzip them somewhere on your computer. This will leave you with a folder with two elements, the `problemsList.txt` file and the `problems` folder. The `problems` folder will have a `.xml` file for each problem you authored. When this is done you will start the Git process.

As described in the whatIsGitHub readme, set up your GitHub account, set up your branch, and pull the branch to your computer. Then follow the directions in the newQual readme to initialize your qual. This step involves copying some stuff and changing a few words to the name of your new qual, and the end result is that you will have your own site and your own problems list infrastructure.

In the (as-yet empty) problems folder you just created, add the contents of the unzipped folder you downloaded from the editor. This populates the right repository with all the problems you have authored. Now you are ready to push your changes and merge them to the master branch. It is good practice to not actually marge to master until you have tested your branch to make sure it actually works, but we won't cover how to do that here. If nothing else just take a peek at the folder for a working qual and check that your file/folder structure matches the working one.