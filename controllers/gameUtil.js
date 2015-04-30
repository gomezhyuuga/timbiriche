var DOT_SYMBOL = '●';
var BLANK_SYMBOL = ' ';
var VERTICAL_SYMBOL = '|';
var HORIZONTAL_SYMBOL = '–';

// Format number as two chars width
function fnum(num) {
  if (num < 10) return ' ' + num;
  else return num;
}

module.exports.createBoard = function createBoard(n) {
  n = n || 3;
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
        if (dot) row[j] = DOT_SYMBOL;
        else row[j] = BLANK_SYMBOL;
        dot = !dot; // Toggle 'put dot or space'
      }
    }
    dot = true;
    matrix[i] = row;
  }
  return matrix;
}
module.exports.printBoard = function printBoard(matrix, score) {
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

function validMove(position, board) {
  var row = +(position.substr(1));
  var col = +(position[0].charCodeAt(0) - 65);

  var aSize = board.length;

  if (row >= aSize
    || row < 0
    || col < 0
    || col >= aSize) return false;

  if (board[row][col] !== BLANK_SYMBOL) return false;

  return true;
}

module.exports.validMove = validMove;

module.exports.makeMove = function (board, position, playerNum) {
  var row = +(position.substr(1));
  var col = +(position[0].charCodeAt(0) - 65);
  // TOOD: validate Move
  if (!validMove(position, board)) return false

  var closedBoxes = 0;
  var symbol = (row % 2 === 0) ? HORIZONTAL_SYMBOL : VERTICAL_SYMBOL;

  // Mark the box
  board[ row ][ col ] = symbol;

  // CHECK IF A BOX WAS CLOSED
  if (symbol === VERTICAL_SYMBOL) {
    // LEFT BOX
    if (board[row] !== undefined
      && board[row - 1] !== undefined
      && board[row + 1] !== undefined
      && board[row][col - 2] === VERTICAL_SYMBOL
      && board[row + 1][col - 1] === HORIZONTAL_SYMBOL
      && board[row - 1][col - 1] === HORIZONTAL_SYMBOL) {
      closedBoxes++;
      // Mark closed square
      board[row][col - 1] = playerNum;
    }
    // RIGHT BOX
    if (board[row] !== undefined
      && board[row + 1] !== undefined
      && board[row - 1] !== undefined
      && board[row][col + 2] === VERTICAL_SYMBOL
      && board[row + 1][col + 1] === HORIZONTAL_SYMBOL
      && board[row - 1][col + 1] === HORIZONTAL_SYMBOL) {
      closedBoxes++;
      // Mark closed square
      board[row][col + 1] = playerNum;
    }
  } else {
    // D2 => [2][3]
    // UPPER BOX
    if (board[row - 2] !== undefined
      && board[row - 1] !== undefined
      && board[row - 2][col] === HORIZONTAL_SYMBOL
      && board[row - 1][col - 1] === VERTICAL_SYMBOL
      && board[row - 1][col + 1] === VERTICAL_SYMBOL) {
      closedBoxes++;
      // Mark closed square
      board[row - 1][col] = playerNum;
    }
    // LOWER BOX
    if (board[row + 2] !== undefined
      && board[row + 1] !== undefined
      && board[row + 2][col] === HORIZONTAL_SYMBOL
      && board[row + 1][col - 1] === VERTICAL_SYMBOL
      && board[row + 1][col + 1] === VERTICAL_SYMBOL) {
      closedBoxes++;
      // Mark closed square
      board[row + 1][col] = playerNum;
    }
  }
  return closedBoxes;
}