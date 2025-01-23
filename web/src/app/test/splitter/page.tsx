'use client';

import { AppSplitter, AppSplitterRef } from '@/components';
import { useRef, useState } from 'react';
import { Button } from 'antd';
import { useMemoizedFn } from 'ahooks';

export default function Page() {
  const [toggleClose, setToggleClose] = useState(false);
  const ref = useRef<AppSplitterRef>(null);

  const onToggleClick = useMemoizedFn(() => {
    if (toggleClose) {
      ref.current?.animateWidth('50%', 'right');
      setToggleClose(false);
    } else {
      ref.current?.animateWidth('0%', 'right');
      setToggleClose(true);
    }
  });

  return (
    <div className="h-screen w-screen border">
      <AppSplitter
        ref={ref}
        leftChildren={
          <div className="h-full w-full bg-red-500">
            <Button onClick={onToggleClick}>Toggle {toggleClose.toString()}</Button>
          </div>
        }
        rightChildren={<div className="h-full w-full bg-blue-500">Right</div>}
        autoSaveId="test"
        defaultLayout={['50%', '50%']}
        preserveSide="left"
      />
    </div>
  );
}
