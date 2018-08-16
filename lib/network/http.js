'use strict'

require('es6-promise/auto');
const Axios = require('axios')
const Is = require('is')
const ServerApi = require('./serverApi')

let server = null

async function axiosRequest(scope, param) {
  if(!server) {
    throw "RPC server is not set"
  }

  let response = await Axios.post(server, JSON.stringify(param), {
    headers: { 'Content-Type': 'application/json' }
  })

  if(!Is.undefined(response.data.result)) {
    return response.data.result
  }

  if(!Is.undefined(response.data.error)) {
    throw response.data.error
  }

  throw "Response format error."
}

function configure(addr) {
  server = addr
}

function getUTXO(scope, address, assetId, callId) {
  let getUtxoApi = ServerApi.getUTXO
  getUtxoApi.params.address = address
  getUtxoApi.params.assetid = assetId
  if(!Is.undefined(callId)) {
    getUtxoApi.id = callId
  }

  return axiosRequest(scope, getUtxoApi)
}

function sendRawTransfer(scope, transfer, callId) {
  let sendRawTransferApi = ServerApi.sendRawTransfer
  sendRawTransferApi.params.tx = transfer
  if(!Is.undefined(callId)) {
    sendRawTransferApi.id = callId
  }

  return axiosRequest(scope, sendRawTransferApi)
}

function getPrepaiedInfo(scope, address, callId) {
  let getPrepaidInfoApi = ServerApi.getPrepaidInfo
  getPrepaidInfoApi.params.address = address
  if(!Is.undefined(callId)) {
    getPrepaidInfoApi.id = callId
  }

  return axiosRequest(scope, getPrepaidInfoApi)
}


module.exports = {
  configure,
  getUTXO,
  sendRawTransfer,
  getPrepaiedInfo,
}
