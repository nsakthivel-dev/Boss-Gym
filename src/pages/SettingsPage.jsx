import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { 
  Settings, 
  Bell, 
  Save, 
  Globe,
  Palette,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  MapPin,
  Smartphone
} from 'lucide-react';

const SettingSection = ({ title, description, children }) => (
  <div className="bg-white border border-border rounded-2xl p-6 md:p-8 mb-6 shadow-card">
    <div className="mb-6 pb-4 border-b border-border-light">
      <h3 className="text-text-main font-black text-lg uppercase tracking-tight">{title}</h3>
      <p className="text-muted text-xs font-semibold mt-1">{description}</p>
    </div>
    <div className="space-y-6">
      {children}
    </div>
  </div>
);

const InputGroup = ({ label, description, type = "text", placeholder, value, onChange, disabled }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-3.5 border-b border-border-light/60 last:border-0">
    <div className="flex-1 max-w-md">
      <label className="text-xs font-bold text-text-main uppercase tracking-wider block">{label}</label>
      <p className="text-[11px] text-muted font-medium mt-0.5">{description}</p>
    </div>
    <div className="w-full md:w-80">
      <input 
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-white border border-border text-text-main px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all placeholder:text-muted/60 disabled:bg-surface-muted disabled:text-muted"
      />
    </div>
  </div>
);

const ToggleGroup = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4 py-3.5 border-b border-border-light/60 last:border-0">
    <div className="flex-1">
      <label className="text-xs font-bold text-text-main uppercase tracking-wider block">{label}</label>
      <p className="text-[11px] text-muted font-medium mt-0.5">{description}</p>
    </div>
    <button 
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
        checked ? 'bg-gold-500' : 'bg-surface-muted border border-border'
      }`}
    >
      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
        checked ? 'translate-x-5.5' : 'translate-x-0'
      }`} />
    </button>
  </div>
);

const SettingsPage = () => {
  const { currentUser } = useAuth();
  const { settings: contextSettings, loading: contextLoading } = useSettings();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Password Reset State
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [resetting, setResetting] = useState(false);

  const [settings, setSettings] = useState({
    gymName: 'New Boss Gym',
    contactEmail: 'touch@lupusventure.com',
    phoneNumber: '+91 98765 43210',
    address: 'No:22, Gayathiri Nagar, 100ft Road, Muthaliyarpet, Pondicherry – 605004',
    latitude: 11.9111586,
    longitude: 79.6347447,
    radius: 500,
    notifyExpiry: true,
    notifyAttendance: true,
    browserNotifications: true,
    whatsappWelcome: true,
    theme: 'gold'
  });

  useEffect(() => {
    if (!contextLoading && contextSettings) {
      setSettings(prev => ({ ...prev, ...contextSettings }));
      setLoading(false);
    }
  }, [contextLoading, contextSettings]);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const docRef = doc(db, 'settings', 'config');
      
      const dataToSave = {
        ...settings,
        latitude: Number(settings.latitude) || 0,
        longitude: Number(settings.longitude) || 0,
        radius: Number(settings.radius) || 500
      };

      await setDoc(docRef, dataToSave, { merge: true });
      showFeedback('success', 'Settings saved successfully');
    } catch (err) {
      console.error("Error saving settings:", err);
      showFeedback('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return showFeedback('error', 'New passwords do not match');
    }
    if (passwords.new.length < 6) {
      return showFeedback('error', 'Password must be at least 6 characters');
    }

    setResetting(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, passwords.current);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwords.new);
      
      showFeedback('success', 'Password updated successfully');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      console.error("Password update error:", err);
      if (err.code === 'auth/wrong-password') {
        showFeedback('error', 'Incorrect current password');
      } else {
        showFeedback('error', 'Failed to update password');
      }
    } finally {
      setResetting(false);
    }
  };

  const showFeedback = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'general', label: 'Branding & Details', icon: Globe },
    { id: 'location', label: 'Geofence & GPS', icon: MapPin },
    { id: 'notifications', label: 'Alerts & Messages', icon: Bell },
    { id: 'security', label: 'Admin Security', icon: Lock },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Loader2 className="w-8 h-8 text-gold-600 animate-spin" />
      <p className="text-muted text-xs font-bold uppercase tracking-wider">Loading settings...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-light">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-600">Preferences</span>
          <h1 className="text-2xl md:text-3xl font-black text-text-main tracking-tight uppercase">System Settings</h1>
          <p className="text-xs text-muted mt-0.5">Manage branding, geofence check-in range, and credentials</p>
        </div>
        
        {message.text && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-subtle ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tabs */}
        <aside className="md:w-56 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left ${
                  activeTab === tab.id 
                    ? 'bg-gold-50 text-gold-700 border border-gold-200 font-black shadow-subtle' 
                    : 'text-text-secondary hover:text-text-main hover:bg-white'
                }`}
              >
                <Icon size={16} className={activeTab === tab.id ? 'text-gold-600' : 'text-muted'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <SettingSection 
              title="Gym Identity" 
              description="Public details displayed across your web and PWA application"
            >
              <InputGroup 
                label="Gym Name" 
                description="The public name of your fitness center"
                value={settings.gymName}
                onChange={(val) => updateSetting('gymName', val)}
              />
              <InputGroup 
                label="Official Email" 
                description="Email for member inquiries and public footer"
                type="email"
                value={settings.contactEmail}
                onChange={(val) => updateSetting('contactEmail', val)}
              />
              <InputGroup 
                label="Phone Contact" 
                description="Primary phone number for calls and inquiries"
                type="tel"
                value={settings.phoneNumber}
                onChange={(val) => updateSetting('phoneNumber', val)}
              />
              <InputGroup 
                label="Gym Address" 
                description="Street and landmark location"
                value={settings.address}
                onChange={(val) => updateSetting('address', val)}
              />
              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gold-500 hover:bg-gold-600 text-white font-bold px-6 py-2.5 rounded-xl uppercase text-xs tracking-wider shadow-gold-sm transition-all flex items-center gap-2"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Identity
                </button>
              </div>
            </SettingSection>
          )}

          {activeTab === 'location' && (
            <SettingSection 
              title="Geofence & Coordinates" 
              description="Used by the self-service /checkin page to verify members are on premises"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-border-light">
                <div>
                  <label className="text-xs font-bold text-text-main uppercase tracking-wider block mb-1">Latitude</label>
                  <input 
                    type="text"
                    value={settings.latitude}
                    onChange={(e) => updateSetting('latitude', e.target.value)}
                    className="w-full bg-white border border-border text-text-main px-4 py-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-main uppercase tracking-wider block mb-1">Longitude</label>
                  <input 
                    type="text"
                    value={settings.longitude}
                    onChange={(e) => updateSetting('longitude', e.target.value)}
                    className="w-full bg-white border border-border text-text-main px-4 py-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="py-2">
                <button 
                  onClick={() => {
                    if (navigator.geolocation) {
                      setSaving(true);
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          updateSetting('latitude', pos.coords.latitude.toFixed(6));
                          updateSetting('longitude', pos.coords.longitude.toFixed(6));
                          setSaving(false);
                          showFeedback('success', 'GPS coordinates updated to current position');
                        },
                        (err) => {
                          setSaving(false);
                          showFeedback('error', 'Could not get device location');
                        }
                      );
                    }
                  }}
                  className="flex items-center gap-2 text-xs font-bold text-gold-700 hover:text-gold-800 bg-gold-50 border border-gold-200 px-3.5 py-2 rounded-xl transition-colors"
                >
                  <MapPin size={14} /> Detect Current GPS Coordinates
                </button>
              </div>

              <InputGroup 
                label="Allowed Geofence Radius (Meters)" 
                description="Max distance in meters within which a check-in is allowed"
                type="number"
                value={settings.radius}
                onChange={(val) => updateSetting('radius', parseInt(val) || 0)}
              />

              <InputGroup 
                label="Self Check-in Portal URL" 
                description="The public self-checkin endpoint used for the wall QR"
                value="https://newbossgym.in.net/checkin"
                disabled={true}
                onChange={() => {}}
              />

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gold-500 hover:bg-gold-600 text-white font-bold px-6 py-2.5 rounded-xl uppercase text-xs tracking-wider shadow-gold-sm transition-all flex items-center gap-2"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Geofence
                </button>
              </div>
            </SettingSection>
          )}

          {activeTab === 'notifications' && (
            <SettingSection 
              title="Alert Preferences" 
              description="Configure notification thresholds and automated triggers"
            >
              <ToggleGroup 
                label="Membership Expiry Alerts" 
                description="Flag members whose memberships expire within 3 days or are expired"
                checked={settings.notifyExpiry}
                onChange={(val) => updateSetting('notifyExpiry', val)}
              />
              <ToggleGroup 
                label="Browser Desktop Notifications" 
                description="Show desktop notification popups for real-time member check-ins"
                checked={settings.browserNotifications}
                onChange={(val) => updateSetting('browserNotifications', val)}
              />
              <ToggleGroup 
                label="WhatsApp Welcome Integration" 
                description="Offer instant WhatsApp welcome link upon member enrollment"
                checked={settings.whatsappWelcome}
                onChange={(val) => updateSetting('whatsappWelcome', val)}
              />
              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gold-500 hover:bg-gold-600 text-white font-bold px-6 py-2.5 rounded-xl uppercase text-xs tracking-wider shadow-gold-sm transition-all flex items-center gap-2"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Alerts
                </button>
              </div>
            </SettingSection>
          )}

          {activeTab === 'security' && (
            <SettingSection 
              title="Administrative Security" 
              description="Update your administrator login password"
            >
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-text-main uppercase tracking-wider block mb-1">Current Password *</label>
                  <input 
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="w-full bg-white border border-border text-text-main px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-text-main uppercase tracking-wider block mb-1">New Password *</label>
                    <input 
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      className="w-full bg-white border border-border text-text-main px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-main uppercase tracking-wider block mb-1">Confirm New Password *</label>
                    <input 
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="w-full bg-white border border-border text-text-main px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button 
                    type="submit"
                    disabled={resetting || !passwords.current || !passwords.new}
                    className="bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl uppercase text-xs tracking-wider shadow-gold-sm transition-all flex items-center gap-2"
                  >
                    {resetting ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                    Update Password
                  </button>
                </div>
              </form>
            </SettingSection>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
