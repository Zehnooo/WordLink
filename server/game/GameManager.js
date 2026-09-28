import Game from './Game.js';

export default class GameManager {
    #games = new Map();

    createGame(hostId, players = {},  gameDuration) {
        const game = new Game(hostId, players, gameDuration);
        this.#games.set(game.id, game);
        return game;
    }
    getGame(id){ return this.#games.get(id); }
    getGameList() { return this.#games; }
    deleteGame(id) { return this.#games.delete(id); }
}