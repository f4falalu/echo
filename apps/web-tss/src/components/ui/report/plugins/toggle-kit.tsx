'use client';

import { TogglePlugin } from '@platejs/toggle/react';
import { ToggleElement } from '../elements/ToggleNode';
import { IndentKit } from './indent-kit';

export const ToggleKit = [...IndentKit, TogglePlugin.withComponent(ToggleElement)];
