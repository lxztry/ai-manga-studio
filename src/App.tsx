import { AppProvider } from './context/AppContext'
import { Layout } from './components/Layout'

function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  )
}

export default App
