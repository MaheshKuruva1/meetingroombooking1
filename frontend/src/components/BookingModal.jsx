import { useState } from 'react';
import { format, formatISO, parse, isAfter } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function BookingModal({ room, startTime, onClose, onSuccess }) {
    // Initial start time based on the clicked block
    const [customStartTimeStr, setCustomStartTimeStr] = useState(format(startTime, 'HH:mm'));
    // Default to +30 mins
    const defaultEndTime = new Date(startTime.getTime() + 30 * 60000);
    const [customEndTimeStr, setCustomEndTimeStr] = useState(format(defaultEndTime, 'HH:mm'));

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Date base (same day as clicked)
    const dateBaseString = format(startTime, 'yyyy-MM-dd');

    const getFullDateFromTimeStr = (timeString) => {
        return parse(`${dateBaseString} ${timeString}`, 'yyyy-MM-dd HH:mm', new Date());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        const actualStart = getFullDateFromTimeStr(customStartTimeStr);
        const actualEnd = getFullDateFromTimeStr(customEndTimeStr);

        if (!isAfter(actualEnd, actualStart)) {
            setError('End time must be after start time.');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    room_id: room.id,
                    start_time: format(actualStart, "yyyy-MM-dd'T'HH:mm:ss"),
                    end_time: format(actualEnd, "yyyy-MM-dd'T'HH:mm:ss")
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to book room. Are you logged in?');
            } else {
                onSuccess(); // triggers refresh
            }
        } catch (err) {
            setError('Network error connecting to the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="glass-modal modal-content" onClick={e => e.stopPropagation()}>
                <h2 style={{marginBottom: '0.2rem'}}>Book {room.name}</h2>
                <p className="text-muted" style={{marginBottom: '1.5rem', fontSize: '0.9rem'}}>
                    {format(startTime, 'MMMM d, yyyy')}
                </p>

                {error && <div className="alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{display: 'flex', gap: '1rem', marginBottom: '0.5rem'}}>
                        <div className="form-group" style={{flex: 1}}>
                            <label className="form-label">Start Time</label>
                            <input 
                                type="time" 
                                className="form-control"
                                value={customStartTimeStr}
                                onChange={e => setCustomStartTimeStr(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group" style={{flex: 1}}>
                            <label className="form-label">End Time</label>
                            <input 
                                type="time" 
                                className="form-control"
                                value={customEndTimeStr}
                                onChange={e => setCustomEndTimeStr(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div style={{background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem'}}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom: '0.5rem'}}>
                            <span className="text-muted">Selected Start:</span>
                            <span>{customStartTimeStr}</span>
                        </div>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom: '0.5rem'}}>
                            <span className="text-muted">Selected End:</span>
                            <span style={{color: 'var(--accent)'}}>{customEndTimeStr}</span>
                        </div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem'}}>
                            Review your times carefully. Overlapping bookings will be rejected.
                        </div>
                    </div>

                    <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Booking...' : 'Confirm Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
