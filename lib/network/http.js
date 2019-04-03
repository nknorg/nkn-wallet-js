'use strict'

require('es6-promise/auto');
const axios = require('axios')
const is = require('is')
const api = require('./api')

let serverAddr = null

async function axiosRequest(scope, param) {
  if(!serverAddr) {
    throw "RPC server address is not set"
  }

  let response = await axios.post(serverAddr, JSON.stringify(param), {
    headers: { 'Content-Type': 'text/plain' }
  })

  if(!is.undefined(response.data.result)) {
    return response.data.result
  }

  if(!is.undefined(response.data.error)) {
    throw response.data.error
  }

  throw "Response format error."
}

function configure(addr) {
  serverAddr = addr
}

function getBalanceByAddr(scope, address, callId) {
  let getBalanceByAddrApi = api.getBalanceByAddr
  getBalanceByAddrApi.params.address = address
  if(!is.undefined(callId)) {
    getBalanceByAddrApi.id = callId
  }

  return axiosRequest(scope, getBalanceByAddrApi)
}

function getNonceByAddr(scope, address, callId) {
  let getNonceByAddrApi = api.getNonceByAddr
  getNonceByAddrApi.params.address = address
  if(!is.undefined(callId)) {
    getNonceByAddrApi.id = callId
  }

  return axiosRequest(scope, getNonceByAddrApi)
}

function sendRawTransaction(scope, tx, callId) {
  let sendRawTransactionApi = api.sendRawTransaction
  sendRawTransactionApi.params.tx = tx
  if(!is.undefined(callId)) {
    sendRawTransactionApi.id = callId
  }

  return axiosRequest(scope, sendRawTransactionApi)
}

module.exports = {
  configure,
  getBalanceByAddr,
  getNonceByAddr,
  sendRawTransaction,
}
