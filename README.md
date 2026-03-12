# 📚 Academic Binder - Intelligent Academic Organizer

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue.svg)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-✓-blue.svg)](https://www.docker.com)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-TTS%20%7C%20Vision-orange.svg)](https://cloud.google.com)

Academic Binder is a comprehensive, AI-powered academic organization platform that helps students manage their studies efficiently. It combines note-taking, file management, podcast generation, and smart reminders in one intuitive application.

## Features
- Smart Notebooks with color coding
- Intelligent note-taking from audio, images, PDFs, and videos
- AI-powered podcast generation from documents
- Smart planner with reminders and notifications
- PDF management with preview and AI summaries
- Light/dark theme toggle
- Fully responsive design

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Google Cloud account (for TTS and Vision)
- OpenAI API key

### Setup
1. Clone the repository
2. Add your Google Cloud credentials to `backend/credentials/google-tts-key.json`
3. Add your OpenAI API key to `backend/.env`
4. Run: `docker-compose up --build`

Access:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- API Health: http://localhost:3000/health

## Documentation
For detailed user guide and configuration, see the [User Guide](#) section.
