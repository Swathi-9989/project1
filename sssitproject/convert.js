import sharp from "sharp";
import fs from "fs";

const inputDir = "./src/assets";
const outputDir = "./src/assets";

fs.readdirSync(inputDir).forEach(file => {
  if (file.endsWith(".png") || file.endsWith(".jpg")) {
    sharp(`${inputDir}/${file}`)
      .webp({ quality: 80 })
      .toFile(`${outputDir}/${file.replace(/\.(png|jpg)/, ".webp")}`);
  }
});
