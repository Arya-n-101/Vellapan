def allPositivesSum(filename):
    ans = 0
    with open(filename, 'r') as file:
        N = int(file.readline().strip())
        for _ in range(N):
            x, y, value = map(int, file.readline().strip().split())
            ans += value
        M = int(file.readline().strip())
        for _ in range(M):
            x, y, value = map(int, file.readline().strip().split())
    return ans

def getGrid(filename):
    grid = [[0] * 10000 for _ in range(10000)]
    with open(filename, 'r') as file:
        N = int(file.readline().strip())
        for _ in range(N):
            x, y, value = map(int, file.readline().strip().split())
            grid[x - 1][y - 1] += value
        M = int(file.readline().strip())
        for _ in range(M):
            x, y, value = map(int, file.readline().strip().split())
            grid[x - 1][y - 1] -= value
    return grid

def getOptimalValue(grid):
    def copyRows(start_row, num_rows):
        newGrid = [[0]*10000 for _ in range(num_rows)]
        for i in range(num_rows):
            newGrid[i] = grid[start_row + i][:]
        return newGrid
    optimum = 0
    for i in range(0, 10000, 40):
        subgrid = copyRows(i, 40)
        # print(subgrid)
        for j in range(40):
            for k in range(10000):
                subgrid[j][k] += subgrid[j - 1][k]
        currMax = 0
        currOpt = 0
        for j in range(10000):
            currMax += subgrid[39][j]
            currOpt = max(currOpt, currMax)
            if currMax < 0:
                currMax = 0
        optimum += currOpt
    return optimum

if __name__ == "__main__":
    filename = 'input.txt'
    grid = getGrid(filename)
    maxPos = allPositivesSum(filename)
    ans = getOptimalValue(grid)
    print(maxPos)
    print(ans)
    percentage = (ans/maxPos)*100
    print(percentage, '%')