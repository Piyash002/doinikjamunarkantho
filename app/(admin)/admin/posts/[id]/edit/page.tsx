'use client';

import React from 'react';
import useSWR from 'swr';
import { useParams } from 'next/navigation';
import { PostForm } from '@/src/components/admin/posts/PostForm';
import { Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EditPostPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data, isLoading, error } = useSWR(
    id ? `/api/admin/posts/${id}` : null,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b7d95]" />
        <span className="text-sm font-semibold text-slate-500">Loading article...</span>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="p-8 text-center text-rose-500 font-semibold">
        {data?.error || 'Failed to load article details.'}
      </div>
    );
  }

  return <PostForm initialData={data.data} isEditing={true} />;
}
