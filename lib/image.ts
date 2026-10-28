export function readImage(file: File, max = 900): Promise<string> {
  return new Promise((res, rej) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return rej(new Error("Please choose a JPG, PNG or WebP photo."));
    if (file.size > 8 * 1024 * 1024) return rej(new Error("That photo is larger than 8 MB. Please choose a smaller one."));
    const fr = new FileReader();
    fr.onerror = () => rej(new Error("That photo could not be read. Try another one."));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => rej(new Error("That photo could not be read. Try another one."));
      im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d")!.drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", 0.82)); };
      im.src = fr.result as string;
    };
    fr.readAsDataURL(file);
  });
}
