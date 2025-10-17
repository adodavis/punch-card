import { Routes, Route } from 'react-router-dom'
import Scorecards from './Components/Scorecards'
import Scorecard from './Components/Scorecard'
import './App.css'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Scorecards />} />
        <Route path="/scorecard" element={<Scorecard />} />
      </Routes>
    </>
  )
}

export default App
