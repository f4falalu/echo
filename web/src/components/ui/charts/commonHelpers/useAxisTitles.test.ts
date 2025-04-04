import { renderHook } from '@testing-library/react';
import { useAxisTitles } from './useAxisTitles';
import { useXAxisTitle } from './useXAxisTitle';
import { useYAxisTitle } from './useYAxisTitle';
import { useY2AxisTitle } from './useY2AxisTitle';
import { ChartType } from '@/api/asset_interfaces/metric/charts';
import type { ChartEncodes, ComboChartAxis } from '@/api/asset_interfaces/metric/charts';
import type { IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import type { SimplifiedColumnType } from '@/api/asset_interfaces/metric';

// Mock the dependency hooks
jest.mock('./useXAxisTitle', () => ({
  useXAxisTitle: jest.fn()
}));

jest.mock('./useYAxisTitle', () => ({
  useYAxisTitle: jest.fn()
}));

jest.mock('./useY2AxisTitle', () => ({
  useY2AxisTitle: jest.fn()
}));

describe('useAxisTitles', () => {
  const defaultProps = {
    selectedAxis: {
      x: ['date'],
      y: ['value'],
      y2: ['secondValue']
    } as ComboChartAxis,
    columnLabelFormats: {
      date: {
        columnType: 'date' as SimplifiedColumnType,
        style: 'date' as const
      },
      value: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const
      },
      secondValue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const
      }
    } as Record<string, IColumnLabelFormat>,
    yAxisShowAxisTitle: true,
    yAxisAxisTitle: 'Value Axis',
    xAxisShowAxisTitle: true,
    xAxisAxisTitle: 'Date Axis',
    selectedChartType: ChartType.Line,
    y2AxisShowAxisTitle: true,
    y2AxisAxisTitle: 'Second Value Axis',
    barLayout: 'vertical' as const
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock returns
    (useXAxisTitle as jest.Mock).mockReturnValue('X Axis Title');
    (useYAxisTitle as jest.Mock).mockReturnValue('Y Axis Title');
    (useY2AxisTitle as jest.Mock).mockReturnValue('Y2 Axis Title');
  });

  it('should return the expected axis titles for vertical layout', () => {
    const { result } = renderHook(() => useAxisTitles(defaultProps));

    expect(result.current).toEqual({
      xAxisTitle: 'X Axis Title',
      yAxisTitle: 'Y Axis Title',
      y2AxisTitle: 'Y2 Axis Title'
    });

    // Verify the hook calls
    expect(useXAxisTitle).toHaveBeenCalledWith({
      xAxis: defaultProps.selectedAxis.x,
      columnLabelFormats: defaultProps.columnLabelFormats,
      isSupportedChartForAxisTitles: true,
      xAxisAxisTitle: defaultProps.xAxisAxisTitle,
      xAxisShowAxisTitle: defaultProps.xAxisShowAxisTitle,
      selectedAxis: defaultProps.selectedAxis
    });

    expect(useYAxisTitle).toHaveBeenCalledWith({
      yAxis: defaultProps.selectedAxis.y,
      columnLabelFormats: defaultProps.columnLabelFormats,
      isSupportedChartForAxisTitles: true,
      yAxisAxisTitle: defaultProps.yAxisAxisTitle,
      yAxisShowAxisTitle: defaultProps.yAxisShowAxisTitle,
      selectedAxis: defaultProps.selectedAxis
    });

    expect(useY2AxisTitle).toHaveBeenCalledWith({
      y2Axis: defaultProps.selectedAxis.y2,
      columnLabelFormats: defaultProps.columnLabelFormats,
      isSupportedChartForAxisTitles: true,
      y2AxisAxisTitle: defaultProps.y2AxisAxisTitle,
      y2AxisShowAxisTitle: defaultProps.y2AxisShowAxisTitle
    });
  });

  it('should swap X and Y axis titles for horizontal bar layout', () => {
    const horizontalProps = {
      ...defaultProps,
      barLayout: 'horizontal' as const,
      selectedChartType: ChartType.Bar
    };

    const { result } = renderHook(() => useAxisTitles(horizontalProps));

    // When horizontal, the titles should be swapped
    expect(result.current).toEqual({
      xAxisTitle: 'Y Axis Title', // Swapped
      yAxisTitle: 'X Axis Title', // Swapped
      y2AxisTitle: 'Y2 Axis Title'
    });
  });

  it('should not swap axis titles for non-bar charts, even with horizontal layout', () => {
    const nonBarProps = {
      ...defaultProps,
      barLayout: 'horizontal' as const,
      selectedChartType: ChartType.Line // Line chart, not Bar
    };

    const { result } = renderHook(() => useAxisTitles(nonBarProps));

    // Should not swap for non-bar charts
    expect(result.current).toEqual({
      xAxisTitle: 'X Axis Title',
      yAxisTitle: 'Y Axis Title',
      y2AxisTitle: 'Y2 Axis Title'
    });
  });

  it('should handle empty y2 axis properly', () => {
    const noY2AxisProps = {
      ...defaultProps,
      selectedAxis: {
        x: ['date'],
        y: ['value']
      } as ChartEncodes
    };

    const { result } = renderHook(() => useAxisTitles(noY2AxisProps));

    expect(useY2AxisTitle).toHaveBeenCalledWith({
      y2Axis: [],
      columnLabelFormats: defaultProps.columnLabelFormats,
      isSupportedChartForAxisTitles: true,
      y2AxisAxisTitle: defaultProps.y2AxisAxisTitle,
      y2AxisShowAxisTitle: defaultProps.y2AxisShowAxisTitle
    });
  });

  it('should pass isSupportedChartForAxisTitles as false for unsupported chart types', () => {
    const unsupportedChartProps = {
      ...defaultProps,
      selectedChartType: ChartType.Pie // Pie is not in the supported types list
    };

    renderHook(() => useAxisTitles(unsupportedChartProps));

    // All hooks should be called with isSupportedChartForAxisTitles = false
    expect(useXAxisTitle).toHaveBeenCalledWith(
      expect.objectContaining({
        isSupportedChartForAxisTitles: false
      })
    );

    expect(useYAxisTitle).toHaveBeenCalledWith(
      expect.objectContaining({
        isSupportedChartForAxisTitles: false
      })
    );

    expect(useY2AxisTitle).toHaveBeenCalledWith(
      expect.objectContaining({
        isSupportedChartForAxisTitles: false
      })
    );
  });

  it('should test all supported chart types for axis titles', () => {
    // Test each supported chart type
    const supportedTypes = [ChartType.Bar, ChartType.Line, ChartType.Scatter, ChartType.Combo];

    supportedTypes.forEach((chartType) => {
      (useXAxisTitle as jest.Mock).mockClear();
      (useYAxisTitle as jest.Mock).mockClear();
      (useY2AxisTitle as jest.Mock).mockClear();

      const chartTypeProps = {
        ...defaultProps,
        selectedChartType: chartType
      };

      renderHook(() => useAxisTitles(chartTypeProps));

      // For each supported type, isSupportedChartForAxisTitles should be true
      expect(useXAxisTitle).toHaveBeenCalledWith(
        expect.objectContaining({
          isSupportedChartForAxisTitles: true
        })
      );
    });
  });
});
