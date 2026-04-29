import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { NovoContrato } from './pages/NovoContrato'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/novo" element={<NovoContrato />} />
      </Routes>
    </BrowserRouter>
  )
}
