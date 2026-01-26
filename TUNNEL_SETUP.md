# 📱 Phone se Access Karne ke Liye (Different WiFi)

Agar aapka phone aur computer **different WiFi networks** par hain, to tunnel service use karein.

## Option 1: LocalTunnel (Recommended - No Signup)

### Steps:

1. **Server start karein** (pehle se hi chal raha ho to skip karein):
   ```bash
   npm start
   ```

2. **Alag terminal window mein tunnel start karein**:
   ```bash
   npm run tunnel
   ```
   
   Ya directly:
   ```bash
   npx localtunnel --port 5500
   ```

3. **Output mein ek URL milega**, jaise:
   ```
   your url is: https://random-name-123.loca.lt
   ```

4. **Yeh URL phone ke browser mein open karein** - kahin se bhi access kar sakte hain!

---

## Option 2: ngrok (More Reliable, Signup Required)

### Steps:

1. **ngrok install karein**:
   - Visit: https://ngrok.com/download
   - Ya: `npm install -g ngrok`

2. **ngrok account banayein** (free):
   - Visit: https://dashboard.ngrok.com/signup
   - Auth token copy karein

3. **ngrok configure karein**:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

4. **Server start karein** (pehle se hi chal raha ho to skip):
   ```bash
   npm start
   ```

5. **Alag terminal mein ngrok start karein**:
   ```bash
   ngrok http 5500
   ```

6. **Output mein Forwarding URL milega**, jaise:
   ```
   Forwarding  https://abc123.ngrok-free.app -> http://localhost:5500
   ```

7. **Yeh URL phone mein use karein** - kahin se bhi access kar sakte hain!

---

## ⚠️ Important Notes:

- **LocalTunnel**: Free, no signup, but URL har baar change hota hai
- **ngrok**: Free tier available, stable URL (with signup), better for production
- Tunnel service **server ke saath chalna chahiye** - dono simultaneously run karein
- Agar tunnel band ho jaye, to phir se start karein

---

## Quick Start (LocalTunnel):

```bash
# Terminal 1 - Server
npm start

# Terminal 2 - Tunnel
npm run tunnel
```

Fir jo URL mile, use phone mein open karein! 🚀
