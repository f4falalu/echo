import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from './CardBase';
import { cn } from '@/lib/classMerge';
import { Text } from '../typography';

interface FileCardProps {
  fileName: string | React.ReactNode;
  headerButtons?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  bodyClassName?: string;
  footer?: React.ReactNode;
  footerClassName?: string;
}

export const FileCard = React.memo(
  ({
    fileName,
    className,
    headerButtons,
    children,
    bodyClassName,
    footer,
    footerClassName
  }: FileCardProps) => {
    return (
      <Card className={cn('h-full', className)}>
        <CardHeader variant={'gray'} size={'xsmall'} className="justify-center">
          <div className="flex items-center justify-between gap-x-1">
            <Text truncate>{fileName}</Text>
            <div className="flex items-center gap-1">{headerButtons}</div>
          </div>
        </CardHeader>

        <CardContent
          className={cn('bg-background relative h-full overflow-hidden p-0', bodyClassName)}>
          {children}
        </CardContent>

        <CardFooter className={cn('bg-background', footerClassName)}>{footer}</CardFooter>
      </Card>
    );
  }
);

FileCard.displayName = 'FileCard';
