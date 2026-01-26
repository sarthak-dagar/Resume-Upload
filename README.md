# Resume Upload Application

A Node.js web application for collecting resume submissions with form data and file uploads.

## Features

- 📝 Resume upload form (PDF, DOC, DOCX)
- 💾 MySQL database storage
- 📧 Email and contact information collection
- 📱 Responsive design

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/resume_upload.git
   cd resume_upload
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   ```bash
   cp .env.example .env
   ```
   - Edit `.env` and add your database credentials:
   ```env
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password_here
   MYSQL_DATABASE=resume_upload
   PORT=5500
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the application**
   - Open your browser and go to `http://localhost:5500`

## Deployment Options

### Option 1: Deploy to Heroku

1. **Install Heroku CLI** (if not already installed)
   - Download from [heroku.com](https://devcenter.heroku.com/articles/heroku-cli)

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create a Heroku app**
   ```bash
   heroku create your-app-name
   ```

4. **Add MySQL addon** (JawsDB or ClearDB)
   ```bash
   heroku addons:create jawsdb:kitefin
   ```

5. **Set environment variables**
   ```bash
   heroku config:set MYSQL_HOST=your_host
   heroku config:set MYSQL_USER=your_user
   heroku config:set MYSQL_PASSWORD=your_password
   heroku config:set MYSQL_DATABASE=your_database
   ```

6. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 2: Deploy to Railway

1. **Go to [railway.app](https://railway.app)** and sign up/login
2. **Create a new project** → "Deploy from GitHub repo"
3. **Connect your GitHub repository**
4. **Add MySQL service** in Railway dashboard
5. **Set environment variables** in the Variables tab
6. **Deploy** - Railway will automatically deploy on push

### Option 3: Deploy to Render

1. **Go to [render.com](https://render.com)** and sign up/login
2. **Create a new Web Service** → "Connect GitHub"
3. **Select your repository**
4. **Configure:**
   - Build Command: `npm install`
   - Start Command: `npm start`
5. **Add MySQL database** (separate service)
6. **Set environment variables** in the Environment tab
7. **Deploy**

### Option 4: Deploy to DigitalOcean App Platform

1. **Go to [digitalocean.com](https://www.digitalocean.com)**
2. **Create App** → "GitHub" → Select repository
3. **Configure build settings**
4. **Add MySQL database** component
5. **Set environment variables**
6. **Deploy**

### Option 5: Deploy to VPS (Ubuntu/Debian)

1. **SSH into your server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js and MySQL**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo apt-get install mysql-server
   ```

3. **Clone and setup**
   ```bash
   git clone https://github.com/yourusername/resume_upload.git
   cd resume_upload
   npm install
   cp .env.example .env
   nano .env  # Edit with your database credentials
   ```

4. **Use PM2 to keep server running**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name resume-upload
   pm2 save
   pm2 startup
   ```

5. **Setup Nginx reverse proxy** (optional)
   ```bash
   sudo apt-get install nginx
   # Configure nginx to proxy to localhost:5500
   ```

## GitHub Setup

### Initial Setup

1. **Initialize Git** (if not already done)
   ```bash
   git init
   ```

2. **Add all files**
   ```bash
   git add .
   ```

3. **Commit**
   ```bash
   git commit -m "Initial commit"
   ```

4. **Create repository on GitHub**
   - Go to [github.com](https://github.com)
   - Click "New repository"
   - Name it `resume_upload`
   - Don't initialize with README (you already have one)

5. **Connect and push**
   ```bash
   git remote add origin https://github.com/yourusername/resume_upload.git
   git branch -M main
   git push -u origin main
   ```

### Important Notes

- ⚠️ **Never commit `.env` file** - it contains sensitive credentials
- ⚠️ **Never commit `uploads/` folder** - it contains user data
- ✅ The `.gitignore` file is already configured to exclude these

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_HOST` | MySQL server host | `localhost` |
| `MYSQL_USER` | MySQL username | `root` |
| `MYSQL_PASSWORD` | MySQL password | (required) |
| `MYSQL_DATABASE` | Database name | `resume_upload` |
| `PORT` | Server port | `5500` |

## Project Structure

```
resume_upload/
├── server.js          # Express server
├── index.html         # Frontend form
├── style.css          # Styling
├── package.json       # Dependencies
├── .env.example       # Environment template
├── .gitignore         # Git ignore rules
└── uploads/           # Uploaded files (not in git)
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
