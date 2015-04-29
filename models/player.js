var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var playerSchema = new Schema({
  game: Schema.Types.ObjectId,
  number: { type: Number, default: 1 }
});


module.exports = mongoose.model('Player', playerSchema);