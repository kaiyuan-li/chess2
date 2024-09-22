import React, { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import ChessBoard from './ChessBoard';

const SERVER_URL = 'http://localhost:3001';

interface GameState {
  board: string[][];
  white: string | null;
  black: string | null;
  currentTurn: 'white' | 'black' | null;
  lastMove: { from: string; to: string } | null;
  isCheckmate: boolean;
}

interface PieceMovementState {
  whiteKingMoved: boolean;
  blackKingMoved: boolean;
  whiteRookAMoved: boolean;
  whiteRookHMoved: boolean;
  blackRookAMoved: boolean;
  blackRookHMoved: boolean;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [gameState, setGameState] = useState<GameState>({ 
    board: [], 
    white: null, 
    black: null, 
    currentTurn: null,
    lastMove: null,
    isCheckmate: false
  });
  const [playerSide, setPlayerSide] = useState<'white' | 'black' | null>(null);
  const [pieceMovement, setPieceMovement] = useState<PieceMovementState>({
    whiteKingMoved: false,
    blackKingMoved: false,
    whiteRookAMoved: false,
    whiteRookHMoved: false,
    blackRookAMoved: false,
    blackRookHMoved: false,
  });

  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnectionStatus('Connected');
      setSocket(newSocket);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionStatus(`Connection error: ${error.message}`);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      setConnectionStatus(`Disconnected: ${reason}`);
      setPlayerSide(null);
    });

    newSocket.on('gameState', (state: GameState) => {
      setGameState(state);
    });

    newSocket.on('sideChosen', (side: 'white' | 'black') => {
      setPlayerSide(side);
    });

    newSocket.on('sideUnavailable', (side: 'white' | 'black') => {
      alert(`The ${side} side is already taken.`);
    });

    newSocket.on('sideGivenUp', () => {
      setPlayerSide(null);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const chooseSide = (side: 'white' | 'black') => {
    if (socket && socket.connected) {
      socket.emit('chooseSide', side);
    } else {
      console.error('Socket not connected');
    }
  };

  const giveUpSeat = () => {
    if (socket && socket.connected && playerSide) {
      socket.emit('giveUpSeat', playerSide);
    } else {
      console.error('Socket not connected or no side chosen');
    }
  };

  const makeMove = (from: string, to: string, isEnPassant: boolean, promotionPiece?: string, castling?: { rookFrom: string, rookTo: string }) => {
    if (socket && socket.connected && playerSide) {
      socket.emit('makeMove', { from, to, isEnPassant, promotionPiece, pieceMovement, castling });
    } else {
      console.error('Socket not connected or no side chosen');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Chess Game</h1>
      <p>Connection status: {connectionStatus}</p>
      
      {gameState.currentTurn && !gameState.isCheckmate && (
        <h2 style={{ color: gameState.currentTurn === 'white' ? 'green' : 'blue' }}>
          Current Turn: {gameState.currentTurn.charAt(0).toUpperCase() + gameState.currentTurn.slice(1)}
        </h2>
      )}
      
      <ChessBoard 
        board={gameState.board}
        playerSide={playerSide} 
        currentTurn={gameState.currentTurn}
        onMove={makeMove}
        lastMove={gameState.lastMove}
        isCheckmate={gameState.isCheckmate}
      />
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => chooseSide('white')} 
          disabled={gameState.white !== null || playerSide !== null || gameState.isCheckmate}
        >
          Choose White
        </button>
        <button 
          onClick={() => chooseSide('black')} 
          disabled={gameState.black !== null || playerSide !== null || gameState.isCheckmate}
        >
          Choose Black
        </button>
        {playerSide && !gameState.isCheckmate && (
          <button onClick={giveUpSeat}>
            Give Up Seat
          </button>
        )}
      </div>
      <div style={{ marginTop: '20px' }}>
        <p>White: {gameState.white ? 'Taken' : 'Available'}</p>
        <p>Black: {gameState.black ? 'Taken' : 'Available'}</p>
        {playerSide && <p>You are playing as: {playerSide}</p>}
        {playerSide && gameState.currentTurn && !gameState.isCheckmate && (
          <p style={{ fontWeight: 'bold' }}>
            {gameState.currentTurn === playerSide ? "It's your turn!" : "Waiting for opponent's move..."}
          </p>
        )}
        {gameState.isCheckmate && (
          <p style={{ fontWeight: 'bold', color: 'red' }}>
            Checkmate! {gameState.currentTurn === 'white' ? 'Black' : 'White'} wins!
          </p>
        )}
      </div>
    </div>
  );
}

export default App;