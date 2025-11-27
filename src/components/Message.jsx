import React from 'react';
import './AuthShared.css';

/**
 * Message component — consistent accessible messages used across auth pages.
 * Props:
 *  - type: 'error' | 'info' | 'success' (default 'error')
 *  - children: message content
 *  - role: ARIA role (defaults to 'alert')
 */
export default function Message({ type = 'error', children, role = 'alert' }) {
  return (
    <div className={`message ${type}`} role={role} aria-live={type === 'error' ? 'assertive' : 'polite'}>
      {children}
    </div>
  );
}
