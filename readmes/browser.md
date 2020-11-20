# Browser

This is a static site. That means the only way for you to affect the site is to go to the host and make a change there. The site is hosted by GitHub Pages, you can see the repository on GitHub (`https://github.com/MathPeople/MathPeople.github.io`) and the site itself at `https://mathpeople.github.io/`. You cannot break the site from your end because the site can only be changed on GitHub.

It is completely possible, and not too difficult, to use this site offline because it is a static site. One way to do this would be to clone the GitHub repository onto your device and then open the html files in a browser. Note that you may have to change some settings in your browser to do this because by default most browsers don't allow locally hosted sites -- they will display the homepage but they won't load any of the scripts needed. This is a general security precaution which you probably have to modify to use this site offline.

# Browser Storage

Despite this being a static site, there are some ways for you to make persistent (but not permanent) changes. These are described in the dataStorage readme.

# What is Stored?

The autosave feature saves all the problem files to browser storage every time a change is made. If you don't initialize autosave, nothing gets stored to local storage. Initializing autosave also loads the problems from local storage.