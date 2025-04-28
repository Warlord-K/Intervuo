# Intervuo: AI-Powered Mock Interview Platform (BYOK Model)

## Project Overview

Intervuo is a web application designed to assist users in preparing for various professional interviews through simulated sessions with an AI interviewer. This project aims to provide a realistic practice environment, allowing users to refine their responses and manage interview anxiety. The platform utilizes a "Bring Your Own Key" (BYOK) model, where users provide their own API keys for the underlying AI services. Features include user authentication, interview scheduling based on role and company specifics, real-time interaction with an AI agent powered by Ultravox AI, transcript analysis via Groq, and persistent user profile management.

The architecture consists of a frontend client built using React and Vite, styled with Tailwind CSS, and a backend server developed with Node.js and Express. Firebase serves as the backbone for user authentication (supporting email/password and Google sign-in) and the Firestore database for storing user profiles (including API keys) and interview results.

## Demo

Video Demo: \[Link to your updated video demo if available\]

## Core Features

* **User Authentication:** Secure registration and login functionality using Firebase Authentication, including Google Sign-In.
* **BYOK (Bring Your Own Key):** Users securely store their own API keys for Ultravox (for the AI voice agent) and Groq (for transcript analysis) in their profile.
* **Interview Scheduling:** Users can schedule mock interviews, specifying target company, role, experience level, and interview type (Behavioral, Case Study, Role-Specific, etc.).
* **AI Mock Interviews:** Real-time, voice-based mock interviews conducted by an AI agent (powered by Ultravox AI using the user's key) tailored to the scheduled role and type. The AI focuses on asking questions and listening, providing minimal commentary.
* **Real-time Transcripts:** Live transcription of the conversation during the interview session via the `ultravox-client` library.
* **AI-Powered Analysis:** After the interview, the transcript is analyzed by a Groq language model (using the user's key) to provide feedback on clarity, completeness, relevance, confidence, structure, and problem-solving.
* **Interview History & Results:** Dashboard view displaying past completed interviews with links to detailed results pages showing the analysis and transcript.
* **User Profiles:** Persistent user profiles storing basic information and API keys, managed via Firestore with security rules.
* **Responsive Design:** Frontend interface styled with Tailwind CSS for usability across different devices.
* **Free to Use:** The platform itself is free; usage depends on the free tiers/credits associated with the user's provided Ultravox and Groq API keys.

## Technology Stack

* **Frontend:** React, Vite, JavaScript, Tailwind CSS, react-router-dom, `ultravox-client`
* **Backend:** Node.js, Express.js
* **AI & Voice:** Ultravox AI API (via user key)
* **AI Analysis:** Groq API (via user key)
* **Database & Auth:** Firebase Firestore, Firebase Authentication

## System Prerequisites

To set up and run this project locally, ensure you have the following installed:

* Node.js (LTS version recommended)
* npm (usually included with Node.js)
* A Firebase project with Authentication (Email/Password and Google providers enabled) and Firestore Database activated.
* Your own Ultravox AI API key ([Get from Ultravox](https://app.ultravox.ai/))
* Your own Groq API key ([Get from Groq](https://console.groq.com/keys))

## Local Development Setup

Follow these steps to get the project running on your local machine.

### Backend Configuration

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install the required Node.js dependencies:
    ```bash
    npm install
    ```
3.  **Firebase Admin SDK Setup:**
    * Download your Firebase Admin SDK service account key file (a `.json` file) from your Firebase Project Settings > Service accounts.
    * Place this `.json` file **inside the `backend` directory**.
    * **Rename the file** to match the filename used in `backend/index.js` (e.g., `crackitai-firebase-adminsdk-fbsvc-004062a7d8.json` or update the `require` path in `index.js`).
    * **IMPORTANT:** Add the exact filename of your service account key file to a `.gitignore` file within the `backend` directory to prevent committing sensitive credentials.
4.  Create a `.env` file in the `backend` directory (if you need other environment variables). Note that API keys are now fetched from user profiles in Firestore, not directly from the backend `.env`.
    ```
    # backend/.env (Example - Add other variables if needed)
    # PORT=5210 # Optional: Specify a port
    ```
5.  Start the backend server:
    ```bash
    node index.js
    ```
    The server will typically start on port 5210 unless configured otherwise.

### Frontend Configuration

1.  Navigate to the `client` directory:
    ```bash
    cd client
    ```
2.  Install the necessary dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root of the `client` directory. Populate it with your Firebase project configuration details (using the `VITE_` prefix) and the URL of your running backend server:
    ```dotenv
    # client/.env

    VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
    VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
    VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
    VITE_FIREBASE_APP_ID=YOUR_APP_ID
    VITE_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID # Optional

    VITE_BACKEND_URL=http://localhost:5210 # Adjust if your backend runs elsewhere
    ```
    * You can find your Firebase configuration details in your Firebase project settings.
    * **IMPORTANT:** Add `.env` to your `.gitignore` file in the `client` directory.
4.  Ensure the Firebase configuration in `src/config/firebaseConfig.js` correctly reads these environment variables (`import.meta.env.VITE_...`).
5.  Start the frontend development server:
    ```bash
    npm run dev
    ```
6.  Access the application in your web browser at the local URL provided by Vite (usually `http://localhost:5173` or similar).
7.  **Register/Login** and navigate to your **Profile** page to add your Ultravox and Groq API keys before starting an interview.

## Project Structure

The core logic for the frontend application resides within the `client/src` directory. Key components include:

* `App.jsx`: Main application component handling routing and authentication state.
* `pages/`: Contains components for different views (Landing, Dashboard, Interview, Profile, Results, etc.).
* `config/`: Includes Firebase configuration (`firebaseConfig.js`).

The backend logic is primarily located in `backend/index.js`, which sets up the Express server, authentication middleware, and API endpoints for initiating Ultravox interviews and analyzing transcripts via Groq, using user-provided keys fetched securely via the Firebase Admin SDK.

## Authors

This project was developed by Group 12 as part of the Service Oriented Systems course. The contributors to this repository are:

* Yatharth Gupta (210001083)
* Sujal Mishra (210001069)
* Shivashish Sharma (210001066)
* Batchu Sonika (210001009)
* Rajat Tambare (2402101011)