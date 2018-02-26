const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  lock: { type: Schema.Types.Mixed },
  type: String,
  ID: { type: String, unique: true },
  status: { type: String }
})

schema.set('timestamps', { createdAt: 'created_at', updatedAt: 'updated_at' });
schema.set('retainKeyOrder', true);

const Lock = mongoose.model('Lock', schema)
module.exports = Lock