export class List {
    constructor(title, words = []){
        this.id = crypto.randomUUID();
        this.title = title;
        this.words = words;
        this.verified = false;
    }
    getWords() { return this.words; }
    getWordCount() { return this.words.length; }
    isVerified() { return this.verified }
    setVerification(bool) {
        if (typeof bool !== 'boolean') { return { success: false, message: 'List verification only accepts booleans' }; }
        this.verified = bool;
    }
}