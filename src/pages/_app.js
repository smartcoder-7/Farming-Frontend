import {
  memo,
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef
} from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { map, includes } from 'ramda'
import Rollbar from 'rollbar'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ToastContainer, toast, Slide } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { chainIds, defaultChain } from 'constants/chains'
import Header from 'components/Header'
import Footer from 'components/Footer'
import Tabbar from 'components/Tabbar'
import { useWeb3 } from 'context/web3'
import ChainContext from 'context/chain'
import '../index.css'

const notify = (msg) => toast.dark(msg)

const App = ({ Component, pageProps }) => {
  const queryClient = useMemo(() => new QueryClient(), [])

  // Rollbar (error reporting)
  const rollbar = useMemo(() =>
    process.env.NEXT_PUBLIC_ROLLBAR_TOKEN &&
      new Rollbar({
        accessToken: process.env.NEXT_PUBLIC_ROLLBAR_TOKEN,
        captureUncaught: true,
        captureUnhandledRejections: true,
        payload: {
          environment: process.env.NODE_ENV
        }
      }),
    []
  )

  const chain = pageProps.chain || defaultChain
  const [{ web3, connectedChainId }] = useWeb3()
  const router = useRouter()
  useEffect(() => {
    if (connectedChainId === 128 && chain.chainId === 56) {
      router.push('/heco/')
    }
  }, [connectedChainId])

  return (
    <>
      <Head>
        <title>autofarm.network</title>
        <meta name="viewport" content="width=device-width, viewport-fit=cover, initial-scale=1, shrink-to-fit=no" />
      </Head>
      <ChainContext.Provider value={chain}>
        <QueryClientProvider client={queryClient}>
          <div className="flex flex-col xl:flex-row items-stretch justify-center relative min-h-screen lg:pb-0 max-w-screen-2xl m-auto">
            <ToastContainer
              transition={Slide}
              position="bottom-left"
              autoClose={3000}
              hideProgressBar
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />

            <Header />

            <div className="flex flex-col justify-between w-full">
              <Component
                {...pageProps}
                notify={notify}
              />
              <Footer chainId={chain.chainId} />
              <Tabbar />
            </div>
          </div>
        </QueryClientProvider>
      </ChainContext.Provider>
      <div id="modal-container" />
    </>
  );
}

export default memo(App);

