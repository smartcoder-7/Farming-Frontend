import { memo, useState, useEffect } from 'react'

const Loading = () => {
  const [numDots, setNumDots] = useState(3)
  useEffect(() => {
    const interval = setInterval(() => {
      setNumDots(n => (n+1) % 4)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const label = [
    'Loading Vaults',
    numDots > 0 ? '.' : '\u2008',
    numDots > 1 ? '.' : '\u2008',
    numDots > 2 ? '.' : '\u2008',
  ].join('')

  return label
}

export default memo(Loading)

