'use strict'

const Algorithm = require('./../crypto/algorithm')
const NknMath = require('./math')
const Mathjs = require('mathjs')
const RawTransactionTools = require('./rawTransactionTools')
const NknWalletError = require('./errors')
const Is = require('is')

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
  targetValue = NknMath.mulAndFloor(targetValue, NknMath.NKN_ACC_MUL)

  let utxoInputs = []
  let utxoOutputs = []

  let notEnough = true
  for(let i=0; i<utxoList.length; i++) {
    let thisInputVal = NknMath.newNum(utxoList[i].Value)
    let txId = Algorithm.reverseHexBytesString(utxoList[i].Txid)
    utxoValue = NknMath.add(utxoValue, NknMath.mulAndFloor(thisInputVal, NknMath.NKN_ACC_MUL))
    utxoInputs.push({
      ReferTxID: txId,
      ReferTxOutputIndex: RawTransactionTools.genInputIndexRawString(utxoList[i].Index)
    })

    if(NknMath.greaterThanOrEqualTo(utxoValue, targetValue)) {
      notEnough = false
      break
    }
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

module.exports = {
  transferInputsAndOutputs,
  genInputsAndOutputs,
  rawBaseTransfer,
}