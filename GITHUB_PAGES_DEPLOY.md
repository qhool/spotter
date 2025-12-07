# GitHub Pages Deployment Guide for Spotter

This guide explains how to deploy the Spotter application to GitHub Pages.

## Quick Deploy

Run this command to build the application for GitHub Pages:

```bash
npm run build:github
```

This creates a complete, deployable version of Spotter in the `exports/github/` directory.

## Deployment Methods

### Method 1: Manual Upload (Easiest)

1. Run `npm run build:github`
2. Copy all files from `exports/github/` to your repository's root
3. Push to GitHub
4. Go to your repository settings → Pages
5. Select "Deploy from a branch" → "main branch" → "/ (root)"

### Method 2: gh-pages Branch (Recommended)

1. Run `npm run build:github`
2. Create and switch to a `gh-pages` branch:
   ```bash
   git checkout --orphan gh-pages
   git rm -rf .
   ```
3. Copy files from `exports/github/`:
   ```bash
   cp -r exports/github/* .
   cp exports/github/.nojekyll .
   ```
4. Commit and push:
   ```bash
   git add .
   git commit -m "Deploy Spotter to GitHub Pages"
   git push origin gh-pages
   ```
5. Go to repository settings → Pages → Select "gh-pages" branch

### Method 3: GitHub Actions (Advanced)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build for GitHub Pages
      run: npm run build:github
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: \${{ secrets.GITHUB_TOKEN }}
        publish_dir: exports/github
```

## What Gets Exported

The build process creates:

- **Complete Spotter app**: All React components, data handlers, CSS
- **Optimized bundles**: Separate chunks for vendor libraries and Spotify SDK
- **Static assets**: Images, icons, and other resources
- **GitHub Pages config**: `.nojekyll` file to prevent Jekyll processing
- **Deployment readme**: Instructions and build timestamp

## Accessing Your Deployed App

Your app will be available at:
- **Public repo**: `https://username.github.io/repository-name/`
- **Custom domain**: Configure in repository settings → Pages

## Important Notes

- **Spotify OAuth**: You'll need to update your Spotify app settings to include your GitHub Pages URL as a redirect URI
- **HTTPS Only**: GitHub Pages serves over HTTPS, which Spotify requires
- **Custom Domain**: Optional - you can configure a custom domain in repository settings
- **Build Time**: The app builds in ~3 seconds and results in ~245KB total assets

## Troubleshooting

- **404 errors**: Ensure the `base: './'` setting in vite.config.github.ts
- **Blank page**: Check browser console for JavaScript errors
- **Spotify auth**: Verify redirect URIs in Spotify app settings
- **Assets not loading**: Verify all paths are relative (should start with `./`)

## File Structure

```
exports/github/
├── index.html          # Main app entry point
├── .nojekyll          # Prevents Jekyll processing  
├── README.md          # Deployment info
├── assets/
│   ├── index-*.js     # Main application bundle
│   ├── vendor-*.js    # React/React-DOM
│   ├── spotify-*.js   # Spotify Web API SDK
│   └── index-*.css    # All app styles
└── images/            # Static images/icons
```