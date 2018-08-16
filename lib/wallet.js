'use strict'

const NknAccount = require('./crypto/account')
const Algorithm = require('./crypto/algorithm')
const Http = require('./network/http')
const RawTransactionTools = require('./common/rawTransactionTools')
const NknWalletError = require('./common/errors')
const NknTransfer = require('./common/transferTools')
const NknPrepay = require('./common/prepayTools')
const NknMath = require('./common/math')
const Is = require('is')

let NknWalletConfig = require('./config')


let NknWallet = function (account) {
  let _account = account

  let version = '0.0.1'

  this.passwordHash = ""
  this.iv = ""
  this.masterKey = ""
  this.address = ""
  this.programHash = ""
  this.privateKeyEncrypted = ""
  this.contractData = ""

  /***
   * query asset balance
   * @param success : function : callback for query success and the parameter is a decimal.js instance
   * @param fail : function : callback for query fail
   * @returns {boolean} : true for http request success and false for fail
   */
  this.queryAssetBalance = function (success, fail) {
    if(!Is.function(success)) {
      return false
    }
    if(!this.address) {
      return false
    }

    Http.getUTXO(this, this.address, NknWalletConfig.assetId, '', function (data) {
      if(null === data) {
        success(NknMath.newNum(0))
        return
      }

      success(calcAssetBalance(data))
    }, function (error) {
      if(Is.function(fail)) {
        fail(error)
      }
      console.error(error)
    })
  }

  /***
   * transfer nkn to some valid address
   * @param toAddress : string : valid nkn address
   * @param value : number : value for transfer
   * @param password : string : wallet password
   * @param success : function : callback for transfer success
   * @param fail : function : callback for all errors that happened in transfer
   *
   * !!! the fail function will be called for any transfer errors and the parameter applied is a WalletError instance. !!!
   */
  this.transferTo = function (toAddress, value, password, success, fail) {
    //verify address
    if(!RawTransactionTools.verifyAddress(toAddress)) {
      RawTransactionTools.callTransferFailHandler.call(this,
        fail,
        NknWalletError.newError(NknWalletError.code.INVALID_ADDRESS()))
      return
    }

    //verify wallet
    if(!verifyWallet(this, password)) {
      RawTransactionTools.callTransferFailHandler.call(this,
        fail,
        NknWalletError.newError(NknWalletError.code.INVALID_PASSWORD()))
      return
    }

    //get utxo | balance
    Http.getUTXO(this, this.address, NknWalletConfig.assetId, '', function (data) {

      //null data === no nkn coin
      if(null === data) {
        RawTransactionTools.callTransferFailHandler.call(this,
          fail,
          NknWalletError.newError(NknWalletError.code.NOT_ENOUGH_NKN_COIN()))
        return
      }

      //build input and output
      let targetProgramHash = Algorithm.addressStringToProgramHash(toAddress)
      let inputsAndOutputs = NknTransfer.genInputsAndOutputs(
        NknWalletConfig.assetId,
        data,
        value,
        targetProgramHash,
        this.programHash
      )


      if(!Is.instanceof(inputsAndOutputs, NknTransfer.transferInputsAndOutputs)) {
        RawTransactionTools.callTransferFailHandler.call(this, fail, inputsAndOutputs)
        return
      }

      //gen base transfer raw string
      let baseTransfer = NknTransfer.rawBaseTransfer(inputsAndOutputs)
      let signature = RawTransactionTools.rawTransferSignature(_account, baseTransfer)
      let signatureRedeem = RawTransactionTools.rawSignatureRedeem(account)

      let rawString = RawTransactionTools.genFullTransfer(baseTransfer, signature, signatureRedeem)

      //send transaction
      Http.sendRawTransfer(this, rawString, '', success, fail)

    }, function (error) {
      console.error(error)
    })
  }

  /***
   * get the public key of this wallet
   * @returns {string} : the public key of this wallet
   */
  this.getPublicKey = function () {
    return _account.getPublicKey()
  }

  /***
   * get the private key of this wallet
   * @returns {string} : the private key of this wallet
   *
   * !!! anyone with the private key has the power to restore a full-featured wallet !!!!
   */
  this.getPrivateKey = function () {
    return _account.getPrivateKey()
  }

  /***
   * generate a wallet in JSON format
   * @returns {string} : wallet json
   */
  this.toJSON = function () {
    return JSON.stringify({
      Version: version,
      PasswordHash: this.passwordHash,
      MasterKey: this.masterKey,
      IV: this.iv,
      PrivateKeyEncrypted: this.privateKeyEncrypted,
      Address: this.address,
      ProgramHash: this.programHash,
      ContractData: this.contractData,
    })
  }

  /***
   * query the prepay balance
   * @param success : function(data) : callback for query success
   *                                    the data's will be an object like this {Amount: string, Rates: string}
   * @param fail : function : callback for query failed.
   */
  this.queryPrepaiedInfo = function (success, fail) {
    Http.getPrepaiedInfo(this, this.address, '', success, fail)
  }

  /***
   * recharge the prepaid balance
   * @param value : number : how much NKN you want to prepay
   * @param rates : number : how much NKN you want to pay for one data transfer
   * @param password : string : password for this wallet
   * @param success : function : callback for prepay success
   * @param fail : function : callback for prepay failed
   */
  this.prepay = function (value, rates, password, success, fail) {
    //verify wallet
    if(!verifyWallet(this, password)) {
      RawTransactionTools.callTransferFailHandler.call(this,
        fail,
        NknWalletError.newError(NknWalletError.code.INVALID_PASSWORD()))
      return
    }

    //get utxo | balance
    Http.getUTXO(this, this.address, NknWalletConfig.assetId, '', function (data) {

      //null data === no nkn coin
      if(null === data) {
        RawTransactionTools.callTransferFailHandler.call(this,
          fail,
          NknWalletError.newError(NknWalletError.code.NOT_ENOUGH_NKN_COIN()))
        return
      }

      //build input and output
      let prepayPayloadRawString = NknPrepay.genPrepayPayloadRawString(NknWalletConfig.assetId, value, rates)
      let inputsAndOutputs = NknPrepay.genInputsAndOutputs(
        NknWalletConfig.assetId,
        data,
        value,
        this.programHash
      )

      if(!Is.instanceof(inputsAndOutputs, NknPrepay.prepayInputsAndOutputs)) {
        RawTransactionTools.callTransferFailHandler.call(this, fail, inputsAndOutputs)
        return
      }

      //gen base transfer raw string
      let baseTransfer = NknPrepay.rawBaseTransfer(prepayPayloadRawString, inputsAndOutputs)
      let signature = RawTransactionTools.rawTransferSignature(_account, baseTransfer)
      let signatureRedeem = RawTransactionTools.rawSignatureRedeem(account)

      let rawString = RawTransactionTools.genFullTransfer(baseTransfer, signature, signatureRedeem)

      //send transaction
      Http.sendRawTransfer(this, rawString, '', success, fail)

    }, function (error) {
      console.error(error)
    })
  }
}

/***
 *
 * @param utxoList
 * @returns {*}
 */
function calcAssetBalance(utxoList) {
  let balance = NknMath.newNum(0)
  for(let i=0; i<utxoList.length; i++) {
    let thisInputVal = NknMath.newNum(utxoList[i].Value)
    balance = NknMath.add(balance, thisInputVal)
  }

  return balance
}

/***
 *
 * @param password
 * @returns {*}
 */
function passwordFormat(password) {
  return Algorithm.doubleSha256(password)
}


function genWallet(account, password, prevMasterKey, prevIV) {
  let wallet = new NknWallet(account)

  password = passwordFormat(password)

  let iv = prevIV || Algorithm.genAESIV()
  let masterKey = prevMasterKey || Algorithm.genAESPassword()

  masterKey = Algorithm.cryptoHexStringParse(masterKey)

  let privateKey = account.getPrivateKey()
  privateKey = Algorithm.cryptoHexStringParse(privateKey)

  wallet.passwordHash = Algorithm.sha256(Algorithm.cryptoHexStringParse(password))
  wallet.iv = iv
  wallet.masterKey = Algorithm.encrypt(masterKey, password, iv)
  wallet.address = account.getAddress()
  wallet.programHash = account.getProgramHash()
  wallet.privateKeyEncrypted = Algorithm.encrypt(privateKey, masterKey.toString(), iv)
  wallet.contractData = account.getContractString()

  return wallet
}

function decryptWalletPrivateKey(masterKeyEncrypted, iv, privateKeyEncrypted, password) {
  password = passwordFormat(password)
  let masterKey = Algorithm.decrypt(Algorithm.cryptoHexStringParse(masterKeyEncrypted), password, iv)
  let privateKey = Algorithm.decrypt(Algorithm.cryptoHexStringParse(privateKeyEncrypted), masterKey, iv)

  return {
    masterKey: masterKey,
    privateKey: privateKey,
  }
}

/***
 *
 * @param wallet
 * @param password
 */
function verifyWallet(wallet, password) {
  password = passwordFormat(password)

  const passwordHash = Algorithm.sha256(Algorithm.cryptoHexStringParse(password))
  if(passwordHash !== wallet.passwordHash) {
    return false
  }


  let masterKey = Algorithm.decrypt(Algorithm.cryptoHexStringParse(wallet.masterKey), password, wallet.iv)
  let privateKey = Algorithm.decrypt(Algorithm.cryptoHexStringParse(wallet.privateKeyEncrypted), masterKey, wallet.iv)
  let account = NknAccount.restoreAccount(privateKey, 'password')

  return wallet.programHash === account.getProgramHash()
}

/**
 * create a new wallet
 * @param password : string : the password to encrypt wallet
 * @returns {NknWallet} : Object : a NknWallet instance
 */
function newWallet(password) {
  let account = NknAccount.newAccount()
  return genWallet(account, password)
}

/***
 * restore a wallet from private key
 * @param privateKey : string : the private key for wallet restore
 * @param password : string : password for new wallet
 * @returns {NknWallet} : a NknWallet instance
 *
 * !!! this method will thow an error if the password is wrong !!!
 */
function restoreWalletByPrivateKey(privateKey, password) {
  let account = NknAccount.restoreAccount(privateKey)
  return genWallet(account, password)
}

/***
 *
 * @param privateKey
 * @param password
 * @param prevMasterKey
 * @param preIV
 */
function restoreWalletFromJson(privateKey, password, prevMasterKey, preIV) {
  let account = NknAccount.restoreAccount(privateKey)
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
  if(!Is.string(walletObj.MasterKey)
    || !Is.string(walletObj.IV)
    || !Is.string(walletObj.PrivateKeyEncrypted)
    || !Is.string(walletObj.Address)
  ) {
    return NknWalletError.newError(NknWalletError.code.INVALID_WALLET_FORMAT())
  }

  let keys = decryptWalletPrivateKey(walletObj.MasterKey, walletObj.IV, walletObj.PrivateKeyEncrypted, password)
  let wallet = restoreWalletFromJson(keys.privateKey, password, keys.masterKey, walletObj.IV)

  if(wallet.address !== walletObj.Address) {
    return NknWalletError.newError(NknWalletError.code.INVALID_PASSWORD())
  }

  return wallet
}

/***
 * global configuration:
 * {
 *  assetId: '',  // the NKN Token id
 *  rpcAddr:'',   // node addr for dynamic information query
 * }
 *
 * @param config : Object
 */
function configure(config) {
  NknWalletConfig = Object.assign({}, NknWalletConfig, config)
  Http.configure(NknWalletConfig.rpcAddr)
}

module.exports = {
  configure: configure,
  newWallet: newWallet,
  loadJsonWallet: loadJsonWallet,
  restoreWalletByPrivateKey: restoreWalletByPrivateKey,

  algorithm: Algorithm,

  nknWalletError: NknWalletError.walletError,
}
