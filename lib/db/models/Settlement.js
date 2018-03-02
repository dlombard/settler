const mongoose = require('mongoose')
const Schema = mongoose.Schema
const uuid = require('uuid/v4')

const schema = new Schema({
  messageID: { type: String, default: uuid() },
  status: { type: String, enum:['NEW', 'INPROGRESS', "FAILED", 'COMPLETED', 'DELETED', 'ARCHIVED'] },
  userId:{ type: Schema.Types.ObjectId, ref: 'User' },
  completedAt: {type: Date},
  serverInfo:{type: Schema.Types.Mixed},
  name: String
}, { strict: false })

schema.set('timestamps', { createdAt: 'createdAt', updatedAt: 'updatedAt' });
schema.set('retainKeyOrder', true);

const Settlement = mongoose.model('Settlement', schema)
module.exports = Settlement
