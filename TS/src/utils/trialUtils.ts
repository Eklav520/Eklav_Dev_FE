export const getRemainingTrialDays = () => {
  const today = new Date()

  // Last moment of the current month
  const endOfMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
    23,
    59,
    59
  )

  const diffMs = endOfMonth.getTime() - today.getTime()
  const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  return remainingDays > 0 ? remainingDays : 0
}
