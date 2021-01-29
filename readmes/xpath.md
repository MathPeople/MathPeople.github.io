# XPath

XPath is a language for querying XML files, maintained by the World Wide Web Consortium (the same people who make standards for all the web languages, HTML/CSS/XML/etc). Like anything related to XML, XPath is probably the best way to accomplish what it is designed for, but it comes with the cost of having to learn a new language to do the task. Skip to the examples below if you just want to get some practice with how it works.

Specifically, XPath is a querying language -- a language for selecting particular nodes in XML files. The idea of XPath is that it is applied to an XML file to give something (a node or list of nodes in our case) which, in theory, is then used in the next step depending on the application. XPath can also be used to extract information from XML files, like XPaths or numbers, but we are not so interested in that feature. As we will see, we are using XPath more for a test on the document as a whole rather than to extract particular information from the document.

# Searching the Problems

When you go to a qual's page you see the full list of problems. For all but the template page, this list is fairly overwhelming. The search function is there to narrow this list down to something more manageable. Searching is done by entering an XPath expression into the search bar.

What the site does is takes that expression and applies it to each problem's file, itself an XML file (you should definitely check out the file format readme to know what these problem files look like). If any node is found matching the XPath expression then that problem is shown, and if no node is found then the problem is hidden. You can see this immediately by searching the XPath `"*"`, which is a wildcard meaning match anything. Because everything is matched, all problems are shown. Change the search XPath to `""`, which is not really a valid XPath expression, and no problem will match it so all problems will be hidden.

If you enter the id of a problem then only that problem will be displayed. What happens here is that the search XPath `"problemId"` means search for a node named `"problemId"`. The search starts at the root node and, because we have done no fancy tricks with slashes `/`, the search also ends at the root node. That means a problem is shown if and only if its root node is named `problemId`, which, by our problems file structure, happens if and only if that problem's id is `problemId`.

# The Role of the Slash / Parent-Child Relationships

The character `/` means child/descendant in XPath. A XPath that starts with a `/` means start with the root of the document, and the XPath fragment `node/child` means look for a node named `child` which is the child of a node named `node`. It may be worthwhile to know that this selects the `child` node, but we will get back to this technicality shortly.

The slash can be doubled, `//`, and this means any descendant. Most of our XPaths start with a double slash, and this means any node in the document. For example, the XPath `//problem` will match any problem file which has a node named `problem` somewhere in the file (because of our file structure this is all the problems). The XPath `*/problem` also selects all the problems, because every problem is saved such that the `problem` node is a child of the root node (the `*` is selecting the root node). The XPath `/problem` will not select any problem, because this one means select all problems with root node named `problem` and none of our problems are given the `id` `problem`, but the XPath `/*/problem` will match all problems -- the `*` is a wildcard here representing the problem's id.

The slash character is not the only way to select based on specific parent/child names. We have seen how `node/child` selects a `child` node which is a child of a `node` node, but what if we want the slightly different behavior of selecting a `node` node which has a child `child`? We accomplish this with the XPath fragment `node[child]`. Both XPath fragments refer to the situation when a node named `node` is the parent of a node named `child`, but they differ in which node is actually selected. We don't care too much about this, though, because we are only interested in the presence of such a node -- we don't actually do anything with the selected node besides check if one was found.

# Select By Checkbox Metainformation

We have seen how to single out a specific problem by id (the XPath `problemId` suffices), but working with just the problem ids is not interesting to us when there are hundreds of problems. We want to utilize the metainformation saved in each problem file. We start with the simplest type of metainformation, the checkbox type. If you haven't looked, check out the file format readme for a description on types of metainformation.

If you want to select all problems with the `addition` topic (where `topic` is a checkbox metainformation), search the XPath `//addition`. Any file with a node named `addition` somewhere in it will be matched. If you want to be more specific (anticipating that `addition` may possibly be overloaded in multiple types of metainformation), search the XPath `//topics/addition` to specify that the `addition` node must be a child of a node named `topics`, which itself can be anywhere in the document. You could, alternatively, use the XPath `//topics[addition]` and select the exact same set of problems.

Because of the specific file structure used in the problem files, the XPaths `//problem/topics/addition`, `//problem[topics/addition]`, `//problem[topics[addition]]`, `*/problem/topics/addition`, `*/*[topics/addition]`, etc will all show a problem which has a `topics` of `addition` and will hide the rest. It is generally good practice to keep the XPaths as simple as possible, though, so these last few are unfavorable because they are unnecessarily specific. The previous paragraph has the two best ways to select problems with a `topics` of `addition`, namely `//topics/addition` or `//topics[addition]`.

# Select By Radio Metainformation

For the most part, radio is just a special case of checkbox so it behaves mostly the same. The distinction comes with the default value. In the template problems repository, look at the metainformation `solutionCompleteness`. It is radio with default `none` and other values `full` and `partial`. Selecting for the latter two are the same as for checkbox, i.e. `//solutionCompleteness/full` or `//solutionCompleteness[partial]` will work. If you want to select problems which have a `solutionCompleteness` of `none`, the approach is different because this is the default value.

You may recall from the file format readme that metainformation nodes are only inserted if they are required. Because `none` is the default value, there will be no `solutionCompleteness` node in the problem file for a problem flagged as having a `solutionCompleteness` of `none`. In fact, if every problem in the whole qual list has a `solutionCompleteness` of `none` then no problem will have a `solutionCompleteness` node and the editor won't even recognize `solutionCompleteness` as a class of metainformation.

In this situation, when we want to select all problems with a `solutionCompleteness` of `none`, we have to search for problems which do not contain a `solutionCompleteness` node. The XPath `//problem[not(solutionCompleteness)]` does this. Note that we have to refer to the `problem` node to do this because the XPath has to end pointing at something, so we have to specifically ask for the lack of `solutionCompleteness` from what its parent would be if it were present (i.e. the `problem` node).

To recap, `//radioMeta/radioValue` selects problems with a `radioMeta` radio metainformation which has value `radioValue` as long as `radioValue` is not the default value. We could choose the same problems with the XPath `//problem/radioMeta/radioValue`. If we want to select the default value we have to use `//problem[not(radioMeta)]`. If we want to select all problems which have any value other than the default, we can use `//radioMeta` or `//problem[radioMeta]`. For example, `//solutionCompleteness` will select all problems which have a `solutionCompleteness` of `full` or `partial`, and none of the problems which have the default `solutionCompleteness` value of `none`.

# Select By Scale Metainformation

Scale is structured differently than checkbox and radio in that the information is stored as an attribute instead of a node. Recall the default value is 0 and, if we assigned 0, the node will not be added to the file.

If we want to show problems with a `difficulty` (a scale metainformation) of 1 then we search the XPath `//difficulty[@scale=1]`. Note the `@` symbol which means attribute instead of node. XPath allows numerical operations like comparisons, so we can also search for `//difficulty[@scale>=1]` or `//difficulty[@scale<5]`. If for some reason we need to do arithmetic, the XPath `//difficulty[(@scale*3)<=7]` also works, this time selecting all problems with a `difficulty` whose value, after multiplying by 3, is less than or equal to 7.

The caveat here is when we want to include the default value of 0. If we want to search just for problems with a diffiulty of 0, we can do that with `//problem[not(difficulty)]`. If, however, we want to select all problems with a difficulty less than 5 (where we consider 0<5 as being true) then we cannot do that in one go. We basically have to search for the combined expression of any problem with a given difficulty where that value is less than 5 (`//difficulty[@scale<5]`) or no given difficulty (`//problem[not(difficulty)]`). We can't do this until we know how to combine XPaths, which we conveniently cover next.

# Combining Search XPaths

The easiest combination operation is the or, or union, denoted with a `|`. That is, `//topics/addition | //topics/differentialTopology` will select any problems which have an `addition` or a `differentialTopology` topic. There are other ways to do this, i.e.`//topics[addition] | //topics[differentialTopology]` and `//topics[addition | differentialTopology]` both give the same result.

If we don't like the `|` character, we can use the word `or` instead. Be careful though because while the `|` character can be the outermost operation, as in `//topics/addition | //topics/differentialTopology`, the word `or` only works if it is not the outermost operation. That is, `//topics/addition or //topics/differentialTopology` will not work but `//topics[addition or differentialTopology]` will. You can always nest the search to start with the `problem` node if you need to make an operation not be the outermost, i.e. `//problem[topics/addition or topics/differentialTopology]` works because now the `or` is wrapped inside the `//problems` specifier. There are also some cases where `or` works but `|` doesn't.

At this point we can see how to select all problems with a difficulty less than 5 where we consider 0<5 as true. We can accomplish this with `//problem[not(difficulty)] | //difficulty[@scale<5]` or, alternatively, `//problem[not(difficulty) or difficulty[@scale<5]]`.

If you instead want and/intersection, use`and` instead of `or` above. That is, `//topics[addition and differentialTopology]` will select problems marked with both topics. Remember that `and`, like `or`, cannot be the outermost operation. They have to be inside square brackets to work.

You can also use `not`, though the syntax (parentheis) is a little different as we saw in the radio section above. The XPath `//topics[addition and not(differentialTopology)]` works.

Parenthesis work exactly as you want them to, so for example `//problem[solutionCompleteness and (topics/addition or not(topics/differentialTopology))]` is a more specific selector, choosing only those problems which have a non-`none` `solutionCompleteness` and have the `addition` topic or don't have the `differentialTopology` topic.