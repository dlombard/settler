const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  messageId: { type: String },
  status: { type: String }

}, { strict: false })

schema.set('timestamps', { createdAt: 'created_at', updatedAt: 'updated_at' });
schema.set('retainKeyOrder', true);

const Job = mongoose.model('Job', schema)
module.exports = Job
