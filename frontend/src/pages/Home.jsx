import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookingModal from '../components/BookingModal';
import { format, parseISO, addMinutes, startOfDay, setHours, setMinutes } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const generateTimeSlots = (baseDate) => {
    const slots = [];
    let current = setMinutes(setHours(startOfDay(baseDate), 9), 0); // 09:00
    const end = setMinutes(setHours(startOfDay(baseDate), 18), 0); // 18:00

    while (current < end) {
        slots.push(new Date(current));
        current = addMinutes(current, 30);
    }
    return slots;
};

export default function Home({ user }) {
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState(null); // { room, startTime }
    
    const navigate = useNavigate();
    const timeSlots = generateTimeSlots(date);

    const fetchData = async () => {
        try {
            setLoading(true);
            const formattedDate = format(date, 'yyyy-MM-dd');
            
            const [roomsRes, bookingsRes] = await Promise.all([
                fetch(`${API_URL}/rooms`),
                fetch(`${API_URL}/bookings?date=${formattedDate}`)
            ]);
            
            const roomsData = await roomsRes.json();
            const bookingsData = await bookingsRes.json();
            
            setRooms(roomsData);
            setBookings(bookingsData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [date]);

    const isSlotBooked = (roomId, slotTime) => {
        const slotEnd = addMinutes(slotTime, 30);
        return bookings.some(booking => {
            if (booking.room_id !== roomId) return false;
            
            const bStart = parseISO(booking.start_time);
            const bEnd = parseISO(booking.end_time);
            
            return (slotTime < bEnd && slotEnd > bStart);
        });
    };

    const handleSlotClick = (room, slotTime) => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (isSlotBooked(room.id, slotTime)) return;
        if (slotTime < new Date()) {
            alert("This time slot has already passed.");
            return;
        }
        setSelectedSlot({ room, startTime: slotTime });
    };

    return (
        <div className="timeline-container animate-fade-in">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <div>
                    <h1>Book a Workspace</h1>
                    <p className="text-muted">Select an available time slot below to secure your meeting room.</p>
                </div>
                <div>
                    <input 
                        type="date" 
                        className="form-control"
                        value={format(date, 'yyyy-MM-dd')}
                        onChange={(e) => setDate(parseISO(e.target.value))}
                        min={format(new Date(), 'yyyy-MM-dd')}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{textAlign: 'center', padding: '3rem', color: 'var(--text-muted)'}}>
                    <div className="spinner"></div> Loading Availability...
                </div>
            ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                    {rooms.map(room => (
                        <div key={room.id} className="room-card glass-panel">
                            <div className="room-header">
                                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                    <div style={{width: '24px', height: '24px', borderRadius: '50%', background: room.image_url}}></div>
                                    <h2 style={{margin: 0, fontSize: '1.4rem'}}>{room.name}</h2>
                                </div>
                                <div className="room-meta">
                                    <span className="badge">👤 {room.capacity}</span>
                                    <span style={{opacity: 0.7}}>{room.amenities}</span>
                                </div>
                            </div>
                            
                            <div className="time-grid">
                                {timeSlots.map((slot, index) => {
                                    const booked = isSlotBooked(room.id, slot);
                                    const isPast = slot < new Date();
                                    return (
                                        <div 
                                            key={index} 
                                            className={`time-slot ${booked ? 'slot-booked' : isPast ? 'slot-past' : 'slot-available'}`}
                                            onClick={() => handleSlotClick(room, slot)}
                                            title={isPast ? "Past slot" : `${format(slot, 'HH:mm')} - ${format(addMinutes(slot, 30), 'HH:mm')}`}
                                        >
                                            <span style={{fontSize: '0.65rem'}}>{format(slot, 'HH:mm')}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedSlot && (
                <BookingModal 
                    room={selectedSlot.room} 
                    startTime={selectedSlot.startTime} 
                    onClose={() => setSelectedSlot(null)}
                    onSuccess={() => {
                        setSelectedSlot(null);
                        fetchData(); // Refresh UI
                    }}
                />
            )}
        </div>
    );
}
