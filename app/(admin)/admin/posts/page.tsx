import React, { Suspense } from 'react';
import PostsManager from './PostsManager';

export const dynamic = 'force-dynamic';

export default function PostsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">Loading articles...</div>}>
      <PostsManager />
    </Suspense>
  );
}
