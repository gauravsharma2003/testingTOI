import React, { useState, useEffect } from 'react';
import { miniSudoku } from '../assets/minisudoku';

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

const Sudoku = () => {
  // Track which puzzle is currently active - initialize with random index
  const [puzzleIndex, setPuzzleIndex] = useState(Math.floor(Math.random() * miniSudoku.length));
  const currentPuzzle = miniSudoku[puzzleIndex];
  const GRID_SIZE = currentPuzzle.dim[0];

  // User's current solution
  const [userSolution, setUserSolution] = useState(
    Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0))
  );
  // Whether the solution is currently revealed
  const [showingSolution, setShowingSolution] = useState(false);
  // Show popup for next puzzle
  const [showNextPopup, setShowNextPopup] = useState(false);
  // Hint cooldown timer
  const [hintCooldown, setHintCooldown] = useState(0);
  // Toast message
  const [toast, setToast] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null); // [row, col] or null

  // Initialize user solution with given numbers
  useEffect(() => {
    const newSolution = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    currentPuzzle.numbers.forEach(({ r, c, n }) => {
      newSolution[r - 1][c - 1] = n;
    });
    setUserSolution(newSolution);
  }, [puzzleIndex, currentPuzzle]);

  const showToast = (msg) => {
    setToast(msg);
  };

  const clearToast = () => {
    setToast(null);
  };

  const handleCellChange = (row, col, value) => {
    if (showingSolution) return;
    
    // Check if this cell has a given number
    const isGiven = currentPuzzle.numbers.some(
      (item) => item.r === row + 1 && item.c === col + 1
    );
    
    if (isGiven) return;

    setUserSolution(prev => {
      const newSolution = prev.map(row => [...row]);
      newSolution[row][col] = value;
      return newSolution;
    });
  };

  const handleCellClick = (row, col) => {
    if (showingSolution) return;
    
    // Check if this cell has a given number
    const isGiven = currentPuzzle.numbers.some(
      (item) => item.r === row + 1 && item.c === col + 1
    );
    
    if (isGiven) return;

    setSelectedCell([row, col]);
  };

  const handleNumberSelect = (number) => {
    if (!selectedCell) return;
    
    const [row, col] = selectedCell;
    handleCellChange(row, col, number);
    setSelectedCell(null);
  };

  const checkSolution = () => {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (userSolution[i][j] !== currentPuzzle.solution[i][j]) {
          showToast('Incorrect solution. Keep trying!');
          return;
        }
      }
    }
    showToast('Correct! Well done!');
    setShowNextPopup(true);
  };

  const showSolution = () => {
    setUserSolution(currentPuzzle.solution);
    setShowingSolution(true);
    showToast('Solution revealed.');
  };

  const resetPuzzle = () => {
    const newSolution = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    currentPuzzle.numbers.forEach(({ r, c, n }) => {
      newSolution[r - 1][c - 1] = n;
    });
    setUserSolution(newSolution);
    setShowingSolution(false);
  };

  const handleNextPuzzle = () => {
    setPuzzleIndex((prev) => {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * miniSudoku.length);
      } while (nextIndex === prev);
      return nextIndex;
    });
    setShowingSolution(false);
    setShowNextPopup(false);
  };

  const handleRefreshPuzzle = () => {
    setPuzzleIndex((prev) => {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * miniSudoku.length);
      } while (nextIndex === prev);
      return nextIndex;
    });
    setShowingSolution(false);
  };

  const handleHint = () => {
    if (hintCooldown > 0 || showingSolution) return;

    // First, find cells with wrong numbers
    const wrongCells = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (userSolution[i][j] !== 0 && userSolution[i][j] !== currentPuzzle.solution[i][j]) {
          wrongCells.push([i, j]);
        }
      }
    }

    // If there are wrong numbers, remove one randomly
    if (wrongCells.length > 0) {
      const [row, col] = wrongCells[Math.floor(Math.random() * wrongCells.length)];
      setUserSolution(prev => {
        const newSolution = prev.map(row => [...row]);
        newSolution[row][col] = 0;
        return newSolution;
      });
      showToast('Removed a wrong number.');
    } else {
      // If no wrong numbers, find an empty cell and add a correct number
      const emptyCells = [];
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          if (userSolution[i][j] === 0) {
            emptyCells.push([i, j]);
          }
        }
      }

      if (emptyCells.length > 0) {
        const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        setUserSolution(prev => {
          const newSolution = prev.map(row => [...row]);
          newSolution[row][col] = currentPuzzle.solution[row][col];
          return newSolution;
        });
        showToast('Added a correct number.');
      }
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
        {/* Puzzle Grid Container */}
        <div className="w-[400px] h-[400px] flex justify-center items-center mb-6">
          <div className="grid grid-cols-4 grid-rows-4 gap-0 bg-black p-1 rounded-lg w-full h-full">
            {Array.from({ length: GRID_SIZE }, (_, row) => (
              Array.from({ length: GRID_SIZE }, (_, col) => {
                const value = userSolution[row][col];
                const isGiven = currentPuzzle.numbers.some(
                  (item) => item.r === row + 1 && item.c === col + 1
                );
                const isBoxStart = row % 2 === 0 && col % 2 === 0;
                const isSelected = selectedCell && selectedCell[0] === row && selectedCell[1] === col;

                return (
                  <div
                    key={`${row}-${col}`}
                    className={`relative bg-white ${
                      isBoxStart ? 'border-t-2 border-l-2' : ''
                    } border border-gray-300`}
                  >
                    {isSelected ? (
                      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 bg-white z-10">
                        {[1, 2, 3, 4].map((num) => (
                          <button
                            key={num}
                            onClick={() => handleNumberSelect(num)}
                            className="flex items-center justify-center text-xl font-semibold hover:bg-blue-100 transition-colors select-none"
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center text-2xl font-semibold select-none ${
                          isGiven ? 'bg-zinc-200' : 'cursor-pointer'
                        }`}
                        onClick={() => handleCellClick(row, col)}
                      >
                        {value || ''}
                      </div>
                    )}
                  </div>
                );
              })
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

export default Sudoku;