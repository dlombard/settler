const Joi = require('joi')
const logger = require('../../../logger').logger()
const _upper = require('lodash').toUpper

const baseSchema = Joi.object().keys({
  messageId: Joi.string().required(),
  user: Joi.object().required(),
  settlementId: Joi.string().required(),
  action: Joi.string().required(),
  settlements: Joi.array().required()
})

const createSchema = Joi.object().keys({
  settlements: Joi.array(),
  provider: Joi.object({
    type: Joi.string().required(),
    config: Joi.object().required()
  }),
  app: Joi.object().required()
})

const deleteSchema = Joi.object().keys({
  settlementId: Joi.string().required()
})

const validate = (message) => {

  return Joi.validate(message, baseSchema).then((r) => {

    switch (_upper(message.action)) {
      case 'DELETE':
        return Joi.validate(message.data, deleteSchema)
        break
      case 'CREATE':
        return r
        /*return Joi.validate(message.data, createSchema).then((data) => {
          const providerObj = { config: message.data.provider.config }
          const providerType = message.data.provider.type
          const path = __dirname + `/schemas/${providerType}`
          return Joi.validate(providerObj, require(path).schema)
        })*/
        break
    }

  })
}

module.exports = validate