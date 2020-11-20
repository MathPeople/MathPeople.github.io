# File Format

This readme is for those of you who wish to change something about the problem format, in particular to add a category of metainformation to the problem files. First off, the problem file is in xml format. That means it is essentially a tree where nodes have names and attributes. In the file, each node has an opening and closing tag and the nodes between are the children. An example xml file is below, representing a family tree.

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

When the reader opens this file, it will not find any of the nodes it is expecting to find (except the root). The root is the id of the problem, and then all the metainformation is interpreted to be the default values and the problem and solution are both interpreted to be blank lines. This is not really a problem someone would study, but it does successfully compile.

# A Pure Question-Answer Problem File

This example has no metainformation, just a question about arithmetic:

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

# Metainformation

This is where structure plays a role. We use the following convention for metainformation: Any direct child of the problem node is a type of metainformation. Any child of that node is the value for that piece of metainformation. There is no global list of metainformation like the `problemsList.txt` list of all problems. Instead, when a list of problems is loaded each problem is scanned for metainformation. The file reader keeps track of all encountered metainformation and generates the metainformation sections based on what it found. In that sense metainformation describes itself.

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
    </problem>
    <solution tex="By definition of 2,&#xA;\[1+1=2.\]"/>
</arithmeticQuestion>
```

This file declares that `arithmeticQuestion` has three `topics` (`addition`, `naturalNumbers`, and `definitionOf2`) and that its `solutionCompleteness` is `full`. Any other metainformation which is asked from this file will not be found, so will be treated as having the default (usually blank).

# Metainformation Attributes

In the above example, the `solutionCompleteness` tag has an attribute (`radio="none"`). This is because some metainformation allows for multiple values and some does not. The default behavior of metainformation is to allow multiple values, we call this checkbox metainformation (`topics` is checkbox). Values in a checkbox tag are interpreted as selected options for that metainformation. Checkbox metainformation defaults to empty, so if the tag is not present then that is interpreted as no value is selected.

If a type of metainformation is supposed to have only one value then we call it radio. We mark a type of metainformation as radio by adding the attribute like above. A radio metainformation is interpreted as a list of options in a set of radio buttons, meaning one and only one is selected. Radio metainformation comes with a default value, so that default value is saved as the value of the `radio` attribute. This doesn't affect the `arithmeticQuestion` problem itself but actually tells the file reader that the `solutionCompleteness` radio metainformation has a default value of `none`.

Sometimes it may be useful to interpret metainformation as a number instead of a tag. We do this with the `scale` attribute. An example is below.

```
<arithmeticQuestion>
    <problem tex="What is $1+1$?">
        <topics>
            <addition/>
            <naturalNumbers/>
            <definitionOf2/>
        </topics>
        <difficulty scale="3"/>
    </problem>
    <solution tex="By definition of 2,&#xA;\[1+1=2.\]"/>
</arithmeticQuestion>
```

The `difficulty` metainformation is a number, 3 in this example. No information about the relative weight of this value is stored anywhere in the problem files, instead the weight is inferred by comparing one problem's value to another. If a problem file has no tag corresponding to this scale metainformation then the number is interpreted as 0 by default.