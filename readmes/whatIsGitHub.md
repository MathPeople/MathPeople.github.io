# What is GitHub?

There are endless resources online for learning Git and GitHub. This readme is just to give you the overview -- if you want to actually learn Git you should read about it from somewhere else. Git is the program which does all the work we are about to discuss and GitHub is a service which hosts Git repositories publicly online. GitHub Pages is a further service which builds a repository into a website and gives it a url, making it accessible to the world wide web. This website is hosted on GitHub Pages.

You can consider GitHub to be a remote location which houses files. Through your online GitHub account you can make changes to the files held there, and GitHub even has some simple editing capacity for direct online editing of the files, though the more powerful approach is to download/upload the files between your computer and the GitHub repositories through Git.

# What is Git?

Git is a way to share a folder between devices and to keep track of changes. The main folder is called the repository, you can see the contents of this folder at the GitHub repository `https://github.com/MathPeople/MathPeople.github.io`. The data there are what get built into the website `https://mathpeople.github.io/`.

There is a lot that Git does/can do which we don't need to describe here. If you are just hoping to make a change to the website (like adding new content), these are the steps you need to do:

1 - Create a GitHub account. They are free and easy to set up.

2 - Create a branch for your changes. You can name this branch after yourself or after the intended changes, it's up to you. You can think of a branch as a sandbox because changes you make in your branch will not affect the website, which itself is housed in the branch called `master`.

3 - Pull your branch. This step has a bit of a Git learning curve. After doing this, you will have a copy of the repository on your computer. This process is well-documented elsewhere. Once you have the repository on your computer you will not need an internet connection until you are ready to put your changes on the GitHub (remote) version of your branch.

4 - Make your changes. Add your content, alter the files you need to alter, etc. If you are only using the editor, this step involves replacing the old problems folder with the new problems folder which the editor gives you. If you are making any changes which go beyond simply adding/modifying problems, like if you are customizing your page or adding some new features in the javascript files, you should read about how to locally host a website. Browsers can open websites from files saved on your computer (locally hosted) instead of web servers but they prefer not to for security reasons. This is one way to test the changes you make. Once you are happy with the changes you make, move to the next step.

5 - Push your changes. This is where the Git learning curve is steepest. You have to tell Git which files to look at, then make a commit (which bundles all of your changes into one Git-magic snapshot), then push that commit to GitHub (so that your branch on GitHub is updated with your changes). The process may be difficult but there are tons of tutorials online. Pushing to your branch does not affect the website, but it does update your GitHub branch with your changes. This makes your changes public, it just doesn't affect the site yet (branches and commits are major components of Git's version control power).

6 - Merge your changes. When you are ready to actually change the site, you will want to merge your branch into the master branch. This also has plenty of tutorials online. The key thing you should know is that anyone in the world can do any of the above steps. Only a person with the designated permissions (the MathPeople account and any delegated accounts) can approve this merge. After merging your branch to master, your changes are part of the site. It takes a couple minutes to percolate through GitHub's server stuff and then you can see your changes on the live site.