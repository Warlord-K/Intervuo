# Intervuo: AI-Powered Mock Interview Platform

## Project Overview

Intervuo is a web application designed to assist users in preparing for technical and behavioral interviews through simulated sessions with an AI interviewer. This project aims to provide a realistic practice environment, allowing users to refine their responses, manage interview anxiety, and receive feedback implicitly through the interview flow. The platform features user authentication, interview scheduling based on role and company specifics, real-time interaction with an AI agent powered by Ultravox AI, and persistent user profile management.

The architecture consists of a frontend client built using React and Vite, styled with Tailwind CSS, and a backend server developed with Node.js and Express. Firebase serves as the backbone for user authentication (supporting email/password and Google sign-in) and the Firestore database for storing user profiles and interview metadata.

## Demo

Video Demo: https://drive.google.com/file/d/1OieH6Ef2CFyCY8BPPiXYdR3Ecr4f0yOu/view?usp=sharing

## Core Features

* **User Authentication:** Secure registration and login functionality using Firebase Authentication, including Google Sign-In for ease of access.
* **Interview Scheduling:** Users can schedule mock interviews, specifying target company, role, experience level, and interview type (technical, behavioral, system design, coding).
* **AI Mock Interviews:** Real-time, voice-based mock interviews conducted by an AI agent (powered by the Ultravox AI API) tailored to the scheduled role and type.
* **Real-time Transcripts:** Live transcription of the conversation between the user and the AI interviewer during the session.
* **Interview History:** Dashboard view displaying past scheduled interviews with their status (e.g., Ready, Completed, Failed).
* **User Profiles:** Persistent user profiles storing basic information, professional details, and preferences, managed via Firestore.
* **Responsive Design:** Frontend interface styled with Tailwind CSS for usability across different devices.

## Technology Stack

* **Frontend:** React, Vite, JavaScript, Tailwind CSS, react-router-dom
* **Backend:** Node.js, Express.js
* **AI & Voice:** Ultravox AI API
* **Database & Auth:** Firebase Firestore, Firebase Authentication

## System Prerequisites

To set up and run this project locally, ensure you have the following installed:

* Node.js (LTS version recommended)
* npm (usually included with Node.js)
* A Firebase project with Authentication (Email/Password and Google providers enabled) and Firestore Database activated.
* An Ultravox AI API key.

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
3.  Create a `.env` file in the `backend` directory. Add your Ultravox API key:
    ```
    ULTRAVOX_API_KEY=YOUR_ULTRAVOX_API_KEY
    RAZORPAY_API_KEY=YOUR_RAZORPAY_API_KEY
    RAZORPAY_API_SECRET=YOUR_RAZORPAY_API_SECRET
    GROQ_API_KEY=YOUR_GROQ_API_KEY
    ```
4.  Start the backend server:
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
3.  Create a `.env` file in the root of the `client` directory. Populate it with your Firebase project configuration details and the URL of your running backend server:
    ```
    VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
    VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
    VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
    VITE_FIREBASE_APP_ID=YOUR_APP_ID
    VITE_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
    VITE_BACKEND_URL=http://localhost:5210 # Adjust if your backend runs elsewhere
    ```
    You can find your Firebase configuration details in your Firebase project settings.
4.  Ensure the Firebase configuration in `src/config/firebaseConfig.js` correctly initializes Firebase services (Auth, Firestore).
5.  Start the frontend development server:
    ```bash
    npm run dev
    ```
6.  Access the application in your web browser at the local URL provided by Vite (usually `http://localhost:5173` or similar).

## Project Structure

The core logic for the frontend application resides within the `client/src` directory. Key components include:

* `App.jsx`: Main application component handling routing and authentication state.
* `pages/`: Contains components for different views (Landing, Dashboard, Interview, Profile, etc.).
* `config/`: Includes Firebase configuration (`firebaseConfig.js`).

The backend logic is primarily located in `backend/index.js`, which sets up the Express server and the API endpoint for initiating Ultravox interviews.

## Authors

This project was developed by Group 12 as part of the Service Oreinted Systems course. The contributors to this repository are:

* Yatharth Gupta (210001083)
* Sujal Mishra (210001069)
* Shivashish Sharma (210001066)
* Batchu Sonika (210001009)
* Rajat Tambare (2402101011)
