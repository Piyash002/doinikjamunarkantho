'use client';

import React, { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
