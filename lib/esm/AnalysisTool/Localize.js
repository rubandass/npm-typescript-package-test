/**
 * Localization engine.
 */
var Localize = function (phrase) { return phrase.replace(/^@.*?:/, ''); };
Localize.replace = function (phrase) { return phrase.replace(/\$L\{(.*?)\}/g, '$1'); };
export default Localize;
