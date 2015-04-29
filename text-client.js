var inq     = require('inquirer');
var request = require('request');
var async   = require('async');

request = request.defaults({jar: true});

var SERVER_URL = process.argv[2] || 'http://localhost:3000';
var API = {
  'GET_GAMES': { method: 'GET', uri: '/games/'},
  'CREATE_GAME': { method: 'POST', uri: '/games/new'},
  'JOIN_GAME': { method: 'PUT', uri: '/join'},
}

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
function printBoard(matrix) {
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
}
function validateNumberRange(num, min, max) {
  return (min <= num && num <= max) ? true : 'Numero dentro de rango inválido';
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
  console.log(games);
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

function joinGame(gameID, callback) {
  console.log('Trying to join game with ID: ' + gameID);
  request.put({url: SERVER_URL + API.JOIN_GAME.uri, form: {
    'game_id': gameID
  }}, function (err, res, body) {
    if (err) {
      console.error('ERROR UNIÉNDOSE AL JUEGO. INTENTA NUEVAMENTE.');
      console.error(err);
      return promptMenu(main);
    }
    body = JSON.parse(body);
    console.log(body);
    if (body.status === 'FULL') {
      console.log('JUEGO LLENO. INTENTA OTRO JUEGO.');
      return promptMenu(main);
    }
    if (callback) return callback(null, body);
  });
}
function play(player) {

}
function main(answers) {
  switch(answers.menu) {
    case 1:
      // Create game
      console.log('Creando nuevo juego...');
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
          console.log(body);
          if (body.status == 'EXISTS') {
            console.log('EL JUEGO YA EXISTE. INTENTA CON OTRO NOMBRE.');
            return promptMenu(main);
          }
          var gameID = body.gameID;
          joinGame(gameID, function (err, player) {
            if (err) {
              console.error('ERROR UNIÉNDOSE AL JUEGO. INTENTA NUEVAMENTE.');
              console.error(err);
              return promptMenu(main);
            }
            console.log(player);
            console.log('EMPEZANDO EL JUEGO');
            // Play game
          });
        });
      });
      break;
    case 2: // List game
      console.log('Listando juegos...');
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
          joinGame(answers.gameID, function (err, player) {
            if (err) {
              console.error('No se pudo unir al juego. Intenta de nuevo.');
              console.error(err);
              return promptMenu(main);
            }
            console.log(player);
            // Play game
            play(player);
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
