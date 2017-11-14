var SYMBOLS = {
  DOT_SYMBOL: '●',
  BLANK_SYMBOL: ' ',
  VERTICAL_SYMBOL: '|',
  HORIZONTAL_SYMBOL: '–'
}
var PLAYER_ID = '';
var PLAYER_NUMBER = 0;

var PAUSA = 2000;  // Número de milisegundos entre cada petición de espera

function make_move(position) {
  $('#errors').fadeOut();
  $.ajax({
    url: '/make_move',
    type: 'PUT',
    dataType: 'json',
    error: errorHandler,
    data: {
      position: position
    },
    success: function (resultado) {
      var status = resultado.status;
      if (status === 'OK') {
        esperaTurno(PLAYER_ID);
      } else {
        var msg;
        if (status === 'NOT_YOUR_TURN') msg = 'No es tu turno.';
        else if (status === 'INVALID_MOVE') msg = 'Tiro inválido.';
        errorHandler(msg);
      }
    }
  });
}
function updateBoard(board) {
  var table = createBoard(board);
  $('#section_game_board table').html(table);
  $('#section_game_board').show();
  $('a.move').click(function (ev) {
    ev.preventDefault();
    console.log(this);
    var position = this.text;
    make_move(position);
  });
}
function errorHandler(error) {
  error = error || 'Ocurrió un error inesperado';
  console.log(error);
  $('#errors p').html(error);
  $('#errors').fadeIn();
}
function updateStatus(msg, cssClass) {
  $('#section_status').show();
  $('#status').text(msg).removeClass().addClass(cssClass || '');
}
function createBoard(board) {
  // board = JSON.parse(board);
  var n = board.length;

  var table = '<table>'
  var tr, td, tdClass, content, el, letter, position;
  for (var i = 0; i < n; i++) {
    tr = '<tr>';
    for (var j = 0; j < n; j++) {
      el = board[i][j];
      tdClass = '';
      content = '';
      if (i % 2 !== 0 && j % 2 === 0) {
        tdClass += ' vertical line ';
        letter = String.fromCharCode(j + 65);
        position = letter + '' + i;
        content = '<a class="move" href="/make_move/' + position + '">'
          + position + '</a>';
      } else if (i % 2 === 0 && j % 2 !== 0) {
        tdClass += ' horizontal line ';
        letter = String.fromCharCode(j + 65);
        position = letter + '' + i;
        content = '<a class="move" href="/make_move/' + position + '">'
          + position + '</a>';
      } else if (el === SYMBOLS.DOT_SYMBOL) {
        tdClass += ' dot ';
      } else {
        tdClass += ' empty ';
        if (el !== ' ') {
          content = '<p class="point">' + el + '</p>';
        }
      }

      if (el === SYMBOLS.HORIZONTAL_SYMBOL || el === SYMBOLS.VERTICAL_SYMBOL) {
        tdClass += ' active ';
        content = '';
      }

      td = '<td class="' + tdClass + '">' + content + '</td>';
      tr += td;
    }
    tr += '</tr>';
    table += tr;
  }
  table += '</table>';
  return table;
}

//----------------------------------------------------------------------------
// Para evitar inyecciones de HTML.
function escaparHtml (str) {
  return $('<div/>').text(str).html();
}

//----------------------------------------------------------------------------
function joinGame(game_id) {
  $('#errors').hide();
  $('#section_join_game').hide();
  $('#section_buttons').hide();
  $('#section_create_game').hide();
  $('#section_game_board').show();

  $.ajax({
    url: '/join',
    type: 'PUT',
    dataType: 'json',
    error: errorHandler,
    data: {
      game_id: game_id
    },
    success: function (resultado) {
      console.log(resultado);
      var status = resultado.status;
      PLAYER_ID = resultado.playerID;
      PLAYER_NUMBER = resultado.playerNumber;
      $('#status_player_number').text(PLAYER_NUMBER);
      if (status === 'OK') {
        $('#section_game_board').show();
        console.log('UNIDO AL JUEGO');
        esperaTurno(PLAYER_ID);
      } else {
        if (status === 'NOT_FOUND') errorHandler('NO SE ENCONTRÓ EL JUEGO');
        errorHandler();
      }
    }
  });
}

//----------------------------------------------------------------------------
function esperaTurno(player_id) {

  $('body').css('cursor', 'wait');

  function ticToc() {
    $.ajax({
      url: '/status',
      type: 'GET',
      dataType: 'json',
      data: {
        player_id: player_id
      },
      error: errorHandler,
      success: function (resultado) {
        console.log(resultado);
        var number_of_players = resultado.number_of_players;
        var players_joined    = resultado.players_joined;
        // var board_size        = resultado.board_size;
        // var started           = resultado.started;
        var status            = resultado.status;
        var board             = resultado.board;
        var turn              = resultado.turn;

        $('#section_game_board').show();

        if (board) {
          board = JSON.parse(board);
          updateBoard(board);
        }

        switch (status) {
          case 'YOUR_TURN':
            $('body').css('cursor', 'auto');
            updateStatus('It\'s your turn', 'green');
            break;

          case 'WAIT':
            updateStatus('Player ' + turn + ' is making a move', 'red');
            setTimeout(ticToc, PAUSA);
            break;

          case 'NOT_FULL':
            msg = 'Waiting for players';
            msg += ' (' + players_joined + '/' + number_of_players + ')';
            updateStatus(msg);
            $('#section_game_board').hide();
            setTimeout(ticToc, PAUSA);
            break;

          case 'DRAW':
            updateStatus('EL JUEGO HA TERMINADO EN EMPATE', 'red');
            // finDeJuego('<strong>Empate.</strong>');
            break;

          case 'YOU_WIN':
            updateStatus('¡FELICIDADES GANASTE!', 'green');
            // resalta(resultado.tablero);
            break;

          case 'YOU_LOSE':
            updateStatus('EL JUEGO HA TERMINADO. ¡HAZ PERDIDO!', 'red');
            // resalta(resultado.tablero);
            break;
        }
      }
    });
  }
  setTimeout(ticToc, 0);
}

$(function () {

  //----------------------------------------------------------------------------
  // Formularios
  $('#form_create_game').submit(function (ev) {
    ev.preventDefault();
    var name = $('input#game_name').val();
    var players = $('input#game_players').val();
    var size = $('input#game_size').val();
    $.ajax({
      url: '/games/new',
      type: 'POST',
      dataType: 'json',
      error: errorHandler,
      data: {
        name: name,
        players: players,
        size: size
      },
      success: function (resultado) {
        var status = resultado.status;
        console.log(resultado);
        if (status === 'OK') {
          console.log('JUEGO CREADO CORRECTAMENTE');
          // JOIN TO THE GAME
          joinGame(resultado.gameID);
        } else {
          if (status === 'EXISTS') {
            errorHandler('YA EXISTE UN JUEGO CON ESE NOMBRE');
          } else {
            errorHandler();
          }
        }
      }
    });
  });

  $('#form_join_game').submit(function (ev) {
    ev.preventDefault();
    var game_id = $('select#game_id').val();
    console.log('JOINING TO: ' + game_id);
    joinGame(game_id);
  });

  //----------------------------------------------------------------------------
  // Acciones de los botones
  $('#btn_create_game').click(function () {
    $('#section_create_game').slideToggle();
  });
  $('#btn_join_game').click(function () {
    var section = $('#section_join_game');
    $.ajax({
      url: '/games/',
      type: 'GET',
      dataType: 'json',
      error: errorHandler,
      success: function (resultado) {
        console.log(resultado);
        var r = resultado.map(function (x) {
          return '<option value="' + x.id + '">' +
            escaparHtml(x.name) + '</option>';
        });
        if (r.length === 0) {
          $('p#no_games').show();
          $('#select_game').hide();
        } else {
          var options = r.join('');
          $('p#no_games').hide();
          $('select#game_id').html(options);
          $('#select_game').show();
        }
        section.slideToggle();
      }
    });
  });

});
