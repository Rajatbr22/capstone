
# Secure File Management System

A secure file management application with user authentication, role-based access control, and NLP-powered content analysis.

## Features

- User authentication with MFA support
- Role-based access control for files
- Content analysis with AI/NLP
- Security threat detection
- Activity monitoring
- Analytics dashboard

## Project Structure

- `src/` - React frontend code
- `flask_backend/` - Python Flask NLP backend

## Frontend Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables (if needed)

3. Start the development server:
   ```
   npm run dev
   ```

## NLP Backend Setup

1. Navigate to the Flask backend directory:
   ```
   cd flask_backend
   ```

2. Create a Python virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On Windows: `venv\Scripts\activate`
   - On macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Run the Flask application:
   ```
   python app.py
   ```

## Integration

The React frontend will attempt to connect to the Flask NLP backend at `http://localhost:5000`. If the backend is not available, it will fall back to using mock data for content analysis.

When deploying to production, update the API base URL in `src/lib/nlp-service.ts` to point to your deployed NLP backend.

## Deployment

### Frontend
The frontend can be built for production using:
```
npm run build
```

### NLP Backend
The Flask backend can be deployed to any platform that supports Python:
- Heroku
- Google Cloud Run
- AWS Lambda with API Gateway
- Digital Ocean App Platform
- Railway

Remember to set the appropriate CORS settings in the Flask app for your production frontend URL.
