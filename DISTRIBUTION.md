# Horizon New Tab - Distribution Guide

## 📦 For Testing (Before Chrome Web Store Publication)

### Method 1: Direct Distribution (Recommended)

1. **Package the extension:**
   ```bash
   npm run package
   ```
   This creates a zip file in the `release/` folder.

2. **Share the zip file** with your testers

3. **Installation instructions for users:**
   - Download and extract the zip file
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the extracted `dist` folder
   - The extension should now be installed!

### Method 2: Manual Distribution

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Share the `dist` folder** directly with testers

3. **Installation steps:**
   - Copy the `dist` folder to your computer
   - Open `chrome://extensions/` in Chrome
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## ⚠️ Important Notes for Testing

### Firebase Configuration
Each tester needs to use the **same Firebase project** that you configured. The Firebase config in `src/config/firebase.ts` contains:
- Project credentials
- API keys
- Authentication settings

**Options:**
1. **Share your Firebase project** (easiest for testing)
   - Testers use your Firebase backend
   - All data syncs to your Firebase project

2. **Testers create their own Firebase projects** (more isolated)
   - Each tester needs to:
     - Create a Firebase project
     - Enable Authentication (Google Sign-in)
     - Enable Firestore
     - Replace the config in `src/config/firebase.ts`
     - Rebuild the extension

### Firestore Rules
Make sure your Firestore security rules are deployed:
```bash
firebase deploy --only firestore:rules
```

### Limitations of Developer Mode
- Chrome shows a warning: "Disable developer mode extensions"
- Extension may be disabled after Chrome restarts (need to re-enable)
- Updates require manual reload (click reload button in chrome://extensions/)

## 🚀 For Public Release (Chrome Web Store)

### Preparation

1. **Create a Developer Account**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Pay $5 one-time registration fee

2. **Prepare Store Assets**
   - Icon: 128x128px (required)
   - Screenshots: 1280x800px or 640x400px (at least 1 required)
   - Promotional images: 440x280px (optional)
   - Store description and privacy policy

3. **Create Distribution Build**
   ```bash
   npm run build
   ```

4. **Create ZIP for Web Store**
   ```bash
   cd dist
   zip -r horizon-new-tab.zip .
   ```

5. **Upload to Chrome Web Store**
   - Go to Developer Dashboard
   - Click "New Item"
   - Upload the `horizon-new-tab.zip` file
   - Fill in store listing details
   - Submit for review

### Review Process
- Initial review: 1-3 days (can take longer)
- Updates: Usually faster (few hours to 1 day)
- Address any feedback from Google reviewers

### After Publication
- Users can install directly from Chrome Web Store
- Automatic updates when you publish new versions
- No developer mode warnings
- Better user trust and security

## 🔐 Privacy & Security

Before public release, ensure:
- [ ] Privacy policy is published (required by Chrome Web Store)
- [ ] Firebase security rules are properly configured
- [ ] No hardcoded secrets or API keys (except Firebase config)
- [ ] User data handling complies with policies
- [ ] OAuth consent screen is configured in Google Cloud Console

## 📊 Version Management

Update version in `package.json`:
```json
{
  "version": "0.1.0"  // Increment for each release
}
```

Version in `manifest.json` (in `dist/` after build) should match.

## 🐛 Testing Checklist

Before distributing to testers:
- [ ] Test on clean Chrome profile
- [ ] Test with and without Google Sign-in
- [ ] Test weather location (auto and manual)
- [ ] Test favorites (add, view, remove)
- [ ] Test todo list functionality
- [ ] Test wallpaper changes
- [ ] Test settings persistence
- [ ] Check console for errors
- [ ] Test on different screen sizes

## 📞 Support

For issues during testing, users should:
1. Check Chrome DevTools Console (F12) for errors
2. Verify Firebase project is accessible
3. Report issues via GitHub issues or your support channel
