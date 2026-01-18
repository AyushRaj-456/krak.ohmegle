# SIT Omegle - Project Technical Report

## 1. Project Overview
**Project Name:** SIT Omegle (Krak.Ωegle)
**Type:** Real-time Video & Text Chat Application
**Purpose:** A platform for students (SIT) to connect via video/text chat, featuring a tiered matching system (Regular/Golden Tokens), user profiles, and an admin dashboard.

---

## 2. Technology Stack (The "Ingredients")

### A. Frontend (The User Interface)
*Where the user clicks and sees things.*
- **Framework:** **React** (v19) with **TypeScript**
  - *Why?* Building interactive UIs efficiently. TypeScript adds safety to code.
- **Build Tool:** **Vite**
  - *Why?* Extremely fast development server and bundler.
- **Styling:** **Tailwind CSS**
  - *Why?* Rapid styling using utility classes (like building with Lego blocks).
- **Communication:** **Socket.io-client**
  - *Why?* Enables instant, real-time messaging and video signaling.
- **State & Data:** **Firebase SDK**
  - *Why?* Handles logging in users and fetching their profile data.

### B. Backend (The Brain)
*Where the logic happens invisible to the user.*
- **Runtime:** **Node.js**
  - *Why?* Runs JavaScript on the server.
- **Framework:** **Express.js**
  - *Why?* Makes building the API server simple and organized.
- **Real-time Engine:** **Socket.io**
  - *Why?* The bridge that connects two users instantly.
- **Database Admin:** **Firebase Admin SDK**
  - *Why?* Allows the server to have "superpowers" to read/write any data in the database securely.

### C. Database & Cloud (The Memory)
*Where information is stored.*
- **Database:** **Google Cloud Firestore** (NoSQL)
  - *Why?* Flexible database that scales easily and works well with real-time apps.
- **Authentication:** **Firebase Authentication**
  - *Why?* Securely handles Google Sign-In and Email/Password logins without us writing complex code.

### D. Deployment (The Hosting)
*Where the app lives on the internet.*
- **Frontend Host:** **Vercel**
  - *Why?* Optimized for hosting React apps.
- **Backend Host:** **Render**
  - *Why?* Good for hosting Node.js servers that need to run continuously.

---

## 3. How It All Works Together (The "Recipe")

1.  **The Visit:** A user opens the website (hosted on **Vercel**). **React** loads the interface.
2.  **The Login:** They click "Sign in with Google". **Firebase Auth** handles the security and tells the app "This is User A".
3.  **The Connection:** The app connects to the **Backend Server** (hosted on **Render**) using **Socket.io**. It's like opening a direct phone line.
4.  **The Match:** The user clicks "Start Chat". The **Node.js** server looks at the queue. If it finds another user, it introduces them.
5.  **The Chat:**
    -   **Video/Audio:** The browsers talk directly to each other (Peer-to-Peer) using WebRTC (facilitated by the server).
    -   **Text:** Messages are sent through the Socket.io server which passes them to the other person.
6.  **The Data:** If a user buys tokens, the **Admin Panel** updates the **Firestore Database**, and the user's app instantly sees the new balance.

---

## 4. Beginner's Explanation Guide
*Use this section to explain the project to someone with no coding experience.*

**"Imagine building a digital phone booth center."**

1.  **The Frontend (The Phone Booth):**
    "We built the phone booth using **React**. It's what people stand in, press buttons on, and see the screen. We painted it and made it look nice using **Tailwind CSS**."

2.  **The Backend (The Operator):**
    "We have a digital operator sitting in a central office. This is **Node.js**. When you pick up the phone, you're talking to this operator. The operator waits for someone else to call, then connects your lines together."

3.  **The Database (The Filing Cabinet):**
    "We have a secure filing cabinet called **Firestore**. It keeps a folder for every user with their name, bio, and how many 'tokens' (coins) they have for the phone booth."

4.  **The Connection (Socket.io):**
    "Normally, web pages are like letters—you send a request, you wait, you get a page back. **Socket.io** is like an open phone line. It allows us to say 'Hello' and the other person hears it immediately, without reloading anything."

---

## 5. Directory Structure
- **`/client`**: The React code (The Phone Booth).
- **`/server`**: The Node.js code (The Operator).
- **`/admin`**: A special control panel website for the owners.
