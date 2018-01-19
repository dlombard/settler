const Joi = require('joi')

exports.schema = Joi.object().keys({
  config: Joi.object({
    "do_region": Joi.string().required(),
    "name": Joi.string().required(),
    "do_image": Joi.string().required(),
    "do_size": Joi.string().required(),
    "distribution": Joi.string().required(),
    "distribution_version": Joi.string().required()
  })
})