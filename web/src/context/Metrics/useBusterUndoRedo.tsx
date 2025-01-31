import { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { useMemoizedFn } from 'ahooks';
import React, { useMemo, useState } from 'react';
import { IBusterMetric } from './interfaces';

type IUndoRedoStackItem =
  | { messageId: string; type: 'selectedMessageId' }
  | { messageId: string; type: 'chartConfig'; chartConfig: IBusterMetricChartConfig };

interface IUndoRedoStack {
  undo: IUndoRedoStackItem[];
  redo: IUndoRedoStackItem[];
}

export const useBusterUndoRedo = ({
  currentMessageIdByThread,
  messagesRef,
  onSetCurrentMessageId,
  onUpdateMessageChartConfig
}: {
  onSetCurrentMessageId: ({ metricId }: { metricId: string }) => void;
  onUpdateMessageChartConfig: (d: {
    metricId?: string;
    chartConfig: Partial<IBusterMetricChartConfig>;
    ignoreUndoRedo?: boolean;
  }) => Promise<void>;
  currentMessageIdByThread: { [key: string]: string | null };
  messagesRef: React.MutableRefObject<Record<string, IBusterMetric>>;
}) => {
  //keyed by metricId
  const [undoRedoStack, setUndoRedoStack] = useState<Record<string, IUndoRedoStack>>({});

  const onUndo = useMemoizedFn(({ metricId }: { metricId: string }) => {
    if (undoRedoStack[metricId]?.undo.length === 0) {
      return;
    }

    const itemToUndo = undoRedoStack[metricId].undo[undoRedoStack[metricId].undo.length - 1];
    const newUndoStack = undoRedoStack[metricId].undo.slice(0, -1);

    let redoItem: IUndoRedoStackItem;
    if (itemToUndo.type === 'selectedMessageId') {
      redoItem = {
        type: 'selectedMessageId',
        messageId: currentMessageIdByThread[metricId] || ''
      };
    } else {
      redoItem = {
        type: 'chartConfig',
        messageId: itemToUndo.messageId,
        chartConfig: messagesRef.current[itemToUndo.messageId].chart_config
      };
    }

    setUndoRedoStack({
      ...undoRedoStack,
      [metricId]: {
        undo: newUndoStack,
        redo: [...(undoRedoStack[metricId]?.redo || []), redoItem]
      }
    });

    if (itemToUndo.type === 'selectedMessageId') {
      onSetCurrentMessageId({ metricId: itemToUndo.messageId });
    } else if (itemToUndo.type === 'chartConfig') {
      onUpdateMessageChartConfig({
        metricId: itemToUndo.messageId,
        chartConfig: itemToUndo.chartConfig,
        ignoreUndoRedo: true
      });
    }
  });

  const onRedo = useMemoizedFn(({ metricId }: { metricId: string }) => {
    if (undoRedoStack[metricId]?.redo.length === 0) {
      return;
    }

    const itemToRedo = undoRedoStack[metricId].redo[undoRedoStack[metricId].redo.length - 1];
    const newRedoStack = undoRedoStack[metricId].redo.slice(0, -1);

    let undoItem: IUndoRedoStackItem;
    if (itemToRedo.type === 'selectedMessageId') {
      undoItem = {
        type: 'selectedMessageId',
        messageId: currentMessageIdByThread[metricId] || ''
      };
    } else {
      undoItem = {
        type: 'chartConfig',
        messageId: itemToRedo.messageId,
        chartConfig: messagesRef.current[itemToRedo.messageId].chart_config
      };
    }

    setUndoRedoStack({
      ...undoRedoStack,
      [metricId]: {
        undo: [...(undoRedoStack[metricId]?.undo || []), undoItem],
        redo: newRedoStack
      }
    });

    if (itemToRedo.type === 'selectedMessageId') {
      onSetCurrentMessageId({ metricId: itemToRedo.messageId });
    } else if (itemToRedo.type === 'chartConfig') {
      onUpdateMessageChartConfig({
        metricId: itemToRedo.messageId,
        chartConfig: itemToRedo.chartConfig,
        ignoreUndoRedo: true
      });
    }
  });

  const addToUndoStack = useMemoizedFn(
    ({
      metricId,
      messageId,
      chartConfig
    }: {
      metricId: string;
      messageId: string;
      chartConfig?: IBusterMetricChartConfig;
    }) => {
      const type = chartConfig ? 'chartConfig' : 'selectedMessageId';
      const newItem: IUndoRedoStackItem =
        type === 'selectedMessageId'
          ? {
              messageId,
              type: 'selectedMessageId'
            }
          : {
              messageId,
              type: 'chartConfig',
              chartConfig: chartConfig!
            };

      setUndoRedoStack((v) => ({
        ...v,
        [metricId]: {
          undo: [...(v[metricId]?.undo || []), newItem],
          redo: []
        }
      }));
    }
  );

  const canUndo = useMemo(() => {
    return (metricId: string) => {
      if (undoRedoStack[metricId]) return undoRedoStack[metricId]?.undo.length > 0;
      return false;
    };
  }, [undoRedoStack]);

  const canRedo = useMemo(() => {
    return (metricId: string) => {
      if (undoRedoStack[metricId]) return undoRedoStack[metricId]?.redo.length > 0;
      return false;
    };
  }, [undoRedoStack]);

  const resetUndoRedoStack = useMemoizedFn(() => {
    setUndoRedoStack({});
  });

  return {
    onUndo,
    onRedo,
    addToUndoStack,
    canRedo,
    resetUndoRedoStack,
    canUndo
  };
};
