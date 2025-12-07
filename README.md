# INSIGHTA - AI-Powered Customer Feedback Analytics Platform

## Project Overview

INSIGHTA is a modern, full-stack web application designed to transform customer feedback into actionable insights using artificial intelligence. The platform enables businesses to collect, analyze, and act on customer feedback in real-time, with powerful sentiment analysis, trend detection, and comprehensive analytics.

---

## Key Features

### 1. **Real-Time Feedback Collection**
- Collect customer feedback through an intuitive interface
- Support for various feedback types and categories
- Timestamp tracking for temporal analysis
- Tag and categorize feedback for better organization

### 2. **AI-Powered Sentiment Analysis**
- Automated sentiment detection (Positive, Negative, Neutral)
- Real-time sentiment gauge visualization on the homepage
- Confidence scoring for sentiment predictions
- Emotion detection and analysis

### 3. **Advanced Analytics Dashboard**
- Comprehensive feedback analytics with visual charts
- Sentiment distribution analysis
- Trend detection and forecasting
- Response time tracking
- User engagement metrics

### 4. **Admin Dashboard**
- Complete system management and monitoring
- User management and role assignment
- Database statistics and health monitoring
- Query explorer for advanced data analysis
- System performance tracking

### 5. **User Authentication & Authorization**
- Secure registration and login system
- Email verification
- Role-based access control (Admin, User)
- Password reset functionality
- Session management

### 6. **Responsive Design**
- Mobile-friendly interface
- Dark/Light mode support
- Modern UI with Tailwind CSS
- Smooth animations and transitions
- Accessibility-focused design

---

## Project Architecture

### Frontend Structure
```
client/
├── src/
│   ├── pages/              # Page components
│   │   ├── Home.jsx        # Landing page
│   │   ├── Dashboard.jsx   # User dashboard
│   │   ├── Analytics.jsx   # Analytics page
│   │   ├── Feedback.jsx    # Feedback submission
│   │   ├── AdminDashboard.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── ...
│   ├── components/         # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── Header.jsx
│   │   ├── AnimatedGauge.jsx
│   │   ├── PrivateRoute.jsx
│   │   └── ...
│   ├── context/            # React Context
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── services/           # API services
│   │   └── api.js
│   ├── styles/             # Global styles
│   │   ├── globals.css
│   │   └── index.css
│   ├── assets/             # Images and icons
│   └── utils/              # Utility functions
├── tailwind.config.js      # Tailwind configuration
└── vite.config.js          # Vite configuration

server/
├── config/                 # Configuration files
│   ├── db.js              # Database connection
│   ├── metrics.js         # Metrics setup
│   └── nodemailer.js      # Email configuration
├── controllers/            # Business logic
│   ├── authController.js
│   ├── userController.js
│   ├── feedbackController.js
│   └── adminController.js
├── models/                 # Database models
│   └── userModel.js
├── routes/                 # API routes
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── feedbackRoutes.js
│   └── adminRoutes.js
├── middleware/             # Custom middleware
│   ├── userAuth.js
│   └── adminAuth.js
├── scripts/                # Utility scripts
│   ├── seedAdmin.js
│   ├── seedFeedback.js
│   └── ...
└── server.js              # Main server file
```

### Backend Structure
- **Node.js + Express.js**: REST API server
- **MongoDB**: NoSQL database for data storage
- **JWT**: Authentication and authorization
- **Nodemailer**: Email notifications
- **Mongoose**: Database ODM

### Feedback Pipeline
```
feedback-pipeline/
├── ai-client.js           # AI service client
├── api-server.js          # Pipeline API
├── worker.js              # Processing worker
├── queue.js               # Job queue management
└── package.json
```

---

---

## Technology Stack

### Frontend
- **React 18.3.1**: UI library
- **Vite 5.2.11**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Chart.js**: Data visualization
- **Odibee Sans Font**: Custom typography

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM for MongoDB
- **JWT**: Token-based authentication
- **Nodemailer**: Email service
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization

### DevOps
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Prometheus**: Monitoring
- **Grafana**: Visualization

---

## Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (admin/user),
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Feedback Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  title: String,
  description: String,
  category: String,
  sentiment: String (positive/negative/neutral),
  confidenceScore: Number,
  rating: Number (1-5),
  tags: [String],
  status: String (pending/reviewed/resolved),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Security Features

1. **Password Hashing**: bcrypt for secure password storage
2. **JWT Authentication**: Stateless token-based auth
3. **CORS Protection**: Cross-origin request handling
4. **Input Validation**: Server-side validation for all inputs
5. **Email Verification**: Verify user email addresses
6. **Role-Based Access Control**: Different access levels for different users
7. **HTTP Headers**: Security headers configuration

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

### Feedback
- `GET /api/feedback` - Get all feedback
- `POST /api/feedback` - Submit new feedback
- `GET /api/feedback/:id` - Get feedback details
- `PUT /api/feedback/:id` - Update feedback
- `DELETE /api/feedback/:id` - Delete feedback

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/sentiment` - Sentiment analysis
- `GET /api/analytics/trends` - Trend analysis

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/stats` - System statistics
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

---

## Usage Guide

### For End Users
1. **Register/Login**: Create an account or sign in
2. **Submit Feedback**: Navigate to Feedback section and submit your feedback
3. **View Dashboard**: See your submitted feedback and analytics
4. **Check Analytics**: View sentiment trends and insights

### For Admins
1. **Login as Admin**: Use admin credentials
2. **Access Admin Dashboard**: View all users and feedback
3. **Manage Users**: Add, edit, or remove users
4. **Monitor Metrics**: Check system performance and statistics
5. **Query Explorer**: Run custom queries on data

---

## Deployment

### Docker Deployment
```bash
docker-compose up -d
```

This starts:
- MongoDB container
- Node.js backend
- React frontend
- Prometheus for metrics
- Grafana for visualization

### Manual Deployment
1. Deploy backend to Heroku/AWS
2. Deploy frontend to Vercel/Netlify
3. Configure MongoDB Atlas
4. Set environment variables
5. Update API URLs

---

## Scripts

### Frontend Scripts
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

### Backend Scripts
```bash
npm start                    # Start server
npm run dev                  # Start with nodemon
node scripts/seedAdmin.js    # Create admin user
node scripts/seedFeedback.js # Generate test feedback
node scripts/checkStats.js   # Check database stats
```

---

## Troubleshooting

### Issue: Cannot connect to MongoDB
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network access if using MongoDB Atlas

### Issue: CORS errors
- Check backend CORS configuration
- Verify frontend API URL
- Ensure proper headers in requests

### Issue: Email verification not working
- Configure SMTP settings in `.env`
- Check email credentials
- Verify firewall/port settings

### Issue: Slow sentiment analysis
- Check AI service connectivity
- Monitor CPU/memory usage
- Increase queue worker threads

---

## Documentation

- **API Documentation**: Available at `/api/docs`
- **Component Documentation**: Check JSDoc comments in components
- **Configuration Guide**: See config/ folder comments

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see LICENSE file for details.

---

## Team

- **Project Owner**: Sweehar
- **Repository**: https://github.com/Sweehar/PS_sample

---

## Support

For support, email support@insighta.app or open an issue on GitHub.

---

## Future Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced ML models for sentiment analysis
- [ ] Real-time collaboration features
- [ ] Integration with CRM systems
- [ ] Multi-language support
- [ ] Advanced reporting and exports
- [ ] API rate limiting and throttling
- [ ] WebSocket for real-time updates
- [ ] Enhanced security features
- [ ] Performance optimization

---

**Last Updated**: December 2025
**Version**: 1.0.0
