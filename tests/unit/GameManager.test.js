import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import GameManager from '../../server/game/GameManager.js';
import Game from '../../server/game/Game.js';
import players from '../fixtures/players.js';

const ROOM_ID = 'room-1';
const DURATION = 120;

describe('GameManager', () => {
    test('createGame stores a game keyed by id', () => {
        const manager = new GameManager();
        const roster = [players.bob, players.alice];
        const game = manager.createGame(ROOM_ID, roster, DURATION);

        assert.ok(game instanceof Game);
        assert.equal(game.roomId, ROOM_ID);
        assert.equal(game.getDuration(), DURATION);
        assert.equal(game.getPhase(), 'pre-game');
        assert.deepEqual(game.getPlayers(), roster);
        assert.equal(manager.getGame(game.id), game);
    });

    test('createGame defaults players to an empty list', () => {
        const manager = new GameManager();
        const game = manager.createGame(ROOM_ID);

        assert.deepEqual(game.getPlayers(), []);
        assert.equal(game.getDuration(), undefined);
    });

    test('createGame copies the player list', () => {
        const manager = new GameManager();
        const roster = [players.bob];
        const game = manager.createGame(ROOM_ID, roster, DURATION);

        roster.push(players.alice);
        assert.deepEqual(game.getPlayers(), [players.bob]);
    });

    test('getGame returns undefined for an unknown id', () => {
        const manager = new GameManager();
        assert.equal(manager.getGame('missing'), undefined);
    });

    test('getGameList returns every stored game', () => {
        const manager = new GameManager();
        const first = manager.createGame('room-a', [players.bob], 60);
        const second = manager.createGame('room-b', [players.alice, players.carol], 90);

        assert.deepEqual(manager.getGameList(), [first, second]);
    });

    test('deleteGame removes a stored game', () => {
        const manager = new GameManager();
        const game = manager.createGame(ROOM_ID, [players.bob], DURATION);

        assert.equal(manager.deleteGame(game.id), true);
        assert.equal(manager.getGame(game.id), undefined);
        assert.deepEqual(manager.getGameList(), []);
    });

    test('deleteGame returns false for an unknown id', () => {
        const manager = new GameManager();
        assert.equal(manager.deleteGame('missing'), false);
    });
});
