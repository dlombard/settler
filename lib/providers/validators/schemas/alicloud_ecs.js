const Joi = require('joi')

exports.schema = Joi.object().keys({
  config: Joi.object({
    "ali_region": Joi.string().required(),
    "ali_image_id": Joi.string().required(),
    "ali_security_groups": Joi.array().items(Joi.string()).required(),
    "ali_instance_type": Joi.string().required(),
    "name": Joi.string().required(),
    "distribution": Joi.string().required(),
    "distribution_version": Joi.string().required()
  })
})