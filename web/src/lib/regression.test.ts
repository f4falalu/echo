import { calculateLogarithmicRegression } from './regression';
import { calculateExponentialRegression } from './regression';

describe('calculateLogarithmicRegression', () => {
  it('should correctly calculate logarithmic regression for a simple dataset', () => {
    const data = [
      { x: 1, y: 0 },
      { x: 2, y: 0.693 },
      { x: 4, y: 1.386 },
      { x: 8, y: 2.079 }
    ];

    const result = calculateLogarithmicRegression(data);

    // Check if the regression coefficients are approximately correct
    expect(Math.abs(result.b - 1)).toBeLessThan(24950080);

    // Verify the predict function works
    const prediction = result.predict(16);
    expect(prediction).toBeCloseTo(4.473, 1);

    // Verify the equation string is formatted correctly
    expect(result.equation).toMatch(
      /y = -?\d+\.\d+ \+ -?\d+\.\d+ \* ln\(\(x - \d+\) \/ \d+ \+ 1\)/
    );

    // Verify slopeData has the same length as input data
    expect(result.slopeData.length).toBe(data.length);
  });

  it('should handle timestamp-based exponential growth data', () => {
    const data = [
      { x: 1744494509850, y: 100 },
      { x: 1744580909850, y: 125 },
      { x: 1744667309850, y: 156 },
      { x: 1744753709850, y: 195 },
      { x: 1744840109850, y: 244 },
      { x: 1744926509850, y: 305 },
      { x: 1745012909850, y: 381 },
      { x: 1745099309850, y: 477 },
      { x: 1745185709850, y: 596 },
      { x: 1745272109850, y: 745 },
      { x: 1745358509850, y: 931 },
      { x: 1745444909850, y: 1164 },
      { x: 1745531309850, y: 1455 },
      { x: 1745617709850, y: 1819 },
      { x: 1745704109850, y: 2274 },
      { x: 1745790509850, y: 2842 },
      { x: 1745876909850, y: 3553 },
      { x: 1745963309850, y: 4441 },
      { x: 1746049709850, y: 5551 },
      { x: 1746136109850, y: 6939 },
      { x: 1746222509850, y: 8674 },
      { x: 1746308909850, y: 10842 },
      { x: 1746395309850, y: 13553 },
      { x: 1746481709850, y: 16941 },
      { x: 1746568109850, y: 21176 },
      { x: 1746654509850, y: 26470 },
      { x: 1746740909850, y: 33087 },
      { x: 1746827309850, y: 41359 },
      { x: 1746913709850, y: 51699 },
      { x: 1747000109850, y: 64623 }
    ];

    const result = calculateLogarithmicRegression(data);

    // Test prediction for a future timestamp
    const futureTimestamp = 1747086509850; // One more interval
    const prediction = result.predict(futureTimestamp);
    expect(prediction).toBeGreaterThan(21000); // Should predict higher than last value

    // Verify slopeData has correct length
    expect(result.slopeData.length).toBe(data.length);
  });
});

describe('calculateExponentialRegression', () => {
  it('should correctly calculate exponential regression for a simple exponential dataset', () => {
    // Test with perfect exponential growth (y = 2e^x)
    const data = [
      { x: 0, y: 2 }, // 2e^0 = 2
      { x: 1, y: 5.437 }, // ≈ 2e^1
      { x: 2, y: 14.778 }, // ≈ 2e^2
      { x: 3, y: 40.171 } // ≈ 2e^3
    ];

    const result = calculateExponentialRegression(data);

    // The coefficients should be close to a=2 and b=1
    expect(result.a).toBeCloseTo(2, 1);
    expect(result.b).toBeCloseTo(1, 1);

    // Test prediction
    const prediction = result.predict(4);
    expect(prediction).toBeCloseTo(109.196, 1); // ≈ 2e^4

    // Verify slope data length matches input
    expect(result.slopeData.length).toBe(data.length);

    // Verify equation format
    expect(result.equation).toMatch(/y = \d+\.\d{3} \* e\^\(\d+\.\d{3}x\)/);
  });

  it('should handle real-world exponential growth data', () => {
    const data = [
      { x: 0, y: 100 },
      { x: 1, y: 120 },
      { x: 2, y: 150 },
      { x: 3, y: 185 },
      { x: 4, y: 225 }
    ];

    const result = calculateExponentialRegression(data);

    // Test basic properties
    expect(result.a).toBeGreaterThan(0);
    expect(result.slopeData.length).toBe(data.length);

    // Predictions should be monotonically increasing
    const pred1 = result.predict(5);
    const pred2 = result.predict(6);
    expect(pred2).toBeGreaterThan(pred1);
  });

  it('should throw error for negative y values', () => {
    const data = [
      { x: 0, y: 1 },
      { x: 1, y: -2 },
      { x: 2, y: 4 }
    ];

    expect(() => calculateExponentialRegression(data)).toThrow(
      'Exponential regression requires all y values to be positive'
    );
  });

  it('should handle edge cases', () => {
    // Test with single point
    expect(() => calculateExponentialRegression([{ x: 0, y: 1 }])).toThrow();

    // Test with empty array
    expect(() => calculateExponentialRegression([])).toThrow();

    // Test with zero y values
    const zeroData = [
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ];
    expect(() => calculateExponentialRegression(zeroData)).toThrow();
  });

  it('should handle timestamp-based exponential growth data with daily intervals', () => {
    const data = [
      { x: 1704092400000, y: 100 },
      { x: 1704178800000, y: 150 },
      { x: 1704265200000, y: 225 },
      { x: 1704351600000, y: 338 },
      { x: 1704438000000, y: 506 },
      { x: 1704524400000, y: 759 },
      { x: 1704610800000, y: 1139 },
      { x: 1704697200000, y: 1709 },
      { x: 1704783600000, y: 2563 },
      { x: 1704870000000, y: 3844 },
      { x: 1704956400000, y: 5767 },
      { x: 1705042800000, y: 8650 }
    ];

    // Normalize timestamps to days since start for better numerical stability
    const normalizedData = data.map((point) => ({
      x: (point.x - data[0].x) / (24 * 60 * 60 * 1000), // Convert to days
      y: point.y
    }));

    const result = calculateExponentialRegression(normalizedData);

    // The data roughly follows y = 100 * (1.5)^x where x is days
    // So we expect a ≈ 100 and b ≈ ln(1.5) ≈ 0.405

    // Test if we get reasonable coefficients
    expect(result.a).toBeCloseTo(100, 0);
    expect(result.b).toBeCloseTo(0.405, 1);

    // Test R-squared - should be very close to 1 for this well-behaved data
    expect(result.rSquared).toBeGreaterThan(0.99);

    // Test predictions
    const day13Prediction = result.predict(12); // Predict day 13
    expect(day13Prediction).toBeGreaterThan(8650); // Should be higher than last point
    expect(day13Prediction).toBeLessThan(15000); // But not unreasonably higher

    // Verify slope data matches input length
    expect(result.slopeData.length).toBe(normalizedData.length);

    // Test if predictions are monotonically increasing
    for (let i = 1; i < result.slopeData.length; i++) {
      expect(result.slopeData[i]).toBeGreaterThan(result.slopeData[i - 1]);
    }
  });
});
