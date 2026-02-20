# Agri-Guardian Backend Server

Node.js + Express + MongoDB backend for the Agri-Guardian pest management application.

## 🏗️ Architecture

- **Framework**: Express.js
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **AI Service**: Lovable AI Gateway (Google Gemini 2.5 Flash)
- **Image Storage**: Current approach (data URLs/external links)

## 📁 Project Structure

```
server/
├── index.js                # Main server file
├── package.json           # Dependencies
├── .env.example           # Environment variables template
├── models/                # Mongoose schemas
│   ├── User.js
│   ├── Crop.js
│   ├── Pest.js
│   ├── Advisory.js
│   ├── SprayLog.js
│   ├── CommunityPost.js
│   ├── CommunityReply.js
│   ├── UserCrop.js
│   ├── UserLike.js
│   ├── Alert.js
│   └── AILog.js
├── controllers/           # Route handlers
│   ├── authController.js
│   ├── cropController.js
│   ├── pestController.js
│   ├── sprayLogController.js
│   ├── communityController.js
│   ├── userController.js
│   ├── alertController.js
│   └── aiController.js
├── routes/                # Express routes
│   ├── auth.js
│   ├── crops.js
│   ├── pests.js
│   ├── sprayLogs.js
│   ├── community.js
│   ├── user.js
│   ├── alerts.js
│   └── ai.js
├── middleware/            # Express middleware
│   └── auth.js           # JWT authentication
├── services/              # Business logic
│   └── aiService.js      # AI Gateway integration
└── scripts/               # Utility scripts
    └── migrateSupabaseToMongo.js
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `MONGO_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: Secret key for JWT token generation (min 32 characters)
- `LOVABLE_API_KEY`: Your Lovable AI Gateway API key
- `PORT`: Server port (default: 5000)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:5173)

### 3. Run Database Migration (First Time Only)

If you have existing Supabase data to migrate:

```bash
# Add Supabase credentials to .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Run migration
npm run migrate
```

### 4. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on http://localhost:5000

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Create new user account |
| POST | `/login` | No | Login with email/password |
| GET | `/me` | Yes | Get current user profile |
| POST | `/logout` | Yes | Logout (client-side token removal) |

### Crops (`/api/crops`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | List all crops |
| GET | `/:id` | No | Get crop details with pests |

### Pests (`/api/pests`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | List all pests (filter by `crop_id`) |
| GET | `/:id` | No | Get pest details with advisory |

### Spray Logs (`/api/spray-logs`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | Get user's spray logs |
| POST | `/` | Yes | Create spray log entry |
| DELETE | `/:id` | Yes | Delete spray log |

### Community (`/api/community`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/posts` | No | List community posts |
| POST | `/posts` | Yes | Create new post |
| POST | `/posts/:id/like` | Yes | Toggle like on post |
| GET | `/posts/:id/replies` | No | Get post replies |
| POST | `/posts/:id/replies` | Yes | Add reply to post |

### User (`/api/user`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile` | Yes | Get user profile |
| PUT | `/profile` | Yes | Update user profile |
| GET | `/crops` | Yes | Get user's selected crops |
| POST | `/crops` | Yes | Add crop to user crops |
| PUT | `/crops/:id` | Yes | Update crop stage |
| DELETE | `/crops/:id` | Yes | Remove crop |

### Alerts (`/api/alerts`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Get active alerts (filter by `crop_id`, `location`, `risk_level`) |

### AI (`/api/ai`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/chat` | Yes | AI chat assistant |
| POST | `/identify-image` | Yes | Identify pest from image |
| POST | `/symptom-check` | Yes | Check symptoms and get pest recommendations |

## 🔐 Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Response Format

All auth endpoints return Supabase-compatible format:

```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "user_metadata": { "name": "User Name" }
  },
  "session": {
    "access_token": "jwt_token",
    "user": { /* same as user above */ }
  }
}
```

## 🤖 AI Integration

The AI service uses Lovable AI Gateway with Google Gemini 2.5 Flash model for:

1. **Chat Assistant** (`/api/ai/chat`)
   - Context-aware pest management advice
   - Multilingual support (English/Hindi)
   - IPM (Integrated Pest Management) recommendations
   - RAG (Retrieval Augmented Generation) with pest database

2. **Image Identification** (`/api/ai/identify-image`)
   - Pest identification from crop images
   - Confidence scoring
   - Symptom detection

3. **Symptom Checker** (`/api/ai/symptom-check`)
   - Match symptoms to likely pests
   - Ranked pest predictions
   - IPM action recommendations

All AI interactions are logged in the `ai_logs` collection.

## 🗄️ Database Schema

### Collections

- `users` - User accounts with profiles and roles
- `crops` - Available crops (multilingual)
- `pests` - Pest information by crop
- `advisories` - IPM recommendations per pest
- `spraылogs` - Pesticide application records
- `communityпосты` - Farmer discussion posts
- `communityreplies` - Post comments
- `usercrops` - User's selected crops and stages
- `userlikes` - Post likes tracking
- `alerts` - Pest outbreak notifications
- `ailogs` - AI service usage tracking

## 🔧 Development

### Run Tests

```bash
npm test
```

### Code Structure

- **Controllers**: Handle HTTP requests/responses
- **Models**: Mongoose schemas with validation
- **Routes**: Express route definitions
- **Middleware**: Authentication, error handling
- **Services**: Business logic (AI integration)

### Error Handling

All errors are caught and returned in consistent format:

```json
{
  "error": "Error message"
}
```

## 🚀 Deployment

### MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster
2. Create a database user
3. Whitelist your IP address
4. Get connection string and add to `.env`

### Environment Variables

Make sure all production environment variables are set:

```bash
MONGO_URI=...
JWT_SECRET=... (strong secret, min 32 chars)
LOVABLE_API_KEY=...
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

### Start Production Server

```bash
npm start
```

## 📝 Notes

- Frontend must continue working without ANY changes
- All API responses match Supabase format exactly
- JWT tokens are compatible with frontend auth context
- Migration script is idempotent (can run multiple times)
- Images are handled as data URLs or external links (no Cloudinary needed)

## 🆘 Troubleshooting

### MongoDB Connection Error

- Check `MONGO_URI` in `.env`
- Verify IP whitelist in MongoDB Atlas
- Check database user credentials

### JWT Authentication Error

- Verify `JWT_SECRET` is set
- Token may have expired (7 days default)
- Check Authorization header format

### AI Service Error

- Verify `LOVABLE_API_KEY` is valid
- Check API rate limits (429 error)
- Check API credits (402 error)

## 📄 License

MIT
