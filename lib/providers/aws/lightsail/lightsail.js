const AWS = require('aws-sdk')
const Promise = require('bluebird')
let logger
const fs = require('fs');
const trim = require('lodash').trim
const path = require("path")

class LightsailProvider {
  constructor(request) {
    this.type = 'aws_lightsail'
    this.request = request
    this.tfVariables = this.request.tfVariables
    this.tfOutput = this.request.tfOutput
    this.tfMain = this.request.tfMain
    this.jobDirectory = this.request.jobDirectory
  }

  run() {
    const promise = new Promise((resolve, reject) => {
      this.createVariablesJSON()
      this.createOutputJSON()
      this.createMainJSON()
      resolve()
    })

    return promise
  }

  createVariablesJSON() {
    this.tfVariables.aws_access_key.default = this.request.security.access_key
    this.tfVariables.aws_secret_key.default = this.request.security.secret_access_key
    this.tfVariables.aws_region.default = this.request.data.provider.config.aws_region
    this.tfVariables.aws_blueprint_id.default = this.request.data.provider.config.aws_blueprint_id
    this.tfVariables.aws_availibility_zone.default = this.request.data.provider.config.aws_availibility_zone
    this.tfVariables.aws_bundle_id.default = this.request.data.provider.config.aws_bundle_id
    this.tfVariables.aws_key_pair_name.default = this.request.data.provider.config.aws_key_pair_name
    this.tfVariables.name.default = this.request.data.provider.config.name
    this.tfVariables.user_data.default = path.join(this.jobDirectory, 'userdata.sh')
    fs.writeFile(path.join(this.jobDirectory, "variables.tf.json"), JSON.stringify({ "variable": this.tfVariables }), (err) => {
      if (err)
        logger.error(`File error: ${err}`)
    })
  }

  createMainJSON() {
    this.tfMain.resource.aws_lightsail_instance.app.provisioner['local-exec'].command = this.createAnsible()

    fs.writeFile(path.join(this.jobDirectory, "main.tf.json"), JSON.stringify(this.tfMain), (err) => {
      if (err)
        logger.error(`Main error: ${err}`)
    })
  }

  createOutputJSON() {
    const output = {
      output: this.tfOutput
    }
    fs.writeFile(path.join(this.jobDirectory, "output.tf.json"), JSON.stringify(output), (err) => {
      if (err)
        logger.error(`Output error: ${err}`)
    })
  }

  createAnsible() {
    const playbook_location = `${process.env.PLAYBOOK_LOCATION}/${this.request.app.app}/${this.request.app.playbook}`
    const ap = {
      priv_key: this.request.sshKey.getFilename(),
      playbook: playbook_location,
      distribution: this.request.data.provider.config.distribution,
      ip: '${aws_lightsail_instance.app.public_ip_address}'
    }
    return this.request.createAnsibleCommand(ap)
  }
}

module.exports = LightsailProvider