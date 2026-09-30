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

rm.joinRoom(room1.code, bob);
rm.joinRoom(room1.code, jim);

const game1 = gm.createGame(room1.id, room1.getPlayers(), 120);
room1.setLinkedGame(game1.id);

console.log(room1);
console.log(game1);

setTimeout(() => {
    game1.startGame();
}, 2000);

setTimeout(() => {
    game1.endGame();
    console.log('End', game1);
}, 2000);


