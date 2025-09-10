'use client';

import { TogglePlugin } from '@platejs/toggle/react';

import { ToggleElementStatic } from '@/components/ui/report/elements/ToggleNodeStatic';
import { IndentKit } from './indent-kit';

export const BaseToggleKit = [...IndentKit, TogglePlugin.withComponent(ToggleElementStatic)];
