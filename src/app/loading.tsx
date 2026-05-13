export default function Loading() {
  return (
    <div className="page-skeleton">
      {/* Hero skeleton */}
      <div className="skel-hero">
        <div className="skel-box" style={{ height: '36px', width: '200px', borderRadius: '10px' }} />
        <div className="skel-box" style={{ height: '18px', width: '120px', borderRadius: '8px', marginTop: '8px' }} />
      </div>
      {/* Song cards skeleton */}
      <div className="skel-grid">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="skel-card">
            <div className="skel-box skel-thumb" />
            <div className="skel-box" style={{ height: '13px', width: '80%', borderRadius: '6px', marginTop: '8px' }} />
            <div className="skel-box" style={{ height: '11px', width: '55%', borderRadius: '6px', marginTop: '6px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
