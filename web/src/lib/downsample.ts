export type DataPoint = Record<string, string | number | null | Date>;

/**
 * Uniform sampling - selects points at regular intervals
 * @param data - Array of data points to downsample
 * @param targetPoints - Target number of points in the downsampled dataset
 * @returns Downsampled array with exactly targetPoints number of points (or original if already smaller)
 */
export function uniformSampling(data: DataPoint[] | null, targetPoints: number): DataPoint[] {
  if (!data || data.length <= targetPoints) {
    return data || [];
  }

  const result: DataPoint[] = [];

  // Always include the first and last points
  result.push(data[0]);

  // If we only want 2 points, just return first and last
  if (targetPoints === 2) {
    result.push(data[data.length - 1]);
    return result;
  }

  // Calculate the step size to get targetPoints - 2 intermediate points
  const step = (data.length - 2) / (targetPoints - 2);

  // Select intermediate points at regular intervals
  for (let i = 1; i < targetPoints - 1; i++) {
    const index = Math.floor(1 + i * step);
    result.push(data[index]);
  }

  // Add the last point
  result.push(data[data.length - 1]);

  return result;
}

/**
 * Random sampling - selects points randomly
 * @param data - Array of data points to downsample
 * @param targetPoints - Target number of points in the downsampled dataset
 * @param preserveEnds - Whether to always include the first and last points (default: true)
 * @returns Downsampled array with exactly targetPoints number of points (or original if already smaller)
 */
export function randomSampling(
  data: DataPoint[] | null,
  targetPoints: number,
  preserveEnds: boolean = true
): DataPoint[] {
  if (!data || data.length <= targetPoints) {
    return data || [];
  }

  if (preserveEnds && targetPoints < 2) {
    return data.slice(0, 1); // Return just the first point if targetPoints is 1
  }

  // If preserving ends, adjust target to account for first and last points
  const adjustedTarget = preserveEnds ? targetPoints - 2 : targetPoints;
  const result: DataPoint[] = [];

  if (preserveEnds) {
    result.push(data[0]); // Add first point
  }

  // Create an array of available indices (excluding first and last if preserveEnds)
  const availableIndices: number[] = [];
  const startIdx = preserveEnds ? 1 : 0;
  const endIdx = preserveEnds ? data.length - 1 : data.length;

  for (let i = startIdx; i < endIdx; i++) {
    availableIndices.push(i);
  }

  // Randomly select indices
  for (let i = 0; i < adjustedTarget && availableIndices.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableIndices.length);
    const dataIndex = availableIndices[randomIndex];

    // Remove the selected index from available indices
    availableIndices.splice(randomIndex, 1);

    result.push(data[dataIndex]);
  }

  if (preserveEnds) {
    result.push(data[data.length - 1]); // Add last point
  }

  // Sort the result by the original index to maintain order
  if (!preserveEnds) {
    result.sort((a, b) => {
      const aIndex = data.indexOf(a);
      const bIndex = data.indexOf(b);
      return aIndex - bIndex;
    });
  }

  return result;
}
