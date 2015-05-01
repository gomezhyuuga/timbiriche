var FileCookieStore = require('tough-cookie-filestore');
var inq     = require('inquirer');
var request = require('request');
var async   = require('async');
var GameUtil = require('./controllers/gameUtil.js');
var API = require('./api.js');

var jarContainer = request.jar();
var cookies;
var lastStatus;
var lastTurn;
var playerNumber;
var TIMER = 1000;

request = request.defaults({jar: true});

var SERVER_URL = process.argv[2] || 'http://localhost:3000';


var MENU_CHOICES = [
  { value: 1, name: '1) Crear juego'},
  { value: 2, name: '2) Unirse a juego'},
  { value: 3, name: '3) Salir' }
];

function exit(code) {
  console.log('GRACIAS POR JUGAR. VUELVE PRONTO :D');
  process.exit(code || 0);
}
function printAnswers(answers) {
  // console.log(JSON.stringify(answers, null, '    '));
}
function validateNumberRange(num, min, max) {
  return (min <= num && num <= max) ? true : 'Numero dentro de rango inválido';
}
function printBoard(matrix, score) {
  // Print column names as ABCD...
  process.stdout.write('  ');
  for (var i = 0; i < matrix.length; i++) {
    process.stdout.write(' ' + String.fromCharCode(i + 65));
  }
  console.log('');

  matrix.forEach(function (row, index) {
    console.log(fnum(index) + ' ' + row.join(' '));
  });

  // Player score
  console.log('# SCORE');
  score.forEach(function (val, index) {
    console.log('Player %d: %d', index + 1, val);
  });
}

function promptMenu(callback) {
  inq.prompt({
      type: 'list',
      name: 'menu',
      message: 'Selecciona una opción:',
      choices: MENU_CHOICES
    },
    function (answers) {
      printAnswers(answers);
      if (callback) callback(answers);
    }
  );
}
function promptCreateGame(callback) {
  inq.prompt([
    {
      type: 'input',
      name: 'gameName',
      message: 'Introduce el nombre del juego:',
      validate: function(value) {
        return value ? true : 'Introduce un nombre de juego válido';
      },
    },
    {
      type: 'input',
      name: 'boardSize',
      message: '¿De qué tamaño deseas el tablero? (Min. 3, Máx. 8)',
      validate: function(value) {
        return validateNumberRange(+value, 3, 8);
      },
    },
    {
      type: 'input',
      name: 'numPlayers',
      message: '¿Cantidad de jugadores? (Min. 2, Máx. 4)',
      validate: function(value) {
        return validateNumberRange(+value, 2, 4);
      },
    }
  ], function(answers) {
    printAnswers(answers);
    if (callback) callback(answers);
  });
}
function promptJoinGame(games, callback) {
  var games = games;
  // console.log(games);
  inq.prompt({
      type: 'list',
      name: 'gameID',
      message: 'Selecciona el juego a unirte',
      choices: games,
    }, function (answers) {
      printAnswers(answers);
      if (callback) callback(answers);
    }
  );
}
function promptMakeMove(callback) {
  inq.prompt({
      type: 'input',
      name: 'position',
      message: 'Indica la posición a tirar: (e.g. B0)',
      validate: function (value) {
        // VALIDAR LETRANUM
        return true;
      },
    },
    function (answers) {
      printAnswers(answers);
      if (callback) callback(answers.position);
    }
  );
}

function joinGame(gameID, callback) {
  // console.log('Trying to join game with ID: ' + gameID);
  var url = SERVER_URL + API.JOIN_GAME.uri;
  request.put({url: url, jar: jarContainer, form: {
    'game_id': gameID
  }}, function (err, res, body) {
    if (err) {
      console.error('ERROR UNIÉNDOSE AL JUEGO. INTENTA NUEVAMENTE.');
      console.error(err);
      return promptMenu(main);
    }
    cookies = jarContainer.getCookies(url);
    // console.log('COOKIES');
    // console.log(cookies);
    body = JSON.parse(body);
    // console.log(body);
    if (body.status === 'FULL') {
      console.log('JUEGO LLENO. INTENTA OTRO JUEGO.');
      return promptMenu(main);
    }
    if (callback) return callback(null, body, cookies);
  });
}

function play(player) {
  setTimeout(function () {
    getStatus(function (err, response) {
      var status = response.status;
      var score = response.score;
      // console.log('STATUS:  ' + status);
      var board;
      if (response.board) board = JSON.parse(response.board);
      if (response.score) score = JSON.parse(response.score);

      if (lastStatus !== status) {
        console.log('ERES EL JUGADOR %d', player);
        if (status === API.CODES.ERROR) {
          console.log('OCURRIÓ UN ERROR. INTENTA DE NUEVO');
        } else if (status == API.CODES.ROOM_NOT_FULL) {
          console.log('ESPERANDO A QUE SE UNAN LOS DEMÁS JUGADORES...');
        }
      }
      lastStatus = status;
      

      if (status === API.CODES.WAIT) {
        if (lastTurn !== response.turn) if (board) GameUtil.printBoard(board, score);
        // TODO: print score
        if (lastTurn !== response.turn) console.log('ESPERANDO A QUE EL JUGADOR %d TIRE', response.turn);
        
      }
      lastTurn = response.turn;


      if (status === API.CODES.YOUR_TURN) {
        console.log('ERES EL JUGADOR %d', player);
        if (board) GameUtil.printBoard(board, score);
        return promptMakeMove(function (position) {
          make_move(position, function () {
            play(player);
          });
        });
      }

      if (status === API.CODES.WIN) {
        GameUtil.printBoard(board, score);
        console.log('FELICIDADES ¡GANASTE!');
        exit();
      } else if (status === API.CODES.LOSE) {
        GameUtil.printBoard(board, score);
        console.log('EL JUEGO TERMINÓ. HAZ PERDIDO :-(');
        exit();
      } else if (status === API.CODES.DRAW) {
        GameUtil.printBoard(board, score);
        console.log('EL JUEGO TERMINÓ EN EMPATE');
        exit();
      }

      play(player);

    });
  }, TIMER);
}

function make_move(position, callback) {
  request.put({url: SERVER_URL + API.MAKE_MOVE.uri, jar: jarContainer, form: {
    'position': position
  }}, function (err, res, body) {
    if (err) return  console.log('ERROR. INTENTA DE NUEVO.');

    if (body.status == 'OK') {
      console.log('TIRO CORRECTO.');
    } else if (body.status == API.CODES.INVALID_MOVE) {
      console.log('POSICION INVÁLIDA. INTENTA DE NUEVO.');
    }
    if (callback) callback();
  });
}

function getStatus(callback) {
  var url = SERVER_URL + API.STATUS.uri;
  request.get({url: url, jar: jarContainer}, function (err, res, body) {
    if (err) return callback(err, null);
    body = JSON.parse(body);
    // console.log(body);
    return callback(err, body);
  });
}

function main(answers) {
  switch(answers.menu) {
    case 1:
      // Create game
      // console.log('Creando nuevo juego...');
      promptCreateGame(function(answers) {
        request.post({url: SERVER_URL + API.CREATE_GAME.uri, form: {
          name: answers.gameName,
          players: answers.numPlayers,
          size: answers.boardSize
        }}, function (err, res, body) {
          if (err) {
            console.error('Error creando juego.');
            console.error(err);
            return promptMenu(main);
          }
          body = JSON.parse(body);
          // console.log(body);
          if (body.status == 'EXISTS') {
            console.log('EL JUEGO YA EXISTE. INTENTA CON OTRO NOMBRE.');
            return promptMenu(main);
          }
          var gameID = body.gameID;
          joinGame(gameID, function (err, player, cook) {
            if (err) {
              console.error('ERROR UNIÉNDOSE AL JUEGO. INTENTA NUEVAMENTE.');
              console.error(err);
              return promptMenu(main);
            }
            // console.log(player);
            console.log('EMPEZANDO EL JUEGO');
            // Play game
            cookies = cookies;
            play(player.playerNumber);
          });
        });
      });
      break;
    case 2: // List game
      // console.log('Listando juegos...');
      // GET LIST OF ALL AVAILABLE GAMES
      request(SERVER_URL + API.GET_GAMES.uri, function (err, res, body) {
        if (err) {
          console.error('Ocurrió un error. Intenta de nuevo.');
          console.error(err);
          return promptMenu(main);
        }

        var games = JSON.parse(body).map(function (game) {
          return { value: game.id, name: game.name };
        });
        if (games.length === 0) {
          console.log('NO HAY JUEGOS TODAVÍA. CREA UNO NUEVO.');
          return promptMenu(main);
        }
        promptJoinGame(games, function (answers) {
          joinGame(answers.gameID, function (err, player, req) {
            if (err) {
              console.error('No se pudo unir al juego. Intenta de nuevo.');
              console.error(err);
              return promptMenu(main);
            }
            // console.log(player);
            // Play game
            play(player.playerNumber);
          });
        });
      });
      break;
    case 3: // Exit
      exit();
      break;
    default:
      promptMenu();
      break;
  }
}

promptMenu(function(answers) {
    main(answers);
});
