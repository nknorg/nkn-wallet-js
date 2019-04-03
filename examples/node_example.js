const nknWallet = require('../lib/wallet');

// Uncomment this if you want to use customized rpc node
// nknWallet.configure({
//   rpcAddr: 'http://127.0.0.1:30003'
// })

// Create a new wallet
const wallet = nknWallet.newWallet('pswd');

// Get wallet's json string
const walletJson = wallet.toJSON();

// Load wallet from a wallet json string
const walletFromJson = nknWallet.loadJsonWallet(walletJson, 'pswd');

// Restore wallet from a private key
const walletFromSeed = nknWallet.restoreWalletBySeed(wallet.getSeed(), 'new-wallet-password');

// Verify whether an address is valid
console.log(nknWallet.verifyAddress(wallet.address));

// Verify password of the wallet
console.log(wallet.verifyPassword('pswd'));

// Get balance of this wallet
wallet.getBalance().then(function(value) {
  console.log('Balance for this wallet is:', value.toString());
}).catch(function(error) {
  console.log('Get balance fail:', error);
});

// Transfer token to some address
// This call will fail because a new account has no balance
wallet.transferTo(wallet.address, 1).then(function(data) {
  console.log('Transfer success:', data);
}).catch(function(error) {
  console.log('Transfer fail:', error);
});

// Register name for this wallet
wallet.registerName('somename').then(function(data) {
  console.log('Register name success:', data);
}).catch(function(error) {
  console.log('Register name fail:', error);
});

// Delete name for this wallet
// This call will fail because a new account has no name
wallet.deleteName('somename').then(function(data) {
  console.log('Delete name success:', data);
}).catch(function(error) {
  console.log('Delete name fail:', error);
});

// Subscribe to bucket 0 of specified topic for this wallet for next 10 blocks
wallet.subscribe('topic', 0, 10, 'identifier').then(function(data) {
  console.log('Subscribe success:', data);
}).catch(function(error) {
  console.log('Subscribe fail:', error);
});

// Get nonce for next transaction of this wallet
wallet.getNonce().then(function(value) {
  console.log('Nonce for this wallet is:', value);
}).catch(function(error) {
  console.log('Get nonce fail:', error);
});
