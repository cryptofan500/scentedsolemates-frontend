import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  // FIX: Corrected JSX spread operator syntax
  return <Component {...pageProps} />
}

export default MyApp