const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  tfState: { type: Schema.Types.Mixed },
  messageID: String
})

schema.set('timestamps', { createdAt: 'created_at', updatedAt: 'updated_at' });
schema.set('retainKeyOrder', true);

const State = mongoose.model('State', schema)
module.exports = State