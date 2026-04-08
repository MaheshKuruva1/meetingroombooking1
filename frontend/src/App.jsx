import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Login from './pages/Login';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');
  const isLogin = location.pathname.startsWith('/login');

  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check locally stored user
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login');
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="brand" style={{textDecoration: 'none', color: 'var(--text-primary)'}}>
          <span className="text-gradient" style={{fontSize: '1.8rem'}}>Nexus</span><span style={{fontWeight: 300}}>Space</span>
        </Link>
        
        {!isAdmin && !isLogin && (
            <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                {user ? (
                   <>
                      <span className="text-muted" style={{fontSize: '0.9rem'}}>Logged in as <span style={{color: 'white'}}>{user.name}</span></span>
                      <button onClick={handleLogout} className="btn btn-outline" style={{padding: '0.4rem 1rem', fontSize: '0.85rem'}}>Logout</button>
                   </>
                ) : (
                    <Link to="/login" className="btn btn-primary" style={{textDecoration: 'none', padding: '0.4rem 1rem', fontSize: '0.9rem'}}>Login</Link>
                )}
                <div style={{width: '1px', height: '24px', background: 'var(--border)'}}></div>
                <Link to="/admin" className="btn btn-outline" style={{textDecoration: 'none', padding: '0.4rem 1rem', fontSize: '0.9rem'}}>
                    Admin Portal
                </Link>
            </div>
        )}
      </nav>
      <main style={{flex: 1}}>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
