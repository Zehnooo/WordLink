export default class Room {
    constructor(roomCode){
        this.id = crypto.randomUUID();
        this.roomCode = roomCode;
        this.roomPlayers = {};
        this.hostId = null;
        this.linkedGameID = null;
    }
}