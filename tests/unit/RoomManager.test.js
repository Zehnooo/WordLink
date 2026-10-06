import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import RoomManager from '../../server/room/RoomManager.js';
import Room from '../../server/room/Room.js';
import players from '../fixtures/players.js';

const CODE_PATTERN = /^[A-Z0-9]{5}$/;

function assertFailure(result) {
    assert.equal(typeof result, 'object');
    assert.notEqual(result, null);
    assert.equal(result.success, false);
    assert.equal(typeof result.message, 'string');
    assert.ok(result.message.length > 0);
}

function seat(manager, ...members) {
    const room = manager.createRoom();
    for (const player of members) {
        const result = manager.joinRoom(room.code, player);
        assert.equal(result.success, true);
    }
    return room;
}

describe('RoomManager', () => {
    describe('room creation', () => {
        test('createRoom returns an open empty room with an id, a five-character code, no host, and no linked game', () => {
            const manager = new RoomManager();
            const room = manager.createRoom();

            assert.ok(room instanceof Room);
            assert.equal(typeof room.id, 'string');
            assert.ok(room.id.length > 0);
            assert.match(room.code, CODE_PATTERN);
            assert.equal(room.getCode(), room.code);
            assert.equal(room.isOpen, true);
            assert.equal(room.closedAt, null);
            assert.equal(room.getPlayerCount(), 0);
            assert.deepEqual(room.getPlayers(), []);
            assert.equal(room.getHostId(), null);
            assert.equal(room.linkedGameId, null);
        });
    });

    describe('first join', () => {
        test('the first player joins, becomes host, and is the only member', () => {
            const manager = new RoomManager();
            const room = manager.createRoom();
            const result = manager.joinRoom(room.code, players.bob);

            assert.equal(result.success, true);
            assert.equal(typeof result.message, 'string');
            assert.equal(result.room, room);
            assert.equal(room.getPlayerCount(), 1);
            assert.equal(room.getHostId(), players.bob.id);
            assert.equal(room.isHost(players.bob.id), true);
            assert.deepEqual(room.getPlayers(), [players.bob]);
        });
    });

    describe('second join', () => {
        test('a different second player joins and the first player stays host', () => {
            const manager = new RoomManager();
            const room = manager.createRoom();
            manager.joinRoom(room.code, players.bob);
            const result = manager.joinRoom(room.code, players.alice);

            assert.equal(result.success, true);
            assert.equal(result.room, room);
            assert.equal(room.getPlayerCount(), 2);
            assert.equal(room.getHostId(), players.bob.id);
            assert.equal(room.isHost(players.bob.id), true);
            assert.equal(room.isHost(players.alice.id), false);
            assert.deepEqual(room.getPlayers(), [players.bob, players.alice]);
        });
    });

    describe('invalid joins', () => {
        test('the same player cannot join twice', () => {
            const manager = new RoomManager();
            const room = seat(manager, players.bob);
            const result = manager.joinRoom(room.code, players.bob);

            assertFailure(result);
            assert.equal(room.getPlayerCount(), 1);
            assert.equal(room.getHostId(), players.bob.id);
            assert.deepEqual(room.getPlayers(), [players.bob]);
        });

        test('a third player cannot join', () => {
            const manager = new RoomManager();
            const room = seat(manager, players.bob, players.alice);
            const result = manager.joinRoom(room.code, players.carol);

            assertFailure(result);
            assert.equal(room.getPlayerCount(), 2);
            assert.equal(room.getHostId(), players.bob.id);
            assert.deepEqual(room.getPlayers(), [players.bob, players.alice]);
        });

        test('an unknown room code is rejected', () => {
            const manager = new RoomManager();
            const result = manager.joinRoom('NOPE1', players.bob);

            assertFailure(result);
        });

        test('a closed room is rejected', () => {
            const manager = new RoomManager();
            const room = manager.createRoom();
            const closed = room.close();

            assert.equal(closed.success, true);
            assert.equal(room.isOpen, false);

            const result = manager.joinRoom(room.code, players.bob);

            assertFailure(result);
            assert.equal(room.getPlayerCount(), 0);
            assert.equal(room.getHostId(), null);
            assert.deepEqual(room.getPlayers(), []);
        });

        test('undefined player is rejected cleanly and does not throw', () => {
            const manager = new RoomManager();
            const room = manager.createRoom();
            const result = manager.joinRoom(room.code, undefined);

            assertFailure(result);
            assert.equal(room.getPlayerCount(), 0);
            assert.equal(room.getHostId(), null);
            assert.deepEqual(room.getPlayers(), []);
        });

        test('null player is rejected cleanly and does not throw', () => {
            const manager = new RoomManager();
            const room = manager.createRoom();
            const result = manager.joinRoom(room.code, null);

            assertFailure(result);
            assert.equal(room.getPlayerCount(), 0);
            assert.equal(room.getHostId(), null);
            assert.deepEqual(room.getPlayers(), []);
        });

        test('a player object without an id is rejected cleanly and does not throw', () => {
            const manager = new RoomManager();
            const room = manager.createRoom();
            const result = manager.joinRoom(room.code, {});

            assertFailure(result);
            assert.equal(room.getPlayerCount(), 0);
            assert.equal(room.getHostId(), null);
            assert.deepEqual(room.getPlayers(), []);
            assert.equal(room.linkedGameId, null);
            assert.equal(room.isOpen, true);
        });
    });

    describe('non-host leave', () => {
        test('Alice leaving leaves Bob as host in an open one-player room', () => {
            const manager = new RoomManager();
            const room = seat(manager, players.bob, players.alice);
            const result = manager.leaveRoom(room.code, players.alice);

            assert.equal(result.success, true);
            assert.equal(typeof result.message, 'string');
            assert.equal(room.isOpen, true);
            assert.equal(room.getPlayerCount(), 1);
            assert.equal(room.getHostId(), players.bob.id);
            assert.equal(room.isHost(players.bob.id), true);
            assert.deepEqual(room.getPlayers(), [players.bob]);
            assert.equal(room.linkedGameId, null);
        });

        test('after the second player leaves, another player can take the open seat', () => {
            const manager = new RoomManager();
            const room = seat(manager, players.bob, players.alice);
            const left = manager.leaveRoom(room.code, players.alice);
            assert.equal(left.success, true);

            const joined = manager.joinRoom(room.code, players.carol);

            assert.equal(joined.success, true);
            assert.equal(room.isOpen, true);
            assert.equal(room.getPlayerCount(), 2);
            assert.equal(room.getHostId(), players.bob.id);
            assert.deepEqual(room.getPlayers(), [players.bob, players.carol]);
        });
    });

    describe('host leave', () => {
        test('Bob leaving migrates host to Alice, who stays in the open room', () => {
            const manager = new RoomManager();
            const room = seat(manager, players.bob, players.alice);
            const result = manager.leaveRoom(room.code, players.bob);

            assert.equal(result.success, true);
            assert.equal(typeof result.message, 'string');
            assert.equal(result.newHost, players.alice.username);
            assert.equal(room.isOpen, true);
            assert.equal(room.closedAt, null);
            assert.equal(room.getPlayerCount(), 1);
            assert.deepEqual(room.getPlayers(), [players.alice]);
            assert.equal(room.getHostId(), players.alice.id);
            assert.equal(room.isHost(players.alice.id), true);
            assert.equal(room.isHost(players.bob.id), false);
            assert.equal(room.linkedGameId, null);
        });

        test('a second leave by the departed host does not change the migrated room', () => {
            const manager = new RoomManager();
            const room = seat(manager, players.bob, players.alice);
            const first = manager.leaveRoom(room.code, players.bob);
            assert.equal(first.success, true);

            const second = manager.leaveRoom(room.code, players.bob);

            assertFailure(second);
            assert.equal(room.isOpen, true);
            assert.equal(room.closedAt, null);
            assert.equal(room.getPlayerCount(), 1);
            assert.deepEqual(room.getPlayers(), [players.alice]);
            assert.equal(room.getHostId(), players.alice.id);
            assert.equal(room.isHost(players.alice.id), true);
        });
    });

    describe('missing player leave', () => {
        test('leaving with a player who is not in the room fails and membership stays the same', () => {
            const manager = new RoomManager();
            const room = seat(manager, players.bob, players.alice);
            const result = manager.leaveRoom(room.code, players.carol);

            assertFailure(result);
            assert.equal(room.isOpen, true);
            assert.equal(room.getPlayerCount(), 2);
            assert.equal(room.getHostId(), players.bob.id);
            assert.deepEqual(room.getPlayers(), [players.bob, players.alice]);
        });
    });
});
