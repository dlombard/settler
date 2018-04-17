const express = require('express')
const compression = require('compression');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet')
const logger = require('../../logger').stream
const http = require('http');
const config = require('../../config')
const swaggerize = require('swaggerize-express');
const SwaggerParser = require('swagger-parser');
const routes = require('./routes')

const path = require('path')

class API {
  constructor() {
    this.app = express()

    this.app.use(helmet())
    this.app.use(compression());
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(cookieParser());
    this.app.use(require('morgan')('combined', { 'stream': logger }))

    this.app.use('/terraform', routes)

  }

  start() {
    const port = config.api.port || 8080
    this.server = http.createServer(this.app)
    console.log('server created')
    return this.server.listen(port);
  }

  close() {
    this.server.close()
  }
}

const api = new API()
module.exports = api