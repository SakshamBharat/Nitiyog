# NitiYog — Saksham Bharat

A Node.js + Express web application for citizen scheme discovery, government service access, OTP-based verification, and role-based admin/user authentication.

## Features

- User registration and login
- OTP email verification
- Admin login and dashboard
- Scheme discovery/search landing page
- PostgreSQL database integration with Sequelize
- Session-based authentication
- Responsive EJS views and custom CSS styling

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Sequelize
- EJS
- bcryptjs
- express-session
- dotenv
- Brevo email integration

## Project Structure

```text
.
├── app.js
├── package.json
├── .env
├── .gitignore
├── README.md
├── config/
│   └── database.js
├── middleware/
│   └── auth.js
├── models/
│   ├── Application.js
│   ├── Otp.js
│   ├── Scheme.js
│   ├── SchemeCategory.js
│   ├── SchemeEligibility.js
│   ├── User.js
│   └── index.js
├── public/
│   ├── css/
│   └── js/
├── routes/
│   ├── admin.js
│   ├── auth.js
│   └── pages.js
├── seeders/
│   └── admin.js
├── services/
│   ├── brevo.service.js
│   └── otp.service.js
├── views/
│   ├── admin/
│   ├── user/
│   ├── login.ejs
│   ├── register.ejs
│   └── verify-otp.ejs
└── package-lock.json
```

## Prerequisites

Before running the project, make sure you have:

- Node.js installed
- PostgreSQL running locally or remotely
- A configured `.env` file

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
NODE_ENV=development

DATABASE_URL=postgresql://postgres:your_password@localhost:5432/nitiyog_db

SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
API_BASE_URL=http://localhost:3000

ADMIN_EMAIL=admin@nitiyog.gov.in
ADMIN_PASSWORD=admin@nitiyog

BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_NAME=NitiYog - A Saksham Bharat Product
BREVO_SENDER_EMAIL=your_sender_email
OTP_EXPIRY_MINUTES=10
```

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create and configure your `.env` file
4. Start PostgreSQL and ensure the database exists
5. Run the application:

```bash
node app.js
```

## Default Admin Account

The application automatically seeds an admin account on startup if it does not already exist.

- Email: `admin@nitiyog.gov.in`
- Password: configured through `ADMIN_PASSWORD`

## Available Routes

- `/` — Home page
- `/login` — User login
- `/register` — User registration
- `/verify-otp` — OTP verification
- `/admin/login` — Admin login
- `/admin/dashboard` — Admin dashboard

## Scripts

This project currently uses the default application startup command:

```bash
node app.js
```

## Notes

- The app uses `sequelize.sync({ alter: true })` for development convenience.
- For production, it is recommended to move to proper migrations.
- The project includes secure session handling and rate limiting on authentication routes.

## License

This project is licensed under the ISC License.
