'use strict';

const CryptoJS = require('crypto-js');
const nacl = require('tweetnacl');

const hash = require('./hash');
const tools = require('./tools');

function genAESIV() {
  return tools.randomBytesHex(16)
}

function genAESPassword() {
  return tools.randomBytesHex(32)
}

function encrypt(plaintext, password, iv, isSimplePassword = false) {
  password = isSimplePassword ? hash.doubleSha256(password) : password

  return CryptoJS.AES.encrypt(
    plaintext,
    hash.cryptoHexStringParse(password),
    {
      iv: hash.cryptoHexStringParse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.NoPadding
    }
  ).ciphertext.toString(CryptoJS.enc.Hex)
}

function decrypt(ciphertext, password, iv, isSimplePassword = false) {
  password = isSimplePassword ? hash.doubleSha256(password) : password

  return CryptoJS.AES.decrypt(
    CryptoJS.enc.Base64.stringify(ciphertext),
    hash.cryptoHexStringParse(password),
    {
      iv: hash.cryptoHexStringParse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.NoPadding
    }
  ).toString()
}

module.exports = {
  encrypt,
  decrypt,
  genAESIV,
  genAESPassword,
}
