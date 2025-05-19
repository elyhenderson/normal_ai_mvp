# Normal AI

A modern web application built with Next.js, Tailwind CSS, and Supabase authentication.

## Features

- User authentication (sign up, sign in, sign out)
- Modern, responsive UI with Tailwind CSS
- Dark mode support
- Protected dashboard routes

## Tech Stack

- Next.js 13+ (App Router)
- Tailwind CSS
- Supabase (Authentication)
- TypeScript

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/elyhenderson/normal_ai_mvp.git
cd normal_ai_mvp
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development

- `app/` - Contains all the routes, components, and logic for your application
- `components/` - React components used throughout the application
- `utils/` - Helper functions and utilities
- `context/` - React Context for state management
