import { Transform } from 'stream'

export default class VgrParser extends Transform {

    private _buffer = Buffer.alloc(0);
    private _position: number;

    private _type;
    private _size;
    private _payload;

    private readonly _headerSize = 2;

    constructor() {
        super();
        this._position = 0;
    }

    _transform(chunk, encoding, callback){
        let cursor: number = 0;
        if (this._type == undefined) {
            this._type = chunk[cursor];
            cursor++;
        }
        if (this._type != undefined && this._size == undefined && cursor < chunk.length) {
            this._size = chunk[cursor];
            this._payload = Buffer.alloc(this._size);
            cursor++;
        }
        if (this._type != undefined && this._size !== undefined && this._size === 0) {
            const header: Uint8Array = new Uint8Array(this._headerSize);
            header[0] = this._type;
            header[1] = this._size;
            this._buffer = Buffer.from(header);

            this.push(this._buffer);
            this._buffer = Buffer.alloc(0);
            this._position = 0;
            this._type = null;
            this._size = null;
            this._payload = null;
        }
        if (this._type != undefined && this._size != undefined && cursor < chunk.length) {
            while (cursor < chunk.length) {
                this._payload[this._position] = chunk[cursor];
                cursor++;
                this._position++;
                if (this._position === this._size) {
                    const header: Uint8Array = new Uint8Array(this._headerSize);
                    header[0] = this._type;
                    header[1] = this._size;

                    const wholeMessage: Uint8Array = new Uint8Array(this._size + this._headerSize);
                    wholeMessage.set(header);
                    wholeMessage.set(this._payload, this._headerSize);

                    this._buffer = Buffer.from(wholeMessage);

                    this.push(this._buffer);
                    this._buffer = Buffer.alloc(0);
                    this._position = 0;
                    this._type = null;
                    this._size = null;
                    this._payload = null;
                }
            }
        }
        callback();
    }

    _flush(callback) {
        if (this._position < 1) {
            if (this._type != undefined && this._size == undefined) {
                const typeBuffer: Uint8Array = new Uint8Array(1);
                typeBuffer[0] = this._type;
                this.push(Buffer.from(typeBuffer));
                this._buffer = Buffer.alloc(0);
                callback();
                return;
            }
            if (this._type != undefined && this._size != undefined) {
                const headerBuffer: Uint8Array = new Uint8Array(this._headerSize);
                headerBuffer[0] = this._type;
                headerBuffer[1] = this._size;
                this.push(Buffer.from(headerBuffer));
                this._buffer = Buffer.alloc(0);
                callback();
                return;
            } 
        } else {
            const currentPayload: Uint8Array = new Uint8Array(this._headerSize + this._position);
            currentPayload[0] = this._type;
            currentPayload[1] = this._size;
            currentPayload.set(Buffer.from(this._payload).slice(0, this._position), this._headerSize);
            this.push(Buffer.from(currentPayload));
            this._payload = Buffer.alloc(0);
            this._buffer = Buffer.alloc(0);
            callback();
        }
    }
}