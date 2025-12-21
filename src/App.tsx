import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Callback from './pages/Callback'
import NotFound from './pages/NotFound'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  )
}

export default App
