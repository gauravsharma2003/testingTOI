import React, { useState, useEffect } from 'react';
import { RefreshCw, Lightbulb } from 'lucide-react';
import wordrow from '../assets/wordrow.json';

const WordRow = () => {
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [guessedLetters, setGuessedLetters] = useState({});
  const [guessCount, setGuessCount] = useState({});
  const [gameWon, setGameWon] = useState(false);
  const [keyboardLetters, setKeyboardLetters] = useState({});
  const [typedKey, setTypedKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [crossingWords, setCrossingWords] = useState([]);
  const [gridSize, setGridSize] = useState({ rows: 10, cols: 10 });
  const [hintCooldown, setHintCooldown] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);

  // Initialize the game
  useEffect(() => {
    initializeGame();
  }, []);

  // Handle hint cooldown timer
  useEffect(() => {
    let timerId;
    if (hintCooldown > 0) {
      timerId = setInterval(() => {
        setHintCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [hintCooldown]);

  const initializeGame = () => {
    // Reset game state
    setGuessedLetters({});
    setGuessCount({});
    setSelectedCell(null);
    setGameWon(false);
    setKeyboardLetters({});
    setTypedKey(null);
    setHintCooldown(0);
    setHintUsed(false);
    
    // Select a random puzzle from the data
    const puzzleIndex = Math.floor(Math.random() * wordrow.length);
    setCurrentPuzzleIndex(puzzleIndex);
    
    // Generate a new puzzle using the JSON data
    createNewPuzzle(puzzleIndex);
  };

  const handleHint = () => {
    if (hintCooldown > 0 || hintUsed) return;

    const middleRow = Math.floor(gridSize.rows / 2);
    const startCol = Math.floor((gridSize.cols - currentPuzzle.final_word.length) / 2);
    const endCol = startCol + currentPuzzle.final_word.length - 1;

    // Create a new guessed letters object
    const newGuessedLetters = { ...guessedLetters };
    let hintApplied = false;
    let hintCol = null;

    // First try to find an incorrectly guessed letter
    for (let c = startCol; c <= endCol; c++) {
      const guessedLetter = guessedLetters[`${middleRow}-${c}`];
      const correctLetter = grid[middleRow][c];
      if (guessedLetter && guessedLetter !== correctLetter) {
        // Replace the incorrect letter with the correct one
        newGuessedLetters[`${middleRow}-${c}`] = correctLetter;
        hintApplied = true;
        hintCol = c;
        break;
      }
    }

    // If no incorrect letters found, reveal an unguessed letter
    if (!hintApplied) {
      for (let c = startCol; c <= endCol; c++) {
        if (!guessedLetters[`${middleRow}-${c}`]) {
          // Reveal the letter
          newGuessedLetters[`${middleRow}-${c}`] = grid[middleRow][c];
          hintApplied = true;
          hintCol = c;
          break;
        }
      }
    }

    // Only update state if a hint was applied
    if (hintApplied) {
      setGuessedLetters(newGuessedLetters);
      setHintCooldown(20);
      setHintUsed(true);

      // Find the next unguessed cell after the hint
      let nextCol = null;
      for (let c = startCol; c <= endCol; c++) {
        if (!newGuessedLetters[`${middleRow}-${c}`] || newGuessedLetters[`${middleRow}-${c}`] !== grid[middleRow][c]) {
          nextCol = c;
          break;
        }
      }

      // If we found a next unguessed cell, select it
      if (nextCol !== null) {
        setKeyboardLetters({});
        setSelectedCell({ row: middleRow, col: nextCol });
      }
    }
  };

  // Create puzzle from the provided JSON data
  const createNewPuzzle = (puzzleIndex) => {
    setIsLoading(true);
    
    // Get the puzzle from the JSON data
    const puzzle = wordrow[puzzleIndex];
    setCurrentPuzzle(puzzle);
    
    // Extract the target word (final_word)
    const targetWord = puzzle.final_word.toUpperCase();
    
    // Extract crossing words
    const words = [];
    for (let i = 1; i <= targetWord.length; i++) {
      const wordKey = `word${i}`;
      if (puzzle[wordKey]) {
        words.push({
          word: puzzle[wordKey].toUpperCase(),
          letterIndex: i - 1
        });
      }
    }
    setCrossingWords(words);
    
    // Calculate required grid size based on the longest crossing word
    let maxWordLength = 0;
    for (const { word } of words) {
      maxWordLength = Math.max(maxWordLength, word.length);
    }
    
    // Ensure the grid has enough room for the longest word
    const requiredRows = maxWordLength * 2;
    const requiredCols = Math.max(10, targetWord.length);
    
    // Update grid size
    setGridSize({
      rows: Math.max(requiredRows, 10),
      cols: requiredCols
    });
    
    // Create an empty grid with the calculated size
    const emptyGrid = Array(requiredRows).fill().map(() => Array(requiredCols).fill(null));
    
    // Calculate middle row for the target word
    const middleRow = Math.floor(requiredRows / 2);
    
    // Calculate starting column to center the word
    const startCol = Math.floor((requiredCols - targetWord.length) / 2);
    
    // Place the target word horizontally in the middle
    for (let i = 0; i < targetWord.length; i++) {
      emptyGrid[middleRow][startCol + i] = targetWord[i];
    }
    
    // Place crossing words vertically
    for (let i = 0; i < words.length && i < targetWord.length; i++) {
      const { word, letterIndex } = words[i];
      if (letterIndex >= targetWord.length) continue;
      
      const col = startCol + letterIndex;
      
      // Find position of the matching letter in the crossing word
      const matchingLetterPos = word.indexOf(targetWord[letterIndex]);
      
      if (matchingLetterPos !== -1) {
        // Calculate start row so the matching letter aligns with the target word
        const startRow = middleRow - matchingLetterPos;
        
        // Place the crossing word vertically
        for (let j = 0; j < word.length; j++) {
          const row = startRow + j;
          if (row >= 0 && row < requiredRows && row !== middleRow) {
            emptyGrid[row][col] = word[j];
          }
        }
      }
    }
    
    setGrid(emptyGrid);
    setIsLoading(false);
  };

  const handleCellClick = (row, col) => {
    // Only allow selecting cells in the middle row (target word)
    const middleRow = Math.floor(gridSize.rows / 2);
    if (row === middleRow && grid[row][col] !== null) {
      // Check if this cell has been correctly guessed
      const guessedLetter = guessedLetters[`${row}-${col}`];
      const correctLetter = grid[row][col];
      const isCorrectlyGuessed = guessedLetter === correctLetter;

      if (isCorrectlyGuessed) {
        // Find the next unguessed cell
        const startCol = Math.floor((gridSize.cols - currentPuzzle.final_word.length) / 2);
        const endCol = startCol + currentPuzzle.final_word.length - 1;
        
        for (let c = startCol; c <= endCol; c++) {
          if (!guessedLetters[`${middleRow}-${c}`] || guessedLetters[`${middleRow}-${c}`] !== grid[middleRow][c]) {
            // Reset keyboard state for the new cell
            setKeyboardLetters({});
            setSelectedCell({ row: middleRow, col: c });
            return;
          }
        }
        return;
      }

      // Reset keyboard state when selecting a new cell
      if (!selectedCell || selectedCell.row !== row || selectedCell.col !== col) {
        setKeyboardLetters({});
      }
      setSelectedCell({ row, col });
    }
  };

  const getCellStatus = (row, col) => {
    const letter = grid[row][col];
    const middleRow = Math.floor(gridSize.rows / 2);
    
    if (!letter) return { type: 'empty' };
    
    // If it's the target word row
    if (row === middleRow) {
      if (selectedCell && row === selectedCell.row && col === selectedCell.col) {
        return { type: 'selected' };
      }
      
      if (guessedLetters[`${row}-${col}`]) {
        const isCorrect = guessedLetters[`${row}-${col}`] === letter;
        const count = guessCount[`${row}-${col}`] || 0;
        
        if (isCorrect) {
          return { type: 'correct', letter, count };
        } else {
          return { type: 'incorrect', letter: guessedLetters[`${row}-${col}`], count };
        }
      }
      
      return { type: 'unguessed' };
    }
    
    // For crossing words, always show the letters
    return { type: 'crossingWord', letter };
  };

  const handleKeyPress = (e) => {
    if (!selectedCell || gameWon) return;
    
    const { row, col } = selectedCell;
    const key = e.key.toUpperCase();
    
    // Animate the key being pressed on the virtual keyboard
    setTypedKey(key);
    setTimeout(() => {
      setTypedKey(null);
    }, 200);
    
    // Check if it's a valid letter input
    if (/^[A-Z]$/.test(key)) {
      const correctLetter = grid[row][col];
      const isCorrect = key === correctLetter;
      const currentCount = guessCount[`${row}-${col}`] || 0;
      const newCount = currentCount + 1;
      
      // Update keyboard letter status - only for the current cell
      setKeyboardLetters(() => ({
        [key]: { correct: isCorrect, incorrect: !isCorrect }
      }));
      
      setGuessedLetters(prev => ({
        ...prev,
        [`${row}-${col}`]: key
      }));
      
      setGuessCount(prev => ({
        ...prev,
        [`${row}-${col}`]: newCount
      }));
      
      // Move to next cell if correct
      if (isCorrect) {
        // Check if all target word letters are guessed correctly
        const middleRow = Math.floor(gridSize.rows / 2);
        const startCol = Math.floor((gridSize.cols - currentPuzzle.final_word.length) / 2);
        const endCol = startCol + currentPuzzle.final_word.length - 1;
        
        let allCorrect = true;
        for (let c = startCol; c <= endCol; c++) {
          if (!guessedLetters[`${middleRow}-${c}`] || guessedLetters[`${middleRow}-${c}`] !== grid[middleRow][c]) {
            if (!(row === middleRow && col === c && key === grid[middleRow][c])) {
              allCorrect = false;
              break;
            }
          }
        }
        
        if (allCorrect) {
          setGameWon(true);
        } else {
          // Find next unguessed cell in the target word
          let found = false;
          for (let c = startCol; c <= endCol; c++) {
            if (!guessedLetters[`${middleRow}-${c}`] && !(middleRow === row && c === col)) {
              // Reset keyboard state for the new cell
              setKeyboardLetters({});
              setSelectedCell({ row: middleRow, col: c });
              found = true;
              break;
            }
          }
          
          if (!found) {
            setSelectedCell(null);
          }
        }
      }
    }
  };

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [selectedCell, guessedLetters, guessCount, grid, gameWon, currentPuzzle]);

  // Create a visual keyboard
  const renderKeyboard = () => {
    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];
    
    return (
      <div className="mt-6">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center mb-1">
            {row.map(letter => {
              const letterStatus = keyboardLetters[letter] || { correct: false, incorrect: false };
              let bgColor = 'bg-zinc-700';
              
              if (letterStatus.correct) {
                bgColor = 'bg-green-700';
              } else if (letterStatus.incorrect) {
                bgColor = 'bg-red-700';
              }
              
              return (
                <button
                  key={letter}
                  className={`w-8 h-10 mx-0.5 rounded font-medium ${bgColor} 
                             ${typedKey === letter ? 'transform scale-90' : ''} 
                             transition-transform duration-100`}
                  onClick={() => {
                    if (selectedCell && !gameWon) {
                      handleKeyPress({ key: letter });
                    }
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center bg-zinc-950 items-center h-64">
        <div className="text-center">
          <RefreshCw size={40} className="animate-spin mx-auto mb-4" />
          <p>Loading puzzle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-4">
      <div className="w-full max-w-xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Word Row</h1>
          <div className="flex gap-2">
            <button 
              onClick={handleHint}
              className={`p-2 rounded-full hover:bg-zinc-700 relative ${hintCooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={hintCooldown > 0 || hintUsed}
            >
              <Lightbulb size={20} className={hintUsed ? "text-yellow-500" : ""} />
              {hintCooldown > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {hintCooldown}
                </span>
              )}
            </button>
            <button 
              onClick={initializeGame}
              className="p-2 rounded-full hover:bg-zinc-700"
              disabled={isLoading}
            >
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Game grid */}
        <div className="overflow-auto mb-6">
          <div className="p-2 bg-zinc-800 rounded-lg max-h-128 overflow-y-auto flex justify-center">
            <div 
              className="grid gap-1"
              style={{ 
                gridTemplateColumns: `repeat(${gridSize.cols}, minmax(1.75rem, 1fr))`,
                width: 'fit-content'
              }}
            >
              {Array.from({ length: gridSize.rows }).map((_, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {Array.from({ length: gridSize.cols }).map((_, colIndex) => {
                    const cell = grid[rowIndex][colIndex];
                    const middleRow = Math.floor(gridSize.rows / 2);
                    
                    // If there's no content in this cell
                    if (!cell) {
                      return (
                        <div 
                          key={`${rowIndex}-${colIndex}`}
                          className="w-7 h-9 bg-transparent"
                        />
                      );
                    }
                    
                    const status = getCellStatus(rowIndex, colIndex);
                    
                    let cellClasses = "w-7 h-9 flex items-center justify-center font-bold text-sm select-none";
                    let content = "";
                    
                    if (rowIndex === middleRow) {
                      // Target word cells (horizontal row)
                      cellClasses += " border border-white-500 bg-zinc-950";
                      
                      if (status.type === 'selected') {
                        cellClasses += " bg-zinc-600 border-2 border-blue-500 rounded";
                      } else if (status.type === 'correct') {
                        cellClasses += " bg-green-700 border-green-700 rounded";
                        content = status.letter;
                      } else if (status.type === 'incorrect') {
                        cellClasses += " bg-red-700 border-red-700 rounded";
                        content = status.letter;
                      } else if (status.type === 'unguessed') {
                        cellClasses += " bg-zinc-800 rounded";
                      }
                    } else {
                      // Crossing word cells (vertical)
                      cellClasses += " rounded-full border border-zinc-600 bg-zinc-900 text-zinc-50";
                      content = status.letter;
                    }
                    
                    return (
                      <div 
                        key={`${rowIndex}-${colIndex}`}
                        className={cellClasses}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                      >
                        {content}
                        {(status.type === 'correct' || status.type === 'incorrect') && status.count > 1 && (
                          <span className="absolute text-[10px] bottom-0 right-0 bg-black bg-opacity-50 px-0.5 rounded-bl rounded-tr">
                            {status.count}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Keyboard */}
        {renderKeyboard()}

        {/* Win message */}
        {gameWon && (
          <div className="mt-6 p-4 bg-green-800 rounded-lg text-center">
            <h2 className="text-xl font-bold">Congratulations!</h2>
            <p>The word was: <span className="text-xl font-bold">{currentPuzzle?.final_word.toUpperCase()}</span></p>
            <button 
              onClick={initializeGame}
              className="mt-4 px-4 py-2 bg-green-700 rounded-lg hover:bg-green-600"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordRow;