import configparser
import subprocess
import random

from com.network.tcpServer import TcpServer
import com.network.networkMessageType as NetworkMessageType
from com.serial.serialHandler import SerialHandler
from com.serial.serialMessageType import SerialMessageType

class Broker:
    def __init__ (self):
        # init config 
        config = configparser.ConfigParser()
        config.read('config.ini')
        self.__defaultConfig = config['DEFAULT']

        # init connections
        self.__tcpServer = TcpServer(self.__defaultConfig['bindingAddress'], int(self.__defaultConfig['port']))
        self.__serialHandler = SerialHandler(self.__defaultConfig['serialNumber'], self.__defaultConfig['baudRate'])

        # tell the arduino that we are ready to play
        self.__serialHandler.send(SerialMessageType.Ready)

    def initIAService(self):
        # start image analysis service
        subprocess.Popen([self.__defaultConfig['imageAnalysisPath'], 
            "--height " + self.__defaultConfig['boardHeight'] + " --width " + self.__defaultConfig['boardWidth'] + " --ip " 
            + self.__defaultConfig['bindingAddress'] + " --port " + self.__defaultConfig['port']], shell=True)
        self.__imageAnalysisService = self.__tcpServer.listen()

    def initClient(self, difficulty, playerNumber):
        # start client
        subprocess.Popen([self.__defaultConfig['clientPath'],
            "--playernumber " + playerNumberClient + " --difficulty " + difficulty
            " --height " + self.__defaultConfig['boardHeight'] + " --width " + self.__defaultConfig['boardWidth'] + " --ip " 
            + self.__defaultConfig['bindingAddress'] + " --port " + self.__defaultConfig['port']], shell=True)
        self.__client = self.__tcpServer.listen()

    def isGridEmpty(self, grid):
        for row in grid:
            for cell in row:
                if cell != 0:
                    return False

        return True

    def getGridFromMessage(self, msg):
        height = int(self.__defaultConfig['boardHeight'])
        width = int(self.__defaultConfig['boardWidth'])

        requiredSize = height * width
        realSize = msg.size

        if requiredSize == realSize
            grid = []
            for temp in range(len(msg.payload) - 2):
                grid.append(msg.payload[temp : temp + 2])

            return grid
        return False

    def sendEmptyGridRequest(self):
        self.__serialHandler.send(SerialMessageType.GridNotEmpty)
        # Wait till human has vanished the grid
        msg = self.__serialHandler.read()
        return msg.type is SerialMessageType.GridIsEmpty


    def runGame(self):
        # Now we are ready to play a game
        # Wait for the Arduino to start a game
        msg = self.__serialHandler.read()

        if msg.type is not SerialMessageType.StartGame:
            return

        gameSequence = msg.payload[0]
        difficulty = msg.payload[1]

        playerNumberClient = 0
        playerNumberHuman = 0

        if gameSequence is 0
            playerNumberHuman = 1
            playerNumberClient = 2
        if gameSequence is 1
            playerNumberClient = 1
            playerNumberHuman = 2
        else:
            playerNumberClient = random.randint(1, 2)
            playerNumberHuman = (playerNumberClient % 2) + 1

        # init IAService
        self.initIAService()

        gridIsEmpty = False

        while not gridIsEmpty:
            # send capture command 
            self.__tcpServer.send(self.__imageAnalysisService, 
                NetworkMessageType.BrokerIAServiceMessageType.CaptureGrid)

            # wait till IA-Service sends grid
            self.__tcpServer.read(self.__imageAnalysisService)

            # check if this is the grid message
            if msg.type is not NetworkMessageType.BrokerIAServiceMessageType.Grid:
                return

            grid = self.getGridFromMessage(msg)

            if self.isGridEmpty(grid):
                gridIsEmpty = True
            else:
                # empty grid
                self.sendEmptyGridRequest()

        self.initClient(difficulty, playerNumberClient)

        