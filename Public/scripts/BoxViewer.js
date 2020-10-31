/*
BoxViewer takes a tree structure and makes a viewer for it using boxes. Each box is an element, the sub boxes are the children and the information in each box are the attributes, called info.

The process: Start with a data tree structured in any form. Turn that data tree into a model.

A model is a particular type of data tree consisting of objects called family members. Each family member has an "info" property which contains all the data used to describe that family member. Each family member (except the root) has a "parent" property pointing to the parent family member. Each family member (except the root) has a "siblingNumber" property which refers to which child of its parent it is. Each family member (except the root) which has an older sibling (one with a lower siblingNumber) has an "olderSibling" property pointing to its older sibling and likewise for "youngerSibling" if applicable. Each family member has a "children" property which is an array of family members, this array is empty if the member is childless. The root family member is referred to as the model.

The next step is to make the family. This is where the boxes are created relative to their relations. A model is turned into a family, which is an enhanced version of a model. A family member is now considered to be the center, and its family is referred to by relative coordinates. The family member has a "boxes" property which is the renderings of all the family that member considers, in the form so as to appear relative to the member.
*/

{
    let link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("href", filePrefix + "css/BoxViewer.css");
    document.head.appendChild(link);
}

var BoxViewer = {};
BoxViewer.viewXML = function viewXML(xml, loadTo = document.body) {
    let family = BoxViewer.xmlToFamily(xml);
    BoxViewer.buildFamily(family);
    BoxViewer.getPositions(family);
    loadTo.appendChild(family.loadTo);
    console.log(xmlImporter.printXML(xml));
}
/*
A family is a node in the tree, with accessor properties for parent, children, and one step for the sibling in each direction. The member is given a boxes object, which contains all the boxes this member will consider when it is focused.
*/
{
    function p(text, atts) {
        let returner = document.createElement("p");
        returner.appendChild(document.createTextNode(text));
        if (atts) for (let att in atts) returner.setAttribute(att, atts[att]);
        return returner;
    }
    function box(familyMember, represents, ...ps) {
        let returner = {};
        returner.represents = represents;
        let div = document.createElement("div");
        div.setAttribute("class", "familyMember");
        div.setAttribute("familyMember", familyMember);
        for (let p of ps) div.appendChild(p);
        returner.box = div;
        returner.getDimensions = BoxViewer.defaultFunctions.getDimensionsPBox;
        returner.move = BoxViewer.defaultFunctions.movePBox;
        return returner;
    }
    BoxViewer.xmlToFamily = function xmlToFamily(xml, familyPosition = "p") {
        if (xml.nodeType == 9) xml = xml.firstChild;
        let returner = {};
        returner.familyPosition = familyPosition;
        returner.children = [];
        returner.boxes = {};
        returner.boxes.me = box("me", returner);
        returner.boxes.me.box.appendChild(p(xml.nodeName, {pBoxStyle: "title"}));
        for (let att of xml.attributes) {
            returner.boxes.me.box.appendChild(p(att.name + ": " + att.value));
        }
        let childNumber = 0;
        for (let child of xml.childNodes) {
            if (child.hasChildNodes()) if (child.firstChild.nodeType == 3) {
                let line = child.nodeName;
                if (child.attributes.length > 0) {
                    line += " (";
                    for (let att of child.attributes) line += att.name + ": " + att.value + ", ";
                    line = line.substring(0, line.length - 2) + ")";
                }
                line += ": " + child.firstChild.nodeValue;
                returner.boxes.me.box.appendChild(p(line));
                continue;
            }
            let childBox = BoxViewer.xmlToFamily(child, familyPosition + "c" + returner.children.length);
            childBox.parent = returner;
            childBox.siblingNumber = returner.children.length;
            childBox.node = child;
            returner.children.push(childBox);
            childBox.boxes.mep = box("parent", returner, p(xml.nodeName));
            returner.boxes["mec" + childNumber] = box("child", childBox, p(child.nodeName));
            ++childNumber;
        }
        for (let i = 1; i < returner.children.length; ++i) {
            returner.children[i].olderSibling = returner.children[i-1];
            returner.children[i-1].youngerSibling = returner.children[i];
            for (let j = 0; j < returner.children.length; ++j) {
                if (j == i) continue;
                returner.children[j].boxes["mes" + (i-j)] = box("youngerSibling", returner.children[i], p(returner.children[i].node.nodeName));
                returner.children[i].boxes["mes" + (j-i)] = box("olderSibling", returner.children[j], p(returner.children[j].node.nodeName));
            }
        }
        return returner;
    }
}
/*
Relative coordinates is an array of relative steps. A relative step is an object {relation: index} where relation is one of {parent, sibling, child}. The number means nothing for parent, positive sibling means younger sibling, and it means the child at that index for child.
*/
{
    function focus() {
        for (let box in this.boxes) this.boxes[box].box.style.display = "block";
        this.boxes.me.box.focus();
    }
    function blur() {
        for (let box in this.boxes) this.boxes[box].box.style.display = "none";
    }
    BoxViewer.buildFamily = function buildFamily(model, loadTo) {
        if (!loadTo) {
            loadTo = document.createElement("div");
            loadTo.setAttribute("class", "boxViewer");
            model.loadTo = loadTo;
        }
        for (let box in model.boxes) loadTo.appendChild(model.boxes[box].box);
        model.focus = focus;
        model.blur = blur;
        model.boxes.me.box.tabIndex = 0;
        model.boxes.me.box.addEventListener("keydown", function(e) {
            switch (e.keyCode) {
                case 37:
                    if ("olderSibling" in model) {
                        model.blur();
                        model.olderSibling.focus();
                    }
                break; case 38:
                    if ("parent" in model) {
                        model.blur();
                        model.parent.focus();
                    }
                break; case 39:
                    if ("youngerSibling" in model) {
                        model.blur();
                        model.youngerSibling.focus();
                    }
                break; case 40:
                    if (model.children.length > 0) {
                        model.blur();
                        model.children[0].focus();
                    }
                break;
            }
            e.preventDefault();
        });
        for (let box in model.boxes) model.boxes[box].box.addEventListener("click", function(e) {
            model.blur();
            model.boxes[box].represents.focus();
        });
        for (let child of model.children) BoxViewer.buildFamily(child, loadTo);
        return loadTo;
    }
}

BoxViewer.getPositions = function getPositions(member, loadingTime = 400) {
    function callGetDimensions(person) {
        for (let box in person.boxes) {
            person.boxes[box].getDimensions();
        }
        person.blur();
        for (child of person.children) callGetDimensions(child);
    }
    function getMaxPropFromAllMembers(person, prop, result) {
        if (person[prop] > result.result) result.result = person[prop];
        for (let child of person.children) getMaxPropFromAllMembers(child, prop, result)
    }
    function forEach(person, func, pass) {
        func(person, pass);
        for (let child of person.children) forEach(child, func, pass);
    }
    setTimeout(function getPositionsAfterLoading() {
        callGetDimensions(member);
        BoxViewer.setPositions(member);
        let result = {result: 0};
        getMaxPropFromAllMembers(member, "totalWidth", result);
        let totalWidth = result.result + 2*BoxViewer.defaultSpacing.marginWidth;
        result.result = 0;
        getMaxPropFromAllMembers(member, "totalHeight", result);
        let totalHeight = result.result + 2*BoxViewer.defaultSpacing.marginHeight;
        forEach(member, function setOrigin(person) {
            for (let box in person.boxes) person.boxes[box].move(totalWidth/2, totalHeight/2);
        });
        member.loadTo.style.width = totalWidth + "px";
        member.loadTo.style.height = totalHeight + "px";
        member.focus();
    }, loadingTime);
}

BoxViewer.setPositions = function setPositions(member) {
    let spacing = BoxViewer.defaultSpacing;
    // split boxes into rows based on generation
    let rows = {};
    for (let coordString in member.boxes) {
        let row = BoxViewer.relativeCoordinates.generations(coordString);
        if (!rows[row]) rows[row] = [];
        rows[row].push(member.boxes[coordString]);
        rows[row][rows[row].length-1].familyPositionCoordinates = BoxViewer.relativeCoordinates.coordinatesStringToCoordinates(BoxViewer.relativeCoordinates.followCoordinates(member, BoxViewer.relativeCoordinates.coordinatesStringToCoordinates(coordString.substring(2))).familyPosition.substring(1));
    }
    // sort each row
    for (let row in rows) rows[row].sort(function comparator(m1, m2) {
        m1 = m1.familyPositionCoordinates;
        m2 = m2.familyPositionCoordinates;
        if (m1.length != m2.length) throw Error("trying to compare two coordinates in same row but of diferent length");
        for (let i = 0; i < m1.length; ++i) if (m1[i].child < m2[i].child) return -1; else if (m1[i].child > m2[i].child) return 1;
        return 0;
    });
    // center each box relative to itself
    for (let row in rows) for (let box of rows[row]) box.move(-box.width/2, -box.height/2);
    // shift the middle row horizontally
    let x = -member.boxes.me.width/2 - spacing.width;
    for (let i = member.siblingNumber - 1; i >= 0; --i) {
        rows[0][i].move(x - rows[0][i].width/2, 0);
        x -= rows[0][i].width + spacing.width;
    }
    x = member.boxes.me.width/2 + spacing.width;
    for (let i = member.siblingNumber + 1; i < rows[0].length; ++i) {
        rows[0][i].move(x + rows[0][i].width/2, 0);
        x += rows[0][i].width + spacing.width;
    }
    // compute the total height and width of each row
    let rowHeights = {}, rowWidths = {};
    for (let row in rows) {
        rowHeights[row] = 0;
        rowWidths[row] = -spacing.width;
        for (let box of rows[row]) {
            if (box.height > rowHeights[row]) rowHeights[row] = box.height;
            rowWidths[row] += box.width + spacing.width;
        }
    }
    // set heights of parent rows
    let totalHeight = rowHeights[0]/2;
    for (let row = 1; row in rows; ++row) {
        for (let box of rows[row]) box.move(0, -(totalHeight + spacing.height + rowHeights[row]/2));
        totalHeight += rowHeights[row] + spacing.height;
    }
    // set heights of children rows and center them horizontally
    totalHeight = rowHeights[0]/2;
    for (let row = -1; row in rows; --row) {
        for (let box of rows[row]) box.move(0, totalHeight + spacing.height + rowHeights[row]/2);
        totalHeight += spacing.height + rowHeights[row];
        let x = -rowWidths[row]/2;
        for (let box of rows[row]) {
            box.move(x + (box.width/2), 0);
            x += box.width + spacing.width;
        }
    }
    // calculate max, min x,y
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    for (let row in rows) for (let box of rows[row]) {
        if (box.x < minX) minX = box.x;
        if (box.x + box.width > maxX) maxX = box.x + box.width;
        if (box.y < minY) minY = box.y;
        if (box.y + box.height > maxY) maxY = box.y + box.height;
    }
    member.totalWidth = 2*Math.max(maxX, -minX);
    member.totalHeight = 2*Math.max(maxY, -minY);
    // set positions of all remaining family
    for (let child of member.children) BoxViewer.setPositions(child);
}

BoxViewer.relativeCoordinates = {};
BoxViewer.relativeCoordinates.coordinatesToString = function coordinatesToString(coordinates) {
    let line = "me";
    for (let coordinate of coordinates) {
        if ("parent" in coordinate) line += "p" + coordinate.parent;
        if ("sibling" in coordinate) line += "s" + coordinate.sibling;
        if ("child" in coordinate) line += "c" + coordinate.child;
    }
    return line;
}
BoxViewer.relativeCoordinates.followCoordinates = function followCoordinates(me, coordinates) {
    if (coordinates.length == 0) return me;
    if ("parent" in coordinates[0]) return followCoordinates(me.parent, coordinates.slice(1, coordinates.length));
    if ("child" in coordinates[0]) return followCoordinates(me.children[coordinates[0].child], coordinates.slice(1, coordinates.length));
    if ("sibling" in coordinates[0]) return followCoordinates(me.parent.children[me.siblingNumber + coordinates[0].sibling], coordinates.slice(1, coordinates.length));
    throw Error("cannot follow coordinates, cannot find the direction");
}
BoxViewer.relativeCoordinates.coordinatesStringToCoordinates = function coordinatesStringToCoordinates(coordString) {
    if (coordString.substring(0, 2) == "me") coordString = coordString.substring(2);
    let returner = [];
    let name, next, line;
    for (let char of coordString) switch (char) {
        case 'p':
            if (name) {
                next = {};
                next[name] = Number.parseInt(line);
                returner.push(next);
            }
            name = "parent";
            line = "";
        break; case 's':
            if (name) {
                next = {};
                next[name] = Number.parseInt(line);
                returner.push(next);
            }
            name = "sibling";
            line = "";
        break; case 'c':
            if (name) {
                next = {};
                next[name] = Number.parseInt(line);
                returner.push(next);
            }
            name = "child";
            line = "";
        break; default: line += char;
    }
    if (name) {
            next = {};
            next[name] = Number.parseInt(line);
            returner.push(next);
    }
    return returner;
}
BoxViewer.relativeCoordinates.collapseCoordinates = function collapseCoordinates(me, coordinates) {
    for (let i = 0; i < coordinates.length; ++i) {
        if ("sibling" in coordinates[i]) {
            if (coordinates[i].sibling == 0) {
                coordinates.splice(i, 1);
                i = -1;
            }
        }
        if (i > 0) {
            if ("parent" in coordinates[i-1] && "child" in coordinates[i]) {
                coordinates.splice(i-1, 2, {sibling: me.siblingNumber - coordinates[i].child});
                i = -1;
            } else if ("sibling" in coordinates[i-1] && "sibling" in coordinates[i]) {
                coordinates.splice(i-1, 2, {sibling: coordinates[i-1].sibling + coordinates[i].sibling});
                i = -1;
            }
        }
    }
}
BoxViewer.relativeCoordinates.generations = function generations(coordinates) {
    let returner = 0;
    for (let step of BoxViewer.relativeCoordinates.coordinatesStringToCoordinates(coordinates)) if ("child" in step) --returner; else if ("parent" in step) ++returner;
    return returner;
}

BoxViewer.defaultFunctions = {};

BoxViewer.defaultFunctions.getDimensionsPBox = function getDimensionsPBox() {
    this.x = 0;
    this.y = 0;
    this.width = this.box.offsetWidth;
    this.height = this.box.offsetHeight;
}
BoxViewer.defaultFunctions.movePBox = function movePBox(dx, dy) {
    this.x += dx;
    this.y += dy;
    this.box.style.left = this.x + "px";
    this.box.style.top = this.y + "px";
}

BoxViewer.defaultSpacing = {height: 10, width: 5, marginWidth: 20, marginHeight: 18};