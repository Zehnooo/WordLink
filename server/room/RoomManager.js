import Room from './Room.js';

export default class RoomManager {
    #rooms = new Map();

    createRoom(){
        const code = this.#generateUniqueCode();
        const room = new Room(code);
        this.#rooms.set(code, room)
    }

    #generateUniqueCode(){
        let code = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        for (let i = 0; i < 5; i++) { code += characters[Math.floor(Math.random() * characters.length)]; }
        while (this.#rooms.has(code)) { code = ''; this.#generateUniqueCode(); }
        return code;
    }
}