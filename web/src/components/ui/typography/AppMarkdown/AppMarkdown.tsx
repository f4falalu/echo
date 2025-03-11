import React, { memo, useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'; // For rendering HTML
import {
  CustomCode,
  CustomHeading,
  CustomListItem,
  CustomParagraph,
  CustomBlockquote,
  CustomSpan
} from './AppMarkdownCommon';
import { useMemoizedFn } from '@/hooks';
import styles from './AppMarkdown.module.css';
import { cn } from '@/lib/classMerge';

const AppMarkdownBase: React.FC<{
  markdown: string | null;
  showLoader?: boolean;
  className?: string;
  stripFormatting?: boolean;
}> = ({ markdown = '', showLoader = false, className = '', stripFormatting = false }) => {
  const currentMarkdown = markdown || '';

  const commonProps = useMemo(() => {
    const numberOfLineMarkdown = currentMarkdown.split('\n').length;
    return {
      markdown: currentMarkdown,
      showLoader,
      numberOfLineMarkdown,
      stripFormatting
    };
  }, [currentMarkdown, showLoader, stripFormatting]);

  const text = useMemoizedFn((props: React.SVGTextElementAttributes<SVGTextElement>) => (
    <CustomParagraph {...props} {...commonProps} />
  ));
  const code = useMemoizedFn((props) => <CustomCode {...props} {...commonProps} />);
  const heading = useMemoizedFn((props) => <CustomHeading {...props} {...commonProps} />);
  const listItem = useMemoizedFn((props) => <CustomListItem {...props} {...commonProps} />);
  const blockquote = useMemoizedFn((props) => <CustomBlockquote {...props} {...commonProps} />);
  const span = useMemoizedFn((props) => <CustomSpan {...props} {...commonProps} />);
  const li = useMemoizedFn((props) => <CustomListItem {...props} {...commonProps} />);
  const p = useMemoizedFn((props) => <CustomParagraph {...props} {...commonProps} />);
  const h1 = useMemoizedFn((props) => <CustomHeading level={1} {...props} {...commonProps} />);
  const h2 = useMemoizedFn((props) => <CustomHeading level={2} {...props} {...commonProps} />);
  const h3 = useMemoizedFn((props) => <CustomHeading level={3} {...props} {...commonProps} />);
  const h4 = useMemoizedFn((props) => <CustomHeading level={4} {...props} {...commonProps} />);
  const h5 = useMemoizedFn((props) => <CustomHeading level={5} {...props} {...commonProps} />);
  const h6 = useMemoizedFn((props) => <CustomHeading level={6} {...props} {...commonProps} />);

  const memoizedComponents: Partial<Components> = useMemo(() => {
    return {
      //common components,
      text,
      code,
      heading,
      listItem,
      blockquote,
      span,
      p,
      h1,
      h2,
      h3,
      h4,
      h5,
      h6,
      li
    };
  }, []);

  return (
    <div className={cn(styles.container, 'flex flex-col gap-1.5', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml={true}
        components={memoizedComponents}
        rehypePlugins={[rehypeRaw]}>
        {currentMarkdown}
      </ReactMarkdown>
    </div>
  );
};

export const AppMarkdown = memo(AppMarkdownBase);

export default AppMarkdown;
