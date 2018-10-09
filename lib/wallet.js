'use strict'

require('es6-promise/auto');
const NknAccount = require('./crypto/account')
const Algorithm = require('./crypto/algorithm')
const Http = require('./network/http')
const RawTransactionTools = require('./common/rawTransactionTools')
const NknWalletError = require('./common/errors')
const NknTransfer = require('./common/transferTools')
const NknName = require('./common/nameTools')
const NknPrepay = require('./common/prepayTools')
const NknMath = require('./common/math')
const Is = require('is')

let NknWalletConfig = require('./config')

configure(NknWalletConfig)

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
   * @returns {promise} : if resolved, the parameter is a decimal.js instance
   */
  this.queryAssetBalance = async function () {
    if(!this.address) {
      throw "Address not set."
    }

    let data = await Http.getUTXO(this, this.address, NknWalletConfig.assetId)
    if (!data) {
      return NknMath.newNum(0)
    }

    return calcAssetBalance(data)
  }

  /***
   * transfer nkn to some valid address
   * @param toAddress : string : valid nkn address
   * @param value : number : value for transfer
   * @param password : string : wallet password
   */
  this.transferTo = async function (toAddress, value, password) {
    //verify address
    if(!RawTransactionTools.verifyAddress(toAddress)) {
      throw NknWalletError.newError(NknWalletError.code.INVALID_ADDRESS())
    }

    //verify wallet
    if(!verifyWallet(this, password)) {
      throw NknWalletError.newError(NknWalletError.code.INVALID_PASSWORD())
    }

    //get utxo | balance
    let data = await Http.getUTXO(this, this.address, NknWalletConfig.assetId)
    if (!data) {
      throw NknWalletError.newError(NknWalletError.code.NOT_ENOUGH_NKN_COIN())
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
      throw inputsAndOutputs
    }

    //gen base transfer raw string
    let baseTransfer = NknTransfer.rawBaseTransfer(inputsAndOutputs)
    let signature = RawTransactionTools.rawTransferSignature(_account, baseTransfer)
    let signatureRedeem = RawTransactionTools.rawSignatureRedeem(account)

    let rawString = RawTransactionTools.genFullTransfer(baseTransfer, signature, signatureRedeem)

    //send transaction
    return Http.sendRawTransfer(this, rawString)
  }

    /***
     * register name on nkn for current wallet
     * @param name : string : name to register
     * @param password : string : wallet password
     */
    this.registerName = async function (name, password) {
        //verify wallet
        if(!verifyWallet(this, password)) {
            throw NknWalletError.newError(NknWalletError.code.INVALID_PASSWORD())
        }

        //gen base register name raw string
        let baseRegisterName = NknName.rawRegisterName(name, this.getPublicKey())
        let signature = RawTransactionTools.rawTransferSignature(_account, baseRegisterName)
        let signatureRedeem = RawTransactionTools.rawSignatureRedeem(account)

        let rawString = RawTransactionTools.genFullTransfer(baseRegisterName, signature, signatureRedeem)

        //send transaction
        return Http.sendRawTransfer(this, rawString)
    }

    /***
     * delete name on nkn for current wallet
     * @param password : string : wallet password
     */
    this.deleteName = async function (password) {
        //verify wallet
        if(!verifyWallet(this, password)) {
            throw NknWalletError.newError(NknWalletError.code.INVALID_PASSWORD())
        }

        //gen base delete name raw string
        let baseDeleteName = NknName.rawDeleteName(this.getPublicKey())
        let signature = RawTransactionTools.rawTransferSignature(_account, baseDeleteName)
        let signatureRedeem = RawTransactionTools.rawSignatureRedeem(account)

        let rawString = RawTransactionTools.genFullTransfer(baseDeleteName, signature, signatureRedeem)

        //send transaction
        return Http.sendRawTransfer(this, rawString)
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
   * @return {promise} : if resolved, data's will be an object like this {Amount: string, Rates: string}
   */
  this.queryPrepaiedInfo = function () {
    return Http.getPrepaiedInfo(this, this.address)
  }

  /***
   * recharge the prepaid balance
   * @param value : number : how much NKN you want to prepay
   * @param rates : number : how much NKN you want to pay for one data transfer
   * @param password : string : password for this wallet
   */
  this.prepay = async function (value, rates, password) {
    //verify wallet
    if(!verifyWallet(this, password)) {
      throw NknWalletError.newError(NknWalletError.code.INVALID_PASSWORD())
    }

    //get utxo | balance
    let data = await Http.getUTXO(this, this.address, NknWalletConfig.assetId)
    if (!data) {
      throw NknWalletError.newError(NknWalletError.code.NOT_ENOUGH_NKN_COIN())
    }

    let prepayPayloadRawString = NknPrepay.genPrepayPayloadRawString(NknWalletConfig.assetId, value, rates)
    let inputsAndOutputs = NknPrepay.genInputsAndOutputs(
      NknWalletConfig.assetId,
      data,
      value,
      this.programHash
    )

    if(!Is.instanceof(inputsAndOutputs, NknPrepay.prepayInputsAndOutputs)) {
      throw inputsAndOutputs
    }

    //gen base transfer raw string
    let baseTransfer = NknPrepay.rawBaseTransfer(prepayPayloadRawString, inputsAndOutputs)
    let signature = RawTransactionTools.rawTransferSignature(_account, baseTransfer)
    let signatureRedeem = RawTransactionTools.rawSignatureRedeem(account)

    let rawString = RawTransactionTools.genFullTransfer(baseTransfer, signature, signatureRedeem)

    //send transaction
    return Http.sendRawTransfer(this, rawString)
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
