var express = require('express');
var router = express.Router();
var Game = require('../models/game.js');
var Player = require('../models/player.js');
var GameUtil = require('../controllers/gameUtil.js');

var CODES = {
  ERROR: 'ERROR',
  GAME_EXISTS: 'EXISTS',
  ROOM_NOT_FULL: 'NOT_FULL',
  ROOM_FULL: 'FULL',
  NOT_FOUND: 'NOT_FOUND',
  YOUR_TURN: 'YOUR_TURN',
  WAIT: 'WAIT',
  DRAW: 'DRAW',
  WIN: 'YOU_WIN',
  LOSE: 'YOU_LOSE',
  NOT_TURN: 'NOT_YOUR_TURN',
  INVALID_MOVE: 'INVALID_MOVE',
}

/* GET: list of all games. */
router.get('/games/', function (req, res, next) {
  Game.find({ started: false})
    .sort('name')
    .select('name')
    .exec(function (err, games) {
      if (err) console.error(err);
      console.log(games);
      res.json(games.map(function (el) {
        return { id: el._id, name: el.name }
      }));
    });
});

/* GET: status of the game */
router.get('/status', function (req, res, next) {
  var playerID = req.session.player_id;
  console.log('PLAYER_ID: ' + playerID);
  getPlayerGame(playerID, function (err, game, player) {
    if (err) return res.json({status: CODES.ERROR});

    // Game started?
    if (!game.started) return res.json({status: CODES.NOT_FULL});

    // Game has finished?
    var finished = game.finished();
    if (finished) {
      if (finished === 0) return res.json({status: CODES.DRAW});
      if (finished === player.number) return res.json({status: CODES.WIN});
      else return res.json({status: CODES.LOSE});
    }

    // If game not finished, then is the turn of someone
    if (game.turn === playerID) return res.json({status: CODES.YOUR_TURN});
    else return res.json({status: CODES.WAIT});
  })
});

/* POST: create a new game */
router.post('/games/new', function (req, res, next) {
  var name = req.body.name;
  var players = req.body.players;
  var bsize = req.body.size;
  /*
  * FIRST create the game and save GAME_ID
  * THEN create a player and assign him the GAME_ID
  * RETURN response and COOKIE with PLAYER_ID
  */
  var game = Game.generate({
    name: name,
    players: players,
    boardSize: bsize
  });
  game.save(function (err, record) {
    if (err) {
      console.error('Error creating the game!');
      console.error(err);
      if (err.code === 11000) return res.json({status: CODES.GAME_EXISTS});
      else return res.json({status: CODES.ERROR});
    }
    console.log('Game successfully created!');
    console.log(record);
    res.json({status: 'OK', gameID: record._id});
  });
});

/* PUT: request to join a game */
router.put('/join', function (req, res, next) {
  var gameID = req.body.game_id;
  console.log('User requested to join game %s: ', gameID);
  Game.find({ '_id': gameID, started: false}, function (err, record) {
    if (err || !record) {
      console.error('ERROR BUSCANDO JUEGO');
      return res.json({status: CODES.NOT_FOUND});
    }
    var game = record;
    /* NOT NECESARY IF WE START THE GAME WHEN ITS FULL */
    // Check if room is not full
    // if (record.playersJoined == record.players) { // Full
    //   console.log('FULL');
    //   res.json({status: CODES.ROOM_FULL});
    //   return;
    // }
    // Create player
    var playerNumber = record.playersJoined + 1;
    createPlayer(gameID, playerNumber, function (err, record) {
      var player = record;
      if (err) return res.json({status: CODES.ERROR});

      console.log('Player successfully created!');
      console.log(record);

      // Update game.playersJoined
      game.playersJoined = game.playersJoined + 1;

      // Check game TURN
      if (game.playersJoined === 1) game.turn = player._id;

      // Check if game room becomes full
      if (game.playersJoined === game.players) game.started = true;

      game.save(function (err, record) {
        if (err) {
          console.error('Could not join to the game');
          player.remove();
          res.json({status: CODES.ERROR});
        }
        console.log(record);
        var obj = { playerID: player._id, playerNumber: player.number,
          game: player.game, status: 'OK'};
        req.session.player_id = player._id;

        console.log(obj);

        res.json(obj);
      });
    });
  });
});
/* PUT: make move */
router.put('/check', function (req, res, next) {
  var playerID = req.session.player_id;
  var position = req.body.position;
  getPlayerGame(playerID, function (err, game, player) {
    if (err) return res.json({status: CODES.ERROR});

    if (game.turn !== player._id) return res.json({status: CODES.NOT_TURN});

    // if (game.isFull())

    if (!game.validMove(position))
      return res.json({status: CODES.INVALID_MOVE});

    var result = game.makeMove(position);
    // Increment turn if the player doesn't closed a box
    if (result === 0) {
      var number = player.number;
      // Restart to player 1 turn or increment the player
      number = (number === game.players) ? 1 : number + 1;

      // Update game turn
      Player.findOne({game: game._id, number: number}, function (err, record) {
        if (err) return res.json({status: CODES.ERROR});

        game.turn = record._id;
        game.save(function (err, record) {
          if (err) return res.json({status: CODES.ERROR});

          return res.json({status: 'OK', boxesClosed: result});
        });
      });
    } else {
      return res.json({status: 'OK', boxesClosed: result});
    }
  });
});

function getPlayerGame(playerID, callback) {
  Player.find({ '_id': playerID }, function (err, player) {
    if (err) {
      console.error('NO SE ENCONTRÓ EL JUGADOR');
      return callback(err);
    }
    Game.findOne({'_id': player.game}, function (err, game) {
      if (err || !game) {
        console.log('NO SE ENCONTRÓ EL JUEGO DEL JUGADOR');
        return callback(err);
      }
      var game = game;
      console.log('GAME');
      console.log(game);
      callback(null, game, player);
    });
  });
}

function createPlayer(gameID, number, callback) {
  Player.create({
    game: gameID,
    number: number
  }, function (err, record) {
    if (err) {
      console.error(err);
      console.error('Could not create the player!');
      return callback(err);
    }
    callback(null, record);
  });
}

module.exports = router;
