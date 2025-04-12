import React, { useState, useEffect } from 'react';
import wire from '../../../wire.json';

const DIRECTIONS = {
  TOP: 0,
  RIGHT: 1,
  BOTTOM: 2,
  LEFT: 3,
};

// For a 90° clockwise rotation, the opposites are:
// top becomes right, right becomes bottom, bottom becomes left, left becomes top.
const rotateConnections = (connections, rotation) => {
  let result = [...connections];
  for (let i = 0; i < rotation; i++) {
    result = [result[3], result[0], result[1], result[2]];
  }
  return result;
};

const oppositeDirection = {
  0: 2,
  1: 3,
  2: 0,
  3: 1,
};

const GRID_SIZE = 5;

// Pattern mapping for different rotations
const PATTERNS = {
  straight: {
    vertical: '│',    // \u2502
    horizontal: '─',  // \u2500
  },
  corner: {
    0: '┌',  // \u250C
    1: '┐',  // \u2510
    2: '┘',  // \u2518
    3: '└',  // \u2514
  }
};

function Circuit() {
  // Initialize grid from the JSON data
  const [grid, setGrid] = useState(() => {
    return wire.grid.map(row => 
      row.map(cell => ({
        ...cell,
        // Ensure patterns are correctly mapped from Unicode
        pattern: cell.type === 'start' ? '⚡' :
                cell.type === 'end' ? '💡' :
                cell.piece === 'straight' ? 
                  (cell.rotation % 2 === 0 ? PATTERNS.straight.vertical : PATTERNS.straight.horizontal) :
                cell.piece === 'corner' ? PATTERNS.corner[cell.rotation] :
                cell.pattern
      }))
    );
  });

  // powered[i][j] will be true if cell (i,j) is receiving power.
  const [powered, setPowered] = useState(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
  );

  // Get the next pattern when rotating a piece
  const getNextPattern = (cell) => {
    if (cell.type === 'start') return '⚡';
    if (cell.type === 'end') return '💡';
    
    if (cell.piece === 'straight') {
      return cell.pattern === PATTERNS.straight.vertical ? 
        PATTERNS.straight.horizontal : PATTERNS.straight.vertical;
    } else if (cell.piece === 'corner') {
      const nextRotation = (cell.rotation + 1) % 4;
      return PATTERNS.corner[nextRotation];
    }
    return cell.pattern;
  };

  // Rotate a cell 90° clockwise if it's not start/end
  const rotateBlock = (i, j) => {
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
      const cell = newGrid[i][j];
      
      // Don't rotate start or end pieces
      if (cell.type === 'start' || cell.type === 'end') return newGrid;
      
      // Update rotation and pattern
      cell.rotation = (cell.rotation + 1) % 4;
      cell.pattern = getNextPattern(cell);
      
      return newGrid;
    });
  };

  // Check if two cells can connect in the given directions
  const canConnect = (cell1, dir1, cell2, dir2) => {
    const conns1 = cell1.connections;
    const conns2 = cell2.connections;
    
    // Get the actual connections after rotation
    const rotated1 = rotateConnections(conns1, cell1.rotation);
    const rotated2 = rotateConnections(conns2, cell2.rotation);
    
    // Check if both cells have connections in the matching directions
    return rotated1[dir1] && rotated2[dir2];
  };

  // Propagate power through the circuit
  const propagatePower = () => {
    const newPowered = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(false));
    const visited = new Set();
    const queue = [[0, 0]];
    
    newPowered[0][0] = true;
    visited.add('0,0');

    while (queue.length > 0) {
      const [i, j] = queue.shift();
      const cell = grid[i][j];

      // Define possible directions and their corresponding neighbor positions
      const directions = [
        { di: -1, dj: 0, from: DIRECTIONS.TOP, to: DIRECTIONS.BOTTOM },     // Up
        { di: 0, dj: 1, from: DIRECTIONS.RIGHT, to: DIRECTIONS.LEFT },      // Right
        { di: 1, dj: 0, from: DIRECTIONS.BOTTOM, to: DIRECTIONS.TOP },      // Down
        { di: 0, dj: -1, from: DIRECTIONS.LEFT, to: DIRECTIONS.RIGHT }      // Left
      ];

      // Check each direction
      for (const { di, dj, from, to } of directions) {
        const ni = i + di;
        const nj = j + dj;
        
        // Skip if out of bounds
        if (ni < 0 || ni >= GRID_SIZE || nj < 0 || nj >= GRID_SIZE) continue;
        
        const key = `${ni},${nj}`;
        // Skip if already visited
        if (visited.has(key)) continue;
        
        const neighbor = grid[ni][nj];
        
        // Check if current cell can connect to neighbor
        if (canConnect(cell, from, neighbor, to)) {
          newPowered[ni][nj] = true;
          visited.add(key);
          queue.push([ni, nj]);
        }
      }
    }
    setPowered(newPowered);
  };

  // Update power propagation every time the grid changes.
  useEffect(() => {
    propagatePower();
  }, [grid]);

  // Check if the end cell (bulb) is receiving power.
  const isCircuitComplete = powered[GRID_SIZE - 1][GRID_SIZE - 1];

  return (
    <div className="min-h-screen select-none bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
        <div className="grid grid-cols-5 gap-1">
          {grid.map((row, i) =>
            row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                onClick={() => rotateBlock(i, j)}
                className={`
                  w-16 h-16 rounded-md flex items-center justify-center cursor-pointer transition-transform duration-200 relative
                  ${powered[i][j] ? 'bg-green-200' : 'bg-white'}
                  ${cell.type === 'start' ? 'border-2 border-green-500' : ''}
                  ${cell.type === 'end' ? 'border-2 border-yellow-500' : ''}
                  ${cell.type === 'wire' ? 'border-2 border-blue-500' : ''}
                `}
                style={{ transform: `rotate(${cell.rotation * 90}deg)` }}
              >
                <div className={`
                  font-mono text-2xl
                  ${cell.type === 'start' ? 'text-green-500' : ''}
                  ${cell.type === 'end' ? 'text-yellow-500' : ''}
                  ${cell.type === 'wire' ? 'text-blue-500' : ''}
                `}>
                  {cell.pattern}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="mt-6 text-2xl font-bold text-gray-800">
        {isCircuitComplete ? 'Circuit Complete! 💡' : 'Complete the Circuit!'}
      </div>
    </div>
  );
}

export default Circuit;
