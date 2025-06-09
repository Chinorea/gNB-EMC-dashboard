// utils.js

// Helper function to convert battery voltage to percentage
export function getBatteryPercentage(voltageString) {
  // Extract numeric value from voltage string (e.g., "8.25V" -> 8.25)
  const voltage = parseFloat(voltageString);

  // Return 'unknown' if parsing fails
  if (isNaN(voltage)) return 'unknown';

  // Battery voltage range: 8.60V (100%) to 7.62V (40%)
  // Extrapolate to 1% using linear behavior
  const MAX_VOLTAGE = 8.6; // 100%
  const MIN_VOLTAGE = 7.0; // 1% (extrapolated from linear trend)
  const MAX_PERCENTAGE = 100;
  const MIN_PERCENTAGE = 1;

  // Clamp voltage to valid range
  const clampedVoltage = Math.max(MIN_VOLTAGE, Math.min(MAX_VOLTAGE, voltage));

  // Linear interpolation
  const voltageRange = MAX_VOLTAGE - MIN_VOLTAGE;
  const percentageRange = MAX_PERCENTAGE - MIN_PERCENTAGE;
  const percentage = MIN_PERCENTAGE + ((clampedVoltage - MIN_VOLTAGE) / voltageRange) * percentageRange;

  return Math.round(percentage);
}

export default function buildStaticLQM(
  nodeInfos,
  rawMatrix,
  oldLQM,
  maxNodes = 100,
  defaultValue = null
) {
  // 1) build a map from nodeID → index in rawMatrix
  const idToRawIdx = nodeInfos.reduce((acc, { id }, idx) => {
    acc[id] = idx
    return acc
  }, {})

  // // 2) allocate the static matrix
  // const lqm = Array.from({ length: maxNodes }, () =>
  //   Array(maxNodes).fill(defaultValue)
  // )

  // 2) initialize base matrix: clone oldLQM if valid, else build fresh
  const hasOld =
    Array.isArray(oldLQM) &&
    oldLQM.length === maxNodes &&
    oldLQM.every(row => Array.isArray(row) && row.length === maxNodes);

  const lqm = hasOld
    ? oldLQM.map(row => row.slice())         // deep‐clone existing rows
    : Array.from({ length: maxNodes }, () => // new empty matrix
        Array(maxNodes).fill(defaultValue)
      );


  // 3) fill in only the IDs we know about
  for (const id1 in idToRawIdx) {
    const i = idToRawIdx[id1]
    for (const id2 in idToRawIdx) {
      const j = idToRawIdx[id2]
      const x = Number(id1)
      const y = Number(id2)
      // only if within your maxNodes range
      if (x < maxNodes && y < maxNodes) {
        lqm[x][y] = rawMatrix[i]?.[j] ?? defaultValue
      }
    }
  }

  return lqm
}