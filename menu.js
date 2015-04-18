var inq = require('inquirer');

var MENU_CHOICES = [
  { value: 1, name: '1) Crear juego'},
  { value: 2, name: '2) Unirse a juego'},
  { value: 3, name: '3) Salir' }
];
var MENU_FUNCTIONS = {
  1: promptCreateGame,
  2: promptJoinGame,
  3: exit
};
var MOCK_GAMES = [
  { value: '12313212', name: 'Fer'},
  { value: '12122221', name: 'Ivan'},
  { value: '10002212', name: 'Juan'},
];

function promptJoinGame() {
  console.log('joining game...');
  inq.prompt({
      type: 'list',
      name: 'gameID',
      message: 'Selecciona el juego a unirte',
      choices: MOCK_GAMES
    }, printAnswers
  );
}
function exit(code) {
  console.log('GRACIAS POR JUGAR. VUELVE PRONTO :D');
  process.exit(code || 0);
}

function promptCreateGame() {
  inq.prompt([
    {
      type: 'input',
      name: 'gameName',
      message: 'Introduce el nombre del juego:',
    },
    {
      type: 'input',
      name: 'boardSize',
      message: '¿De qué tamaño deseas el tablero? (Min. 3, Máx. 8)',
    },
    {
      type: 'input',
      name: 'numPlayers',
      message: '¿Cantidad de jugadores? (Min. 2, Máx. 4)',
    }
  ], printAnswers);
}

function printAnswers(answers) {
  console.log(JSON.stringify(answers, null, '    '));
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
      MENU_FUNCTIONS[answers.menu]();

      if (callback) callback();
    }
  );
}


promptMenu();
