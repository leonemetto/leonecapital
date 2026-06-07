import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getBlogPost, getRelatedPosts, type BlogSection } from '@/data/blogPosts';
import logoImg from '@/assets/logo.svg';

function renderSection(section: BlogSection, i: number) {
  switch (section.type) {
    case 'h2':
      return (
        <h2 key={i} style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', margin: '48px 0 16px', color: '#f2f0ea', lineHeight: 1.25 }}>
          {section.text}
        </h2>
      );
    case 'h3':
      return (
        <h3 key={i} style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', margin: '32px 0 10px', color: '#e8e5dd' }}>
          {section.text}
        </h3>
      );
    case 'p':
      return (
        <p key={i} style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(242,240,234,0.75)', margin: '0 0 20px' }}>
          {section.text}
        </p>
      );
    case 'ul':
      return (
        <ul key={i} style={{ margin: '0 0 20px', paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {section.items?.map((item, j) => (
            <li key={j} style={{ fontSize: 15, lineHeight: 1.65, color: 'rgba(242,240,234,0.75)' }}>
              {item}
            </li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol key={i} style={{ margin: '0 0 20px', paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {section.items?.map((item, j) => (
            <li key={j} style={{ fontSize: 15, lineHeight: 1.65, color: 'rgba(242,240,234,0.75)' }}>
              {item}
            </li>
          ))}
        </ol>
      );
    case 'callout':
      return (
        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: '3px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '18px 20px', margin: '32px 0' }}>
          {section.label && (
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '0 0 8px' }}>
              {section.label}
            </p>
          )}
          <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(242,240,234,0.7)', margin: 0, fontStyle: 'italic' }}>
            {section.text}
          </p>
        </div>
      );
    case 'cta':
      return (
        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '24px', margin: '40px 0', textAlign: 'center' }}>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(242,240,234,0.65)', margin: '0 0 20px' }}>
            {section.text}
          </p>
          <a
            href="/auth"
            style={{ display: 'inline-block', background: '#f2f0ea', color: '#080807', borderRadius: 24, padding: '10px 28px', fontSize: 13, fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.01em' }}
          >
            Start 14-day Pro trial
          </a>
        </div>
      );
    default:
      return null;
  }
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;
  const related = post ? getRelatedPosts(post) : [];

  if (!post) {
    return (
      <div style={{ minHeight: '100vh', background: '#080807', color: '#f2f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Helmet><title>Post Not Found — EdgeFlow Blog</title></Helmet>
        <p style={{ fontSize: 18, fontWeight: 600 }}>Post not found</p>
        <Link to="/blog" style={{ background: '#f2f0ea', color: '#080807', borderRadius: 24, padding: '10px 24px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
          Back to blog
        </Link>
      </div>
    );
  }

  const date = new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: '#080807', color: '#f2f0ea', fontFamily: "'Geist', system-ui, sans-serif" }}>
      <Helmet>
        <title>{post.metaTitle}</title>
        <meta name="description" content={post.metaDescription} />
        <link rel="canonical" href={`https://www.edgeflow.capital/blog/${post.slug}`} />
        <meta property="og:title" content={post.metaTitle} />
        <meta property="og:description" content={post.metaDescription} />
        <meta property="og:url" content={`https://www.edgeflow.capital/blog/${post.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.publishedAt} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.metaDescription,
          datePublished: post.publishedAt,
          author: { '@type': 'Organization', name: 'EdgeFlow', url: 'https://www.edgeflow.capital' },
          publisher: { '@type': 'Organization', name: 'EdgeFlow', url: 'https://www.edgeflow.capital' },
          url: `https://www.edgeflow.capital/blog/${post.slug}`,
        })}</script>
      </Helmet>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(8,8,7,0.92)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={logoImg} alt="EdgeFlow" style={{ height: 28, width: 28, borderRadius: 8 }} />
          <Link to="/" style={{ color: '#f2f0ea', fontSize: 15, fontWeight: 600, textDecoration: 'none', letterSpacing: '-0.02em' }}>EdgeFlow</Link>
          <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 4px' }}>/</span>
          <Link to="/blog" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textDecoration: 'none' }}>Blog</Link>
        </div>
        <Link
          to="/auth"
          style={{ background: '#f2f0ea', color: '#080807', borderRadius: 24, padding: '7px 18px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
        >
          Start Pro trial
        </Link>
      </nav>

      {/* Article */}
      <article style={{ maxWidth: 680, margin: '0 auto', padding: '56px 32px 80px' }}>
        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>{post.category}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{date}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{post.readingTime} min read</span>
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 20px', lineHeight: 1.2, color: '#f2f0ea' }}>
          {post.title}
        </h1>

        <p style={{ fontSize: 17, lineHeight: 1.6, color: 'rgba(242,240,234,0.55)', margin: '0 0 48px', fontStyle: 'italic' }}>
          {post.excerpt}
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '0 0 40px' }} />

        {/* Content */}
        {post.content.map((section, i) => renderSection(section, i))}
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 32px 80px' }}>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '0 0 40px' }} />
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>Related articles</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {related.map(r => (
              <Link
                key={r.slug}
                to={`/blog/${r.slug}`}
                style={{ display: 'block', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '18px 20px', textDecoration: 'none', color: '#f2f0ea' }}
              >
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '0 0 8px' }}>{r.category}</p>
                <p style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 8px' }}>{r.title}</p>
                <p style={{ fontSize: 13, color: 'rgba(242,240,234,0.45)', margin: 0, lineHeight: 1.5 }}>{r.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '48px 32px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
        <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>
          Apply this to your own trading data
        </p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 24, maxWidth: 460, margin: '0 auto 24px' }}>
          EdgeFlow automates the analytics covered in this guide. Log trades, detect leaks, and get AI-powered insights into your specific patterns.
        </p>
        <Link
          to="/auth"
          style={{ background: '#f2f0ea', color: '#080807', borderRadius: 24, padding: '12px 32px', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'inline-block', letterSpacing: '-0.01em' }}
        >
          Start 14-day Pro trial
        </Link>
      </div>
    </div>
  );
}
