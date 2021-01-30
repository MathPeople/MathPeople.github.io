# Test Generator

The test generator is a major feature of this website. Given a problems repository and a configuration, the test generator chooses problems according to the configuration and makes a practice test. Before looking at how to configure the generator, make sure you know how problem searching works by checking out the XPath readme. Configuration is based on the same principle.

# Test Name

Configuration is given as an XML file. Being an XML file, it needs to have a root node. All configuration files are given such that the name of the test is the root node, with an optional `name` attribute giving a more reader-friendly version of the name. We also need to specify which problems we want to choose from, so add an attribute named `qual` which points to the appropriate repository. So, if we are building a sample test generator configuration for the complex problems repository, it would start as

```
<sampleTest name="Sample Test" qual="complex"/>
```

This says our test has the title `Sample Test` and pulls from complex problems. When choosing your own titles, remember that this is for the test generator, which itself will generate as many tests as the student requests, so naming it something like `Practice Test 1` may be misleading since there may be dozens of tests made by this configuration. It may be better to name it something like `Part A Only` or `Any Question is Fair Game`, depending on the particulars of your configuration.

# Sections of the Test

Most quals are split into three parts (the three courses from that year, A/B/C), so we need a way to split our tests into parts. To do this, any child of the root node (so anything matching the XPath `*/*` in the configuration file) represents a test section. Naming these sections is the same as naming the test. Each section comes with a predetermined number of questions, given as an attribute named `numQuestions`. If we want to do the classic test with 4-choose-3 questions from each part, we can start with a file like

```
<sampleTest name="Sample Test" qual="complex">
    <A name="Part A Questions" numQuestions="4" choose="3"/>
    <B name="Part B Questions" numQuestions="4" choose="3"/>
    <C name="Part C Questions" numQuestions="4" choose="3"/>
</sampleTest>
```

If you omit the `choose` attribute the generator will not mention a choice of problems, and it is implied that the student answer all questions.

# Selecting Problems

Now that we have chosen the structure of our test, how do we actually select problems? The easiest way is directly selecting problems by metainformation matches, like the search feature on the repository page. That is, we filter the repository with an XPath expression, collect all the problems which pass that test, and choose the right amount from that list. We do this by

```
<sampleTest name="Sample Test" qual="complex">
    <A name="Part A Questions" numQuestions="4" choose="3">
        <problem XPath="//part/A"/>
    </A>
    <B name="Part B Questions" numQuestions="4" choose="3">
        <problem XPath="//part/B"/>
    </B>
    <C name="Part C Questions" numQuestions="4" choose="3">
        <problem XPath="//part/C"/>
    </C>
</sampleTest>
```

Note an annoyance: The complex problems aren't actually given parts A/B/C metainformation, so this is not a valid test configuration. Sorry about that but this is all messed up because part C didn't exist until recently so the qual structure has gone through major changes and instead we have the distinction between A/B and C, but not between A and B. Again, sorry about that. An actually valid test would be

```
<sampleTest name="Sample Test" qual="complex">
    <AB name="Parts A/B Questions" numQuestions="8" choose="6">
        <problem XPath="//problem[not(topics/RiemannSurfaces)]"/>
    </A>
    <C name="Part C Questions" numQuestions="4" choose="3">
        <problem XPath="//topics/RiemannSurfaces"/>
    </C>
</sampleTest>
```

We are certainly not done, however. The test generator will avoid explicit duplicates but so far we have not provided a means of avoiding vary similar problems from being selected. It is good enough to be useful now, though, because a student can just regenerate the test if it is too repetitive and keep regenerating until a sufficiently diverse test is made.