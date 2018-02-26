
let logger
const trim = require('lodash').trim
const Promise = require('bluebird')
const DigitalOcean = require('./client/DO')
const Droplet = require('./client/droplet')
const fs = require('fs')
const path = require('path')

class DOProvider {
  constructor(request) {
    this.type = 'digitalocean'
    this.request = request
    this.userKeys = []
  }
  run() {
    console.log('run')
    const promise = new Promise((resolve, reject) => {
      //Create job directory
      if (this.request.security) {
        this.doClient = new DigitalOcean(this.request.security.api_token)
        return this.doClient.getAllSSHKeys().then((keys) => {
          if (keys) {
            keys.forEach((key) => {
              this.userKeys.push(key.id)
            })
            this.createVariablesJSON()
            this.createOutputJSON()
            this.createMainJSON()
            resolve()
          } else {
            reject()
          }

        }).catch((err) => {
          reject(err)
        })
      }
    })
    return promise
  }

  createVariablesJSON() {
    this.request.tfVariables.ssh_keys.default = this.userKeys
    this.request.tfVariables.do_token.default = this.request.security.api_token
    this.request.tfVariables.do_image.default = this.request.data.provider.config.do_image
    this.request.tfVariables.do_region.default = this.request.data.provider.config.do_region
    this.request.tfVariables.do_size.default = this.request.data.provider.config.do_size
    this.request.tfVariables.name.default = this.request.data.provider.config.name
    this.request.tfVariables.user_data.default = path.join(this.request.jobDirectory, 'userdata.sh')
    fs.writeFile(path.join(this.request.jobDirectory, "variables.tf.json"), JSON.stringify({ "variable": this.request.tfVariables }), (err) => {
      if (err)
        console.error(`File error: ${err}`)
    })
  }

  createMainJSON() {

    this.request.tfMain.resource.digitalocean_droplet.app.provisioner['local-exec'].command = this.createAnsible()

    fs.writeFile(path.join(this.request.jobDirectory, "main.tf.json"), JSON.stringify(this.request.tfMain), (err) => {
      if (err)
        console.error(`Main error: ${err}`)
    })
  }

  createOutputJSON() {
    const output = {
      output: this.request.tfOutput
    }
    fs.writeFile(path.join(this.request.jobDirectory, "output.tf.json"), JSON.stringify(output), (err) => {
      if (err)
        console.error(`Output error: ${err}`)
    })
  }

  createAnsible() {
    const playbook_location = `${process.env.PLAYBOOK_LOCATION}/${this.request.app.app}/${this.request.app.playbook}`
    const ap = {
      priv_key: this.request.sshKey.getFilename(),
      playbook: playbook_location,
      distribution: this.request.data.provider.config.distribution,
      ip: '${digitalocean_droplet.app.ipv4_address}'
    }
    return this.request.createAnsibleCommand(ap)
  }
}


module.exports = DOProvider