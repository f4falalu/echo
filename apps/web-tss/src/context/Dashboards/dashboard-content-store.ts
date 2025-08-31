import { Store, useStore } from '@tanstack/react-store';

type DashboardContentStore = {
  openAddContentModal: boolean;
};

const dashboardContentStore = new Store<DashboardContentStore>({
  openAddContentModal: false,
});

export const onOpenDashboardContentModal = () => {
  dashboardContentStore.setState((prev) => ({
    ...prev,
    openAddContentModal: true,
  }));
};

export const onCloseDashboardContentModal = () => {
  dashboardContentStore.setState((prev) => ({
    ...prev,
    openAddContentModal: false,
  }));
};

const stableSelectOpenDashboardContentModal = ({ openAddContentModal }: DashboardContentStore) =>
  openAddContentModal;
export const useOpenDashboardContentModal = () => {
  return useStore(dashboardContentStore, stableSelectOpenDashboardContentModal);
};

export const useToggleDashboardContentModal = () => {
  const openDashboardContentModal = useOpenDashboardContentModal();
  return {
    openDashboardContentModal,
    onCloseDashboardContentModal,
    onOpenDashboardContentModal,
  };
};
