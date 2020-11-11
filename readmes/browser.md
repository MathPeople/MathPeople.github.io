# Browser

This is a static site. That means the only way for you to affect the site is to go to the host and make a change there. The site is hosted by GitHub Pages, you can see the site on GitHub (https://github.com/MathPeople/MathPeople.github.io). You cannot break the site from your end because the site can only be changed on GitHub.

It is completely possible, and not too difficult, to use this site offline because it is a static site. One way to do this would be to clone the GitHub repository onto your device and then open the html files in a browser. Note that you may have to change some settings in your browser to do this because by default most browsers don't allow locally hosted sites -- they will display the homepage but they won't load any of the scripts needed. This is a general security precaution which you would have to modify to use this site offline.

# Browser Storage

Dispite this being a static site, there are some ways for you to make persistent (but not permanent) changes. This is done using browser storage. You probably have the option in your browser to allow or block storage (it's like cookies but more persistent). You have to allow this site to store data, which should be the default but still might cause issues if the setting is not correct, in order for these storage features to work.

Data is stored per browser and is erased when something like clearing the cache happens. If you visit this site in private mode the data will erase when you leave. The data is browser-local, so switching devices will mean a new data environment, i.e. no sharing of whatever was saved on the other device.

# What is Stored?

So far there is only one application of browser storage, and that is instructor names. Internally, instructors are referred to using alphabetical id (instructor a for example). You can give that instructor a name and that name will save on your browser. As long as that name is in storage, it will be displayed instead of the id.

# What is Not Stored?

Nothing you type out in TeX is saved. It is designed for you to download the file when ready to your native computer system. That file has to be pushed onto the GitHub repository to be available on the site, and we aren't going to cover how to do that here. Suffice it to say that you cannot automatically add problems to the repositories, the TeX page is only for generating the problem/solution files in the correct format. Updating the site is a manual process.