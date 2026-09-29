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

const rm = new RoomManager();
const gm = new GameManager();

const room1 = rm.createRoom();

const b = rm.joinRoom(room1.roomCode, bob);
const b1 = rm.joinRoom(room1.roomCode, bob);
const ji = rm.joinRoom(room1.roomCode, jim);
room1.close();
const je = rm.joinRoom(room1.roomCode, jeff);
console.log('joins', b, b1, ji, je);

rm.leaveRoom(room1.roomCode, bob);
rm.leaveRoom(room1.roomCode, bob);

console.log(room1);
const game1 = gm.createGame(room1.id, room1.getPlayers(), 120);



