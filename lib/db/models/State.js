const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  tfState: { type: Schema.Types.Mixed },
  settlementId: { type: Schema.Types.ObjectId, ref: 'Settlement' },
  initTf: { type: Schema.Types.Mixed },
  variable: { type: Schema.Types.Mixed },
  output: { type: Schema.Types.Mixed },
  state: { type: Schema.Types.Mixed },
  main: { type: Schema.Types.Mixed },
  messageID: String
})

schema.set('timestamps', { createdAt: 'created_at', updatedAt: 'updated_at' });
schema.set('retainKeyOrder', true);

const State = mongoose.model('State', schema)
module.exports = State