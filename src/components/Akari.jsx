import React, { useState, useEffect } from 'react';
import { akari } from '../assets/akari';

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

const Akari = () => {
  // Track which puzzle is currently active - initialize with random index
  const [puzzleIndex, setPuzzleIndex] = useState(Math.floor(Math.random() * akari.length));
  const currentPuzzle = akari[puzzleIndex];
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
  
  // Illuminated cells
  const [illuminatedCells, setIlluminatedCells] = useState([]);

  // Add state for invalid bulb positions
  const [invalidBulbs, setInvalidBulbs] = useState([]);

  // Add state for wall number statuses
  const [wallNumberStatuses, setWallNumberStatuses] = useState({});

  // Initialize user solution with walls
  useEffect(() => {
    const newSolution = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    
    // Place walls
    currentPuzzle.walls.forEach(({ x, y }) => {
      newSolution[y][x] = 1; // 1 for wall
    });
    
    setUserSolution(newSolution);
    setIlluminatedCells([]);
  }, [puzzleIndex, currentPuzzle]);

  const showToast = (msg) => {
    setToast(msg);
  };

  const clearToast = () => {
    setToast(null);
  };

  const handleCellClick = (row, col) => {
    if (showingSolution) return;
    
    // Check if this cell is a wall
    const isWall = currentPuzzle.walls.some(
      (item) => item.x === col && item.y === row
    );
    
    if (isWall) return;

    setUserSolution(prev => {
      const newSolution = prev.map(row => [...row]);
      const currentValue = newSolution[row][col];
      
      // Cycle through states: 0 -> 2 (bulb) -> 3 (cross) -> 0
      if (currentValue === 0) {
        newSolution[row][col] = 2; // Place bulb
      } else if (currentValue === 2) {
        newSolution[row][col] = 3; // Place cross
      } else if (currentValue === 3) {
        newSolution[row][col] = 0; // Remove cross
      }
      
      return newSolution;
    });

    // Recalculate illuminated cells and invalid bulbs after placing a bulb
    updateIlluminatedCells();
    updateInvalidBulbs();
  };

  // Update illuminated cells based on current bulb positions
  const updateIlluminatedCells = () => {
    const illuminated = [];
    
    // Check each cell in the grid
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        // If this is a bulb, mark all cells it illuminates
        if (userSolution[row][col] === 2) {
          // Mark the bulb cell
          illuminated.push(`${row}-${col}`);
          
          // Check in all 4 directions
          const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // right, down, left, up
          
          for (const [dx, dy] of directions) {
            let newRow = row + dy;
            let newCol = col + dx;
            
            // Continue in this direction until we hit a wall or the edge
            while (
              newRow >= 0 && newRow < GRID_SIZE && 
              newCol >= 0 && newCol < GRID_SIZE && 
              userSolution[newRow][newCol] !== 1
            ) {
              // Include both empty cells and cross cells in illumination
              if (userSolution[newRow][newCol] === 0 || userSolution[newRow][newCol] === 3) {
                illuminated.push(`${newRow}-${newCol}`);
              }
              newRow += dy;
              newCol += dx;
            }
          }
        }
      }
    }
    
    setIlluminatedCells([...new Set(illuminated)]); // Remove duplicates
  };

  // Update invalid bulbs based on current bulb positions
  const updateInvalidBulbs = () => {
    const invalid = [];
    
    // Check each cell in the grid
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        // If this is a bulb, check if it can see any other bulb
        if (userSolution[row][col] === 2) {
          // Check in all 4 directions
          const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // right, down, left, up
          
          for (const [dx, dy] of directions) {
            let newRow = row + dy;
            let newCol = col + dx;
            
            // Continue in this direction until we hit a wall or the edge
            while (
              newRow >= 0 && newRow < GRID_SIZE && 
              newCol >= 0 && newCol < GRID_SIZE && 
              userSolution[newRow][newCol] !== 1
            ) {
              // If we see another bulb, mark both bulbs as invalid
              if (userSolution[newRow][newCol] === 2) {
                invalid.push(`${row}-${col}`);
                invalid.push(`${newRow}-${newCol}`);
              }
              newRow += dy;
              newCol += dx;
            }
          }
        }
      }
    }
    
    setInvalidBulbs([...new Set(invalid)]); // Remove duplicates
  };

  // Update wall number statuses whenever user solution changes
  useEffect(() => {
    const newStatuses = {};
    currentPuzzle.numbers.forEach(({ x, y, n }) => {
      const adjacentCells = [
        [y-1, x], [y+1, x], [y, x-1], [y, x+1]
      ].filter(([r, c]) => 
        r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE
      );
      
      const adjacentBulbs = adjacentCells.filter(([r, c]) => userSolution[r][c] === 2).length;
      
      newStatuses[`${y}-${x}`] = adjacentBulbs === n ? 'correct' : 
                                adjacentBulbs > n ? 'incorrect' : 'default';
    });
    setWallNumberStatuses(newStatuses);
  }, [userSolution, currentPuzzle.numbers, GRID_SIZE]);

  // Check if a cell is a wall with a number and get its status
  const getWallNumber = (row, col) => {
    const wallInfo = currentPuzzle.numbers.find(
      (item) => item.x === col && item.y === row
    );
    if (!wallInfo) return null;

    return {
      number: wallInfo.n,
      status: wallNumberStatuses[`${row}-${col}`] || 'default'
    };
  };

  // Check if current solution is valid
  const isValidSolution = () => {
    // Check if all bulbs can see each other
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (userSolution[row][col] === 2) {
          // Check if this bulb can see any other bulb
          const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
          
          for (const [dx, dy] of directions) {
            let newRow = row + dy;
            let newCol = col + dx;
            
            while (
              newRow >= 0 && newRow < GRID_SIZE && 
              newCol >= 0 && newCol < GRID_SIZE
            ) {
              // If we hit a wall, stop checking in this direction
              if (userSolution[newRow][newCol] === 1) {
                break;
              }
              
              // If we see another bulb, this solution is invalid
              if (userSolution[newRow][newCol] === 2) {
                return false;
              }
              
              newRow += dy;
              newCol += dx;
            }
          }
        }
      }
    }
    
    // Check if all walls with numbers have the correct number of adjacent bulbs
    for (const { x, y, n } of currentPuzzle.numbers) {
      const adjacentCells = [
        [y-1, x], [y+1, x], [y, x-1], [y, x+1]
      ].filter(([r, c]) => 
        r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE
      );
      
      const adjacentBulbs = adjacentCells.filter(([r, c]) => userSolution[r][c] === 2).length;
      
      if (adjacentBulbs !== n) {
        return false;
      }
    }
    
    // Check if all empty cells are illuminated
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        // If cell is empty (not a wall or bulb) and not illuminated
        if (userSolution[row][col] === 0 && !illuminatedCells.includes(`${row}-${col}`)) {
          return false;
        }
      }
    }
    
    return true;
  };

  const checkSolution = () => {
    if (isValidSolution()) {
      showToast('Correct! Well done!');
      setShowNextPopup(true);
    } else {
      showToast('Incorrect solution. Keep trying!');
    }
  };

  const showSolution = () => {
    const solutionGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    
    // Place walls
    currentPuzzle.walls.forEach(({ x, y }) => {
      solutionGrid[y][x] = 1;
    });
    
    // Place bulbs from solution
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (currentPuzzle.solution[row][col] === 2) {
          solutionGrid[row][col] = 2;
        }
      }
    }
    
    setUserSolution(solutionGrid);
    setShowingSolution(true);
    updateIlluminatedCells();
    showToast('Solution revealed.');
  };

  const resetPuzzle = () => {
    const newSolution = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    
    // Place walls
    currentPuzzle.walls.forEach(({ x, y }) => {
      newSolution[y][x] = 1;
    });
    
    setUserSolution(newSolution);
    setShowingSolution(false);
    setIlluminatedCells([]);
  };

  const handleNextPuzzle = () => {
    setPuzzleIndex((prev) => {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * akari.length);
      } while (nextIndex === prev && akari.length > 1);
      return nextIndex;
    });
    setShowingSolution(false);
    setShowNextPopup(false);
  };

  const handleRefreshPuzzle = () => {
    setPuzzleIndex((prev) => {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * akari.length);
      } while (nextIndex === prev && akari.length > 1);
      return nextIndex;
    });
    setShowingSolution(false);
  };

  const handleHint = () => {
    if (hintCooldown > 0 || showingSolution) return;

    // First, find if any bulbs are incorrectly placed (can see each other)
    let hintGiven = false;
    
    // Check all bulbs to see if any can see each other
    for (let row = 0; row < GRID_SIZE && !hintGiven; row++) {
      for (let col = 0; col < GRID_SIZE && !hintGiven; col++) {
        if (userSolution[row][col] === 2) {
          // Check if this bulb can see any other bulb
          const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
          
          for (const [dx, dy] of directions) {
            let newRow = row + dy;
            let newCol = col + dx;
            
            while (
              newRow >= 0 && newRow < GRID_SIZE && 
              newCol >= 0 && newCol < GRID_SIZE && 
              !hintGiven
            ) {
              // If we hit a wall, stop checking in this direction
              if (userSolution[newRow][newCol] === 1) {
                break;
              }
              
              // If we see another bulb, remove this one as a hint
              if (userSolution[newRow][newCol] === 2) {
                setUserSolution(prev => {
                  const newSolution = prev.map(row => [...row]);
                  newSolution[row][col] = 0;
                  return newSolution;
                });
                
                showToast('Removed a bulb that can see another bulb.');
                hintGiven = true;
                break;
              }
              
              newRow += dy;
              newCol += dx;
            }
          }
        }
      }
    }
    
    // If no bulbs can see each other, check if any walls have wrong number of bulbs
    if (!hintGiven) {
      for (const { x, y, n } of currentPuzzle.numbers) {
        const adjacentCells = [
          [y-1, x], [y+1, x], [y, x-1], [y, x+1]
        ].filter(([r, c]) => 
          r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE
        );
        
        const adjacentBulbs = adjacentCells.filter(([r, c]) => userSolution[r][c] === 2).length;
        
        if (adjacentBulbs > n) {
          // Too many bulbs, remove one
          const bulbPositions = adjacentCells.filter(([r, c]) => userSolution[r][c] === 2);
          const [removeRow, removeCol] = bulbPositions[Math.floor(Math.random() * bulbPositions.length)];
          
          setUserSolution(prev => {
            const newSolution = prev.map(row => [...row]);
            newSolution[removeRow][removeCol] = 0;
            return newSolution;
          });
          
          showToast(`Removed a bulb. Wall at (${x+1},${y+1}) should have ${n} bulbs.`);
          hintGiven = true;
          break;
        }
      }
    }
    
    // If still no hint given, add a correct bulb
    if (!hintGiven) {
      const solutionBulbs = [];
      
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (currentPuzzle.solution[row][col] === 2 && userSolution[row][col] !== 2) {
            solutionBulbs.push([row, col]);
          }
        }
      }
      
      if (solutionBulbs.length > 0) {
        const [row, col] = solutionBulbs[Math.floor(Math.random() * solutionBulbs.length)];
        
        setUserSolution(prev => {
          const newSolution = prev.map(r => [...r]);
          newSolution[row][col] = 2;
          return newSolution;
        });
        
        showToast('Added a correct bulb position.');
        hintGiven = true;
      }
    }
    
    // Start cooldown and update illuminated cells
    updateIlluminatedCells();
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

  // Update illuminated cells whenever user solution changes
  useEffect(() => {
    updateIlluminatedCells();
    updateInvalidBulbs();
  }, [userSolution]);

  // Get cell class based on its state
  const getCellClass = (row, col) => {
    const isWall = userSolution[row][col] === 1;
    const isBulb = userSolution[row][col] === 2;
    const isCross = userSolution[row][col] === 3;
    const isIlluminated = illuminatedCells.includes(`${row}-${col}`);
    
    if (isWall) {
      return "bg-gray-800";
    } else if (isIlluminated) {
      return "bg-yellow-100";
    } else if (isCross) {
      return "bg-white";
    }
    return "bg-white";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-4">Akari (Light Up)</h1>
        
        {/* Puzzle Grid Container */}
        <div className="w-[400px] h-[400px] flex justify-center items-center mb-6">
          <div className="grid grid-cols-7 grid-rows-7 gap-0 bg-black p-1 rounded-lg w-full h-full select-none">
            {Array.from({ length: GRID_SIZE }, (_, row) => (
              Array.from({ length: GRID_SIZE }, (_, col) => {
                const wallNumber = getWallNumber(row, col);
                const cellClass = getCellClass(row, col);
                const isInvalid = invalidBulbs.includes(`${row}-${col}`);

                return (
                  <div
                    key={`${row}-${col}`}
                    className={`relative border border-gray-300 flex items-center justify-center ${cellClass}`}
                    onClick={() => handleCellClick(row, col)}
                  >
                    {wallNumber !== null && (
                      <span className={`${
                        wallNumber.status === 'correct' ? 'text-green-400' :
                        wallNumber.status === 'incorrect' ? 'text-red-400' :
                        'text-white'
                      }`}>
                        {wallNumber.number}
                      </span>
                    )}
                    {userSolution[row][col] === 2 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-6 h-6 rounded-full shadow-lg ${isInvalid ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                      </div>
                    )}
                    {userSolution[row][col] === 3 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 flex items-center justify-center text-gray-600 text-xl">×</div>
                      </div>
                    )}
                  </div>
                );
              })
            ))}
          </div>
        </div>

        {/* Add a puzzle counter */}
        <div className="mt-4 text-center text-gray-600">
          Puzzle #{puzzleIndex + 1}
        </div>
      </div>

      {/* Buttons Container */}
      <div className="mt-4 flex gap-2 justify-center flex-wrap">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={checkSolution}
          disabled={showingSolution}
        >
          Check
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={showSolution}
          disabled={showingSolution}
        >
          Reveal
        </button>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          onClick={resetPuzzle}
        >
          Reset
        </button>
        <button
          className={`px-4 py-2 rounded transition-colors ${
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
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
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

export default Akari;
