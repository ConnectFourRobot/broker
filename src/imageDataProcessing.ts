import { GamePlayer } from './game/enums'
import * as utils from './utils'

enum ColorCode {
    Empty = 0,
    Yellow = 1,
    Red = 2
};

class ImageDataProcessing {
    private _colorPlayerMapping: Map<ColorCode, GamePlayer> = new Map();
    private _players: Map<number, GamePlayer> = new Map();

    public initColorMapping(grid: Array<Array<number>>, currentPlayer: GamePlayer) {
        // const flatGrid: Array<number> = utils.
    }
};

export default ImageDataProcessing;

export {
    ColorCode
};