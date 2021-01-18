# File Format

This readme is for those of you who wish to understand or change something about the problem file format. First off, the problem file is in xml format. That means it is essentially a tree of nodes which have names and attributes. In the file, each node has an opening and closing tag. The nodes between these are the descendants. An example xml file is below, representing a family tree.

```
<rootNode>
    <grandparent>
        <aunt>
            <cousin1/>
            <cousin2/>
        </aunt>
        <parent>
            <olderSibling/>
            <me>
                <child/>
            </me>
            <youngerSibling>
                <nephew/>
            </youngerSibling>
        </parent>
        <uncle/>
    </grandparent>
</rootNode>
```
Every xml file must have a root. An element can either have children (the two-tag elements like `<aunt>...</aunt>` have children which are listed between the two tags) or not have children (those are the self-closing one-tag elements like `<uncle/>`). Elements can also have attributes, which look like `<parent name="Chris" birthYear="1958"> ... </parent>` or `<child name="Gater" birthYear="2025"/>`.

# The Plain Problem File

The simplest problem file is pretty empty.

```
<blankProblem/>
```

When the reader opens this file, it will not find any of the nodes it is expecting to find (except the root). The root is the id of the problem, and then all the metainformation is interpreted to be the default values while the problem and solution TeXs are both interpreted to be blank lines. This is not really a problem someone would study, but it does successfully compile.

# A Pure Question-Answer Problem File

This example has no metainformation, just a question about arithmetic:

```
<arithmeticQuestion>
    <problem tex="What is $1+1$?"/>
    <solution tex="By definition of 2,&#xA;\[1+1=2.\]"/>
</arithmeticQuestion>
```

This is the structure used by this site, although at this point the file reader actually isn't too strict about node structure. The editor can tell the problem's id because that is the nodeName of the root node. To find the problem it searches for a node with nodeName `problem` and then reads the `tex` attribute for the tex of the problem. The process is similar for the solution. This file would compile just as well:

```
<arithmeticQuestion>
    <solution tex="By definition of 2,&#xA;\[1+1=2.\]"/>
    <problem tex="What is $1+1$?"/>
</arithmeticQuestion>
```

Note that, because of this searching process, you shouldn't name a problem `problem` or `solution`. That would cause interference with the expected structure and will cause unexpected behavior.

# Metainformation

Metainformation is stored by location, so the structure is more rigid than that of the problem and solution. We use the following convention for metainformation: Any direct child of the problem node is a type of metainformation. Any child of that node is a value for that piece of metainformation.

There is no global list of metainformation like the `problemsList.txt` list of all problems. Instead, when a list of problems is loaded each problem is scanned for metainformation. The file reader keeps track of all encountered metainformation and generates the metainformation sections based on what it found. In that sense metainformation describes itself.

This problem file has some metainformation in it:

```
<arithmeticQuestion>
    <problem tex="What is $1+1$?">
        <topics>
            <addition/>
            <naturalNumbers/>
            <definitionOf2/>
        </topics>
        <solutionCompleteness radio="none">
            <full/>
        </solutionCompleteness>
        <difficulty scale="1"/>
    </problem>
    <solution tex="By definition of 2,&#xA;\[1+1=2.\]"/>
</arithmeticQuestion>
```

This file declares that `arithmeticQuestion` has three `topics` (`addition`, `naturalNumbers`, and `definitionOf2`), that its `solutionCompleteness` is `full`, and that it has a `difficulty` of 1. Any other metainformation which is asked from this file will not be found, so will be treated as having the default. For example, if we search this file for the metainformation `instructors`, we will consider that by default no instructors were selected.

# Types of Metainformation

There are three types of metainformation: checkbox, radio, and scale. The above example has one of each. The simplest type is the checkbox, `topcis` above. A checkbox metainformation has a list of values (given as child nodes). If the appropriate node (the one named `topics` above) is not found then the problem is interpreted as not having any values applied for that metainformation.

The radio type is closely related to the checkbox type. Radio is essentially checkbox subject to the requirement that one and only one value be given. For backwards compatibility, radio metainformation must declare a default value to be used if the tag is not found. This is what the attribute `radio="defaultValue"` is for on the metainformation tag. Above, the metainformation `solutionCompleteness` is radio type with default value `none`.

The third type of metainformation is scale, `difficulty` above, for storing numbers. Scale metainformation has no child nodes, only the attribute `scale`. Its value is the value assigned. There is no context given in the files for these numbers and the default value is 0. The numbers only have meaning if they have been consistently applied to the whole batch of problems.