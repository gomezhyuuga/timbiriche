var mongoose = require('mongoose');
var Game = require('../models/game.js');
var GameUtil = require('../controllers/gameUtil.js');

mongoose.connect('mongodb://localhost/timbiriche');
var db = mongoose.connection;
db.on('error', function (err) {
  console.error('ERROR CONNECTING TO DATABASE');
  console.error(err);
  process.exit(1);
});

function rnm(min, max) {
  return Math.floor( Math.random() * (max - min) + min );
}

db.on('open', function (callback) {
  console.log('MONGODB CONNECTION ESTABLISHED');
  var bsize; 
  var players;
  var gameBoard;

  for( var i = 0; i < 6; i++) {
    bsize = rnm(3, 8);
    players = rnm(2, 5);
    gameBoard = GameUtil.createBoard(bsize);

    Game.create({
      name: 'Juego ' + i,
      players: players,
      board:  gameBoard,
      boardSize: bsize
    }, function (err, record) {
      if (err) {
        console.log('ERROR CREATING GAME');
        console.error(err);
      }
      console.log(record.name + ' created');
    });
  }
});
