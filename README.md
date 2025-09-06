# FeedbackHub - Advanced Feedback Management System

A comprehensive feedback collection and analysis system built with Next.js, featuring Power BI-like analytics, multiple export formats, and real-time data visualization.

## 🚀 Features

### For Users

- **Beautiful Feedback Form**: Modern, responsive form with star ratings, categories, and anonymous submission
- **Multiple Input Types**: Name, email, phone, location, visit date, category selection
- **Interactive Rating System**: Visual star rating with hover effects
- **Anonymous Feedback**: Option to submit feedback anonymously
- **Real-time Validation**: Form validation with helpful error messages

### For Administrators

- **Comprehensive Dashboard**: Two views - Analytics and Table
- **Power BI-like Analytics**:
  - Interactive charts and graphs
  - Rating distribution analysis
  - Category breakdown
  - Sentiment analysis
  - Daily feedback trends
  - Location performance metrics
- **Advanced Filtering**: Search, filter by status, category, rating, and date range
- **Data Export**: Multiple formats (CSV, Excel, PDF) with filtering options
- **Status Management**: Track feedback through workflow (new → reviewed → resolved → archived)
- **Real-time Updates**: Live data refresh and status updates

### Analytics & Insights

- **Sentiment Analysis**: Automatic sentiment detection based on ratings and comments
- **Statistical Analysis**: Average ratings, distribution analysis, trend analysis
- **Visual Charts**: Bar charts, pie charts, area charts, and trend lines
- **Data Visualization**: Interactive charts with Recharts library
- **Export Capabilities**: Professional reports in multiple formats

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite with Prisma ORM
- **Charts**: Recharts
- **Icons**: Lucide React
- **Export**: XLSX, jsPDF
- **Date Handling**: date-fns

## 📦 Installation

### Quick Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd thukpa

# Run the setup script
node setup.js
```

### Manual Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Set up database
npx prisma db push

# Start development server
npm run dev
```

## 🗄️ Database Schema

The system uses a comprehensive feedback schema with the following fields:

```prisma
model Feedback {
  id         String   @id @default(cuid())
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  name       String
  contact    String?
  email      String?
  phone      String?
  rating     Int?
  comments   String?
  location   String?
  category   String?
  visitDate  DateTime?
  isAnonymous Boolean @default(false)
  tags       String?
  sentiment  String?
  status     String   @default("new")
}
```

## 🎯 Usage

### For Users

1. Visit the homepage at `http://localhost:3000`
2. Fill out the feedback form with your experience
3. Select appropriate category and rating
4. Submit feedback (optionally anonymously)

### For Administrators

1. Access the dashboard at `http://localhost:3000/dashboard`
2. Switch between Analytics and Table views
3. Use filters to analyze specific data
4. Export data in your preferred format
5. Update feedback status as needed

## 📊 Analytics Features

### Dashboard Views

- **Analytics View**: Comprehensive charts and visualizations
- **Table View**: Detailed data table with filtering and sorting

### Chart Types

- **Rating Distribution**: Bar and pie charts showing rating breakdown
- **Category Analysis**: Pie chart of feedback categories
- **Daily Trends**: Area chart showing feedback over time
- **Location Performance**: Table showing performance by location
- **Sentiment Analysis**: Distribution of positive/negative/neutral feedback

### Export Options

- **CSV**: Raw data export for spreadsheet analysis
- **Excel**: Multi-sheet workbook with summary statistics
- **PDF**: Professional reports with charts and tables

## 🔧 API Endpoints

### Feedback Management

- `POST /api/feedback` - Create new feedback
- `GET /api/feedback` - Get feedback with filtering
- `PATCH /api/feedback/[id]` - Update feedback status
- `DELETE /api/feedback/[id]` - Delete feedback

### Analytics

- `GET /api/analytics` - Get analytics data with date/category filters

### Export

- `GET /api/feedback/export?format=csv|excel|pdf` - Export data

## 🎨 Customization

### Styling

The system uses Tailwind CSS for styling. You can customize:

- Color schemes in `tailwind.config.js`
- Component styles in individual files
- Global styles in `app/globals.css`

### Database

- Modify `prisma/schema.prisma` to add new fields
- Run `npx prisma db push` to apply changes
- Update API endpoints and components accordingly

### Analytics

- Add new chart types in `AnalyticsDashboard.tsx`
- Modify data processing in `api/analytics/route.ts`
- Customize export formats in `api/feedback/export/route.ts`

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy

### Other Platforms

1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Set up database (PostgreSQL recommended for production)
4. Configure environment variables

## 📈 Performance

- **Client-side**: Optimized with React 19 and Next.js 15
- **Database**: Efficient queries with Prisma ORM
- **Charts**: Smooth animations with Recharts
- **Export**: Fast processing with streaming responses

## 🔒 Security

- Input validation on all forms
- SQL injection protection with Prisma
- XSS protection with React
- CSRF protection with Next.js

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🔄 Updates

The system is designed to be easily extensible. Future updates may include:

- Real-time notifications
- Advanced sentiment analysis
- Machine learning insights
- Mobile app integration
- Multi-language support
