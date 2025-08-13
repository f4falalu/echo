import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { z } from 'zod';
import type { LayoutSize } from '../components/ui/layouts/AppLayout';
import { createAutoSaveId } from '../components/ui/layouts/AppSplitter/create-auto-save-id';

export const getAppLayout = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      // The id must not be prefixed with "app-splitter"
      id: z
        .string()
        .min(1, 'id is required')
        .refine((val) => !val.startsWith('app-splitter'), {
          message: 'id cannot be prefixed with "app-splitter"',
        }),
      preservedSide: z.enum(['left', 'right']).optional(),
    })
  )
  .handler<LayoutSize | null>(async ({ data: { id, preservedSide } }) => {
    const cookieName = createAutoSaveId(id);
    const cookieValue = getCookie(cookieName);

    if (!cookieValue) {
      return null;
    }

    try {
      const { value } = JSON.parse(cookieValue) as { value: number };
      const isLeft = preservedSide !== 'right';
      const layout: LayoutSize = isLeft ? [`${value}px`, 'auto'] : ['auto', `${value}px`];

      return layout;
    } catch (error) {
      console.error('Error parsing cookie value', error);
      return null;
    }
  });
