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
  unknownError: 'unknown error',
  notEnoughBalance: 'not enough balance',
  invalidWalletAddress: 'invalid wallet address',
  wrongPassword: 'invalid password',
  invalidWalletFormat: 'invalid wallet format',
  invalidWalletVersion: 'invalid wallet verison',
  invalidArgument: 'invalid argument',
  invalidResponse: 'invalid response from server',
  noRPCServer: 'RPC server address is not set',
  serverError: 'error from server',
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
