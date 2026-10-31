import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "./client";

/**
 * Uploads compressed meal photo to Firebase Storage at meals/{uid}/{id}.jpg
 */
export async function uploadMealPhotoToStorage(
  uid: string,
  mealId: string,
  imageBlob: Blob
): Promise<{ storagePath: string; downloadUrl?: string }> {
  const storagePath = `meals/${uid}/${mealId}.jpg`;
  const storage = getFirebaseStorage();
  if (!storage) {
    console.warn("Firebase Storage is not initialized on this client.");
    return { storagePath };
  }

  try {
    const storageRef = ref(storage, storagePath);
    const snap = await uploadBytes(storageRef, imageBlob, {
      contentType: "image/jpeg",
    });
    let downloadUrl: string | undefined;
    try {
      downloadUrl = await getDownloadURL(snap.ref);
    } catch {
      // download url retrieval optional
    }
    return { storagePath, downloadUrl };
  } catch (err) {
    console.warn("Firebase Storage upload notice (fallback to storagePath):", err);
    return { storagePath };
  }
}
