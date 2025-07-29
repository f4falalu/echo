import { z } from 'zod';

const AttributesSchema = z.object({
  attributes: z
    .object({
      align: z.enum(['left', 'center', 'right']).optional(),
    })
    .optional(),
});

export const TextSchema = z.object({
  text: z.string(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  highlight: z.boolean().optional(),
});

export const SimpleTextSchema = z.object({
  text: z.string(),
});

// Zod schema for a Heading element in the report editor
// This matches the THeadingElement type from plate-types.d.ts
export const HeaderElementSchema = z
  .object({
    type: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
    level: z.number().int().min(1).max(6).optional(),
    // children is required for platejs elements; each child is a text node or another element
    children: z.array(TextSchema),
  })
  .merge(AttributesSchema);

export const ParagraphElement = z
  .object({
    // Only allow the value 'p' for the type field using z.literal
    type: z.literal('p'),
    children: z.array(TextSchema),
  })
  .merge(AttributesSchema);

export const BlockquoteElement = z
  .object({
    type: z.literal('blockquote'),
    children: z.array(TextSchema),
  })
  .merge(AttributesSchema);

const CodeLineElement = z.object({
  type: z.literal('code_line'),
  children: z.array(SimpleTextSchema),
});

export const CodeBlockElement = z.object({
  type: z.literal('code_block'),
  lang: z
    .enum(['sql', 'yaml', 'javascript', 'typescript', 'python', 'bash', 'json'])
    .default('sql'),
  children: z.array(CodeLineElement),
});

export const CalloutElement = z
  .object({
    type: z.literal('callout'),
    // Add an optional variant field to the CalloutElement schema
    variant: z.enum(['info', 'warning', 'error', 'success', 'tip', 'note']).optional(),
    icon: z
      .string()
      .regex(/^[\u{1F600}-\u{1F64F}]$/u, 'Invalid emoji')
      .optional(),
    backgroundColor: z.string().optional(),
    children: z.array(SimpleTextSchema),
  })
  .merge(AttributesSchema);

export const ColumnElement = z.object({
  type: z.literal('column'),
  width: z.union([z.string(), z.number()]).optional(),
  children: z.array(TextSchema),
});

export const ColumnGroupElement = z.object({
  type: z.literal('column_group'),
  children: z.array(ColumnElement),
});

export const HRElement = z.object({
  type: z.literal('hr'),
  children: z.array(TextSchema).default([]),
});

const TableCellTypeEnum = z.enum(['td', 'th']);
const ListTypeEnum = z.enum(['ul', 'ol']);

// Update the schemas to use the Zod enums
export const TableCellElement = z.object({
  type: TableCellTypeEnum,
  colSpan: z.number().optional(),
  rowSpan: z.number().optional(),
  children: z.array(z.union([TextSchema, ParagraphElement])).default([]),
});

export const TableRowElement = z
  .object({
    type: z.literal('tr'),
    children: z.array(z.union([TextSchema, ParagraphElement, TableCellElement])).default([]),
  })
  .merge(AttributesSchema);

export const TableElement = z
  .object({
    type: z.literal('table'),
    children: z.array(TableRowElement, TableCellElement).default([]),
  })
  .merge(AttributesSchema);

export const EmojiElement = z.object({
  type: z.literal('emoji'),
  emoji: z.string().optional(),
  code: z.string().optional(),
  children: z.array(TextSchema).default([]),
});

export const ListElement = z
  .object({
    type: ListTypeEnum,
    start: z.number().optional(),
    children: z.array(
      z.object({
        type: z.literal('li'),
        children: z.array(TextSchema).default([]),
      })
    ),
  })
  .merge(AttributesSchema);

export const ListItemElement = z.object({
  type: z.literal('li'),
  checked: z.boolean().optional(),
  children: z.array(TextSchema).default([]),
});

export const ImageElement = z
  .object({
    type: z.literal('image'),
    src: z.string(),
    alt: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    children: z.array(TextSchema).default([]),
  })
  .merge(AttributesSchema);

export const ReportElementSchema = z.discriminatedUnion('type', [
  HeaderElementSchema,
  ParagraphElement,
  BlockquoteElement,
  CodeBlockElement,
  CalloutElement,
  ColumnElement,
  ColumnGroupElement,
  HRElement,
  TableElement,
  TableRowElement,
  TableCellElement,
  EmojiElement,
  ListElement,
  ListItemElement,
  ImageElement,
]);

export const ReportElements = ReportElementSchema.array();

export type ReportElement = z.infer<typeof ReportElementSchema>;
export type ReportElements = z.infer<typeof ReportElements>;
export type TextElement = z.infer<typeof TextSchema>;
export type HeaderElement = z.infer<typeof HeaderElementSchema>;
export type ParagraphElement = z.infer<typeof ParagraphElement>;
export type BlockquoteElement = z.infer<typeof BlockquoteElement>;
export type CodeBlockElement = z.infer<typeof CodeBlockElement>;
export type CalloutElement = z.infer<typeof CalloutElement>;
export type ColumnElement = z.infer<typeof ColumnElement>;
export type ColumnGroupElement = z.infer<typeof ColumnGroupElement>;
export type HRElement = z.infer<typeof HRElement>;
