/**
 * Calculate splits for an expense.
 *
 * @param {number} totalAmount
 * @param {string[]} participants - array of user IDs / names
 * @param {'equal'|'exact'|'percentage'|'shares'} type
 * @param {Object} values - for exact: {userId: amount}, for percentage: {userId: pct}, for shares: {userId: shares}
 * @returns {Object} { userId: amount }
 */
export function calculateSplits(totalAmount, participants, type = 'equal', values = {}) {
  const splits = {}

  switch (type) {
    case 'equal': {
      const share = totalAmount / participants.length
      participants.forEach(p => { splits[p] = parseFloat(share.toFixed(2)) })
      // fix rounding
      const diff = parseFloat((totalAmount - Object.values(splits).reduce((a, b) => a + b, 0)).toFixed(2))
      if (diff !== 0) splits[participants[0]] = parseFloat((splits[participants[0]] + diff).toFixed(2))
      break
    }

    case 'exact': {
      participants.forEach(p => { splits[p] = parseFloat((values[p] || 0).toFixed(2)) })
      break
    }

    case 'percentage': {
      participants.forEach(p => {
        splits[p] = parseFloat(((values[p] || 0) / 100 * totalAmount).toFixed(2))
      })
      break
    }

    case 'shares': {
      const totalShares = participants.reduce((s, p) => s + (values[p] || 1), 0)
      participants.forEach(p => {
        splits[p] = parseFloat(((values[p] || 1) / totalShares * totalAmount).toFixed(2))
      })
      break
    }

    default:
      throw new Error(`Unknown split type: ${type}`)
  }

  return splits
}

/**
 * Debt simplification — minimize the number of transactions.
 * Returns array of { from, to, amount }
 */
export function simplifyDebts(balanceMap) {
  const entries = Object.entries(balanceMap).map(([person, net]) => ({ person, net }))
  const creditors = entries.filter(e => e.net > 0.01).sort((a, b) => b.net - a.net)
  const debtors = entries.filter(e => e.net < -0.01).sort((a, b) => a.net - b.net)

  const transactions = []
  let ci = 0, di = 0

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci]
    const debt = debtors[di]
    const amount = Math.min(credit.net, -debt.net)

    transactions.push({
      from: debt.person,
      to: credit.person,
      amount: parseFloat(amount.toFixed(2))
    })

    credit.net -= amount
    debt.net += amount

    if (Math.abs(credit.net) < 0.01) ci++
    if (Math.abs(debt.net) < 0.01) di++
  }

  return transactions
}
