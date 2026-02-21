# 🚀 Deployment Guide - Railway.app

## Prerequisites
- GitHub account (free)
- Railway account (free)
- Your app pushed to GitHub

## Step-by-Step Deployment

### 1. **Create GitHub Repository**
```bash
git init
git add .
git commit -m "Initial commit - Resume Upload App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/resume-upload.git
git push -u origin main
```

### 2. **Sign Up on Railway.app**
- Go to https://railway.app
- Sign up with GitHub (easiest)
- Click "New Project"

### 3. **Add MySQL Database**
- In Railway dashboard: Click "Add Service" → Select "MySQL"
- It will automatically create a MySQL instance
- Copy the connection details

### 4. **Add Node.js App**
- Click "Add Service" → Select "GitHub Repo"
- Choose your repository
- Railway will auto-detect `Procfile` and start deployment

### 5. **Set Environment Variables**
In Railway dashboard for your Node.js app:
- Click "Variables"
- Add these from your `.env.example`:

```
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
SESSION_SECRET=your-random-secret-key-here
NODE_ENV=production
```

### 6. **Connect MySQL to Node App**
- From MySQL service, copy the connection string:
  ```
  MYSQL_HOST=xxx.railway.internal
  MYSQL_PORT=3306
  MYSQL_USER=root
  MYSQL_PASSWORD=xxx
  MYSQL_DATABASE=railway
  ```
- Add these to Node app variables

### 7. **Check Logs**
- Click on your Node app
- Go to "Deployments"
- Click latest deployment → view logs
- Should see: "✅ Server is running!"

### 8. **Access Your App**
- In Railway dashboard: Click your Node app
- Find the "PUBLIC URL" (something like `https://xxx.railway.app`)
- Visit: `https://xxx.railway.app/`

---

## **Testing**

### Upload Resume
1. Go to home page
2. Fill the form
3. Upload a PDF/DOC file
4. Should see success message

### Admin Dashboard
1. Go to `/admin`
2. Login with your credentials
3. View submitted resumes
4. Download resumes
5. Contact via WhatsApp

---

## **Troubleshooting**

### "Database connection failed"
- Check MySQL credentials in variables
- Ensure `MYSQL_DATABASE=railway` (or your DB name)
- Restart the deployment

### "Port already in use"
- Don't set PORT variable, Railway assigns it automatically

### "File upload failed"
- Check `uploads/` folder permissions
- Note: Railway restarts and clears uploads folder
- Solution: Use S3/cloud storage for uploads

---

## **Production Checklist**

- ✅ Change `ADMIN_PASSWORD` to strong password
- ✅ Change `SESSION_SECRET` to random key
- ✅ Set `NODE_ENV=production`
- ✅ Enable HTTPS (Railway does this automatically)
- ✅ Test all features in production

---

## **Important Notes**

1. **Sessions in Memory**: Currently using MemoryStore
   - Sessions reset on deployment restart
   - For persistent sessions, use MongoDB or Redis

2. **File Uploads**: Stored in `uploads/` folder
   - Deleted when Railway restarts
   - Solution: Implement S3/Cloud Storage

3. **Database**: MySQL on Railway
   - Data persists across restarts
   - Automatic backups available

---

## **Next Steps (Optional)**

1. **Add MongoDB for Sessions**
   - Persist admin sessions across restarts
   - Use connection-mongo with MongoDB Atlas

2. **Add S3 for Resume Storage**
   - Persist uploaded files
   - Use AWS S3 or compatible service

3. **Custom Domain**
   - Add your domain in Railway settings
   - Point DNS to Railway's nameservers

---

## **Support**
- Railway Docs: https://docs.railway.app
- Need help? Create issue on GitHub
