export default class ServerNetworkMessage {
    type: number;
    size: number;
    payload: Uint8Array;

    constructor(type: number, payload: Array<number> = []) {
        this.type = type;
        this.size = payload.length;
        this.payload = Uint8Array.from(payload);
    }

    public getMessage(): Buffer{
        const headerSize: number = 2;
        const header = new Uint8Array(headerSize);
        header[0] = this.type;
        header[1] = this.size;

        const networkMessage = new Uint8Array(headerSize + this.size);
        networkMessage.set(header);
        networkMessage.set(this.payload, headerSize);

        return Buffer.from(networkMessage);
    }
}