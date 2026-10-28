import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import type { ImageType } from "react-images-uploading";
import { storage } from "../firebase_storage";

export async function uploadProfilePictures(image: ImageType, editionId: string, ownerId: string,
  onProgress: (progress: number) => void) {
  const path = `${editionId}/${ownerId}/${uuidv4()}`;
  const upload = (file: File, name: string, progress?: (value: number) => void) => new Promise<string>((resolve, reject) => {
    const task = uploadBytesResumable(ref(storage, name), file);
    task.on("state_changed", snapshot => progress?.(snapshot.bytesTransferred / snapshot.totalBytes * 100), reject,
      () => { void getDownloadURL(task.snapshot.ref).then(resolve, reject); });
  });
  const [picture, thumbnail] = await Promise.all([
    upload(image.file!, path, onProgress),
    image.thumbnailFile ? upload(image.thumbnailFile, `${path}-thumb`) : Promise.resolve(undefined),
  ]);
  return { picture, pictureThumbnail: thumbnail ?? picture };
}
