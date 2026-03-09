import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { storage } from './firebase';
import { updateUser } from './firestoreService';

/**
 * Opens the image library, lets user pick a square-cropped photo,
 * uploads it to Firebase Storage under avatars/{uid}.jpg,
 * saves the downloadURL to Firestore users/{uid}.photoURL,
 * and returns the download URL.
 *
 * Returns null if the user cancelled.
 * Throws on permission denial or upload failure.
 */
export async function pickAndUploadAvatar(uid, onProgress) {
  // 1. Request media library permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Galeri iznine ihtiyaç var. Lütfen ayarlardan izin ver.');
  }

  // 2. Launch image picker — square crop, moderate quality
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.75,
  });

  if (result.canceled) return null;

  const uri = result.assets[0].uri;

  // 3. Convert URI to blob for Firebase upload
  const response = await fetch(uri);
  const blob = await response.blob();

  // 4. Upload to Firebase Storage
  const storageRef = ref(storage, `avatars/${uid}.jpg`);
  await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, blob, { contentType: 'image/jpeg' });
    task.on(
      'state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      reject,
      resolve,
    );
  });

  // 5. Get public URL
  const downloadURL = await getDownloadURL(storageRef);

  // 6. Persist to Firestore
  await updateUser(uid, { photoURL: downloadURL });

  return downloadURL;
}
