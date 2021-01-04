import { GamePlayer } from './game/enums'
import * as utils from './utils'

enum ColorCode {
    Empty = 0,
    Yellow = 1,
    Red = 2
};

class ImageDataProcessor {
    private _colorPlayerMapping: Map<ColorCode, GamePlayer> = new Map();
    private _players: Map<number, GamePlayer> = new Map();

    constructor(players: Map<number, GamePlayer>) {
        this._players = players;
    }

    public initColorMapping(grid: Array<Array<ColorCode>>, currentPlayer: GamePlayer) {
        const flatGrid: Array<number> = utils.getArrayFrom2DMatrix(grid);
        // check if there is only one stone
        const numberOfStones: number = flatGrid.reduce((acc, curr) => curr !== ColorCode.Empty ? acc++ : acc, 0);
        if (numberOfStones == 1) {
            const colorOfFirstPlayer: ColorCode = flatGrid.filter(stone => stone !== ColorCode.Empty)[0];
            this._colorPlayerMapping.set(colorOfFirstPlayer, currentPlayer);
            this._colorPlayerMapping.set(colorOfFirstPlayer == ColorCode.Yellow ? ColorCode.Red : ColorCode.Yellow, 
                currentPlayer == GamePlayer.KI ? GamePlayer.Human : GamePlayer.KI);

        } else {
            console.log('Invalid number of stones');
        }
    }

    public colorToGameGrid(colorGrid: Array<Array<ColorCode>>): Array<Array<GamePlayer>> {
        return utils.getMatrixFromArray(utils.getArrayFrom2DMatrix(colorGrid).map(colorOfStone => 
            utils.getKeyFromValue(this._colorPlayerMapping.get(colorOfStone), this._players)
        ), 7);
    }
};

export default ImageDataProcessor;

export {
    ColorCode
};