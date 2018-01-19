const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  app: { type: String },
  version: { type: String },
  targetRelease: { type: String },
  description: { type: String },
  playbook: { type: String },
  restrictions: [
    {
      k: { type: String },
      v: { type: String }
    }
  ],
  providers: 
    {
      name: String,
      image: {}
    }
  

})

schema.set('timestamps', { createdAt: 'created_at', updatedAt: 'updated_at' });
schema.set('retainKeyOrder', true);

const App = mongoose.model('App', schema)
module.exports = App
