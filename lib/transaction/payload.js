'use strict';

const nknMath = require('../common/math');
const protocol = require('../crypto/protocol');
const serialize = require('../common/serialize');
const tools = require('../crypto/tools');
const transaction = require('../pb/transaction_pb');

function newTransfer(sender, recipient, amount) {
  amount = nknMath.mulAndFloor(nknMath.newNum(amount), nknMath.NKN_ACC_MUL);

  let transfer = new transaction.TransferAsset();
  transfer.setSender(Buffer.from(sender, 'hex'));
  transfer.setRecipient(Buffer.from(recipient, 'hex'));
  transfer.setAmount(amount);

  let pld = new transaction.Payload();
  pld.setType(transaction.PayloadType.TRANSFER_ASSET_TYPE);
  pld.setData(transfer.serializeBinary());

  return pld;
}

function newRegisterName(publicKey, name) {
  let registerName = new transaction.RegisterName();
  registerName.setRegistrant(Buffer.from(publicKey, 'hex'));
  registerName.setName(name);

  let pld = new transaction.Payload();
  pld.setType(transaction.PayloadType.REGISTER_NAME_TYPE);
  pld.setData(registerName.serializeBinary());

  return pld;
}

function newDeleteName(publicKey, name) {
  let deleteName = new transaction.DeleteName();
  deleteName.setRegistrant(Buffer.from(publicKey, 'hex'));
  deleteName.setName(name);

  let pld = new transaction.Payload();
  pld.setType(transaction.PayloadType.DELETE_NAME_TYPE);
  pld.setData(deleteName.serializeBinary());

  return pld;
}

function newSubscribe(subscriber, identifier, topic, bucket, duration, meta) {
  let subscribe = new transaction.Subscribe();
  subscribe.setSubscriber(Buffer.from(subscriber, 'hex'));
  subscribe.setIdentifier(identifier);
  subscribe.setTopic(topic);
  subscribe.setBucket(bucket);
  subscribe.setDuration(duration);
  subscribe.setMeta(meta);

  let pld = new transaction.Payload();
  pld.setType(transaction.PayloadType.SUBSCRIBE_TYPE);
  pld.setData(subscribe.serializeBinary());

  return pld;
}

function newNanoPay(sender, recipient, id, amount, txnExpiration, nanoPayExpiration) {
  amount = nknMath.mulAndFloor(nknMath.newNum(amount), nknMath.NKN_ACC_MUL);

  let nanoPay = new transaction.NanoPay();
  nanoPay.setSender(Buffer.from(sender, 'hex'));
  nanoPay.setRecipient(Buffer.from(recipient, 'hex'));
  nanoPay.setId(id);
  nanoPay.setAmount(amount);
  nanoPay.setTxnExpiration(txnExpiration);
  nanoPay.setNanoPayExpiration(nanoPayExpiration);

  let pld = new transaction.Payload();
  pld.setType(transaction.PayloadType.NANO_PAY_TYPE);
  pld.setData(nanoPay.serializeBinary());

  return pld;
}

function serializePayload(payload) {
  let hex = '';
  hex += serialize.encodeUint32(payload.getType());
  hex += serialize.encodeBytes(payload.getData());
  return hex;
}

module.exports = {
  newTransfer,
  newRegisterName,
  newDeleteName,
  newSubscribe,
  newNanoPay,
  serialize: serializePayload,
}
