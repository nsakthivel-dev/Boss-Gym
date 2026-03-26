import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Save, 
  Globe,
  Smartphone,
  Mail,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const SettingSection = ({ title, description, children }) => (
  <div className="bg-card border border-border rounded-xl p-6 mb-6">
    <div className="mb-6">
      <h3 className="text-white font-bold text-lg uppercase tracking-tight">{title}</h3>
      <p className="text-muted text-xs font-medium uppercase tracking-widest mt-1">{description}</p>
    </div>
    <div className="space-y-6">
      {children}
    </div>
  </div>
);

const InputGroup = ({ label, description, type = "text", placeholder, value, onChange }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-[#1a1a1a] last:border-0">
    <div className="flex-1">
      <label className="text-sm font-bold text-white uppercase tracking-widest block">{label}</label>
      <p className="text-[10px] text-[#555] font-bold uppercase tracking-[0.2em] mt-1">{description}</p>
    </div>
    <input 
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-[#0a0a0a] border border-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors md:w-64"
    />
  </div>
);

const ToggleGroup = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4 py-4 border-b border-[#1a1a1a] last:border-0">
    <div className="flex-1">
      <label className="text-sm font-bold text-white uppercase tracking-widest block">{label}</label>
      <p className="text-[10px] text-[#555] font-bold uppercase tracking-[0.2em] mt-1">{description}</p>
    </div>
    <button 
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 rounded-full relative transition-colors ${checked ? 'bg-primary' : 'bg-[#1a1a1a]'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checked ? 'right-1' : 'left-1'}`} />
    </button>
  </div>
);

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [settings, setSettings] = useState({
    gymName: 'Boss Gym',
    contactEmail: 'admin@bossgym.com',
    phoneNumber: '+91 98765 43210',
    address: '123 Elite Street, Fitness City',
    latitude: 11.9111586,
    longitude: 79.6347447,
    radius: 150,
    notifyExpiry: true,
    notifyAttendance: true,
    browserNotifications: true,
    whatsappWelcome: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'config');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setSettings(prev => ({ ...prev, ...docSnap.data() }));
      } else {
        // Initialize settings if they don't exist
        await setDoc(docRef, settings);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      showFeedback('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const docRef = doc(db, 'settings', 'config');
      
      // Ensure numeric fields are saved as numbers
      const dataToSave = {
        ...settings,
        latitude: parseFloat(settings.latitude) || 0,
        longitude: parseFloat(settings.longitude) || 0,
        radius: parseInt(settings.radius) || 150
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

  const showFeedback = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-[#555] text-xs font-bold uppercase tracking-widest">Loading configuration...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Settings</h1>
          <p className="text-muted text-sm mt-1 uppercase tracking-widest font-bold">Configure your gym management system</p>
        </div>
        {message.text && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300 ${
            message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span className="text-[10px] font-bold uppercase tracking-widest">{message.text}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Tabs Sidebar */}
        <aside className="md:w-64 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-200 group ${
                  activeTab === tab.id 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-[#555] hover:text-white hover:bg-[#111]'
                }`}
              >
                <Icon size={18} className={activeTab === tab.id ? 'text-primary' : 'group-hover:text-white'} />
                <span className="text-xs font-bold uppercase tracking-widest">{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Main Settings Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <SettingSection 
                title="Gym Information" 
                description="Global settings for your facility"
              >
                <InputGroup 
                  label="Gym Name" 
                  description="Display name for your business"
                  value={settings.gymName}
                  onChange={(val) => updateSetting('gymName', val)}
                />
                <InputGroup 
                  label="Contact Email" 
                  description="Primary administrative contact"
                  value={settings.contactEmail}
                  onChange={(val) => updateSetting('contactEmail', val)}
                />
                <InputGroup 
                  label="Phone Number" 
                  description="Official business contact"
                  value={settings.phoneNumber}
                  onChange={(val) => updateSetting('phoneNumber', val)}
                />
                <InputGroup 
                  label="Address" 
                  description="Physical location of the gym"
                  value={settings.address}
                  onChange={(val) => updateSetting('address', val)}
                />
              </SettingSection>

              <SettingSection 
                title="Location Settings" 
                description="Configure gym geolocation for check-ins"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white uppercase tracking-widest block">Latitude</label>
                    <input 
                      type="text"
                      placeholder="e.g. 11.911158"
                      value={settings.latitude}
                      onChange={(e) => updateSetting('latitude', e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#1a1a1a] text-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                    <p className="text-[9px] text-[#444] font-bold uppercase tracking-widest">GPS latitude coordinate</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white uppercase tracking-widest block">Longitude</label>
                    <input 
                      type="text"
                      placeholder="e.g. 79.634744"
                      value={settings.longitude}
                      onChange={(e) => updateSetting('longitude', e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#1a1a1a] text-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                    <p className="text-[9px] text-[#444] font-bold uppercase tracking-widest">GPS longitude coordinate</p>
                  </div>
                </div>
                <div className="pt-4">
                  <InputGroup 
                    label="Check-in Radius" 
                    description="Allowed distance in meters"
                    type="number"
                    placeholder="150"
                    value={settings.radius}
                    onChange={(val) => updateSetting('radius', parseInt(val) || 0)}
                  />
                </div>
              </SettingSection>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-primary text-black font-black px-8 py-3 rounded-sm uppercase text-xs tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <SettingSection 
                title="System Alerts" 
                description="Manage how you receive updates"
              >
                <ToggleGroup 
                  label="Membership Expiry" 
                  description="Notify staff when memberships are near expiry"
                  checked={settings.notifyExpiry}
                  onChange={(val) => updateSetting('notifyExpiry', val)}
                />
                <ToggleGroup 
                  label="Daily Attendance Report" 
                  description="Receive summary of daily check-ins"
                  checked={settings.notifyAttendance}
                  onChange={(val) => updateSetting('notifyAttendance', val)}
                />
                <ToggleGroup 
                  label="Browser Notifications" 
                  description="Show desktop alerts for real-time events"
                  checked={settings.browserNotifications}
                  onChange={(val) => updateSetting('browserNotifications', val)}
                />
              </SettingSection>

              <SettingSection 
                title="WhatsApp Integration" 
                description="Automated messaging settings"
              >
                <ToggleGroup 
                  label="Welcome Message" 
                  description="Send automated welcome message to new members"
                  checked={settings.whatsappWelcome}
                  onChange={(val) => updateSetting('whatsappWelcome', val)}
                />
              </SettingSection>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-primary text-black font-black px-8 py-3 rounded-sm uppercase text-xs tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

