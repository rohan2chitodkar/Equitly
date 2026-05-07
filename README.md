# Equitly — Splitwise Clone

> A full-stack expense splitting web application built with **React.js** and **Spring Boot**, using **MySQL** as the database.

---

## 🖥️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React.js 18 | UI Framework |
| React Router v6 | Client-side routing |
| Axios | HTTP requests to backend |
| Vite | Build tool and dev server |
| CSS Modules | Component-level styling |
| React Hot Toast | Notifications |

### Backend
| Technology | Purpose |
|---|---|
| Spring Boot 3.2 | Backend framework |
| Spring Security | Authentication and authorization |
| Spring Data JPA | Database ORM |
| Hibernate | SQL generation |
| MySQL 8 | Relational database |
| JWT (jjwt 0.12) | Stateless authentication |
| BCrypt | Password hashing |

---

## 📁 Project Structure

```
Equitly/
├── Equitly_Backend/          # Spring Boot backend
│   ├── src/main/java/com/equitly/
│   │   ├── config/           # Security, Password config
│   │   ├── controller/       # REST API endpoints
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── model/            # JPA entities (database tables)
│   │   ├── repository/       # Database queries
│   │   ├── security/         # JWT filter and utility
│   │   └── service/          # Business logic
│   └── src/main/resources/
│       └── application.properties
│
└── Equitly_Frontend/         # React.js frontend
├── src/
│   ├── api/              # Axios API calls
│   ├── components/       # Reusable UI components
│   │   ├── common/       # Modal, Avatar, BalanceTag
│   │   ├── expenses/     # AddExpenseModal, ExpenseList
│   │   ├── friends/      # SettleUpModal
│   │   └── layout/       # Topbar, Sidebar, Layout
│   ├── context/          # AuthContext, AppContext
│   ├── pages/            # Dashboard, Groups, Friends etc.
│   └── utils/            # formatCurrency, splitCalculator
└── vite.config.js
```

---

## ✨ Features

### Authentication
- ✅ Register with name, email, password and confirm password
- ✅ Login with email and password
- ✅ JWT token based authentication
- ✅ Password strength indicator
- ✅ Show/hide password toggle
- ✅ Specific error messages (User not found / Password does not match)

### Dashboard
- ✅ Total spent, you are owed, you owe stats
- ✅ Recent expenses list
- ✅ Settle up from dashboard
- ✅ Balance auto-updates after any action

### Groups
- ✅ Create groups with emoji and type
- ✅ Add members by email
- ✅ Share group link
- ✅ Expenses grouped by month
- ✅ Group balances with debt simplification
- ✅ Delete group (only when all settled)
- ✅ Leave group (only when your balance is zero)
- ✅ Tabs — Expenses, Balances, Members, Settings

### Expenses
- ✅ Add expenses with 4 split types:
  - **Equal** — split evenly
  - **Exact** — specify exact amount per person
  - **Percentage** — specify percentage per person
  - **Shares** — specify shares (e.g. 2:1:1)
- ✅ Edit and delete expenses
- ✅ Category icons (Food, Travel, Housing, etc.)
- ✅ You lent / You borrowed display

### Friends
- ✅ Add friends by email
- ✅ Remove friends
- ✅ View balance per friend
- ✅ Group members automatically shown in friends list
- ✅ Invite friend via email

### Balances
- ✅ Net balance calculation per friend
- ✅ Debt simplification algorithm (minimize transactions)
- ✅ Settle up with one click
- ✅ Balance recalculates immediately after settling

### Recent Activity
- ✅ Personalized messages (You added / User1 added you)
- ✅ All activity types tracked:
  - Expense added / updated / deleted
  - Group created / deleted
  - Member added / left
  - Settlement recorded
- ✅ New members only see activity after they joined
- ✅ Activity persists even after group deletion

### Sidebar
- ✅ All groups listed with emoji
- ✅ All friends and group members shown
- ✅ Balance shown per friend
- ✅ Your total balance summary

---

## 🗄️ Database Tables

users                  → User accounts
user_groups            → Groups (renamed from 'groups' — reserved word in MySQL)
group_members          → Many-to-many: group ↔ user
group_member_details   → Tracks when each user joined a group
expenses               → Expense records
expense_splits         → How each expense is split per user
settlements            → Settle up records
activities             → Activity feed log
activity_members       → Who can see each activity
friendships            → Many-to-many: user ↔ friend

---

## ⚙️ Prerequisites

Make sure these are installed on your machine:

| Tool | Version | Download |
|---|---|---|
| Java | 17 or higher | https://adoptium.net |
| Maven | Included in project | — |
| Node.js | 18 or higher | https://nodejs.org |
| MySQL | 8.0 or higher | https://dev.mysql.com/downloads |
| Spring Tool Suite (STS) | 4.x | https://spring.io/tools |
| VS Code | Latest | https://code.visualstudio.com |

---

## 🚀 Getting Started

### Step 1 — Clone the repository

```bash
git clone https://github.com/YourUsername/equitly.git
cd equitly
```

---

### Step 2 — Setup MySQL Database

Open **MySQL Workbench** and run:

```sql
CREATE DATABASE equitly;
```

Then run this to fix foreign key constraints:

```sql
USE equitly;

-- Create group member details tracking table
CREATE TABLE IF NOT EXISTS group_member_details (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    joined_at DATETIME NOT NULL DEFAULT NOW(),
    FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_member (group_id, user_id)
);

-- Create activity members table
CREATE TABLE IF NOT EXISTS activity_members (
    id VARCHAR(36) PRIMARY KEY,
    activity_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);
```

---

### Step 3 — Configure Backend

Open `Equitly_Backend/src/main/resources/application.properties`

Update with your MySQL credentials:

```properties
# Server
server.port=8081

# MySQL Database
spring.datasource.url=jdbc:mysql://localhost:3306/equitly?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

# JWT
jwt.secret=YourSuperSecretKeyThatIsAtLeast256BitsLongForHMACSHA256Algorithm!
jwt.expiration=86400000

# CORS
cors.allowed-origins=http://localhost:3000
```

---

### Step 4 — Run the Backend

Open the project in **Spring Tool Suite (STS)**:

File → Import → Maven → Existing Maven Projects
Browse to Equitly_Backend folder → Finish

Right-click `EquitlyApplication.java` → **Run As** → **Spring Boot App**

Wait for:

Started EquitlyApplication in X.XXX seconds
Tomcat started on port 8081

---

### Step 5 — Configure Frontend

Open `Equitly_Frontend/.env`:

VITE_API_BASE_URL=http://localhost:8081/api

---

### Step 6 — Run the Frontend

Open **VS Code** → Open folder `Equitly_Frontend`

Open terminal (`Ctrl + `` ` ``):

```bash
npm install
npm run dev
```

Wait for:

VITE v5.x.x  ready in XXX ms
➜  Local:   http://localhost:3000/

---

### Step 7 — Open the App

Go to **http://localhost:3000** in your browser.

You will see the **Equitly** login page. Click **Sign up** to create your account!

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → returns JWT |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/me` | Get current user |
| PUT | `/api/users/me` | Update profile |
| PUT | `/api/users/me/password` | Change password |

### Groups
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/groups` | Get all groups for current user |
| GET | `/api/groups/{id}` | Get group with expenses |
| POST | `/api/groups` | Create group |
| DELETE | `/api/groups/{id}` | Delete group |
| POST | `/api/groups/{id}/members` | Add member by email |
| DELETE | `/api/groups/{id}/members/{userId}` | Remove member |
| POST | `/api/groups/{id}/leave` | Leave group |
| GET | `/api/groups/{id}/balances` | Get simplified group balances |
| GET | `/api/groups/{id}/settled` | Check if group is fully settled |

### Expenses
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/expenses` | Get all expenses for current user |
| GET | `/api/expenses?groupId=X` | Get expenses for a group |
| POST | `/api/expenses` | Create expense with splits |
| PUT | `/api/expenses/{id}` | Update expense |
| DELETE | `/api/expenses/{id}` | Delete expense |

### Friends
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/friends` | Get friends list |
| POST | `/api/friends` | Add friend by email |
| DELETE | `/api/friends/{id}` | Remove friend |

### Balances
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/balances` | Get net balances with all friends |
| POST | `/api/balances/settle` | Record a settlement |

### Activity
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/activity` | Get personalized activity feed |

---

## 💡 Split Types Explained

| Type | How it works | Example |
|---|---|---|
| **Equal** | Divide total evenly | ₹3000 ÷ 4 people = ₹750 each |
| **Exact** | Specify each person's amount | A=₹1000, B=₹500, C=₹1500 |
| **Percentage** | Specify % per person (must = 100%) | A=50%, B=30%, C=20% |
| **Shares** | Specify ratio | A=2 shares, B=1 share → A pays 2/3 |

---

## 🧮 Balance Calculation Example

4 users in a group:
User1 pays ₹2400 equally (₹600 each)
→ U2 owes U1: ₹600
→ U3 owes U1: ₹600
→ U4 owes U1: ₹600
User2 pays ₹3000 equally (₹750 each)
→ U1 owes U2: ₹750
→ U3 owes U2: ₹750
→ U4 owes U2: ₹750
Net result:
U1: gets back ₹1800, owes ₹750  → net +₹1050
U2: gets back ₹2250, owes ₹600  → net +₹1650
U3: owes ₹600 + ₹750            → net -₹1350
U4: owes ₹600 + ₹750            → net -₹1350
After debt simplification:
U3 pays U2: ₹1350 (direct — skip U1 as middleman)
U4 pays U2: ₹300
U4 pays U1: ₹1050

---

## 🔧 Common Issues & Fixes

| Issue | Fix |
|---|---|
| `Table 'equitly.users' doesn't exist` | Set `ddl-auto=update`, restart backend |
| `groups` table error | Table is named `user_groups` — MySQL reserved word |
| `ERR_CONNECTION_REFUSED` | Backend is not running — start STS |
| `401 Unauthorized` | JWT expired — log out and log in again |
| `CORS error` | Check `cors.allowed-origins=http://localhost:3000` |
| Port 8081 in use | Change `server.port=8082` in properties |
| npm install fails | Delete `node_modules/` and run `npm install` again |

---

## 👨‍💻 Developer

**Rohan Chitodkar**

- GitHub: [@YourUsername](https://github.com/YourUsername)
- Project: [Equitly](https://github.com/YourUsername/equitly)

---

## 📄 License

This project is for educational purposes — built as a Splitwise clone to learn full-stack development with React.js and Spring Boot.

---

*Built with ❤️ using React.js + Spring Boot + MySQL*
