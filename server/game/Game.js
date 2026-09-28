const PHASES = {
    'pre-game': 'PRE GAME',
    'live-game': 'LIVE GAME',
    'end-game': 'END GAME'
}

export default class Game {
    constructor(hostId, roomCode, roomPlayers, gameDuration){
        this.id = crypto.randomUUID();
        this.hostId = hostId;
        this.roomCode = roomCode;
        this.roomPlayers = roomPlayers;
        this.gameDuration = gameDuration; // seconds
        this.phase = PHASES['pre-game'];
    }
    isHost(player) { return this.hostId === player.id; }
    getHostId() { return this.hostId; }
    getPlayers() { return this.roomPlayers; }
    getRoomCode() { return this.roomCode; }
    getPhase() { return this.phase; }
    setPhase(ph) { this.phase = PHASES[ph]; }
    getDuration() { return this.gameDuration; }
}