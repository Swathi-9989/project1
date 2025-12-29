export const convertToWebP = (file, quality = 0.80) => {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          const webpFile = new File(
            [blob],
            file.name.replace(/\.(jpg|jpeg|png)$/i, ".webp"),
            { type: "image/webp" }
          );
          resolve(webpFile);
        },
        "image/webp",
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};
