import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { getFirebaseFirestore, getFirebaseAuth } from "./client";
import { getCurrentAthleteUid } from "@/lib/db/firestore-client";
import { getDB, PROFILE_KEY } from "@/lib/db/dexie";
import type {
  DailyLog,
  Expense,
  FoodEntry,
  GoalTask,
  Profile,
  StudySession,
  Workout,
  WorkoutSet,
  AIWeeklyReview,
} from "@/types/database.types";

/**
 * Helper to get currently active athlete UID
 */
export function getCurrentFirebaseUid(): string {
  const auth = getFirebaseAuth();
  return auth?.currentUser?.uid || getCurrentAthleteUid();
}

/** Never write to Firestore without a signed-in account. */
function noAccount(uid: string): boolean {
  return !uid;
}

/**
 * Persist user profile and physiological targets to Cloud Firestore
 * Document path: /users/{userId}
 */
export async function saveProfileToFirestore(patch: Partial<Profile>, uid?: string): Promise<void> {
  const targetUid = uid || getCurrentFirebaseUid();
  const db = getFirebaseFirestore();
  if (!db || noAccount(targetUid)) return;

  try {
    const userRef = doc(db, "users", targetUid);
    await setDoc(
      userRef,
      {
        ...patch,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Firestore saveProfile notice:", err);
  }
}

/**
 * Persist daily log (scale weight, calories, macros, adherence) to Cloud Firestore
 * Document paths:
 * - Primary: /users/{userId}/days/{date}
 * - Backward-compatible mirror: /users/{userId}/dailyLogs/{date}
 */
export async function saveDailyLogToFirestore(date: string, patch: Partial<DailyLog>, uid?: string): Promise<void> {
  const targetUid = uid || getCurrentFirebaseUid();
  const db = getFirebaseFirestore();
  if (!db || noAccount(targetUid)) return;

  const payload = {
    ...patch,
    log_date: date,
    updatedAt: new Date().toISOString(),
  };

  try {
    // Primary schema: users/{uid}/days/{date}
    const daysRef = doc(db, "users", targetUid, "days", date);
    await setDoc(daysRef, payload, { merge: true });

    // Backward-compatibility mirror
    const compatRef = doc(db, "users", targetUid, "dailyLogs", date);
    await setDoc(compatRef, payload, { merge: true });
  } catch (err) {
    console.warn("Firestore saveDailyLog notice:", err);
  }
}

/**
 * Persist food log entry to Cloud Firestore
 * Document paths:
 * - Primary: /users/{userId}/meals/{mealId}
 * - Backward-compatible mirror: /users/{userId}/foodEntries/{mealId}
 */
export async function saveFoodEntryToFirestore(entry: FoodEntry, uid?: string): Promise<void> {
  const targetUid = uid || getCurrentFirebaseUid();
  const db = getFirebaseFirestore();
  if (!db || noAccount(targetUid)) return;

  const payload = {
    ...entry,
    updatedAt: new Date().toISOString(),
  };

  try {
    const mealRef = doc(db, "users", targetUid, "meals", entry.id);
    await setDoc(mealRef, payload);

    const compatRef = doc(db, "users", targetUid, "foodEntries", entry.id);
    await setDoc(compatRef, payload);
  } catch (err) {
    console.warn("Firestore saveFoodEntry notice:", err);
  }
}

/**
 * Remove food log entry from Cloud Firestore
 */
export async function deleteFoodEntryFromFirestore(entryId: string, uid?: string): Promise<void> {
  const targetUid = uid || getCurrentFirebaseUid();
  const db = getFirebaseFirestore();
  if (!db || noAccount(targetUid)) return;

  try {
    await deleteDoc(doc(db, "users", targetUid, "meals", entryId));
    await deleteDoc(doc(db, "users", targetUid, "foodEntries", entryId));
  } catch (err) {
    console.warn("Firestore deleteFoodEntry notice:", err);
  }
}

/**
 * Persist workout session to Cloud Firestore
 * Document path: /users/{userId}/workouts/{workoutId}
 */
export async function saveWorkoutToFirestore(workout: Workout, uid?: string): Promise<void> {
  const targetUid = uid || getCurrentFirebaseUid();
  const db = getFirebaseFirestore();
  if (!db || noAccount(targetUid)) return;

  try {
    const workoutRef = doc(db, "users", targetUid, "workouts", workout.id);
    await setDoc(workoutRef, {
      ...workout,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Firestore saveWorkout notice:", err);
  }
}

/**
 * Delete workout session from Cloud Firestore
 */
export async function deleteWorkoutFromFirestore(workoutId: string, uid?: string): Promise<void> {
  const targetUid = uid || getCurrentFirebaseUid();
  const db = getFirebaseFirestore();
  if (!db || noAccount(targetUid)) return;

  try {
    await deleteDoc(doc(db, "users", targetUid, "workouts", workoutId));
  } catch (err) {
    console.warn("Firestore deleteWorkout notice:", err);
  }
}

/**
 * Persist workout set to Cloud Firestore
 */
export async function saveWorkoutSetToFirestore(set: WorkoutSet, uid?: string): Promise<void> {
  const targetUid = uid || getCurrentFirebaseUid();
  const db = getFirebaseFirestore();
  if (!db || noAccount(targetUid)) return;

  try {
    const setRef = doc(db, "users", targetUid, "workout_sets", set.id);
    await setDoc(setRef, {
      ...set,
      updatedAt: new Date().toISOString(),
    });

    if (set.workout_id) {
      const subSetRef = doc(db, "users", targetUid, "workouts", set.workout_id, "sets", set.id);
      await setDoc(subSetRef, {
        ...set,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn("Firestore saveWorkoutSet notice:", err);
  }
}

/**
 * Delete workout set from Cloud Firestore
 */
export async function deleteWorkoutSetFromFirestore(setId: string, workoutId?: string, uid?: string): Promise<void> {
  const targetUid = uid || getCurrentFirebaseUid();
  const db = getFirebaseFirestore();
  if (!db || noAccount(targetUid)) return;

  try {
    await deleteDoc(doc(db, "users", targetUid, "workout_sets", setId));
    if (workoutId) {
      await deleteDoc(doc(db, "users", targetUid, "workouts", workoutId, "sets", setId));
    }
  } catch (err) {
    console.warn("Firestore deleteWorkoutSet notice:", err);
  }
}

/**
 * Persist study / focus session to Cloud Firestore
 * Document paths:
 * - Primary: /users/{userId}/focus/{sessionId}
 * - Backward-compatible mirror: /users/{userId}/studySessions/{sessionId}
 */
export async function saveStudySessionToFirestore(session: StudySession, uid?: string): Promise<void> {
  const targetUid = uid || getCurrentFirebaseUid();
  const db = getFirebaseFirestore();
  if (!db || noAccount(targetUid)) return;

  const payload = {
    ...session,
    updatedAt: new Date().toISOString(),
  };

  try {
    const focusRef = doc(db, "users", targetUid, "focus", session.id);
    await setDoc(focusRef, payload);

    const compatRef = doc(db, "users", targetUid, "studySessions", session.id);
    await setDoc(compatRef, payload);
  } catch (err) {
    console.warn("Firestore saveStudySession notice:", err);
  }
}

/**
 * Delete study / focus session from Cloud Firestore
 */
export async function deleteStudySessionFromFirestore(sessionId: string, uid?: string): Promise<void> {
  const targetUid = uid || getCurrentFirebaseUid();
  const db = getFirebaseFirestore();
  if (!db || noAccount(targetUid)) return;

  try {
    await deleteDoc(doc(db, "users", targetUid, "focus", sessionId));
    await deleteDoc(doc(db, "users", targetUid, "studySessions", sessionId));
  } catch (err) {
    console.warn("Firestore deleteStudySession notice:", err);
  }
}

/**
 * Persist expense transaction to Cloud Firestore
 * Document paths:
 * - Primary: /users/{userId}/txns/{txnId}
 * - Backward-compatible mirror: /users/{userId}/transactions/{txnId}
 */
export async function saveExpenseToFirestore(expense: Expense, uid?: string): Promise<void> {
  const targetUid = uid || getCurrentFirebaseUid();
  const db = getFirebaseFirestore();
  if (!db || noAccount(targetUid)) return;

  const payload = {
    ...expense,
    updatedAt: new Date().toISOString(),
  };

  try {
    const txnRef = doc(db, "users", targetUid, "txns", expense.id);
    await setDoc(txnRef, payload);

    const compatRef = doc(db, "users", targetUid, "transactions", expense.id);
    await setDoc(compatRef, payload);
  } catch (err) {
    console.warn("Firestore saveExpense notice:", err);
  }
}

/**
 * Delete expense transaction from Cloud Firestore
 */
export async function deleteExpenseFromFirestore(expenseId: string, uid?: string): Promise<void> {
  const targetUid = uid || getCurrentFirebaseUid();
  const db = getFirebaseFirestore();
  if (!db || noAccount(targetUid)) return;

  try {
    await deleteDoc(doc(db, "users", targetUid, "txns", expenseId));
    await deleteDoc(doc(db, "users", targetUid, "transactions", expenseId));
  } catch (err) {
    console.warn("Firestore deleteExpense notice:", err);
  }
}

/**
 * Persist goal / task to Cloud Firestore
 * Document path: /users/{userId}/goals_tasks/{taskId}
 */
export async function saveGoalTaskToFirestore(task: GoalTask, uid?: string): Promise<void> {
  const targetUid = uid || getCurrentFirebaseUid();
  const db = getFirebaseFirestore();
  if (!db || noAccount(targetUid)) return;

  try {
    const taskRef = doc(db, "users", targetUid, "goals_tasks", task.id);
    await setDoc(taskRef, {
      ...task,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Firestore saveGoalTask notice:", err);
  }
}

/**
 * Delete goal / task from Cloud Firestore
 */
export async function deleteGoalTaskFromFirestore(taskId: string, uid?: string): Promise<void> {
  const targetUid = uid || getCurrentFirebaseUid();
  const db = getFirebaseFirestore();
  if (!db || noAccount(targetUid)) return;

  try {
    await deleteDoc(doc(db, "users", targetUid, "goals_tasks", taskId));
  } catch (err) {
    console.warn("Firestore deleteGoalTask notice:", err);
  }
}

/**
 * Persist budget category limit to Cloud Firestore
 */
export async function saveBudgetCategoryToFirestore(
  category: string,
  monthly_limit_minor: number | null,
  uid?: string
): Promise<void> {
  const targetUid = uid || getCurrentFirebaseUid();
  const db = getFirebaseFirestore();
  if (!db || noAccount(targetUid)) return;

  try {
    const catRef = doc(db, "users", targetUid, "budget_categories", category);
    if (monthly_limit_minor === null) {
      await deleteDoc(catRef);
    } else {
      await setDoc(catRef, {
        category,
        monthly_limit_minor,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn("Firestore saveBudgetCategory notice:", err);
  }
}

/**
 * Persist weekly coach check-in recommendation to Cloud Firestore
 * Document path: /users/{userId}/coach/{checkInId}
 */
export async function saveCoachCheckInToFirestore(
  checkIn: { id: string; date: string; payload: Record<string, unknown> },
  uid?: string
): Promise<void> {
  const targetUid = uid || getCurrentFirebaseUid();
  const db = getFirebaseFirestore();
  if (!db || noAccount(targetUid)) return;

  try {
    const coachRef = doc(db, "users", targetUid, "coach", checkIn.id);
    await setDoc(coachRef, {
      ...checkIn,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Firestore saveCoachCheckIn notice:", err);
  }
}

/**
 * Persist weekly performance review to Cloud Firestore
 * Document path: /users/{userId}/reviews/{reviewId}
 */
export async function saveWeeklyReviewToFirestore(review: AIWeeklyReview, uid?: string): Promise<void> {
  const targetUid = uid || getCurrentFirebaseUid();
  const db = getFirebaseFirestore();
  if (!db || noAccount(targetUid)) return;

  try {
    const reviewRef = doc(db, "users", targetUid, "reviews", review.id);
    await setDoc(reviewRef, {
      ...review,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Firestore saveWeeklyReview notice:", err);
  }
}

/**
 * Bidirectional Sync: Hydrate local IndexedDB from Cloud Firestore.
 * Supports primary schema users/{uid}/{days,meals,workouts,focus,txns,coach,reviews}
 * with seamless fallback to legacy collections.
 */
export async function syncFirestoreWithLocalDB(uid?: string): Promise<boolean> {
  const targetUid = uid || getCurrentFirebaseUid();
  const firestore = getFirebaseFirestore();
  if (!firestore) return false;

  const localDb = getDB();

  try {
    // 1. Fetch User Profile: /users/{uid}
    const userRef = doc(firestore, "users", targetUid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const profileData = userSnap.data() as Partial<Profile>;
      await localDb.profile.put({
        id: PROFILE_KEY,
        display_name: profileData.display_name || "Ayush",
        body_weight_kg: profileData.body_weight_kg ?? 70,
        target_kcal: profileData.target_kcal ?? 2000,
        target_protein_g: profileData.target_protein_g ?? 180,
        target_carbs_g: profileData.target_carbs_g ?? 195,
        target_fat_g: profileData.target_fat_g ?? 55,
        target_sleep_hours: profileData.target_sleep_hours ?? 8,
        target_study_hours: profileData.target_study_hours ?? 4,
        pomodoro_focus_mins: profileData.pomodoro_focus_mins ?? 25,
        pomodoro_short_break_mins: profileData.pomodoro_short_break_mins ?? 5,
        pomodoro_long_break_mins: profileData.pomodoro_long_break_mins ?? 15,
        pomodoro_cycles_before_long: profileData.pomodoro_cycles_before_long ?? 4,
        currency_code: profileData.currency_code || "INR",
        monthly_budget_minor: profileData.monthly_budget_minor ?? 15000_00,
        rest_days: profileData.rest_days || [0],
        exam_crunch_mode: profileData.exam_crunch_mode ?? false,
        created_at: profileData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_status: "synced",
      });
    }

    // 2. Fetch Daily Logs: /users/{uid}/days (fallback: dailyLogs)
    let logsSnap = await getDocs(collection(firestore, "users", targetUid, "days"));
    if (logsSnap.empty) {
      logsSnap = await getDocs(collection(firestore, "users", targetUid, "dailyLogs"));
    }

    if (!logsSnap.empty) {
      await localDb.transaction("rw", localDb.dailyLogs, async () => {
        for (const docSnap of logsSnap.docs) {
          const data = docSnap.data() as DailyLog;
          await localDb.dailyLogs.put({
            ...data,
            sync_status: "synced",
          });
        }
      });
    }

    // 3. Fetch Meals: /users/{uid}/meals (fallback: foodEntries)
    let mealsSnap = await getDocs(collection(firestore, "users", targetUid, "meals"));
    if (mealsSnap.empty) {
      mealsSnap = await getDocs(collection(firestore, "users", targetUid, "foodEntries"));
    }

    if (!mealsSnap.empty) {
      await localDb.transaction("rw", localDb.foodEntries, async () => {
        for (const docSnap of mealsSnap.docs) {
          const data = docSnap.data() as FoodEntry;
          await localDb.foodEntries.put({
            ...data,
            sync_status: "synced",
          });
        }
      });
    }

    // 4. Fetch Workouts: /users/{uid}/workouts
    const workoutsSnap = await getDocs(collection(firestore, "users", targetUid, "workouts"));
    if (!workoutsSnap.empty) {
      await localDb.transaction("rw", localDb.workouts, async () => {
        for (const docSnap of workoutsSnap.docs) {
          const data = docSnap.data() as Workout;
          await localDb.workouts.put({
            ...data,
            sync_status: "synced",
          });
        }
      });
    }

    // 4b. Fetch Workout Sets: /users/{uid}/workout_sets
    const setsSnap = await getDocs(collection(firestore, "users", targetUid, "workout_sets"));
    if (!setsSnap.empty) {
      await localDb.transaction("rw", localDb.workoutSets, async () => {
        for (const docSnap of setsSnap.docs) {
          const data = docSnap.data() as WorkoutSet;
          await localDb.workoutSets.put({
            ...data,
            sync_status: "synced",
          });
        }
      });
    }

    // 5. Fetch Focus / Study: /users/{uid}/focus (fallback: studySessions)
    let focusSnap = await getDocs(collection(firestore, "users", targetUid, "focus"));
    if (focusSnap.empty) {
      focusSnap = await getDocs(collection(firestore, "users", targetUid, "studySessions"));
    }

    if (!focusSnap.empty) {
      await localDb.transaction("rw", localDb.studySessions, async () => {
        for (const docSnap of focusSnap.docs) {
          const data = docSnap.data() as StudySession;
          await localDb.studySessions.put({
            ...data,
            sync_status: "synced",
          });
        }
      });
    }

    // 6. Fetch Transactions: /users/{uid}/txns (fallback: transactions)
    let txnsSnap = await getDocs(collection(firestore, "users", targetUid, "txns"));
    if (txnsSnap.empty) {
      txnsSnap = await getDocs(collection(firestore, "users", targetUid, "transactions"));
    }

    if (!txnsSnap.empty) {
      await localDb.transaction("rw", localDb.expenses, async () => {
        for (const docSnap of txnsSnap.docs) {
          const data = docSnap.data() as Expense;
          await localDb.expenses.put({
            ...data,
            sync_status: "synced",
          });
        }
      });
    }

    // 7. Fetch Goals & Tasks: /users/{uid}/goals_tasks
    const tasksSnap = await getDocs(collection(firestore, "users", targetUid, "goals_tasks"));
    if (!tasksSnap.empty) {
      await localDb.transaction("rw", localDb.goalsTasks, async () => {
        for (const docSnap of tasksSnap.docs) {
          const data = docSnap.data() as GoalTask;
          await localDb.goalsTasks.put({
            ...data,
            sync_status: "synced",
          });
        }
      });
    }

    // 8. Fetch Reviews: /users/{uid}/reviews
    const reviewsSnap = await getDocs(collection(firestore, "users", targetUid, "reviews"));
    if (!reviewsSnap.empty) {
      await localDb.transaction("rw", localDb.weeklyReviews, async () => {
        for (const docSnap of reviewsSnap.docs) {
          const data = docSnap.data() as AIWeeklyReview;
          await localDb.weeklyReviews.put({
            ...data,
            sync_status: "synced",
          });
        }
      });
    }

    return true;
  } catch (err) {
    console.warn("Firestore sync warning:", err);
    return false;
  }
}
