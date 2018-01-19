const Request = require('../requestHelper')


class DigitalOcean {
  constructor(api_token) {
    this.api_token = api_token
    this.request = new Request(this.api_token)
  }

  getAllSSHKeys() {
    const options = {
      url: '/account/keys'
    }
    const promise = new Promise((resolve, reject) => {
      this.request.exec(options).then((res) => {
        resolve(res.data.ssh_keys)
      }).catch((err) => {
        reject(err)
      })
    })

    return promise
  }

  createDroplet(droplet) {
    const options = {
      url: '/droplets',
      data: JSON.stringify(droplet),
      method: 'post'
    }
    const promise = new Promise((resolve, reject) => {
      this.request.exec(options).then((res) => {
        resolve(res.data.droplet)
      }).catch((err) => {
        reject(err)
      })
    })

    return promise
  }

  getDroplet(dropletID) {
    const options = {
      url: `/droplets/${dropletID}`
    }
    const promise = new Promise((resolve, reject) => {
      this.request.exec(options).then((res) => {
        resolve(res.data.droplet)
      }).catch((err) => {
        reject(err)
      })
    })

    return promise
  }

  deleteDroplet(dropletID) {
    const options = {
      url: `/droplets/${dropletID}`,
      method: `delete`
    }

    const promise = new Promise((resolve, reject) => {
      this.request.exec(options).then((res) => {
        resolve(res)
      }).catch((err) => {
        reject(err)
      })
    })

    return promise
  }

}

module.exports = DigitalOcean