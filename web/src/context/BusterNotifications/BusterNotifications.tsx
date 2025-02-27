'use client';

import React, { PropsWithChildren } from 'react';
import { toast, type ExternalToast } from 'sonner';
import { useMemoizedFn } from 'ahooks';
import {
  useContextSelector,
  createContext,
  ContextSelector
} from '@fluentui/react-context-selector';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface NotificationProps {
  type?: NotificationType;
  title?: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void | (() => Promise<void>);
  };
}

// const useStyles = createStyles(({ token, css }) => ({
//   modal: css`
//     .busterv2-modal-body {
//       padding: 0px !important;
//     }

//     .busterv2-modal-confirm-body {
//       padding: 24px 32px 16px 32px !important;
//     }

//     .busterv2-modal-confirm-btns {
//       margin-top: 0px !important;
//       padding: 12px 32px !important;
//       border-top: 0.5px solid ${token.colorBorder};
//       display: flex;
//       align-items: center;
//       justify-content: flex-end;
//     }

//     .busterv2-modal-confirm-content {
//       color: ${token.colorTextSecondary} !important;
//     }
//   `
// }));

export const useBusterNotificationsInternal = () => {
  // const { message, notification, modal } = App.useApp();
  // const { cx, styles } = useStyles();

  const openNotification = useMemoizedFn((props: NotificationProps) => {
    const { title, message, type } = props;

    const hasTitle = !!title;

    const toastOptions: ExternalToast = {
      ...props,
      description: !hasTitle && message ? message : message,
      position: 'top-center'
    };

    switch (type) {
      case 'success':
        return toast.success(title, toastOptions);
      case 'info':
        return toast.info(title, toastOptions);
      case 'warning':
        return toast.warning(title, toastOptions);
      case 'error':
        return toast.error(title, toastOptions);
      default:
        return toast(title, toastOptions);
    }
  });

  const openErrorNotification = useMemoizedFn((data: NotificationProps | unknown) => {
    const values = data || ({} as any);
    const type = values.type || 'error';
    const title = values.title || 'Error';
    const message = values.message || 'Something went wrong. Please try again.';
    return openNotification({ ...values, message, title, type });
  });

  const openInfoNotification = useMemoizedFn(
    ({ type = 'info', message = 'Info', title = 'Info', ...props }: NotificationProps) => {
      return openNotification({ ...props, title, message, type });
    }
  );

  const openSuccessNotification = useMemoizedFn(
    ({ type = 'success', title = 'Success', message = 'success', ...props }: NotificationProps) => {
      return openNotification({ ...props, message, title, type });
    }
  );

  const openWarningNotification = useMemoizedFn(
    ({ type = 'warning', title = 'Warning', message = 'Warning', ...props }: NotificationProps) => {
      return openNotification({ ...props, message, title, type });
    }
  );

  //MESSAGES

  const openMessage = useMemoizedFn(
    (props: {
      type: NotificationType;
      message: string;
      onClose?: () => void;
      duration?: number;
    }) => {
      return openNotification({
        ...props,
        title: props.message,
        message: ''
      });
    }
  );

  const openErrorMessage = useMemoizedFn((message: string) => {
    return openMessage({ type: 'error', message });
  });

  const openInfoMessage = useMemoizedFn((message: string, duration?: number) => {
    return openMessage({ type: 'info', message, duration });
  });

  const openSuccessMessage = useMemoizedFn((message: string) => {
    return openMessage({ type: 'success', message });
  });

  const openConfirmModal = useMemoizedFn(
    (props: {
      title: string | React.ReactNode;
      content: string | React.ReactNode;
      onOk: () => void;
      onCancel?: () => void;
      icon?: React.ReactNode;
      width?: string | number;
      useReject?: boolean;
      cancelButtonProps?: {
        className?: string;
      };
    }): Promise<void> => {
      const useReject = props.useReject ?? true;

      return new Promise((resolve, reject) => {
        // modal.confirm({
        //   icon: props.icon || <></>,
        //   ...props,
        //   className: cx(styles.modal, ''),
        //   cancelButtonProps: {
        //     ...props.cancelButtonProps,
        //     type: 'text'
        //   },
        //   okButtonProps: {
        //     ...props.okButtonProps,
        //     type: 'default'
        //   },
        //   onOk: async () => {
        //     await props.onOk();
        //     resolve();
        //   },
        //   onCancel: async () => {
        //     await props.onCancel?.();
        //     if (useReject) reject();
        //     else resolve();
        //   }
        // });
      });
    }
  );

  return {
    openErrorNotification,
    openInfoNotification,
    openSuccessNotification,
    openWarningNotification,
    openErrorMessage,
    openInfoMessage,
    openSuccessMessage,
    openConfirmModal,
    openNotification
  };
};

const BusterNotifications = createContext<ReturnType<typeof useBusterNotificationsInternal>>(
  {} as ReturnType<typeof useBusterNotificationsInternal>
);

export const BusterNotificationsProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const value = useBusterNotificationsInternal();

  return <BusterNotifications.Provider value={value}>{children}</BusterNotifications.Provider>;
};

const useBusterNotificationsSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useBusterNotificationsInternal>, T>
) => {
  return useContextSelector(BusterNotifications, selector);
};

export const useBusterNotifications = () => {
  return useBusterNotificationsSelector((state) => state);
};
