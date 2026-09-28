import Game from './Game.js';

export default class GameManager {
    #games = new Map();

    createGame(hostId, playerLists = {}, mockGame = false) {
        const code = this.#generateUniqueCode();
        const game = new Game(hostId, code, playerLists, mockGame);

        this.#games.set(code, game);
        return game;
    }
    getGame(code){ return this.#games.get(code); }
    deleteGame(code) { return this.#games.delete(code); }
    #generateUniqueCode(){
        let code = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        for (let i = 0; i < 5; i++) { code += characters[Math.floor(Math.random() * characters.length)]; }
        while (this.#games.has(code)) { code = ''; this.#generateUniqueCode(); }
        return code;
    }
}