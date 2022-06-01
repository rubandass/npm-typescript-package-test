/**
 * Localization engine.
 */
const Localize = (phrase: string) => phrase.replace(/^@.*?:/, '');
Localize.replace = (phrase: string) => phrase.replace(/\$L\{(.*?)\}/g, '$1');
export default Localize;
