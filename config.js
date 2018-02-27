let config = {
  api: {
    base_url: 'http://127.0.0.1',
    port: 26001
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
  ansible: {
    'playbooks': {
      uploadPath: './scripts'
    }
  },
  rabbitMQ: {
    queue: 'tasks',
    exchange: 'tasks',
    exchange_type: 'topic',
    routing_key: 'task.default'
  }
}

module.exports = config
