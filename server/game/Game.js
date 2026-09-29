const PHASES = Object.freeze({
    PRE_GAME: 'pre-game',
    LIVE_GAME: 'live-game',
    END_GAME: 'end-game'
});

export default class Game {
    constructor(roomId, roomPlayers, gameDuration){
        this.id = crypto.randomUUID();
        this.roomId = roomId;
        this.createdAt = Date.now();
        this.startedAt = null;
        this.endedAt = null;
        this.roomPlayers = roomPlayers;
        this.gameDuration = gameDuration; // seconds
        this.phase = PHASES.PRE_GAME;
        this.stamps = {
            [PHASES.PRE_GAME]: { start: this.createdAt, },
            [PHASES.LIVE_GAME]: {},
            [PHASES.END_GAME]: {}
        }
    }
    startGame() {
        if (this.phase !== PHASES.PRE_GAME) { return { success: false, message: `Cannot start a game from phase ${this.phase}` }; }
        const now = Date.now();
        this.phase = PHASES.LIVE_GAME;
        this.startedAt = now;
        this.stamps[PHASES.PRE_GAME].complete = now;
        this.stamps[PHASES.LIVE_GAME].start = now;
        return { success: true, message: `Started Game: ${this.id}.` };
    }
    endGame(){
        if (this.phase !== PHASES.LIVE_GAME) { return { success: false, message: `Cannot end a game from phase ${this.phase}` }; }
        const now = Date.now();
        this.phase = PHASES.END_GAME;
        this.endedAt = now;
        this.stamps[PHASES.LIVE_GAME].complete = now;
        this.stamps[PHASES.END_GAME].start = now;
        return { success: true, message: `Ended Game: ${this.id}.` };
    }
    getPlayers() { return this.roomPlayers; }
    getPhase() { return this.phase; }
    getDuration() { return this.gameDuration; }
}