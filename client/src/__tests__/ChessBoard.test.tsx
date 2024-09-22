import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChessBoard from '../ChessBoard';

// Add these lines to define Jest globally
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveStyle: (style: string) => R;
    }
  }
}

describe('ChessBoard', () => {
  const mockOnMove = jest.fn();
  const defaultProps = {
    board: [
      ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
      ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
      ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
    ],
    playerSide: 'white' as 'white' | 'black' | null,
    currentTurn: 'white' as 'white' | 'black' | null,
    onMove: mockOnMove,
    lastMove: null,
    isCheckmate: false,
  };

  it('allows white pawn to capture black pawn', () => {
    const customBoard = [
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '♟', '', '', '', ''],
      ['', '', '♙', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '']
    ];

    render(<ChessBoard {...defaultProps} board={customBoard} />);

    // Click on the white pawn
    fireEvent.click(screen.getByText('♙'));

    // Click on the black pawn to capture it
    fireEvent.click(screen.getByText('♟'));

    expect(mockOnMove).toHaveBeenCalledWith('4,2', '3,3', false);
  });

  it('allows black pawn to capture white pawn', () => {
    const customBoard = [
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '♟', '', '', '', '', ''],
      ['', '', '', '♙', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '']
    ];

    render(<ChessBoard {...defaultProps} board={customBoard} playerSide="black" currentTurn="black" />);

    // Click on the black pawn
    fireEvent.click(screen.getByText('♟'));

    // Click on the white pawn to capture it
    fireEvent.click(screen.getByText('♙'));

    expect(mockOnMove).toHaveBeenCalledWith('3,2', '4,3', false);
  });

  it('does not allow capturing pieces of the same color', () => {
    const customBoard = [
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '♙', '', '', '', ''],
      ['', '', '♙', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '']
    ];

    render(<ChessBoard {...defaultProps} board={customBoard} />);

    // Click on the first white pawn
    fireEvent.click(screen.getAllByText('♙')[0]);

    // Try to click on the second white pawn
    fireEvent.click(screen.getAllByText('♙')[1]);

    expect(mockOnMove).not.toHaveBeenCalled();
  });

  it('does not allow king to move to a square under attack', () => {
    const customBoard = [
      ['♔', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '♜', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '']
    ];

    render(<ChessBoard {...defaultProps} board={customBoard} />);

    // Click on the white king
    fireEvent.click(screen.getByTestId('0-0'));

    // Try to move the king to a square that's under attack by the black rook
    fireEvent.click(screen.getByTestId('0-1')); // Assuming you add data-testid to your squares

    expect(mockOnMove).not.toHaveBeenCalled();
  });

  it('highlights a square when a piece is clicked', () => {
    const customBoard = [
      ['♔', '', '', '', '', '', '', ''],
      ['♙', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '']
    ];

    render(<ChessBoard {...defaultProps} board={customBoard} />);

    // Click on the white pawn
    fireEvent.click(screen.getByTestId('1-0'));

    // Check if the clicked square is highlighted
    expect(screen.getByTestId('1-0')).toHaveStyle('border: 2px solid red');

    // Check that other squares are not highlighted
    expect(screen.getByTestId('0-0')).not.toHaveStyle('border: 2px solid red');
  });

  it('removes highlight when a different piece is clicked', () => {
    const customBoard = [
      ['♔', '', '', '', '', '', '', ''],
      ['♙', '♙', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '']
    ];

    render(<ChessBoard {...defaultProps} board={customBoard} />);

    // Click on the first white pawn
    fireEvent.click(screen.getByTestId('1-0'));

    // Check if the first pawn is highlighted
    expect(screen.getByTestId('1-0')).toHaveStyle('border: 2px solid red');

    // Click on the second white pawn
    fireEvent.click(screen.getByTestId('1-1'));

    // Check if the second pawn is now highlighted
    expect(screen.getByTestId('1-1')).toHaveStyle('border: 2px solid red');

    // Check if the first pawn is no longer highlighted
    expect(screen.getByTestId('1-0')).not.toHaveStyle('border: 2px solid red');
  });
});