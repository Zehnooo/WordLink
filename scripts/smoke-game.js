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
const tim = new Player('timon', ['Blender', 'Bottle', 'Rocket', 'Power', 'Switch']);

const rm = new RoomManager();
const gm = new GameManager();

const room1 = rm.createRoom();
const room2 = rm.createRoom();

const b = rm.joinRoom(room1.code, bob);
const b1 = rm.joinRoom(room1.code, bob);
const ji = rm.joinRoom(room1.code, jim);

const je = rm.joinRoom(room2.code, jeff);
const ti = rm.joinRoom(room2.code, tim);
console.log('joins room 1', {b, b1, ji});
console.log('joins room 2', {je, ti});

const b2 = rm.leaveRoom(room1.code, bob);
const b3 = rm.leaveRoom(room1.code, bob);
const j1 = rm.leaveRoom(room2.code, jeff);
const t2 = rm.leaveRoom(room2.code, tim);
console.log('leaves room1', {b2, b3});
console.log('leaves room2', {j1, t2});
const game1 = gm.createGame(room1.id, room1.getPlayers(), 120);



