const logger = require('../logger').logger();
const DBClient = require('./db/DBClient');
const fs = require('fs')
const path = require("path")
const events = require('events')
let messagingProviders = []
const providers = require('./providers')
class OneClickServer {
  constructor() {
    logger.info('CREATING OneClickServer');
    this.dbclient = DBClient;
    // listen for TERM signal .e.g. kill 
    process.on('SIGTERM', () => {
      this.gracefulShutdown();
    });

    // listen for INT signal e.g. Ctrl-C
    process.on('SIGINT', () => {
      this.gracefulShutdown();
    });

    process.on('uncaughtException', (err) => {
      logger.error(err);
      process.exit(0);
    });
    process.on('warning', e => console.warn(e.stack));
  }

  start() {

    this.dbclient.start().then((db) => {
      this.initializeMessaging()
    }).catch((err) => {
      setTimeout(() => {
        this.start()
      }, 5000);
    })
  }

  initializeMessaging() {
    fs.readdir('./lib/messaging', (err, items) => {
      if (err) {
        logger.error(err)
      }
      else {
        items.forEach(item => {
          fs.stat(path.join(__dirname, 'messaging', item), (err, obj) => {
            if (err) {
              logger.error(err)
            }
            else {
              if (obj.isDirectory()) {
                const m = require(`./messaging/${item}`)
                m.start()
                messagingProviders.push(m)
              }
            }
          })
        })
      }
    })
  }
  gracefulShutdown() {
    logger.info('Received kill signal, shutting down gracefully.');
    messagingProviders.forEach(x => {
      x.close()
    })
    this.dbclient.close().then(() => {
      process.exit(0)
    })
  }
}

const ocs = new OneClickServer();
//Create job directory
fs.mkdir(path.join(__dirname, '..', 'jobs'), (err) => {
  if (err)
    logger.error(err)
  global.jobDir = path.join(__dirname, '..', 'jobs')
})

ocs.start();

module.exports = ocs;


