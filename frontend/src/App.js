import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div>
        <h1>Codebase Studio</h1>
        <Routes>
          <Route path="/" element={<div>Splash Page</div>} />
          <Route path="/home" element={<div>Home Page</div>} />
          <Route path="/profile/:id" element={<div>Profile Page</div>} />
          <Route path="/project/:id" element={<div>Project Page</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;