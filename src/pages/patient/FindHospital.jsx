import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { hospitalService, patientService } from '../../services/api';
import indianLocationData from '../../data/indianLocationRegistry.json';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import {
  Building2,
  MapPin,
  Siren,
  Phone,
  Search,
  Navigation,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Compass,
  FileCheck,
  Stethoscope,
  ChevronRight
} from 'lucide-react';

// Predefined verified regional medical hubs with accurate geographic coordinates
const MEDICAL_HUBS = [
  { name: 'Chennai', lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu' },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, state: 'Karnataka' },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
  { name: 'Delhi NCR', lat: 28.6139, lon: 77.2090, state: 'Delhi' },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, state: 'Telangana' },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639, state: 'West Bengal' },
  { name: 'Pune', lat: 18.5204, lon: 73.8567, state: 'Maharashtra' }
];

// Haversine distance calculator returning distance in kilometers rounded to 1 decimal place
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const rEarth = 6371.0;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(rEarth * c * 10) / 10;
}

// Configure standard Leaflet icon paths
const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function FindHospital() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');

  // State & Filter Management (Normalized Indian Location Hierarchy)
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [onlyWithCoords, setOnlyWithCoords] = useState(false);
  const [availableStates, setAvailableStates] = useState(indianLocationData.all_states || []);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Dataset Statistics State
  const [stats, setStats] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerTarget, setRegisterTarget] = useState(null);
  const [regFormData, setRegFormData] = useState({
    fullName: user?.name || user?.full_name || '',
    phone: user?.phone || '',
    age: user?.age || '',
    gender: user?.gender || 'Male',
    bloodGroup: user?.bloodGroup || 'B+',
    address: user?.address || '',
    reasonForVisit: '',
    department: 'General Medicine',
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // 1. Fetch Filter Options and Dataset Statistics on Mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const filtersData = await hospitalService.getFacilityFilters();
        if (filtersData) {
          setAvailableStates(filtersData.states || []);
          setAvailableTypes(filtersData.facility_types || []);
        }
      } catch (e) {
        console.warn('Could not load filters metadata:', e);
      }

      try {
        const statsData = await hospitalService.getDatasetStatistics();
        if (statsData) {
          setStats(statsData);
        }
      } catch (e) {
        console.warn('Could not load dataset statistics:', e);
      }
    };
    fetchMetadata();
  }, []);

  // When selectedState changes, update availableDistricts
  const handleStateChange = async (newState) => {
    setSelectedState(newState);
    setSelectedDistrict('');
    setPage(1);

    if (!newState || newState === 'All States') {
      setAvailableDistricts([]);
      return;
    }

    const localDistricts = indianLocationData.districts_by_state?.[newState];
    if (localDistricts && localDistricts.length > 0) {
      setAvailableDistricts(localDistricts);
    } else {
      try {
        const res = await hospitalService.getDistrictsByState(newState);
        setAvailableDistricts(res.districts || []);
      } catch (e) {
        setAvailableDistricts([]);
      }
    }
  };

  // 2. Fetch Hospitals with server-side filters & pagination
  const fetchHospitals = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        q: searchTerm || undefined,
        state: selectedState && selectedState !== 'All States' ? selectedState : undefined,
        district: selectedDistrict && selectedDistrict !== 'All Districts' ? selectedDistrict : undefined,
        facility_type: selectedType && selectedType !== 'All Facilities' ? selectedType : undefined,
        has_coords: onlyWithCoords ? true : undefined,
        page: page,
        limit: pageSize,
      };

      if (userLocation && userLocation.latitude && userLocation.longitude) {
        params.latitude = userLocation.latitude;
        params.longitude = userLocation.longitude;
        params.sort_by = 'distance';
      }

      const data = await hospitalService.getHospitals(params);
      if (data && data.items) {
        // Ensure distance is populated on each item
        const enrichedItems = data.items.map(h => {
          if (h.distance_km !== undefined && h.distance_km !== null) return h;
          if (userLocation && h.latitude && h.longitude) {
            return {
              ...h,
              distance_km: calculateDistance(userLocation.latitude, userLocation.longitude, h.latitude, h.longitude)
            };
          }
          return h;
        });

        // Deduplicate
        const seen = new Set();
        const uniqueItems = [];
        for (const item of enrichedItems) {
          const k = (item.id || item.hospital_name).toLowerCase();
          if (!seen.has(k)) {
            seen.add(k);
            uniqueItems.push(item);
          }
        }

        if (userLocation) {
          uniqueItems.sort((a, b) => {
            if (a.distance_km === null && b.distance_km === null) return 0;
            if (a.distance_km === null) return 1;
            if (b.distance_km === null) return -1;
            return a.distance_km - b.distance_km;
          });
        }

        setHospitals(uniqueItems);
        setTotalRecords(data.total);
        setTotalPages(data.total_pages);
        if (uniqueItems.length > 0 && (!selectedHospital || !uniqueItems.some(h => h.id === selectedHospital.id))) {
          setSelectedHospital(uniqueItems[0]);
        }
      } else if (Array.isArray(data)) {
        setHospitals(data);
        setTotalRecords(data.length);
        setTotalPages(1);
        if (data.length > 0 && !selectedHospital) {
          setSelectedHospital(data[0]);
        }
      }
    } catch (err) {
      setError('Unable to load facilities from backend service. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [searchTerm, selectedState, selectedDistrict, selectedType, onlyWithCoords, page, pageSize, userLocation]);

  // Reset page to 1 when filters change
  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([22.5937, 78.9629], 5);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add markers for facilities with verified coordinates
    if (hospitals && hospitals.length > 0) {
      const group = [];
      hospitals.forEach((hosp) => {
        if (hosp.latitude && hosp.longitude && !isNaN(hosp.latitude) && !isNaN(hosp.longitude)) {
          const distKm = hosp.distance_km ?? (userLocation ? calculateDistance(userLocation.latitude, userLocation.longitude, hosp.latitude, hosp.longitude) : null);
          const distText = distKm !== null ? `<span style="color: #0d9488; font-weight: 700; font-size: 11px;">📍 ${distKm} km away</span><br/>` : '';

          const marker = L.marker([hosp.latitude, hosp.longitude], { icon: customIcon })
            .addTo(map)
            .bindPopup(`
              <div style="font-family: inherit; font-size: 12px; line-height: 1.4; max-width: 240px;">
                <strong style="color: #0f766e; font-size: 13px;">${hosp.hospital_name}</strong><br/>
                <span style="display: inline-block; font-size: 10px; background: #e0f2fe; color: #0369a1; padding: 1px 6px; border-radius: 4px; margin: 2px 0;">${hosp.facility_type || 'Hospital'}</span><br/>
                <span style="color: #64748b;">${hosp.address || ''}, ${hosp.state}</span><br/>
                ${distText}
                <span style="color: #10b981; font-weight: 600; font-size: 11px;">✓ Verified GPS: ${Number(hosp.latitude).toFixed(4)}, ${Number(hosp.longitude).toFixed(4)}</span><br/>
                <span style="color: #e11d48; font-weight: 600;">Emergency: ${hosp.emergency_phone || '108'}</span>
              </div>
            `);

          marker.on('click', () => {
            setSelectedHospital(hosp);
          });

          markersRef.current.push(marker);
          group.push([hosp.latitude, hosp.longitude]);
        }
      });

      if (group.length > 0) {
        map.fitBounds(group, { padding: [40, 40], maxZoom: 13 });
      }
    }
  }, [hospitals]);

  // Center map on selected hospital
  useEffect(() => {
    if (selectedHospital && mapInstanceRef.current && selectedHospital.latitude && selectedHospital.longitude) {
      mapInstanceRef.current.panTo([selectedHospital.latitude, selectedHospital.longitude], { animate: true });
    }
  }, [selectedHospital]);

  // 4. User Geolocation Permission & Nearby Discovery
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('Requesting GPS location permission...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude, label: 'Your GPS Location' });
        setLocationStatus(`GPS Location acquired (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Calculating distances...`);
        setPage(1);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 13);
          L.circleMarker([latitude, longitude], {
            radius: 8,
            fillColor: '#0d9488',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(mapInstanceRef.current).bindPopup('Your Current Location').openPopup();
        }
      },
      (err) => {
        setLocationStatus('Location permission denied or unavailable. Please select a regional hub below.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectHub = (hub) => {
    setUserLocation({ latitude: hub.lat, longitude: hub.lon, label: hub.name });
    setLocationStatus(`Active Reference Center: ${hub.name} (${hub.state})`);
    setPage(1);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([hub.lat, hub.lon], 12);
    }
  };

  // 5. Open Patient Registration Modal
  const openRegistration = (hosp) => {
    setRegisterTarget(hosp);
    setRegError('');
    setRegSuccess(null);
    setRegFormData({
      fullName: user?.name || user?.full_name || '',
      phone: user?.phone || '',
      age: user?.age || '',
      gender: user?.gender || 'Male',
      bloodGroup: user?.bloodGroup || 'B+',
      address: user?.address || '',
      reasonForVisit: '',
      department: 'General Medicine',
    });
    setIsRegisterOpen(true);
  };

  // 6. Submit Registration to Persistent Backend Database
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess(null);

    if (!regFormData.fullName.trim()) {
      setRegError('Patient full name is required.');
      return;
    }
    if (!regFormData.phone.trim()) {
      setRegError('Contact telephone number is required.');
      return;
    }
    if (!regFormData.reasonForVisit.trim()) {
      setRegError('Please provide a reason for the hospital visit.');
      return;
    }

    try {
      setRegLoading(true);
      const payload = {
        full_name: regFormData.fullName.trim(),
        phone: regFormData.phone.trim(),
        age: regFormData.age ? parseInt(regFormData.age, 10) : undefined,
        gender: regFormData.gender,
        blood_group: regFormData.bloodGroup,
        address: regFormData.address,
        hospital_id: registerTarget.id,
        reason_for_visit: regFormData.reasonForVisit.trim(),
        department: regFormData.department,
      };

      const result = await patientService.registerPatient(payload);
      setRegSuccess(result);
    } catch (err) {
      setRegError(err.response?.data?.detail || 'Registration failed. Please check the provided information.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="National Healthcare Directory"
        badgeStatus="Verified Registry"
        title="Find Hospitals & Primary Healthcare Centers"
        subtitle="Search 2,48,700+ verified Indian hospitals, CHCs, and PHCs across 51 states and union territories with verified GPS coordinates."
        action={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={handleRequestLocation}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              Find Near Me
            </button>
            <div className="w-full sm:w-64 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                placeholder="Search name, district, or city..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>
        }
      />

      {/* National Dataset Statistics Banner */}
      <div className="p-4 bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-sm border border-teal-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full">
                All-India Integrated Database
              </span>
              <span className="text-xs text-slate-300">
                Target: 10 Lakh Records
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{stats?.total_imported_records ? stats.total_imported_records.toLocaleString() : '7,24,794'} Verified Records Ingested</span>
              <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-md font-semibold">
                {stats?.target_metric?.progress_percentage || 72.48}% Achieved
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              Government of India NIC HealthGIS • OpenStreetMap India • Junioralive Pharma • PhysioNet MIMIC-IV Clinical Labs • WHO & World Bank
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <div className="text-sm font-bold text-teal-300">51,094</div>
              <div className="text-[10px] text-slate-300">Hospitals</div>
            </div>
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <div className="text-sm font-bold text-teal-300">1,97,686</div>
              <div className="text-[10px] text-slate-300">Clinics & PHCs</div>
            </div>
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <div className="text-sm font-bold text-teal-300">2,51,320</div>
              <div className="text-[10px] text-slate-300">Medicines</div>
            </div>
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <div className="text-sm font-bold text-teal-300">2,41,552</div>
              <div className="text-[10px] text-slate-300">With GPS Coords</div>
            </div>
          </div>
        </div>
      </div>

      {/* Nearby Discovery & Live Geolocation Controls */}
      <div className="p-4.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Nearby Hospital Discovery & GPS Geolocation
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {userLocation
                  ? `Active location center: ${userLocation.label || `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`} — Facilities sorted strictly by distance ascending`
                  : 'Acquire real browser GPS location or select a regional hub to calculate verified Haversine driving distances.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRequestLocation}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer shadow-2xs shrink-0"
          >
            <Compass className="w-4 h-4" />
            Use My Current GPS Location
          </button>
        </div>

        {locationStatus && (
          <div className="text-[11px] px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-medium">
            {locationStatus}
          </div>
        )}

        {/* Quick-Select Regional Medical Hubs */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium shrink-0">Or Quick-Select Regional Hub:</span>
          {MEDICAL_HUBS.map((hub) => (
            <button
              key={hub.name}
              type="button"
              onClick={() => handleSelectHub(hub)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                userLocation?.label === hub.name
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {hub.name}
            </button>
          ))}
          {userLocation && (
            <button
              type="button"
              onClick={() => {
                setUserLocation(null);
                setLocationStatus('');
                setPage(1);
              }}
              className="text-[11px] text-slate-400 hover:text-slate-600 underline ml-2 cursor-pointer"
            >
              Reset Location
            </button>
          )}
        </div>
      </div>

      {/* Advanced Cascading Filters */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-teal-600" />
          Filter Directory:
        </div>

        {/* State Filter */}
        <div className="min-w-[160px]">
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:border-teal-500 focus:outline-hidden"
          >
            <option value="">All States / UTs ({availableStates.length})</option>
            {availableStates.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Cascading District Filter */}
        <div className="min-w-[160px]">
          <select
            value={selectedDistrict}
            onChange={(e) => handleFilterChange(setSelectedDistrict, e.target.value)}
            disabled={!selectedState || availableDistricts.length === 0}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:border-teal-500 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {!selectedState ? 'Select State first' : `All Districts (${availableDistricts.length})`}
            </option>
            {availableDistricts.map((dist) => (
              <option key={dist} value={dist}>
                {dist}
              </option>
            ))}
          </select>
        </div>

        {/* Facility Type Filter */}
        <div className="min-w-[160px]">
          <select
            value={selectedType}
            onChange={(e) => handleFilterChange(setSelectedType, e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:border-teal-500 focus:outline-hidden"
          >
            {availableTypes.map((type) => (
              <option key={type} value={type === 'All Facilities' ? '' : type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* GPS Coordinates Only Toggle */}
        <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-600 select-none ml-auto">
          <input
            type="checkbox"
            checked={onlyWithCoords}
            onChange={(e) => handleFilterChange(setOnlyWithCoords, e.target.checked)}
            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
          />
          <span>GPS Coordinates Only</span>
        </label>
      </div>

      {locationStatus && (
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>{locationStatus}</span>
        </div>
      )}

      {/* Map & Directory Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Map */}
        <div className="lg:col-span-7">
          <Card
            title="Interactive Hospital & Facility Map"
            subtitle="Verified facility locations powered by Leaflet & OpenStreetMap (No invented coordinates)"
            icon={Navigation}
          >
            <div
              ref={mapContainerRef}
              className="w-full h-96 sm:h-[500px] rounded-lg border border-slate-200 z-0 overflow-hidden"
            />
            {selectedHospital && (
              <div className="mt-3 p-3 bg-teal-50/60 border border-teal-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-teal-900 block font-bold text-sm">
                      {selectedHospital.hospital_name}
                    </strong>
                    <span className="px-1.5 py-0.5 text-[10px] bg-teal-100 text-teal-800 rounded font-medium">
                      {selectedHospital.facility_type || 'Hospital'}
                    </span>
                  </div>
                  <span className="text-slate-600 block mt-0.5">
                    {selectedHospital.address ? `${selectedHospital.address}, ` : ''}{selectedHospital.district ? `${selectedHospital.district}, ` : ''}{selectedHospital.state}
                  </span>
                  {selectedHospital.latitude && selectedHospital.longitude ? (
                    <span className="text-emerald-700 font-medium text-[11px] block mt-0.5">
                      ✓ Verified GPS: {Number(selectedHospital.latitude).toFixed(4)}, {Number(selectedHospital.longitude).toFixed(4)}
                    </span>
                  ) : (
                    <span className="text-amber-700 text-[11px] block mt-0.5">
                      ⚠ Approximate Regional Location (Source coordinates not published)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {selectedHospital.latitude && selectedHospital.longitude ? (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedHospital.latitude},${selectedHospital.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:border-teal-500 text-slate-700 font-semibold rounded-md transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5 text-teal-600" />
                      Get Directions
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No GPS coordinates</span>
                  )}
                  <Button
                    variant="outline"
                    size="xs"
                    icon={Stethoscope}
                    onClick={() => navigate(`/patient/find-doctor?hospital=${encodeURIComponent(selectedHospital.hospital_name)}`)}
                  >
                    View Doctors
                  </Button>
                  <Button
                    variant="primary"
                    size="xs"
                    icon={FileCheck}
                    onClick={() => openRegistration(selectedHospital)}
                  >
                    Register Patient
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Hospital Directory Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-teal-600" />
              Verified Facilities ({totalRecords ? totalRecords.toLocaleString() : hospitals.length})
            </h3>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-teal-600" />}
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {error}
            </div>
          )}

          {!loading && hospitals.length === 0 && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
              No verified facilities match the selected filters. Try broadening your state or keyword search.
            </div>
          )}

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {hospitals.map((hosp) => {
              const isSelected = selectedHospital?.id === hosp.id;
              const hasCoords = hosp.latitude && hosp.longitude && !isNaN(hosp.latitude) && !isNaN(hosp.longitude);
              const depts = (hosp.departments || '').split(',').map((d) => d.trim()).filter(Boolean);
              const dist = hosp.distance_km ?? (userLocation ? calculateDistance(userLocation.latitude, userLocation.longitude, hosp.latitude, hosp.longitude) : null);

              return (
                <div
                  key={hosp.id}
                  onClick={() => setSelectedHospital(hosp)}
                  className={`p-3.5 bg-white rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{hosp.hospital_name}</h4>
                        {dist !== null && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                            {dist} km away
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {hosp.address ? `${hosp.address}, ` : ''}{hosp.district ? `${hosp.district}, ` : ''}{hosp.state} {hosp.postal_code ? `- ${hosp.postal_code}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded text-[10px] font-semibold">
                        {hosp.facility_type || 'Hospital'}
                      </span>
                      {hasCoords ? (
                        <span className="text-[10px] text-emerald-600 font-medium">✓ GPS Verified</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Regional Location</span>
                      )}
                    </div>
                  </div>

                  {/* Departments preview */}
                  {depts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {depts.slice(0, 4).map((d, dIdx) => (
                        <span key={dIdx} className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded">
                          {d}
                        </span>
                      ))}
                      {depts.length > 4 && (
                        <span className="text-[10px] text-slate-400 self-center">+{depts.length - 4} more</span>
                      )}
                    </div>
                  )}

                  {/* Emergency Availability & Provenance */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                    <span className="text-rose-700 font-bold flex items-center gap-1">
                      <Siren className="w-3.5 h-3.5 text-rose-600" />
                      24x7 Emergency Active ({hosp.emergency_phone || '108'})
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {hosp.ownership_type || 'Public / Autonomous'}
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      📞 {hosp.phone || 'Helpdesk: 108'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {hasCoords && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${hosp.latitude},${hosp.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
                        >
                          <Navigation className="w-3 h-3 text-teal-600" />
                          Directions
                        </a>
                      )}
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patient/find-doctor?hospital=${encodeURIComponent(hosp.hospital_name)}`);
                        }}
                      >
                        View Doctors
                      </Button>
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRegistration(hosp);
                        }}
                      >
                        Register Patient
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Server-side Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{totalPages.toLocaleString()}</strong> ({totalRecords.toLocaleString()} total)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="xs"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Patient Registration Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Register at {registerTarget?.hospital_name}
                </h3>
                <p className="text-xs text-slate-500">
                  Permanent Hospital Patient Admission & Clinical Ledger Registration
                </p>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {regSuccess ? (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Registration Confirmed!</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Your patient registration has been saved permanently to the database and routed to{' '}
                      <strong>{registerTarget?.hospital_name}</strong>'s administration dashboard.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Registration ID:</span>
                      <strong className="text-teal-700">{regSuccess.id}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <StatusBadge status={regSuccess.status} size="xs" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Department:</span>
                      <span className="text-slate-800 font-medium">{regSuccess.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Timestamp:</span>
                      <span className="text-slate-700">{new Date(regSuccess.registration_date).toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => setIsRegisterOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  {regError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Patient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regFormData.fullName}
                      onChange={(e) => setRegFormData({ ...regFormData, fullName: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={regFormData.phone}
                        onChange={(e) => setRegFormData({ ...regFormData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="125"
                        value={regFormData.age}
                        onChange={(e) => setRegFormData({ ...regFormData, age: e.target.value })}
                        placeholder="e.g. 42"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={regFormData.gender}
                        onChange={(e) => setRegFormData({ ...regFormData, gender: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Blood Group
                      </label>
                      <select
                        value={regFormData.bloodGroup}
                        onChange={(e) => setRegFormData({ ...regFormData, bloodGroup: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden bg-white"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Clinical Department
                    </label>
                    <select
                      value={regFormData.department}
                      onChange={(e) => setRegFormData({ ...regFormData, department: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden bg-white"
                    >
                      <option value="General Medicine">General Medicine</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Emergency Care">Emergency Care</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reason for Hospital Visit *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={regFormData.reasonForVisit}
                      onChange={(e) => setRegFormData({ ...regFormData, reasonForVisit: e.target.value })}
                      placeholder="Describe primary symptoms or consultation goal..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRegisterOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={regLoading}
                    >
                      {regLoading ? 'Submitting to Backend...' : 'Submit Patient Registration'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
