import { partition, repeat, unnest, zipWith, of } from 'ramda'

const forceArrLength = (len, defaultVal) => arr => {
  return [
    ...repeat(defaultVal, len - arr.length),
    ...arr
  ]
}

function zipFromLast(a, b) {
  const maxLength = Math.max(a.length, b.length)
  const [a2, b2] = [a, b].map(forceArrLength(maxLength, []))
  return zipWith(
    (a, b) => [...a, ...b],
    a2,
    b2
  )
}

export function traverseTreeFromFinal(output, edges) {
  const [adjEdges, otherEdges] = partition(({ output: eO }) => eO === output, edges)

  const { acc, remainingEdges } = adjEdges.reduce(({ acc, remainingEdges }, edge) => {
    const [res, unusedEdges] = traverseTreeFromFinal(edge.input, remainingEdges)
    return {
      acc: zipFromLast(acc, res),
      remainingEdges: unusedEdges
    }
  }, {acc: [], remainingEdges: otherEdges})

  return [[...acc, adjEdges], remainingEdges]
}

