'use strict'

const config = require('../config')
var crypto = require('crypto');

function encrypt(data) {
  var cipher = crypto.createCipher('aes-256-ecb', config.SECRET_KEY_CRYPTO);
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
}

function decrypt(data) {
  var cipher = crypto.createDecipher('aes-256-ecb', config.SECRET_KEY_CRYPTO);
  return cipher.update(data, 'hex', 'utf8') + cipher.final('utf8');
}

module.exports = {
	encrypt,
	decrypt
}
