'use client';

import React from 'react';
import { PostForm } from '@/src/components/admin/posts/PostForm';

export default function NewPostPage() {
  return <PostForm isEditing={false} />;
}
