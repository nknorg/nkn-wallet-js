'use strict'

const Algorithm = require('./../crypto/algorithm')
const Mathjs = require('mathjs')

function uint32ToHexString(number) {
    return Algorithm.array2HexString([number >> 24, number >> 16, number >> 8, number].reverse())
}

/***
 *
 * @param subscriber
 * @param identifier
 * @param topic
 * @param duration
 * @returns {string}
 */
function rawSubscribe(subscriber, identifier, topic, bucket, duration) {
    let txType = '60'
    let payloadVersion = '00'
    let subscriberLength = '21'
    let identifierLength = Algorithm.array2HexString([identifier.length])
    let identifierBytes = []
    for (let i = 0; i < identifier.length; i++) {
        let code = identifier.charCodeAt(i)
        identifierBytes.push(code)
    }
    let identifierHexString = Algorithm.array2HexString(identifierBytes)
    let topicLength = Algorithm.array2HexString([topic.length])
    let topicBytes = []
    for (let i = 0; i < topic.length; i++) {
        let code = topic.charCodeAt(i)
        topicBytes.push(code)
    }
    let topicHexString = Algorithm.array2HexString(topicBytes)
    let bucketHexString = uint32ToHexString(bucket)
    let durationHexString = uint32ToHexString(duration)
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
    return txType + payloadVersion + subscriberLength + subscriber + identifierLength + identifierHexString + topicLength + topicHexString + bucketHexString + durationHexString + attrRawString + inputsAndOutputs
}

module.exports = {
    rawSubscribe
}