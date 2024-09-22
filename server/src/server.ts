import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

interface PieceMovementState {
  whiteKingMoved: boolean;
  blackKingMoved: boolean;
  whiteRookAMoved: boolean;
  whiteRookHMoved: boolean;
  blackRookAMoved: boolean;
  blackRookHMoved: boolean;
}

interface GameState {
  board: string[][];
  white: string | null;
  black: string | null;
  currentTurn: 'white' | 'black' | null;
  lastMove: { from: string; to: string } | null;
  pieceMovement: PieceMovementState;
}

const initialBoard = [
  ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
  ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
  ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
];

let gameState: GameState = {
  board: JSON.parse(JSON.stringify(initialBoard)), // Deep copy
  white: null,
  black: null,
  currentTurn: null,
  lastMove: null,
  pieceMovement: {
    whiteKingMoved: false,
    blackKingMoved: false,
    whiteRookAMoved: false,
    whiteRookHMoved: false,
    blackRookAMoved: false,
    blackRookHMoved: false,
  }
};

io.on('connection', (socket: Socket) => {
  console.log('A user connected', socket.id);

  socket.emit('gameState', gameState);

  socket.on('chooseSide', (side: 'white' | 'black') => {
    if (gameState[side] === null) {
      gameState[side] = socket.id;
      if (gameState.white && gameState.black && !gameState.currentTurn) {
        gameState.currentTurn = 'white';
      }
      io.emit('gameState', gameState);
      socket.emit('sideChosen', side);
    } else {
      socket.emit('sideUnavailable', side);
    }
  });

  socket.on('giveUpSeat', (side: 'white' | 'black') => {
    if (gameState[side] === socket.id) {
      gameState[side] = null;
      if (!(gameState.white && gameState.black)) {
        gameState.currentTurn = null;
      }
      io.emit('gameState', gameState);
      socket.emit('sideGivenUp');
    }
  });

  socket.on('makeMove', ({ from, to, isEnPassant, promotionPiece, pieceMovement, castling }) => {
    const playerSide = gameState.white === socket.id ? 'white' : 'black';
    if (playerSide === gameState.currentTurn) {
      const [fromRow, fromCol] = from.split(',').map(Number);
      const [toRow, toCol] = to.split(',').map(Number);
      
      // Move the piece
      let piece = gameState.board[fromRow][fromCol];
      gameState.board[toRow][toCol] = piece;
      gameState.board[fromRow][fromCol] = '';

      // Handle castling
      if (castling) {
        const [rookFromRow, rookFromCol] = castling.rookFrom.split(',').map(Number);
        const [rookToRow, rookToCol] = castling.rookTo.split(',').map(Number);
        const rookPiece = gameState.board[rookFromRow][rookFromCol];
        gameState.board[rookToRow][rookToCol] = rookPiece;
        gameState.board[rookFromRow][rookFromCol] = '';
      }

      // Handle pawn promotion
      if (promotionPiece) {
        gameState.board[toRow][toCol] = promotionPiece;
      }

      // Handle en passant capture
      if (isEnPassant) {
        const captureRow = piece === '♙' ? toRow + 1 : toRow - 1;
        gameState.board[captureRow][toCol] = '';
      }

      // Update last move
      gameState.lastMove = { from, to };

      // Update piece movement state
      gameState.pieceMovement = pieceMovement;

      // Switch turns
      gameState.currentTurn = gameState.currentTurn === 'white' ? 'black' : 'white';
      
      io.emit('gameState', gameState);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
    if (gameState.white === socket.id) {
      gameState.white = null;
    } else if (gameState.black === socket.id) {
      gameState.black = null;
    }
    if (!(gameState.white && gameState.black)) {
      gameState.currentTurn = null;
    }
    io.emit('gameState', gameState);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});