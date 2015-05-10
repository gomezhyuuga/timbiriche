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
  AGAIN: 'AGAIN',
}

router.get('/', function (req, res) {
  res.render('index.ejs');
});

/* GET: list of all games. */
router.get('/games/', function (req, res) {
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
router.get('/status', function (req, res) {
  var playerID = req.query.player_id || req.session.player_id;
  // Override parameter if session is present
  getPlayerGame(playerID, function (err, game, player) {
    if (err) return res.json({status: CODES.ERROR});
    if (!game) return res.json({status: CODES.NOT_FOUND});

    console.log('GAME');
    console.log(game);
    var response_data = {
      players_joined: game.playersJoined,
      number_of_players: game.players,
      board_size: game.boardSize,
      started: game.started,
      score: game.score,
      name: game.name,
    };

    // Game started?
    if (!game.started) {
      response_data.status = CODES.ROOM_NOT_FULL;
      return res.json(response_data);
    }

    response_data.board = game.board;

    // Game has finished?
    var finished = game.finished();
    console.log('FINISHED: ' + finished);
    
    if (finished !== false) {
      if (finished === -1) response_data.status = CODES.DRAW;
      else if (finished === player.number) response_data.status = CODES.WIN;
      else response_data.status = CODES.LOSE;
      return res.json(response_data);
    }

    // If game not finished, then is the turn of someone
    if (game.turn == playerID) {
      response_data.status = CODES.YOUR_TURN;
      response_data.turn = player.number;
      return res.json(response_data);
    }
    // GET NUMBER OF PLAYER TURN
    Player.findOne({_id: game.turn}, function (err, record) {
      if (err || !record) return res.json({status: CODES.ERROR});

      response_data.turn = record.number;
      response_data.status = CODES.WAIT;
      return res.json(response_data);
    })
  })
});

/* POST: create a new game */
/**
  returns:
  [1] SUCCESS
    status: OK
    gameID: ID of the game created
  [2] status: EXISTS
  [3] status: ERROR
**/
router.post('/games/new', function (req, res) {
  var name = req.body.name;
  var players = req.body.players;
  var bsize = req.body.size;
  if (!name || !players || !bsize) {
    return res.json({status: CODES.ERROR,
      msg: 'You must specify [name, players, size]'});
  }
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
/**
  params: game_id
  returns:
  [1] OK
    playerID: ID OF THE PLAYER
    playerNumber: NUMBER ASSIGNED TO THE PLAYER
    game: ID OF THE GAME
  [2] NOT_FOUND
  [3] ERROR
**/
router.put('/join', function (req, res) {
  var gameID = req.body.game_id;
  console.log('User requested to join game %s: ', gameID);
  Game.findOne({ '_id': gameID, started: false}, function (err, record) {
    if (err || !record) {
      console.error('ERROR BUSCANDO JUEGO');
      return res.json({status: CODES.NOT_FOUND});
    }
    var game = record;
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
        req.session.player_number = player.number;

        console.log(obj);

        res.json(obj);
      });
    });
  });
});
/* PUT: make move */
/**
  returns:
  [1] OK
    boxesClosed: result
  [2] ERROR
  [3] NOT_TURN
  [4] INVALID_MOVE
**/
router.put('/make_move', function (req, res) {
  var playerID = req.body.player_id || req.session.player_id;
  var position = req.body.position;
  console.log('MOVIN ON: %s by %s' + position, playerID);
  if (!position)
    return res.json({status: CODES.ERROR, msg: 'position is required'});
  if (!playerID)
    return res.json({status: CODES.ERROR, msg: 'player is required'});

  getPlayerGame(playerID, function (err, game, player) {
    if (err || !game) return res.json({status: CODES.ERROR});

    if (game.turn.toString() != player._id.toString())
      return res.json({status: CODES.NOT_TURN});

    if (!game.validMove(position))
      return res.json({status: CODES.INVALID_MOVE});

    var result = game.makeMove(position, player.number);
    console.log('SCORE: ');
    var score = game.score;
    score[player.number - 1] += 1;
    game.score = score;
    console.log('CAMBIADO!');
    console.log(game.score);
    // Increment turn if the player doesn't closed a box
    if (result === 0) {
      var number = player.number;
      // Restart to player 1 turn or increment the player
      number = (number === game.players) ? 1 : number + 1;

      // Update game turn
      Player.findOne({game: game._id, number: number}, function (err, record) {
        if (err) return res.json({status: CODES.ERROR});

        game.turn = record._id;
        game.save(function (err) {
          if (err) return res.json({status: CODES.ERROR});

          return res.json({status: 'OK', boxesClosed: result});
        });
      });
    } else {
      game.save(function (err) {
        if (err) return res.json({status: CODES.ERROR});
        console.log('AGAIN');
        return res.json({status: 'OK', msg: CODES.AGAIN, boxesClosed: result});
      });
    }
  });
});

function getPlayerGame(playerID, callback) {
  Player.findOne({ '_id': playerID }, function (err, player) {
    if (err || !player) {
      console.error('NO SE ENCONTRÓ EL JUGADOR');
      return callback(err);
    }
    Game.findOne({'_id': player.game}, function (err, game) {
      if (err || !game) {
        console.log('NO SE ENCONTRÓ EL JUEGO DEL JUGADOR');
        return callback(err);
      }
      // console.log('GAME');
      // console.log(game);
      // console.log('PLAYER');
      // console.log(player);
      callback(null, game, player);
    });
  });
}

function createPlayer(gameID, playerNumber, callback) {
  Player.create({
    game: gameID,
    number: playerNumber
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
