import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './Pages/Home';
import GetCloseBuildingsForm from './Pages/GetClosestBuildingsForm';

const App: React.FC = () => {
  return (
    
    <Router>
      <Routes>
        <Route path="/" Component={HomePage} />
        <Route path="/GetCloseBuildingsForm" Component={GetCloseBuildingsForm} />
        {/* <Route path="/" Component={HomePage} /> */}
      </Routes>
    </Router>
  )
}

export default App
