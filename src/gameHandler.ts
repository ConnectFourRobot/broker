import { NetworkClient, BrokerIAServiceMessageType, BrokerClientMessageType } from './com/network/enums'
import ClientNetworkMessage from './com/clientNetworkMessage'
import ServerNetworkMessage from './com/serverNetworkMessage'
import * as utils from './utils'
import { SerialMessageType } from './com/serial/enums'
import Game from './game/game'
import { GameSequence, GameDifficulty } from './game/enums'

import { exec } from 'child_process'

import net from 'net'
import configIni from 'config.ini'
import SerialPort from 'serialport'

export default class GameHandler {
    
    private _tcpConnections: Map<NetworkClient, net.Socket>;
    private _config: any;
    private _server: net.Server;
    private _serialPort: any;
    private _game: Game;

    private _imageAnalysisProcess: any;
    private _clientProcess: any;

    constructor(config: string) {
        this._config = configIni.load(config).Default;
        this._server = net.createServer();
        this._serialPort = new SerialPort(this._config.serialPort, {
            baudRate: this._config.baudRate,
            autoOpen: true
        });
        
        this._tcpConnections = new Map<NetworkClient, net.Socket>();
        this._game = new Game(1, 1, 1, GameSequence.Human, GameDifficulty.Easy); // dummy constructor


        
    }

    public run(): void {
        this._server.listen(this._config.port, this._config.bindingAddress, () => {
            console.log('VGR-Broker is running...');
            // tell the arduino that we are ready
            this._serialPort.write(new ServerNetworkMessage(SerialMessageType.Ready).getMessage());
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
                
                this.handleIncomingTcpData(message, utils.getKeyFromValue(client, this._tcpConnections));
            });
        });
        this._serialPort.on('data', data => {
            this.handleIncomingSerialData(new ClientNetworkMessage(data));
        });
    }

    private initImageAnalysisProcess(args: Array<string>): void {
        this._imageAnalysisProcess = exec(this._config.imageAnalysisPath + args.join(' '));
    }

    private initClientProcess(args: Array<string>): void {
        this._clientProcess = exec(this._config.clientPath + args.join(' '));
    }

    private handleIncomingSerialData(message: ClientNetworkMessage) {
        switch (message.type) {
            case SerialMessageType.StartGame:
                this.startGame(message.payload);
                break;
        
            default:
                break;
        }
    }
    
    private handleIncomingTcpData(message: ClientNetworkMessage, client: NetworkClient) {
        switch (client) {
            case NetworkClient.GameClient:
                switch (message.type) {
                    case BrokerClientMessageType.Register:
                        
                        break;
                
                    default:
                        break;
                }
                break;
            case NetworkClient.IAService:
                switch (message.type) {
                    case BrokerIAServiceMessageType.Register:
                        // send capture request
                        this._tcpConnections.get(NetworkClient.IAService)?.write(
                            new ServerNetworkMessage(BrokerIAServiceMessageType.CaptureGrid).getMessage()
                        );
                        break;
                    case BrokerIAServiceMessageType.Grid:
                        // got grid message from ia-services
                        this.handleGridMessage(message.payload);    
                    default:
                        break;
                }
                break;
            default:
                break;
        }
    }

    private handleGridMessage(payload: Array<number>): void {
        const grid: Array<Array<number>> = utils.getMatrixFromArray(payload, this._config.boardWidth);

        if(this._game.isRunning) {

        } else {
            // check if grid is empty
            if ([...grid].flat().some((element) => element !== 0)) {
                // grid is not empty
            } else {
                // grid is empty
            }
        }
    }

    private startGame(payload: Array<number>): void {
        const width: number = this._config.boardWidth;
        const height: number = this._config.boardHeight;
        const dispenserCapacity: number = this._config.dispenserCapacity;

        const sequence: GameSequence = payload[0];
        const difficulty: GameDifficulty = payload[1];

        this._game = new Game(width, height, dispenserCapacity, sequence, difficulty);

        const imageAnalysisArguments: Array<string> = [
            '--height ' + this._config.boardHeight, 
            '--width ' + this._config.boardWidth,
            '--ip ' + this._config.bindingAddress,
            '--port ' + this._config.port
        ];

        this.initImageAnalysisProcess(imageAnalysisArguments);
    }
}