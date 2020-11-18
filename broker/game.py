class Game:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.__grid = [[0 for x in range(self.width)] for y in range(self.height)]
    
    def getValidMoves(self) -> list:
        validMoves = []
        index: int = 0
        for cell in self.__grid[0]:
            if cell == 0:
                validMoves.append(index)
            index += 1
        return validMoves

    def isMoveValid(self, x: int) -> bool:
        return x in self.getValidMoves()

    def move(self, x: int, playerNumber: int):
        for i in range(self.height-1, -1, -1):
            if self.__grid[i][x] == 0:
                self.__grid[i][x] = playerNumber
                break
        print(self.__grid)

    def checkForWin(self, playerNumber: int) -> bool:
        # verticalCheck 
        for j in range(0, self.height - 3, 1):
            for i in range(0, self.width, 1):
                if self.__grid[j][i] == playerNumber and self.__grid[j+1][i] == playerNumber and \
                    self.__grid[j+2][i] == playerNumber and self.__grid[j+3][i] == playerNumber:
                    return True
        # horizontalCheck
        for i in range(0,self.width-3, 1):
            for j in range(0, self.height, 1):
                if self.__grid[j][i] == playerNumber and self.__grid[j][i+1] == playerNumber and \
                    self.__grid[j][i+2] == playerNumber and self.__grid[j][i+3] == playerNumber:
                    return True

        # ascendingDiagonalCheck 
        for i in range(3, self.width, 1):
            for j in range(0, self.height-3, 1):
                if self.__grid[j][i] == playerNumber and self.__grid[j+1][i-1] == playerNumber and \
                    self.__grid[j+2][i-2] == playerNumber and self.__grid[j+3][i-3] == playerNumber:
                    return True

        # descendingDiagonalCheck
        for i in range(3, self.width, 1):
            for j in range(3, self.height, 1):
                if self.__grid[j][i] == playerNumber and self.__grid[j-1][i-1] == playerNumber and \
                    self.__grid[j-2][i-2] == playerNumber and self.__grid[j-3][i-3] == playerNumber:
                    return True
        return False