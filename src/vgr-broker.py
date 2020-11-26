import configparser

from com.serial.serialHandler import SerialHandler
from com.serial.serialMessageType import SerialMessageType

def main():
    # broker = Broker()
    # broker.runGame()

    # init config 
    config = configparser.ConfigParser()
    config.read('config.ini')
    defaultConfig = config['DEFAULT']

    serialHandler = SerialHandler(defaultConfig['serialNumber'], defaultConfig['baudRate'])

    # tell the arduino that we are ready to play
    serialHandler.send(SerialMessageType.Ready)


if __name__ == '__main__':
    main()