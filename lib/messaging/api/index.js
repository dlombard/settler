const express = require('express')
const compression = require('compression');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet')
const logger = require('../../../logger').stream
const http = require('http');
const events = require('../../events')
const swaggerize = require('swaggerize-express');
const SwaggerParser = require('swagger-parser');
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

    this.app.use('/', express.static(path.join(__dirname, 'public')))
    this.app.use('/files', express.static(path.join(__dirname, 'files')))
    this.app.use('/js', express.static(path.join(__dirname, 'js')))

    SwaggerParser.validate(require('./public/files/swagger.json'))
      .then((api) => {

        this.app.use('/v1',swaggerize({
          api: api,
          docspath: '/api-docs',
          handlers: './handlers'
        }));
      })
      .catch(function (err) {
        console.error(err)
      });

  }

  start() {
    const port = process.env.PORT || 8080
    this.server = http.createServer(this.app)
    this.server.listen(port);
  }

  close() {
    this.server.close()
  }
}

const api = new API()
module.exports = api