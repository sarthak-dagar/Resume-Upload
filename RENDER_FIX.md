# Fix Render Deployment Error

## Problem
Render is looking for a folder named "Backend" (capital B) but your folder is named "backend" (lowercase).

## Solution Options

### Option 1: Update Render Settings (Easiest)

1. Go to your Render dashboard
2. Select your Web Service
3. Go to **Settings** tab
4. Scroll down to **Root Directory**
5. Change from `Backend` to `backend` (lowercase)
6. Click **Save Changes**
7. Trigger a new deployment

### Option 2: Rename Folder Using Git (Recommended)

Since Windows file system is case-insensitive, use Git to rename:

```bash
# Navigate to your project
cd c:\Users\91931\OneDrive\Desktop\resume_upload

# Use git to rename (this works on Windows)
git mv backend Backend

# Commit the change
git commit -m "Rename backend to Backend for Render deployment"

# Push to GitHub
git push origin main
```

After pushing, Render will automatically detect the new folder name.

### Option 3: Create Backend Folder Manually

If the above doesn't work:

1. Create a new folder named `Backend` (capital B) in your project root
2. Copy all files from `backend` folder to `Backend` folder
3. Delete the old `backend` folder
4. Commit and push:

```bash
git add .
git commit -m "Rename backend to Backend"
git push origin main
```

## After Fixing

Make sure your Render service has these environment variables set:

- `MYSQL_HOST` - Your MySQL host
- `MYSQL_USER` - Your MySQL username  
- `MYSQL_PASSWORD` - Your MySQL password
- `MYSQL_DATABASE` - Database name (resume_upload)
- `PORT` - Usually auto-set by Render, but can be 5000

## Verify Deployment

After fixing, check:
1. Build logs show successful installation
2. Server starts without errors
3. Health check endpoint works: `https://your-app.onrender.com/`
