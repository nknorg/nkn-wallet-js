'use strict';

const nacl = require('tweetnacl');;
const is = require('is');

const protocol = require('./protocol');
const tools = require('./tools');
const errors = require('../common/errors');

let Key = function (seed) {
  this.sign = function (message) {
    let sig = nacl.sign.detached(message, this.key.secretKey);
    return tools.paddingSignature(tools.bytesToHex(sig), nacl.sign.signatureLength)
  }

  if(is.string(seed)) {
    let seedBytes
    try {
      seedBytes = tools.hexToBytes(seed);
    } catch (e) {
      throw errors.Error(errors.code.invalidArgument, 'seed is not a valid hex string')
    }
    setKeyPair.call(this, seedBytes);
  } else {
    setKeyPair.call(this, tools.randomBytes(nacl.sign.seedLength));
  }
}

function setKeyPair(seed) {
  let key = nacl.sign.keyPair.fromSeed(seed);
  this.key = key;
  this.publicKey = tools.bytesToHex(key.publicKey);
  this.privateKey = tools.bytesToHex(key.secretKey);
  this.seed = tools.bytesToHex(seed);
  this.signatureRedeem = protocol.publicKeyToSignatureRedeem(this.publicKey);
  this.programHash = protocol.hexStringToProgramHash(this.signatureRedeem);
  return key;
}

function newKey() {
  return new Key()
}

function restoreKey(seed) {
  if(!is.string(seed)) {
    throw errors.Error(errors.code.invalidArgument, 'seed is not a string')
  }
  return new Key(seed)
}

module.exports = {
  newKey,
  restoreKey,
}
