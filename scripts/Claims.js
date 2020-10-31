var Claims = {metaTypes: {}};

Claims.existence = TypedGraph.newPhraseType("existenceClaim", TypedGraph.phraseTypes.testable.protoModel, function reader(node, ui) {
    let returner = TypedGraph.phraseTypes.testable.reader.call(this, node, ui);
    let context;
    for (let member in returner.members) {
        if (returner.members[member].type == "existenceClaim context") {
            if (context) throw Error("too many existenceClaim contexts");
            else context = member;
        }
    }
    if (!context) throw Error("need a context for existenceClaim");
    if (!(context in returner.members[returner.root].children)) throw Error("existenceClaim context must be maximal");
    return returner;
});

Claims.metaTypes.existenceContext = TypedGraph.makeGenesisGraph("context", "existenceClaim context");

Claims.claim = TypedGraph.newPhraseType("claim", TypedGraph.phraseTypes.testable.protoModel, function reader(node, ui) {
    let returner = TypedGraph.phraseTypes.testable.reader.call(this, node, ui);
    let context, assumptions;
    for (let member in returner.members) {
        if (returner.members[member].type == "claim context") {
            if (context) throw Error("too many claim contexts");
            else context = member;
        }
        if (returner.members[member].type == "claim assumptions") {
            if (assumptions) throw Error("too many claim assumptions");
            else assumptions = member;
        }
    }
    if (!context || !assumptions) throw Error("need context and assumptions for claim");
    if (!(assumptions in returner.members[returner.root].children)) throw Error("claim assumptions must be maximal");
    if (!(context in returner.members[assumptions].children)) throw Error("claim context must be child of assumptions");
    return returner;
});

Claims.metaTypes.context = TypedGraph.makeGenesisGraph("context", "claim context");
Claims.metaTypes.assumptions = TypedGraph.makeGenesisGraph("assumptions", "claim assumptions");