'use strict';

const nacl = require('tweetnacl');
const maxUintBits = require('../common/serialize').maxUintBits;

function prefixByteCountToHexString(hexString) {
  let len = hexString.length
  if(0 === len) {
    return '00'
  }

  if(1 === len%2) {
    hexString = '0' + hexString
    len += 1
  }

  let byteCount = len / 2

  byteCount = byteCount.toString(16)
  if(1 === byteCount.length % 2) {
    byteCount = '0' + byteCount
  }

  return byteCount + hexString
}

function hexToBytes(hex) {
  for (var bytes = [], c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return new Uint8Array(bytes);
}

function bytesToHex(bytes) {
  return Array.from(bytes, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2)
  }).join('');
}

function paddingSignature(data, len) {
  for(let i = 0; i < len - data.length; i++){
    data = '0' + data
  }
  return data
}

var randomBytes;
if (typeof navigator != 'undefined' && navigator.product === "ReactNative") {
  randomBytes = require('crypto').randomBytes;
} else {
  randomBytes = nacl.randomBytes;
}

function randomBytesHex(len) {
  return bytesToHex(randomBytes(len));
}

function randomUint64() {
  let hex = randomBytesHex(maxUintBits/8);
  return parseInt(hex, 16);
}

function mergeTypedArrays(a, b) {
  var c = new a.constructor(a.length + b.length);
  c.set(a);
  c.set(b, a.length);
  return c;
}

module.exports = {
  prefixByteCountToHexString,
  hexToBytes,
  bytesToHex,
  paddingSignature,
  randomBytes,
  randomBytesHex,
  randomUint64,
  mergeTypedArrays,
}
