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
    this.terraform = request.terraform
    this.apps = request.apps
    this.userDataPath = request.userDataPath
    this.user = request.user
    this.provider = request.provider
    this.security = request.security
    this.sshKey = request.sshKey
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
    this.terraform.variable.aws_access_key.default = this.request.security.access_key
    this.terraform.variable.aws_secret_key.default = this.request.security.secret_access_key
    this.terraform.variable.aws_region.default = this.provider.config.aws_region
    this.terraform.variable.aws_blueprint_id.default = this.provider.config.aws_blueprint_id
    this.terraform.variable.aws_availibility_zone.default = this.provider.config.aws_availibility_zone
    this.terraform.variable.aws_bundle_id.default = this.provider.config.aws_bundle_id
    this.terraform.variable.aws_key_pair_name.default = this.provider.config.aws_key_pair_name
    this.terraform.variable.name.default = this.provider.config.name
    this.terraform.variable.user_data.default = path.join(this.jobDirectory, 'userdata.sh')
    fs.writeFile(path.join(this.jobDirectory, "variables.tf.json"), JSON.stringify({ "variable": this.terraform.variable }), (err) => {
      if (err)
        logger.error(`File error: ${err}`)
    })
  }

  createMainJSON() {

    const ansibleCommands = this.createAnsible()
    ansibleCommands.forEach(command => {
      this.terraform.main.resource.aws_lightsail_instance.app.provisioner.push({
        'local-exec': {
          'command': command
        }
      })
    })
    fs.writeFile(path.join(this.jobDirectory, "main.tf.json"), JSON.stringify(this.terraform.main), (err) => {
      if (err)
        logger.error(`Main error: ${err}`)
    })
  }

  createOutputJSON() {
    const output = {
      output: this.terraform.output
    }
    fs.writeFile(path.join(this.jobDirectory, "output.tf.json"), JSON.stringify(output), (err) => {
      if (err)
        logger.error(`Output error: ${err}`)
    })
  }

  createAnsible() {
    let ansible = []
    this.apps.forEach(app => {
      const playbook_location = `${process.env.PLAYBOOK_LOCATION}/${app.app}/${app.playbook}`
      const ap = {
        priv_key: this.sshKey.getFilename(),
        playbook: playbook_location,
        distribution: this.provider.config.distribution,
        ip: '${aws_lightsail_instance.app.public_ip_address}'
      }

      ansible.push(this.request.createAnsibleCommand(ap))
    })

    return ansible
  }
}

module.exports = LightsailProvider