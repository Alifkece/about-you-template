export default function Home() {
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
      <p
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 12,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'hsl(0, 0%, 50%)',
          marginBottom: 12,
        }}
      >
        About You — Website Builder
      </p>
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
          maxWidth: 640,
          marginBottom: 16,
        }}
      >
        Turn your photos and a song into a cinematic website, in minutes.
      </h1>
      <p style={{ color: 'hsl(0, 0%, 75%)', maxWidth: 480, marginBottom: 32 }}>
        Upload a cover, ten photos, and a name — get back a shareable link to your own interactive experience.
      </p>
      <a
        href="/dashboard"
        style={{
          background: 'hsl(28, 85%, 62%)',
          color: '#08070c',
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          padding: '14px 32px',
          borderRadius: 8,
          textDecoration: 'none',
        }}
      >
        Build your website
      </a>
      <a
        href="/demo"
        style={{
          marginTop: 28,
          fontSize: 13,
          color: 'hsl(0, 0%, 50%)',
        }}
      >
        View the demo experience →
      </a>
    </main>
  );
}
