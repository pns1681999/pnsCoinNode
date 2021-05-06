const MINE_RATE = 1000;
const INITIAL_DIFFICULTY = 3;
const GENESIS_DATA = {
    timestamp: 1,
    lastHash: 'pns-coin-hash',
    hash: 'genesis-hash',
    difficulty: INITIAL_DIFFICULTY,
    nonce: 0,
    data: 'PNS Coin - Non-profit'
}

module.exports = {GENESIS_DATA, MINE_RATE};