import React from 'react';

export default function Footer({ theme }) {
    return (
        <footer style={{ textAlign: 'center', padding: '1.5rem 0', fontSize: 16, color: theme.footer, letterSpacing: 1 }}>
            Designed and Developed by <span style={{ fontWeight: 700, color: theme.accent }}>WA</span>
            <div style={{ fontSize: 12, marginTop: 8, opacity: 0.6 }}>This is for personal use only.</div>
        </footer>
    );
}
