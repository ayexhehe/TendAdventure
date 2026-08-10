import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import type { QuizBowlSettingsDoc } from '@tindadventure/shared'
import { db } from './firebase'

const SETTINGS_REF_PATH = ['config', 'quizBowlSettings'] as const

export function subscribeToQuizBowlSettings(onChange: (settings: QuizBowlSettingsDoc | null) => void) {
  if (!db) return () => {}
  return onSnapshot(
    doc(db, ...SETTINGS_REF_PATH),
    (snapshot) => onChange(snapshot.exists() ? (snapshot.data() as QuizBowlSettingsDoc) : null),
    (error) => {
      console.error('Failed to subscribe to quiz bowl settings:', error)
      onChange(null)
    },
  )
}

export async function setNoRepeatQuestions(enabled: boolean) {
  if (!db) return
  await setDoc(doc(db, ...SETTINGS_REF_PATH), { noRepeatQuestions: enabled }, { merge: true })
}
