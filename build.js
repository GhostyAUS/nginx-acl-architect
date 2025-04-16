
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
  // Install esbuild (a fast JavaScript bundler)
  console.log('Installing esbuild...');
  execSync('npm install -g esbuild', { stdio: 'inherit' });
  
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
  
  // Copy index.html and update paths
  console.log('Setting up index.html...');
  let indexContent = fs.readFileSync('index.html', 'utf8');
  
  // Add React and ReactDOM scripts
  const scriptTags = `
    <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
    <script src="main.js"></script>
  `;
  
  indexContent = indexContent.replace(
    '<script type="module" src="/src/main.tsx"></script>',
    scriptTags
  );
  
  fs.writeFileSync('dist/index.html', indexContent);

  // Bundle JavaScript/TypeScript with improved configuration
  console.log('Bundling JavaScript...');
  execSync(
    'esbuild src/main.tsx --bundle --minify --outfile=dist/main.js --format=iife --loader:.js=jsx --loader:.ts=tsx --loader:.tsx=tsx --jsx=transform --external:react --external:react-dom', 
    { stdio: 'inherit' }
  );

  // Add CSS
  console.log('Bundling CSS...');
  execSync(
    'esbuild src/index.css --bundle --minify --outfile=dist/index.css',
    { stdio: 'inherit' }
  );

  // Add CSS link to index.html
  let finalIndexContent = fs.readFileSync('dist/index.html', 'utf8');
  finalIndexContent = finalIndexContent.replace(
    '</head>',
    '  <link rel="stylesheet" href="index.css" />\n  </head>'
  );
  fs.writeFileSync('dist/index.html', finalIndexContent);

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
