// check if this object is empty
function isEmpty(object) {
    for (let p in object) return false;
    return true;
}
// check if this object has more than one property
function isMultiple(object) {
    let first = false;
    for (let p in object) if (first) return true; else first = true;
    return false;
}
// add an article to a word, "a" if the word starts with a consonant and "an" if the word starts with a vowel
function aan(word, wordStart = 0) {
    return "a" + ("AaEeIiOoUu".includes(word.charAt(wordStart))? "n ": " ") + word;
}