import GameManager from '../server/game/GameManager.js';
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

const players = {
    player1: bob,
    player2: jim
}

const gm = new GameManager();
const game1 = gm.createGame(players, 120);

