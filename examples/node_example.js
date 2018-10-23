const nknWallet = require('../lib/wallet');

// Uncomment this if you want to use customized rpc node
// nknWallet.configure({
//   rpcAddr: 'http://127.0.0.1:30003'
// })

// Create a new wallet
const wallet = nknWallet.newWallet('pwd')

// Get wallet's json string
const walletJson = wallet.toJSON()

// Load wallet from a wallet json string
const walletFromJson = nknWallet.loadJsonWallet(walletJson, 'pwd')

// Restore wallet from a private key
const walletFromPrivateKey = nknWallet.restoreWalletByPrivateKey('the private key', 'new-wallet-password')

// Query asset balance for this wallet
wallet.queryAssetBalance().then(function(value) {
  console.log('asset balance for this wallet is: ', value.toString())
}).catch(function(error) {
  console.log('query balance fail: ', error)
})

// Transfer asset to some address
// This call will fail because a new account has no balance
wallet.transferTo(wallet.address, 100, 'pwd').then(function(data) {
  console.log('success: ', data)
}).catch(function(error) {
  console.log('fail: ', error)
})

// Register name for this wallet
wallet.registerName('somename', 'pwd').then(function(data) {
    console.log('success: ', data)
}).catch(function(error) {
    console.log('fail: ', error)
})

// Delete name for this wallet
// This call will fail because a new account has no name
wallet.deleteName('pwd').then(function(data) {
    console.log('success: ', data)
}).catch(function(error) {
    console.log('fail: ', error)
})