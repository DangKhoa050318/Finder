import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';

function Home() {
  return <h1>Hello World</h1>;
}

function App() {
  const [token, setToken] = useState(null);

  // Reset token mỗi lần reload
  React.useEffect(() => {
    setToken(null);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={(tk) => setToken(tk)} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/home"
          element={token ? <Home /> : <Navigate to="/login" />}
        />
        <Route
          path="/"
          element={<Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
