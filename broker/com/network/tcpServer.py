import socket
import sys

from broker.com.network.networkMessageType import NetworkMessageType
from broker.com.message import Message

class TcpServer:
    def __init__(self, address: str, port):
        # create socket
        self.__socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_address = (address, port)
        self.__socket.bind(server_address)

    def listen(self):
        self.__socket.listen(1)
        (clientsocket, address) = self.__socket.accept()
        return clientsocket


    def send(self, client, type: NetworkMessageType, payload: bytearray = None) -> None:
        # get size of payload
        size: int = 0
        if payload is not None:
            size = len(payload)
        message = bytearray([type.value, size])
        if payload is not None:
            message.extend(payload)
        client.send(message)

    def read(self, client) -> Message:
        type: NetworkMessageType = NetworkMessageType(client.recv(1)[0])
        size: int = client.recv(1)[0]
        payload = None
        if size > 0:
            payload = client.recv(size)

        return Message(type, size, payload)
    
    def __del__(self):
        self.__socket.shutdown()
        self.__socket.close()