module.exports = {
  'GET_GAMES': { method: 'GET', uri: '/games/'},
  'CREATE_GAME': { method: 'POST', uri: '/games/new'},
  'JOIN_GAME': { method: 'PUT', uri: '/join'},
  'STATUS': { method: 'GET', uri: '/status'},
  'MAKE_MOVE': { method: 'PUT', uri: '/make_move'},
  'CODES': {
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
}