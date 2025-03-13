import { ConfirmModalProps, ConfirmProps } from '@/components/ui/modal/ConfirmModal';
import { useState, useRef } from 'react';

const defaultConfirmModalProps: ConfirmProps = {
  title: '',
  content: '',
  onOk: async () => {},
  onCancel: async () => {}
};

export const useOpenConfirmModal = () => {
  const [open, setOpen] = useState(false);
  const confirmModalPropsRef = useRef<ConfirmProps>(defaultConfirmModalProps);
  const resolveRef = useRef<((value: void) => void) | null>(null);
  const rejectRef = useRef<((reason?: any) => void) | null>(null);

  const openConfirmModal = (props: ConfirmProps): Promise<void> => {
    return new Promise((resolve, reject) => {
      resolveRef.current = resolve;
      rejectRef.current = reject;

      confirmModalPropsRef.current = {
        ...props,
        onOk: async () => {
          try {
            await props.onOk();
            resolve();
          } catch (error) {
            reject(error);
          } finally {
            setOpen(false);
          }
        },
        onCancel: async () => {
          try {
            await props.onCancel?.();
            resolve();
          } catch (error) {
            reject(error);
          } finally {
            setOpen(false);
          }
        }
      };

      setOpen(true);
    });
  };

  const onCloseConfirmModal = () => {
    setOpen(false);
  };

  const confirmModalProps: ConfirmModalProps = {
    ...confirmModalPropsRef.current,
    open,
    onClose: onCloseConfirmModal
  };

  return { openConfirmModal, confirmModalProps };
};
