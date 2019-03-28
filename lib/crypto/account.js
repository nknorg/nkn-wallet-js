'use strict';

const is = require('is');

const { newKey, restoreKey } = require('./key');
const protocol = require('./protocol');
const tools = require('./tools');

function genAccountContractString(signatureRedeem, programHash) {
  let contract = ''

  contract += tools.prefixByteCountToHexString(signatureRedeem)
  contract += tools.prefixByteCountToHexString('00')
  contract += programHash

  return contract
}

/***
 *
 * @param seed
 * @returns {*}
 */
let account = function (seed) {
  let key = null
  if(is.string(seed)) {
    key = restoreKey(seed)
  } else {
    key = newKey()
  }

  let address = protocol.programHashStringToAddress(key.programHash)
  let contract = genAccountContractString(key.signatureRedeem, key.programHash)

  this.getAddress = function () {
    return address
  }

  this.getKey = function () {
    return key
  }

  this.getPublicKey = function () {
    return key.publicKey
  }

  this.getPrivateKey = function () {
    return key.privateKey
  }

  this.getSeed = function () {
    return key.seed
  }

  this.getProgramHash = function () {
    return key.programHash
  }

  this.getSignatureRedeem = function () {
    return key.signatureRedeem
  }

  this.getContractString = function () {
    return contract
  }
}

function newAccount() {
  return new account()
}

function restoreAccount(seed) {
  if(!is.string(seed)) {
    throw 'Seed is not a string'
  }

  return new account(seed)
}

module.exports = {
  newAccount,
  restoreAccount
}
