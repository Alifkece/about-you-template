export default function SiteNotFound() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        background: 'hsl(230, 25%, 5%)',
        color: 'hsl(0, 0%, 98%)',
        fontFamily: "'Inter', sans-serif",
        textAlign: 'center',
        padding: '0 24px',
      }}
    >
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', marginBottom: 12 }}>
        This website doesn&apos;t exist
      </h1>
      <p style={{ color: 'hsl(0, 0%, 75%)', marginBottom: 24 }}>
        The link you followed may be broken, or the site may have been renamed.
      </p>
      <a href="/" style={{ color: 'hsl(280, 60%, 65%)' }}>
        ← Back to home
      </a>
    </main>
  );
}
