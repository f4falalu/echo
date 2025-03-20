import { ConfirmModalProps, ConfirmProps } from '@/components/ui/modal/ConfirmModal';
import { useState, useRef, useMemo } from 'react';

const defaultConfirmModalProps: ConfirmProps = {
  title: '',
  content: '',
  onOk: async () => {},
  onCancel: async () => {}
};

interface QueuedModal extends ConfirmProps {
  resolve: (value: void) => void;
  reject: (reason?: any) => void;
  onClose: () => void;
}

export const useOpenConfirmModal = () => {
  const [modalQueue, setModalQueue] = useState<QueuedModal[]>([]);
  const currentModal = modalQueue[0]; // Get the first modal in the queue

  const openConfirmModal = (props: ConfirmProps): Promise<void> => {
    return new Promise((resolve, reject) => {
      const newModal: QueuedModal = {
        ...props,
        resolve,
        reject,
        onOk: async () => {
          try {
            await props.onOk();
            resolve();
          } catch (error) {
            reject(error);
          } finally {
            // Remove the current modal from the queue
            setModalQueue((prev) => prev.slice(1));
          }
        },
        onCancel: async () => {
          try {
            await props.onCancel?.();
            resolve();
          } catch (error) {
            reject(error);
          } finally {
            // Remove the current modal from the queue
            setModalQueue((prev) => prev.slice(1));
          }
        },
        onClose: () => {
          resolve();
          setModalQueue((prev) => prev.slice(1));
        }
      };

      setModalQueue((prev) => [...prev, newModal]);
    });
  };

  const confirmModalProps: ConfirmModalProps = useMemo(() => {
    return currentModal
      ? {
          ...currentModal,
          open: true
        }
      : {
          ...defaultConfirmModalProps,
          open: false,
          onClose: () => {}
        };
  }, [currentModal]);

  return useMemo(() => {
    return { openConfirmModal, confirmModalProps };
  }, [openConfirmModal, confirmModalProps]);
};
