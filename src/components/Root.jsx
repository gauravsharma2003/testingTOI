import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import gameConfig from '../../gameconfig.json'

function Root() {
  const [selectedGame, setSelectedGame] = useState(null);

  return (
    <div className="min-h-screen select-none bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header with Logo */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-800"> Toi app product team </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-center text-gray-700 mb-12">
            Choose Your Game
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {gameConfig.map((game) => (
              <div 
                key={game.name} 
                className="rounded-xl shadow-lg overflow-hidden transform transition-transform hover:scale-105"
                style={{ backgroundColor: `${game.gamecolor}10` }}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {game.image ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden">
                          <img 
                            src={game.image} 
                            alt={game.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${game.gamecolor}20` }}>
                          <span className="text-xl font-bold" style={{ color: game.gamecolor }}>{game.name[0]}</span>
                        </div>
                      )}
                      <h3 className="text-xl font-semibold" style={{ color: game.gamecolor }}>{game.name}</h3>
                    </div>
                    <div className="relative">
                      <button 
                        className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white text-black hover:text-gray-800"
                        onMouseEnter={(e) => {
                          e.currentTarget.nextElementSibling.classList.remove('invisible', 'opacity-0');
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.nextElementSibling.classList.add('invisible', 'opacity-0');
                        }}
                        onClick={() => setSelectedGame(game)}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="w-4 h-4"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </button>
                      <div className="absolute right-0 mt-1 w-32 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 invisible transition-all duration-200 z-10">
                        How to Play
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6">
                    {game.description}
                  </p>
                  <Link 
                    to={`/${game.link}`}
                    className="block w-full text-center px-6 py-3 rounded-lg transition-colors font-medium"
                    style={{ 
                      backgroundColor: game.gamecolor,
                      color: 'white'
                    }}
                  >
                    {game.playcta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* How to Play Popup */}
      {selectedGame && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={() => setSelectedGame(null)}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold" style={{ color: selectedGame.gamecolor }}>How to Play {selectedGame.name}</h3>
              <button 
                onClick={() => setSelectedGame(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              {selectedGame.howtoplay.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default Root; 