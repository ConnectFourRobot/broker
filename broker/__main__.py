import configparser
import serial
import subprocess

from broker.com.network.tcpServer import TcpServer
from broker.com.network.networkMessageType import NetworkMessageType
from broker.com.serial.serialHandler import SerialHandler
from broker.com.serial.serialMessageType import SerialMessageType

def main():
    # init config 
    config = configparser.ConfigParser()
    config.read('config.ini')
    defaultConfig = config['DEFAULT']

    # init connections
    tcpServer = TcpServer(defaultConfig['bindingAddress'], int(defaultConfig['port']))
    serialHandler = SerialHandler(defaultConfig['serialNumber'], defaultConfig['baudRate'])

    # start image analysis service
    subprocess.Popen([defaultConfig['imageAnalysisPath'], ""], shell=True)
    imageAnalysisService = tcpServer.listen()
    
    # wait for ready message
    msg = tcpServer.read(imageAnalysisService)
    if msg.type is not NetworkMessageType.ReadyIA:
        print("Wrong message type")
        return
    
    # tell the arduino that we are ready to play
    serialHandler.send(SerialMessageType.Ready)
    

if __name__ == '__main__':
    main()