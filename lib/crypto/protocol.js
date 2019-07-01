'use strict';

const BITCOIN_BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const base58 = require('base-x')(BITCOIN_BASE58);
const CryptoJS = require('crypto-js');

const hash = require('./hash');
const tools = require('./tools');

const ADDRESS_GEN_PREFIX = '02b825';
const ADDRESS_GEN_PREFIX_LEN = ADDRESS_GEN_PREFIX.length / 2;
const UINT160_LEN = 20;
const CHECKSUM_LEN = 4;
const ADDRESS_LEN = ADDRESS_GEN_PREFIX_LEN + UINT160_LEN + CHECKSUM_LEN;

/***
*
* @param address
* @returns {boolean}
*/
function verifyAddress(address) {
  let addressBytes = base58.decode(address);

  if (addressBytes.length !== ADDRESS_LEN) {
    return false;
  }

  let addressPrefixBytes = addressBytes.slice(0, ADDRESS_GEN_PREFIX_LEN);
  let addressPrefix = tools.bytesToHex(addressPrefixBytes);
  if (addressPrefix !== ADDRESS_GEN_PREFIX) {
    return false
  }

  let programHash = addressStringToProgramHash(address)
  let addressVerifyCode = getAddressStringVerifyCode(address)
  let programHashVerifyCode = genAddressVerifyCodeFromProgramHash(programHash)

  return addressVerifyCode === programHashVerifyCode;
}

/***
*
* @param publicKey
* @returns {string}
*/
function publicKeyToSignatureRedeem(publicKey) {
  return '20' + publicKey + 'ac';
}

/***
*
* @param hexString
* @returns {string}
*/
function hexStringToProgramHash(hexStr) {
  return hash.ripemd160Hex(hash.sha256Hex(hexStr))
}

/***
*
* @param programHash
* @returns {string|*}
*/
function programHashStringToAddress(programHash) {
  let addressVerifyBytes = genAddressVerifyBytesFromProgramHash(programHash)
  let addressBaseData = tools.hexToBytes(ADDRESS_GEN_PREFIX + programHash)
  return base58.encode(tools.mergeTypedArrays(addressBaseData, addressVerifyBytes))
}

/***
*
* @param address
* @returns {Array}
*/
function addressStringToProgramHash(address) {
  let addressBytes = base58.decode(address)
  let programHashBytes = addressBytes.slice(ADDRESS_GEN_PREFIX_LEN, addressBytes.length - CHECKSUM_LEN)
  return tools.bytesToHex(programHashBytes)
}

/***
*
* @param programHash
* @returns {T[] | SharedArrayBuffer | Uint8ClampedArray | Uint32Array | Blob | Int16Array | any}
*/
function genAddressVerifyBytesFromProgramHash(programHash) {
  programHash = ADDRESS_GEN_PREFIX + programHash
  let verifyBytes = tools.hexToBytes(hash.doubleSha256Hex(programHash))
  return verifyBytes.slice(0, CHECKSUM_LEN)
}

/***
*
* @param programHash
* @returns {Array}
*/
function genAddressVerifyCodeFromProgramHash(programHash) {
  let verifyBytes = genAddressVerifyBytesFromProgramHash(programHash)
  return tools.bytesToHex(verifyBytes)
}

/***
*
* @returns {Array}
*/
function getAddressStringVerifyCode(address) {
  let addressBytes = base58.decode(address)
  let verifyBytes = addressBytes.slice(-CHECKSUM_LEN)

  return tools.bytesToHex(verifyBytes)
}

function signatureToParameter(signatureHex) {
  return '40' + signatureHex;
}

module.exports = {
  verifyAddress,
  publicKeyToSignatureRedeem,
  hexStringToProgramHash,
  programHashStringToAddress,
  addressStringToProgramHash,
  genAddressVerifyBytesFromProgramHash,
  genAddressVerifyCodeFromProgramHash,
  getAddressStringVerifyCode,
  signatureToParameter,
}
