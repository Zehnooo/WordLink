import GameManager from '../server/game/GameManager.js';
import RoomManager from '../server/room/RoomManager.js';

import { randomUUID } from 'node:crypto';

class Player {
    constructor(username, list = []){
        this.id = randomUUID();
        this.username = username;
        this.list = list;
    }
}

const bob = new Player('Bobbert', ['Hot', 'Dog', 'Water', 'Bottle', 'Brush']);
const jim = new Player('Jimothy', ['Dinner', 'Party', 'Animal', 'Crossing', 'Guard']);
const jeff = new Player('Jeffon', ['Ice', 'Cream', 'Cheese', 'Cake', 'Walk']);


/*
const gm = new GameManager();
const game1 = gm.createGame(players, 120);
 */

const rm = new RoomManager();
const gm = new GameManager();

const activeRooms = {};
for (let i = 0; i < 5; i++){ activeRooms[i] = rm.createRoom(); }
const room1 = activeRooms[0];

rm.joinRoom(room1.roomCode, bob);
rm.joinRoom(room1.roomCode, jim);

const game1 = gm.createGame(room1.id, room1.getPlayers(), 120);

setTimeout(() => {
    const attemptStart = game1.startGame();
    console.log(attemptStart);
    console.log('first game', game1);
}, 3000);


setTimeout(() => {
    const attemptEnd = game1.endGame();
    console.log(attemptEnd);
    console.log('first game', game1);
}, 6000);

