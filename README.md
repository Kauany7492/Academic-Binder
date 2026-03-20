# 📚 Academic Binder - Intelligent Academic Organizer

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org)
[![TiDB](https://img.shields.io/badge/TiDB-MySQL%20compatible-blue.svg)](https://tidbcloud.com)
[![Docker](https://img.shields.io/badge/Docker-✓-blue.svg)](https://www.docker.com)
[![AWS](https://img.shields.io/badge/AWS-Polly-orange.svg)](https://aws.amazon.com/polly/)

Academic Binder is a comprehensive, AI-powered academic organization platform that helps students manage their studies efficiently. It combines note-taking, file management, podcast generation, smart reminders, and **Google Drive integration** for seamless backup and organization of all your academic materials.

---

## ✨ Features

### 📓 **Smart Notebooks**
- Create and organize notebooks by subject/course
- Custom color coding for visual organization
- Quick access to recently used notebooks
- Search functionality with icon
- **University links**: Add subject-specific website links to each notebook

### 📝 **Intelligent Note-Taking**
- **Multiple note-taking methods**: Cornell Method, Outline Method, Free form
- **Audio transcription**: Record lectures or voice notes, automatically transcribed by AI (Whisper)
- **File upload support**: Upload images, PDFs, DOCX, TXT files to generate structured notes
- **Text highlighting**: Mark important passages with colors and add comments
- **Export to Google Drive**: Each page can be exported to a dedicated folder structure

### 🎙️ **AI-Powered Podcast Generation**
- Transform your notes, PDFs, and documents into engaging podcasts
- Amazon Polly integration for natural-sounding voices (Portuguese: Camila)
- Automatic script generation based on your content
- Listen to your study materials as podcasts
- Download generated podcasts for offline listening

### 📅 **Smart Planner**
- Interactive calendar with theme-aware styling
- Weekly planner for organizing tasks and activities
- **Intelligent reminders**: Set reminders that trigger browser notifications
- Organize reminders by notebook/subject

### 📄 **PDF & Media Management**
- Upload and store PDF, audio, and video files
- AI-generated summaries of PDF content
- In-browser PDF preview
- **Automatic transcription** of audio and video files (using Whisper AI)
- All files are automatically saved to PPDRIVE (self-hosted storage)

### ☁️ **Google Drive Integration**
- One-click authentication with Google account
- Automatic folder creation for each notebook and page
- Direct links to view files in Drive
- Secure token storage (refresh tokens) for continuous access

### 🎨 **Customizable Interface**
- Light and dark themes with custom color palettes
- Fully responsive design (desktop, tablet, mobile)
- Academic-friendly color palette with harmonious accents
- Consistent button and input styling with animations

---

## 🚀 Quick Start Guide

### Prerequisites
- Docker and Docker Compose installed
- AWS account with Polly access
- Google Cloud account with Drive API enabled
- OpenAI API key
- PPDRIVE (self-hosted storage) or alternative

### One-Command Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/academic-binder.git
cd academic-binder

# Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys and OAuth credentials

# Start the application with Docker
docker-compose up --build
```

Access the application at:

Frontend: http://localhost:3001

Backend API: http://localhost:3000

API Health Check: http://localhost:3000/health

---

## 🔧 Configuration Guide
### Environment Variables
Backend (backend/.env)

```bash
# TiDB Database (MySQL compatible)
DB_HOST=your-tidb-host
DB_PORT=4000
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=academic_binder
TIDB_ENABLE_SSL=true

# OpenAI
OPENAI_API_KEY=sk-your-key-here

# AWS (Polly)
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
POLLY_VOICE_ID=Camila
POLLY_ENGINE=neural

# PPDRIVE (self-hosted storage)
PPDRIVE_URL=http://localhost:8080
PPDRIVE_API_KEY=
PPDRIVE_BUCKET_PREFIX=academic

# JWT
JWT_SECRET=your-jwt-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Frontend URL (for OAuth redirect)
FRONTEND_URL=http://localhost:3001

# Server
PORT=3000
Frontend (frontend/.env)
env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
Google Cloud Setup (OAuth and Drive API)
Create a project at Google Cloud Console
```

Enable APIs:

Google Drive API

Google Identity Services (OAuth)

Configure OAuth consent screen (External, add test users)

Create OAuth 2.0 credentials (Web application)

Authorized JavaScript origins: http://localhost:3001, https://your-frontend.onrender.com

Authorized redirect URIs: http://localhost:3000/api/auth/google/callback, https://your-backend.onrender.com/api/auth/google/callback

Copy Client ID and Secret to your .env files

AWS Polly Setup
Create an AWS account

Create an IAM user with AmazonPollyFullAccess policy

Generate access keys and add to .env

Use us-east-1 region for best availability

---

## 🐳 Docker Deployment
- Development Mode
- bash
- docker-compose up --build
- Production Mode
- Create docker-compose.prod.yml with appropriate environment variables and use:

```bash
docker-compose -f docker-compose.prod.yml up --build -d
🎨 Theme Customization
The application supports light and dark themes with the following color palettes:

Light Theme
Background: #FFF7EA

Text: #123554

Cards: #EBF5FF

Borders: #AA8C5D

Accent: #553B12

Dark Theme
Background: #021C33

Text: #FFF7EA

Cards: #5D86AA

Borders: #5D86AA

Accent: #5D86AA

All components adapt automatically when toggling themes.
```

---

## 📱 Mobile Usage
### The application is fully responsive:

- Navigation switches to top bar on mobile

- Cards and grids adjust to screen size

- All features accessible on small screens

---

## 🆘 Troubleshooting
- Common Issues
- Google Drive authentication fails
- Verify redirect URIs match exactly

- Check that the user is added as a test user in OAuth consent screen

- Ensure Drive API is enabled

- Podcast generation fails
- Check AWS credentials and region

- Verify Polly quota is not exceeded

- Ensure text length is within limits (chunked automatically)

- Database connection errors
- Verify TiDB host and credentials

- Check SSL settings (required for TiDB Cloud)

---

## 🤝 Contributing
- Fork the repository

- Create feature branch: git checkout -b feature-name

- Commit changes: git commit -m 'Add feature'

- Push: git push origin feature-name

- Open a Pull Request

---

## 📄 License
### This project is licensed under the MIT License.

---

## Made with ❤️ for students everywhere

---

# 🧠 Architecture Diagram

To visualize the system architecture, create a diagram located at:

```
docs/architecture.png
```

## Recommended structure:

```
Frontend (React)
      │
      ▼
API Gateway (Node / Express)
        │
 ┌──────┼─────────┬────────────────┐
 ▼      ▼         ▼                ▼

TiDB  OpenAI  AWS Polly  Google Drive

      │
      ▼
PPDRIVE Storage
```

### Diagram Tools (Recommended)

Professional tools commonly used for system architecture diagrams:

- Excalidraw
- Lucidchart
- Figma
- Draw.io

These tools allow you to create clean architecture diagrams suitable for documentation, presentations, and technical portfolios.

---

# 📊 System Design

This section describes the high-level system design decisions behind Academic Binder.  
It is particularly useful for **technical interviews, portfolio evaluation, and engineering documentation**.

---

## Problem

Students need a **unified platform** capable of managing their academic workflow efficiently.

The system should allow users to:

- Manage structured study notes
- Store academic documents and media
- Generate study podcasts from notes
- Plan academic tasks and schedules

The goal is to provide an **AI-enhanced academic workspace** that centralizes all learning activities.

---

## Constraints

The platform must handle several technical constraints:

- Large file uploads (PDFs, audio, video)
- Real-time or near real-time audio processing
- Latency from external AI APIs
- Scalable storage for files and user data

These constraints influence architecture decisions related to **storage, processing, and scalability**.

---

## Solution

To address the problem and constraints, Academic Binder adopts the following architectural strategies.

### Architecture Decisions

| Decision | Reason |
|--------|--------|
| Distributed SQL Database | Enables horizontal scalability and high availability |
| External File Storage | Prevents database overload and improves performance |
| Asynchronous Audio Generation | Ensures responsive user experience during podcast generation |
| REST API Architecture | Provides simple, modular, and widely compatible backend services |

These decisions help ensure that the platform remains **scalable, responsive, and maintainable** as usage grows.

---
