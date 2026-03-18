import React, { useState } from 'react';

export default function Footer({ theme }) {
    const [termsOpen, setTermsOpen] = useState(false);
    const [privacyOpen, setPrivacyOpen] = useState(false);

    return (
        <footer style={{ 
            textAlign: 'center', padding: '3rem 1.5rem', 
            fontSize: 14, color: theme.footer, 
            background: 'rgba(0,0,0,0.02)',
            borderTop: theme.border,
            marginTop: '4rem'
        }}>
            <div style={{ marginBottom: 16 }}>
                Designed and Developed by <span style={{ fontWeight: 800, color: theme.accent, letterSpacing: 0.5 }}>Wasim Anjum</span>
            </div>
            
            <div style={{ 
                display: 'flex', justifyContent: 'center', gap: 24, 
                marginBottom: 16, fontSize: 13, fontWeight: 600 
            }}>
                <button 
                    onClick={() => setTermsOpen(true)}
                    style={{ background: 'none', border: 'none', color: theme.subtleText, cursor: 'pointer', outline: 'none' }}
                >
                    Terms of Use
                </button>
                <div style={{ opacity: 0.3 }}>|</div>
                <button 
                    onClick={() => setPrivacyOpen(true)}
                    style={{ background: 'none', border: 'none', color: theme.subtleText, cursor: 'pointer', outline: 'none' }}
                >
                    Privacy Policy
                </button>
            </div>
            
            <div style={{ fontSize: 11, opacity: 0.5, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
                Version 1.0 (Beta) | March 2026<br/>
                This Financial Calculator suite is exclusively intended for a Closed User Group for strictly personal, non-commercial use.
            </div>

            {/* Modals for Policies */}
            <PolicyModal 
                isOpen={termsOpen} 
                onClose={() => setTermsOpen(false)} 
                theme={theme}
                title="⚖️ Terms of Use"
            >
                <div style={{ lineHeight: 1.7, textAlign: 'left', fontSize: 14 }}>
                    <p style={{ fontWeight: 600, color: theme.text, marginBottom: 24 }}>Version 1.0 (Beta) | March 2026</p>
                    
                    <h3 style={{ fontSize: 16, color: theme.accent, marginTop: 24, marginBottom: 8 }}>1. Ownership & Personal Use</h3>
                    <p style={{ marginBottom: 16 }}>This Financial Calculator suite is designed and developed by Wasim Anjum. It is exclusively intended for a Closed User Group for strictly personal, non-commercial use. Redistribution or unauthorized access is prohibited.</p>

                    <h3 style={{ fontSize: 16, color: theme.accent, marginTop: 24, marginBottom: 8 }}>2. Testing Phase & Accuracy Disclaimer</h3>
                    <p style={{ marginBottom: 16 }}>Please note that this application is currently in a Testing Phase.</p>
                    <p style={{ marginBottom: 8 }}><strong>Verify Your Numbers:</strong> While the logic is robust, calculations are for informational purposes only. Do not base major financial decisions solely on these results without cross-verifying with a certified professional or official institution.</p>
                    <p style={{ marginBottom: 16 }}><strong>No Liability:</strong> Wasim Anjum is not responsible for any financial discrepancies, losses, or errors resulting from the use of this tool.</p>

                    <h3 style={{ fontSize: 16, color: theme.accent, marginTop: 24, marginBottom: 8 }}>3. Bug Reporting</h3>
                    <p style={{ marginBottom: 16 }}>As a member of the testing group, your feedback is vital. If you encounter a calculation error, a UI glitch on your mobile device, or a "math mystery," please report it directly to Wasim Anjum immediately.</p>
                </div>
            </PolicyModal>

            <PolicyModal 
                isOpen={privacyOpen} 
                onClose={() => setPrivacyOpen(false)} 
                theme={theme}
                title="🔒 Privacy Policy"
            >
                <div style={{ lineHeight: 1.7, textAlign: 'left', fontSize: 14 }}>
                    <p style={{ fontWeight: 600, color: theme.text, marginBottom: 24, fontStyle: 'italic' }}>"Your Data, Your Device."</p>
                    
                    <h3 style={{ fontSize: 16, color: theme.accent, marginTop: 24, marginBottom: 8 }}>1. Zero-Server Footprint</h3>
                    <p style={{ marginBottom: 16 }}>We believe your financial data is your business. This application does not store your input, results, or personal details on any external server.</p>

                    <h3 style={{ fontSize: 16, color: theme.accent, marginTop: 24, marginBottom: 8 }}>2. Local Storage Only</h3>
                    <p style={{ marginBottom: 16 }}>All data persistence (such as saved calculation history or preferences) stays entirely within your browser's Local Storage. This means:</p>
                    <ul style={{ paddingLeft: 20, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <li>No one can see your calculations but you.</li>
                        <li>Clearing your browser cache will remove your saved data.</li>
                        <li>We do not have "accounts" because we don't want your data.</li>
                    </ul>

                    <h3 style={{ fontSize: 16, color: theme.accent, marginTop: 24, marginBottom: 8 }}>3. No Tracking or Analytics</h3>
                    <p style={{ marginBottom: 16 }}>We do not use Google Analytics, cookies, or any third-party tracking scripts. Your usage patterns are your own.</p>

                    <h3 style={{ fontSize: 16, color: theme.accent, marginTop: 24, marginBottom: 8 }}>4. Future API Integrations</h3>
                    <p style={{ marginBottom: 16 }}>As we expand, we may integrate third-party APIs (e.g., for real-time tax rates or inflation data). These will be used strictly for functional calculations and will never be used to capture or transmit your private financial data to third parties.</p>
                </div>
            </PolicyModal>
        </footer>
    );
}

// Reusable Modal Component for displaying text blocks
function PolicyModal({ isOpen, onClose, theme, title, children }) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)', zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            
            <div style={{
                background: theme.card,
                width: '100%', maxWidth: 640,
                maxHeight: '85vh',
                borderRadius: 24,
                boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
                display: 'flex', flexDirection: 'column',
                border: theme.border,
            }} onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 24px', borderBottom: `1px solid ${theme.border.split(' ').slice(2).join(' ')}`,
                    background: theme.glass, borderTopLeftRadius: 24, borderTopRightRadius: 24
                }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: theme.text, margin: 0 }}>{title}</h2>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'rgba(128,128,128,0.1)', border: 'none',
                            color: theme.text, borderRadius: '50%', width: 32, height: 32,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: 16
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Scrollable Content */}
                <div style={{ overflowY: 'auto', padding: '24px', color: theme.subtleText }}>
                    {children}
                </div>

            </div>
    </div>
  );
} // Ensure valid closure if messed up, but replace is safe