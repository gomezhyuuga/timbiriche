var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var constants = require('../constants.js');
var DEFAULT_NAME = 'No name';

var gameSchema = new Schema({
  name: { type: String, default: DEFAULT_NAME, unique: true},
  players: { type: Number, default: 2 },
  started: { type: Boolean, default: false },
  board: String,
  playersJoined: { type: Number, default: 0 },
  boardSize: Number,
  score: String,
  turn: Schema.Types.ObjectId,
  availableSpaces: Number,
  'created_at': { type: Date, default: new Date() },
});

// Static methods
gameSchema.statics.generate = function (properties) {
  var game = new Game(properties);
  // Generate board
  var n = game.boardSize || 3;
  var size = 2 * n - 1;
  var matrix = new Array(size);
  var dot = true;
  for (var i = 0; i < size; i++) {
    var row = new Array(size);
    for (var j = 0; j < size; j++) {
      // Odd rows always have blank spaces
      if (i % 2 !== 0) {
        row[j] = ' ';
      } else { // Odd rows can have dot or space
        if (dot) row[j] = constants.DOT_SYMBOL;
        else row[j] = constants.BLANK_SYMBOL;
        dot = !dot; // Toggle 'put dot or space'
      }
    }
    dot = true;
    matrix[i] = row;
  }
  game.setBoard(matrix);
  game.availableSpaces = n*(n-1)*2;
  var score = [];
  for(var i = 0; i < game.players; i++) score[i] = 0;
  game.setScore(score);
  return game;
}

// Instance methods
gameSchema.methods.getBoard = function () {
  return JSON.parse(this.board);
}
gameSchema.methods.setBoard = function (board) {
  this.board = JSON.stringify(board);
}
gameSchema.methods.getScore = function () {
  return JSON.parse(this.score);
}
gameSchema.methods.setScore = function (score) {
  this.score = JSON.stringify(score);
}

// Returns the number of number of boxes that were closed
gameSchema.methods.makeMove = function(position, playerNum) {
  var board = this.getBoard();
  var score = this.getScore();
  var row = +(position.substr(1));
  var col = +(position[0].charCodeAt(0) - 65);

  if (!this.validMove(position)) return false;

  var closedBoxes = 0;
  var symbol = (row % 2 === 0) ? constants.HORIZONTAL_SYMBOL : constants.VERTICAL_SYMBOL;

  // Mark the box
  board[ row ][ col ] = symbol;
  this.availableSpaces -= 1;

  // CHECK IF A BOX WAS CLOSED
  if (symbol === constants.VERTICAL_SYMBOL) {
    // LEFT BOX
    if (board[row] !== undefined
      && board[row - 1] !== undefined
      && board[row + 1] !== undefined
      && board[row][col - 2] === constants.VERTICAL_SYMBOL
      && board[row + 1][col - 1] === constants.HORIZONTAL_SYMBOL
      && board[row - 1][col - 1] === constants.HORIZONTAL_SYMBOL) {
      closedBoxes++;
      // Mark closed square
      board[row][col - 1] = playerNum;
      score[playerNum - 1] += 1;
      this.setScore(score);
    }
    // RIGHT BOX
    if (board[row] !== undefined
      && board[row + 1] !== undefined
      && board[row - 1] !== undefined
      && board[row][col + 2] === constants.VERTICAL_SYMBOL
      && board[row + 1][col + 1] === constants.HORIZONTAL_SYMBOL
      && board[row - 1][col + 1] === constants.HORIZONTAL_SYMBOL) {
      closedBoxes++;
      // Mark closed square
      board[row][col + 1] = playerNum;
      score[playerNum - 1] += 1;
      this.setScore(score);
    }
  } else {
    // D2 => [2][3]
    // UPPER BOX
    if (board[row - 2] !== undefined
      && board[row - 1] !== undefined
      && board[row - 2][col] === constants.HORIZONTAL_SYMBOL
      && board[row - 1][col - 1] === constants.VERTICAL_SYMBOL
      && board[row - 1][col + 1] === constants.VERTICAL_SYMBOL) {
      closedBoxes++;
      // Mark closed square
      board[row - 1][col] = playerNum;
      score[playerNum - 1] += 1;
      this.setScore(score);
    }
    // LOWER BOX
    if (board[row + 2] !== undefined
      && board[row + 1] !== undefined
      && board[row + 2][col] === constants.HORIZONTAL_SYMBOL
      && board[row + 1][col - 1] === constants.VERTICAL_SYMBOL
      && board[row + 1][col + 1] === constants.VERTICAL_SYMBOL) {
      closedBoxes++;
      // Mark closed square
      board[row + 1][col] = playerNum;
      score[playerNum - 1] += 1;
      this.setScore(score);
    }
  }
  this.setBoard(board);
  return closedBoxes;
}
gameSchema.methods.printBoard = function() {
  var matrix = this.getBoard();
  if (matrix.length === 0) return undefined;
  // Print column names as ABCD...
  process.stdout.write('  ');
  for (var i = 0; i < matrix.length; i++) {
    process.stdout.write(' ' + String.fromCharCode(i + 65));
  }
  console.log('');

  matrix.forEach(function (row, index) {
    var num = index;
    if (num < 10) num = ' ' + num;
    console.log(num + ' ' + row.join(' '));
  });

  // Player score
  console.log('# SCORE');
  var score = this.getScore();
  score.forEach(function (val, index) {
    console.log('Player %d: %d', index + 1, val);
  });
}
gameSchema.methods.validMove = function(position) {
  var row = +(position.substr(1));
  var col = +(position[0].charCodeAt(0) - 65);
  var board = this.getBoard();
  var aSize = board.length;

  if (row >= aSize
    || row < 0
    || col < 0
    || col >= aSize) return false;

  // Inside box
  if (row % 2 !== 0 && col % 2 !== 0) return false;

  if (board[row][col] !== constants.BLANK_SYMBOL) return false;

  return true;
}
/*
  returns
  a) the player number who won
  b) -1 if there was a draw
  c) false if game is still in progress
*/
gameSchema.methods.finished = function () {
  if (this.availableSpaces > 0) return false;
  var score = this.getScore();
  var winner = 0;
  var max = Math.max.apply(null, score);
  winner = score.indexOf(Math.max.apply(Math, score));
  winner++;
  
  max = score[winner - 1];
  // Detect draw
  var winners = score.filter(function(val, index) { return val == max } );
  if (winners.length > 1) winner = -1;
  return winner;
}

Game = mongoose.model('Game', gameSchema);
module.exports = Game;
