import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { blogPosts } from '@/data/blogPosts';
import logoImg from '@/assets/logo.svg';

const CATEGORY_COLORS: Record<string, string> = {
  Fundamentals: '#3b82f6',
  Forex: '#10b981',
  'Prop Firms': '#f59e0b',
  Analytics: '#8b5cf6',
  Psychology: '#ef4444',
};

export default function BlogIndex() {
  const sorted = [...blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <div style={{ minHeight: '100vh', background: '#080807', color: '#f2f0ea', fontFamily: "'Geist', system-ui, sans-serif" }}>
      <Helmet>
        <title>Trading Journal Blog — Tips, Guides & Analytics | EdgeFlow</title>
        <meta name="description" content="Guides on trading journaling, performance analysis, leak detection, and behavioral patterns. Written for serious traders who want data-backed improvement." />
        <link rel="canonical" href="https://www.edgeflow.capital/blog" />
      </Helmet>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(8,8,7,0.92)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={logoImg} alt="EdgeFlow" style={{ height: 28, width: 28, borderRadius: 8 }} />
          <Link to="/" style={{ color: '#f2f0ea', fontSize: 15, fontWeight: 600, textDecoration: 'none', letterSpacing: '-0.02em' }}>EdgeFlow</Link>
          <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 4px' }}>/</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Blog</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/how-to-use" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none' }}>Docs</Link>
          <Link
            to="/auth"
            style={{ background: '#f2f0ea', color: '#080807', borderRadius: 24, padding: '7px 18px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
          >
            Start Pro trial
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 32px 40px' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 16 }}>Trading Journal Blog</p>
        <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1.15 }}>
          Guides for traders who want to improve with data
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, maxWidth: 580, margin: 0 }}>
          Performance analytics, leak detection, behavioral patterns, and journaling strategy — written for serious traders, not beginners.
        </p>
      </div>

      {/* Posts */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sorted.map((post) => {
            const catColor = CATEGORY_COLORS[post.category] || '#888';
            const date = new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            return (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                style={{ display: 'block', textDecoration: 'none', color: 'inherit', padding: '28px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', opacity: 1, transition: 'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: catColor, background: `${catColor}18`, padding: '3px 10px', borderRadius: 20 }}>
                    {post.category}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{date}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>·</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{post.readingTime} min read</span>
                </div>
                <h2 style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 10px', lineHeight: 1.3, color: '#f2f0ea' }}>
                  {post.title}
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
                  {post.excerpt}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '48px 32px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
          Ready to apply this to your own trading data?
        </p>
        <Link
          to="/auth"
          style={{ background: '#f2f0ea', color: '#080807', borderRadius: 24, padding: '12px 32px', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'inline-block', letterSpacing: '-0.01em' }}
        >
          Start your Pro trial
        </Link>
      </div>
    </div>
  );
}
