var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gameSchema = new Schema({
  name: { type: String, default: 'Sin nombre' },
  players: { type: Number, default: 2 },
  started: { type: Boolean, default: 1 },
  board: [ [String] ],
  score: String,
  turn: { type: Number, default: 1 },
  'created_at': { type: Date, default: new Date() },
});

gameSchema.methods.getBoard = function () {
  return JSON.parse(this.board);
}
gameSchema.methods.setBoard = function (board) {
  this.board = JSON.stringify(board);
}

module.exports = Schema.model('Game', gameSchema);