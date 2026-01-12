export default function InspectorPlaceholder() {
  return (
    <div>
      <p style={{ color: '#cbd5e1', marginBottom: 8 }}>Inspector</p>
      <p style={{ color: '#9ca3af' }}>Select an object in the canvas to see editable properties.</p>
      <div style={{ marginTop: 12 }}>
        <label style={{ color: '#cbd5e1', fontSize: 13 }}>Position</label>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <input placeholder="x" style={{ flex: 1, padding: 6, borderRadius: 6 }} />
          <input placeholder="y" style={{ flex: 1, padding: 6, borderRadius: 6 }} />
          <input placeholder="z" style={{ flex: 1, padding: 6, borderRadius: 6 }} />
        </div>
      </div>
    </div>
  );
}
