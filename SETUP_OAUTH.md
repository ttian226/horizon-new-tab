# OAuth Setup Guide for Chrome Extension

## Problem
When distributing your extension to testers, they get "bad client id" error because each unpacked extension has a different Extension ID.

## Solution Options

### Option 1: Use a Fixed Extension ID (Recommended for Testing)

This ensures all testers use the same Extension ID.

#### Step 1: Generate a Fixed Key

1. First, get your current extension ID:
   - Load your extension in `chrome://extensions/`
   - Note the Extension ID (e.g., `abcdefghijklmnopqrstuvwxyz`)

2. Generate a private key (do this once):
   ```bash
   # In your project root
   openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out key.pem
   ```

3. Convert to public key format:
   ```bash
   openssl rsa -in key.pem -pubout -outform DER | base64 -w 0
   ```

4. Add the key to `public/manifest.json`:
   ```json
   {
     "manifest_version": 3,
     "name": "Horizon New Tab",
     "key": "YOUR_PUBLIC_KEY_HERE",
     ...
   }
   ```

#### Step 2: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. Add authorized redirect URI:
   ```
   https://YOUR_EXTENSION_ID.chromiumapp.org/
   ```
   Replace `YOUR_EXTENSION_ID` with your actual extension ID

### Option 2: Create Web-Based OAuth (Alternative)

Instead of using `chrome.identity`, use Firebase's web-based Google Sign-in.

#### Update auth.ts

```typescript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../config/firebase'

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  return result.user
}
```

#### Update manifest.json

Remove the `oauth2` section and update permissions:
```json
{
  "permissions": [
    "storage",
    "alarms"
  ]
}
```

#### Pros & Cons

**Chrome Identity (Current):**
- ✅ Better UX (no popup)
- ✅ More secure
- ❌ Requires fixed Extension ID for distribution

**Web-based Sign-in:**
- ✅ Works with any Extension ID
- ✅ Easier to distribute for testing
- ❌ Popup window (blocked by popup blockers sometimes)
- ❌ Less integrated with Chrome

### Option 3: Publish to Chrome Web Store (Best for Public Release)

Once published, you get a permanent Extension ID that never changes.

1. Create a developer account ($5 one-time fee)
2. Upload your extension
3. Get a permanent Extension ID
4. Update OAuth redirect URI with this ID

## Current Configuration

Your current `manifest.json` has:
```json
"oauth2": {
  "client_id": "1021420058440-v4bu4lri2j02gnbk92ci04f2j0hdh2fm.apps.googleusercontent.com",
  "scopes": ["openid", "email", "profile"]
}
```

## Quick Fix for Testing

For immediate testing, switch to web-based OAuth:

1. Update `src/services/auth.ts` to use `signInWithPopup`
2. Remove `oauth2` from `manifest.json`
3. Remove `"identity"` from permissions
4. Rebuild and redistribute

This will allow all testers to sign in without OAuth client ID issues.

## Recommended Approach

**For Private Testing (< 10 people):**
- Use Option 2 (web-based OAuth)
- Simple, no configuration needed
- Works immediately

**For Beta Testing (10-100 people):**
- Use Option 1 (fixed Extension ID)
- Better UX
- Requires one-time setup

**For Public Release:**
- Publish to Chrome Web Store
- Best UX and security
- One-time $5 fee + review time

## Need Help?

If you see errors like:
- "bad client id"
- "OAuth2 request failed"
- "Service responded with error"

This means the OAuth configuration doesn't match the Extension ID. Use Option 2 for quickest fix.
