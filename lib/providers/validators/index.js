const Joi = require('joi')
const logger = require('../../../logger')()
const _upper = require('lodash').toUpper

const baseSchema = Joi.object().keys({
  messageId: Joi.string(),
  userId: Joi.string().required(),
  action: Joi.string().required(),
  data: Joi.object().required()
})

const createSchema = Joi.object().keys({
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
        return Joi.validate(message.data, createSchema).then((data) => {
          const providerObj = { config: message.data.provider.config }
          const providerType = message.data.provider.type
          const path = __dirname + `/schemas/${providerType}`
          return Joi.validate(providerObj, require(path).schema)
        })
        break
    }

  })
}

module.exports = validate