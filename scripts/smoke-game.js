import GameManager from '../server/game/GameManager.js';
import RoomManager from '../server/room/RoomManager.js';
import players from '../tests/fixtures/players.js';

const rm = new RoomManager();
const gm = new GameManager();

const room1 = rm.createRoom();

rm.joinRoom(room1.code, players.bob);
rm.joinRoom(room1.code, players.alice);

const res = gm.createGame(room1.id, room1.getPlayers(), 120);
const game = res.game;
room1.setLinkedGame(game.id);

game.start();
game.end();

console.log('Done', { room: room1, game: game });


