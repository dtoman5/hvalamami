// app/lib/compressImage.js

import imageCompression from 'browser-image-compression';

/**
 * @param {File} file - originalna datoteka
 * @returns {Promise<File>} - kompresirana datoteka ali originalna, če pride do napake
 */
export async function compressImage(file) {
  const options = {
    maxSizeMB: 3, // Večja kot privzeta, da ne zmanjša če ni treba
    maxWidthOrHeight: 750,
    useWebWorker: true,
    initialQuality: 0.8,
    alwaysKeepResolution: true
  };

  try {
    const compressedFile = await imageCompression(file, options);

    // Dodatna preverjanja, če je kompresirana datoteka realno manjša
    if (compressedFile.size < file.size) {
      return compressedFile;
    }
    return file; // Če ni bila realno zmanjšana, vrni original
  } catch (error) {
    console.error('[CompressImage] Napaka pri kompresiji:', error);
    return file;
  }
}