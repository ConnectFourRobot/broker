export default class ClientNetworkMessage {
    type: number;
    size: number;
    payload: Array<number>;

    constructor(message) {
        this.type = message[0];
        this.size = message[1];
        this.payload = [];
        if(this.size > 0) {
            this.payload = [...message.slice(2, 2 + this.size)]
        }
    }
}