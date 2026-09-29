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
const roomA = rm.createRoom();
const attemptJoin = rm.joinRoom(roomA.roomCode, bob);
const attemptJoin2 = rm.joinRoom(roomA.roomCode, bob);

const attemptJoin4 = rm.joinRoom(roomA.roomCode, jeff);
const attemptLeave1 = rm.leaveRoom(roomA.roomCode, bob);



console.log('Leave 1', attemptLeave1);
