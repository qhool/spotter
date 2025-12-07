# GitHub Pages Deployment Guide for Spotter

This guide explains how to deploy the Spotter application to GitHub Pages.

## 🚀 Automated Deployment (Recommended)

**GitHub Actions will automatically deploy your app when you push to the main branch!**

### Setup Steps:

1. **Add Spotify Client ID as GitHub Secret**:
   - Go to your repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `VITE_SPOTIFY_CLIENT_ID`
   - Value: `009b089083604673aabc1bc1df487f3f` (your Spotify app client ID)

2. **Update Spotify App Settings**:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Edit your Spotter app
   - Add `https://qhool.github.io/spotter/` to the Redirect URIs list

3. **Enable GitHub Pages** in your repository:
   - Go to Settings → Pages
   - Select "GitHub Actions" as the source

4. **Choose a workflow** (two options provided):
   - **Option A**: `deploy-github-pages.yml` - Uses official GitHub Pages actions
   - **Option B**: `deploy-github-pages-simple.yml` - Uses peaceiris/actions-gh-pages (simpler)

   **Which to use?**
   - Use **Option A** if you want the latest official GitHub Pages workflow
   - Use **Option B** if you want a simpler, more widely-used solution
   - **Delete the one you don't want** to avoid confusion

5. **Push your code**:
   ```bash
   git add .
   git commit -m "Add GitHub Actions deployment"
   git push origin main
   ```

6. **Watch the magic happen**:
   - Go to Actions tab to see the deployment progress
   - Your app will be live at `https://qhool.github.io/spotter/`

### Workflow Features:

- ✅ **Automatic builds** on every push to main
- ✅ **Manual triggers** via GitHub Actions tab
- ✅ **Dependency caching** for faster builds  
- ✅ **Proper permissions** configured automatically
- ✅ **Concurrent deployment protection** 

## 📱 Manual Deployment (Backup Method)

If you prefer manual control, you can still use:

```bash
npm run build:github
```

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

### GitHub Actions Issues:
- **"Pages not enabled"**: Go to Settings → Pages → Select "GitHub Actions" source
- **Build fails**: Check Actions tab for error logs
- **Permission denied**: Ensure repository has Pages enabled and proper permissions
- **Workflow not running**: Push to main branch or trigger manually in Actions tab
- **Empty Client ID**: Ensure `VITE_SPOTIFY_CLIENT_ID` secret is set in repository settings

### Spotify Authentication Issues:
- **"Invalid redirect URI"**: Add `https://qhool.github.io/spotter/` to your Spotify app's redirect URIs
- **"Invalid client ID"**: Verify the client ID secret matches your Spotify app
- **Auth not working**: Check browser console for CORS or redirect errors

### Application Issues:
- **404 errors**: Ensure the `base: './'` setting in vite.config.github.ts
- **Blank page**: Check browser console for JavaScript errors
- **Spotify auth**: Verify redirect URIs in Spotify app settings include your GitHub Pages URL
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