import { NetworkClient } from './com/network/enums'
import ClientNetworkMessage from './com/clientNetworkMessage'
import ServerNetworkMessage from './com/serverNetworkMessage'
import { getKeyFromValue } from './utils'
import { SerialMessageType } from './com/serial/enums'

import net from 'net'
import configIni from 'config.ini'
import SerialPort from 'serialport'

export default class GameHandler {
    
    private _tcpConnections: Map<NetworkClient, net.Socket>;
    private _config: any;
    private _server: net.Server;
    private _serialPort: any;

    constructor(config: string) {
        this._config = configIni.load(config).Default;
        this._server = net.createServer();
        this._serialPort = new SerialPort(this._config.serialPort, {
            baudRate: this._config.baudRate,
            autoOpen: true
        });
        
        this._tcpConnections = new Map<NetworkClient, net.Socket>();
    }

    public run(): void {
        this._server.listen(this._config.port, this._config.bindingAddress, () => {
            console.log('VGR-Broker is running...');
            // tell the arduino that we are ready
            this._serialPort.write(new ServerNetworkMessage(SerialMessageType.Ready).getMessage())
        });
        
        this._server.on('connection', client => {
            console.log('Someone has connected');
            client.on('data', data => {
                // get NetworkMessageType
                const message = new ClientNetworkMessage(data);
                // check if it is a registration message
                if (message.type == 0) {
                    console.log('Registration Type');
                    this._tcpConnections.set(message.payload[0], client);
                }
                
                this.handleIncomingTcpData(message, getKeyFromValue(client, this._tcpConnections));
            });
        });
        
        this._serialPort.on('data', data => {
            this.handleIncomingSerialData(new ClientNetworkMessage(data));
        });
    }

    private handleIncomingSerialData(message) {
        switch (message.type) {
            case SerialMessageType.StartGame:
                
                break;
        
            default:
                break;
        }
    }
    
    private handleIncomingTcpData(message, client: NetworkClient) {
        console.log('Data from: ' + client);
    }
}