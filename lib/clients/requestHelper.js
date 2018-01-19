const Promise = require('bluebird')
const axios = require('axios')
class RequestHelper {
  constructor(api_token) {
    this.header = {
      'authorization': `Bearer ${api_token}`,
      'content_type': 'application/json'
    }
    this._axios = axios.create({
      baseURL: 'https://api.digitalocean.com/v2'
    })
    this._axios.defaults.headers.common['Authorization'] = `Bearer ${api_token}`;
    this._axios.defaults.headers.post['Content-Type'] = 'application/json';
    this._axios.defaults.headers.get['Content-Type'] = 'application/json';
  }

  exec(options){
    return this._axios(options)
  }
}
module.exports = RequestHelper