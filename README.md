# DBMS Project

A modern web application built with React, TypeScript, and Supabase, featuring a beautiful UI powered by shadcn/ui components.

## 🚀 Tech Stack

- **Frontend Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS with shadcn/ui components
- **Backend/Database:** Supabase
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
├── public/              # Static assets
├── src/                # Source code
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks
│   ├── integrations/  # Third-party integrations
│   ├── lib/           # Utility functions and shared code
│   ├── pages/         # Application pages/routes
│   └── App.tsx        # Main application component
├── supabase/          # Supabase configuration
└── ...config files    # Various configuration files
```

## 🛠️ Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your Supabase environment variables
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

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
- And much more!

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
- **Testing:** (Add testing framework if implemented)

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
