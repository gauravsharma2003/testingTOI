import React, { useState, useEffect } from 'react';
import { puzzles } from './assets/good';

const SlitherLink = () => {
  // Track which puzzle is currently active - initialize with random index
  const [puzzleIndex, setPuzzleIndex] = useState(Math.floor(Math.random() * puzzles.length));
  const currentPuzzle = puzzles[puzzleIndex];
  const GRID_SIZE = currentPuzzle.dim[0];

  // Lines that the user has toggled on
  const [lines, setLines] = useState(new Set());
  // Whether the solution is currently revealed
  const [showingSolution, setShowingSolution] = useState(false);
  // Count of each cell's edges (to highlight if a number is exceeded)
  const [cellCounts, setCellCounts] = useState({});
  // Status message (e.g. check result)
  const [message, setMessage] = useState('');
  // Show popup for next puzzle
  const [showNextPopup, setShowNextPopup] = useState(false);

  const getLineKey = (r1, c1, r2, c2) => {
    if (r1 > r2 || (r1 === r2 && c1 > c2)) {
      [r1, c1, r2, c2] = [r2, c2, r1, c1];
    }
    return `${r1},${c1}-${r2},${c2}`;
  };

  const hasLine = (r1, c1, r2, c2) => {
    const key = getLineKey(r1, c1, r2, c2);
    return lines.has(key);
  };

  const getNumber = (row, col) => {
    const match = currentPuzzle.numbers.find(
      (item) => item.r === row + 1 && item.c === col + 1
    );
    return match ? match.n : null;
  };

  const getCellEdgeCount = (row, col) => {
    let count = 0;
    if (hasLine(row, col, row, col + 1)) count++;    
    if (hasLine(row + 1, col, row + 1, col + 1)) count++; 
    if (hasLine(row, col, row + 1, col)) count++;      
    if (hasLine(row, col + 1, row + 1, col + 1)) count++;
    return count;
  };

  useEffect(() => {
    const newCounts = {};
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        newCounts[`${row},${col}`] = getCellEdgeCount(row, col);
      }
    }
    setCellCounts(newCounts);
  }, [lines, GRID_SIZE]);

  const toggleLine = (r1, c1, r2, c2) => {
    if (showingSolution) return;
    setMessage('');
    const key = getLineKey(r1, c1, r2, c2);
    setLines((prev) => {
      const newLines = new Set(prev);
      if (newLines.has(key)) {
        newLines.delete(key);
      } else {
        newLines.add(key);
      }
      return newLines;
    });
  };

  const checkSolution = () => {
    const solutionSet = new Set();
    for (const { a, b } of currentPuzzle.solution) {
      const [r1, c1] = a;
      const [r2, c2] = b;
      solutionSet.add(getLineKey(r1, c1, r2, c2));
    }

    if (solutionSet.size !== lines.size) {
      setMessage('Incorrect: Different number of lines than the solution.');
      return;
    }

    for (const userLine of lines) {
      if (!solutionSet.has(userLine)) {
        setMessage('Incorrect: One or more lines do not match the solution.');
        return;
      }
    }
    setMessage('Correct! Your solution matches perfectly.');
    setShowNextPopup(true);
  };

  const showSolution = () => {
    const solutionLines = new Set();
    for (const { a, b } of currentPuzzle.solution) {
      const [r1, c1] = a;
      const [r2, c2] = b;
      solutionLines.add(getLineKey(r1, c1, r2, c2));
    }
    setLines(solutionLines);
    setShowingSolution(true);
    setMessage('Solution revealed.');
  };

  const resetPuzzle = () => {
    setLines(new Set());
    setShowingSolution(false);
    setMessage('');
  };

  const handleNextPuzzle = () => {
    setPuzzleIndex((prev) => {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * puzzles.length);
      } while (nextIndex === prev);
      return nextIndex;
    });
    setLines(new Set());
    setShowingSolution(false);
    setMessage('');
    setShowNextPopup(false);
  };

  const handleRefreshPuzzle = () => {
    setPuzzleIndex((prev) => {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * puzzles.length);
      } while (nextIndex === prev);
      return nextIndex;
    });
    setLines(new Set());
    setShowingSolution(false);
    setMessage('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg relative">
        {/* Reload Button */}
        <button
          className="absolute top-4 right-4 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
          onClick={handleRefreshPuzzle}
        >
          ↻ 
        </button>

        {message && (
          <div className="mb-4 p-4 bg-yellow-100 text-gray-800 rounded-lg">
            {message}
          </div>
        )}

        {/* Puzzle Grid */}
        <div className="relative mb-6 flex justify-center">
          <div className="flex flex-col items-center">
            {Array.from({ length: GRID_SIZE }, (_, row) => (
              <div key={row} className="flex">
                {Array.from({ length: GRID_SIZE }, (_, col) => {
                  // The puzzle number for this cell, if any
                  const clue = getNumber(row, col);
                  const count = cellCounts[`${row},${col}`] || 0;
                  const exceed = clue !== null && count > clue;

                  return (
                    <div
                      key={col}
                      className="relative"
                      style={{ width: '50px', height: '50px' }}
                    >
                      {clue !== null && (
                        <span
                          className={`absolute inset-0 flex items-center justify-center text-xl font-semibold ${
                            exceed ? 'text-red-600' : ''
                          }`}
                        >
                          {clue}
                        </span>
                      )}

                      {/* Top edge: (row,col) -> (row,col+1) */}
                      <button
                        className={`absolute top-0 left-0 right-0 h-1 cursor-pointer ${
                          hasLine(row, col, row, col + 1)
                            ? 'bg-blue-600'
                            : 'bg-gray-300 hover:bg-blue-400'
                        }`}
                        onClick={() => toggleLine(row, col, row, col + 1)}
                      />

                      {/* Left edge: (row,col) -> (row+1,col) */}
                      <button
                        className={`absolute top-0 left-0 bottom-0 w-1 cursor-pointer ${
                          hasLine(row, col, row + 1, col)
                            ? 'bg-blue-600'
                            : 'bg-gray-300 hover:bg-blue-400'
                        }`}
                        onClick={() => toggleLine(row, col, row + 1, col)}
                      />

                      {/* Right edge: (row,col+1) -> (row+1,col+1) for the last col */}
                      {col === GRID_SIZE - 1 && (
                        <button
                          className={`absolute top-0 right-0 bottom-0 w-1 cursor-pointer ${
                            hasLine(row, col + 1, row + 1, col + 1)
                              ? 'bg-blue-600'
                              : 'bg-gray-300 hover:bg-blue-400'
                          }`}
                          onClick={() => toggleLine(row, col + 1, row + 1, col + 1)}
                        />
                      )}

                      {/* Bottom edge: (row+1,col) -> (row+1,col+1) for the last row */}
                      {row === GRID_SIZE - 1 && (
                        <button
                          className={`absolute bottom-0 left-0 right-0 h-1 cursor-pointer ${
                            hasLine(row + 1, col, row + 1, col + 1)
                              ? 'bg-blue-600'
                              : 'bg-gray-300 hover:bg-blue-400'
                          }`}
                          onClick={() => toggleLine(row + 1, col, row + 1, col + 1)}
                        />
                      )}

                      {/* Dots in corners */}
                      <div className="absolute top-0 left-0 w-2 h-2 -ml-1 -mt-1 bg-black rounded-full" />
                      {col === GRID_SIZE - 1 && (
                        <div className="absolute top-0 right-0 w-2 h-2 -mr-1 -mt-1 bg-black rounded-full" />
                      )}
                      {row === GRID_SIZE - 1 && (
                        <div className="absolute bottom-0 left-0 w-2 h-2 -ml-1 -mb-1 bg-black rounded-full" />
                      )}
                      {row === GRID_SIZE - 1 && col === GRID_SIZE - 1 && (
                        <div className="absolute bottom-0 right-0 w-2 h-2 -mr-1 -mb-1 bg-black rounded-full" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Add a puzzle counter */}
        <div className="mt-4 text-center text-gray-600">
          Puzzle {puzzleIndex + 1} of {puzzles.length}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            onClick={checkSolution}
            disabled={showingSolution}
          >
            Check My Solution
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            onClick={showSolution}
            disabled={showingSolution}
          >
            Show Solution
          </button>
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            onClick={resetPuzzle}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Next Puzzle Popup */}
      {showNextPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-center">Congratulations!</h2>
            <p className="text-center mb-6">You've solved the puzzle correctly!</p>
            <button
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              onClick={handleNextPuzzle}
            >
              Next Puzzle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlitherLink;