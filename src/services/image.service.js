

const axios = require('axios');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

async function getImageInput(imageUrl) {
  if (/^https?:\/\//.test(imageUrl)) {
    const res = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
  } else {
    return imageUrl;
  }
}

async function composeImages(imageList, canvasWidth = null, canvasHeight = null) {
  const imageInputs = await Promise.all(imageList.map(item => getImageInput(item.imageUrl)));

  const metadatas = await Promise.all(
    imageInputs.map(input => sharp(input).metadata())
  );

  const width = canvasWidth || Math.max(...metadatas.map(m => m.width));
  const height = canvasHeight || Math.max(...metadatas.map(m => m.height));

  const base = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  });

  function calcPosition(position, imgWidth, imgHeight, canvasWidth, canvasHeight) {
    let left = 0, top = 0;
    switch (position) {
      case 'top-left':        left = 0; top = 0; break;
      case 'top-center':      left = Math.floor((canvasWidth - imgWidth) / 2); top = 0; break;
      case 'top-right':       left = canvasWidth - imgWidth; top = 0; break;
      case 'middle-left':     left = 0; top = Math.floor((canvasHeight - imgHeight) / 2); break;
      case 'middle-center':   left = Math.floor((canvasWidth - imgWidth) / 2); top = Math.floor((canvasHeight - imgHeight) / 2); break;
      case 'middle-right':    left = canvasWidth - imgWidth; top = Math.floor((canvasHeight - imgHeight) / 2); break;
      case 'bottom-left':     left = 0; top = canvasHeight - imgHeight; break;
      case 'bottom-center':   left = Math.floor((canvasWidth - imgWidth) / 2); top = canvasHeight - imgHeight; break;
      case 'bottom-right':    left = canvasWidth - imgWidth; top = canvasHeight - imgHeight; break;
      default: left = 0; top = 0;
    }
    return { left, top };
  }

  const compositeList = imageList.map((item, i) => {
    const pos = calcPosition(
      item.position,
      metadatas[i].width,
      metadatas[i].height,
      width,
      height
    );
    return {
      input: imageInputs[i],
      left: pos.left,
      top: pos.top
    };
  });

  // === Tạo tên file random và full path trong tmp dir ===
  const tmpDir = os.tmpdir(); // thư mục tmp cross-platform
  const fileName = `${uuidv4()}.png`; // random file name
  const outputPath = path.join(tmpDir, fileName);

  await base.composite(compositeList).toFile(outputPath);

  // Có thể return outputPath luôn, hoặc check tồn tại cho chắc
  if (fs.existsSync(outputPath)) {
    console.log('Image composition completed successfully:', outputPath);
    return outputPath;
  } else {
    throw new Error('Failed to create image file');
  }
}

module.exports = {
  composeImages
};
