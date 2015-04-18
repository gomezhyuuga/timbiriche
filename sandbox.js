var DOT_SYMBOL = '●';
var SPACE_SYMBOL = ' ';
var VERTICAL_SYMBOL = '|';
var HORIZONTAL_SYMBOL = '–';

function createBoard(n) {
  var size = 2 * n - 1;
  var matrix = new Array(size);
  var dot = true;
  for (var i = 0; i < size; i++) {
    var row = new Array(size);
    for (var j = 0; j < size; j++) {
      // Even rows always have blank spaces
      if (i % 2 !== 0) {
        row[j] = ' ';
      } else { // Odd rows can have dot or space
        if (dot) row[j] = DOT_SYMBOL;
        else row[j] = SPACE_SYMBOL;
        dot = !dot; // Toggle 'put dot or space'
      }
    }
    dot = true;
    matrix[i] = row;
  }
  return matrix;
}
// Format number as two chars width
function fnum(num) {
  if (num < 10) return ' ' + num;
  else return num;
}
function printBoard(matrix) {
  // Print column names as ABCD...
  process.stdout.write('  ');
  for (var i = 0; i < matrix.length; i++) {
    process.stdout.write(' ' + String.fromCharCode(i + 65));
  }
  console.log('');

  matrix.forEach(function (row, index) {
    console.log(fnum(index) + ' ' + row.join(' '));
  });
}

function mark(board, position) {
  var symbol;
  var row = +position[1];
  var col = position[0].charCodeAt(0) - 65;
  // Row number odd? symbol -> |, else -> _
  symbol = (row % 2) !== 0 ? VERTICAL_SYMBOL : HORIZONTAL_SYMBOL;
  board[ row ][ col ] = symbol;
}

var m = createBoard(process.argv[2] || 10);
printBoard(m);

