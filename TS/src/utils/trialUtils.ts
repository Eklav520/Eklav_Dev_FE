import { TRIAL_START_DATE, TRIAL_DAYS } from './trialConfig'

export const getRemainingTrialDays = () => {
  const today = new Date()
  const diff = Math.floor(
    (today.getTime() - TRIAL_START_DATE.getTime()) / (1000 * 60 * 60 * 24)
  )

  const remaining = TRIAL_DAYS - diff
  return remaining > 0 ? remaining : 0
}
