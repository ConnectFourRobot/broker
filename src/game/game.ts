import { GameSequence, GameDifficulty, GamePlayer } from './enums'

export default class Game {

    private _amountOfMovesMade: number = 0;
    private _isRunning: boolean = false;

    public map: Array<Array<number>>;
    public width: number;
    public height: number;
    public sequence: GameSequence = GameSequence.Random;
    public difficulty: GameDifficulty = GameDifficulty.Normal;
    
    public currentPlayer: number = 1;
    public players: Map<number, GamePlayer> = new Map();

    public dispenserCapacity: number;
    public dispenserCurrentStorage: number;

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

    get amountOfMovesMade(): number {
        return this._amountOfMovesMade;
    }

    get isRunning(): boolean {
        return this._isRunning;
    }

    set isRunning(value: boolean) {
        if (value) {
            // start a game
            this._isRunning = true;
            this._amountOfMovesMade = 0;
        }
        this._isRunning = value;
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
                this._amountOfMovesMade++;
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
        // verticalCheck 
        for (let y = 0; y<this.height-3; y++){
            for (let x = 0; x<this.width; x++){
                if (this.map[y][x] == player && this.map[y+1][x] == player && this.map[y+2][x] == player && this.map[y+3][x] == player){
                    return true;
                }           
            }
        }
        // horizontalCheck
        for (let x = 0; x<this.width-3 ; x++){
            for (let y = 0; y<this.height; y++){
                if (this.map[y][x] == player && this.map[y][x+1] == player && this.map[y][x+2] == player && this.map[y][x+3] == player){
                    return true;
                }           
            }
        }
        // descendingDiagonalCheck
        for (let x=3; x<this.width; x++){
            for (let y=0; y<this.height-3; y++){
                if (this.map[y][x] == player && this.map[y+1][x-1] == player && this.map[y+2][x-2] == player && this.map[y+3][x-3] == player)
                    return true;
            }
        }
        // ascendingDiagonalCheck
        for (let x=3; x<this.width; x++){
            for (let y=3; y<this.height; y++){
                if (this.map[y][x] == player && this.map[y-1][x-1] == player && this.map[y-2][x-2] == player && this.map[y-3][x-3] == player)
                    return true;
            }
        }
        return false;
    }
};