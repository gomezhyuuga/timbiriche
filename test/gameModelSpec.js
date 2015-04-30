var assert = require('chai').assert;
var Game = require('../models/game.js');
var constants = require('../constants.js');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/timbiriche');

describe('# Game Model', function() {
  var game;
  var board;
  beforeEach(function() {
    game = Game.generate({
      name: 'Juego de Fer',
      players: 4,
      boardSize: 7,
    });
    board = game.getBoard();
  });

  describe('* properties', function() {
    it('should have the required properties', function () {
      var game = Game.generate();
      assert.property(game, 'name', 'name');
      assert.property(game, 'players', 'players');
      assert.property(game, 'started', 'started');
      assert.property(game, 'board', 'board');
      assert.property(game, 'boardSize', 'boardSize');
      assert.property(game, 'score', 'score');
      assert.property(game, 'turn', 'turn');
      assert.property(game, 'created_at', 'created_at');
    });
    it('should have the required methods', function () {
      assert.property(Game, 'generate', 'generate game');
      assert.typeOf(Game.generate, 'function', 'generate as static');
      
      var game = Game.generate();
      // Presence of methods
      assert.property(game, 'makeMove', 'makeMove');
      assert.property(game, 'printBoard', 'printBoard');
      assert.property(game, 'validMove', 'validMove');

      // Type of properties should be method
      assert.typeOf(game.makeMove, 'function', 'makeMove');
      assert.typeOf(game.printBoard, 'function', 'printBoard');
      assert.typeOf(game.validMove, 'function', 'validMove');
    });
  });
  describe('* initialize', function() {
    it('shoud have a not empty board property', function () {
      assert.notEqual(board.length, 0, 'length of board');
    });
    it('should create the correct board', function () {
      var game = Game.generate({
        name: 'Juego de Fer',
        players: 4,
        boardSize: 3,
      });
      var board = game.getBoard();
      var matrix = [
        ['●', ' ', '●', ' ', '●'],
        [' ', ' ', ' ', ' ', ' '],
        ['●', ' ', '●', ' ', '●'],
        [' ', ' ', ' ', ' ', ' '],
        ['●', ' ', '●', ' ', '●']
      ];
      assert.deepEqual(board, matrix);
    });
    it('should have the proper size', function () {
      var size = game.boardSize;
      assert.lengthOf(board, size * 2 - 1);
    });
  });

  describe('.validMove()', function() {
    it('should not let mark an invalid space', function () {

      assert.notOk( game.validMove('Z14'), 'Z14' );
      assert.notOk( game.validMove('C14'), 'C14' );
      assert.notOk( game.validMove('P5'), 'P5' );
      assert.notOk( game.validMove('A0'), 'A0' );
    });
    it('should let mark a valid space', function () {
      assert.ok( game.validMove('C1'), 'C1' );
      assert.ok( game.validMove('A1'), 'C1' );
    });
  });

  describe('.makeMove()', function() {
    it('should mark the space with the right symbol', function () {
      game.makeMove('B0'); // B0 => [1][1]
      assert.equal(game.getBoard()[0][1], constants.HORIZONTAL_SYMBOL, 'horizontal line');
      
      game.makeMove('A1'); // A1 => [1][0]
      assert.equal(game.getBoard()[1][0], constants.VERTICAL_SYMBOL, 'vertical line');
      
      // When size > 9
      game.makeMove('A11'); // A11 => [11][0]
      assert.equal(game.getBoard()[11][0], constants.VERTICAL_SYMBOL, 'vertical line');
    });
    

    it('should return the closed squares in the turn', function () {
      var result;
      result = game.makeMove( 'B0', 2 );
      assert.equal(result, 0);
      result = game.makeMove( 'B2', 2 );
      assert.equal(result, 0);
      result = game.makeMove( 'A1', 2 );
      assert.equal(result, 0);
      result = game.makeMove( 'C1', 2 );
      assert.equal(result, 1);

      result = game.makeMove( 'C3', 2 );
      assert.equal(result, 0);
      result = game.makeMove( 'D0', 2 );
      assert.equal(result, 0);
      result = game.makeMove( 'D4', 2 );
      assert.equal(result, 0);
      result = game.makeMove( 'E3', 2 );
      assert.equal(result, 0);
      result = game.makeMove( 'E1', 2 );
      assert.equal(result, 0);
      result = game.makeMove( 'E3', 2 );
      assert.equal(result, 0);
      result = game.makeMove( 'D2', 2 );
      assert.equal(result, 2);
    });
  });

  describe('.finished()', function() {
    beforeEach(function () {
      game = Game.generate({
        size: 3,
        name: 'Un juego equis',
        players: 3
      });
    })
    it('should detect when game have finished', function () {
      var result;
      game.makeMove('A1', 1);
      game.makeMove('A3', 2);
      game.makeMove('B0', 2);
      game.makeMove('B2', 1);
      game.makeMove('B4', 2);
      result = game.finished();
      assert.notOk(result, 'not win yet');
      game.makeMove('C1', 2);
      game.makeMove('C3', 2);
      game.makeMove('D0', 1);
      game.makeMove('D2', 2);
      game.makeMove('D4', 2);
      result = game.finished();
      assert.notOk(result, 'not win yet');
      game.makeMove('E1', 1);
      game.makeMove('E3', 2);
      result = game.finished();
      assert.equal(result, 2, 'player 2 wins');
      // game.makeMove('')
    });
    it('should detect when there is a draw', function () {
      var result;
      game.makeMove('A1', 1);
      game.makeMove('A3', 2);
      game.makeMove('B0', 2);
      game.makeMove('B2', 1);
      game.makeMove('B4', 2);
      game.makeMove('C1', 2);
      game.makeMove('C3', 1);
      game.makeMove('D0', 1);
      game.makeMove('D2', 2);
      game.makeMove('D4', 2);
      game.makeMove('E1', 1);
      game.makeMove('E3', 2);
      game.printBoard();
      result = game.finished();
      // 0 means a draw
      assert.equal(result, -1, 'there is a draw');
    });
  });

  describe('.save()', function() {
    it('should save the game', function(done) {
      // Ensure game does not exist
      Game.remove({name: 'Juego de Fer'}, function(err) {
        assert.isNull(err);

        game.save(function(err, record) {
          assert.isNull(err);
          done();
        });
      });
    });

    it('should not let save a repeated game name', function(done) {
      game.save(function(err) {
        assert.isNotNull(err);
        done();
      });
    });
  });

});
