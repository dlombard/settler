let winston = require('winston');
let moment = require('moment')
const config = winston.config;
const tsFormat = () => moment().format();

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
    return new winston.Logger({
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
  }
  else {
    let logger = new winston.Logger({
      transports: [
        new (winston.transports.Console)({
          timestamp: tsFormat,
          colorize: true,
          handleExceptions: true,
          json: false,
          formatter: (options) => {
            return options.timestamp() + ' ' +
              config.colorize(options.level, options.level.toUpperCase()) + ' ' + `[${messageId}] - ` +
              (options.message ? options.message : '') +
              (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
          }
        })
      ],
      exitOnError: false,
    });
    return logger
  }
}
module.exports = createLogger;
module.exports.stream = {
  write: function (message, encoding) {
    _logger.info(message);
  },
};
