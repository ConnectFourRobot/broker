enum NetworkClient {
    GameClient = 42,
    IAService = 23
}

enum BrokerClientMessageType {
    Register = 0,
    Request = 1,
    Answer = 2,
    Move = 3,
    EndGame = 4
}

enum BrokerIAServiceMessageType {
    Register = 0,
    CaptureGrid = 1,
    Grid = 2,
    StopCapture = 3,
    CaptureRobotHuman = 4,
    RobotHumanInteraction = 5,
    EndGame = 6,
    NoCameraFound = 253,
    NoGridFound = 254,
    NoInteractionDetected = 127,
    CaptureInteractionHeartbeat = 128
}

export {NetworkClient, BrokerClientMessageType, BrokerIAServiceMessageType}