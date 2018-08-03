'use strict'

const Axios = require('axios')
const Is = require('is')
const ServerApi = require('./serverApi')

let server = null

function axiosRequest(scope, param, success, fail) {
  if(!server) {
    return false
  }

  Axios.post(server, JSON.stringify(param), {
    headers: { 'Content-Type': 'text/plain' }
  }).then(function (response) {
    if(response.data.result) {
      if(Is.function(success)) {
        success.call(scope, response.data.result)
      }
    } else {
      if(Is.function(fail)) {
        fail.call(scope, response.data.error)
      }
    }
  })

  return true
}

function configure(ip, port) {
  server = 'http://' + ip + ':' + port
}

function getUTXO(scope, address, assetId, callId = 'nkn-sdk', success = null, fail = null) {

  let getUtxoApi = ServerApi.getUTXO
  getUtxoApi.id = callId
  getUtxoApi.params.address = address
  getUtxoApi.params.assetid = assetId

  return axiosRequest(scope, getUtxoApi, success, fail)
}

function sendRawTransfer(scope, transfer, callId = 'nkn-sdk', success = null, fail = null) {
  let sendRawTransferApi = ServerApi.sendRawTransfer
  sendRawTransferApi.id = callId
  sendRawTransferApi.params.tx = transfer

  return axiosRequest(scope, sendRawTransferApi, success, fail)
}


module.exports = {
  configure,
  getUTXO,
  sendRawTransfer,
}