# DBMS Project

A modern web application built with React, TypeScript, and Supabase, featuring a beautiful UI powered by shadcn/ui components.

## 🚀 Tech Stack

- **Frontend Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS with shadcn/ui components
- **Backend/Database:** Supabase (PostgreSQL)
- **Build Tool:** Vite
- **Routing:** React Router DOM
- **Form Handling:** React Hook Form with Zod validation
- **Data Visualization:** Recharts
- **UI Components:**
  - Radix UI primitives
  - Sonner for toast notifications
  - Day Picker for date selection
  - Embla Carousel
  - and more...

## 📦 Project Structure

```
dbms/
├── public/               # Static assets
├── src/                 # Source code
│   ├── components/      # React components
│   ├── hooks/          # Custom React hooks
│   ├── integrations/   # Third-party integrations
│   ├── lib/            # Utility functions and shared code
│   ├── pages/          # Application pages/routes
│   └── App.tsx         # Main application component
├── supabase/           # Supabase configuration and migrations
│   ├── migrations/     # Database migration files
│   ├── functions.sql   # SQL functions and procedures
│   └── seed.sql        # Database seed data
└── ...config files     # Various configuration files
```

## 🛠️ Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your Supabase environment variables
4. Apply database migrations:
   ```bash
   npx supabase migration up
   ```
5. Seed the database:
   ```bash
   npx supabase db execute seed.sql
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 📊 Database Schema

### Core Tables
- **users** - User information (students and teachers)
- **courses** - Course information
- **academic_periods** - Semester/term periods
- **attendance** - Student attendance records
- **course_enrollments** - Student enrollment in courses
- **course_teachers** - Teacher assignments to courses

### Views
- **student_attendance_by_course** - Student attendance percentages by course
- **daily_attendance_report** - Daily attendance summary by course
- **attendance_summary** - Materialized view for attendance statistics

### Functions and Procedures
- **check_attendance_below_threshold** - Check if a student's attendance is below threshold
- **get_students_with_low_attendance** - List students with attendance below threshold
- **bulk_mark_attendance** - Mark attendance for multiple students at once
- **get_teacher_attendance_stats** - Get attendance statistics for a teacher's courses
- **search_students** - Search students by name, email, or ID
- **generate_attendance_report** - Generate attendance report for a course

### Database Features
- **Indexes** - Optimized queries for student_id, date, and role
- **Row-Level Security** - Protected database access
- **Triggers** - Automatic updates to statistics and validation
- **Materialized Views** - Precomputed attendance summaries
- **Referential Integrity** - Foreign key constraints
- **Validation** - Date validation within academic periods

## 🎨 Features

- Modern React patterns with TypeScript
- Responsive and accessible UI components
- Form validation with React Hook Form and Zod
- Data visualization capabilities with Recharts
- Real-time database functionality with Supabase
- Dark mode support
- Toast notifications
- Carousel functionality
- Date picking capabilities
- Course management
- Historical attendance tracking
- Statistical reporting
- Multi-semester support

## 📝 Notes

> **Security Note:** If you've committed any Supabase credentials, make sure to rotate them and use environment variables in production.

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📚 Dependencies

The project uses a carefully selected set of modern dependencies for optimal development experience:

- **UI Components:** shadcn/ui, Radix UI primitives
- **State Management:** React Query
- **Styling:** Tailwind CSS with animations
- **Development:** TypeScript, ESLint, Vite
- **Database:** Supabase, PostgreSQL

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ using modern web technologies
