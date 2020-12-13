import { GameSequence, GameDifficulty, GamePlayer } from './enums'

export default class Game {

    public map: Array<Array<number>>;
    public width: number;
    public height: number;
    public sequence: GameSequence = GameSequence.Random;
    public difficulty: GameDifficulty = GameDifficulty.Normal;
    
    public currentPlayer: number = 1;
    public players: Map<number, GamePlayer> = new Map();

    public dispenserCapacity: number;
    public dispenserCurrentStorage: number;

    public isRunning: boolean = false;

    constructor(width: number, height: number, dispenserCapacity: number, sequence: GameSequence, difficulty: GameDifficulty) {
        this.map = new Array(height).fill(0).map(() => new Array(width).fill(0));
        this.width = width;
        this.height = height;

        this.dispenserCapacity = dispenserCapacity;
        this.dispenserCurrentStorage = this.dispenserCapacity;
        this.difficulty = difficulty;

        switch (sequence) {
            case GameSequence.Human:
                this.players.set(1, GamePlayer.Human)
                            .set(2, GamePlayer.KI);
                break;
            case GameSequence.KI:
                this.players.set(1, GamePlayer.KI)
                            .set(2, GamePlayer.Human);
                break;
            default:
                const randomStarter: number = Math.round(Math.random()) + 1;
                const counterStarter: number = (randomStarter % 2) + 1;

                this.players.set(randomStarter, GamePlayer.KI)
                            .set(counterStarter, GamePlayer.Human);
                break;
        }
    }

    public nextPlayer(): void {
        this.currentPlayer = (this.currentPlayer % 2) + 1;
    }

    public getValidMoves(map: Array<Array<number>>): Array<number> {
        const moves: Array<number> = [];
        map[0].forEach((cell, index) => {
            if (cell === 0) {
                moves.push(index);
            }
        });
        return moves;
    }

    public isMoveValid(x: number, map: Array<Array<number>>): number | undefined {
        return this.getValidMoves(map).find(element => element === x);
    }

    public move(x: number, playerNumber: number) {
        for (let i = (this.height - 1); i >= 0; i--){
            if (this.map[i][x] === 0) {
                this.map[i][x] = playerNumber;
                break;
            }
        }
    }

    public getMoveFromGrid(map: Array<Array<number>>): number {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.map[y][x] !== map[y][x]) {
                    if (this.isMoveValid(x, this.map)) {
                        return x;
                    }
                }
            }
        }
        return -1;
    }

    public checkForWin(player: number): boolean {
        // horizontalCheck 
        for (let j = 0; j<this.height-3 ; j++ ){
            for (let i = 0; i<this.width; i++){
                if (this.map[j][i] == player && this.map[j+1][i] == player && this.map[j+2][i] == player && this.map[j+3][i] == player){
                    return true;
                }           
            }
        }
        // verticalCheck
        for (let i = 0; i<this.width-3 ; i++ ){
            for (let j = 0; j<this.height; j++){
                if (this.map[j][i] == player && this.map[j][i+1] == player && this.map[j][i+2] == player && this.map[j][i+3] == player){
                    return true;
                }           
            }
        }
        // ascendingDiagonalCheck 
        for (let i=3; i<this.width; i++){
            for (let j=0; j<this.height-3; j++){
                if (this.map[j][i] == player && this.map[j+1][i-1] == player && this.map[j+2][i-2] == player && this.map[j+3][i-3] == player)
                    return true;
            }
        }
        // descendingDiagonalCheck
        for (let i=3; i<this.width; i++){
            for (let j=3; j<this.height; j++){
                if (this.map[j][i] == player && this.map[j-1][i-1] == player && this.map[j-2][i-2] == player && this.map[j-3][i-3] == player)
                    return true;
            }
        }
        return false;
    }
};