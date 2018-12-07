const Algorithm = require('./../crypto/algorithm')
const Is = require('is')

/***
 *
 * @param baseTransfer
 * @param signature
 * @param signatureRedeem
 * @returns {*}
 */
function genFullTransfer(baseTransfer, signature, signatureRedeem) {
  return baseTransfer + signature + signatureRedeem
}

/***
 *
 * @param index
 * @returns {Array}
 */
function genInputIndexRawString(index) {
  let inputString = Algorithm.array2HexString([index])
  if(inputString.length > 2) {
    let arr = Algorithm.hexString2Array(inputString)

    inputString = Algorithm.array2HexString(arr.reverse())
  } else {
    inputString = inputString + '00'
  }

  return inputString
}

/***
 *
 * @param account
 * @returns {string}
 */
function rawSignatureRedeem (account) {
  let signatureRedeemLength = '23'
  return signatureRedeemLength + account.getSignatureRedeem()
}

/***
 *
 * @param account
 * @param baseTransferRawString
 * @returns {string}
 */
function rawTransferSignature(account, baseTransferRawString) {
  let transferHex = Algorithm.cryptoHexStringParse(baseTransferRawString)
  let transferHash = Algorithm.sha256(transferHex)

  let sigature = account.getKey().sign(transferHash)

  let signatureCount = '01'
  let signatureStructLength = '41'
  let signatureLength = '40'

  return signatureCount + signatureStructLength + signatureLength + sigature
}

/***
 *
 * @param address
 * @returns {boolean}
 */
function verifyAddress(address) {
  let programHash = Algorithm.addressStringToProgramHash(address)
  let addressVerifyCode = Algorithm.getAddressStringVerifyCode(address)
  let programHashVerifyCode = Algorithm.genAddressVerifyCodeFromProgramHash(programHash)

  return (addressVerifyCode === programHashVerifyCode)
}

/***
 *
 * @param fail
 * @param error
 */
function callTransferFailHandler(fail, error) {
  if(Is.function(fail)) {
    fail(error)
  }
}

module.exports = {
  genInputIndexRawString,
  rawSignatureRedeem,
  rawTransferSignature,
  verifyAddress,
  callTransferFailHandler,
  genFullTransfer,
}
