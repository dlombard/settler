const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  messageId: { type: String },
  status: { type: String }

}, { strict: false })

schema.set('timestamps', { createdAt: 'created_at', updatedAt: 'updated_at' });
schema.set('retainKeyOrder', true);

const Request = mongoose.model('Request', schema)
module.exports = Request
