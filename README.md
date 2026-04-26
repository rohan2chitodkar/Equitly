# SplitEase — Splitwise Clone

A full-stack expense splitting application built with **React.js** + **Spring Boot**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Axios, Vite |
| Backend | Spring Boot 3.2, Spring Security, JPA |
| Database | H2 (dev) / PostgreSQL (prod) |
| Auth | JWT (jjwt 0.12) |
| Styling | CSS Modules |

---

## Project Structure

```
splitease/
├── frontend/          # React.js app (Vite)
└── backend/           # Spring Boot app (Maven)
```

---

## Quick Start

### 1. Backend (Spring Boot)

```bash
cd backend
./mvnw spring-boot:run
```

- Runs on **http://localhost:8080**
- H2 console available at **http://localhost:8080/h2-console**
  - JDBC URL: `jdbc:h2:mem:splitease`
  - Username: `sa`, Password: *(empty)*

**Switch to PostgreSQL (production):**

Edit `src/main/resources/application.properties`:
```properties
# Comment out H2 lines and uncomment PostgreSQL lines
spring.datasource.url=jdbc:postgresql://localhost:5432/splitease
spring.datasource.username=postgres
spring.datasource.password=yourpassword
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

Create the database:
```sql
CREATE DATABASE splitease;
```

---

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

- Runs on **http://localhost:3000**
- API requests proxy to `http://localhost:8080` automatically via Vite config

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → returns JWT |

### Expenses
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/expenses` | Get all expenses for current user |
| GET | `/api/expenses?groupId=X` | Get expenses for a group |
| POST | `/api/expenses` | Create expense with splits |
| PUT | `/api/expenses/{id}` | Update expense |
| DELETE | `/api/expenses/{id}` | Delete expense |
| GET | `/api/expenses/activity` | Activity feed |

### Groups
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/groups` | Get user's groups |
| GET | `/api/groups/{id}` | Get group detail |
| POST | `/api/groups` | Create group |
| DELETE | `/api/groups/{id}` | Delete group |
| POST | `/api/groups/{id}/members` | Add member by email |
| DELETE | `/api/groups/{id}/members/{userId}` | Remove member |
| GET | `/api/groups/{id}/balances` | Group balances |

### Friends
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/friends` | Get friends list |
| POST | `/api/friends` | Add friend by email |
| DELETE | `/api/friends/{id}` | Remove friend |

### Balances
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/balances` | Net balances with all friends |
| POST | `/api/balances/settle` | Record a settlement |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/me` | Get current user |
| PUT | `/api/users/me` | Update profile |
| PUT | `/api/users/me/password` | Change password |

---

## Split Types

| Type | Description |
|---|---|
| `EQUAL` | Divide evenly among all participants |
| `EXACT` | Specify exact amount per person |
| `PERCENTAGE` | Specify percentage per person (must sum to 100) |
| `SHARES` | Assign shares (e.g., 2:1:1) |

---

## Features

- ✅ JWT Authentication (register / login / logout)
- ✅ Add expenses with 4 split types
- ✅ Create groups and manage members
- ✅ Add friends by email
- ✅ Net balance calculation per friend
- ✅ Settle up with friends
- ✅ Group-level expenses and balances
- ✅ Activity feed
- ✅ Delete expenses and groups
- ✅ Change password / update profile
- ✅ H2 in-memory DB for development
- ✅ PostgreSQL-ready for production

---

## Environment Variables

### Frontend (`frontend/.env`)
```
VITE_API_BASE_URL=http://localhost:8080/api
```

### Backend (`application.properties`)
```
jwt.secret=YourSuperSecretKeyThatIsAtLeast256BitsLong...
jwt.expiration=86400000   # 24 hours in ms
cors.allowed-origins=http://localhost:3000
```
