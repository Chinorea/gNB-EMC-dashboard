// utils.js
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