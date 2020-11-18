from enum import Enum

class SerialMessageType(Enum):
    Ready = 1
    StartGame = 2
    Request = 3
    Answer = 4
    Move = 5
    MoveDone = 6
    EndGame = 7
    Abort = 8