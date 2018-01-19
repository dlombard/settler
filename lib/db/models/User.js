const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  firstname: String,
  lastname: String,
  okta_id: String,
  providers: { type: Schema.Types.Mixed },
  ssh_keys:
    {
      fingerprint: { type: String },
      name: { type: String },
      publick_key: { type: String }
    },
  settlements: [{ type: Schema.Types.ObjectId, ref: 'Settlement' }]

})

schema.set('timestamps', { createdAt: 'created_at', updatedAt: 'updated_at' });
schema.set('retainKeyOrder', true);

const User = mongoose.model('User', schema)
module.exports = User