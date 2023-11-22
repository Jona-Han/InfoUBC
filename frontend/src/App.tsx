import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './Pages/Home';
import GetCloseBuildingsForm from './Pages/GetClosestBuildingsForm';
import GetBestProfsForm from './Pages/GetBestProfsForm';

const App: React.FC = () => {
  return (
    
    <Router>
      <Routes>
        <Route path="/" Component={HomePage} />
        <Route path="/GetCloseBuildingsForm" Component={GetCloseBuildingsForm} />
        <Route path="/GetBestProfsForm" Component={GetBestProfsForm} />
        {/* <Route path="/" Component={HomePage} /> */}
      </Routes>
    </Router>
  )
}

export default App
