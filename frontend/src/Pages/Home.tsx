import React from 'react';
import { Link } from 'react-router-dom'; 

const HomePage: React.FC = () => {
    return (
        <div style={{width:'100%', margin: 0, padding: 0, height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center'}}>
      <h1 style={{ width: '100%', textAlign: 'center' }}>Lazy Student</h1>
      <div style={{justifyContent: 'flex-start'}}>
        <Link to="/getCloseBuildingsForm">
          <button>Find buildings closest to the bus loop</button>
        </Link>
        <Link to="/getBestProffsForm">
          <button>Find Proffs with the highest class averages</button>
        </Link>
      </div>
    </div>
    );
};

export default HomePage;