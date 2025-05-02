// app/lib/generateThumbnail.js

export async function generateVideoThumbnail(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
  
      const fileURL = URL.createObjectURL(file);
      video.src = fileURL;
  
      video.onloadeddata = () => {
        video.currentTime = 1;
      };
  
      video.onseeked = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
  
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Napaka pri ustvarjanju thumbnail slike'));
          }
          URL.revokeObjectURL(fileURL);
        }, 'image/jpeg', 0.8);
      };
  
      video.onerror = () => {
        URL.revokeObjectURL(fileURL);
        reject(new Error('Napaka pri branju video datoteke za thumbnail'));
      };
    });
  }  