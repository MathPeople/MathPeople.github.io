---
title: Test Page
layout: default
---

<link rel="problems-repository" href="complex">
<!-- <script src="/scripts/xmlImporter.js"></script> -->
<script src="/scripts/problemHandler.js" ></script>
<link rel="stylesheet" type="text/css" href="/css/editor.css"/>

<!-- ## Testing Buttons

<button onClick="printMetasArray(&quot;displayhere&quot;)">Print Metas</button>
<button onClick="initSearchData()">initSearchData()</button>

<button onclick="doStuff()">Do Stuff</button>

Display here:
<div id="displayhere"></div> -->


## Problem Search Bar

<details>
<summary> Use the following features to view and search problems. </summary>

Click the button to make the bar appear. Currently, the search bar is bugged.

<button onClick="scanAndProcessDOMProblems()">Process Problems</button>

<div problems-repository-xpath="//topics[Liouville and RiemannSurfaces]" problems-repository-searchable="//topics[Liouville and RiemannSurfaces]"></div>
</details>

## Problem Search Options

The following can be used to help filter the problems displayed. Namely, one can see all the available problems and the possible metadata used for filtering problems.

<div id="searchLoc"></div>




