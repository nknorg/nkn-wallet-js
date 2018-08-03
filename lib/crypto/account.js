'use strict'

const Is = require('is')
const Algorithm = require('./algorithm')

function genAccountContractString(signatureRedeem, programHash) {
  let contract = ''

  contract += Algorithm.prefixByteCountToHexString(signatureRedeem)
  contract += Algorithm.prefixByteCountToHexString('00')
  contract += programHash

  return contract
}

/***
 *
 * @param privateKey
 * @returns {*}
 */
let account = function (privateKey) {
  let key = null
  if(Is.string(privateKey)) {
    key = Algorithm.restoreKey(privateKey)
  } else {
    key = Algorithm.newKey()
  }

  let address = Algorithm.programHashString2Address(key.programHash)
  let contract = genAccountContractString(key.signatureRedeem, key.programHash)

  this.getAddress = function () {
    return address
  }

  this.getKey = function () {
    return  key
  }

  this.getPublicKey = function () {
    return key.publicKey
  }

  this.getPrivateKey = function () {
    return key.privateKey
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

function restoreAccount(privateKey) {
  return new account(privateKey)
}

module.exports = {
  newAccount,
  restoreAccount
}
