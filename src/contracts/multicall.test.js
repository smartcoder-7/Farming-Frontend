import Web3 from 'web3'
import multicall from './multicall'
import bscConfig from 'constants/bsc'

describe('multicall', () => {
  const web3 = new Web3(bscConfig.rpcURL)

  it('fetches balances', async () => {
    const address = '0xe16805e35bd01eB03EC817dB61991Dd1522299B3'
    const multicallInstance = multicall(web3, address)
    const calls = [{
      address: '0xa184088a740c695e156f91f5cc086a06bb78b827',
      name: 'balanceOf',
      params: [address]
    }]
    const result = await multicallInstance(calls)
    console.log(result)
    const balance = result[0]
    console.log(balance.toString())
  })
})

