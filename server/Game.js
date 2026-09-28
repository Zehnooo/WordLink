const PHASES = {
    'pre-game': 'PRE GAME',
    'live-game': 'LIVE GAME',
    'end-game': 'END GAME'
}

export default class Game {
    constructor(hostId, roomCode, roomPlayers, mockGame = false){
        this.id = crypto.randomUUID();
        this.hostId = hostId;
        this.roomCode = roomCode;
        this.roomPlayers = roomPlayers;
        this.playerLists = roomPlayers.lists;
        this.mockGame = mockGame;
        this.phase = PHASES['pre-game'];

    }

}