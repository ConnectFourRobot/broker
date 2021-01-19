import { GamePlayer } from './game/enums'
import * as utils from './utils'

enum ColorCode {
    Empty = 0,
    Yellow = 1,
    Red = 2
};

class StoneProperties {
    private readonly _color: ColorCode;
    private readonly _index: number;

    constructor(color: ColorCode, index: number) {
        this._color = color;
        this._index = index;
    }

    public get Color(): ColorCode {
        return this._color;
    }

    public get Index(): number {
        return this._index;
    }
}

class ImageDataProcessor {
    private _colorPlayerMapping: Map<ColorCode, GamePlayer> = new Map();
    private _players: Map<number, GamePlayer> = new Map();
    private _currentColorGrid: Array<ColorCode>;
    private _height: number;
    private _width: number;
    private _tempGrid: Array<number>; 

    constructor(players: Map<number, GamePlayer>, height, width) {
        this._players = players;
        this._height = height;
        this._width = width;
        this._currentColorGrid = new Array(height * width).fill(ColorCode.Empty);
        this._tempGrid = new Array(width*height).fill(ColorCode.Empty);
    }

    private initColorMapping(colorGrid: Array<ColorCode>, currentPlayer: GamePlayer): void {
        const colorOfFirstPlayer: ColorCode = colorGrid.filter((stone, index) => stone !== ColorCode.Empty && this._tempGrid[index] === ColorCode.Empty)[0];
        console.log("colorOfFirstPlayer: " + colorOfFirstPlayer);
        this._colorPlayerMapping.set(colorOfFirstPlayer, currentPlayer);
        this._colorPlayerMapping.set(colorOfFirstPlayer == ColorCode.Yellow ? ColorCode.Red : ColorCode.Yellow, 
            currentPlayer == GamePlayer.KI ? GamePlayer.Human : GamePlayer.KI);
        
        // update oldgrid
        if(this.getAmountMovesFromGrid(this._tempGrid) > 0) {
            this._tempGrid.forEach((value, index) => {
                if (value !== 0) {
                    console.log("Found temp index: " + index);
                    this._currentColorGrid[index] = utils.getKeyFromValue(value, this._colorPlayerMapping);
                }
            });
        }
    }

    public colorToGameGrid(colorGrid: Array<ColorCode>): Array<Array<GamePlayer>> {
        return utils.getMatrixFromArray(colorGrid.map(colorOfStone => 
            utils.getKeyFromValue(this._colorPlayerMapping.get(colorOfStone), this._players)
        ), 7);
    }

    public isColorGridValid(colorGrid: Array<ColorCode>, currentPlayer: GamePlayer | undefined): boolean {
        if (currentPlayer === undefined) {
            return false;
        }

        console.log("oldgrid");
        console.log(this._currentColorGrid);

        console.log("new grid");
        console.log(colorGrid);

        // check if this is the first move
        const amountMovesOldGrid: number = this.getAmountMovesFromGrid(this._currentColorGrid);
        const amountMovesNewGrid : number = this.getAmountMovesFromGrid(colorGrid);

        console.log(amountMovesOldGrid);
        console.log(amountMovesNewGrid);

        // corner case first move
        if (this._colorPlayerMapping.size === 0) {
            // color mapping is not initialized
            if (amountMovesOldGrid === 0) {
                if(this.getAmountMovesFromGrid(this._tempGrid) !== 0) {
                    // robot has started
                    if (amountMovesNewGrid == 2) {
                        this.initColorMapping(colorGrid, currentPlayer);
                    } else {
                        console.log("Amount of moves in new grid not correct. Should be 2");
                        return false;
                    }

                } else {
                    // human has started
                    if (amountMovesNewGrid == 1) {
                        this.initColorMapping(colorGrid, currentPlayer);
                    } else {
                        console.log("Amount of moves in new grid not correct. Should be 1");
                        return false;
                    }
                }
            } else {
                console.log("Amount of prev moves too high");
                return false;
            }
        }

        // check if amount of stones is valid
        if (amountMovesOldGrid + 1 != amountMovesNewGrid) {
            console.log("amount of moves are invalid");
            return false;
        }

        // check if new stone has right color
        const stoneProperty: StoneProperties | boolean = this.getNewStoneProperties(colorGrid);
        if (typeof stoneProperty !== 'boolean') {
            console.log("property of found stone");
            console.log(stoneProperty);
            if (stoneProperty.Color !== utils.getKeyFromValue(currentPlayer, this._colorPlayerMapping)) {
                console.log("new stone don't matches color");
                return false;
            }
        } else {
            // no new stone was found
            console.log("no new stone was found");
            return false;
        }

        // check if there are no "floating" stones
        if (this.areStonesFloating(colorGrid)) {
            console.log("floating stones detected");
            return false;
        }

        // check if new grid could be created from the old grid
        if (!this.compareNewToOldGrid(colorGrid)){
            console.log("Grid does not match the old grid");
            return false;
        }

        return true;
    }

    public updateColorGrid(move: number, player: GamePlayer | undefined): void {
        if (player === undefined) {
            return;
        }
        for (let i = (this._height - 1); i >= 0; i--){
            if(this._colorPlayerMapping.size == 0) {
                this._tempGrid[i*this._width + move] = player;
                break;
            }
            if(this._currentColorGrid[i*this._width + move] === ColorCode.Empty) {
                this._currentColorGrid[i*this._width + move] = utils.getKeyFromValue(player, this._colorPlayerMapping);
                break;
            }
        }
    }

    private compareNewToOldGrid(newColorGrid: Array<ColorCode>): boolean {
        let foundNewOne = false;
        return this._currentColorGrid.every((value: ColorCode, index: number) => {
            if (!foundNewOne && value !== newColorGrid[index]) {
                foundNewOne = true;
                return true;
            }
            return value === newColorGrid[index];
        });
    }

    private getAmountMovesFromGrid(colorGrid: Array<ColorCode>): number {
        return colorGrid.reduce((acc, curr) => curr !== ColorCode.Empty ? acc+1 : acc, 0);
    }

    private areStonesFloating(colorGrid: Array<ColorCode>): boolean {
        return !colorGrid.every((value, index) => {
            if(value !== ColorCode.Empty) {
                // check if stone is already in bottom row
                if (!(index + this._width >= (this._width * this._height))) {
                    return (colorGrid[index + this._width] !== ColorCode.Empty);
                }
            }
            return true;
        });
    }

    private getNewStoneProperties(newColorGrid: Array<ColorCode>): StoneProperties | boolean{
        let tempColor: ColorCode = ColorCode.Empty;
        let tempIndex: number = 0;
        const newStoneFound: boolean = this._currentColorGrid.some((value: ColorCode, index: number) => {
            if (value === ColorCode.Empty && value !== newColorGrid[index]) {
                tempColor = newColorGrid[index];
                tempIndex = index;
                return true;
            }
        });
        return newStoneFound ? new StoneProperties(tempColor, tempIndex) : newStoneFound;
    }
};

export default ImageDataProcessor;

export {
    ColorCode
};