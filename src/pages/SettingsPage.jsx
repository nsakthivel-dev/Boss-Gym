import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Save, 
  Globe,
  Palette,
  Smartphone,
  Mail,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  MapPin
} from 'lucide-react';

const SettingSection = ({ title, description, children }) => (
  <div className="bg-[#111] border border-[#1a1a1a] rounded-sm p-6 md:p-8 mb-6 shadow-2xl relative overflow-hidden group">
    <div className="absolute top-0 left-0 w-1 h-full bg-[#e8c97e]/10 group-hover:bg-[#e8c97e] transition-colors" />
    <div className="mb-6 md:mb-10">
      <h3 className="text-primary font-black text-lg md:text-xl uppercase tracking-tight">{title}</h3>
      <p className="text-[#555] text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] mt-2">{description}</p>
    </div>
    <div className="space-y-6 md:space-y-8">
      {children}
    </div>
  </div>
);

const InputGroup = ({ label, description, type = "text", placeholder, value, onChange }) => (
  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 py-4 md:py-6 border-b border-[#1a1a1a]/50 last:border-0 group/input">
    <div className="flex-1 max-w-md">
      <label className="text-[9px] md:text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] md:tracking-[0.3em] block group-hover/input:text-primary/60 transition-colors mb-1 md:mb-2">{label}</label>
      <p className="text-[9px] md:text-[10px] text-[#444] font-bold uppercase tracking-widest leading-relaxed">{description}</p>
    </div>
    <div className="w-full md:w-72 lg:w-80">
      <input 
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] text-white px-4 md:px-5 py-3 md:py-4 rounded-sm text-[10px] md:text-xs font-bold tracking-widest focus:outline-none focus:border-primary/50 transition-all placeholder:text-[#222]"
      />
    </div>
  </div>
);

const ToggleGroup = ({ label, description, checked, onChange }) => (
  <div className="flex items-start justify-between gap-6 md:gap-8 py-4 md:py-6 border-b border-[#1a1a1a]/50 last:border-0 group/toggle">
    <div className="flex-1">
      <label className="text-[9px] md:text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] md:tracking-[0.3em] block group-hover/toggle:text-primary/60 transition-colors mb-1 md:mb-2">{label}</label>
      <p className="text-[9px] md:text-[10px] text-[#444] font-bold uppercase tracking-widest leading-relaxed">{description}</p>
    </div>
    <button 
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 md:w-14 md:h-7 rounded-sm relative transition-all duration-300 shrink-0 ${checked ? 'bg-primary/20 border border-primary/30' : 'bg-[#0a0a0a] border border-[#1a1a1a]'}`}
    >
      <div className={`absolute top-1 w-4 h-4 md:w-5 md:h-5 rounded-sm transition-all duration-300 shadow-xl ${checked ? 'right-1 bg-primary' : 'left-1 bg-[#222]'}`} />
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
    gymName: 'Boss Gym',
    contactEmail: 'touch@lupusventure.com',
    phoneNumber: '+91 98765 43210',
    address: '123 Elite Street, Fitness City',
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
      
      // Ensure numeric fields are saved as numbers and cleaned
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
      // Re-authenticate
      const credential = EmailAuthProvider.credential(currentUser.email, passwords.current);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update Password
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
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-[#555] text-xs font-bold uppercase tracking-widest">Loading configuration...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#1a1a1a]">
        <div>
          <h1 className="text-4xl font-black text-primary uppercase tracking-tight">Settings</h1>
          <p className="text-[#555] text-xs font-bold mt-2 uppercase tracking-[0.3em]">Configure your gym management system</p>
        </div>
        
        {message.text && (
          <div className={`flex items-center gap-3 px-6 py-3 rounded-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
            message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{message.text}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Tabs Sidebar */}
        <aside className="lg:w-64 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-sm transition-all duration-300 group relative overflow-hidden ${
                  activeTab === tab.id 
                    ? 'bg-[#111] text-primary border border-[#1a1a1a]' 
                    : 'text-[#333] hover:text-primary/60 hover:bg-[#0a0a0a]'
                }`}
              >
                {activeTab === tab.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#e8c97e]" />}
                <Icon size={18} className={activeTab === tab.id ? 'text-primary' : 'group-hover:text-primary/60 transition-colors'} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Main Settings Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <SettingSection 
                title="Branding" 
                description="Customize your gym's identity"
              >
                <InputGroup 
                  label="Gym Name" 
                  description="The public name of your gym as shown to members"
                  value={settings.gymName}
                  onChange={(val) => updateSetting('gymName', val)}
                />
                <InputGroup 
                  label="Contact Email" 
                  description="The email shown on the Contact page for members to reach out"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(val) => updateSetting('contactEmail', val)}
                />
                <InputGroup 
                  label="Phone Number" 
                  description="Primary contact number for inquiries"
                  type="tel"
                  value={settings.phoneNumber}
                  onChange={(val) => updateSetting('phoneNumber', val)}
                />
                <InputGroup 
                  label="Address" 
                  description="Physical location of the gym"
                  value={settings.address}
                  onChange={(val) => updateSetting('address', val)}
                />
                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-3 bg-primary/10 border border-primary/20 text-primary font-black px-6 py-3 rounded-sm uppercase text-[9px] tracking-[0.2em] hover:bg-primary hover:text-black transition-all group"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="group-hover:scale-110 transition-transform" />}
                    Save Branding
                  </button>
                </div>
              </SettingSection>

              <SettingSection 
                title="Account Security" 
                description="Technical settings for account access"
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-b border-[#1a1a1a]/50">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em] block mb-2">Current Password</label>
                      <input 
                        type="password"
                        placeholder="••••••••"
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] text-white px-5 py-4 rounded-sm text-xs font-bold tracking-widest focus:outline-none focus:border-primary/50 transition-all placeholder:text-[#222]"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em] block mb-2">New Password</label>
                      <input 
                        type="password"
                        placeholder="••••••••"
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] text-white px-5 py-4 rounded-sm text-xs font-bold tracking-widest focus:outline-none focus:border-primary/50 transition-all placeholder:text-[#222]"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex-1 max-w-xs space-y-3">
                      <label className="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em] block mb-2">Confirm New Password</label>
                      <input 
                        type="password"
                        placeholder="••••••••"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] text-white px-5 py-4 rounded-sm text-xs font-bold tracking-widest focus:outline-none focus:border-primary/50 transition-all placeholder:text-[#222]"
                      />
                    </div>
                    <button 
                      onClick={handleResetPassword}
                      disabled={resetting || !passwords.current || !passwords.new}
                      className="bg-[#111] border border-[#1a1a1a] text-primary px-10 py-5 rounded-sm uppercase text-[10px] font-black tracking-[0.3em] hover:bg-white hover:text-black transition-all shadow-2xl disabled:opacity-50 flex items-center gap-3"
                    >
                      {resetting ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                      Update Password
                    </button>
                  </div>
                  <p className="text-[9px] text-[#444] font-bold uppercase tracking-widest">Used for technical and administrative access</p>
                </div>
              </SettingSection>

              <SettingSection 
                title="Location Settings" 
                description="Configure gym geolocation for check-ins"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-b border-[#1a1a1a]/50">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em] block mb-2">Latitude</label>
                    <div className="relative group">
                      <input 
                        type="text"
                        placeholder="e.g. 11.911158"
                        value={settings.latitude}
                        onChange={(e) => updateSetting('latitude', e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] text-white px-5 py-4 rounded-sm text-xs font-bold tracking-widest focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                    <p className="text-[9px] text-[#444] font-bold uppercase tracking-widest">GPS latitude coordinate</p>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em] block mb-2">Longitude</label>
                    <div className="relative group">
                      <input 
                        type="text"
                        placeholder="e.g. 79.634744"
                        value={settings.longitude}
                        onChange={(e) => updateSetting('longitude', e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] text-white px-5 py-4 rounded-sm text-xs font-bold tracking-widest focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                    <p className="text-[9px] text-[#444] font-bold uppercase tracking-widest">GPS longitude coordinate</p>
                  </div>
                </div>

                <div className="flex justify-start py-4">
                  <button 
                    onClick={() => {
                      if (navigator.geolocation) {
                        setSaving(true);
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            updateSetting('latitude', pos.coords.latitude.toFixed(6));
                            updateSetting('longitude', pos.coords.longitude.toFixed(6));
                            setSaving(false);
                            showFeedback('success', 'Location updated to current position');
                          },
                          (err) => {
                            console.error(err);
                            setSaving(false);
                            showFeedback('error', 'Failed to get current location');
                          }
                        );
                      }
                    }}
                    className="flex items-center gap-3 text-primary text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                  >
                    <MapPin size={14} />
                    Use Current Location
                  </button>
                </div>

                <div className="pt-4">
                  <InputGroup 
                    label="Check-in URL" 
                    description="The URL used for the QR code"
                    value={`https://newbossgym.in.net/checkin`}
                    onChange={() => {}} // Read-only
                  />
                  <InputGroup 
                    label="Check-in Radius" 
                    description="Maximum allowed distance in meters for valid check-ins"
                    type="number"
                    placeholder="500"
                    value={settings.radius}
                    onChange={(val) => updateSetting('radius', parseInt(val) || 0)}
                  />
                </div>
                <div className="flex justify-end pt-8">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-3 bg-primary/10 border border-primary/20 text-primary font-black px-6 py-3 rounded-sm uppercase text-[9px] tracking-[0.2em] hover:bg-primary hover:text-black transition-all group"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="group-hover:scale-110 transition-transform" />}
                    Save Location
                  </button>
                </div>
              </SettingSection>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
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
                <div className="flex justify-end pt-6">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-3 bg-primary/10 border border-primary/20 text-primary font-black px-6 py-3 rounded-sm uppercase text-[9px] tracking-[0.2em] hover:bg-primary hover:text-black transition-all group"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="group-hover:scale-110 transition-transform" />}
                    Save Alerts
                  </button>
                </div>
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
                <div className="flex justify-end pt-6">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-3 bg-primary/10 border border-primary/20 text-primary font-black px-6 py-3 rounded-sm uppercase text-[9px] tracking-[0.2em] hover:bg-primary hover:text-black transition-all group"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="group-hover:scale-110 transition-transform" />}
                    Save WhatsApp
                  </button>
                </div>
              </SettingSection>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <SettingSection 
                title="Theme & Styling" 
                description="Customize the dashboard look"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                  <button 
                    onClick={() => updateSetting('theme', 'gold')}
                    className={`p-8 border rounded-sm text-left transition-all relative group/theme ${settings.theme === 'gold' ? 'border-[#e8c97e] bg-[#e8c97e]/5' : 'border-[#1a1a1a] hover:border-[#333]'}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-[#e8c97e] rounded-sm shadow-xl" />
                      {settings.theme === 'gold' && <div className="w-2 h-2 bg-[#e8c97e] rounded-full" />}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${settings.theme === 'gold' ? 'text-white' : 'text-[#333] group-hover/theme:text-[#e8c97e]/60'}`}>Elite Gold (Default)</span>
                  </button>
                  <button 
                    onClick={() => updateSetting('theme', 'blue')}
                    className={`p-8 border rounded-sm text-left transition-all relative group/theme ${settings.theme === 'blue' ? 'border-blue-500 bg-blue-500/5' : 'border-[#1a1a1a] hover:border-[#333]'}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-sm shadow-xl" />
                      {settings.theme === 'blue' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${settings.theme === 'blue' ? 'text-white' : 'text-[#333] group-hover/theme:text-blue-500/60'}`}>Iron Blue</span>
                  </button>
                </div>
                <div className="flex justify-end pt-6">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-3 bg-primary/10 border border-primary/20 text-primary font-black px-6 py-3 rounded-sm uppercase text-[9px] tracking-[0.2em] hover:bg-primary hover:text-black transition-all group"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="group-hover:scale-110 transition-transform" />}
                    Save Theme
                  </button>
                </div>
              </SettingSection>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

