// Type definitions for extending platejs TElement with custom report element types
import 'platejs';
import type { TText } from 'platejs';

// Base interface with index signature to satisfy TElement requirements
interface BaseElement {
  children: any[];
  [key: string]: any;
}

// Define literal types for element types
export type HeadingType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export type ListType = 'ul' | 'ol';
export type TableCellType = 'td' | 'th';

// Define custom element types for the report component
export interface THeadingElement extends BaseElement {
  type: HeadingType;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface TParagraphElement extends BaseElement {
  type: 'p';
}

export interface TBlockquoteElement extends BaseElement {
  type: 'blockquote';
}

export interface TCodeBlockElement extends BaseElement {
  type: 'code_block';
  lang?: string;
}

export interface TCalloutElement extends BaseElement {
  type: 'callout';
  variant?: 'info' | 'warning' | 'error' | 'success' | 'tip' | 'note';
  icon?: string;
  backgroundColor?: string;
}

export interface TColumnElement extends BaseElement {
  type: 'column';
  width?: string | number;
}

export interface TColumnGroupElement extends BaseElement {
  type: 'column_group';
}

export interface THRElement extends BaseElement {
  type: 'hr';
}

export interface TTableElement extends BaseElement {
  type: 'table';
}

export interface TTableRowElement extends BaseElement {
  type: 'tr';
}

export interface TTableCellElement extends BaseElement {
  type: TableCellType;
  colSpan?: number;
  rowSpan?: number;
}

export interface TEmojiElement extends BaseElement {
  type: 'emoji';
  emoji?: string;
  code?: string;
}

export interface TListElement extends BaseElement {
  type: ListType;
  start?: number;
}

export interface TListItemElement extends BaseElement {
  type: 'li';
  checked?: boolean;
}

// Union type for all custom elements
export type TReportElement =
  | THeadingElement
  | TParagraphElement
  | TBlockquoteElement
  | TCodeBlockElement
  | TCalloutElement
  | TColumnElement
  | TColumnGroupElement
  | THRElement
  | TTableElement
  | TTableRowElement
  | TTableCellElement
  | TEmojiElement
  | TListElement
  | TListItemElement;

// Extract all valid element types as a union
export type ReportElementType = TReportElement['type'];

// Create a discriminated union type that includes all element types
export type TReportDescendant = TReportElement | TText;

// Helper type to extract element type from a discriminated union
export type ExtractElementType<T, U> = T extends { type: U } ? T : never;

// Create a strictly typed Value that only accepts our custom elements
export type StrictValue = Array<TReportDescendant>;

// Export a namespace with all the types for easy importing
export namespace ReportTypes {
  export type Heading = THeadingElement;
  export type Paragraph = TParagraphElement;
  export type Blockquote = TBlockquoteElement;
  export type CodeBlock = TCodeBlockElement;
  export type Callout = TCalloutElement;
  export type Column = TColumnElement;
  export type ColumnGroup = TColumnGroupElement;
  export type HR = THRElement;
  export type Table = TTableElement;
  export type TableRow = TTableRowElement;
  export type TableCell = TTableCellElement;
  export type Emoji = TEmojiElement;
  export type List = TListElement;
  export type ListItem = TListItemElement;
  export type Element = TReportElement;
  export type Descendant = TReportDescendant;
  export type ElementType = ReportElementType;
  export type Value = StrictValue;
}

// Type for plugin configuration with proper type inference
export type ReportPluginConfig<T extends TReportElement = TReportElement> = {
  type: T['type'];
  isElement?: boolean;
  isInline?: boolean;
  isVoid?: boolean;
};

// Module augmentation to make TElement globally type-safe
declare module 'platejs' {
  // Extend TElement to be a union of our custom elements
  interface TElement extends TReportElement {}

  // Remove Value augmentation - Value is TElement[] by default
}
