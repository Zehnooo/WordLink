const PHASES = {
    'pre-game': 'PRE GAME',
    'live-game': 'LIVE GAME',
    'end-game': 'END GAME'
}

export default class Game {
    constructor(roomPlayers, gameDuration){
        this.id = crypto.randomUUID();
        this.roomPlayers = roomPlayers;
        this.gameDuration = gameDuration; // seconds
        this.phase = PHASES['pre-game'];
    }
    getPlayers() { return this.roomPlayers; }
    getPhase() { return this.phase; }
    setPhase(ph) { this.phase = PHASES[ph]; }
    getDuration() { return this.gameDuration; }
}