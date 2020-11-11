from enum import Enum
class NetworkMessageType(Enum):
    Configuration = 1
    RequestClient = 2
    AnswerClient = 3
    Move = 4
    EndGame = 5
    RequestIA = 6
    AnswerIA = 7
    AbortIA = 8
    ReadyIA = 9