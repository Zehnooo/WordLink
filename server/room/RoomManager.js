import Room from './Room.js';

export default class RoomManager {
    #rooms = new Map();

    createRoom(){
        const code = this.#generateUniqueCode();
        const room = new Room(code);
        this.#rooms.set(code, room);
        return room;
    }
    joinRoom(code, player) {
        const r = this.getRoom(code);
        if (!r.success) { return { success: false, message: r.message } }
        const room = r.room;
        if (room.roomPlayers.some(p => p.id === player.id) ) { return { success: false, message: `Error: Player has already joined room ${room.id}` } }
        switch(room.getPlayerCount()){
            case 2: return { success: false, message: `Error: Room is full.` };
            case 1: room.roomPlayers.push(player); break;
            case 0: room.setHost(player.id); room.roomPlayers.push(player); break;
        }
        return { success: true, message: `Success: Joined room ${room.id}`, room }
    }
    leaveRoom(code, player){
        let newHost;
        const r = this.getRoom(code);
        if (!r.success) { return { success: false, message: r.message }; }
        const room = r.room;
        const rp = room.roomPlayers.indexOf(room.roomPlayers.find(p => p.id === player.id));
        if (rp === -1) { return { success: false, message: `Can't find player ${player.id} in room ${room.id}` }; }
        const removedIndex = room.removePlayer(player.id);
        if (room.isHost(player.id) === true) {
            newHost = room.roomPlayers[removedIndex === 0 ? 1 : 0];
            newHost === undefined ? room.setHost(null) : room.setHost(newHost.id);
        }
        return { success: true, message: `Player left room ${room.id}.`, newHost: newHost ?? null }
    }
    getRoom(code){
        const room = this.#rooms.get(code);
        if (!room) { return { success: false, message: `Error: Room not found with code ${code}.` }; }
        return { success: true, message: `Success: Room found with ${code}`, room }
    }

    #generateUniqueCode(){
        let code = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        for (let i = 0; i < 5; i++) { code += characters[Math.floor(Math.random() * characters.length)]; }
        while (this.#rooms.has(code)) { code = ''; this.#generateUniqueCode(); }
        return code;
    }
}