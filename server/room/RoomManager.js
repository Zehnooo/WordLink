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
        if (!room.isOpen) { return { success: false, message: `Error: Room ${room.id} is not open.` }; }
        if (room.getPlayers().some(p => p.id === player.id) ) { return { success: false, message: `Error: Player has already joined room ${room.id}` } }
        switch(room.getPlayerCount()){
            case 2: return { success: false, message: `Error: Room is full.` };
            case 1: room.addPlayer(player); break;
            case 0: room.setHost(player.id); room.addPlayer(player); break;
        }
        return { success: true, message: `Success: Joined room ${room.id}`, room }
    }
    leaveRoom(code, player){
        let newHost;
        const r = this.getRoom(code);
        if (!r.success) { return { success: false, message: r.message }; }
        const room = r.room;

        const removedIdx = room.removePlayer(player.id);
        if (removedIdx === -1) { return { success: false, message: `Could not find Player ${player.username} in Room ${code}.` }; }
        if (room.isHost(player.id) === true) {
            newHost = room.getPlayers()[0];
            newHost === undefined ? room.setHost(null) : room.setHost(newHost.id);
        }
        return { success: true, message: `Player ${player.username} left room ${room.id}.`, newHost: newHost?.username ?? null }
    }
    getRoom(code){
        const room = this.#rooms.get(code);
        if (!room) { return { success: false, message: `Error: Room not found with code ${code}.` }; }
        return { success: true, message: `Success: Room found with ${code}`, room }
    }

    #generateUniqueCode(){
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        do {
            code = '';
            for (let i = 0; i < 5; i++) {
                code += chars[Math.floor(Math.random() * chars.length)];
            }
        }
        while (this.#rooms.has(code));
        return code;
    }
}