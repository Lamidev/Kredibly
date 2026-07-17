const path = require('path');
// Load environment variables from backend/.env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const cloudinary = require('../config/cloudinary');

const videoPath = 'C:\\Users\\user\\Downloads\\kreddydemo.mp4';

console.log(`Starting upload of ${videoPath} to Cloudinary...`);

cloudinary.uploader.upload(videoPath, {
    resource_type: 'video',
    public_id: 'kreddydemo',
    folder: 'kredibly_assets',
    overwrite: true
}).then(result => {
    console.log('\n=============================================');
    console.log('Upload successful!');
    console.log('Public ID:', result.public_id);
    console.log('Secure URL:', result.secure_url);
    console.log('Playback URL (optimised):', result.secure_url);
    console.log('=============================================\n');
    process.exit(0);
}).catch(err => {
    console.error('Upload failed:', err);
    process.exit(1);
});
