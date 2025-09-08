import { z } from 'zod';

const DocTypeSchema = z.enum(['analyst', 'normal']);

export type DocType = z.infer<typeof DocTypeSchema>;
