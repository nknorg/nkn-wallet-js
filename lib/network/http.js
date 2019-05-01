'use strict'

require('es6-promise/auto');
const axios = require('axios')
const is = require('is')
const api = require('./api')

let serverAddr = null

async function axiosRequest(param) {
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

function getBalanceByAddr(address, callId) {
  let getBalanceByAddrApi = api.getBalanceByAddr
  getBalanceByAddrApi.params.address = address
  if(!is.undefined(callId)) {
    getBalanceByAddrApi.id = callId
  }

  return axiosRequest(getBalanceByAddrApi)
}

function getNonceByAddr(address, callId) {
  let getNonceByAddrApi = api.getNonceByAddr
  getNonceByAddrApi.params.address = address
  if(!is.undefined(callId)) {
    getNonceByAddrApi.id = callId
  }

  return axiosRequest(getNonceByAddrApi)
}

function sendRawTransaction(tx, callId) {
  let sendRawTransactionApi = api.sendRawTransaction
  sendRawTransactionApi.params.tx = tx
  if(!is.undefined(callId)) {
    sendRawTransactionApi.id = callId
  }

  return axiosRequest(sendRawTransactionApi)
}

function getAddressByName(name, callId) {
  let getAddressByNameApi = api.getAddressByName
  getAddressByNameApi.params.name = name
  if(!is.undefined(callId)) {
    getAddressByNameApi.id = callId
  }

  return axiosRequest(getAddressByNameApi)
}

module.exports = {
  configure,
  getBalanceByAddr,
  getNonceByAddr,
  sendRawTransaction,
  getAddressByName,
}
