'use strict'

const Crypto = require('crypto-js')
const EC = require('elliptic').ec('p256')
const Is = require('is')

const BitcoinBase58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const Base58 = require('base-x')(BitcoinBase58);

const Mathjs = require('mathjs')
const ADDRESS_GEN_PREFIX = '35'

/***
 *
 * @param hexString
 */
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

/***
 *
 * @param hexString
 * @returns {Array}
 */
function hexString2Array(hexString) {
  if(0 === hexString.length) {
    return []
  }

  if(0 !== hexString.length % 2) {
    hexString = '0' + hexString
  }
  let ret = []

  let strLen = hexString.length
  for(let i=0; i<strLen; i+=2) {
    ret.push(parseInt(hexString.slice(i, i + 2), 16))
  }

  return ret
}

/***
 *
 * @param hexString
 * @returns {Array}
 */
function reverseHexBytesString(hexString) {
  let reversedHexArray = hexString2Array(hexString).reverse()
  return array2HexString(reversedHexArray)
}

/***
 *
 * @param bytes
 * @returns {Array}
 */
function array2HexString(bytes) {
  return Array.from(bytes, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2)
  }).join('')
}

function toUInt64HexString(hexString) {
  let uint64StringLen = 16
  let orgLength = hexString.length
  for(let i=0; i<uint64StringLen - orgLength; i++) {
    hexString += '0'
  }

  return hexString
}

/***
 *
 * @param keyPair
 */
function setNknP256r1Keys(keyPair) {
  this.publicKey = keyPair.getPublic(true, 'hex')
  this.privateKey = keyPair.getPrivate('hex')
  this.signatureRedeem = '21' + this.publicKey + 'ac'
  this.programHash = hexString2ProgramHash(this.signatureRedeem)
}

/***
 *
 * @param privateKey
 * @returns {*}
 */
function restoreKeyPairByPrivateKey(privateKey) {
  let keyPair = EC.keyFromPrivate(privateKey, 'hex')
  setNknP256r1Keys.call(this, keyPair)

  return keyPair
}

/***
 *
 * @param hexString
 */
function cryptoHexStringParse(hexString) {
  return Crypto.enc.Hex.parse(hexString)
}

/***
 *
 * @param src
 */
function sha256(src) {
  return Crypto.SHA256(src).toString()
}

/***
 *
 * @param src
 */
function doubleSha256(src) {
  return Crypto.SHA256(
    Crypto.SHA256(src)
  ).toString()
}

/***
 *
 * @param hexString
 * @returns {string}
 */
function hexString2ProgramHash(hexString) {
  let cryptoSrc = cryptoHexStringParse(hexString)

  return Crypto.RIPEMD160(
    Crypto.SHA256(cryptoSrc)
  ).toString()
}

/***
 *
 * @param programHash
 * @returns {string|*}
 */
function programHashString2Address(programHash) {
  let addressVerifyBytes = genAddressVerifyBytesFromProgramHash(programHash)
  let addressBaseData = hexString2Array(ADDRESS_GEN_PREFIX + programHash)
  addressBaseData = addressBaseData.concat(addressVerifyBytes)
  return Base58.encode(addressBaseData)
}

/***
 *
 * @param address
 * @returns {Array}
 */
function addressStringToProgramHash(address) {
  let addressBytes = Base58.decode(address)
  let programHashBytes = addressBytes.slice(1, addressBytes.length - 4)
  return array2HexString(programHashBytes)
}

/***
 *
 * @param programHash
 * @returns {T[] | SharedArrayBuffer | Uint8ClampedArray | Uint32Array | Blob | Int16Array | any}
 */
function genAddressVerifyBytesFromProgramHash(programHash) {
  programHash = ADDRESS_GEN_PREFIX + programHash
  let cryptoHash = cryptoHexStringParse(programHash)
  let verifyBytes = doubleSha256(cryptoHash)
  verifyBytes = hexString2Array(verifyBytes)

  return verifyBytes.slice(0, 4)
}

/***
 *
 * @param programHash
 * @returns {Array}
 */
function genAddressVerifyCodeFromProgramHash(programHash) {
  let verifyBytes = genAddressVerifyBytesFromProgramHash(programHash)
  return array2HexString(verifyBytes)
}

/***
 *
 * @returns {Array}
 */
function getAddressStringVerifyCode(address) {
  let addressBytes = Base58.decode(address)
  let verifyBytes = addressBytes.slice(-4)

  return array2HexString(verifyBytes)
}

function paddingSign(data) {
  let dataLen = data.length
  if(64 === dataLen) {
    return data
  }

  let diff = 64 - dataLen

  for(let i=0; i<diff; i++){
    data = "0" + data
  }

  return data
}

/***
 *
 * @param privateKey
 */
let nknP256r1 = function (privateKey) {
  let keyPair = null

  this.getKeyPair = function () {
    return keyPair
  }

  this.sign = function (data) {
    let sigData = keyPair.sign(data)
    let r = sigData.r.toString('hex')
    let s = sigData.s.toString('hex')

    r = paddingSign(r)
    s = paddingSign(s)

    return r + s
  }

  if(Is.string(privateKey)) {
    try {
      keyPair = restoreKeyPairByPrivateKey.call(this, privateKey)
    } catch(e) {
      throw new Error("restore key pair by private key failed: " + privateKey)
    }

    return
  }


  keyPair = EC.genKeyPair()
  setNknP256r1Keys.call(this, keyPair)
}

function newKey() {
  return new nknP256r1()
}

function restoreKey(privateKey) {
  if(!Is.string(privateKey)) {
    return null
  }

  return new nknP256r1(privateKey)
}

function genAESIV() {
  return array2HexString(Mathjs.random([16], 0, 255))
}

function genAESPassword() {
  return array2HexString(Mathjs.random([32], 0, 255))
}

function encrypt(plaintext, password, iv, isSimplePassword = false) {
  password = isSimplePassword ? doubleSha256(password) : password

  return Crypto.AES.encrypt(
    plaintext,
    cryptoHexStringParse(password),
    {
      iv: cryptoHexStringParse(iv),
      mode: Crypto.mode.CBC,
      padding: Crypto.pad.NoPadding
    }
  ).ciphertext.toString(Crypto.enc.Hex)
}

function decrypt(ciphertext, password, iv, isSimplePassword = false) {
  password = isSimplePassword ? doubleSha256(password) : password

  return Crypto.AES.decrypt(
    Crypto.enc.Base64.stringify(ciphertext),
    cryptoHexStringParse(password),
    {
      iv: cryptoHexStringParse(iv),
      mode: Crypto.mode.CBC,
      padding: Crypto.pad.NoPadding
    }
  ).toString()
}

function rawTxLengthString(length) {
  let lengthLeadString = []
  let rawHexArray = []
  let lengthHexReverseString = hexString2Array(length.toString(16)).reverse()
  let needLeadLengthCode = true

  if (length < 253) { // 0xFD
    rawHexArray = hexString2Array(length.toString(16))
    needLeadLengthCode = false
  } else if (length < 65535) { // 0xFFFF
    lengthLeadString = [253]
  } else if (length < 4294967295) { // 0xFFFFFFFF
    lengthLeadString = [254]
  } else {
    lengthLeadString = [255]
  }

  if(needLeadLengthCode) {
    rawHexArray = lengthLeadString.concat(lengthHexReverseString)
  }

  return array2HexString(rawHexArray)
}

module.exports = {
  hexString2Array,
  array2HexString,
  reverseHexBytesString,
  toUInt64HexString,
  prefixByteCountToHexString,

  newKey,
  restoreKey,
  programHashString2Address,
  addressStringToProgramHash,
  genAddressVerifyBytesFromProgramHash,
  genAddressVerifyCodeFromProgramHash,
  getAddressStringVerifyCode,

  sha256,
  doubleSha256,
  cryptoHexStringParse,

  encrypt,
  decrypt,
  genAESIV,
  genAESPassword,

  rawTxLengthString,
}
