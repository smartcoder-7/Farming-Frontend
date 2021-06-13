import Document, { Html, Head, Main, NextScript } from 'next/document'

const ipfsScriptTxt = `
(function () {
  const { pathname } = window.location
  const ipfsMatch = /.*\\/Qm\\w{44}\\//.exec(pathname)
  const base = document.createElement('base')

  base.href = ipfsMatch ? ipfsMatch[0] : '/'
  document.head.append(base)
})();
`

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html>
        <Head>
        <link rel="icon" href="favicon.ico" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Only the best yields."/>
        <meta name="twitter:image" content="favicon.ico"/>
        <meta name="twitter:description" content="Only the best yields."/>
        <meta name="twitter:card" content="summary"/>
        <meta name="twitter:title" content="Only the best yields."/>
        <script async defer data-domain="autofarm.network" src="https://stats.autofarm.network/js/index.js" />
        <script dangerouslySetInnerHTML={{__html: ipfsScriptTxt}}/>
        <script dangerouslySetInnerHTML={{ __html: `
          if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }`
        }} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument

