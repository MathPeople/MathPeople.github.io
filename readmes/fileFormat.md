# File Format

This readme is for those of you who wish to change something about the problem format, in particular to add a category of metadata to the problem files. First off, the problem file is in xml format. That means it is essentially a tree where nodes have names and attributes. In the file, each node has an opening and closing tag and the nodes between are the children. An example xml file is below, representing a family tree.

```
<rootNode>
    <grandparent>
        <aunt>
            <cousin/>
            <cousin/>
        </aunt>
        <parent>
            <olderSibling/>
            <me>
                <child/>
            </me
            <youngerSibling>
                <nephew/>
            </youngerSibling>
        </parent>
        <uncle/>
    </grandparent>
</rootNode>
```
Every xml file must have a root. An element can either have children (the 2 tag elements have children) or not have children (those are the self-closing 1 tag elements). Elements can also have attributes, which look like `<parent name="Chris" birthYear="1958"> ... </parent>` or `<child name="Gater" birthYear="2040"/>`.

# The Plain Problem File

The simplest problem file is pretty empty.

```
<blankProblem/>
```

When the reader opens this file, it will not find any of the nodes it is expecting to find (except the root). The root is the id of the problem, and then all the metadata is interpreted to be the default values and the problem and solution are both interpreted to be blank lines. This is not really a problem someone would study, but it does successfully compile.

# A Pure Question-Answer Problem File

This example has no metadata, just a question about arithmetic:

```
<arithmeticQuestion>
    <problem tex="What is $1+1$?"/>
    <solution tex="By definition of 2,&#xA;\[1+1=2.\]"/>
</arithmeticQuestion>
```

This is the structure used by this site, although the file reader actually isn't strict about node structure. It can tell the id because that is the nodeName of the root node. To find the problem it searches for a node with nodeName "problem" and then reads the "tex" attribute for the tex of the problem. The process is similar for the solution. This file would compile just as well:

```
<arithmeticQuestion>
    <solution tex="By definition of 2,&#xA;\[1+1=2.\]"/>
    <problem tex="What is $1+1$?"/>
</arithmeticQuestion>
```

# Metadata

This is where structure plays a role. We use the following convention for metadata: Any direct child of the problem node is a type of metadata. Any child of that node is the value for that piece of metadata. Some metadata allow for multiple values and some do not, both follow the child structure here. This problem file has some metadata in it:

```
<arithmeticQuestion>
    <problem tex="What is $1+1$?">
        <topics>
            <addition/>
            <naturalNumbers/>
            <definitionOf2/>
        </topics>
        <solutionCompleteness>
            <full/>
        </solutionCompleteness>
    </problem>
    <solution tex="By definition of 2,&#xA;\[1+1=2.\]"/>
</arithmeticQuestion>
```

This file declares that `arithmeticQuestion` has three topics, `addition`, `naturalNumbers`, and `definitionOf2`, and that its `solutionCompleteness` is `full`. Any other metadata which is asked from this file will not be found, so will be treated as having the default (usually blank).

# Adding New Metadata

Adding new metadata to the files is as easy as just adding it. It will be ignored by things which aren't looking for it. It is almost as easy to use new metadata because the generic problem reader is designed to look for all metadata and offer the options to the user. This is done using the child structure convention described above.

The hardest part of creating new types of metadata is offering it in the file editor to the author of the problem file. This is not a standard procedure because it depends on what the metadata represents. All the code involved in this process lies in the `/scripts/tex.js` file of this repository. You have to edit that file and add features for interfacing with the new metadata type if you want it to be available in the editor. The primary changes have to be made in `resetDoc()` and `outputFromDoc()` because these are where the xml file interacts with the interface.