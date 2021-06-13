const bscConfig = {
  chainId: 56,
  label: 'BSC',
  apiPrefix: 'bsc',
  stagingApiPrefix: 'bsc-staging',
  gasLimit: 580000,
  autoFarmContractAddress: '0x0895196562c7868c5be92459fae7f877ed450452',
  autoSwapContractAddress: '0x9e0a94af2052e8bf77278bfb569bb38a9e820555',
  multicallContractAddress: '0x1Ee38d535d541c55C9dae27B12edf090C608E6Fb',
  AUTOAddress: '0xa184088a740c695e156f91f5cc086a06bb78b827',
  blockExplorerURLBase: 'https://bscscan.com/',
  rpcURL: 'https://bsc-dataseed1.defibit.io',
  nativeCurrency: 'BNB',
  networkName: 'Binance Smart Chain',

  urls: {
    vaults: '/'
  }
}

export default bscConfig

