const Block = require('./block');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');
const {cryptoHash} = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config'); 
class Blockchain {
  constructor() {
    this.chain = [Block.genesis()]
  }
  addBlock({
    data
  }) {
    const newBlock = Block.mineBlock({
      lastBlock: this.chain[this.chain.length - 1],
      data
    })
    this.chain.push(newBlock)
  }
  replaceChain(chain, validateTransactions, onSuccess) {
    if (chain.length <= this.chain.length) {
      console.error('The incoming chain must be longer');
      return;
    }

    if (!Blockchain.isValidChain(chain)) {
      console.error('The incoming chain must be valid');
      return;
    }

    if (validateTransactions && !this.validTransactionData({chain})) {
      console.error('The incoming chain has invalid data');
      return;
    }
    if (onSuccess) onSuccess();
    console.log('replacing chain with', chain);
    this.chain = chain;
  }

  validTransactionData({ chain }) {
    for (let i=1; i<chain.length; i++) {
      const block = chain[i];
      const transactionSet = new Set();
      let rewardTransactionCount = 0;

      for (let transaction of block.data) {
        if (transaction.input.address === REWARD_INPUT.address) {
          rewardTransactionCount += 1;

          if (rewardTransactionCount > 1) {
            console.log('Miner rewards exceed limit')
            return false;
          }

          if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
            console.error('Miner reward amount is invalid');
            return false;
          }
        } else {
          if(!Transaction.validTransaction(transaction)) {
            console.error('Miner reward amount is invalid');
            return false;
          }

          const trueBalance = Wallet.calculateBalance({
            chain: this.chain,
            address: transaction.input.address
          });

          if (transaction.input.amount !== trueBalance) {
            console.error('Invalid input amount');
            return false
          }

          if (transactionSet.has(transaction)) {
            console.error('An identical transaction appears more than once in the block');
            return false;
          } else {
            transactionSet.add(transaction);
          }
        }
      }
    }
    return true;
  }

  static isValidChain(chain) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
      return false;
    }
    for (let i = 1; i < chain.length; i++) {
      const {
        timestamp,
        lastHash,
        hash,
        nonce,
        difficulty,
        data
      } = chain[i];
      const actualLastHash = chain[i - 1].hash;
      const lastDifficulty = chain[i-1].difficulty;
      if (lastHash !== actualLastHash) {
        return false;
      }
      const validateHash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
      if (hash !== validateHash) {
        return false;
      }
      if (Math.abs(lastDifficulty - difficulty) > 1) return false;
    }
    return true;
  }
  static transactionHistory(chain, address) {
    let result = [];
    for(let i = chain.length - 1; i > 0; i--) {
      const block = chain[i]
      for (let transaction of block.data) {
        if (transaction.input.address === address) {
          console.log(Object.keys(transaction.outputMap))
          Object.keys(transaction.outputMap).forEach(item => {
            if (item !== address) {
              result.push({
                id: transaction.id,
                timestamp: transaction.input.timestamp,
                from: transaction.input.address,
                to: item,
                block: i,
                amount: transaction.outputMap[item],
              })
            }
          })
        } else {
          Object.keys(transaction.outputMap).forEach(item => {
            if (item === address) {
              result.push({
                id: transaction.id,
                timestamp: transaction.input.timestamp,
                from: transaction.input.address,
                to: item,
                block: i,
                amount: transaction.outputMap[item],
              })
            }
          })
        }
      }
    }
    return result;
  }
}
module.exports = Blockchain;