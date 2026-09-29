export default class Room {
    #roomPlayers = [];
    constructor(code){
        this.id = crypto.randomUUID();
        this.createdAt = Date.now();
        this.closedAt = null;
        this.code = code;
        this.hostId = null;
        this.linkedGame = null;
        this.isOpen = true;
    }
    getCode() { return this.code; }
    getHostId() { return this.hostId; }
    getPlayerCount() { return this.#roomPlayers.length; }
    getPlayers() { return [...this.#roomPlayers]; }
    setLinkedGame(game) { this.linkedGame = game; }
    isHost(playerId) { return this.hostId === playerId; }
    setHost(playerId) { this.hostId = playerId; }
    addPlayer(player) { this.#roomPlayers.push(player); }
    removePlayer(playerId) {
        const idx = this.#roomPlayers.findIndex(p => p.id === playerId);
        if (idx === -1) return -1;
        this.#roomPlayers.splice(idx, 1);
        return idx;
    }
    close(){
        if (this.isOpen === false) { return { success: false, message: `Room ${this.id} is already closed` }; }
        this.closedAt = Date.now();
        this.isOpen = false;
        return { success: true, message: `Room ${this.id} has been closed.` };
    }
}