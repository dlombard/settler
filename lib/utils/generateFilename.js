var crypto = require('crypto');

module.exports = () => {
  const chars = "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789"
  var rnd = crypto.randomBytes(8)
  , value = new Array(8)
  , len = chars.length;

for (var i = 0; i < 8; i++) {
  value[i] = chars[rnd[i] % len]
};

return value.join('');
}