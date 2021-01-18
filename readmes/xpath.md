# XPath

XPath is a language for querying XML files, maintained by the World Wide Web Consortium (the same people who make standards for all the web languages, HTML/CSS/XML/etc). Like anything related to XML, XPath is probably the best way to accomplish what it is designed for, but it comes with the cost of having to learn a new language to do the task. This document is designed to skip over the learning part and jump straight to the doing part (possible because the language is well-designed and, like XML, can be inferred from examples better than it can be learned from scratch).

Specifically, XPath is a language for selecting particular nodes in XML files. The whole idea of XPath is that it is applied to an XML file to give something (a node or list of nodes in our case) which, in theory, is then used in the next step depending on the application. XPath can also be used to extract information from XML files, like strings or numbers, but we are mostly interested in the node aspect.

# Searching the Problems

When you go to a qual's page you see the full list of problems. For all but the template page, this list is overwhelming. The search function is there to narrow this list down to something more manageable. Searching is done by entering an XPath expression into the search bar.

What the site does is takes that expression and applies it to each problem's file, itself an XML file. If any node is found matching the XPath expression then that problem is shown, and if no node is found then the problem is hidden. You can see this immediately by searching the string `"*"`, which matches anything. Because anything is matched, all problems are shown. Change the search string to `""`, which is not really avalid XPath expression, and no problem will match it so all problems will be hidden.

If you enter the id of a problem then only that problem will be displayed. What happens here is that the search string `"problemId"` means search for a node named `"problemId"`. The search starts at the root node and, because we have done no fancy tricks with slashes `/`, the search also ends here. That means a problem is shown if and only if its root node is named `problemId`, which, by our problems file structure, happens if and only if that problem's id is `problemId`.

# The Role of the Slash

The character `/` means child/descendant in XPath. A string that starts with a `/` means start with the root of the document, and a string like `node/child` means look for a node named `node` which has a child named `child`.

The slash can be doubled, `//`, and this means any descendant. Most of our strings start with a double slash, and this means any node in the document. For example, the string `//problem` will match any problem file which has a node named `problem` somewhere in the file (i.e. all the problems which are not empty). The string `*/problem` also selects all the problems, because every problem is saved such that the `problem` node is a child of the root node (the `*` is for addressing the root node). The string `/problem` will not select any problem, because this one means select all problems with root node named `problem` and none of our problems are given the `id` `problem` (remember that causes naming conflicts). The same thing happens for the string `problem` -- nothing is selected because none of the root nodes are named `problem`.

The slash character is not the only way to select a child: the string `//node/child`, which means "a node named `child` whhich is the child of a node named `node` which itself is anywhere in the document," is equivalent to the string `//node[child]` which translates to exactly the same thing. The square brackets and single slash in these examples correspond to the same interpretation.

# Select By Checkbox Metainformation

This is the simplest case for searching metainformation because checkbox is the simplest type of metainformation. If you want to select all problems with the `addition` topic, search the string `//addition`. Any file with a node named `addition` somewhere in it will be matched. If you want to be more specific (anticipating that `addition` may possibly be overloaded in multiple types of metainformation), search the string `//topics/addition` to specify that the `addition` node must be a child of a node named `topics`, which itself can be anywhere in the document.

There are other ways to accomplish this same thing. The string `//topics[addition]` will also select any problem with a node named `addition` as a direct child of a node named `topics` which itself is anywhere in the document. The distinction between the two, `//topics/addition` and `//topics[addition]`, is that further additions to the string will refer to different nodes. The former ends referring to the `addition` node (after requiring that it be a child of a `topics` node) and the latter ends referring to the `topics` node (after requiring that it has an `addition` child).

Because of the specific file structure used in the problem files, the strings `//problem/topics/addition`, `//problem[topics/addition]`, `//problem[topics[addition]]`, `*/problem/topics/addition`, `*/*[topcs/addition]`, etc will all show a problem which has a `topics` of `addition` and will hide the rest. It is generally good practice to keep the strings as simple as possible, though, so these last few are unfavorable because they are unnecessarily specific (unless the files are in a custom format and have extra information than what is described in the fileFormat readme). The previous paragraph has the two best ways to select problems with a `topics` of `addition`, namely `//topics/addition` or `//topics[addition]`.

# Select By Radio Metainformation

For the most part, radio is just a special case of checkbox so it behaves mostly the same. The distinction comes with the default value. In the template, look at the metainformation `solutionCompleteness`. It is radio with default `none` and other values `full` and `partial`. Selecting for the latter two are the same as for checkbox, i.e. `//solutionCompleteness/full` or `//solutionCompleteness[partial]` will work. If you want to select problems which have a `solutionCompleteness` of `none`, the approach is different because this is the default value.

If you recall, metainformation nodes are only inserted if they are required. Because `none` is the default value, there will be no `solutionCompleteness` node in the problem file for a problem flagged as having a `solutionCompleteness` of `none`. In fact, if every problem in the whole qual list has a `solutionCompleteness` of `none` then no problem will have a `solutionCompleteness` node and the editor won't even recognize `solutionCompleteness` as a metainformation.

In this situation, when we want to select all problems with a `solutionCompleteness` of `none`, we have to search for problems which do not contain a `solutionCompleteness` node. The string `//problem[not(solutionCompleteness)]` does this. Note that we have to refer to the `problem` node to do this because the string has to end pointing at something, so we have to specifically ask for the lack of `solutionCompleteness` from what its parent would be if it were present (i.e. the `problem` node).

To recap, `//radioMeta/radioValue` selects problems with a `radioMeta` radio metainformation which has value `radioValue` as long as `radioValue` is not the default value. If we want to select the default value we have to use `//problem[not(radioMeta)]`. If we want to select all problems which have any value other than the default, we can use `//radioMeta` or `//problem[radioMeta]`. For example, `//solutionCompleteness` will select all problems which have a `solutionCompleteness` of `full` or `partial`.

# Select By Scale Metainformation

Scale is structured differently than checkbox and radio in that the information is stored as an attribute instead of a node. Recall the default value is 0 and, if we assigned 0, the node will not be added to the file.

If we want to show problems with a `difficulty` (a scale metainformation) of 1 then we search the string `//difficulty[@scale=1]`. XPath allows numerical operations like comparisons, so we can also search for `//difficulty[@scale>=1]` or `//difficulty[@scale<5]`. If for some reason we need to do arithmetic, the string `//difficulty[(@scale*3)<=7]` also works, this time selecting all problems with a `difficulty` whose value,after multiplying by 3, is less than or equal to 7.

The caveat here is that we may want to include those problems with a difficulty of 0, like in `\difficulty[@scale<5]`, where we want to consider 0<5 as being true. No problem will have an explicit value of 0 in the `difficulty` `scale` attribute. We can account for this by using a special case (essentially the combination "difficulty < 5 or no difficulty given"), but first we have to see how to join several search strings at once.

# Combining Search Strings

The easiest combination operation is the or, or union, denoted with a `|`. That is, `//topics/addition | //topics/differentialTopology` will select any problems which have an `addition` or a `differentialTopology` topic. There are other ways to do this, i.e.`//topics[addition] | //topics[differentialTopology]` and `//topics[addition | differentialTopology]` both give the same result.

If we don't like the `|` character, we can use the word `or` instead. Be careful though because while the `|` character can be the outermost operation, as in `//topics/addition | //topics/differentialTopology`, the word `or` only works if it is not the outermost operation. That is, `//topics/addition or //topics/differentialTopology` will not work but `//topics[addition or differentialTopology]` will. You can always nest the search to start with the `problem` node if you need to make an operation not be the outermost, i.e. `//problem[topics/addition or topics/differentialTopology]` works because now the `or` is wrapped inside the `//problems` specifier. There are also some cases where `or` works but `|` doesn't.

If you instead want and/intersection, use`and` instead of `or` above. That is, `//topics[addition and differentialTopology]` will select problems marked with both topics.

You can also use `not`, though the syntax is a little different as we saw in the radio section above. The string `//topics[addition and not(differentialTopology)]` works.

Parenthesis work exactly as you want them to, so for example `//problem[solutionCompleteness and (topics/addition or not(topics/differentialTopology))]` is a more specific selector, choosing only those problems which have a non-`none` `solutionCompleteness` and have the `addition` topic or don't have the `differentialTopology` topic.

Back to the special case for scale metainformation, if we want to account for a `difficulty` of 0 then we can use something like `//problem[not(difficulty) or difficulty[@scale<5]]`.