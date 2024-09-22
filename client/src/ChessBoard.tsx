import React, { useState } from 'react';

interface ChessBoardProps {
  board: string[][];
  playerSide: 'white' | 'black' | null;
  currentTurn: 'white' | 'black' | null;
  onMove: (from: string, to: string, isEnPassant: boolean, promotionPiece?: string) => void;
  lastMove: { from: string; to: string } | null;
  isCheckmate: boolean;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ board, playerSide, currentTurn, onMove, lastMove, isCheckmate }) => {
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [promotionSquare, setPromotionSquare] = useState<string | null>(null);

  const isPlayerTurn = playerSide === currentTurn;

  const isValidMove = (row: number, col: number, isWhite: boolean): boolean => {
    return row >= 0 && row < 8 && col >= 0 && col < 8 && 
           (board[row][col] === '' || isWhite !== (board[row][col].charCodeAt(0) < 9818));
  };

  const isUnderAttack = (row: number, col: number, isWhite: boolean, tempBoard: string[][] = board): boolean => {
    // Check for pawn attacks
    const pawnDirection = isWhite ? -1 : 1;
    const pawnAttacks = [
      [pawnDirection, -1],
      [pawnDirection, 1]
    ];
    for (const [dx, dy] of pawnAttacks) {
      const newRow = row + dx;
      const newCol = col + dy;
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const piece = tempBoard[newRow][newCol];
        if ((isWhite && piece === '♟') || (!isWhite && piece === '♙')) {
          return true;
        }
      }
    }

    // Check for knight attacks
    const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    for (const [dx, dy] of knightMoves) {
      const newRow = row + dx;
      const newCol = col + dy;
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const piece = tempBoard[newRow][newCol];
        if ((isWhite && piece === '♞') || (!isWhite && piece === '♘')) {
          return true;
        }
      }
    }

    // Check for rook, bishop, queen, and king attacks
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1], // Rook/Queen moves
      [-1, -1], [-1, 1], [1, -1], [1, 1] // Bishop/Queen moves
    ];
    for (const [dx, dy] of directions) {
      let newRow = row + dx;
      let newCol = col + dy;
      while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const piece = tempBoard[newRow][newCol];
        if (piece !== '') {
          if (isWhite) {
            if ((Math.abs(dx) + Math.abs(dy) === 1 && (piece === '♜' || piece === '♛')) ||
                (Math.abs(dx) === Math.abs(dy) && (piece === '♝' || piece === '♛')) ||
                (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && piece === '♚')) {
              return true;
            }
          } else {
            if ((Math.abs(dx) + Math.abs(dy) === 1 && (piece === '♖' || piece === '♕')) ||
                (Math.abs(dx) === Math.abs(dy) && (piece === '♗' || piece === '♕')) ||
                (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && piece === '♔')) {
              return true;
            }
          }
          break;
        }
        newRow += dx;
        newCol += dy;
      }
    }

    return false;
  };

  const getPossibleMoves = (piece: string, row: number, col: number): string[] => {
    const moves: string[] = [];
    const isWhite = piece.charCodeAt(0) < 9818;

    const addMove = (x: number, y: number) => {
      if (isValidMove(x, y, isWhite)) {
        if (piece === '♔' || piece === '♚') {
          // For king moves, check if the new position is not under attack
          const tempBoard = board.map(row => [...row]);
          tempBoard[row][col] = '';
          tempBoard[x][y] = piece;
          if (!isUnderAttack(x, y, isWhite, tempBoard)) {
            moves.push(`${x},${y}`);
          }
        } else {
          moves.push(`${x},${y}`);
        }
      }
    };

    switch (piece) {
      case '♙': // White Pawn
      case '♟': // Black Pawn
        const direction = isWhite ? -1 : 1;
        if (board[row + direction][col] === '') {
          addMove(row + direction, col);
          if ((isWhite && row === 6) || (!isWhite && row === 1)) {
            if (board[row + 2 * direction][col] === '') {
              addMove(row + 2 * direction, col);
            }
          }
        }
        // Capture moves
        [-1, 1].forEach(offset => {
          if (col + offset >= 0 && col + offset < 8) {
            const targetPiece = board[row + direction][col + offset];
            if (targetPiece !== '' && isWhite !== (targetPiece.charCodeAt(0) < 9818)) {
              addMove(row + direction, col + offset);
            }
          }
        });
        // En passant
        if (lastMove) {
          const [lastFromRow, lastFromCol] = lastMove.from.split(',').map(Number);
          const [lastToRow, lastToCol] = lastMove.to.split(',').map(Number);
          const lastMovePiece = board[lastToRow][lastToCol];
          if (
            (lastMovePiece === '♙' || lastMovePiece === '♟') &&
            Math.abs(lastFromRow - lastToRow) === 2 &&
            Math.abs(lastToCol - col) === 1 &&
            lastToRow === row
          ) {
            addMove(row + direction, lastToCol);
          }
        }
        break;

      case '♖': // White Rook
      case '♜': // Black Rook
        [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => {
          let x = row + dx, y = col + dy;
          while (isValidMove(x, y, isWhite)) {
            addMove(x, y);
            if (board[x][y] !== '') break;
            x += dx;
            y += dy;
          }
        });
        break;

      case '♘': // White Knight
      case '♞': // Black Knight
        [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dx, dy]) => {
          addMove(row + dx, col + dy);
        });
        break;

      case '♗': // White Bishop
      case '♝': // Black Bishop
        [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dx, dy]) => {
          let x = row + dx, y = col + dy;
          while (isValidMove(x, y, isWhite)) {
            addMove(x, y);
            if (board[x][y] !== '') break;
            x += dx;
            y += dy;
          }
        });
        break;

      case '♕': // White Queen
      case '♛': // Black Queen
        [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dx, dy]) => {
          let x = row + dx, y = col + dy;
          while (isValidMove(x, y, isWhite)) {
            addMove(x, y);
            if (board[x][y] !== '') break;
            x += dx;
            y += dy;
          }
        });
        break;

      case '♔': // White King
      case '♚': // Black King
        [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dx, dy]) => {
          addMove(row + dx, col + dy);
        });
        break;
    }

    return moves;
  };

  const commitMove = (from: string, to: string) => {
    const [fromRow, fromCol] = from.split(',').map(Number);
    const [toRow, toCol] = to.split(',').map(Number);
    const movingPiece = board[fromRow][fromCol];

    // Check for en passant
    const isEnPassant = (movingPiece === '♙' || movingPiece === '♟') && 
                        fromCol !== toCol && 
                        board[toRow][toCol] === '';

    // Check for pawn promotion
    if ((movingPiece === '♙' && toRow === 0) || (movingPiece === '♟' && toRow === 7)) {
      setPromotionSquare(to);
      setSelectedPiece(from);  // Keep the selected piece for promotion
    } else {
      onMove(from, to, isEnPassant);
      setSelectedPiece(null);
      setPossibleMoves([]);
    }
  };

  const handlePromotion = (promotionPiece: string) => {
    if (promotionSquare && selectedPiece) {
      onMove(selectedPiece, promotionSquare, false, promotionPiece);
      setPromotionSquare(null);
      setSelectedPiece(null);
      setPossibleMoves([]);
    }
  };

  const handlePieceClick = (rowIndex: number, colIndex: number) => {
    if (isPlayerTurn) {
      const clickedSquare = `${rowIndex},${colIndex}`;
      const piece = board[rowIndex][colIndex];
      const isPieceOfCurrentPlayer = 
        (playerSide === 'white' && piece.charCodeAt(0) >= 9812 && piece.charCodeAt(0) <= 9817) ||
        (playerSide === 'black' && piece.charCodeAt(0) >= 9818 && piece.charCodeAt(0) <= 9823);

      if (selectedPiece) {
        if (possibleMoves.includes(clickedSquare)) {
          // Commit the move
          commitMove(selectedPiece, clickedSquare);
        } else if (clickedSquare === selectedPiece) {
          // Deselect the current piece
          setSelectedPiece(null);
          setPossibleMoves([]);
        } else if (isPieceOfCurrentPlayer) {
          // Select a different piece
          setSelectedPiece(clickedSquare);
          setPossibleMoves(getPossibleMoves(piece, rowIndex, colIndex));
        } else {
          // Clicked on an invalid square, deselect everything
          setSelectedPiece(null);
          setPossibleMoves([]);
        }
      } else if (isPieceOfCurrentPlayer) {
        // Select a new piece
        setSelectedPiece(clickedSquare);
        setPossibleMoves(getPossibleMoves(piece, rowIndex, colIndex));
      }
    }
  };

  const isKingInCheck = (isWhite: boolean, tempBoard: string[][] = board): boolean => {
    const kingPiece = isWhite ? '♔' : '♚';
    let kingPosition: [number, number] | null = null;

    // Find the king's position
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (tempBoard[row][col] === kingPiece) {
          kingPosition = [row, col];
          break;
        }
      }
      if (kingPosition) break;
    }

    if (!kingPosition) return false; // This shouldn't happen in a valid chess position

    return isUnderAttack(kingPosition[0], kingPosition[1], isWhite, tempBoard);
  };

  return (
    <div style={{ display: 'inline-block', border: '2px solid black', position: 'relative' }}>
      {board.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex' }}>
          {row.map((piece, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              data-testid={`${rowIndex}-${colIndex}`}
              style={{
                width: '50px',
                height: '50px',
                backgroundColor: (rowIndex + colIndex) % 2 === 0 
                  ? (isPlayerTurn ? 'rgb(255, 255, 200)' : 'white')
                  : (isPlayerTurn ? 'rgb(170, 170, 120)' : 'lightgray'),
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '30px',
                cursor: isPlayerTurn ? 'pointer' : 'default',
                border: selectedPiece === `${rowIndex},${colIndex}` ? '2px solid red' : 
                       possibleMoves.includes(`${rowIndex},${colIndex}`) ? '2px solid blue' : 'none',
                boxSizing: 'border-box',
              }}
              onClick={() => handlePieceClick(rowIndex, colIndex)}
            >
              {piece}
            </div>
          ))}
        </div>
      ))}
      
      {isCheckmate && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '20px',
          border: '2px solid red',
          zIndex: 1000,
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          Checkmate! {currentTurn === 'white' ? 'Black' : 'White'} wins!
        </div>
      )}

      {promotionSquare && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          border: '2px solid black',
          zIndex: 1000
        }}>
          <h3>Choose promotion piece:</h3>
          <button onClick={() => handlePromotion(playerSide === 'white' ? '♕' : '♛')}>Queen</button>
          <button onClick={() => handlePromotion(playerSide === 'white' ? '♖' : '♜')}>Rook</button>
          <button onClick={() => handlePromotion(playerSide === 'white' ? '♗' : '♝')}>Bishop</button>
          <button onClick={() => handlePromotion(playerSide === 'white' ? '♘' : '♞')}>Knight</button>
        </div>
      )}
    </div>
  );
};

export default ChessBoard;