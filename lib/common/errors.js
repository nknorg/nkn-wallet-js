'use strict'

let NKN_WALLET_ERROR = function (code, msg) {
  this.code = code
  this.msg = msg

  this.print = function () {
    console.log(this.msg)
  }

  this.cloneError = function () {
    return new NKN_WALLET_ERROR(this.code, this.msg)
  }
}

let NKN_ERROR_CODE = new function () {
  this.UNKNOWN_ERR = () => {return 0}
  this.NOT_ENOUGH_NKN_COIN = () => {return 1}
  this.INVALID_ADDRESS = () => {return 2}
  this.INVALID_PASSWORD = () => {return 3}
}

let NKN_WALLET_ERROR_LIST = new function () {

  let errorList = {}

  errorList[NKN_ERROR_CODE.UNKNOWN_ERR()] =
    new NKN_WALLET_ERROR(NKN_ERROR_CODE.UNKNOWN_ERR(), 'UNKNOWN_ERR')

  errorList[NKN_ERROR_CODE.NOT_ENOUGH_NKN_COIN()] =
    new NKN_WALLET_ERROR(NKN_ERROR_CODE.NOT_ENOUGH_NKN_COIN(), 'nkn coin is not enough')

  errorList[NKN_ERROR_CODE.NOT_ENOUGH_NKN_COIN()] =
    new NKN_WALLET_ERROR(NKN_ERROR_CODE.NOT_ENOUGH_NKN_COIN(), 'nkn coin is not enough')

  errorList[NKN_ERROR_CODE.INVALID_ADDRESS()] =
    new NKN_WALLET_ERROR(NKN_ERROR_CODE.INVALID_ADDRESS(), 'invalid address')

  errorList[NKN_ERROR_CODE.INVALID_PASSWORD()] =
    new NKN_WALLET_ERROR(NKN_ERROR_CODE.INVALID_PASSWORD(), 'invalid password')

  this.newError = function (code) {
    if(!errorList[code]) {
      return errorList[NKN_ERROR_CODE.NOT_ENOUGH_NKN_COIN()]
    }

    return errorList[code].cloneError()
  }
}



function newError(code) {
  return NKN_WALLET_ERROR_LIST.newError(code)
}

module.exports = {
  code: NKN_ERROR_CODE,
  newError: newError,
}