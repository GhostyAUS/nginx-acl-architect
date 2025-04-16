
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting custom build process...');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

try {
  // Copy public files to dist
  console.log('Copying public files...');
  if (fs.existsSync('public')) {
    const publicFiles = fs.readdirSync('public');
    for (const file of publicFiles) {
      fs.copyFileSync(
        path.join('public', file),
        path.join('dist', file)
      );
    }
  }
  
  // Create index.html directly in dist
  console.log('Creating index.html...');
  const indexContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NGINX ACL Architect</title>
    <meta name="description" content="NGINX ACL Architect - A tool for managing NGINX access control lists" />
    <link rel="stylesheet" href="index.css" />
  </head>
  <body>
    <div id="app"></div>
    <script src="main.js"></script>
  </body>
</html>
  `;
  
  fs.writeFileSync('dist/index.html', indexContent);

  // Copy CSS directly
  console.log('Copying CSS...');
  fs.copyFileSync('src/index.css', 'dist/index.css');

  // Copy JavaScript directly
  console.log('Copying JavaScript...');
  fs.copyFileSync('src/main.js', 'dist/main.js');

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
