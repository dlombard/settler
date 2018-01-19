const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  provider: { type: String },
  variable: {},
  main: {},
  output: {}
}, { collection: 'terraform' })

schema.set('timestamps', { createdAt: 'created_at', updatedAt: 'updated_at' });
schema.set('retainKeyOrder', true);

const Terraform = mongoose.model('Terraform', schema)
module.exports = Terraform
