const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  script: { type: Schema.Types.Mixed },
  vm_id: String
}, { collection: 'cloudinit' })

schema.set('timestamps', { createdAt: 'created_at', updatedAt: 'updated_at' });
schema.set('retainKeyOrder', true);

const CloudInit = mongoose.model('CloudInit', schema)
module.exports = CloudInit