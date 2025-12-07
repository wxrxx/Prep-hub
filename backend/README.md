# PREP HUB Backend

## 🚀 วิธีติดตั้งและรัน

### 1. ติดตั้ง Dependencies
```bash
cd backend
npm install
```

### 2. รันเซิร์ฟเวอร์
```bash
npm start
```

หรือใช้ development mode (auto-reload):
```bash
npm run dev
```

### 3. ทดสอบ API
เปิด browser ไปที่: http://localhost:3000/api

---

## 📋 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | สมัครสมาชิก |
| POST | `/api/auth/login` | เข้าสู่ระบบ |
| GET | `/api/auth/me` | ดูข้อมูลตัวเอง |
| PUT | `/api/auth/profile` | แก้ไขโปรไฟล์ |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | ดูคอร์สทั้งหมด |
| GET | `/api/courses/:id` | ดูคอร์สเดียว |
| POST | `/api/courses` | เพิ่มคอร์ส (Admin) |
| PUT | `/api/courses/:id` | แก้ไขคอร์ส (Admin) |
| DELETE | `/api/courses/:id` | ลบคอร์ส (Admin) |

### Favorites
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favorites` | ดูรายการโปรด |
| POST | `/api/favorites/:courseId` | เพิ่มรายการโปรด |
| DELETE | `/api/favorites/:courseId` | ลบรายการโปรด |

### Brands
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/brands` | ดูสถาบันทั้งหมด |
| GET | `/api/brands/:id` | ดูสถาบันเดียว |

### Users (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | ดูผู้ใช้ทั้งหมด |
| DELETE | `/api/users/:id` | ลบผู้ใช้ |

---

## 🔐 Admin Login

```
Email: admin@prephub.com
Password: admin123
```

---

## 📦 Query Parameters

### GET /api/courses
- `category` - กรองตามหมวด (ม.4, ม.6, สายแพทย์)
- `brand` - กรองตามสถาบัน
- `search` - ค้นหาจากชื่อ/คำอธิบาย
- `sort` - เรียงลำดับ (price_asc, price_desc, rating, popular, newest)
- `limit` - จำนวนต่อหน้า (default: 50)
- `offset` - เลื่อน pagination

**ตัวอย่าง:**
```
GET /api/courses?category=ม.6&sort=rating&limit=10
```

---

## 🔒 Authentication

ใช้ JWT Token ใน Header:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

Token ได้จาก `/api/auth/login` หรือ `/api/auth/register`

---

## 📁 โครงสร้างโฟลเดอร์

```
backend/
├── package.json
├── server.js          # Main entry
├── config/
│   └── database.js    # SQLite connection
├── middleware/
│   └── auth.js        # JWT middleware
├── models/
│   └── init.js        # Database schema
├── routes/
│   ├── auth.js
│   ├── courses.js
│   ├── favorites.js
│   ├── users.js
│   └── brands.js
└── data/
    └── database.sqlite
```
