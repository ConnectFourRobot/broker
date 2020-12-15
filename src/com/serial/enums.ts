enum SerialMessageType {
    Ready = 1,
    GridNotEmpty = 2,
    GridIsEmpty = 3,
    StartGame = 4,
    Request = 5,
    HumanMove = 6,
    RobotMove = 7,
    MoveDone = 8,
    EndGame = 9,
    Abort = 10,
    StonesEmpty = 11,
    StonesFull = 12
}

export {SerialMessageType}