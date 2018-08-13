const Algorithm = require('./../crypto/algorithm')
const NknMath = require('./math')
const RawTransactionTools = require('./rawTransactionTools')
const NknWalletError = require('./errors')
const Mathjs = require('mathjs')

function genPrepayPayloadRawString(assetId, value, rates) {

  let assetIdString = Algorithm.reverseHexBytesString(assetId)

  let nknValue = NknMath.newNum(value)
  nknValue = NknMath.mulAndFloor(nknValue, NknMath.NKN_ACC_MUL)



  let nknValueString = Algorithm.reverseHexBytesString(NknMath.int2HexString(nknValue))
  nknValueString = Algorithm.toUInt64HexString(nknValueString)

  let nknRates = NknMath.newNum(rates)
  nknRates = NknMath.mulAndFloor(nknRates, NknMath.NKN_ACC_MUL)

  let nknRatesString = Algorithm.reverseHexBytesString(NknMath.int2HexString(nknRates))
  nknRatesString = Algorithm.toUInt64HexString(nknRatesString)

  return assetIdString + nknValueString + nknRatesString
}

function genInputsAndOutputs(assetId, utxoList, targetValue, walletProgramHash) {
  let utxoValue = NknMath.newNum(0)
  targetValue = NknMath.newNum(targetValue)
  targetValue = NknMath.mulAndFloor(targetValue, NknMath.NKN_ACC_MUL)

  let utxoInputs = []
  let utxoOutputs = []

  for(let i=0; i<utxoList.length; i++) {
    if(NknMath.greaterThanOrEqualTo(utxoValue, targetValue)) {
      break
    }

    let thisInputVal = NknMath.newNum(utxoList[i].Value)
    let txId = Algorithm.reverseHexBytesString(utxoList[i].Txid)
    utxoValue = NknMath.add(utxoValue, NknMath.mulAndFloor(thisInputVal, NknMath.NKN_ACC_MUL))
    utxoInputs.push({
      ReferTxID: txId,
      ReferTxOutputIndex: RawTransactionTools.genInputIndexRawString(utxoList[i].Index)
    })
  }

  if(!NknMath.greaterThanOrEqualTo(utxoValue, targetValue)) {
    return NknWalletError.newError(NknWalletError.code.NOT_ENOUGH_NKN_COIN())
  }

  let assetIdString = Algorithm.reverseHexBytesString(assetId)

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

  return new prepayInputsAndOutputs(utxoInputs, utxoOutputs)
}


let prepayInputsAndOutputs = function(inputs, outputs) {
  this.inputs = inputs

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
 * @param inputsAndOutputs
 * @returns {string}
 */
function rawBaseTransfer(prepayPayloadRawString, inputsAndOutputs) {
  let txType = '40'
  let payloadVersion = '00'
  let attrCount = '01'
  let attrDataLength = '20'
  let attr = {
    Usage: '00',
    Data: Algorithm.array2HexString(Mathjs.random([32], 0, 255))
  }

  let attrRawString = attrCount + attr.Usage + attrDataLength + attr.Data
  let transferBaseRawString = txType + payloadVersion + prepayPayloadRawString + attrRawString

  transferBaseRawString += inputsAndOutputs.toRawString()

  return transferBaseRawString
}

module.exports = {
  rawBaseTransfer,
  genInputsAndOutputs,
  genPrepayPayloadRawString,
  prepayInputsAndOutputs,
}
