var DOT_SYMBOL = '●';
var BLANK_SYMBOL = ' ';
var VERTICAL_SYMBOL = '|';
var HORIZONTAL_SYMBOL = '–';

var gameUtil = require('../controllers/gameUtil.js');
var assert = require('chai').assert;

describe('# BOARD', function () {
  describe('.createBoard()', function () {
    it('should have the proper size', function () {
      var size = 3;
      var board = gameUtil.createBoard(size);

      assert.lengthOf(board, size * 2 - 1);
    });
    it('should have dots and spaces in the right positions', function () {
      var board = gameUtil.createBoard(3);
      var matrix = [
        ['●', ' ', '●', ' ', '●'],
        [' ', ' ', ' ', ' ', ' '],
        ['●', ' ', '●', ' ', '●'],
        [' ', ' ', ' ', ' ', ' '],
        ['●', ' ', '●', ' ', '●']
      ];
      assert.deepEqual(matrix, board);
    });
  });
  describe('.makeMove()', function() {
    it('should mark the space with the right symbol', function () {
      var board = gameUtil.createBoard(7);
      // gameUtil.printBoard(board);
      gameUtil.makeMove(board, 'B0'); // B0 => [1][1]
      // gameUtil.printBoard(board);
      assert.equal(board[0][1], HORIZONTAL_SYMBOL, 'horizontal line');
      gameUtil.makeMove(board, 'A1'); // A1 => [1][0]
      // gameUtil.printBoard(board);
      assert.equal(board[1][0], VERTICAL_SYMBOL, 'vertical line');
      // When size > 9
      gameUtil.makeMove(board, 'A11'); // A11 => [11][0]
      // gameUtil.printBoard(board);
      // console.log(board);
      assert.equal(board[11][0], VERTICAL_SYMBOL, 'vertical line');
    });
    it('should not let mark an invalid space', function () {
      var board = gameUtil.createBoard(7);

      assert.notOk( gameUtil.validMove('Z14', board), 'Z14' );
      assert.notOk( gameUtil.validMove('C14', board), 'C14' );
      assert.notOk( gameUtil.validMove('P5', board), 'P5' );
      assert.notOk( gameUtil.validMove('A0', board), 'A0' );
      assert.ok( gameUtil.validMove('C1', board), 'C1' );
      assert.ok( gameUtil.validMove('A1', board), 'C1' );
      
    });
    it('should return the closed squares in the turn', function () {
      var board = gameUtil.createBoard(3);
      // gameUtil.printBoard(board);
      
      var result;
      result = gameUtil.makeMove( board, 'B0', 2 );
      assert.equal(result, 0);
      result = gameUtil.makeMove( board, 'B2', 2 );
      assert.equal(result, 0);
      result = gameUtil.makeMove( board, 'A1', 2 );
      assert.equal(result, 0);
      result = gameUtil.makeMove( board, 'C1', 2 );
      assert.equal(result, 1);
      // gameUtil.printBoard(board);

      result = gameUtil.makeMove( board, 'C3', 2 );
      assert.equal(result, 0);
      result = gameUtil.makeMove( board, 'D0', 2 );
      assert.equal(result, 0);
      result = gameUtil.makeMove( board, 'D4', 2 );
      assert.equal(result, 0);
      result = gameUtil.makeMove( board, 'E3', 2 );
      assert.equal(result, 0);
      result = gameUtil.makeMove( board, 'E1', 2 );
      assert.equal(result, 0);
      result = gameUtil.makeMove( board, 'E3', 2 );
      assert.equal(result, 0);
      result = gameUtil.makeMove( board, 'D2', 2 );
      assert.equal(result, 2);
      // gameUtil.printBoard(board);
    });
  });
});
