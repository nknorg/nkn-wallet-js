'use strict'

let baseInfo = function () {
  return {"jsonrpc":"2.0", "id":"nkn-wallet"}
}

module.exports = {
  getUTXO: Object.assign(baseInfo(), {method: "getunspendoutput", params: {address:"", assetid: ""}}),
  sendRawTransfer: Object.assign(baseInfo(), {method: "sendrawtransaction", params: {tx:""}}),
  getPrepaidInfo: Object.assign(baseInfo(), {method: "getprepaidinfo", params: {address:""}}),
}
