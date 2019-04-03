# nkn-wallet-js

JavaScript implementation of NKN wallet.

**Note: This repository is in the early development stage and may not have all
functions working properly. It should be used only for testing now.**

## Install

### Node

```shell
npm i nkn-wallet
```

### Browser

Use `dist/nkn-wallet.js` or `dist/nkn-wallet.min.js`.

## Usage

+ import
```javascript
// ES6
import nknWallet from 'nkn-wallet';

// ES5
var nknWallet = require('nkn-wallet');
```

+ Create a new wallet
```javascript
const wallet = nknWallet.newWallet('password');
```

+ Get wallet's json string
```javascript
const walletJson = wallet.toJSON();
```

+ Load wallet from a wallet json string
```javascript
const walletFromJson = nknWallet.loadJsonWallet(walletJson, 'password');
```

+ Restore wallet from a private key
```javascript
const walletFromSeed = nknWallet.restoreWalletBySeed(wallet.getSeed(), 'new-wallet-password');
```

+ Verify whether an address is valid
```javascript
console.log(nknWallet.verifyAddress(wallet.address));
```

+ Verify password of the wallet
```javascript
console.log(wallet.verifyPassword('password'));
```

+ Get balance of this wallet
```javascript
wallet.getBalance()
  .then(function(value) {
    console.log('Balance for this wallet is:', value.toString());
  })
  .catch(function(error) {
    console.log('Get balance fail:', error);
  });
```

+ Transfer token to some address
```javascript
wallet.transferTo(wallet.address, 1)
  .then(function(data) {
    console.log('Transfer success:', data);
  })
  .catch(function(error) {
    console.log('Transfer fail:', error);
  });
```

+ Register name for this wallet
```javascript
wallet.registerName('some-name')
  .then(function(data) {
    console.log('Register name success:', data);
  })
  .catch(function(error) {
    console.log('Register name fail:', error);
  });
```

+ Delete name for this wallet
```javascript
wallet.deleteName('some-name')
  .then(function(data) {
    console.log('Delete name success:', data);
  }).catch(function(error) {
    console.log('Delete name fail:', error);
  });
```

+ Subscribe to bucket 0 of specified topic for this wallet for next 10 blocks
```javascript
wallet.subscribe('topic', 0, 10, 'identifier')
  .then(function(data) {
    console.log('Subscribe success:', data);
  }).catch(function(error) {
    console.log('Subscribe fail:', error);
  });
```

Check [examples](examples) for full examples.

## Configure

NKN wallet only stores some static information such as encrypted private keys,
addresses and so on. All dynamic information needs to be queried from a NKN
node. By default it will try to use RPC server provided by us, but you can
change it (together with NKN token ID) by calling the global configure function:

```javascript
nknWallet.configure({
  rpcAddr: 'http://127.0.0.1:30003',
})
```

Note that configure is optional. If you don't call `configure()`, default
configurations will be used.

## API

+ nknWallet

```javascript

/***
 * global configuration:
 * {
 *  rpcAddr:'',   // node addr for dynamic information query, default value: http://testnet-node-0001.nkn.org:30003
 * }
 *
 * @param config | Object
 */
nknWallet.configure(config)
```

```javascript
/**
 * create a new wallet
 * @param password : string : the password to encrypt wallet
 * @returns {NknWallet} : a NknWallet instance
 */
nknWallet.newWallet(password)
```

```javascript
/***
 * load wallet from json string
 * @param walletJson : string : a json format wallet
 * @param password : string : password for this wallet
 * @returns {NknWallet | null} : return NknWallet instance or null if key information is missing.
 *
 * !this method will thow an error if the password is wrong!
 */
nknWallet.loadJsonWallet(walletJson, password)
```

```javascript
/***
 * restore a wallet from private key
 * @param privateKey : string : the private key for wallet restore
 * @param password : string : password for new wallet
 * @returns {NknWallet} : a NknWallet instance
 */
nknWallet.restoreWalletBySeed(privateKey, password)
```

```javascript
/***
 * verify whether an address is valid
 * @param address : string : an address
 * @returns {boolean} : verifies whether an address is valid
 */
nknWallet.verifyAddress(address)
```

+ NknWallet

All of the following methods are instance methods

```javascript
/***
 * generate wallet json
 * @returns {string} : wallet json
 */
toJSON()
```

```javascript
/***
 * get the public key of this wallet
 * @returns {string} : the public key of this wallet
 */
getPublicKey()
```

```javascript
/***
 * verify password of the wallet
 * @param password : string : password for this wallet
 * @returns {boolean} : verifies whether the password is correct
 */
verifyPassword(password)
```

```javascript
/***
 * get the private key of this wallet
 * @returns {string} : the private key of this wallet
 *
 * !!! anyone with the private key has the power to restore a full-featured wallet !!!!
 */
getPrivateKey()
```

```javascript
/***
 * transfer nkn to some valid address
 * @param toAddress : string : valid nkn address
 * @param value : number : value for transfer
 *
 * !!! the fail function will be called for any transfer errors  
 *     and the parameter applied is a WalletError instance. !!!
  */
transferTo(toAddress, value)
```

```javascript
/***
 * register name on nkn for current wallet
 * @param name : string : name to register
 *
 * !!! the fail function will be called for any register errors  
 *     and the parameter applied is a WalletError instance. !!!
  */
registerName(name)
```

```javascript
/***
 * delete name on nkn for current wallet
 * @param name : string : name to delete
 *
 * !!! the fail function will be called for any delete errors  
 *     and the parameter applied is a WalletError instance. !!!
  */
deleteName(name)
```

```javascript
/***
 * subscribe to topic on nkn for current wallet
 * @param topic : string : topic to subscribe to
 * @param bucket : number : bucket of topic to subscribe to
 * @param duration : number : subscription duration
 * @param identifier : string : optional identifier
 *
 * !!! the fail function will be called for any register errors  
 *     and the parameter applied is a WalletError instance. !!!
  */
subscribe(topic, bucket, duration, identifier = '')
```

```javascript
/***
 * query balance
 * @returns {promise} : if resolved, the parameter is a decimal.js instance
 */
getBalance()
```

## Contributing

**Can I submit a bug, suggestion or feature request?**

Yes. Please open an issue for that.

**Can I contribute patches?**

Yes, we appreciate your help! To make contributions, please fork the repo, push
your changes to the forked repo with signed-off commits, and open a pull request
here.

Please sign off your commit. This means adding a line "Signed-off-by: Name
<email>" at the end of each commit, indicating that you wrote the code and have
the right to pass it on as an open source patch. This can be done automatically
by adding -s when committing:

```shell
git commit -s
```

## Community

* [Discord](https://discord.gg/c7mTynX)
* [Telegram](https://t.me/nknorg)
* [Reddit](https://www.reddit.com/r/nknblockchain/)
* [Twitter](https://twitter.com/NKN_ORG)
