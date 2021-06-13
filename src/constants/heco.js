const hecoConfig = {
  chainId: 128,
  label: 'HECO',

  // APIs
  //apiURL: 'https://api2.autofarm.network/heco',
  apiURL: 'https://staging-api.autofarm.network',
  stagingApiURL: 'https://staging-api.autofarm.network',

  gasLimit: 580000,
  autoFarmContractAddress:'0x96a29c4bce3126266983f535b41c30dba80d5d99',
  autoSwapContractAddress: '0xa3148802fa73565791fb6308256bc25276f94067',
  multicallContractAddress: '0x5Feb54235C542b0e3479eA8f7830726AFc66dD05',
  AUTOAddress: null,
  blockExplorerURLBase:'https://hecoinfo.com/',
  rpcURL: 'https://http-mainnet-node.huobichain.com',
  nativeCurrency: 'HT',
  networkName: 'Huobi Eco Chain',

  urls: {
    vaults: '/heco'
  }
}

export default hecoConfig

