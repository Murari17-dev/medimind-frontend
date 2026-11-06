# MediMind – AI-Powered Healthcare Assistant

MediMind is an AI-powered healthcare application designed to simplify prescription management and medication tracking. It allows users to scan prescriptions, organize medication information, and manage reminders through a centralized interface.

## 🎥 Project Demo

[**▶ Watch MediMind Demo**](demo/MediMind_Demo.mp4)

## ✨ Features

- **Prescription Scanning:** Upload and scan medical prescriptions to extract relevant information using AI.
- **AI-Powered Processing:** Uses AI-based processing to interpret prescription information.
- **Medication Management:** Organize and manage medications extracted from prescriptions.
- **Medication Reminders:** Set medication reminders and receive desktop notifications.
- **Prescription History:** Access previously scanned prescriptions.
- **Prescription Deletion:** Delete individual prescriptions or clear prescription history.
- **User Authentication:** Secure registration and login functionality.
- **Cloud Database:** Store and retrieve user-specific prescription and medication data.

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React Native, Expo, TypeScript |
| Backend | Python, FastAPI |
| Database | Supabase, PostgreSQL |
| Authentication | Supabase Auth |
| AI Integration | AI model API |
| Deployment | Vercel, Render |
| Desktop | Electron |

## 🏗️ Architecture

MediMind follows a client-server architecture.

1. **Frontend:** Expo-based application providing the user interface.
2. **Backend:** FastAPI handles API requests, prescription processing, and application logic.
3. **AI Processing:** AI models assist with extracting and interpreting prescription information.
4. **Database:** Supabase PostgreSQL stores application data.
5. **Authentication:** Supabase Auth manages user authentication and account isolation.

## 🚀 Live Application

[Open MediMind](https://medimind-frontend-eta.vercel.app/)

## 💻 Running Locally

### Frontend

```bash
git clone https://github.com/Murari17-dev/medimind-frontend.git

cd medimind-frontend

npm install

npx expo start
```

### Backend

```bash
git clone https://github.com/Murari17-dev/medimind-backend.git

cd medimind-backend

pip install -r requirements.txt

uvicorn main:app --reload
```

Configure the required environment variables for Supabase and the backend API before running the application.

## 👨‍💻 Developer

Developed as a healthcare technology project combining AI, full-stack development, cloud database management, and application deployment.

**GitHub:** [Murari17-dev](https://github.com/Murari17-dev)

---

*Disclaimer: MediMind is intended as a prescription organization and medication management tool. It is not a substitute for professional medical advice or diagnosis.*
