export default class Room {
    constructor(roomCode){
        this.id = crypto.randomUUID();
        this.roomCode = roomCode;
        this.roomPlayers = [];
        this.hostId = null;
        this.linkedGameId = null;
    }
    getCode() { return this.roomCode; }
    getHostId() { return this.hostId; }
    getPlayerCount() { return this.roomPlayers.length; }
    getPlayers() { return this.roomPlayers; }
    setLinkedGame(gameId) { this.linkedGameId = gameId; }
    isHost(playerId) { return this.hostId === playerId; }
    setHost(playerId) { this.hostId = playerId; }

}