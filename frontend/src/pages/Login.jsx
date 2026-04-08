import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function Login({ setUser }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);
                navigate('/');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Network error connecting to the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh'}}>
            <div className="glass-panel animate-fade-in" style={{width: '100%', maxWidth: '400px', padding: '2.5rem'}}>
                <h2 style={{textAlign: 'center', marginBottom: '0.5rem'}}>Member Login</h2>
                <p className="text-muted" style={{textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem'}}>Sign in to book meeting rooms.</p>
                
                {error && <div className="alert-error">{error}</div>}
                
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input 
                            type="email" 
                            className="form-control" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)}
                            placeholder="alice@demo.com"
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)}
                            placeholder="pass123"
                            required
                        />
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                    
                    <div style={{textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem'}} className="text-muted">
                        Test acc 1: alice@demo.com / pass123 <br />
                        Test acc 2: bob@demo.com / pass456
                    </div>
                </form>
            </div>
        </div>
    );
}
