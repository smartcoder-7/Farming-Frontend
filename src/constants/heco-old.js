const hecoConfig = {
  chainId: 128,
  label: 'HECO',

  // APIs
  apiURL: 'https://api2.autofarm.network/heco',
  stagingApiURL: 'https://api2.autofarm.network/heco',

  gasLimit: 580000,
  autoFarmContractAddress:'0xb09a88956730b6b842d9f1cf6f72dd682c2f36f9',
  autoSwapContractAddress: '0xa3148802fa73565791fb6308256bc25276f94067',
  multicallContractAddress: '0x5Feb54235C542b0e3479eA8f7830726AFc66dD05',
  AUTOAddress: null,
  blockExplorerURLBase:'https://hecoinfo.com/',
  rpcURL: 'https://http-mainnet-node.huobichain.com',
  nativeCurrency: 'HT',
  networkName: 'Huobi Eco Chain',

  emergencyWithdraw: true,

  urls: {
    vaults: '/heco'
  }
}

export default hecoConfig

