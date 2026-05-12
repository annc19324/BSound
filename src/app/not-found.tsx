import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px' }}>
      <h1 style={{ fontSize: '8rem', color: 'var(--primary)' }}>404</h1>
      <p style={{ fontSize: '1.5rem' }}>Opps! Trang này không tồn tại.</p>
      <Link href="/" style={{ background: 'white', color: 'black', padding: '12px 32px', borderRadius: '30px', fontWeight: '700' }}>
        Quay lại trang chủ
      </Link>
    </div>
  );
}
