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

    constructor(players: Map<number, GamePlayer>, height, width) {
        this._players = players;
        this._height = height;
        this._width = width;
        this._currentColorGrid = new Array(height * width).fill(ColorCode.Empty);
    }

    private initColorMapping(colorGrid: Array<ColorCode>, currentPlayer: GamePlayer): void {
        const colorOfFirstPlayer: ColorCode = colorGrid.filter(stone => stone !== ColorCode.Empty)[0];
        this._colorPlayerMapping.set(colorOfFirstPlayer, currentPlayer);
        this._colorPlayerMapping.set(colorOfFirstPlayer == ColorCode.Yellow ? ColorCode.Red : ColorCode.Yellow, 
            currentPlayer == GamePlayer.KI ? GamePlayer.Human : GamePlayer.KI);
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

        // check if this is the first move
        const amountMovesOldGrid: number = this.getAmountMovesFromGrid(this._currentColorGrid);
        const amountMovesNewGrid : number = this.getAmountMovesFromGrid(colorGrid);

        // corner case first move
        if (amountMovesOldGrid == 0) {
            if(amountMovesNewGrid == 1) {
                this.initColorMapping(colorGrid, currentPlayer);
            } else {
                return false;
            }
        }

        // check if amount of stones is valid
        if (amountMovesOldGrid + 1 != amountMovesNewGrid) {
            return false;
        }

        // check if new stone has right color
        const stoneProperty: StoneProperties | boolean = this.getNewStoneProperties(colorGrid);
        if (typeof stoneProperty !== 'boolean') {
            if (stoneProperty.Color !== utils.getKeyFromValue(currentPlayer, this._colorPlayerMapping)) {
                return false;
            }
        } else {
            // no new stone was found
            return false;
        }

        // check if there are no "floating" stones
        if (this.areStonesFloating(colorGrid)) {
            return false;
        }
        return true;
    }

    private getAmountMovesFromGrid(colorGrid: Array<ColorCode>): number {
        return colorGrid.reduce((acc, curr) => curr !== ColorCode.Empty ? acc++ : acc, 0);
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
        const newStoneFound: boolean = this._currentColorGrid.some((value: number, index: number) => {
            if (value === ColorCode.Empty && value !== newColorGrid[index]) {
                tempColor = value;
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