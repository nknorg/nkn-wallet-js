'use strict'

let baseInfo = function () {
  return {"jsonrpc":"2.0", "id":"nkn-wallet"}
}

module.exports = {
  getBalanceByAddr: Object.assign(baseInfo(), {method: "getbalancebyaddr", params: {address: ""}}),
  getNonceByAddr: Object.assign(baseInfo(), {method: "getnoncebyaddr", params: {address: ""}}),
  sendRawTransaction: Object.assign(baseInfo(), {method: "sendrawtransaction", params: {tx: ""}}),
  getAddressByName: Object.assign(baseInfo(), {method: "getaddressbyname", params: {name: ""}}),
}
