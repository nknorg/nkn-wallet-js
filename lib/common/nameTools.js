'use strict'

const Algorithm = require('./../crypto/algorithm')
const Mathjs = require('mathjs')

/***
 *
 * @param name
 * @param publicKey
 * @returns {string}
 */
function rawRegisterName(name, publicKey) {
    let txType = '50'
    let payloadVersion = '00'
    let publicKeyLength = '21'
    let nameLength = Algorithm.array2HexString([name.length])
    let nameBytes = []
    for (let i = 0; i < name.length; i++) {
        let code = name.charCodeAt(i)
        nameBytes.push(code)
    }
    let nameHexString = Algorithm.array2HexString(nameBytes)
    let attrCount = '01'
    let attrDataLength = '20'
    let attr = {
        Usage: '00',
        Data: Algorithm.array2HexString(Mathjs.random([32], 0, 255))
    }
    let inputs = '00'
    let outputs = '00'
    let inputsAndOutputs = inputs + outputs

    let attrRawString = attrCount + attr.Usage + attrDataLength + attr.Data
    return txType + payloadVersion + publicKeyLength + publicKey + nameLength + nameHexString + attrRawString + inputsAndOutputs
}

/***
 *
 * @param name
 * @param publicKey
 * @returns {string}
 */
function rawDeleteName(publicKey) {
    let txType = '52'
    let payloadVersion = '00'
    let publicKeyLength = '21'
    let attrCount = '01'
    let attrDataLength = '20'
    let attr = {
        Usage: '00',
        Data: Algorithm.array2HexString(Mathjs.random([32], 0, 255))
    }
    let inputs = '00'
    let outputs = '00'
    let inputsAndOutputs = inputs + outputs

    let attrRawString = attrCount + attr.Usage + attrDataLength + attr.Data
    return txType + payloadVersion + publicKeyLength + publicKey + attrRawString + inputsAndOutputs
}

module.exports = {
    rawRegisterName,
    rawDeleteName
}