'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/src/components/admin/ui/Button';
import { Input } from '@/src/components/admin/ui/Input';
import { Checkbox } from '@/src/components/admin/ui/Checkbox';
import { useAdminSettings } from '@/src/components/admin/AdminSettingsContext';

interface LoginFormProps {
  initialLogo?: string;
  initialBrandColor?: string;
}

export default function LoginForm({ initialLogo = '', initialBrandColor = '#0a2b3a' }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/admin';
  const { adminLogo, effectiveLogo, adminPrimaryColor, adminTealColor } = useAdminSettings();

  const activeLogoUrl = effectiveLogo?.url || adminLogo?.url || initialLogo;
  const activeBrandColor = adminPrimaryColor || initialBrandColor;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Invalid credentials. Please verify your details.');
        setIsLoading(false);
        return;
      }

      router.replace(redirectUrl);
      router.refresh();
    } catch {
      setError('Unable to reach authentication server. Please check your network connection.');
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Dynamic Logo Section (Prominent, High-Resolution, No Redundant Text) */}
        <div className="flex flex-col items-center justify-center mb-8 w-full">
          {activeLogoUrl ? (
            <div className="w-full max-w-[280px] sm:max-w-[340px] h-20 sm:h-24 flex items-center justify-center px-3 py-1">
              <Image
                src={activeLogoUrl}
                alt="Logo"
                width={340}
                height={96}
                priority
                className="max-h-full max-w-full w-auto h-auto object-contain drop-shadow-sm transition-transform duration-200 hover:scale-105"
                unoptimized
              />
            </div>
          ) : (
            <div
              className="w-16 h-16 rounded-2xl text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-teal-950/20"
              style={{ backgroundColor: activeBrandColor }}
            >
              CMS
            </div>
          )}
        </div>

        {/* Login Card */}
        <div className="w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Sign In to Newsroom
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter your authorized staff credentials to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username or Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-username" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Username or Email
              </label>
              <Input
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="editor or editor@jamunarkantho.com"
                leftIcon={<User className="w-4 h-4" />}
                required
                autoFocus
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <Checkbox
                checked={rememberMe}
                onChange={setRememberMe}
                label={<span className="text-xs text-slate-600 dark:text-slate-400">Keep me signed in for 30 days</span>}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-medium"
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="mt-2"
            >
              Sign In to Dashboard
            </Button>
          </form>
        </div>

        {/* Footer Notice */}
        <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 max-w-xs">
          Confidential administrative system for authorized editorial journalists and staff only.
        </p>
      </div>
    </div>
  );
}
