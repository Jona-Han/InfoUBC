import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './Pages/Home';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" Component={HomePage} />
        {/* Add routes for other pages, e.g., Page1 and Page2 */}
      </Routes>
    </Router>
  )
}

export default App
