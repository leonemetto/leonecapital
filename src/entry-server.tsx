import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Suppress useLayoutEffect warning in server environments
if (typeof window === 'undefined') {
  (React as any).useLayoutEffect = React.useEffect;
}

// Import only public pages — no auth, no Supabase
import Landing from './pages/Landing';
import HowToUse from './pages/HowToUse';
import BlogIndex from './pages/BlogIndex';
import BlogPost from './pages/BlogPost';

export function render(url: string): { html: string; helmetContext: Record<string, unknown> } {
  const helmetContext: Record<string, unknown> = {};

  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/how-to-use" element={<HowToUse />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </StaticRouter>
    </HelmetProvider>
  );

  return { html, helmetContext };
}
