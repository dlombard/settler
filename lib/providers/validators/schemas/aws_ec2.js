const Joi = require('joi')

exports.schema = Joi.object().keys({
  config: Joi.object({
    "aws_region": Joi.string().required(),
    "aws_ami": Joi.string().required(),
    "aws_availibility_zone": Joi.string().required(),
    "aws_ec2_instance_type": Joi.string().required(),
    "aws_key_pair_name": Joi.string().required(),
    "name": Joi.string().required(),
    "distribution": Joi.string().required(),
    "distribution_version": Joi.string().required()
  })
})