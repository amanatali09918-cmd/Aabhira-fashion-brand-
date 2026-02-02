// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SellerLogin from './components/SellerLogin/SellerLogin';
import SupplierDashboard from './components/SupplierDashboard/SupplierDashboard';

function App() {
  // You can add authentication check here
  const isAuthenticated = false; // Replace with actual auth check

  return (
    <Router>
      <Routes>
        <Route path="/supplier-login" element={<SellerLogin />} />
        <Route 
          path="/supplier-dashboard" 
          element={
            isAuthenticated ? 
            <SupplierDashboard /> : 
            <Navigate to="/supplier-login" />
          } 
        />
        <Route path="/" element={<Navigate to="/supplier-login" />} />
      </Routes>
    </Router>
  );
}

export default App;