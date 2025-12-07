#!/usr/bin/env node

import { execSync } from 'child_process';
import { mkdirSync, existsSync, writeFileSync, copyFileSync } from 'fs';
import { join, resolve } from 'path';

console.log('🚀 Building Spotter for GitHub Pages...');

// Ensure exports directory exists
const exportsDir = resolve('exports');
const githubDir = resolve('exports/github');

if (!existsSync(exportsDir)) {
  mkdirSync(exportsDir);
}

try {
  // Build the application using GitHub Pages config
  console.log('📦 Building application...');
  execSync('vite build --config vite.config.github.ts', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // Create .nojekyll file to prevent Jekyll processing
  console.log('📝 Creating .nojekyll file...');
  writeFileSync(join(githubDir, '.nojekyll'), '');

  // Create CNAME file if needed (uncomment and modify for custom domain)
  // writeFileSync(join(githubDir, 'CNAME'), 'your-domain.com');

  // Create a simple README for the GitHub Pages deployment
  const readmeContent = `# Spotter - GitHub Pages Deployment

This directory contains the built Spotter application for GitHub Pages deployment.

## Deployment Instructions

1. Push this directory to the \`gh-pages\` branch of your repository
2. Enable GitHub Pages in your repository settings
3. Point GitHub Pages to the \`gh-pages\` branch
4. Your app will be available at: \`https://username.github.io/repository-name/\`

## Files

- \`index.html\` - Main application entry point
- \`assets/\` - JavaScript, CSS, and other assets
- \`.nojekyll\` - Prevents Jekyll processing

## Built on: ${new Date().toISOString()}
`;

  writeFileSync(join(githubDir, 'README.md'), readmeContent);

  console.log('✅ GitHub Pages build complete!');
  console.log(`📁 Files exported to: ${githubDir}`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Copy the contents of exports/github/ to your gh-pages branch');
  console.log('2. Enable GitHub Pages in your repository settings');
  console.log('3. Your Spotter app will be live on GitHub Pages!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}