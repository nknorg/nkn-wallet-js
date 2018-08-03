'use strict'

const Algorithm = require('./../crypto/algorithm')
const NknMath = require('./math')
const Mathjs = require('mathjs')
const Is = require('is')

const ACC_MUL = NknMath.newNum(100000000)

/***
 *
 * @param inputs
 * @param outputs
 */
let transferInputsAndOutputs = function(inputs, outputs) {
  this.inputs = inputs
  this.outputs = outputs

  this.toRawString = function () {
    let inputsLen = inputs.length
    let inputRawString = Algorithm.rawTxLengthString(inputs.length)

    for(let i=0; i<inputsLen; i++) {
      inputRawString += this.inputs[i].ReferTxID + this.inputs[i].ReferTxOutputIndex
    }

    let outputRawString = Algorithm.array2HexString([outputs.length])
    for(let i=0; i<outputs.length; i++) {
      outputRawString += outputs[i].AssetID +  outputs[i].Value +  outputs[i].ProgramHash
    }

    return inputRawString + outputRawString
  }
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
 * @param assetId
 * @param utxoList
 * @param targetValue
 * @param targetProgramHash
 * @param walletProgramHash
 * @returns {*}
 */
function genInputsAndOutputs(assetId, utxoList, targetValue, targetProgramHash, walletProgramHash) {
  let utxoValue = NknMath.newNum(0)
  targetValue = NknMath.newNum(targetValue)
  targetValue = NknMath.mulAndFloor(targetValue, ACC_MUL)

  let utxoInputs = []
  let utxoOutputs = []

  let notEnough = true
  for(let i=0; i<utxoList.length; i++) {
    if(NknMath.greaterThanOrEqualTo(utxoValue, targetValue)) {
      notEnough = false
      break
    }

    let thisInputVal = NknMath.newNum(utxoList[i].Value)
    let txId = Algorithm.reverseHexBytesString(utxoList[i].Txid)
    utxoValue = NknMath.add(utxoValue, NknMath.mulAndFloor(thisInputVal, ACC_MUL))
    utxoInputs.push({
      ReferTxID: txId,
      ReferTxOutputIndex: genInputIndexRawString(utxoList[i].Index)
    })
  }

  if(notEnough) {
    return NknWalletError.newError(NknWalletError.code.NOT_ENOUGH_NKN_COIN())
  }

  let assetIdString = Algorithm.reverseHexBytesString(assetId)

  let outputValString = Algorithm.reverseHexBytesString(NknMath.int2HexString(targetValue))
  outputValString = Algorithm.toUInt64HexString(outputValString)
  utxoOutputs.push({
    AssetID: assetIdString,
    Value: outputValString,
    ProgramHash: targetProgramHash,
  })

  if(NknMath.greaterThan(utxoValue, targetValue)) {
    let change = NknMath.sub(utxoValue, targetValue)
    let changeString = Algorithm.reverseHexBytesString(NknMath.int2HexString(change))
    changeString = Algorithm.toUInt64HexString(changeString)

    utxoOutputs.push({
      AssetID: assetIdString,
      Value: changeString,
      ProgramHash: walletProgramHash,
    })
  }

  return new transferInputsAndOutputs(utxoInputs, utxoOutputs)
}

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
 * @param inputsAndOutputs
 * @returns {string}
 */
function rawBaseTransfer(inputsAndOutputs) {
  let txType = '10'
  let payloadVersion = '00'
  let attrCount = '01'
  let attrDataLength = '20'
  let attr = {
    Usage: '00',
    Data: Algorithm.array2HexString(Mathjs.random([32], 0, 255))
  }

  let attrRawString = attrCount + attr.Usage + attrDataLength + attr.Data
  let transferBaseRawString = txType + payloadVersion + attrRawString

  transferBaseRawString += inputsAndOutputs.toRawString()

  return transferBaseRawString
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

  console.error(error)
}

module.exports = {
  transferInputsAndOutputs,
  verifyAddress,
  genInputIndexRawString,
  genInputsAndOutputs,

  genFullTransfer,

  rawSignatureRedeem,
  rawTransferSignature,
  rawBaseTransfer,

  callTransferFailHandler,
}