import { useState, useEffect, useCallback } from 'react';
import './TowerOfHanoi.css';

interface Disc {
    size: number;
}

export const TowerOfHanoi = () => {
    const [discCount, setDiscCount] = useState<number>(4);
    const [towers, setTowers] = useState<Disc[][]>(() => [
        generateInitialDiscs(discCount),
        [],
        [],
    ]);
    const [selectedTower, setSelectedTower] = useState<number | null>(null);
    const [moves, setMoves] = useState<number>(0);
    const [isWon, setIsWon] = useState<boolean>(false);
    const [invalidMove, setInvalidMove] = useState<number | null>(null);

    const [isAutoSolving, setIsAutoSolving] = useState(false);
    const [autoSolveMoves, setAutoSolveMoves] = useState<[number, number][]>([]);

    const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);

    const [solveSpeed, setSolveSpeed] = useState(100);

    function generateInitialDiscs(count: number): Disc[] {
        return Array.from({ length: count }, (_, index) => ({
            size: count - index
        }));
    }

    const checkWinCondition = (currentTowers: Disc[][]) => {
        const lastTower = currentTowers[2];
        if (lastTower.length === discCount &&
            lastTower.every((disc, index) => disc.size === discCount - index)) {
            setIsWon(true);
        }
    };

    const resetGame = () => {
        setTowers([
            generateInitialDiscs(discCount),
            [],
            []
        ]);
        setMoves(0);
        setSelectedTower(null);
        setIsWon(false);
    };

    const handleDiscCountChange = (newCount: number) => {
        setDiscCount(newCount);
        setTowers([
            generateInitialDiscs(newCount),
            [],
            []
        ]);
        setMoves(0);
        setSelectedTower(null);
        setIsWon(false);
    };

    const handleTowerClick = (towerIndex: number) => {
        if (isWon) return;

        if (selectedTower === null) {
            if (towers[towerIndex].length > 0) {
                setSelectedTower(towerIndex);
            }
        } else {
            const sourceDisc = towers[selectedTower][towers[selectedTower].length - 1];
            const targetDisc = towers[towerIndex][towers[towerIndex].length - 1];

            if (!targetDisc || sourceDisc.size < targetDisc.size) {
                const newTowers = towers.map((tower) => [...tower]);
                const disc = newTowers[selectedTower].pop()!;
                newTowers[towerIndex].push(disc);
                setTowers(newTowers);
                setMoves(moves + 1);
                checkWinCondition(newTowers);
            } else {
                setInvalidMove(towerIndex);
                setTimeout(() => setInvalidMove(null), 500);
            }
            setSelectedTower(null);
        }
    };

    const handleDragStart = (event: React.DragEvent, towerIndex: number) => {
        if (isWon || towers[towerIndex].length === 0) return;
        event.dataTransfer.setData('text/plain', towerIndex.toString());
        setDragSourceIndex(towerIndex);
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
    };

    const handleDrop = (event: React.DragEvent, targetTowerIndex: number) => {
        event.preventDefault();
        const sourceTowerIndex = Number(event.dataTransfer.getData('text/plain'));

        const sourceTower = towers[sourceTowerIndex];
        const targetTower = towers[targetTowerIndex];

        if (sourceTower.length === 0) return;

        const disc = sourceTower[sourceTower.length - 1];
        if (targetTower.length === 0 || targetTower[targetTower.length - 1].size > disc.size) {
            setTowers(prevTowers => {
                const newTowers = prevTowers.map(tower => [...tower]);
                const disc = newTowers[sourceTowerIndex].pop()!;
                newTowers[targetTowerIndex].push(disc);
                checkWinCondition(newTowers);
                return newTowers;
            });
            setMoves(moves => moves + 1);
        } else {
            setInvalidMove(targetTowerIndex);
            setTimeout(() => setInvalidMove(null), 500);
        }
        setDragSourceIndex(null);
    };

    const generateSolution = (n: number, source: number, auxiliary: number, target: number): [number, number][] => {
        const moves: [number, number][] = [];

        function hanoi(discs: number, from: number, aux: number, to: number) {
            if (discs === 1) {
                moves.push([from, to]);
                return;
            }
            hanoi(discs - 1, from, to, aux);
            moves.push([from, to]);
            hanoi(discs - 1, aux, from, to);
        }

        hanoi(n, source, auxiliary, target);
        return moves;
    };

    const handleAutoSolve = useCallback(() => {
        if (isAutoSolving) {
            setIsAutoSolving(false);
            return;
        }
        const solution = generateSolution(discCount, 0, 1, 2);
        setAutoSolveMoves(solution);
        setIsAutoSolving(true);
    }, [discCount, isAutoSolving]);

    useEffect(() => {
        if (!isAutoSolving || autoSolveMoves.length === 0) return;

        let moveIndex = 0;
        const interval = setInterval(() => {
            if (moveIndex >= autoSolveMoves.length) {
                setIsAutoSolving(false);
                setAutoSolveMoves([]);
                clearInterval(interval);
                return;
            }

            const [from, to] = autoSolveMoves[moveIndex];
            setTowers(prevTowers => {
                const newTowers = prevTowers.map(tower => [...tower]);
                const disc = newTowers[from].pop()!;
                newTowers[to].push(disc);
                checkWinCondition(newTowers);
                return newTowers;
            });
            setMoves(moves => moves + 1);
            moveIndex++;
        }, solveSpeed);

        return () => clearInterval(interval);
    }, [isAutoSolving, autoSolveMoves, solveSpeed]);

    const BASE_DISC_WIDTH = 40;

    const maxDiscWidth = BASE_DISC_WIDTH * discCount;
    const containerWidth = Math.max(maxDiscWidth * 3.5, 500);

    return (
        <div className="game-container">
            <div className="game-info">
                <div className="controls">
                    <label>
                        Number of discs:
                        <select
                            value={discCount}
                            onChange={(e) => handleDiscCountChange(Number(e.target.value))}
                            disabled={moves > 0}
                        >
                            {[3, 4, 5, 6, 7, 8].map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                    </label>
                    <span>Moves: {moves}</span>
                    <button onClick={resetGame}>Reset Game</button>
                    <button
                        onClick={handleAutoSolve}
                        disabled={isWon || (!isAutoSolving && moves > 0)}
                    >
                        {isAutoSolving ? 'Stop Solving' : 'Auto Solve'}
                    </button>
                    <select
                        value={solveSpeed}
                        onChange={(e) => setSolveSpeed(Number(e.target.value))}
                        disabled={isAutoSolving}
                    >
                        <option value={500}>Slow</option>
                        <option value={250}>Normal</option>
                        <option value={100}>Fast</option>
                        <option value={25}>Very Fast</option>
                        <option value={0}>No delay</option>
                    </select>
                </div>
                {isWon && <div className="win-message">Congratulations! You won in {moves} moves!</div>}
            </div>
            <div
                className="tower-of-hanoi"
                style={{
                    width: `${containerWidth}px`,
                    gap: `${Math.max(50, maxDiscWidth * 0.5)}px`
                }}
            >
                {towers.map((tower, index) => (
                    <div
                        key={index}
                        className={`tower ${selectedTower === index ? 'selected' : ''} 
                              ${invalidMove === index ? 'shake' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        onClick={() => handleTowerClick(index)}
                    >
                        <div className="pole" />
                        <div className="discs">
                            {tower.map((disc, discIndex) => (
                                <div
                                    key={discIndex}
                                    className={`disc ${discIndex === tower.length - 1 ? 'top-disc' : ''}`}
                                    style={{
                                        width: `${disc.size * BASE_DISC_WIDTH}px`,
                                        cursor: discIndex === tower.length - 1 ? 'grab' : 'default'
                                    }}
                                    draggable={discIndex === tower.length - 1}
                                    onDragStart={discIndex === tower.length - 1 ? (e) => handleDragStart(e, index) : undefined}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};