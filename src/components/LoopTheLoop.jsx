import React, { useState, useEffect } from 'react';
import { puzzles } from '../assets/good';

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up">
      {message}
    </div>
  );
};

const LoopTheLoop = () => {
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
  // Hint cooldown timer
  const [hintCooldown, setHintCooldown] = useState(0);
  // Toast message
  const [toast, setToast] = useState(null);

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

  const showToast = (msg) => {
    setToast(msg);
  };

  const clearToast = () => {
    setToast(null);
  };

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
      showToast('Incorrect: Different number of lines than the solution.');
      return;
    }

    for (const userLine of lines) {
      if (!solutionSet.has(userLine)) {
        showToast('Incorrect: One or more lines do not match the solution.');
        return;
      }
    }
    showToast('Correct! Your solution matches perfectly.');
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
    showToast('Solution revealed.');
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

  const handleHint = () => {
    if (hintCooldown > 0 || showingSolution) return;

    const solutionSet = new Set();
    for (const { a, b } of currentPuzzle.solution) {
      const [r1, c1] = a;
      const [r2, c2] = b;
      solutionSet.add(getLineKey(r1, c1, r2, c2));
    }

    // First, remove any incorrect lines
    const incorrectLines = new Set();
    for (const line of lines) {
      if (!solutionSet.has(line)) {
        incorrectLines.add(line);
      }
    }

    if (incorrectLines.size > 0) {
      setLines(prev => {
        const newLines = new Set(prev);
        incorrectLines.forEach(line => newLines.delete(line));
        return newLines;
      });
      showToast('Removed incorrect lines.');
      return;
    }

    // If no incorrect lines, add one correct line
    const correctLines = Array.from(solutionSet).filter(line => !lines.has(line));
    if (correctLines.length > 0) {
      const randomCorrectLine = correctLines[Math.floor(Math.random() * correctLines.length)];
      setLines(prev => new Set([...prev, randomCorrectLine]));
      showToast('Added a correct line.');
    }

    // Start cooldown
    setHintCooldown(10);
    const timer = setInterval(() => {
      setHintCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Reset hint cooldown when changing puzzles
  useEffect(() => {
    setHintCooldown(0);
  }, [puzzleIndex]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        {message && (
          <div className="mb-4 p-4 bg-yellow-100 text-gray-800 rounded-lg">
            {message}
          </div>
        )}

        {/* Puzzle Grid Container */}
        <div className="w-[300px] h-[300px] flex justify-center items-center mb-6">
          <div className="relative bg-white p-4 rounded-lg shadow-inner">
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
                      style={{ width: `${300/GRID_SIZE}px`, height: `${300/GRID_SIZE}px` }}
                    >
                      {clue !== null && (
                        <span
                          className={`absolute inset-0 flex items-center justify-center text-xl font-semibold select-none ${
                            exceed ? 'text-red-600' : (count === clue && clue !== 0) ? 'text-green-600' : ''
                          }`}
                        >
                          {clue}
                        </span>
                      )}

                      {/* Top edge: (row,col) -> (row,col+1) */}
                      <button
                        className={`absolute top-0 left-0 right-0 h-1.5 cursor-pointer ${
                          hasLine(row, col, row, col + 1)
                            ? 'bg-blue-600'
                            : 'bg-gray-300 hover:bg-blue-400'
                        }`}
                        onClick={() => toggleLine(row, col, row, col + 1)}
                      />

                      {/* Left edge: (row,col) -> (row+1,col) */}
                      <button
                        className={`absolute top-0 left-0 bottom-0 w-1.5 cursor-pointer ${
                          hasLine(row, col, row + 1, col)
                            ? 'bg-blue-600'
                            : 'bg-gray-300 hover:bg-blue-400'
                        }`}
                        onClick={() => toggleLine(row, col, row + 1, col)}
                      />

                      {/* Right edge: (row,col+1) -> (row+1,col+1) for the last col */}
                      {col === GRID_SIZE - 1 && (
                        <button
                          className={`absolute top-0 right-0 bottom-0 w-1.5 cursor-pointer ${
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
                          className={`absolute bottom-0 left-0 right-0 h-1.5 cursor-pointer ${
                            hasLine(row + 1, col, row + 1, col + 1)
                              ? 'bg-blue-600'
                              : 'bg-gray-300 hover:bg-blue-400'
                          }`}
                          onClick={() => toggleLine(row + 1, col, row + 1, col + 1)}
                        />
                      )}

                      {/* Dots in corners */}
                      <div className="absolute top-0.5 left-0.5 w-2.5 h-2.5 -ml-[5px] -mt-[5px] bg-black rounded-full shadow-sm" />
                      {col === GRID_SIZE - 1 && (
                        <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 -mr-[5px] -mt-[5px] bg-black rounded-full shadow-sm" />
                      )}
                      {row === GRID_SIZE - 1 && (
                        <div className="absolute bottom-0.5 left-0.5 w-2.5 h-2.5 -ml-[5px] -mb-[5px] bg-black rounded-full shadow-sm" />
                      )}
                      {row === GRID_SIZE - 1 && col === GRID_SIZE - 1 && (
                        <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 -mr-[5px] -mb-[5px] bg-black rounded-full shadow-sm" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Add a puzzle counter */}
        <div className="mt-4 text-center text-gray-600 select-none">
          Puzzle #{puzzleIndex + 1} 
        </div>
      </div>

      {/* Buttons Container */}
      <div className="mt-4 flex gap-2 justify-center flex-wrap">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors select-none"
          onClick={checkSolution}
          disabled={showingSolution}
        >
          Check
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors select-none"
          onClick={showSolution}
          disabled={showingSolution}
        >
          Reveal
        </button>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors select-none"
          onClick={resetPuzzle}
        >
          Reset
        </button>
        <button
          className={`px-4 py-2 rounded transition-colors select-none ${
            hintCooldown > 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          }`}
          onClick={handleHint}
          disabled={hintCooldown > 0 || showingSolution}
        >
          {hintCooldown > 0 ? `Hint (${hintCooldown}s)` : 'Hint'}
        </button>
        <button
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors select-none"
          onClick={handleRefreshPuzzle}
        >
          New Puzzle
        </button>
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast} onClose={clearToast} />}

      {/* Next Puzzle Popup */}
      {showNextPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-center select-none">Congratulations!</h2>
            <p className="text-center mb-6 select-none">You've solved the puzzle correctly!</p>
            <button
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors select-none"
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

export default LoopTheLoop;