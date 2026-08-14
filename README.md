# bangbangya-server

Backend server for 帮帮鸭 (BangBangYa) business directory platform.

## Tech Stack

- **Runtime**: Node.js + Express
- **Database**: MongoDB (company data, filtering, search)
- **Import Pipeline**: Excel/CSV data processing
- **Middleware**: CORS, body-parser, error handling

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB connection string

# Start server
npm start
# or for development with auto-reload:
npm run dev
```

Server runs on `http://localhost:3000` (or port specified in `.env`)

## Project Structure

```
bangbangya-server/
├── routes/          # API endpoints
├── services/        # Business logic
├── middleware/      # Auth, validation, error handling
├── db/              # Database models and connection
├── data/            # Static data files
├── imports/         # Excel import scripts
└── index.js         # Entry point
```

## API Endpoints

- `GET /api/companies` - List companies with filtering
- `GET /api/companies/:id` - Get company details
- `POST /api/companies/search` - Search companies
- `POST /api/import` - Import data from Excel/CSV

## Data Import

```bash
# Test import format detection
node detect-format.js path/to/file.xlsx

# Run import
node import.js path/to/file.xlsx
```

## License

MIT
