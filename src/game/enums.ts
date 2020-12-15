enum GameSequence {
    Human = 0,
    KI = 1,
    Random = 2
}

enum GameDifficulty {
    Easy = 0,
    Normal = 1,
    Hard = 2
}

enum GamePlayer {
    Human = 0,
    KI = 1
}

enum GameEndState {
    Regular = 0,
    Draw = 1,
    Error = 2
}

export {
    GameSequence,
    GameDifficulty,
    GamePlayer,
    GameEndState
}