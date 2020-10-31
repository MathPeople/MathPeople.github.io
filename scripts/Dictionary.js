// Dictionaries are graphs with the capacity to refer to self-containement. Each member of a dictionary is a typed graph and as such depends on other typed graphs, the dictionary must contain all dependents.
var Dictionary = {};

Dictionary.protoModel = Object.create(Graph.protoModel);

Dictionary.newDictionary = function newDictionary(ui, protoModel = Dictionary.protoModel) {
    let returner = Graph.newGraph(ui, protoModel);
    return returner;
}