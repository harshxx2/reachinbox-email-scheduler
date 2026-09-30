# ReachInbox Email Scheduler

A full-stack email scheduling application built for the ReachInbox assignment.

The application allows users to create email campaigns, upload recipient lists, schedule emails, and monitor scheduled and sent emails through a simple dashboard.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express.js
- TypeScript
- Prisma

### Database & Queue
- PostgreSQL
- Redis
- BullMQ

### Email
- Nodemailer
- Ethereal Email

### Authentication
- Google OAuth 2.0

### Infrastructure
- Docker
- Docker Compose

## Features

- Google OAuth authentication
- Email campaign creation
- CSV/TXT recipient upload
- Automatic recipient detection
- Schedule emails for a future time
- Configurable delay between emails
- Hourly sending limits
- Multiple sender support
- Scheduled email tracking
- Sent email tracking
- Email status management
- Retry handling for failed emails
- Background email processing
- Persistent scheduled jobs using BullMQ and Redis
- PostgreSQL database for application data
- Docker-based PostgreSQL and Redis setup

## Project Structure

```text
reachinbox-email-scheduler/
│
├── .github/
│
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── .env.example
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
│
├── docker-compose.yml
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
