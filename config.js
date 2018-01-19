let config = {
  mongoose: {
    options: {
      useMongoClient: true,
    },
  },
  mongo: {
    poolSize: 10,
    appname: 'OneClick',
    validateOptions: true,
    forceServerObjectId: true,
    autoIndex: false,
    useMongoClient: true,
    autoReconnect: true,
    keepAlive: 120,
  },
  ansible:{
    'playbooks':{
      uploadPath: './scripts'
    }
  }
}

module.exports = config
