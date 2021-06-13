import React, { useContext } from 'react'

import { defaultChain } from 'constants/chains'

const ChainContext = React.createContext(defaultChain)
export const useChain = () => useContext(ChainContext)

export default ChainContext

