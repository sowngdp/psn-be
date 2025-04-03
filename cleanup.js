const fs = require('fs');
const path = require('path');

const filesToRemove = [
  'src/services/access.service.js',
  'src/api/routes/access.routes.js',
  'src/db/models/refreshtoken.model.js',
  'src/configs/config.jwt.js',
  'src/configs/init.s3.js',
  'src/configs/init.firebasedb.js',
  'src/configs/makeBucket.js',
  'src/configs/config.bucket.js',
  'src/configs/config.firebase.js'
];

filesToRemove.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`✅ Deleted: ${filePath}`);
  } else {
    console.log(`⚠️ Not found: ${filePath}`);
  }
});

console.log('Cleanup completed!'); 