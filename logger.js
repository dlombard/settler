let winston = require('winston');
let moment = require('moment')
const config = winston.config;
const tsFormat = () => moment().format();
let loggers = {}

let logger = new winston.Logger({
  transports: [
    new (winston.transports.Console)({
      timestamp: tsFormat,
      colorize: true,
      handleExceptions: true,
      json: false,
    })
  ],
  exitOnError: false,
});

const createLogger = (messageId) => {
  if (!messageId) {
    return logger
  }
  else {
    if (!loggers[messageId]) {
      let mylogger = new winston.Logger({
        transports: [
          new (winston.transports.Console)({
            timestamp: tsFormat,
            colorize: true,
            handleExceptions: true,
            json: false,
            formatter: (options) => {
              return options.timestamp() + ' - ' +
                config.colorize(options.level, `${options.level.toLowerCase()}`) + ': ' + `[${messageId}] - ` +
                (options.message ? options.message : '') +
                (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
            }
          })
        ],
        exitOnError: false,

      });
      loggers[messageId] = mylogger
      return mylogger
    }
    return loggers[messageId]
  }
}

const deleteLogger = (messageId) => {
  if (loggers[messageId]) {
    delete loggers[messageId]
  }
}
module.exports.delete = deleteLogger
module.exports.logger = createLogger;
module.exports.stream = {
  write: function (message, encoding) {
    logger.info(message);
  },
};
