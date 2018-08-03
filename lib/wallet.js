'use strict'

const NknAccount = require('./crypto/account')
const Algorithm = require('./crypto/algorithm')
const Http = require('./network/http')
const NknWalletError = require('./common/errors')
const NknTransfer = require('./common/transferTools')
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
   * !!! the fail function will be called for any transfer errors and the parameter applied is a NknWalletError instance. !!!
   */
  this.transferTo = function (toAddress, value, password, success, fail) {
    //verify address
    if(!NknTransfer.verifyAddress(toAddress)) {
      NknTransfer.callTransferFailHandler.call(this,
        fail,
        NknWalletError.newError(NknWalletError.code.INVALID_ADDRESS()))
      return
    }

    //verify wallet
    if(!verifyWallet(this, password)) {
      NknTransfer.callTransferFailHandler.call(this,
        fail,
        NknWalletError.newError(NknWalletError.code.INVALID_PASSWORD()))
      return
    }

    //get utxo | balance
    Http.getUTXO(this, this.address, NknWalletConfig.assetId, '', function (data) {

      //null data === no nkn coin
      if(null === data) {
        NknTransfer.callTransferFailHandler.call(this,
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
        NknTransfer.callTransferFailHandler.call(this, fail, inputsAndOutputs)
        return
      }

      //gen base transfer raw string
      let baseTransfer = NknTransfer.rawBaseTransfer(inputsAndOutputs)
      let signature = NknTransfer.rawTransferSignature(_account, baseTransfer)
      let signatureRedeem = NknTransfer.rawSignatureRedeem(account)

      let rawString = NknTransfer.genFullTransfer(baseTransfer, signature, signatureRedeem)

      //send transaction
      Http.sendRawTransfer(this, rawString, '', success, fail)

    }, function (error) {
      console.error(error)
    })
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
 * @returns {NknWallet | null} : return NknWallet instance or null if key information is missing.
 *
 * !!! this method will thow an error if the password is wrong !!!
 */
function loadJsonWallet(walletJson, password) {
  let walletObj = JSON.parse(walletJson)
  if(!Is.string(walletObj.MasterKey)
    || !Is.string(walletObj.IV)
    || !Is.string(walletObj.PrivateKeyEncrypted)
  ) {
    return null
  }

  let keys = decryptWalletPrivateKey(walletObj.MasterKey, walletObj.IV, walletObj.PrivateKeyEncrypted, password)
  return restoreWalletFromJson(keys.privateKey, password, keys.masterKey, walletObj.IV)
}

/***
 * global configuration:
 * {
 *  assetId: '',  // the NKN Token id
 *  rpcNode:'',   // node ip for dynamic information query
 *  rpcPort:'',   // node port for dynamic information query
 * }
 *
 * @param config : Object
 */
function configure(config) {
  NknWalletConfig = Object.assign({}, NknWalletConfig, config)
  Http.configure(NknWalletConfig.rpcNode, NknWalletConfig.rpcPort)
}

module.exports = {
  configure: configure,
  newWallet: newWallet,
  loadJsonWallet: loadJsonWallet,
  restoreWalletByPrivateKey: restoreWalletByPrivateKey,

  errorCode: NknWalletError.code,
}


