# 📚 Academic Binder - Intelligent Academic Organizer

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue.svg)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-✓-blue.svg)](https://www.docker.com)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-TTS%20%7C%20Vision%20%7C%20Drive-orange.svg)](https://cloud.google.com)

Academic Binder is a comprehensive, AI-powered academic organization platform that helps students manage their studies efficiently. It combines note-taking, file management, podcast generation, smart reminders, and **Google Drive integration** for seamless backup and organization of all your academic materials.

---

## 📋 Table of Contents
- [Features (English)](#-features-english)
- [Quick Start Guide](#-quick-start-guide)
- [User Guide (English)](#-user-guide-english)
- [Configuration Guide](#-configuration-guide)
- [Docker Deployment](#-docker-deployment)
- [Mobile Usage](#-mobile-usage)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)
- [🇧🇷 Versão em Português](#-versão-em-português)

---

## ✨ Features (English)

### 📓 **Smart Notebooks**
- Create and organize notebooks by subject/course
- Custom color coding for visual organization
- Quick access to recently used notebooks
- Search functionality to find notebooks by name
- **University links**: Add subject-specific website links to each notebook

### 📝 **Intelligent Note-Taking**
- **Multiple note-taking methods**: Cornell Method, Outline Method, Free form
- **Audio transcription**: Record lectures or voice notes, automatically transcribed by AI (Whisper)
- **File upload support**: Upload images, PDFs, DOCX, TXT files to generate structured notes
- **Text highlighting**: Mark important passages with colors and add comments
- **Export to Google Drive**: Each page can be exported to a dedicated folder structure:
  - `Notebook Name` > `Page Name` > `PageName.txt` (contains the note content)
  - All transcriptions, PDFs, and audio files are also organized in the same folder

### 🎙️ **AI-Powered Podcast Generation**
- Transform your notes, PDFs, and documents into engaging podcasts
- Google Cloud Text-to-Speech integration for natural-sounding audio
- Automatic script generation based on your content
- Listen to your study materials as podcasts
- Download generated podcasts for offline listening

### 📅 **Smart Planner**
- Interactive calendar for important dates
- Weekly planner for organizing tasks and activities
- **Intelligent reminders**: Set reminders that trigger browser notifications
- Organize reminders by notebook/subject

### 📄 **PDF & Media Management**
- Upload and store PDF, audio, and video files
- AI-generated summaries of PDF content
- In-browser PDF preview
- **Automatic transcription** of audio and video files (using Whisper AI)
- All files are automatically saved to Google Drive in the appropriate folder structure:
  - `Notebook Name` > `Page Name` > `audio/` or `video/` or `pdf/`
  - Transcripts are saved as `.txt` files alongside the original media

### ☁️ **Google Drive Integration**
- One-click authentication with Google account
- Automatic folder creation for each notebook and page
- All notes, transcripts, PDFs, and media files are backed up to your personal Google Drive
- Direct links to view files in Drive
- Secure token storage (refresh tokens) for continuous access

### 🎨 **Customizable Interface**
- Light and dark themes
- Fully responsive design (desktop, tablet, mobile)
- Academic-friendly color palette: `#806130`, `#BFA478`, `#FFF7EA`, `#EBF5FF`, `#5D86AA`, `#123554`

---

## 🚀 Quick Start Guide

### Prerequisites
- Docker and Docker Compose installed
- Google Cloud account with the following APIs enabled:
  - Cloud Text-to-Speech API
  - Cloud Vision API
  - Google Drive API
- OpenAI API key
- Google OAuth 2.0 credentials (Client ID and Client Secret)

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
