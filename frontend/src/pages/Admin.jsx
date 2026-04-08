import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function Admin() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [token, setToken] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            
            if (res.ok) {
                setToken(data.token);
                setIsAuthenticated(true);
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const fetchBookings = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/bookings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchBookings();
        }
    }, [isAuthenticated]);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        
        try {
            const res = await fetch(`${API_URL}/admin/bookings/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchBookings(); // Refresh
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!isAuthenticated) {
        return (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh'}}>
                <div className="glass-panel" style={{width: '100%', maxWidth: '400px', padding: '2.5rem'}}>
                    <h2 style={{textAlign: 'center', marginBottom: '2rem'}}>Admin Access</h2>
                    {error && <div className="alert-error">{error}</div>}
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label">Admin Password</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter password"
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={loading}>
                            {loading ? 'Authenticating...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={{padding: '2rem 3rem'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                <div>
                    <h1>Admin Dashboard</h1>
                    <p className="text-muted">Manage all meeting room bookings across the organization.</p>
                </div>
                <button className="btn btn-outline" onClick={() => {
                    setIsAuthenticated(false);
                    setPassword('');
                    setToken(null);
                }}>Logout</button>
            </div>

            <div className="glass-panel admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User</th>
                            <th>Room</th>
                            <th>Date</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{textAlign: 'center', padding: '2rem', color: 'var(--text-muted)'}}>
                                    No bookings found.
                                </td>
                            </tr>
                        ) : (
                            bookings.map(b => (
                                <tr key={b.id}>
                                    <td>#{b.id}</td>
                                    <td style={{fontWeight: 500}}>{b.user_name}</td>
                                    <td>{b.room_name}</td>
                                    <td>{format(parseISO(b.start_time), 'MMM d, yyyy')}</td>
                                    <td>{format(parseISO(b.start_time), 'h:mm a')}</td>
                                    <td>{format(parseISO(b.end_time), 'h:mm a')}</td>
                                    <td>
                                        <button 
                                            className="btn btn-danger" 
                                            style={{padding: '0.4rem 0.8rem', fontSize: '0.85rem'}}
                                            onClick={() => handleDelete(b.id)}
                                        >
                                            Cancel
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
