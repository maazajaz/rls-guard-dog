<div align="center">
  <h1>RLS Guard Dog 🛡️</h1>
  <p>A Secure Multi-Tenant School Management System with Row-Level Security</p>

  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">

</div>

---

A full-stack web application that demonstrates a robust, multi-tenant security model for a school management system. Built with a modern tech stack, its core feature is the implementation of PostgreSQL's **Row-Level Security (RLS)** to ensure that users can only ever access the data they are explicitly permitted to see.

### **Live Demo:** **[https://rls-guard-dog-theta.vercel.app/](https://rls-guard-dog-theta.vercel.app/)**

*Feel free to use the **Sign Up** feature to create a student account and explore the application's workflow.*

---

## ✨ Key Features

This application provides a complete administrative workflow with three distinct roles, each with a unique set of permissions enforced at the database level.

-   **🔐 Role-Based Access Control:**
    -   **Student View:** Can view their own grades and request to join classes. Cannot see any other student's data.
    -   **Teacher View:** Can manage grades for students in their assigned classes and approve/deny enrollment requests.
    -   **Head Teacher View:** Full administrative access over their school's users, classrooms, and teacher assignments.

-   **👑 Full Administrative Dashboard:**
    -   **User Management:** Admins can view all users and promote/demote their roles.
    -   **Classroom Management:** Admins can create new classrooms.
    -   **Teacher Assignment:** Admins can assign teachers to specific classrooms.

-   **🎓 Advanced Class Enrollment System:**
    -   A complete, interactive workflow for students to request enrollment, which appears in the teacher's dashboard for approval.

---

## 📸 Screenshots

| Login Page                                     | Head Teacher Dashboard                               | Progress Reports                               |
| ---------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| | | |

---

## 🛠️ Tech Stack & Architecture

-   **Frontend:** **Next.js** (App Router), React, Tailwind CSS
-   **Backend & Primary DB:** **Supabase**
    -   **PostgreSQL** for relational data & RLS.
    -   **Supabase Auth** for user authentication.
    -   **Supabase Edge Functions** for server-side logic (e.g., analytics).
-   **Analytics DB:** **MongoDB** for storing pre-calculated data.
-   **Deployment:** **Vercel**

The architecture separates concerns by using PostgreSQL as the secure "source of truth" for core data, while MongoDB is used as a fast read-store for non-critical, derived data like analytics.

---

## 🚀 Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

-   Node.js (v18 or later)
-   npm or yarn
-   A Supabase account (free tier)
-   A MongoDB Atlas account (free tier)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/maazajaz/rls-guard-dog.git](https://github.com/maazajaz/rls-guard-dog.git)
    cd rls-guard-dog
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    -   Create a file named `.env.local` in the project root.
    -   Add your keys from Supabase and MongoDB Atlas.
        ```env
        NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
        NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
        ```

4.  **Set up the Supabase database:**
    -   Navigate to your Supabase project's SQL Editor.
    -   Run the SQL scripts located in the `/supabase/migrations` folder to create the necessary tables, roles, and RLS policies.

5.  **Run the development server:**
    ```sh
    npm run dev
    ```

The application will be available at `http://localhost:3000`.

---

## ✉️ Contact

Maaz Ajaz -  maazajaz1234@gmail.com - https://in.linkedin.com/in/maazajaz

Project Link: [https://github.com/maazajaz/rls-guard-dog](https://github.com/maazajaz/rls-guard-dog)

Portfolio - https://maazajaz.com
