'use strict';

require('es6-promise/auto');

const is = require('is');

const { newAccount, restoreAccount } = require('./crypto/account');
const encryption = require('./crypto/encryption');
const hash = require('./crypto/hash');
const protocol = require('./crypto/protocol');
const payload = require('./transaction/payload');
const tools = require('./crypto/tools');
const transaction = require('./transaction/transaction');
const http = require('./network/http');
const errors = require('./common/errors');
const nknMath = require('./common/math');

var config = require('./config');

const walletVersion = 1;
const minCompatibleWalletVersion = 1;
const maxCompatibleWalletVersion = 1;

configure(config);

let NknWallet = function (account) {
  this.passwordHash = ""
  this.iv = ""
  this.masterKey = ""
  this.address = ""
  this.programHash = ""
  this.seedEncrypted = ""
  this.contractData = ""

  this.verifyPassword = function (pswd) {
    return verifyWalletPassword(this, pswd);
  }

  /***
  * query balance
  * @returns {promise} : if resolved, the parameter is a decimal.js instance
  */
  this.getBalance = async function (targetAddress) {
    if(!this.address && !targetAddress) {
      throw "Address not set."
    }

    let queryAddress = this.address
    if(is.string(targetAddress)) {
      queryAddress = targetAddress
    }

    let data = await http.getBalanceByAddr(queryAddress)
    if (data && data.amount) {
      return nknMath.newNum(data.amount)
    }

    throw "No result returned"
  }

  /***
  * get nonce
  * @returns {promise} : if resolved, the parameter is a integer
  */
  this.getNonce = async function (targetAddress) {
    if(!this.address && !targetAddress) {
      throw "Address not set."
    }

    let queryAddress = this.address
    if(is.string(targetAddress)) {
      queryAddress = targetAddress
    }

    let data = await http.getNonceByAddr(queryAddress)
    if (data && is.number(data.nonce)) {
      return data.nonce
    }

    throw "No result returned"
  }

  /***
  * transfer nkn to some valid address
  * @param toAddress : string : valid nkn address
  * @param value : number : value for transfer
  */
  this.transferTo = async function (toAddress, amount) {
    if(!protocol.verifyAddress(toAddress)) {
      throw errors.newError(errors.code.INVALID_ADDRESS())
    }

    let balance = await this.getBalance();
    if (nknMath.lessThan(balance, amount)) {
      throw errors.newError(errors.code.NOT_ENOUGH_NKN_COIN())
    }

    let nonce = await this.getNonce();

    let pld = payload.newTransfer(
      this.programHash,
      protocol.addressStringToProgramHash(toAddress),
      amount,
    );

    let txn = transaction.newTransaction(account, pld, nonce);

    return http.sendRawTransaction(tools.bytesToHex(txn.serializeBinary()));
  }

  /***
  * register name on nkn for current wallet
  * @param name : string : name to register
  */
  this.registerName = async function (name) {
    let nonce = await this.getNonce();

    let pld = payload.newRegisterName(this.getPublicKey(), name);

    let txn = transaction.newTransaction(account, pld, nonce);

    return http.sendRawTransaction(tools.bytesToHex(txn.serializeBinary()));
  }

  /***
  * delete name on nkn for current wallet
  * @param name : string : name to delete
  */
  this.deleteName = async function (name) {
    let nonce = await this.getNonce();

    let pld = payload.newDeleteName(this.getPublicKey(), name);

    let txn = transaction.newTransaction(account, pld, nonce);

    return http.sendRawTransaction(tools.bytesToHex(txn.serializeBinary()));
  }

  /***
  * get address of a name
  * @returns {promise} : if resolved, the parameter is a integer
  */
  this.getAddressByName = async function (name) {
    let addr = await http.getAddressByName(name)

    if (addr && is.string(addr)) {
      return addr
    }

    throw "No result returned"
  }

  /***
  * subscribe to topic on nkn for current wallet
  * @param topic : string : topic to subscribe to
  * @param bucket : number : bucket of topic to subscribe to
  * @param duration : number : subscription duration
  * @param identifier : string : optional identifier
  * @param meta : string : optional meta data
  */
  this.subscribe = async function (topic, bucket, duration, identifier = '', meta = '') {
    let nonce = await this.getNonce();

    let pld = payload.newSubscribe(this.getPublicKey(), identifier, topic, bucket, duration, meta);

    let txn = transaction.newTransaction(account, pld, nonce);

    return http.sendRawTransaction(tools.bytesToHex(txn.serializeBinary()));
  }

  this.createOrUpdateNanoPay = async function (toAddress, amount, expiration, id) {
    if(!protocol.verifyAddress(toAddress)) {
      throw errors.newError(errors.code.INVALID_ADDRESS())
    }

    let balance = await this.getBalance();
    if (nknMath.lessThan(balance, amount)) {
      throw errors.newError(errors.code.NOT_ENOUGH_NKN_COIN())
    }

    if (!id) {
      id = tools.randomUint64();
    }

    let pld = payload.newNanoPay(
      this.programHash,
      protocol.addressStringToProgramHash(toAddress),
      id,
      amount,
      expiration,
      expiration,
    );

    let txn = transaction.newTransaction(account, pld);

    return txn;
  }

  this.sendTransaction = function (txn) {
    return http.sendRawTransaction(tools.bytesToHex(txn.serializeBinary()));
  }

  /***
  * get the public key of this wallet
  * @returns {string} : the public key of this wallet
  */
  this.getPublicKey = function () {
    return account.getPublicKey()
  }

  /***
  * get the private key of this wallet
  * @returns {string} : the private key of this wallet
  *
  * !!! anyone with the private key has the power to restore a full-featured wallet !!!!
  */
  this.getPrivateKey = function () {
    return account.getPrivateKey()
  }

  /***
  * get the seed of this wallet
  * @returns {string} : the seed of this wallet
  *
  * !!! anyone with the seed has the power to restore a full-featured wallet !!!!
  */
  this.getSeed = function () {
    return account.getSeed()
  }

  /***
  * generate a wallet in JSON format
  * @returns {string} : wallet json
  */
  this.toJSON = function () {
    return JSON.stringify({
      Version: this.version,
      PasswordHash: this.passwordHash,
      MasterKey: this.masterKey,
      IV: this.iv,
      SeedEncrypted: this.seedEncrypted,
      Address: this.address,
      ProgramHash: this.programHash,
      ContractData: this.contractData,
    })
  }
}

/***
*
* @param password
* @returns {*}
*/
function passwordHash(password) {
  return hash.doubleSha256(password)
}


function genWallet(account, password, prevMasterKey, prevIV) {
  let wallet = new NknWallet(account)

  let pswdHash = passwordHash(password)

  let iv = prevIV || encryption.genAESIV()
  let masterKey = prevMasterKey || encryption.genAESPassword()

  masterKey = hash.cryptoHexStringParse(masterKey)

  let seed = account.getSeed()
  seed = hash.cryptoHexStringParse(seed)

  wallet.passwordHash = hash.sha256Hex(pswdHash)
  wallet.iv = iv
  wallet.masterKey = encryption.encrypt(masterKey, pswdHash, iv)
  wallet.address = account.getAddress()
  wallet.programHash = account.getProgramHash()
  wallet.seedEncrypted = encryption.encrypt(seed, masterKey.toString(), iv)
  wallet.contractData = account.getContractString()
  wallet.version = walletVersion

  return wallet
}

function decryptWalletSeed(masterKeyEncrypted, iv, seedEncrypted, password) {
  let pswdHash = passwordHash(password)
  let masterKey = encryption.decrypt(hash.cryptoHexStringParse(masterKeyEncrypted), pswdHash, iv)
  let seed = encryption.decrypt(hash.cryptoHexStringParse(seedEncrypted), masterKey, iv)

  return {
    masterKey: masterKey,
    seed: seed,
  }
}

/***
*
* @param wallet
* @param password
*/
function verifyWalletPassword(wallet, password) {
  let pswdHash = passwordHash(password)

  if(wallet.passwordHash !== hash.sha256Hex(pswdHash)) {
    return false
  }

  return true;
}

/**
* create a new wallet
* @param password : string : the password to encrypt wallet
* @returns {NknWallet} : Object : a NknWallet instance
*/
function newWallet(password) {
  let account = newAccount()
  return genWallet(account, password)
}

/***
* restore a wallet from seed
* @param seed : string : the seed for wallet restore
* @param password : string : password for new wallet
* @returns {NknWallet} : a NknWallet instance
*
* !!! this method will thow an error if the password is wrong !!!
*/
function restoreWalletBySeed(seed, password) {
  let account = restoreAccount(seed)
  return genWallet(account, password)
}

/***
*
* @param seed
* @param password
* @param prevMasterKey
* @param preIV
*/
function restoreWalletFromJson(seed, password, prevMasterKey, preIV) {
  let account = restoreAccount(seed)
  return genWallet(account, password, prevMasterKey, preIV)
}

/***
* load wallet from json string
* @param walletJson : string : a json format wallet
* @param password : string : password for this wallet
* @returns {NknWallet | WalletError} : return NknWallet instance or WalletError if something wrong.
*
* !!! this method will thow an error if the password is wrong !!!
*/
function loadJsonWallet(walletJson, password) {
  let walletObj = JSON.parse(walletJson)
  if (walletObj.Version < minCompatibleWalletVersion || walletObj.Version > maxCompatibleWalletVersion) {
    throw "Invalid wallet version " + walletObj.Version + ", should be between " + minCompatibleWalletVersion + " and " + maxCompatibleWalletVersion;
  }

  if (!is.string(walletObj.MasterKey) || !is.string(walletObj.IV) || !is.string(walletObj.SeedEncrypted) || !is.string(walletObj.Address)) {
    throw "Invalid wallet format";
  }

  let pswdHash = passwordHash(password);
  if (walletObj.PasswordHash !== hash.sha256Hex(pswdHash)) {
    throw "Wrong password";
  }

  let masterKey = encryption.decrypt(hash.cryptoHexStringParse(walletObj.MasterKey), pswdHash, walletObj.IV);
  let seed = encryption.decrypt(hash.cryptoHexStringParse(walletObj.SeedEncrypted), masterKey, walletObj.IV);
  let wallet = restoreWalletFromJson(seed, password, masterKey, walletObj.IV);

  return wallet
}

/***
* global configuration:
* {
*  rpcAddr:'',   // node addr for dynamic information query
* }
*
* @param newConfig : Object
*/
function configure(newConfig) {
  config = Object.assign({}, config, newConfig)
  http.configure(config.rpcAddr)
}

module.exports = {
  configure: configure,
  newWallet: newWallet,
  loadJsonWallet: loadJsonWallet,
  restoreWalletBySeed: restoreWalletBySeed,
  verifyAddress: protocol.verifyAddress,
}
