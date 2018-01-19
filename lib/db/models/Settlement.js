const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  messageId: { type: String },
  status: { type: String },
  userId:{ type: Schema.Types.ObjectId, ref: 'User' }

}, { strict: false })

schema.set('timestamps', { createdAt: 'created_at', updatedAt: 'updated_at' });
schema.set('retainKeyOrder', true);

const Settlement = mongoose.model('Settlement', schema)
module.exports = Settlement
