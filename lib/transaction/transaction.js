'use strict';

const hash = require('../crypto/hash');
const payload = require('./payload');
const protocol = require('../crypto/protocol');
const nknMath = require('../common/math');
const serialize = require('../common/serialize');
const transaction = require('../pb/transaction_pb');

function newTransaction(account, pld, nonce, fee = 0, attrs = '') {
  fee = nknMath.mulAndFloor(nknMath.newNum(fee), nknMath.NKN_ACC_MUL);

  let unsignedTx = new transaction.UnsignedTx();
  unsignedTx.setPayload(pld);
  unsignedTx.setNonce(nonce);
  unsignedTx.setFee(fee);
  unsignedTx.setAttributes(Buffer.from(attrs, 'hex'));

  let txn = new transaction.Transaction();
  txn.setUnsignedTx(unsignedTx);
  signTx(account, txn);

  return txn;
}

function serializeUnsignedTx(unsignedTx) {
  let hex = '';
  hex += payload.serialize(unsignedTx.getPayload())
  hex += serialize.encodeUint64(unsignedTx.getNonce());
  hex += serialize.encodeUint64(unsignedTx.getFee());
  hex += serialize.encodeBytes(unsignedTx.getAttributes());
  return hex;
}

function signTx(account, txn) {
  let unsignedTx = txn.getUnsignedTx();
  let hex = serializeUnsignedTx(unsignedTx);
  let digest = hash.sha256Hex(hex);
  let signature = account.getKey().sign(Buffer.from(digest, 'hex'));

  let prgm = new transaction.Program();
  prgm.setCode(Buffer.from(account.getSignatureRedeem(), 'hex'));
  prgm.setParameter(Buffer.from(protocol.signatureToParameter(signature), 'hex'));

  txn.setProgramsList([prgm]);
}

module.exports = {
  newTransaction,
}
