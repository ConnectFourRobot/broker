import serial
import time
import sys

from broker.com.serial.serialMessageType import SerialMessageType
from broker.com.serial import utils
from broker.com.message import Message

class SerialHandler:
    def __init__(self, serialNumber: str, baudRate: int):
        portDescription = utils.findPortBySerialNumber(serialNumber)
        self.__s = serial.Serial(portDescription, baudRate, timeout=None)

        if(self.__s.isOpen() == False):
            self.__s.open()

        time.sleep(5)

    def send(self, type: SerialMessageType, payload: bytearray = None) -> None:
        # get size of payload
        size: int = 0
        if payload is not None:
            size = len(payload)

        message = bytearray([type.value, size])
        if payload is not None:
            message.extend(payload)

        self.__s.write(message)

    def read(self) -> Message:
        type: SerialMessageType = SerialMessageType(self.__s.read(1)[0])
        size: int = self.__s.read(1)[0]
        payload = None
        if size > 0:
            payload = self.__s.read(size)

        return Message(type, size, payload)