import React, { useState, useEffect } from 'react';
import { RefreshCw, Lightbulb } from 'lucide-react';

const MemoryMan = () => {
  const [cards, setCards] = useState([]);
  const [gameState, setGameState] = useState('preparing');
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(Array(10).fill('default'));
  const [showNumbers, setShowNumbers] = useState(false);
  
  useEffect(() => {
    resetGame();
  }, []);
  
  const resetGame = () => {
    const gridLayout = [
      { x: 5, y: 5 }, { x: 35, y: 5 }, { x: 65, y: 5 },
      { x: 0, y: 35 }, { x: 30, y: 35 }, { x: 60, y: 35 }, { x: 90, y: 35 },
      { x: 5, y: 65 }, { x: 35, y: 65 }, { x: 65, y: 65 }
    ];
    
    const shuffledPositions = [...gridLayout].sort(() => Math.random() - 0.5);
    
    const newCards = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      number: i + 1,
      position: shuffledPositions[i],
      flipped: false,
      temporarilyFlipped: false
    }));
    
    setCards(newCards);
    setGameState('preparing');
    setCurrentStep(1);
    setProgress(Array(10).fill('default'));
    setShowNumbers(true);
    
    setTimeout(() => {
      setShowNumbers(false);
      setGameState('playing');
      setCards(cards => cards.map(card => ({
        ...card,
        flipped: false
      })));
    }, 2000);
  };
  
  const handleCardClick = (cardId) => {
    if (gameState !== 'playing') return;
    
    if (cardId === currentStep) {
      // Correct card selected
      const newProgress = [...progress];
      newProgress[currentStep - 1] = 'correct';
      setProgress(newProgress);
      
      setCards(cards.map(card => 
        card.id === cardId ? { ...card, flipped: true } : card
      ));
      
      if (currentStep === 10) {
        setGameState('won');
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      // Wrong card selected - show the clicked card temporarily
      setCards(cards.map(card => 
        card.id === cardId ? { ...card, temporarilyFlipped: true } : card
      ));
      
      // After 1 second, reset all cards
      setTimeout(() => {
        setCards(cards.map(card => ({
          ...card,
          temporarilyFlipped: false,
          flipped: false
        })));
        setProgress(Array(10).fill('default'));
        setCurrentStep(1);
      }, 2000);
    }
  };
  
  return (
    <div className="relative w-full select-none h-screen bg-zinc-900 overflow-hidden flex flex-col">
      {/* Header with buttons */}
      <div className="w-full px-4 py-2 bg-zinc-900 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Memory Man</h1>
        <button 
          onClick={resetGame}
          className="p-2 rounded-full hover:bg-zinc-700 text-white"
        >
          <RefreshCw size={20} />
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="w-full px-4 select-none py-2 bg-zinc-900 flex justify-center space-x-2">
        {progress.map((state, idx) => (
          <div 
            key={idx} 
            className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white 
              ${state === 'default' ? 'bg-gray-600' : 
                state === 'correct' ? 'bg-yellow-500' : 'bg-gray-400'}`}
          >
            {idx + 1}
          </div>
        ))}
      </div>
      
      {/* Game area */}
      <div className="flex-1 relative px-6 sm:px-0 flex items-center justify-center">
        <div className="relative w-full max-w-3xl h-full">
          {cards.map(card => (
            <div
              key={card.id}
              className={`absolute cursor-pointer transform transition-all duration-300 w-12 h-16 sm:w-16 sm:h-24 rounded-lg 
                ${(!card.flipped && !card.temporarilyFlipped && !showNumbers) ? 'bg-blue-500' : 'bg-white text-gray-800'}`}
              style={{
                left: `${card.position.x}%`,
                top: `${card.position.y}%`,
                transform: (!card.flipped && !card.temporarilyFlipped && !showNumbers) ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
              onClick={() => handleCardClick(card.id)}
            >
              <div className="h-full w-full flex items-center justify-center text-2xl sm:text-3xl font-bold">
                {(card.flipped || card.temporarilyFlipped || showNumbers) ? card.number : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {gameState === 'won' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white p-4 rounded-lg text-center">
          <p className="text-2xl font-bold">Congratulations!</p>
          <p className="text-xl">You won the game!</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={resetGame}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default MemoryMan;