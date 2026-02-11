import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { savePoint, getAllPoints, getUnsyncedPoints } from './db';
import { Wifi, WifiOff, Save, MapPin } from 'lucide-react';

// Fix Leaflet marker icon
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMapEvents({
    click() {
      map.locate();
    },
    locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>You are here</Popup>
    </Marker>
  );
}

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [points, setPoints] = useState<any[]>([]);
  const [currentLoc, setCurrentLoc] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    loadPoints();

    // Get current location immediately
    navigator.geolocation.getCurrentPosition(
      (pos) => setCurrentLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error(err)
    );

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPoints = async () => {
    const all = await getAllPoints();
    setPoints(all);
  };

  const handleSaveLocation = async () => {
    if (!currentLoc) {
      alert("Waiting for GPS signal...");
      return;
    }
    
    await savePoint(currentLoc.lat, currentLoc.lng, 0); // TODO: Get real accuracy
    await loadPoints();
    alert("Point Saved Offline!");
  };

  const handleSync = async () => {
    const unsynced = await getUnsyncedPoints();
    if (unsynced.length === 0) {
      alert("No points to sync.");
      return;
    }
    
    // Simulate Sync
    alert(`Syncing ${unsynced.length} points to server...`);
    // In real app: POST /api/v1/land/survey-points
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white p-4 shadow-sm flex justify-between items-center z-20">
        <h1 className="text-xl font-bold text-slate-800">LandBiznes Field Tool</h1>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${isOnline ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
          {isOnline ? 'Online' : 'Offline Mode'}
        </div>
      </header>

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <MapContainer 
          center={currentLoc || [8.484, -13.234]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
          {points.map(p => (
            <Marker key={p.id} position={[p.latitude, p.longitude]}>
              <Popup>Recorded: {new Date(p.timestamp).toLocaleTimeString()}</Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Action Button */}
        <button 
          onClick={handleSaveLocation}
          className="absolute bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-[1000] flex items-center gap-2"
        >
          <MapPin size={24} />
          <span className="font-bold">Record Point</span>
        </button>
      </div>

      {/* Footer Controls */}
      <div className="bg-white p-4 border-t border-slate-200 flex justify-between items-center z-20">
        <div className="text-sm text-slate-500">
          {points.length} points collected
        </div>
        <button 
          onClick={handleSync}
          disabled={!isOnline}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save size={18} />
          Sync Data
        </button>
      </div>
    </div>
  );
}

export default App;
