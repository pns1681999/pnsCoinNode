const Transaction = require('./transaction')
const {DEFAULT_COIN} = require('../config');
const {ec, cryptoHash} = require('../util');

class Wallet {
  constructor(keyPair) {
    this.keyPair = keyPair || ec.genKeyPair();
    this.publicKey = this.keyPair.getPublic().encode('hex');
    this.balance = DEFAULT_COIN;
  }
  sign(data) {
    return this.keyPair.sign(cryptoHash(data))
  }

  updateBalance(chain) {
    this.balance = Wallet.calculateBalance({
      chain,
      address: this.publicKey
    })
  }

  createTransaction({recipient, amount, chain}) {
    if (chain) {
      this.updateBalance(chain)
    }

    if(amount > this.balance) {
      throw new Error('Amount exceeds balance');
    }

    return new Transaction({senderWallet: this, recipient, amount});
  }

  static calculateBalance({chain, address}) {
    let hasConductedTransaction = false;
    let outputsTotal = 0;

    for (let i=chain.length-1; i>0; i--) {
      const block = chain[i];
      for (let transaction of block.data) {
        if (transaction.input.address === address) {
          hasConductedTransaction = true;
        }
        const addressOutput = transaction.outputMap[address];

        if (addressOutput) {
          outputsTotal = outputsTotal + addressOutput;
        }
      }
      if(hasConductedTransaction) {
        break;
      }
    }
    return hasConductedTransaction ? outputsTotal : DEFAULT_COIN + outputsTotal;
  }
}

module.exports = Wallet;