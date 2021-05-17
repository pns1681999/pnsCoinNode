const PubNub = require('pubnub');

const credentials = {
  publishKey: 'pub-c-15d618ae-1e33-4597-ae54-82fa7d180256',
  subscribeKey: 'sub-c-c719e1c0-aee0-11eb-aad1-021b9ca2091c',
  secretKey: 'sec-c-OGU2ZjRmMGMtODExMi00YzAyLWI4ODktNTBhMjZmYzViOWVh'
};

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION'
};

class PubSub {
  constructor({ blockchain, transactionPool, wallet }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;

    this.pubnub = new PubNub(credentials);

    this.pubnub.subscribe({ channels: Object.values(CHANNELS) });

    this.pubnub.addListener(this.listener());
  }

  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain),
    });
  }

  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction)
    });
  }

  subscribeToChannels() {
    this.pubnub.subscribe({
      channels: [Object.values(CHANNELS)]
    });
  }

  listener() {
    return {
      message: messageObject => {
        const { channel, message } = messageObject;
        console.log(`Message received. Channel: ${channel}. Message: ${message}`);
        const parsedMessage = JSON.parse(message);

        switch(channel) {
          case CHANNELS.BLOCKCHAIN:
            this.blockchain.replaceChain(parsedMessage, true, () => {
              console.log('success')
              this.transactionPool.clearBlockchainTransactions(
                { chain: parsedMessage }
              );
            });
            break;
          case CHANNELS.TRANSACTION:
            // if (!this.transactionPool.existingTransaction({
            //   inputAddress: this.wallet.publicKey
            // })) {
              this.transactionPool.setTransaction(parsedMessage);
            // }
            break;
          default:
            return;
        }
      }
    }
  }

  publish({ channel, message }) {
    // there is an unsubscribe function in pubnub
    // but it doesn't have a callback that fires after success
    // therefore, redundant publishes to the same local subscriber will be accepted as noisy no-ops
    this.pubnub.publish({ message, channel}); 
  }

  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain)
    });
  }

  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction)
    });
  }
}


module.exports = PubSub;
