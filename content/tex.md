<html lang="en">
    <head>
        <meta charset="utf-8"/>
        <title>Browser TeX</title>
        <link rel="stylesheet" type="text/css" href="../css/tex.css"/>
        <script src="../scripts/xmlImporter.js"></script>
        <script src="../scripts/jax.js"></script>
        <script src="../scripts/problems.js"></script>
        <script src="../scripts/tex.js" async defer></script>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png">
        <link rel="manifest" href="/site.webmanifest">
    </head>
    <body>
        <div class="title">
            <h1>Browser \(\TeX\)</h1>
        </div>
        <p>Use this tool to write \(\LaTeX\) in the right format for use on this site. Read the <a href="https://github.com/MathPeople/MathPeople.github.io/wiki/Making-the-Problems">wiki</a> to see how to use this editor.</p>
        <label for="qualName">This is for qual</label>
        <input type="text" id="qualName"/>
        <label for="loadedProblems">Loaded problems:</label>
        <select id="loadedProblems"></select>
        <div><button type="button" id="clearTex">Clear / New Problem</button></div>
        <div><button type="button" id="pairSolo">To Solo mode</button></div>
        <details id="metainformation">
            <summary>Set the Metainformation</summary>
            <p id="idP">Problem ID: <input type="text" id="problemID" list="idList"/><datalist id="idList"/></p>
            <div>
                <label for="newMetatype">New Metatype:</label><input id="newMetatype" type="text"/>
                <select id="newMetatypeType">
                    <option disabled="">Select Type</option>
                    <option>Checkbox</option>
                    <option>Radio</option>
                    <option>Scale</option>
                </select>
                <input id = "defaultOption" type="text" hide=""/>
            </div>
            <div id="putMetasHere"></div>
            <div><label>
                Rename metainformation
                <input id="renameMetainformation" type="text" placeholder="actually rename metainformation"/>
                </label></div>
            <div><label>
                Alternate name metainformation
                <input id="renameSoftMetainformation" type="text" placeholder="locally rename some tag"/>
                </label></div>
        </details>
        <details id="wholeList">
            <summary>List View</summary>
            <div>
                <label for="toggleColumn">Toggle column</label>
                <input id="toggleColumn" type="text"/>
            </div>
            <div>
                <label for="practiceSearch">Search</label>
                <input id="practiceSearch" type="text"/>
            </div>
            <table id="wholeListHere"></table>
        </details>
        <label for="texProblem" pairOnly="">Problem:</label>
        <div><textarea class="texInput" id="texProblem" spellcheck="false"></textarea></div>
        <label for="texSolution" pairOnly="">Solution:</label>
        <div pairOnly=""><textarea class="texInput" id="texSolution" spellcheck="false"></textarea></div>
        <div id="texLiveOut"><p>Rendered TeX will go here</p></div>
        <button type="button" id="save">Save</button>
        <div><textarea id="codeOut" spellcheck="false">Formatted code will go here</textarea></div>
        <details id="practiceTests">
            <summary>Practice Tests</summary>
            <button id="newPracticeTestButton">New Practice Test Configuration</button>
        </details>
        <button type="button" id="saveAll">Save All (.zip)</button>
        <p id="errorOut"/>
        <div id="problemsSpot"/>
    </body>
</html>