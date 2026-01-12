export default function LeftToolboxPlaceholder() {
  return (
    <div>
      <p style={{ color: '#cbd5e1', marginBottom: 8 }}>Presets</p>
      <div style={{ display: 'grid', gap: 6 }}>
        <button style={{ padding: 8, borderRadius: 6, background: 'rgba(34,197,94,0.08)', color: '#bbf7d0' }}>Preset A</button>
        <button style={{ padding: 8, borderRadius: 6, background: 'rgba(34,197,94,0.04)', color: '#bbf7d0' }}>Preset B</button>
      </div>
      <hr style={{ margin: '12px 0', borderColor: 'rgba(148,163,184,0.06)' }} />
      <p style={{ color: '#9ca3af' }}>Waveforms • Environments • Cameras</p>
    </div>
  );
}
