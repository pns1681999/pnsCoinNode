const DEFAULT_DIFFICULTY = 3;
const GENESIS = {
  timestamp: 1,
  lastHash: 'pns-coin-hash',
  hash: 'genesis-hash',
  difficulty: DEFAULT_DIFFICULTY,
  nonce: 0,
  data: []
}
const DEFAULT_COIN = 200;
const MINE_RATE = 2000;
const REWARD_TXIN = {
  address: '<<PNS Coin System>>'
};

const MINING_REWARD = 10;
module.exports = {
  GENESIS,
  MINE_RATE,
  DEFAULT_COIN,
  REWARD_TXIN,
  MINING_REWARD
};