import React, { useState, useEffect } from 'react';
import whosthat from '../assets/whosthat.json';

function Whosthat() {
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [playerScores, setPlayerScores] = useState([]);
  const [guessesLeft, setGuessesLeft] = useState(3);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showHints, setShowHints] = useState([true, false, false, false, false]);
  const [roundComplete, setRoundComplete] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(1);
  const [wrongGuesses, setWrongGuesses] = useState([]);
  const [fadingOutGuesses, setFadingOutGuesses] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [shuffledOptions, setShuffledOptions] = useState([]);

  const currentPlayer = whosthat.roundsInfo[currentRound];
  const totalRounds = whosthat.roundsInfo.length;

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };

  useEffect(() => {
    // Shuffle the options for the current round
    const options = [...currentPlayer.options];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    setShuffledOptions(options);

    setGuessesLeft(3);
    setSelectedOption(null);
    setShowHints([true, false, false, false, false]);
    setHintsRevealed(1);
    setRoundComplete(false);
    setWrongGuesses([]);
    setFadingOutGuesses([]);
  }, [currentRound, currentPlayer.options]);

  const handleOptionSelect = (option) => {
    if (roundComplete || wrongGuesses.includes(option) || fadingOutGuesses.includes(option)) return;
    
    if (option === currentPlayer.playerName) {
      setSelectedOption(option);
      const currentRoundScore = guessesLeft === 3 ? 100 : 100 - (3 - guessesLeft) * 20;
      setRoundScore(currentRoundScore);
      setScore(score + currentRoundScore);
      setPlayerScores(prev => [...prev, { player: currentPlayer.playerName, score: currentRoundScore }]);
      setRoundComplete(true);
    } else {
      setFadingOutGuesses(prev => [...prev, option]);
      showToast('Wrong guess! A new hint is revealed.');
      
      setTimeout(() => {
        setWrongGuesses(prev => [...prev, option]);
        setFadingOutGuesses(prev => prev.filter(guess => guess !== option));
        setGuessesLeft(guessesLeft - 1);
        
        if (hintsRevealed < currentPlayer.hints.length) {
          setShowHints(prev => {
            const newHints = [...prev];
            newHints[hintsRevealed] = true;
            return newHints;
          });
          setHintsRevealed(prev => prev + 1);
        }
        
        if (guessesLeft <= 1) {
          setRoundScore(0);
          setPlayerScores(prev => [...prev, { player: currentPlayer.playerName, score: 0 }]);
          setRoundComplete(true);
        }
      }, 500);
    }
  };

  const revealNextHint = () => {
    if (hintsRevealed < currentPlayer.hints.length) {
      setShowHints(prev => {
        const newHints = [...prev];
        newHints[hintsRevealed] = true;
        return newHints;
      });
      setHintsRevealed(prev => prev + 1);
    }
  };

  const handleNextRound = () => {
    if (currentRound < totalRounds - 1) {
      setCurrentRound(currentRound + 1);
    }
  };

  const resetGame = () => {
    setCurrentRound(0);
    setScore(0);
    setRoundScore(0);
    setPlayerScores([]);
    setGuessesLeft(3);
    setSelectedOption(null);
    setShowHints([true, false, false, false, false]);
    setRoundComplete(false);
    setHintsRevealed(1);
    setWrongGuesses([]);
    setFadingOutGuesses([]);
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 relative select-none"
      style={{
        backgroundImage: `url(${whosthat.backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70"></div>

      <div className="relative z-10 max-w-4xl w-full p-4 sm:p-8">
        {/* Score and Round Info */}
        <div className="flex flex-row justify-between items-center w-full mb-4 sm:mb-8">
          <div className="text-xl sm:text-2xl font-bold text-white">Score: {score}</div>
          <div className="flex items-center gap-2">
            <div className="text-lg sm:text-xl font-semibold text-white">
              Round {currentRound + 1}/{totalRounds}
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                    i < guessesLeft ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Jersey Display */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="relative inline-block">
            <img 
              src={currentPlayer.jerseyImageUrl} 
              alt="Player Jersey" 
              className="w-48 h-60 sm:w-64 sm:h-80 object-contain drop-shadow-lg"
              key={currentPlayer.playerName}
            />
            <div 
              className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg sm:text-xl font-bold text-white"
            >
              {currentPlayer.teamName}
            </div>
            <div 
              className="absolute top-[55%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl sm:text-6xl font-bold"
              style={{ color: currentPlayer.jerseyTextColor }}
            >
              {currentPlayer.playerNumber}
            </div>
          </div>
        </div>

        {/* Hints Section */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Hints</h3>
          <div className="bg-white/10 rounded-xl p-3 sm:p-4 relative">
            {/* Left Arrow */}
            {hintsRevealed > 1 && (
              <button
                onClick={() => setHintsRevealed(prev => prev - 1)}
                className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-orange-600/80 hover:bg-orange-700 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center transition-colors"
              >
                ←
              </button>
            )}
            
            {/* Right Arrow */}
            {hintsRevealed < currentPlayer.hints.length && showHints[hintsRevealed] && (
              <button
                onClick={() => setHintsRevealed(prev => prev + 1)}
                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-orange-600/80 hover:bg-orange-700 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center transition-colors"
              >
                →
              </button>
            )}

            <div className="min-h-[80px] sm:min-h-[100px] flex items-center justify-center mx-8 sm:mx-10">
              {currentPlayer.hints.map((hint, index) => (
                <div 
                  key={index}
                  className={`w-full transition-all duration-500 ${
                    showHints[index] && index === hintsRevealed - 1 ? 'animate-shimmer' : ''
                  } ${index === hintsRevealed - 1 ? 'block' : 'hidden'}`}
                >
                  <div 
                    className="text-sm sm:text-base text-gray-800 bg-orange-100/90 border-2 border-orange-300 p-3 sm:p-4 rounded-xl"
                    dangerouslySetInnerHTML={{ __html: hint }} 
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-center items-center mt-3 sm:mt-4">
              <div className="flex gap-1 sm:gap-2">
                {currentPlayer.hints.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                      index < hintsRevealed ? 'bg-orange-500' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">
            {roundComplete ? 'Correct Answer' : 'Guess the Player'}
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {roundComplete ? (
              <div className="col-span-2">
                <div className="p-4 sm:p-6 bg-orange-500 text-white rounded-xl text-center text-lg sm:text-xl font-semibold shadow-lg">
                  {currentPlayer.playerName}
                </div>
              </div>
            ) : (
              <>
                {shuffledOptions
                  .filter(option => !wrongGuesses.includes(option))
                  .slice(0, 4)
                  .map((option, index) => (
                    <button
                      key={index}
                      className={`p-2 sm:p-4 rounded-xl text-center transition-all duration-300 transform hover:scale-[1.02] text-sm sm:text-base ${
                        fadingOutGuesses.includes(option)
                          ? 'bg-red-500 text-white animate-fade-out'
                          : selectedOption === option
                            ? option === currentPlayer.playerName
                              ? 'bg-orange-500 text-white shadow-lg'
                              : 'bg-red-500 text-white shadow-lg'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                      onClick={() => handleOptionSelect(option)}
                      disabled={roundComplete || fadingOutGuesses.includes(option)}
                    >
                      {option}
                    </button>
                  ))}
                {shuffledOptions
                  .filter(option => !wrongGuesses.includes(option))
                  .length > 4 && (
                  <div className="col-span-2 flex justify-center">
                    <button
                      key={4}
                      className={`p-2 sm:p-4 rounded-xl text-center transition-all duration-300 transform hover:scale-[1.02] w-1/2 text-sm sm:text-base ${
                        fadingOutGuesses.includes(shuffledOptions[4])
                          ? 'bg-red-500 text-white animate-fade-out'
                          : selectedOption === shuffledOptions[4]
                            ? shuffledOptions[4] === currentPlayer.playerName
                              ? 'bg-orange-500 text-white shadow-lg'
                              : 'bg-red-500 text-white shadow-lg'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                      onClick={() => handleOptionSelect(shuffledOptions[4])}
                      disabled={roundComplete || fadingOutGuesses.includes(shuffledOptions[4])}
                    >
                      {shuffledOptions[4]}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Next/Reset Button */}
        {roundComplete && (
          <div className="text-center">
            <div className="text-xl sm:text-2xl mb-4 sm:mb-6 text-white">Round Score: {roundScore}</div>
            
            {/* Score Summary - Only show at end of game */}
            {currentRound === totalRounds - 1 && (
              <div className="bg-white/10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Game Summary</h3>
                <div className="space-y-2">
                  {playerScores.map((item, index) => (
                    <div 
                      key={index}
                      className="flex justify-between items-center bg-white/5 p-2 sm:p-3 rounded-lg"
                    >
                      <span className="text-white text-sm sm:text-base">{item.player}</span>
                      <span className={`text-lg sm:text-xl font-semibold ${
                        item.score === 0 ? 'text-red-500' : 'text-orange-500'
                      }`}>
                        {item.score} points
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center bg-orange-500/20 p-2 sm:p-3 rounded-lg mt-2">
                    <span className="text-white text-sm sm:text-base font-semibold">Total Score</span>
                    <span className="text-lg sm:text-xl font-bold text-orange-500">{score} points</span>
                  </div>
                </div>
              </div>
            )}

            {currentRound < totalRounds - 1 ? (
              <button
                className="w-full py-3 sm:py-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors text-base sm:text-lg font-semibold shadow-lg"
                onClick={handleNextRound}
              >
                Next Round
              </button>
            ) : (
              <button
                className="w-full py-3 sm:py-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors text-base sm:text-lg font-semibold shadow-lg"
                onClick={resetGame}
              >
                Play Again
              </button>
            )}
          </div>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-out">
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default Whosthat;
