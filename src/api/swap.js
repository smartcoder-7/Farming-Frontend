import axios from 'axios'

import { tokensBySymbol } from 'lib/tokens'

const SWAP_API_URL = process.env.NEXT_PUBLIC_SWAP_API_URL || 'https://dex.autofarm.network'

const swapApi = axios.create({
  baseURL: SWAP_API_URL,
})

// API doesn't support BNB, change to WNBNB
export const getQuote = ({
  inputAmt, // BigNumber
  inputToken,
  outputToken
}) => swapApi.get('get_quotes', {
  params: {
    input_amt: inputAmt?.toString(),
    input_token: inputToken.toLowerCase(),
    output_token: outputToken.toLowerCase()
  }
}).then(({ data }) => data)

