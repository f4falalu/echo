import { createDayjsDate } from './date';

export const calculateLinearSlope = (data: number[]) => {
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  // Calculate sums needed for linear regression
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumXX += i * i;
  }

  // Calculate slope and intercept
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const slopeData = data.map((item, index) => slope * index + intercept);

  // Return coefficients and function to calculate y values
  return {
    slope,
    slopeData,
    intercept,
    equation: `y = ${slope.toFixed(1)}x + ${intercept.toFixed(1)}`
  };
};

export const calculateLinearSlopeByDate = (data: number[], dates: string[]) => {
  const n = data.length;

  // Convert dates to timestamps (milliseconds since epoch)
  const timestamps = dates.map((date) => createDayjsDate(date).valueOf());

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  // Calculate sums needed for linear regression
  for (let i = 0; i < n; i++) {
    sumX += timestamps[i];
    sumY += data[i];
    sumXY += timestamps[i] * data[i];
    sumXX += timestamps[i] * timestamps[i];
  }

  // Calculate slope and intercept
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate predicted values for each date point
  const slopeData = timestamps.map((timestamp) => slope * timestamp + intercept);

  // Calculate milliseconds per unit change
  const msPerUnit = 1 / slope;

  // Convert to more readable "change per day" rate
  const changePerDay = slope * (24 * 60 * 60 * 1000); // milliseconds in a day

  return {
    slope,
    slopeData,
    intercept,
    changePerDay,
    equation: `y = ${slope.toExponential(2)}x + ${intercept.toFixed(1)}`,
    predict: (date: string) => {
      const timestamp = createDayjsDate(date).valueOf();
      return slope * timestamp + intercept;
    }
  };
};

export const calculateLogarithmicRegression = (data: { x: number; y: number }[]) => {
  if (data.length === 0) {
    throw new Error('No data provided.');
  }

  const xOffset = data[0].x; // normalize relative to first x value
  const normalized = data.map(({ x, y }) => ({
    x: (x - xOffset) / (24 * 60 * 60 * 1000), // Convert to days for better numerical stability
    y
  }));

  const filtered = normalized.filter((point) => point.x >= 0);
  const n = filtered.length;

  if (n === 0) {
    throw new Error('No valid data points with x >= base timestamp.');
  }

  let sumLnX = 0;
  let sumY = 0;
  let sumLnX2 = 0;
  let sumYLnX = 0;

  for (const { x, y } of filtered) {
    const lnX = Math.log(x + 1); // Add 1 to handle x=0 case
    sumLnX += lnX;
    sumY += y;
    sumLnX2 += lnX * lnX;
    sumYLnX += y * lnX;
  }

  const denominator = n * sumLnX2 - sumLnX * sumLnX;
  if (denominator === 0) {
    throw new Error('Denominator is zero. Cannot compute regression.');
  }

  const b = (n * sumYLnX - sumY * sumLnX) / denominator;
  const a = (sumY - b * sumLnX) / n;

  const predict = (x: number) => {
    const normalizedX = (x - xOffset) / (24 * 60 * 60 * 1000);
    if (normalizedX < 0) {
      throw new Error('Cannot predict for x < base timestamp.');
    }
    return a + b * Math.log(normalizedX + 1);
  };

  const slopeData = data.map(({ x }) => ({
    x,
    y: predict(x)
  }));

  return {
    a,
    b,
    slopeData,
    equation: `y = ${a.toFixed(1)} + ${b.toFixed(1)} * ln((x - ${xOffset}) / ${24 * 60 * 60 * 1000} + 1)`,
    predict
  };
};

export const calculateExponentialRegression = (data: { x: number; y: number }[]) => {
  // Input validation
  if (data.length < 2) {
    throw new Error('At least two data points are required for exponential regression');
  }

  // Validate data - all y values must be positive
  if (data.some((point) => point.y <= 0)) {
    throw new Error('Exponential regression requires all y values to be positive');
  }

  const n = data.length;

  // Normalize x values relative to the first x value for numerical stability
  const xOffset = data[0].x;
  const normalizedData = data.map((point) => ({
    x: point.x - xOffset,
    y: point.y
  }));

  // If x values are large (e.g., timestamps), scale them down
  const maxX = Math.max(...normalizedData.map((p) => Math.abs(p.x)));
  const xScaleFactor = maxX > 1000 ? maxX : 1;

  // Apply scaling to x values
  normalizedData.forEach((point) => {
    point.x = point.x / xScaleFactor;
  });

  let sumX = 0;
  let sumLnY = 0;
  let sumXLnY = 0;
  let sumXX = 0;

  // Transform to linear space using natural log
  // For y = ae^(bx), ln(y) = ln(a) + bx
  for (const { x, y } of normalizedData) {
    const lnY = Math.log(y);
    sumX += x;
    sumLnY += lnY;
    sumXLnY += x * lnY;
    sumXX += x * x;
  }

  // Calculate coefficients
  const denominator = n * sumXX - sumX * sumX;
  if (Math.abs(denominator) < 1e-10) {
    throw new Error('Cannot compute regression: x values are all identical');
  }

  const b = (n * sumXLnY - sumX * sumLnY) / denominator;
  const lnA = (sumLnY - b * sumX) / n;
  const a = Math.exp(lnA);

  // Adjust b coefficient for the x scaling
  const bScaled = b / xScaleFactor;

  // Create predict function that handles the original x scale
  const predict = (x: number) => {
    const xNormalized = (x - xOffset) / xScaleFactor;
    return a * Math.exp(b * xNormalized);
  };

  // Calculate fitted values and R-squared
  const yMean = data.reduce((sum, point) => sum + point.y, 0) / n;
  let ssRes = 0; // Sum of squares of residuals
  let ssTot = 0; // Total sum of squares

  const slopeData = data.map((point) => {
    const yPred = predict(point.x);
    ssRes += Math.pow(point.y - yPred, 2);
    ssTot += Math.pow(point.y - yMean, 2);
    return yPred;
  });

  const rSquared = 1 - ssRes / ssTot;

  return {
    a, // coefficient (y = ae^(bx))
    b: bScaled, // exponent coefficient (adjusted for x scale)
    rSquared, // goodness of fit
    slopeData, // fitted y values
    equation: `y = ${a.toFixed(3)} * e^(${bScaled.toExponential(3)}x)`,
    predict // function to predict y for any x
  };
};

export const calculatePolynomialRegression = (
  data: { x: number; y: number }[],
  degree: number = 2
) => {
  const n = data.length;

  // Compute sums for matrix elements
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXXX = 0;
  let sumXXXX = 0;
  let sumXY = 0;
  let sumXXY = 0;

  for (let i = 0; i < n; i++) {
    const { x, y } = data[i];
    const xx = x * x;
    const xxx = xx * x;
    const xxxx = xx * xx;

    sumX += x;
    sumY += y;
    sumXX += xx;
    sumXXX += xxx;
    sumXXXX += xxxx;
    sumXY += x * y;
    sumXXY += xx * y;
  }

  let a: number, b: number, c: number;

  if (degree === 1) {
    // Linear regression: y = ax + b
    const denominator = n * sumXX - sumX * sumX;
    a = (n * sumXY - sumX * sumY) / denominator;
    b = (sumY * sumXX - sumX * sumXY) / denominator;
    c = 0;

    return {
      coefficients: [b, a],
      equation: `y = ${b.toFixed(3)} + ${a.toFixed(3)}x`,
      predict: (x: number) => a * x + b,
      type: 'linear'
    };
  } else {
    // Quadratic regression: y = ax² + bx + c
    const matrix = [
      [n, sumX, sumXX],
      [sumX, sumXX, sumXXX],
      [sumXX, sumXXX, sumXXXX]
    ];

    const vector = [sumY, sumXY, sumXXY];

    // Solve system of equations using Cramer's rule
    const D = determinant3x3(matrix);

    const matrix1 = [
      [vector[0], matrix[0][1], matrix[0][2]],
      [vector[1], matrix[1][1], matrix[1][2]],
      [vector[2], matrix[2][1], matrix[2][2]]
    ];

    const matrix2 = [
      [matrix[0][0], vector[0], matrix[0][2]],
      [matrix[1][0], vector[1], matrix[1][2]],
      [matrix[2][0], vector[2], matrix[2][2]]
    ];

    const matrix3 = [
      [matrix[0][0], matrix[0][1], vector[0]],
      [matrix[1][0], matrix[1][1], vector[1]],
      [matrix[2][0], matrix[2][1], vector[2]]
    ];

    c = determinant3x3(matrix1) / D;
    b = determinant3x3(matrix2) / D;
    a = determinant3x3(matrix3) / D;

    const predict = (x: number) => {
      return a * x * x + b * x + c;
    };

    const slopeData: number[] = data.map((item) => {
      return predict(item.x);
    });

    return {
      coefficients: [c, b, a],
      equation: `y = ${a.toFixed(3)}x² + ${b.toFixed(3)}x + ${c.toFixed(3)}`,
      predict,
      type: 'quadratic',
      slopeData: slopeData
    };
  }
};

// Helper function to calculate 3x3 determinant
const determinant3x3 = (matrix: number[][]) => {
  return (
    matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
    matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
    matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])
  );
};

export const calculateLinearRegression = (data: { x: number; y: number }[]) => {
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  // Calculate sums needed for linear regression
  for (let i = 0; i < n; i++) {
    const { x, y } = data[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  // Calculate slope (m) and intercept (b)
  const predict = (x: number) => {
    return slope * x + intercept;
  };
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Return the equation of the line
  return {
    slopeData: data.map((item) => predict(item.x)),
    intercept,
    equation: `y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`,
    predict
  };
};
