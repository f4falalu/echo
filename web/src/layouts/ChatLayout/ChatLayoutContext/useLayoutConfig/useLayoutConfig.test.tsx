import { renderHook, act } from '@testing-library/react';
import { useLayoutConfig } from './useLayoutConfig';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes';
import { FileType } from '@/api/asset_interfaces/chat';
import { SelectedFile } from '../../interfaces';
import { FileViewSecondary } from './interfaces';

// Mock dependencies
jest.mock('@/context/BusterAppLayout', () => ({
  useAppLayoutContextSelector: jest.fn()
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    prefetch: jest.fn(),
    push: jest.fn()
  }))
}));

// Mock timeout function
jest.mock('@/lib', () => ({
  timeout: jest.fn().mockImplementation(() => Promise.resolve())
}));

describe('useLayoutConfig', () => {
  const mockOnChangePage = jest.fn();
  const mockAnimateOpenSplitter = jest.fn();
  const mockOnSetSelectedFile = jest.fn();
  const mockOnChangeQueryParams = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppLayoutContextSelector as jest.Mock).mockImplementation((selector) => {
      const state = {
        onChangePage: mockOnChangePage,
        onChangeQueryParams: mockOnChangeQueryParams
      };
      return selector(state);
    });
  });

  const defaultProps: Parameters<typeof useLayoutConfig>[0] = {
    selectedFile: {
      id: 'metric-123',
      type: 'metric' as FileType,
      versionNumber: 1
    } as SelectedFile,
    isVersionHistoryMode: false,
    chatId: 'chat-123',
    onSetSelectedFile: mockOnSetSelectedFile,
    animateOpenSplitter: mockAnimateOpenSplitter,
    appSplitterRef: { current: null },
    // ChatParams properties
    metricId: undefined,
    dashboardId: undefined,
    collectionId: undefined,
    datasetId: undefined,
    messageId: undefined,
    metricVersionNumber: undefined,
    dashboardVersionNumber: undefined,
    currentRoute: BusterRoutes.APP_CHAT_ID,
    secondaryView: undefined
  };

  it('should initialize with correct file views', () => {
    const { result } = renderHook(() => useLayoutConfig(defaultProps));

    expect(result.current.selectedLayout).toBe('both');
    expect(result.current.selectedFileView).toBe('chart');
    expect(result.current.selectedFileViewSecondary).toBeNull();
    expect(result.current.selectedFileViewRenderSecondary).toBe(false);
  });

  it('should set file view correctly', async () => {
    const { result } = renderHook(() => useLayoutConfig(defaultProps));

    await act(async () => {
      await result.current.onSetFileView({ fileView: 'results' });
    });

    expect(result.current.selectedFileView).toBe('results');
    expect(mockAnimateOpenSplitter).toHaveBeenCalledWith('both');
  });

  it('should set secondary view correctly', async () => {
    const { result } = renderHook(() => useLayoutConfig(defaultProps));

    await act(async () => {
      await result.current.onSetFileView({
        fileView: 'chart',
        secondaryView: 'chart-edit'
      });
    });

    expect(result.current.selectedFileView).toBe('chart');
    expect(result.current.selectedFileViewSecondary).toBe('chart-edit');
    expect(mockAnimateOpenSplitter).toHaveBeenCalledWith('right');
  });

  it('should close secondary view', async () => {
    const { result } = renderHook(() => useLayoutConfig(defaultProps));

    // First set a secondary view
    await act(async () => {
      await result.current.onSetFileView({
        fileView: 'chart',
        secondaryView: 'chart-edit'
      });
    });

    // Then close it
    await act(async () => {
      await result.current.closeSecondaryView();
    });

    expect(result.current.selectedFileViewSecondary).toBeNull();
  });

  it('should collapse file and navigate to chat', async () => {
    const { result } = renderHook(() => useLayoutConfig(defaultProps));

    await act(async () => {
      await result.current.onCollapseFileClick();
    });

    expect(mockOnSetSelectedFile).toHaveBeenCalledWith(null);
    expect(mockOnChangePage).toHaveBeenCalledWith({
      route: BusterRoutes.APP_CHAT_ID,
      chatId: 'chat-123'
    });
  });

  it.skip('should handle version history mode', () => {
    const props = {
      ...defaultProps,
      isVersionHistoryMode: true
    };

    renderHook(() => useLayoutConfig(props));

    expect(mockAnimateOpenSplitter).toHaveBeenCalledWith('right');
  });

  it('should return correct layout based on props', () => {
    // With file and chat
    const { result: resultWithBoth } = renderHook(() => useLayoutConfig(defaultProps));
    expect(resultWithBoth.current.selectedLayout).toBe('both');

    // With chat only
    const { result: resultWithChat } = renderHook(() =>
      useLayoutConfig({
        ...defaultProps,
        selectedFile: null
      })
    );
    expect(resultWithChat.current.selectedLayout).toBe('chat-only');

    // With file only (no chat)
    const { result: resultWithFile } = renderHook(() =>
      useLayoutConfig({
        ...defaultProps,
        chatId: undefined
      })
    );
    expect(resultWithFile.current.selectedLayout).toBe('file-only');
  });

  it('should be chat hidden if secondary view is set', () => {
    const { result } = renderHook(() =>
      useLayoutConfig({
        ...defaultProps,
        metricId: 'metric-123',

        selectedFile: {
          id: 'metric-123',
          type: 'metric' as FileType,
          versionNumber: 1
        } as SelectedFile,
        secondaryView: 'chart-edit'
      })
    );
    expect(result.current.selectedLayout).toBe('chat-hidden');
  });

  it('should update fileViews when route-related props change', () => {
    const { rerender } = renderHook((props) => useLayoutConfig(props), {
      initialProps: defaultProps
    });

    // Update with a metric ID
    rerender({
      ...defaultProps,
      metricId: 'new-metric-id',
      currentRoute: BusterRoutes.APP_METRIC_ID_CHART
    });

    expect(mockAnimateOpenSplitter).toHaveBeenCalled();
  });

  it('should initialize with a dashboard file', () => {
    const dashboardProps = {
      ...defaultProps,
      selectedFile: {
        id: 'dashboard-123',
        type: 'dashboard' as FileType,
        versionNumber: 1
      } as SelectedFile
    };

    const { result } = renderHook(() => useLayoutConfig(dashboardProps));

    expect(result.current.selectedFileView).toBe('dashboard');
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useLayoutConfig(defaultProps));

    expect(result.current.selectedLayout).toBe('both');
    expect(result.current.selectedFileView).toBe('chart');
    expect(result.current.selectedFileViewSecondary).toBeNull();
  });

  it('should update selected layout when selectedFile is null', async () => {
    const { result, rerender } = renderHook(() => useLayoutConfig(defaultProps));

    // Rerender with selectedFile set to null
    rerender({
      ...defaultProps,
      selectedFile: null
    });

    expect(result.current.selectedLayout).toBe('both');
  });

  it('should update selected layout when selectedFile is null', async () => {
    const { result, rerender } = renderHook(() =>
      useLayoutConfig({ ...defaultProps, selectedFile: null })
    );

    // Rerender with selectedFile set to null
    rerender({
      ...defaultProps,
      selectedFile: null
    });

    expect(result.current.selectedLayout).toBe('chat-only');
  });

  it('should call onSetSelectedFile when collapsing file', async () => {
    const { result } = renderHook(() => useLayoutConfig(defaultProps));

    await act(async () => {
      await result.current.onCollapseFileClick();
    });

    expect(mockOnSetSelectedFile).toHaveBeenCalledWith(null);
  });

  it('should handle secondary view correctly when set', async () => {
    const { result } = renderHook(() => useLayoutConfig(defaultProps));

    await act(async () => {
      await result.current.onSetFileView({
        fileView: 'chart',
        secondaryView: 'chart-edit'
      });
    });

    expect(result.current.selectedFileViewSecondary).toBe('chart-edit');
  });

  it('should reset secondary view when closeSecondaryView is called', async () => {
    const { result } = renderHook(() => useLayoutConfig(defaultProps));

    // Set a secondary view first
    await act(async () => {
      await result.current.onSetFileView({
        fileView: 'chart',
        secondaryView: 'chart-edit'
      });
    });

    // Now close the secondary view
    await act(async () => {
      await result.current.closeSecondaryView();
    });

    expect(result.current.selectedFileViewSecondary).toBeNull();
  });
});
