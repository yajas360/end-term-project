import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMedication } from '../context/MedicationContext';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  ClockIcon,
  DocumentChartBarIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ShieldExclamationIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { to: '/medications', icon: ClipboardDocumentListIcon, label: 'Medications' },
  { to: '/interactions', icon: ShieldExclamationIcon, label: 'Interactions' },
  { to: '/tracker', icon: ClockIcon, label: 'Daily Tracker' },
  { to: '/prn', icon: BeakerIcon, label: 'PRN Log' },
  { to: '/reports', icon: DocumentChartBarIcon, label: 'Doctor Report' },
  { to: '/profile', icon: UserCircleIcon, label: 'My Profile' },
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth();
  const { notifications, severeInteractions, lowStockMeds } = useMedication();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch {
      toast.error('Failed to log out');
    }
  };

  const unreadNotifs = notifications.length;
  const hasSevere = severeInteractions.length > 0;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-90 bg-black/50 backdrop-blur-sm"
          style={{ zIndex: 99 }}
          onClick={onMobileClose}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--glass-border)' }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M10.5 3H13.5V10.5H21V13.5H13.5V21H10.5V13.5H3V10.5H10.5V3Z"/>
              </svg>
            </div>
            <div>
              <div className="text-display font-bold text-white" style={{ fontSize: '1rem', lineHeight: 1.2 }}>
                MedTrack<span className="gradient-text"> AI</span>
              </div>
              <div className="text-xs text-muted">Medication Safety</div>
            </div>
            {/* Mobile close button */}
            <button className="btn btn-ghost btn-icon ml-auto" onClick={onMobileClose} style={{ display: 'none' }}>
              <XMarkIcon style={{ width: 18, height: 18 }} />
            </button>
          </div>

          {/* User badge */}
          {user && (
            <div className="flex items-center gap-2 mt-4" style={{
              background: 'var(--glass-shine)', borderRadius: 'var(--radius-md)', padding: '8px 10px'
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-900))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0
              }}>
                {(user.displayName || user.email)?.[0]?.toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div className="text-sm font-semibold text-white" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.displayName || 'User'}
                </div>
                <div className="text-xs text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alert banners */}
        {hasSevere && (
          <div style={{
            margin: '12px 8px 0',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <ShieldExclamationIcon style={{ width: 16, height: 16, color: 'var(--danger-400)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--danger-400)', fontWeight: 600 }}>
              {severeInteractions.length} severe interaction{severeInteractions.length > 1 ? 's' : ''} detected
            </span>
          </div>
        )}
        {lowStockMeds.length > 0 && (
          <div style={{
            margin: hasSevere ? '6px 8px 0' : '12px 8px 0',
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <BeakerIcon style={{ width: 16, height: 16, color: 'var(--warning-400)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--warning-400)', fontWeight: 600 }}>
              {lowStockMeds.length} medication{lowStockMeds.length > 1 ? 's' : ''} running low
            </span>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onMobileClose}
            >
              <Icon className="nav-icon" />
              <span style={{ flex: 1 }}>{label}</span>
              {label === 'Interactions' && severeInteractions.length > 0 && (
                <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                  {severeInteractions.length}
                </span>
              )}
              {label === 'Daily Tracker' && unreadNotifs > 0 && (
                <div className="notif-dot" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 8px 20px', borderTop: '1px solid var(--glass-border)' }}>
          <button className="nav-item w-full" style={{ color: 'var(--danger-400)' }} onClick={handleLogout}>
            <ArrowRightOnRectangleIcon className="nav-icon" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
