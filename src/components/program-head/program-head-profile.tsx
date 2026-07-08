'use client';

import { useState, useEffect } from 'react';
import { PROGRAM_HEAD_PROFILE } from '@/components/program-head/program-head-data';
import {
  ProgramHeadButton,
  ProgramHeadModal,
  ProgramHeadStatCard
} from '@/components/program-head/program-head-primitives';
import { ProgramHeadShell } from '@/components/program-head/program-head-shell';

const DEPT_STATS = [
  { label: 'Faculty Members', value: '12', icon: 'fa-chalkboard-teacher', color: '#003a8f' },
  { label: 'Students', value: '0', icon: 'fa-user-graduate', color: '#7c3aed' },
  { label: 'Active Projects', value: '24', icon: 'fa-project-diagram', color: '#16a34a' },
  { label: 'Research Labs', value: '3', icon: 'fa-flask', color: '#f59e0b' }
];

export function ProgramHeadProfile() {
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  
  // Form states
  const [editName, setEditName] = useState('');
  const [editOffice, setEditOffice] = useState('');
  const [editBio, setEditBio] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setProfileData(data.user);
          setEditName(data.user.name || '');
          setEditOffice(data.user.office || '');
          setEditBio(data.user.accountSummary || '');
        }
      } catch (e) {
        console.error('Failed to fetch profile', e);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          office: editOffice,
          accountSummary: editBio
        })
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.user);
        setEditOpen(false);
        
        // Update local storage so the shell header updates immediately
        if (typeof window !== 'undefined') {
          localStorage.setItem('capstoneAuthUser', JSON.stringify(data.user));
          // Emit a storage event to force other components to sync
          window.dispatchEvent(new Event('storage'));
          // Reload the page to ensure all static shells are updated globally
          window.location.reload();
        }
      } else {
        alert('Failed to update profile');
      }
    } catch (e) {
      alert('An error occurred');
    }
  };

  const displayName = profileData?.name || PROGRAM_HEAD_PROFILE.displayName;
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  if (loading) {
    return <ProgramHeadShell activeNav="profile" title="My Profile"><div className="p-8 text-center text-slate-500">Loading profile...</div></ProgramHeadShell>;
  }

  return (
    <ProgramHeadShell activeNav="profile" title="My Profile" description="Department Chair - Information Technology Department" notificationCount={2}>
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-[#003a8f] via-[#1a1851] to-[#003a8f] relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZWMzRoNnptLTIwIDB2Nmgtdk0zNGg2em0wLTIwdjZoLTZWMTRoNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        </div>
        <div className="px-8 pb-6 -mt-14 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-[#003a8f] to-amber-400 text-white flex items-center justify-center text-4xl font-bold shadow-xl ring-4 ring-white">
              {initials}
            </div>
            <div className="flex-1 pt-2">
              <h2 className="text-2xl font-bold text-slate-800 m-0">{displayName}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-[#003a8f] text-xs font-bold ring-1 ring-[#003a8f]/10">{profileData?.role?.replace('_', ' ') || PROGRAM_HEAD_PROFILE.role}</span>
                <span className="text-sm text-slate-500">{PROGRAM_HEAD_PROFILE.rank}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditOpen(true)} className="h-10 px-5 rounded-xl bg-[#003a8f] text-white text-sm font-bold shadow-md hover:bg-[#002c6b] hover:-translate-y-0.5 transition-all flex items-center gap-2">
                <i className="fas fa-pen text-xs"></i> Edit Profile
              </button>
              <button onClick={() => setPasswordOpen(true)} className="h-10 px-5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-all flex items-center gap-2">
                <i className="fas fa-lock text-xs"></i> Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Personal Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-id-card text-[#003a8f]"></i> Personal Information</h3>
          </div>
          <div className="p-6 space-y-4">
            {[
              ['Full Name', displayName, 'fa-user'],
              ['Email', profileData?.email || PROGRAM_HEAD_PROFILE.email, 'fa-envelope'],
              ['Office', profileData?.office || 'Not provided', 'fa-map-marker-alt'],
              ['Bio', profileData?.accountSummary || 'Not provided', 'fa-address-card'],
              ['Department', profileData?.department || 'IT Department', 'fa-building']
            ].map(([label, value, icon]) => (
              <div key={label as string} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center">
                  <i className={`fas ${icon} text-sm`}></i>
                </div>
                <div>
                  <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</span>
                  <span className="text-sm font-medium text-slate-800 break-words">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Academic & Administrative */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-graduation-cap text-amber-500"></i> Academic & Administrative</h3>
          </div>
          <div className="p-6 space-y-4">
            {[
              ['Position', PROGRAM_HEAD_PROFILE.role, 'fa-briefcase'],
              ['PhD', PROGRAM_HEAD_PROFILE.degree, 'fa-award'],
              ['Masters', PROGRAM_HEAD_PROFILE.masters, 'fa-scroll'],
              ['Specialization', PROGRAM_HEAD_PROFILE.specialization, 'fa-microscope'],
              ['Years in Service', PROGRAM_HEAD_PROFILE.yearsInService, 'fa-calendar-alt'],
              ['Chair Since', PROGRAM_HEAD_PROFILE.chairSince, 'fa-star']
            ].map(([label, value, icon]) => (
              <div key={label as string} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center">
                  <i className={`fas ${icon} text-sm`}></i>
                </div>
                <div>
                  <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</span>
                  <span className="text-sm font-medium text-slate-800">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {DEPT_STATS.map(s => (
          <ProgramHeadStatCard key={s.label} title={s.label} value={s.value} icon={`fas ${s.icon}`} />
        ))}
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-cog text-slate-400"></i> Account Settings</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><i className="fas fa-bell text-[#003a8f] text-xs"></i> Notification Preferences</h4>
              <div className="space-y-3">
                {[
                  { label: 'Department announcements', checked: true },
                  { label: 'Accreditation reminders', checked: true },
                  { label: 'Faculty evaluation alerts', checked: true },
                  { label: 'Weekly summary reports', checked: false }
                ].map(item => (
                  <label key={item.label} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all">
                    <input defaultChecked={item.checked} type="checkbox" className="w-4 h-4 rounded accent-[#003a8f]" />
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><i className="fas fa-file-alt text-amber-500 text-xs"></i> Report Subscriptions</h4>
              <div className="space-y-3">
                {[
                  { label: 'Monthly Department Report', checked: true },
                  { label: 'Accreditation Readiness Report', checked: true }
                ].map(item => (
                  <label key={item.label} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all">
                    <input defaultChecked={item.checked} type="checkbox" className="w-4 h-4 rounded accent-[#003a8f]" />
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-6">
                <button className="h-10 px-5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-all flex items-center gap-2">
                  <i className="fas fa-chart-line text-xs"></i> View My Performance Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <ProgramHeadModal open={editOpen} title="Edit Profile" onClose={() => setEditOpen(false)}>
        <div className="ph-form-field"><label htmlFor="ph-profile-name">Full Name</label><input className="ph-input" value={editName} onChange={(e) => setEditName(e.target.value)} id="ph-profile-name" /></div>
        <div className="ph-form-field"><label htmlFor="ph-profile-office">Office Location</label><input className="ph-input" value={editOffice} onChange={(e) => setEditOffice(e.target.value)} id="ph-profile-office" /></div>
        <div className="ph-form-field"><label htmlFor="ph-profile-bio">Bio / Account Summary</label>
          <textarea className="ph-textarea" value={editBio} onChange={(e) => setEditBio(e.target.value)} id="ph-profile-bio" rows={3} />
        </div>
        <div className="ph-modal-actions">
          <ProgramHeadButton onClick={() => setEditOpen(false)}>Cancel</ProgramHeadButton>
          <ProgramHeadButton variant="primary" onClick={handleUpdateProfile}>Save Changes</ProgramHeadButton>
        </div>
      </ProgramHeadModal>

      {/* Password Modal */}
      <ProgramHeadModal open={passwordOpen} title="Change Password" onClose={() => setPasswordOpen(false)}>
        <div className="ph-form-field"><label htmlFor="ph-profile-current-password">Current Password</label><input className="ph-input" id="ph-profile-current-password" type="password" /></div>
        <div className="ph-form-field"><label htmlFor="ph-profile-new-password">New Password</label><input className="ph-input" id="ph-profile-new-password" type="password" /></div>
        <div className="ph-form-field"><label htmlFor="ph-profile-confirm-password">Confirm Password</label><input className="ph-input" id="ph-profile-confirm-password" type="password" /></div>
        <div className="ph-modal-actions">
          <ProgramHeadButton onClick={() => setPasswordOpen(false)}>Cancel</ProgramHeadButton>
          <ProgramHeadButton variant="primary" onClick={() => setPasswordOpen(false)}>Update</ProgramHeadButton>
        </div>
      </ProgramHeadModal>
    </ProgramHeadShell>
  );
}
