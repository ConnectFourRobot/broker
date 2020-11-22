from enum import Enum

class BrokerClientMessageType(Enum):
    Request = 1
    Answer = 2
    Move = 3
    EndGame = 4

class BrokerIAServiceMessageType(Enum):
    CaptureGrid = 1
    Grid = 2
    StopCapture = 3
    CaptureRobotHuman = 4
    RobotHumanInteraction = 5
    EndGame = 6