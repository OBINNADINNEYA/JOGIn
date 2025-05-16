# JOG-In

A premium web application for runners and run club leaders, built with Next.js, Supabase, and Expo.

![JOG-In Preview](public/images/jogin-preview.png)

## Features

- **User Authentication**: Secure login and registration for runners and club leaders
- **Dashboard**: Personalized dashboard with activity tracking and club information
- **Club Management**: Create and manage running clubs, events, and memberships
- **Subscription System**: Premium features with Stripe integration
- **Responsive Design**: Modern UI that works across all devices
- **Theme Switching**: Toggle between dark and light modes

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Mobile**: Expo/React Native compatibility
- **Payments**: Stripe integration
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 16.8+ and npm/yarn
- Supabase account
- Stripe account (for payment features)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/jogin.git
cd jogin
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
```
cp .env.example .env.local
```
Fill in your Supabase and Stripe credentials in the `.env.local` file.

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Database Setup

The app requires several tables in Supabase:
- profiles
- run_clubs
- run_club_memberships
- subscriptions
- posts

Run the SQL migrations in the `supabase/migrations` directory to set up the database schema.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- WHOOP for design inspiration
- Supabase for backend services
- Next.js team for the amazing framework 