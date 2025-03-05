'use client';

import React from 'react';
import { ChatLayout } from '@/layouts/ChatLayout';

export default function Layout({ children, ...rest }: { children: React.ReactNode }) {
  return <ChatLayout>{children}</ChatLayout>;
}
