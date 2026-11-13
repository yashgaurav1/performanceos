import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
  type Firestore,
} from "firebase/firestore";
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase/client";

/** The signed-in user's uid, or "" when nobody is signed in. */
export function getCurrentAthleteUid(): string {
  if (typeof window === "undefined") return "";
  return getFirebaseAuth()?.currentUser?.uid ?? "";
}

export function getDbFirestore(): Firestore | null {
  return getFirebaseFirestore();
}

/* ----------------- Document and Collection Reference Helpers ----------------- */

export function userProfileRef(uid = getCurrentAthleteUid()): DocumentReference | null {
  const db = getDbFirestore();
  return db ? doc(db, "users", uid) : null;
}

export function daysColRef(uid = getCurrentAthleteUid()): CollectionReference | null {
  const db = getDbFirestore();
  return db ? collection(db, "users", uid, "days") : null;
}

export function dayDocRef(date: string, uid = getCurrentAthleteUid()): DocumentReference | null {
  const db = getDbFirestore();
  return db ? doc(db, "users", uid, "days", date) : null;
}

export function mealsColRef(uid = getCurrentAthleteUid()): CollectionReference | null {
  const db = getDbFirestore();
  return db ? collection(db, "users", uid, "meals") : null;
}

export function mealDocRef(mealId: string, uid = getCurrentAthleteUid()): DocumentReference | null {
  const db = getDbFirestore();
  return db ? doc(db, "users", uid, "meals", mealId) : null;
}

export function workoutsColRef(uid = getCurrentAthleteUid()): CollectionReference | null {
  const db = getDbFirestore();
  return db ? collection(db, "users", uid, "workouts") : null;
}

export function workoutDocRef(workoutId: string, uid = getCurrentAthleteUid()): DocumentReference | null {
  const db = getDbFirestore();
  return db ? doc(db, "users", uid, "workouts", workoutId) : null;
}

export function workoutSetsColRef(uid = getCurrentAthleteUid()): CollectionReference | null {
  const db = getDbFirestore();
  return db ? collection(db, "users", uid, "workout_sets") : null;
}

export function workoutSetDocRef(setId: string, uid = getCurrentAthleteUid()): DocumentReference | null {
  const db = getDbFirestore();
  return db ? doc(db, "users", uid, "workout_sets", setId) : null;
}

export function focusColRef(uid = getCurrentAthleteUid()): CollectionReference | null {
  const db = getDbFirestore();
  return db ? collection(db, "users", uid, "focus") : null;
}

export function focusDocRef(sessionId: string, uid = getCurrentAthleteUid()): DocumentReference | null {
  const db = getDbFirestore();
  return db ? doc(db, "users", uid, "focus", sessionId) : null;
}

export function txnsColRef(uid = getCurrentAthleteUid()): CollectionReference | null {
  const db = getDbFirestore();
  return db ? collection(db, "users", uid, "txns") : null;
}

export function txnDocRef(txnId: string, uid = getCurrentAthleteUid()): DocumentReference | null {
  const db = getDbFirestore();
  return db ? doc(db, "users", uid, "txns", txnId) : null;
}

export function budgetCategoriesColRef(uid = getCurrentAthleteUid()): CollectionReference | null {
  const db = getDbFirestore();
  return db ? collection(db, "users", uid, "budget_categories") : null;
}

export function budgetCategoryDocRef(category: string, uid = getCurrentAthleteUid()): DocumentReference | null {
  const db = getDbFirestore();
  return db ? doc(db, "users", uid, "budget_categories", category) : null;
}

export function goalsTasksColRef(uid = getCurrentAthleteUid()): CollectionReference | null {
  const db = getDbFirestore();
  return db ? collection(db, "users", uid, "goals_tasks") : null;
}

export function goalsTaskDocRef(taskId: string, uid = getCurrentAthleteUid()): DocumentReference | null {
  const db = getDbFirestore();
  return db ? doc(db, "users", uid, "goals_tasks", taskId) : null;
}

export function coachColRef(uid = getCurrentAthleteUid()): CollectionReference | null {
  const db = getDbFirestore();
  return db ? collection(db, "users", uid, "coach") : null;
}

export function coachDocRef(checkInId: string, uid = getCurrentAthleteUid()): DocumentReference | null {
  const db = getDbFirestore();
  return db ? doc(db, "users", uid, "coach", checkInId) : null;
}

export function reviewsColRef(uid = getCurrentAthleteUid()): CollectionReference | null {
  const db = getDbFirestore();
  return db ? collection(db, "users", uid, "reviews") : null;
}

export function reviewDocRef(weekStart: string, uid = getCurrentAthleteUid()): DocumentReference | null {
  const db = getDbFirestore();
  return db ? doc(db, "users", uid, "reviews", weekStart) : null;
}

export function aiLedgerColRef(uid = getCurrentAthleteUid()): CollectionReference | null {
  const db = getDbFirestore();
  return db ? collection(db, "users", uid, "ai_ledger") : null;
}

export function aiLedgerDocRef(ledgerId: string, uid = getCurrentAthleteUid()): DocumentReference | null {
  const db = getDbFirestore();
  return db ? doc(db, "users", uid, "ai_ledger", ledgerId) : null;
}
