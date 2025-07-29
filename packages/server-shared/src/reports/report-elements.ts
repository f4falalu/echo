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
  kbd: z.boolean().optional(),
  strikethrough: z.boolean().optional(),
  code: z.boolean().optional(),
});

export const SimpleTextSchema = z.object({
  text: z.string(),
});

export const MentionSchema = z.object({
  type: z.literal('mention'),
  value: z.string(),
  children: z.array(TextSchema),
  key: z.string().optional(),
});

export const AnchorSchema = z.object({
  type: z.literal('a'),
  url: z.string(),
  children: z.array(z.union([TextSchema, MentionSchema])),
});

// Zod schema for a Heading element in the report editor
// This matches the THeadingElement type from plate-types.d.ts
export const HeaderElementSchema = z
  .object({
    type: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
    level: z.number().int().min(1).max(6).optional(),
    // children is required for platejs elements; each child is a text node or another element
    children: z.array(z.union([TextSchema, SimpleTextSchema])),
  })
  .merge(AttributesSchema);

export const ParagraphElementSchema = z
  .object({
    // Only allow the value 'p' for the type field using z.literal
    type: z.literal('p'),
    listStyleType: z.enum(['disc', 'circle', 'square']).optional(),
    indent: z.number().int().min(0).optional(),
    children: z.array(z.union([TextSchema, AnchorSchema, MentionSchema])),
  })
  .merge(AttributesSchema);

export const BlockquoteElementSchema = z
  .object({
    type: z.literal('blockquote'),
    children: z.array(z.union([TextSchema, ParagraphElementSchema, HeaderElementSchema])),
  })
  .merge(AttributesSchema);

export const FileElementSchema = z.object({
  type: z.literal('file'),
  url: z.string(),
  name: z.string(),
  isUpload: z.boolean().optional(),
  children: z.array(TextSchema),
});

const CodeLineElement = z.object({
  type: z.literal('code_line'),
  children: z.array(SimpleTextSchema),
});

export const CodeBlockElementSchema = z.object({
  type: z.literal('code_block'),
  lang: z
    .enum(['sql', 'yaml', 'javascript', 'typescript', 'python', 'bash', 'json'])
    .default('sql'),
  children: z.array(CodeLineElement),
});

export const CalloutElementSchema = z
  .object({
    type: z.literal('callout'),
    // Add an optional variant field to the CalloutElement schema
    variant: z.enum(['info', 'warning', 'error', 'success', 'tip', 'note']).optional(),
    icon: z.string().length(1, 'Icon must be a single character').optional(),
    backgroundColor: z.string().optional(),
    children: z.array(SimpleTextSchema),
  })
  .merge(AttributesSchema);

export const ColumnElementSchema = z.object({
  type: z.literal('column'),
  width: z.union([z.string(), z.number()]).optional(),
  children: z.array(
    z.union([
      TextSchema,
      ParagraphElementSchema,
      HeaderElementSchema,
      BlockquoteElementSchema,
      CodeBlockElementSchema,
    ])
  ),
});

export const ColumnGroupElementSchema = z.object({
  type: z.literal('column_group'),
  children: z.array(ColumnElementSchema),
});

export const HRElementSchema = z.object({
  type: z.literal('hr'),
  children: z.array(TextSchema).default([]),
});

const TableCellTypeEnum = z.enum(['td', 'th']);
const ListTypeEnum = z.enum(['ul', 'ol']);

// Update the schemas to use the Zod enums
export const TableCellElementSchema = z.object({
  type: TableCellTypeEnum,
  colSpan: z.number().optional(),
  rowSpan: z.number().optional(),
  children: z.array(z.union([TextSchema, ParagraphElementSchema])).default([]),
});

export const TableRowElementSchema = z
  .object({
    type: z.literal('tr'),
    children: z
      .array(z.union([TextSchema, ParagraphElementSchema, TableCellElementSchema]))
      .default([]),
  })
  .merge(AttributesSchema);

export const TableElementSchema = z
  .object({
    type: z.literal('table'),
    children: z.array(TableRowElementSchema, TableCellElementSchema).default([]),
  })
  .merge(AttributesSchema);

export const EmojiElementSchema = z.object({
  type: z.literal('emoji'),
  emoji: z.string().optional(),
  code: z.string().optional(),
  children: z.array(TextSchema).default([]),
});

// Use z.lazy for recursive schema definition - allows NestedListElement to contain other NestedListElements
const NestedListElementSchema = z.object({
  type: z.enum(['li', 'lic', 'lii']),
  children: z.array(z.union([TextSchema, ParagraphElementSchema])).default([]),
});

export const ListElementSchema = z
  .object({
    type: ListTypeEnum,
    start: z.number().optional(),
    children: z.array(
      z.object({
        type: z.literal('li'),
        children: z
          .array(z.union([TextSchema, ParagraphElementSchema, NestedListElementSchema]))
          .default([]),
      })
    ),
  })
  .merge(AttributesSchema);

export const ListItemElementSchema = z.object({
  type: z.literal('li'),
  checked: z.boolean().optional(),
  children: z.array(TextSchema).default([]),
});

export const ImageElementSchema = z
  .object({
    type: z.literal('img'),
    url: z.string(),
    alt: z.string().optional(),
    width: z.union([z.number(), z.string().regex(/^(?:\d+px|\d+%)$/)]).optional(),
    height: z.number().optional(),
    children: z.array(TextSchema).default([]),
    caption: z.array(z.union([TextSchema, ParagraphElementSchema])).default([]),
  })
  .merge(AttributesSchema);

export const AudioElementSchema = z.object({
  type: z.literal('audio'),
  url: z.string(),
  children: z.array(TextSchema).default([]),
});

export const TocElementSchema = z.object({
  type: z.literal('toc'),
  children: z.array(TextSchema).default([]),
});

export const ReportElementSchema = z.discriminatedUnion('type', [
  HeaderElementSchema,
  ParagraphElementSchema,
  BlockquoteElementSchema,
  CodeBlockElementSchema,
  CalloutElementSchema,
  ColumnElementSchema,
  ColumnGroupElementSchema,
  HRElementSchema,
  TocElementSchema,
  TableElementSchema,
  TableRowElementSchema,
  TableCellElementSchema,
  EmojiElementSchema,
  ListElementSchema,
  ListItemElementSchema,
  ImageElementSchema,
  AnchorSchema,
  AudioElementSchema,
  FileElementSchema,
]);

export const ReportElementsSchema = z.array(ReportElementSchema);

export type ReportElement = z.infer<typeof ReportElementSchema>;
export type ReportElements = z.infer<typeof ReportElementsSchema>;
export type TextElement = z.infer<typeof TextSchema>;
export type HeaderElement = z.infer<typeof HeaderElementSchema>;
export type ParagraphElement = z.infer<typeof ParagraphElementSchema>;
export type BlockquoteElement = z.infer<typeof BlockquoteElementSchema>;
export type CodeBlockElement = z.infer<typeof CodeBlockElementSchema>;
export type CalloutElement = z.infer<typeof CalloutElementSchema>;
export type ColumnElement = z.infer<typeof ColumnElementSchema>;
export type ColumnGroupElement = z.infer<typeof ColumnGroupElementSchema>;
export type HRElement = z.infer<typeof HRElementSchema>;
export type ListElement = z.infer<typeof ListElementSchema>;
export type ListItemElement = z.infer<typeof ListItemElementSchema>;
export type ImageElement = z.infer<typeof ImageElementSchema>;
export type AnchorElement = z.infer<typeof AnchorSchema>;
export type FileElement = z.infer<typeof FileElementSchema>;
export type AudioElement = z.infer<typeof AudioElementSchema>;
