# Emergency Response AI System for Pakistan

A comprehensive multi-agent AI emergency response system designed for Pakistan's emergency services. The application provides intelligent triage, context-aware service assignment, appointment booking, and follow-up capabilities for emergency cases.

## Features

- **Multi-Agent AI Processing**: Intelligent triage, guidance, booking, and follow-up agents
- **Emergency Type Detection**: Automatic routing to appropriate services (hospitals, police, disaster relief)
- **Real-time Dashboard**: Live metrics and case management for frontline workers
- **Multilingual Support**: English and Urdu language support
- **SMS & Email Notifications**: Booking confirmations and case updates
- **Degraded Mode**: Offline-capable SMS fallback system
- **Resource Tracking**: Hospital capacity monitoring with bed and ventilator tracking

## Prerequisites

Before running this application locally, ensure you have:

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **PostgreSQL** database
- **API Keys** for external services (see Environment Variables section)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd emergency-response-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/emergency_response

# AI Services
GEMINI_API_KEY=your_google_gemini_api_key
# OR
GOOGLE_AI_STUDIO_API_KEY=your_google_ai_studio_api_key

# Email Services (Optional)
SENDGRID_API_KEY=your_sendgrid_api_key

# SMS Services (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Session Configuration
SESSION_SECRET=your_random_session_secret
```

### 4. Database Setup

#### Option A: Using Neon Database (Recommended for development)
1. Sign up at [Neon](https://neon.tech)
2. Create a new database
3. Copy the connection string to your `DATABASE_URL`

#### Option B: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database: `createdb emergency_response`
3. Update `DATABASE_URL` with your local connection string

### 5. Initialize Database Schema

```bash
npm run db:push
```

This command will create all necessary tables and populate initial data.

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts both the frontend (Vite) and backend (Express) servers. The application will be available at:
- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api

### Production Build

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run check
```

## Project Structure

```
emergency-response-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and types
│   └── index.html
├── server/                 # Express backend
│   ├── services/           # AI agents and business logic
│   │   ├── triage-agent.ts
│   │   ├── guidance-agent.ts
│   │   ├── booking-agent.ts
│   │   └── follow-up-agent.ts
│   ├── utils/              # Server utilities
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data layer
│   └── index.ts            # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts
├── attached_assets/        # Data files (CSV, JSON)
└── package.json
```

## API Endpoints

### Emergency Management
- `POST /api/emergency` - Submit new emergency case
- `GET /api/emergency-cases-active` - Get active cases
- `GET /api/cases/:caseId/updates` - Get case updates
- `PATCH /api/emergency-cases/:id` - Update case status
- `POST /api/cases/:caseId/resolve` - Resolve case

### Metrics and Monitoring
- `GET /api/metrics/dashboard` - Get dashboard metrics
- `GET /api/hospitals` - Get hospital data

## Configuration

### Tailwind CSS
The application uses Tailwind CSS with custom configuration. Modify `tailwind.config.ts` for styling customizations.

### Database Schema
Database schema is defined in `shared/schema.ts` using Drizzle ORM. To modify the schema:

1. Update `shared/schema.ts`
2. Run `npm run db:push` to sync changes

### AI Agent Configuration
AI agents are configured in the `server/services/` directory. Each agent has specific parameters for:
- Response time optimization
- Message formatting
- Service assignment logic

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key for AI processing |
| `SENDGRID_API_KEY` | ❌ | SendGrid API key for email notifications |
| `TWILIO_ACCOUNT_SID` | ❌ | Twilio Account SID for SMS services |
| `TWILIO_AUTH_TOKEN` | ❌ | Twilio Auth Token for SMS services |
| `TWILIO_PHONE_NUMBER` | ❌ | Twilio phone number for sending SMS |
| `SESSION_SECRET` | ✅ | Random string for session encryption |

## Development Guide

### Adding New Emergency Types

1. Update the emergency type enum in `shared/schema.ts`
2. Add routing logic in `server/services/guidance-agent.ts`
3. Create or update service search modules in `server/services/`
4. Add UI icons and labels in `client/src/components/`

### Customizing AI Responses

AI prompts and responses can be customized in:
- `server/services/triage-agent.ts` - Emergency assessment
- `server/services/guidance-agent.ts` - Service recommendations
- `server/services/follow-up-agent.ts` - Status updates

### Adding New Languages

1. Extend language support in `shared/schema.ts`
2. Add translations to AI prompts in service files
3. Update UI components with new language strings

## Deployment

### Production Environment

1. Set `NODE_ENV=production`
2. Configure production database URL
3. Set up proper API keys for all services
4. Build and start:

```bash
npm run build
npm start
```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Health Checks

The application includes health check endpoints:
- `GET /health` - Basic health check
- `GET /api/metrics/dashboard` - System metrics

## Troubleshooting

### Common Issues

**Database Connection Issues**
- Verify `DATABASE_URL` is correct
- Ensure database server is running
- Check firewall and network settings

**AI Agent Failures**
- Verify `GEMINI_API_KEY` is valid
- Check API quotas and limits
- Review error logs for specific failures

**Missing Hospital Data**
- Ensure CSV files are present in `attached_assets/`
- Check data loading in server logs
- Verify CSV format matches expected schema

**Build Failures**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run check`
- Verify all dependencies are compatible

### Logs and Debugging

- Server logs: Check console output for error messages
- Client logs: Open browser developer tools
- Database logs: Check PostgreSQL logs for connection issues

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test thoroughly
4. Submit a pull request with detailed description

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review existing GitHub issues
3. Create a new issue with detailed information about your problem

---

**Emergency Response AI System** - Saving lives through intelligent technology 🚨