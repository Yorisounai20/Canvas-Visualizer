export default function TopBarPlaceholder() {
  return (
    <div className="topbar-placeholder" style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 12px',
      background: 'rgba(6,8,17,0.6)',
      borderRadius: 8
    }}>
      <div style={{ color: '#e6edf3', fontWeight: 700 }}>Canvas Visualizer</div>
      <div style={{ color: '#9ca3af' }}>• Transport • Timecode • Export</div>
    </div>
  );
}
