import Game from './Game.js';

export default class GameManager {
    #games = new Map();

    createGame(roomId, players = [],  gameDuration) {
        if (players.length < 2) { return { success: false, message: 'Game requires two players.', game: null }; }
        const game = new Game(roomId, players, gameDuration);
        this.#games.set(game.id, game);
        return { success: true, message: `Game created ${game.id}`, game };
    }
    getGame(id){ return this.#games.get(id); }
    getGameList() { return [...this.#games.values()]; }
    deleteGame(id) { return this.#games.delete(id); }
}