This readme is for qual prep seminar leaders who want to use this site in their course (or a student in this course interested in adding/changing some problems) and who are not familiar with / have no experience with Git and GitHub.

# What is Git?

Git is a powerful component of modern computing. As such, it has many abilities and many devoted followers. It is also a fairly complex system to get the hang of. Git was designed to be a version control system which decentralizes the control of the files, so much of the features are related to sharing control. We don't necessarily care about this. In fact, you can do everything you need to do to create and maintain a site and list of problems here without ever knowing anything about Git. For the sake of simplicity, we adopt this approach.

# What is GitHub?

You can consider GitHub to be a remote location which houses files. Through your online GitHub account you can make changes to the files held there, and GitHub even has some simple editing capacity for direct online editing of the files. The more powerful approach is to use Git to download/upload the files between your computer and the GitHub repositories.

Once you have set up Git and gotten used to using it, you realize that it is an excellent way to share files. However, setup is difficult and the tutorials found online, though abundant, are also opaque. GitHub has nice interface tools so the rest of this readme will walk you through how to do what you need to do purely through GitHub.

# Editing From GitHub

First and foremost, you need a GitHub account. These are free and easy to make. Log in to GitHub and navigate to the repository for this project, `https://github.com/MathPeople/MathPeople.github.io`. There you can see all the files which make up this site.

All the files here are ultimately text files, so reading them doesn't take any special programs. You can read the files directly from the repository just by clicking on them. There are also options for display modes through the buttons in the top right corner.

One of these buttons is a pencil. Click it and you can edit the file directly in the browser. This is how you will make small changes to files without learning how Git works. There is a button at the bottom called "Commit changes" which is how you save your edits. Above it is a spot for a name and message; these are part of Git's way of keeping track of changes. Fill them out with short, descriptive information so that someone skimming a long list of changes knows what each change was for, then click the commit button to save.

Now you know how to edit files, let's see how to upload files. First you have to navigate to the folder you want to add the file to. It is important you get this right because moving a file from one folder to another is not a focus of the GitHub interface. Once you are in the correct folder, click the "Add file" button. You will have the option to add a blank file or upload a file.

You can also add a folder, though there is no button for this. New folders are added during the file addition process. If you haev a folder `A` and you want to create a folder `B` and put file `c.txt` into folder `B`, then first navigate to folder `A`. Click new file and name it `B/c.txt`. You will find that, upon typing `/` in `B/`, folder `B` will be created in folder `A` and you will be now adding to folder `B`. Finish typing the name, which will now appear as `c.txt`, and your task is complete. Folder `B` is created inside folder `A` and file `c.txt` is placed in `B`.

If you want to update a file which already exists using the upload instead of the direct editor, you do not do this from the GitHub page for the file itself. Go to the folder housing it and add the new version of the file to the folder. GitHub will simply overwrite the old version of the file with what you just uploaded.

In some cases you have to copy a file. To do this the simplest way through GitHub just open the file, copy its contents, and paste them as the contents of the new file.

# What is GitHub Pages?

GitHub itself is a repository for files. Its primary interaction with the internet is to make the repository available to view/download/edit using the interface, not to host an actual website online. In general hosting a website is a little involved, what with setting up a server and dealing with domain names. GitHub has generously decided to deal with all of that stuff on their end through GitHub pages. They even deal with the steps for building website files out of the files in the repository. All we have to do is keep the HTML/CSS/JS/etc files consistent in our repository and GitHub pages turns it into a website which is accessible through the appropriate URL (`mathpeople.github.io`). We don't need to know any of the details, we only mention it here so you know who to attribute thanks to for making it so easy and free to host a website.