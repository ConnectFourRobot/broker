import configparser
import time
from com.serial.serialHandler import SerialHandler
from com.serial.serialMessageType import SerialMessageType

lis = [5]
arr = bytearray(lis)
def main():
    # broker = Broker()
    # broker.runGame()

    # init config 
    config = configparser.ConfigParser()
    config.read('config.ini')
    defaultConfig = config['DEFAULT']

    serialHandler = SerialHandler(defaultConfig['serialNumber'], defaultConfig['baudRate'])

    # tell the arduino that we are ready to play
    time.sleep(3)
    serialHandler.send(SerialMessageType.Ready)
    time.sleep(3)
    serialHandler.send(SerialMessageType.GridNotEmpty)
    msg = serialHandler.read() #receive gridIsEmpty
    print(msg.type)
    msg = serialHandler.read() # get configuration values 
    #print(msg.type)
    print(msg.payload)         
    time.sleep(5)
    serialHandler.send(SerialMessageType.Request, arr)  #Im thinking 
    time.sleep(5)
    serialHandler.send(SerialMessageType.RobotMove, arr) # Doing Move
    msg = serialHandler.read()      #MoveDone (Inddarruppt)
    print(msg.type)
    time.sleep(5)
    serialHandler.send(SerialMessageType.StonesEmpty)      # refill dispenser
    time.sleep(5)
    serialHandler.send(SerialMessageType.EndGame, arr)     



if __name__ == '__main__':
    main()