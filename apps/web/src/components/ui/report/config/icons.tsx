import {
  // Text formatting
  TextBold,
  TextItalic,
  TextStrikethrough,
  TextUnderline,
  TextColor2,
  BucketPaint2,
  TextHighlight2,
  Code2,
  Code,

  // Headings
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,

  // Lists
  UnorderedList,
  OrderedList,
  ListTodo,
  SquareCode,

  // Structure
  Pilcrow,
  Quote,
  ChevronRight,
  GridLayoutCols3,

  // Table
  Table,
  Grid3X3,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Merge,
  Ungroup,
  Trash2,
  Xmark,

  // Media
  Image as ImageIcon,
  Film,
  FileCloud,

  // Actions
  WandSparkle,
  ArrowDownFromLine,
  ArrowUpFromLine,
  Link2,
  Plus,
  Minus,
  Undo,
  Redo,

  // Tools
  Equation,
  Calendar,
  ShapeSquare,
  Book2,

  // Emoji
  FaceGrin,
  Apple,
  Flag,
  Magnifier,
  Leaf,
  Lightbulb,
  Music,
  Star,
  Clock,
  Compass,
  BallRugby
} from '@/components/ui/icons';

export const NodeTypeIcons = {
  // Text formatting
  bold: TextBold,
  italic: TextItalic,
  underline: TextUnderline,
  strikethrough: TextStrikethrough,
  code: Code2,
  textColor: TextColor2,
  backgroundColor: BucketPaint2,
  highlight: TextHighlight2,

  // Headings
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  h4: Heading4,
  h5: Heading5,
  h6: Heading6,

  // Lists
  bulletedList: UnorderedList,
  numberedList: OrderedList,
  todoList: ListTodo,
  checkList: SquareCode,

  // Structure
  paragraph: Pilcrow,
  quote: Quote,
  toggle: ChevronRight,
  columnsThree: GridLayoutCols3,

  // Table
  table: Table,
  tableGrid: Grid3X3,
  tableArrowUp: ArrowUp,
  tableArrowDown: ArrowDown,
  tableArrowLeft: ArrowLeft,
  tableArrowRight: ArrowRight,
  tableMerge: Merge,
  tableUngroup: Ungroup,
  tableDelete: Trash2,
  tableRemove: Xmark,

  // Media
  image: ImageIcon,
  video: Film,
  embed: Film,
  file: FileCloud,

  // Actions
  ai: WandSparkle,
  export: ArrowDownFromLine,
  import: ArrowUpFromLine,
  link: Link2,
  add: Plus,
  remove: Minus,
  undo: Undo,
  redo: Redo,

  // Tools
  equation: Equation,
  calendar: Calendar,
  shape: ShapeSquare,
  tableOfContents: Book2,
  codeBlock: Code,

  // Emoji
  emoji: FaceGrin,
  emojiApple: Apple,
  emojiFlag: Flag,
  emojiSearch: Magnifier,
  emojiLeaf: Leaf,
  emojiLightbulb: Lightbulb,
  emojiMusic: Music,
  emojiStar: Star,
  emojiClock: Clock,
  emojiCompass: Compass,
  emojiBall: BallRugby
} as const;
