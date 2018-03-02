
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
    this.terraform = request.terraform
    this.apps = request.apps
    this.userDataPath = request.userDataPath
    this.user = request.user
    this.provider = request.provider
    this.security = request.security
    this.sshKey = request.sshKey
    this.userKeys = []
    /*
    
            user: request.user,
            settlement: s,
            security: user.providers[s.provider.type].security,
            sshKey,
            userDataPath: yield getUserData(s.provider.distribution, sshKey.getPublicKey(), dir),
            apps: s.apps,
            terraform: s.terraform
          }
          */
  }
  run() {
    console.log('run')
    const promise = new Promise((resolve, reject) => {
      //Create job directory
      if (this.security) {
        this.doClient = new DigitalOcean(this.security.api_token)
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
    this.terraform.variable.ssh_keys.default = this.userKeys
    this.terraform.variable.do_token.default = this.security.api_token
    this.terraform.variable.do_image.default = this.provider.config.do_image
    this.terraform.variable.do_region.default = this.provider.config.do_region
    this.terraform.variable.do_size.default = this.provider.config.do_size
    this.terraform.variable.name.default = this.provider.config.name
    this.terraform.variable.user_data.default = path.join(this.request.jobDirectory, 'userdata.sh')

    fs.writeFile(path.join(this.request.jobDirectory, "variables.tf.json"), JSON.stringify({ "variable": this.terraform.variable }, null, 4), (err) => {
      if (err)
        console.error(`File error: ${err}`)
    })
  }

  createMainJSON() {
    const ansibleCommands = this.createAnsible()
    ansibleCommands.forEach(command => {
      this.terraform.main.resource.digitalocean_droplet.app.provisioner.push({
        'local-exec': {
          'command': command
        }
      })
    })

    fs.writeFile(path.join(this.request.jobDirectory, "main.tf.json"), JSON.stringify(this.terraform.main, null, 4), (err) => {
      if (err)
        console.error(`Main error: ${err}`)
    })
  }

  createOutputJSON() {
    const output = {
      output: this.terraform.output
    }
    fs.writeFile(path.join(this.request.jobDirectory, "output.tf.json"), JSON.stringify(output, null, 4), (err) => {
      if (err)
        console.error(`Output error: ${err}`)
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
        ip: '${digitalocean_droplet.app.ipv4_address}'
      }

      ansible.push(this.request.createAnsibleCommand(ap))
    })

    return ansible
  }
}


module.exports = DOProvider