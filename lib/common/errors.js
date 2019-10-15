'use strict';

const errorCode = {
  unknownError: 0,
  notEnoughBalance: 1,
  invalidAddress: 2,
  wrongPassword: 3,
  invalidWalletFormat: 4,
  invalidWalletVersion: 5,
  invalidArgument: 6,
  invalidResponse: 7,
  noRPCServer: 8,
  serverError: 9,
};

const defaultErrorMsg = {
  [errorCode.unknownError]: 'unknown error',
  [errorCode.notEnoughBalance]: 'not enough balance',
  [errorCode.invalidWalletAddress]: 'invalid wallet address',
  [errorCode.wrongPassword]: 'invalid password',
  [errorCode.invalidWalletFormat]: 'invalid wallet format',
  [errorCode.invalidWalletVersion]: 'invalid wallet verison',
  [errorCode.invalidArgument]: 'invalid argument',
  [errorCode.invalidResponse]: 'invalid response from server',
  [errorCode.noRPCServer]: 'RPC server address is not set',
  [errorCode.serverError]: 'error from server',
};

function Error(code, msg) {
  if (!(this instanceof Error)) {
    return new Error(code, msg);
  }

  this.code = code || errorCode.unknownError;
  this.msg = msg || defaultErrorMsg[code] || defaultErrorMsg.unknownError;
}

module.exports = {
  code: errorCode,
  Error,
}
