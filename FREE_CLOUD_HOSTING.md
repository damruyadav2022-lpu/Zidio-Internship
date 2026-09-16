# RetailPulse: 100% Free Cloud Hosting & Deployment Guide

This guide details how to launch RetailPulse on **free cloud hosting platforms** with automated GitHub integration, free SSL/HTTPS, and zero credit card required.

---

## 🏆 Option 1: Render.com (Recommended — 1-Click Setup)

Render provides a generous free tier with automatic Docker building, continuous deployment from GitHub, free SSL, and free custom domain support (`retailpulse.in`).

### Step-by-Step Launch:
1. **Sign Up / Login**:
   Visit [https://dashboard.render.com](https://dashboard.render.com) and sign in with your GitHub account.

2. **Deploy via Blueprint**:
   - Click the **"New +"** button in the top navigation.
   - Select **"Blueprint"**.
   - Connect your repository: `damruyadav2022-lpu/Zidio-Internship`.
   - Render will detect the included [`render.yaml`](render.yaml) and automatically configure:
     - **Service Name**: `retailpulse-saas`
     - **Runtime**: `Docker`
     - **Plan**: `Free`
     - **Health Check Path**: `/api/health`
   - Click **"Apply"**.

3. **Wait for Build & Launch (~2-3 minutes)**:
   - Render compiles the React 18 SPA and launches the FastAPI production server.
   - Your platform is immediately live at:  
     `https://retailpulse-saas.onrender.com` (or similar).

4. **Connect Your Domain (`retailpulse.in`)**:
   - In your Render dashboard, navigate to **Settings** ➔ **Custom Domains**.
   - Click **"Add Custom Domain"** and enter `retailpulse.in` and `www.retailpulse.in`.
   - Add the two CNAME/A records shown by Render into your domain DNS (e.g. Cloudflare or GoDaddy).
   - Render will automatically provision and renew a free Let's Encrypt SSL certificate!

---

## 🚀 Option 2: Hugging Face Spaces (100% Free — 16 GB RAM)

Hugging Face Spaces offers **16 GB RAM and 2 vCPUs completely free** with zero sleep timeouts on active spaces.

### Step-by-Step Launch:
1. Go to [https://huggingface.co/spaces](https://huggingface.co/spaces) and click **"Create new Space"**.
2. **Space Name**: `retailpulse`
3. **License**: `MIT`
4. **Select Space SDK**: Choose **"Docker"** (Blank).
5. Under repository sync, choose **GitHub repository** and link `damruyadav2022-lpu/Zidio-Internship`.
6. Click **"Create Space"**.
7. Hugging Face builds the Dockerfile and hosts your live SaaS at:  
   `https://huggingface.co/spaces/<your-username>/retailpulse`

---

## ⚡ Option 3: Koyeb Free Serverless

Koyeb offers high-performance free micro instances with native Docker deployment:
1. Sign up at [https://app.koyeb.com](https://app.koyeb.com).
2. Click **"Create App"** ➔ Select **GitHub**.
3. Choose `damruyadav2022-lpu/Zidio-Internship`.
4. Builder: Select **Docker**. Port: `8000`.
5. Click **"Deploy"**.

---

## 🔄 Automatic Continuous Deployment (CI/CD)

Whenever you push any new commit to `main` on GitHub (`git push origin main`), all of these platforms automatically detect the push, rebuild, and deploy the new version with zero downtime!
