# Doubt Chat Setup Guide 🤖

## Overview
The Doubt Chat feature is a ChatGPT-like AI tutor that helps students answer questions and resolve doubts related to their study topics.

## Features
✅ AI-powered tutor responses  
✅ Syllabus-aware context  
✅ Real-time streaming responses  
✅ Beautiful chat UI with message animations  
✅ Suggestion chips for quick questions  
✅ Error handling and user feedback  

## Setup Instructions

### Step 1: Get OpenAI API Key
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or login to your OpenAI account
3. Create a new API key
4. Copy your API key

### Step 2: Configure Environment Variables
1. Open `backend/.env`
2. Replace `sk-proj-` with your actual OpenAI API key:
   ```
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Save the file

### Step 3: Restart Backend Server
```bash
cd backend
npm start
```

## Usage
1. Go to the Dashboard
2. Click on "Doubt Chat" in the sidebar or quick links
3. Type your question in the chat input
4. Or click one of the suggestion chips to ask a pre-formatted question
5. The AI tutor will respond with context-aware answers based on your syllabus
6. Click "Clear" to start a new conversation

## Question Examples
- "Explain this concept in simple terms"
- "How can I practice this topic?"
- "What are the key points to remember?"
- "Give me real-world examples"
- Or ask anything about your subjects!

## API Endpoints

### POST /api/dashboard/doubt-chat
Send a question to the AI tutor

**Request:**
```json
{
  "question": "Your question here"
}
```

**Response:**
```json
{
  "msg": "Response generated successfully",
  "question": "Your question here",
  "answer": "AI tutor response"
}
```

**Headers:** Authorization: Bearer {token}

## Component Structure

### Backend
- **Service:** `backend/services/doubtChat.js`
  - `generateTutorResponse()` - Main function to get AI responses
  - `callOpenAIAPI()` - Handles OpenAI API calls

- **Route:** `backend/routes/dashboard.js`
  - `POST /api/dashboard/doubt-chat` - Endpoint for chat

### Frontend
- **Component:** `frontend/src/components/DoubtChat.js`
  - Full chat UI with message history
  - Real-time response handling
  - Error management
  - Suggestion chips

## Features in Detail

### Message Types
- **User Messages:** Light background with blue text
- **Bot Messages:** Light blue background with dark text
- **Error Messages:** Red background with error icon
- **Loading State:** Animated dots during API call

### UI Elements
- Chat message display with avatars
- Input field with auto-focus
- Send and Clear buttons
- Quick suggestion chips
- Auto-scrolling to latest message
- Responsive design

## Troubleshooting

### Issue: "API key is invalid"
- **Solution:** Check your `.env` file and verify the OpenAI API key is correct
- Make sure the key starts with `sk-proj-`
- Ensure the file is saved and the server has been restarted

### Issue: "Rate limit exceeded"
- **Solution:** Wait a few seconds before sending the next question
- OpenAI has rate limits based on your subscription tier

### Issue: No response from tutor
- **Solution:** Check browser console for errors
- Verify internet connection
- Ensure backend is running on port 5000

## Future Enhancements
- [ ] Chat history persistence to database
- [ ] Multi-turn conversations with context memory
- [ ] Typing indicators while processing
- [ ] Copy response to clipboard
- [ ] Export chat as PDF
- [ ] Voice input/output
- [ ] Custom system prompts per subject

## Costs
OpenAI API calls will incur costs based on your usage:
- GPT-3.5-turbo: ~$0.001 per 1K tokens
- Monitor your usage at [https://platform.openai.com/account/billing/overview](https://platform.openai.com/account/billing/overview)

---
**Created:** April 2026  
**Status:** ✅ Active and Ready to Use
