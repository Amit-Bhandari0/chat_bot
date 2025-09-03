# ChatBot 🤖

[![Website](https://img.shields.io/badge/Website-Live-brightgreen)](https://chat-bot-h736.onrender.com/)

A smart and interactive chatbot built with Django, deployed on Render. Chat with it in real-time and enjoy a seamless conversation experience.

---

## 🚀 Features

- Real-time chat interface
- User-friendly design
- Easy deployment on Render or any cloud platform
- Environment variables support via `.env` for secure configuration

---

## 🌐 Demo

Check out the live demo here: [ChatBot](https://chat-bot-h736.onrender.com/)

---

## 🛠 Tech Stack

- **Backend:** Python, Django  
- **Frontend:** HTML, CSS, JavaScript  
- **Database:** SQLite (default) / MySQL (optional)  
- **Deployment:** Render  

---

## 💻 Installation

### 1. Clone the repository

git clone https://github.com/Amit-Bhandari0/chat_bot.git
cd chat_bot

### 2. Create a virtual environment

python -m venv venv

### 3. Activate the virtual environment

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

### 4. Install dependencies

pip install -r requirements.txt

### 5. Setup environment variables

Create a `.env` file in the root folder with the following content:

SECRET_KEY=your_django_secret_key
DEBUG=True
ALLOWED_HOSTS=*

### 6. Run database migrations

python manage.py makemigrations
python manage.py migrate

### 7. Start the development server

python manage.py runserver

Open http://127.0.0.1:8000/ in your browser to test locally.

---

## ☁️ Deployment

# Collect static files for production
python manage.py collectstatic

# Notes for deployment:
# - Add environment variables in your cloud dashboard
# - Set DEBUG=False in production

---

## 🤝 Contributing

# Steps to contribute:
# 1. Fork the repository
# 2. Clone your fork
# 3. Make changes in a branch
# 4. Commit and push changes
# 5. Open a pull request
