import { NetworkClient, BrokerIAServiceMessageType, BrokerClientMessageType } from './com/network/enums'
import ClientNetworkMessage from './com/clientNetworkMessage'
import ServerNetworkMessage from './com/serverNetworkMessage'
import * as utils from './utils'
import { SerialMessageType } from './com/serial/enums'
import Game from './game/game'
import { GameSequence, GameDifficulty, GamePlayer, GameEndState } from './game/enums'
import SerialConnector from './com/serial/connector'
import VgrParser from './com/serial/vgrParser'
import ImageDataProcessor, { ColorCode } from './imageDataProcessor'
import SoundGenerator, { SoundScene } from './soundGenerator'

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
    private _imageDataProcessor: ImageDataProcessor
    private _soundGenerator: SoundGenerator
    private _captureInteraction: boolean

    private readonly _vgrParser: VgrParser;

    private _imageAnalysisProcess: any;
    private _clientProcess: any;

    constructor(config: string) {
        this._config = configIni.load(config).Default;
        this._server = net.createServer();
        this._captureInteraction = false;
        this._serialPort = new SerialPort(this._config.serialPort, {
            baudRate: this._config.baudRate,
            autoOpen: false
        });
        this._vgrParser = new VgrParser();
        this._serialPort.pipe(this._vgrParser);
        const serialConnector: SerialConnector = new SerialConnector(this._serialPort);
        serialConnector.openPort();
        
        this._tcpConnections = new Map<NetworkClient, net.Socket>();

        this._soundGenerator = new SoundGenerator('./assets/');

        // members have to be initialized. Therefor we would need an standard 
        // Multiple constructors are not supported by JS. That's why we need the dummy constructors here.
        this._game = new Game(1, 1, 1, GameSequence.Human, GameDifficulty.Easy); // dummy constructor
        this._imageDataProcessor = new ImageDataProcessor(new Map<number, GamePlayer>(), 0, 0); // dummy constructor
    }

    public run(): void {
        this._server.listen(this._config.port, this._config.bindingAddress, () => {
            console.log('VGR-Broker is running...');
            // tell the arduino that we are ready
            (async () => {
                const msToWait: number = 4000;
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
                    const key: number = message.payload[0];
                    // delete old connection (there should not be one, but just in case)
                    if (this._tcpConnections.has(key)) {
                        console.log('Error: A service has connected twice.');
                        this._tcpConnections.get(key)?.destroy();
                        this._tcpConnections.delete(key);
                    }
                    this._tcpConnections.set(key, client);
                }
                this.handleIncomingTcpData(message, utils.getKeyFromValue(client, this._tcpConnections));
            });
            client.on('end', () => {
                console.log('Someone has disconnected');
                const key: number = utils.getKeyFromValue(client, this._tcpConnections);
                if (key != 0) {
                    // this means a service has crashed
                    this._tcpConnections.delete(key);
                    this.endGame(GameEndState.Error);
                }
            });
        });

        this._vgrParser.on('data', data => {
            console.log("Raw serial data");
            console.log(data);
            this.handleIncomingSerialData(new ClientNetworkMessage(data));
        });
    }

    private initImageAnalysisProcess(args: Array<string>): void {
        console.log('Init IA-Service');
        this._imageAnalysisProcess = exec(this._config.imageAnalysisPath + ' ' + args.join(' '));
    }

    private initClientProcess(args: Array<string>): void {
        this._clientProcess = exec(this._config.clientPath + ' ' + args.join(' '));
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
                break;
            case SerialMessageType.Abort:
                this.endGame(GameEndState.Error);
                break;
            case SerialMessageType.MoveDone:
                this._captureInteraction = false;
                this._tcpConnections.get(NetworkClient.IAService)?.write(
                    new ServerNetworkMessage(BrokerIAServiceMessageType.StopCapture).getMessage()
                );
                this._game.dispenserCurrentStorage--;
                if(this.checkGameState()) {
                    this.sendMoveRequest();
                }
                break;
            case SerialMessageType.StonesFull:
                this._game.dispenserCurrentStorage = this._game.dispenserCapacity;
                break;
            case SerialMessageType.AlingCameraDone:
                this._tcpConnections.get(NetworkClient.IAService)?.write(
                    new ServerNetworkMessage(BrokerIAServiceMessageType.CaptureGrid).getMessage()
                );
                break;
            default:
                break;
        }
    }
    
    private handleIncomingTcpData(message: ClientNetworkMessage, client: NetworkClient) {
        console.log('Incoming tcp data');
        console.log(message);
        switch (client) {
            case NetworkClient.GameClient:
                switch (message.type) {
                    case BrokerClientMessageType.Register:
                        this._game.isRunning = true;
                        this.sendMoveRequest();
                        break;
                    case BrokerClientMessageType.Answer:
                        this.handleClientMove(message.payload[0]);
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
                        break;
                    case BrokerIAServiceMessageType.NoInteractionDetected:
                        if (this._captureInteraction) {
                            this._tcpConnections.get(NetworkClient.IAService)?.write(
                                new ServerNetworkMessage(BrokerIAServiceMessageType.CaptureInteractionHeartbeat).getMessage()
                            );
                        }
                        break;
                    case BrokerIAServiceMessageType.RobotHumanInteraction:
                        // abort game
                        this._captureInteraction = false;
                        this._tcpConnections.get(NetworkClient.IAService)?.write(
                            new ServerNetworkMessage(BrokerIAServiceMessageType.StopCapture).getMessage()
                        );
                        this._soundGenerator.playSound(SoundScene.HumanInteraction);
                        this.endGame(GameEndState.Error, false);
                        break;
                    case BrokerIAServiceMessageType.NoCameraFound:
                        // abort game
                        this.endGame(GameEndState.Error);
                        break;
                    case BrokerIAServiceMessageType.NoGridFound:
                        this._soundGenerator.playSound(SoundScene.NoCamera);
                        this._serialPort.write(new ServerNetworkMessage(SerialMessageType.AlignCamera).getMessage());
                        break;
                    default:
                        break;
                }
                break;
            default:
                break;
        }
    }

    private endGame(endState: GameEndState, playSound: boolean = true): void {
        this._game.isRunning = false;
        this._captureInteraction = false;

        if (playSound) {
            this.playSoundEndState(endState);
        }

        this._tcpConnections.get(NetworkClient.GameClient)?.write(
            new ServerNetworkMessage(BrokerClientMessageType.EndGame, [this.gameEndStateToClientPayload(endState)]).getMessage()
        );

        this._tcpConnections.get(NetworkClient.IAService)?.write(
            new ServerNetworkMessage(BrokerIAServiceMessageType.EndGame).getMessage()
        );

        this._serialPort.write(new ServerNetworkMessage(SerialMessageType.EndGame, [this.gameEndStateToRobotPayload(endState)]).getMessage());

        this._tcpConnections.clear();
    }

    private checkGameState(): boolean {
        // check if someone has one this game
        if(this._game.checkForWin(this._game.currentPlayer)) {
            this.endGame(GameEndState.Regular);
            return false;
        } else {
            if (this._game.getValidMoves(this._game.map).length < 1) {
                // draw
                this.endGame(GameEndState.Draw);
                return false;
            }
            // check if stoneCounter is 0
            if(this._game.dispenserCurrentStorage == 0) {
                this._soundGenerator.playSound(SoundScene.DispenserEmpty);
                this._serialPort.write(new ServerNetworkMessage(SerialMessageType.StonesEmpty).getMessage());
            }
            this._game.nextPlayer();
            return true;
        }
    }

    private playSoundEndState(endState: GameEndState): void {
        switch (endState) {
            case GameEndState.Regular:
                switch (this._game.players.get(this._game.currentPlayer)) {
                    case GamePlayer.Human:
                        this._soundGenerator.playSound(SoundScene.RobotLostGame);
                        break;
                
                    case GamePlayer.KI:
                        this._soundGenerator.playSound(SoundScene.RobotWonGame);
                        break;
                }
                break;
            case GameEndState.Draw:
                this._soundGenerator.playSound(SoundScene.Draw);
                break;
            case GameEndState.Error:
                this._soundGenerator.playSound(SoundScene.Error);
                break;
        }
    }

    private handleClientMove(column: number): void {
        this._game.move(column, this._game.currentPlayer);
        this._imageDataProcessor.updateColorGrid(column, this._game.players.get(this._game.currentPlayer));
        this._captureInteraction = true;
        this._tcpConnections.get(NetworkClient.IAService)?.write(
            new ServerNetworkMessage(BrokerIAServiceMessageType.CaptureRobotHuman).getMessage()
        );
        console.log("Move send to robot: " + column);

        if (this._game.amountOfMovesMade <= 1 && this._game.players.get(this._game.currentPlayer) === GamePlayer.KI) {
            this._soundGenerator.playSound(SoundScene.FirstRobotMove);
        }

        this._serialPort.write(new ServerNetworkMessage(SerialMessageType.RobotMove, [column]).getMessage());
        this._tcpConnections.get(NetworkClient.GameClient)?.write(
            new ServerNetworkMessage(BrokerClientMessageType.Move, [
                column, utils.getKeyFromValue(GamePlayer.KI, this._game.players)
            ]).getMessage()
        );
    }

    private sendMoveRequest(): void {
        const currentPlayer: GamePlayer | undefined = this._game.players.get(this._game.currentPlayer);

        switch (currentPlayer) {
            case GamePlayer.Human:
                // ToDo: remove magic number
                // send move request to robot
                this._serialPort.write(new ServerNetworkMessage(SerialMessageType.Request, [0]).getMessage());

                // send a capture grid request
                this._tcpConnections.get(NetworkClient.IAService)?.write(
                    new ServerNetworkMessage(BrokerIAServiceMessageType.CaptureGrid).getMessage()
                );
                break;
            case GamePlayer.KI:
                console.log("send move request to client");
                // ToDo: remove magic number
                // send move request to robot
                this._serialPort.write(new ServerNetworkMessage(SerialMessageType.Request, [1]).getMessage());
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
        console.log("handle grid message");
        const colorGrid: Array<ColorCode> = payload;
        console.log(utils.getMatrixFromArray(colorGrid, 7));
        if(this._game.isRunning) {
            // Error detection
            if (!this._imageDataProcessor.isColorGridValid(colorGrid, this._game.players.get(this._game.currentPlayer))) {
                console.log("grid is not valid");
                (async () => {
                    const msToWait: number = 500;
                    await utils.delay(msToWait);
                    this._tcpConnections.get(NetworkClient.IAService)?.write(
                        new ServerNetworkMessage(BrokerIAServiceMessageType.CaptureGrid).getMessage()
                    );
                })();
                return;
            }

            const gameGrid: Array<Array<number>> = this._imageDataProcessor.colorToGameGrid(colorGrid);
            // check if there are changes in the grid
            const column: number = this._game.getMoveFromGrid(gameGrid);
            if (column !== -1) {
                this._game.move(column, this._game.currentPlayer);
                
                if (this._game.amountOfMovesMade <= 1 && this._game.players.get(this._game.currentPlayer) === GamePlayer.Human) {
                    this._soundGenerator.playSound(SoundScene.FirstHumanMove);
                }

                this._imageDataProcessor.updateColorGrid(column, this._game.players.get(this._game.currentPlayer));
                // send column to robot
                this._serialPort.write(new ServerNetworkMessage(SerialMessageType.HumanMove, [column]).getMessage());
                console.log("send column to client");
                // send column to client
                this._tcpConnections.get(NetworkClient.GameClient)?.write(
                    new ServerNetworkMessage(BrokerClientMessageType.Move, [
                        column, utils.getKeyFromValue(GamePlayer.Human, this._game.players)
                    ]).getMessage()
                );

                if(this.checkGameState()) {
                    this.sendMoveRequest();
                }
            } else {
                console.log("can not detect move from grid");
                (async () => {
                    const msToWait: number = 500;
                    await utils.delay(msToWait);
                    this._tcpConnections.get(NetworkClient.IAService)?.write(
                        new ServerNetworkMessage(BrokerIAServiceMessageType.CaptureGrid).getMessage()
                    );
                })();
            }
        } else {
            // check if grid is empty
            if (colorGrid.some((stone: ColorCode) => stone !== ColorCode.Empty)) {
                // grid is not empty
                // send "CleanGrid" message to roboter
                console.log("Grid is not empty");
                this._soundGenerator.playSound(SoundScene.FullGrid);
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
        this._imageDataProcessor = new ImageDataProcessor(this._game.players, height, width);

        this._soundGenerator.playSound(SoundScene.StartGame);

        const imageAnalysisArguments: Array<string> = [
            '--height ' + this._config.boardHeight, 
            '--width ' + this._config.boardWidth,
            '-hid ' + 'True',
            '--ip ' + this._config.bindingAddress,
            '--port ' + this._config.port
        ];
        (async () => {
            const msToWait: number = 2000;
            await utils.delay(msToWait);
            this.initImageAnalysisProcess(imageAnalysisArguments);
        })();
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