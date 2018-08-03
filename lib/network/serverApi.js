'use strict'

let baseInfo = function () {
  return {"jsonrpc":"2.0", "id":""}
}

module.exports = {
  getUTXO: Object.assign(baseInfo(), {method: "getunspendoutput", params: {address:"", assetid: ""}}),
  sendRawTransfer: Object.assign(baseInfo(), {method: "sendrawtransaction", params: {tx:""}}),
}