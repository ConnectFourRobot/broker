import { NetworkClient, BrokerIAServiceMessageType, BrokerClientMessageType } from './com/network/enums'
import ClientNetworkMessage from './com/clientNetworkMessage'
import ServerNetworkMessage from './com/serverNetworkMessage'
import * as utils from './utils'
import { SerialMessageType } from './com/serial/enums'
import Game from './game/game'
import { GameSequence, GameDifficulty, GamePlayer, GameEndState } from './game/enums'
import SerialConnector from './com/serial/connector'

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
            autoOpen: false
        });
        const serialConnector: SerialConnector = new SerialConnector(this._serialPort);
        serialConnector.openPort();
        
        this._tcpConnections = new Map<NetworkClient, net.Socket>();

        // members have to be initialized. Therefor we would need an standard 
        // Multiple constructors are not supported by JS. That's why we need the dummy constructor here.
        this._game = new Game(1, 1, 1, GameSequence.Human, GameDifficulty.Easy); // dummy constructor
    }

    public run(): void {
        this._server.listen(this._config.port, this._config.bindingAddress, () => {
            console.log('VGR-Broker is running...');
            // tell the arduino that we are ready
            (async () => {
                const msToWait: number = 5000;
                await utils.delay(msToWait);
                this._serialPort.write(new ServerNetworkMessage(SerialMessageType.Ready).getMessage());
            })();
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
                this.initGame(message.payload);
                break;
            case SerialMessageType.GridIsEmpty:
                // check if this is true by sending a capture request
                this._tcpConnections.get(NetworkClient.IAService)?.write(
                    new ServerNetworkMessage(BrokerIAServiceMessageType.CaptureGrid).getMessage()
                );
            case SerialMessageType.Abort:
                this.endGame(254);
                break;
            case SerialMessageType.MoveDone:
                this._tcpConnections.get(NetworkClient.IAService)?.write(
                    new ServerNetworkMessage(BrokerIAServiceMessageType.StopCapture).getMessage()
                );
                this._game.dispenserCapacity--;
                this.checkGameState();
            case SerialMessageType.StonesFull:
                this._game.dispenserCurrentStorage = this._game.dispenserCapacity;
            default:
                break;
        }
    }
    
    private handleIncomingTcpData(message: ClientNetworkMessage, client: NetworkClient) {
        switch (client) {
            case NetworkClient.GameClient:
                switch (message.type) {
                    case BrokerClientMessageType.Register:
                        this._game.isRunning = true;
                        this.sendMoveRequest();
                        break;
                    case BrokerClientMessageType.Answer:
                        this.handleClientMove(message.payload[0]);
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
                    case BrokerIAServiceMessageType.RobotHumanInteraction:
                        // abort game
                        this.endGame(254);
                    default:
                        break;
                }
                break;
            default:
                break;
        }
    }

    private endGame(endState: GameEndState): void {
        this._game.isRunning = false;

        this._tcpConnections.get(NetworkClient.GameClient)?.write(
            new ServerNetworkMessage(BrokerClientMessageType.EndGame, [this.gameEndStateToClientPayload(endState)]).getMessage()
        );

        this._tcpConnections.get(NetworkClient.IAService)?.write(
            new ServerNetworkMessage(BrokerIAServiceMessageType.EndGame).getMessage()
        );

        this._serialPort.write(new ServerNetworkMessage(SerialMessageType.EndGame, [this.gameEndStateToRobotPayload(endState)]));
    }

    private checkGameState(): void {
        // check if someone has one this game
        if(this._game.checkForWin(this._game.currentPlayer)) {
            this.endGame(GameEndState.Regular);
        } else {
            if (this._game.getValidMoves(this._game.map).length < 1) {
                // draw
                this.endGame(GameEndState.Draw);
            }
            // check if stoneCounter is 0
            if(this._game.dispenserCurrentStorage == 0) {
                this._serialPort.write(new ServerNetworkMessage(SerialMessageType.StonesEmpty));
            }
            this._game.nextPlayer();
        }
    }

    private handleClientMove(column: number): void {
        this._game.move(column, this._game.currentPlayer);
        this._tcpConnections.get(NetworkClient.IAService)?.write(
            new ServerNetworkMessage(BrokerIAServiceMessageType.CaptureRobotHuman).getMessage()
        );
        this._serialPort.write(new ServerNetworkMessage(SerialMessageType.RobotMove, [column]));
    }

    private sendMoveRequest(): void {
        const currentPlayer: GamePlayer | undefined = this._game.players.get(this._game.currentPlayer);

        switch (currentPlayer) {
            case GamePlayer.Human:
                // ToDo: remove magic number
                // send move request to robot
                this._serialPort.write(new ServerNetworkMessage(SerialMessageType.Request, [0]));

                // send a capture grid request
                this._tcpConnections.get(NetworkClient.IAService)?.write(
                    new ServerNetworkMessage(BrokerIAServiceMessageType.CaptureGrid).getMessage()
                );
                break;
            case GamePlayer.KI:
                // ToDo: remove magic number
                // send move request to robot
                this._serialPort.write(new ServerNetworkMessage(SerialMessageType.Request, [1]));
                // send request to client
                this._tcpConnections.get(NetworkClient.GameClient)?.write(
                    new ServerNetworkMessage(BrokerClientMessageType.Request).getMessage()
                );
                break;
            default:
                console.log('Error: gameMove');
                break;
        }
    }

    private handleGridMessage(payload: Array<number>): void {
        const grid: Array<Array<number>> = utils.getMatrixFromArray(payload, this._config.boardWidth);

        if(this._game.isRunning) {
            // check if there are changes in the grid
            const column: number = this._game.getMoveFromGrid(grid);
            if (column !== -1) {
                this._tcpConnections.get(NetworkClient.IAService)?.write(
                    new ServerNetworkMessage(BrokerIAServiceMessageType.StopCapture).getMessage()
                );
                this._game.move(column, this._game.currentPlayer);
                // send column to robot
                this._serialPort.write(new ServerNetworkMessage(SerialMessageType.HumanMove, [column]).getMessage());
                
                // send column to client
                this._tcpConnections.get(NetworkClient.GameClient)?.write(
                    new ServerNetworkMessage(BrokerClientMessageType.Move, [
                        column, utils.getKeyFromValue(GamePlayer.Human, this._game.players)
                    ]).getMessage()
                );

                this.checkGameState();
            }
        } else {
            // check if grid is empty
            if ([...grid].flat().some((element) => element !== 0)) {
                // grid is not empty
                // send "CleanGrid" message to roboter
                this._serialPort.write(new ServerNetworkMessage(SerialMessageType.GridNotEmpty).getMessage());
            } else {
                // grid is empty
                // start game
                // parameter (playernumber, difficulty, height, width, ip, port)
                
                const clientArguments: Array<string> = [
                    '--playernumber ' + utils.getKeyFromValue(GamePlayer.KI, this._game.players),
                    '--difficulty ' + this._game.difficulty,
                    '--height ' + this._game.height,
                    '--width ' + this._game.width,
                    '--ip ' + this._config.bindingAddress,
                    '--port ' + this._config.port
                ];

                this.initClientProcess(clientArguments);
            }
        }
    }

    private initGame(payload: Array<number>): void {
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

    private gameEndStateToClientPayload(endState: GameEndState): number {
        switch (endState) {
            case GameEndState.Regular:
                return this._game.currentPlayer;
                break;
            case GameEndState.Draw:
                return 0;
                break;
            case GameEndState.Error:
                return 254;
                break;
            default:
                return 254;
                break;
        }
    }

    private gameEndStateToRobotPayload(endState: GameEndState): number {
        switch (endState) {
            case GameEndState.Regular:
                if (this._game.currentPlayer == utils.getKeyFromValue(GamePlayer.Human, this._game.players)) {
                    return 0;
                }
                if (this._game.currentPlayer == utils.getKeyFromValue(GamePlayer.KI, this._game.players)) {
                    return 1;
                }
                return 254;
                break;
            case GameEndState.Draw:
                return 2;
                break;
            case GameEndState.Error:
                return 254;
                break;
            default:
                return 254;
                break;
        }
    }
}