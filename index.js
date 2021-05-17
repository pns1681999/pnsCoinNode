const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const request = require('request');
const path = require('path');
const Blockchain = require('./blockchain');
const PubSub = require('./p2p/pubsub');
// const PubSub = require('./p2p/pubsub.pubnub');

const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet')
const TransactionMiner = require('./wallet/transaction-miner')
const {ec} = require('./util')


const isDevelopment = process.env.ENV === 'development';

const REDIS_URL = isDevelopment ?
  'redis://127.0.0.1:6379' :
  'redis://h:p05f9a274bd0e2414e52cb9516f8cbcead154d7d61502d32d9750180836a7cc05@ec2-34-225-229-4.compute-1.amazonaws.com:19289'
  const DEFAULT_PORT = 3000;
  const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;



const app = express();

const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({blockchain, transactionPool, redisUrl: REDIS_URL });
// const pubsub = new PubSub({blockchain, transactionPool, wallet });
const transactionMiner = new TransactionMiner({blockchain, transactionPool, wallet, pubsub});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client/dist')));


app.get('/api/blocks', (req, res) => {
  res.status(200).json(blockchain.chain);
});

app.get('/api/blocks/length', (req, res) => {
  res.json(blockchain.chain.length);
});

app.get('/api/blocks/:id', (req, res) => {
  const { id } = req.params;
  const { length } = blockchain.chain;

  const blocksReversed = blockchain.chain.slice().reverse();

  let startIndex = (id-1) * 5;
  let endIndex = id * 5;

  startIndex = startIndex < length ? startIndex : length;
  endIndex = endIndex < length ? endIndex : length;

  res.json(blocksReversed.slice(startIndex, endIndex));
});

app.post('/api/mine', (req, res) => {
  const {data} = req.body;

  blockchain.addBlock({data});

  pubsub.broadcastChain();

  res.redirect('/api/blocks');
});

app.get('/api/transaction-history', (req, res) => {
  const address = req.query.publicKey ? req.query.publicKey : wallet.publicKey
  res.json(Blockchain.transactionHistory(blockchain.chain, address))
})

app.post('/api/transact', (req, res)=>{
  const {keyPair, amount, recipient} = req.body;
  let senderWallet;
  if (keyPair) {
    const key = ec.keyPair(keyPair)
    senderWallet = new Wallet(key);
    senderWallet.balance = Wallet.calculateBalance({chain: blockchain.chain, address: senderWallet.publicKey})
  } else {
    senderWallet = wallet
  }
  let transaction = transactionPool.existingTransaction({inputAddress: senderWallet.publicKey});
  try {
    if (transaction) {
      transaction.update({senderWallet: senderWallet, recipient, amount});
    } else {
      transaction = senderWallet.createTransaction({recipient, amount, chain: blockchain.chain});
    }
  } catch(error) {
    return res.status(400).json({type:'error', message: error.message});
  }

  transactionPool.setTransaction(transaction);
  
  pubsub.broadcastTransaction(transaction);

  res.json({type: 'success', transaction});
})

app.get('/api/transaction-pool-map', (req, res)=>{
  res.json(transactionPool.transactionMap);
})

app.get('/api/mine-transactions', (req, res) => {
  transactionMiner.mineTransactions();

  res.redirect('/api/blocks')
})

app.get('/api/wallet-info', (req, res) => {
  const address = req.query.publicKey ? req.query.publicKey : wallet.publicKey
  res.json({
    address,
    balance: Wallet.calculateBalance({chain: blockchain.chain, address})
  })
})

app.get('/api/known-addresses', (req, res) => {
  const addressMap = {};

  for (let block of blockchain.chain) {
    for (let transaction of block.data) {
      const recipient = Object.keys(transaction.outputMap);

      recipient.forEach(recipient => addressMap[recipient] = recipient);
    }
  }

  res.json(Object.keys(addressMap));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const syncState = () => {
  request({url: `${ROOT_NODE_ADDRESS}/api/blocks`}, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const rootChain = JSON.parse(body);
      console.log('replace chain on a sync with', rootChain);
      blockchain.replaceChain(rootChain);
    }
  })

  request({url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map`}, (error, response, body) =>{
    if (!error && response.statusCode === 200) {
      const rootTransactionPoolMap = JSON.parse(body);
      console.log('replace transaction pool map on a sync with', rootTransactionPoolMap);
      transactionPool.setMap(rootTransactionPoolMap);
    }
  })
}

let PEER;

if(process.env.GENERATE_PEER_PORT === 'true'){
  PEER = DEFAULT_PORT + Math.ceil(Math.random()*1000);
}

const PORT = process.env.PORT || PEER || DEFAULT_PORT;
app.listen(PORT, () => {
  console.log(`Run a at localhost:${PORT}`);
  if (PORT !== DEFAULT_PORT) {
    syncState();
  }
});

//Pns1681999@
//lit-wave-55253