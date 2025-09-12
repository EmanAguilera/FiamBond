# CoinTrak: Tracking Family and Personal Finances.

CoinTrak is a full stack financial tracking application to help people and families to manage their income, spending and financial goals. CoinTrak is an application built on an API that uses Laravel and a React frontend enabling you to experience a clear and transparent, **fully responsive, app interface, whether on a phone, tablet, or computer**, to keep track of your financial well-being.

### Live Application Link

**https://cointrak.pages.dev**

> **Disclaimer:** It is just a demo application. It is not about actual money transactions or actual money. Every information is purely demonstrative.

---

## Table of Contents

-   [Core Functionalities](#core-functionalities)
    -   [1. Opening Page](#1-opening-page)
    -   [2. User Registration and Login](#2-user-registration--login)
    -   [3. Dashboard](#3-dashboard)
    -   [4. Adding Transactions](#4-add-transactions)
    -   [5. Goal Conflict Warning](#5-goal-conflict-warning)
    -   [6. Family Management](#6-family-management)
    -   [7. Family Ledger](#7-family-ledger)
    -   [8. Financial Goals Management](#8-financial-goals-management)
    -   [9. Personal Ledger](#9-personal-ledger)
    -   [10. Account Settings](#10-account-settings)
-   [Technologies Used](#technologies-used)

---

## Core Functionalities

The following section summarizes the key features that CoinTrak has to offer over a logical user-flow.

### 1. Opening Page

The opening page is a place where the application is introduced to the new visitors and where clear navigation towards creating a new account or logging-in to an already existing account is provided.

![Opening Page Screenshot](https://github.com/user-attachments/assets/0894e20f-e398-44a6-9b88-cd5eec6e8eeb)

### 2. User Registration and Login

The application has a secure and easy to use user authentication mechanism. Users can be registered and existing users can log in to their personalized dashboard.

| Registration Form                                                                                               | Login Form                                                                                                   |
| :-------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------: |
| ![Register Screenshot](https://github.com/user-attachments/assets/bb42b98f-654b-4782-a65f-1ecddeddc70d) | ![Login Screenshot](https://github.com/user-attachments/assets/7457589b-f07d-45cc-ab7b-68d4b3bdb688) |

### 3. Dashboard

Upon completing the log in, the user is presented with an elaborate dashboard which shows their **Current Personal Balance**, a summary of their **Family Ledgers** and the list of their **Recent Personal Transactions**.

![Dashboard Screenshot](https://github.com/user-attachments/assets/3f12ce5e-36aa-425f-9e5d-22a41d10bd48)

### 4. Adding Transactions

**Income** or **expense** transactions can be easily logged in by the users. All the transactions may be attributed to either their own account or an account of a particular family.

| Expense Transaction Form                                                                                                         | Income Transaction Form                                                                                                         |
| :-------------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------: |
| ![Expense Transaction Screenshot](https://github.com/user-attachments/assets/d590c002-449f-4aa7-926e-0cb35fb06210) | ![Income Transaction Screenshot](https://github.com/user-attachments/assets/4020a14a-2809-41eb-ba7c-37b82d329ddc) |

### 5. Goal Conflict Warning

To make you be mindful with your spending, the app will warn you when an expense is conflicting with an active goal, where you can choose between Acknowledging the Consequence and Abandoning the Goal.

![Goal Conflict Screenshot](https://github.com/user-attachments/assets/b3ee1767-3fb2-4aeb-8280-0858dc528e35)

### 6. Family Management

The users have the opportunity to create a collective family space, where they can use money together. The invitation by family owners to the group can be through email.

| Manage Families Page                                                                                                       | Family Details Page                                                                                                       |
| :-------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------: |
| ![Manage Families Screenshot](https://github.com/user-attachments/assets/65bd5280-3e55-41ed-8ed3-d50975474d5d) | ![Family Details Screenshot](https://github.com/user-attachments/assets/ad4cd9e8-948c-45b7-b1e3-e5f968062909) |

### 7. Family Ledger

Each family account has a ledger view, which is in detail, includes a chart showing the inflow and outflow, summary of the net financial position and the full list of all the transactions during the chosen period.

![Family Ledger Screenshot](https://github.com/user-attachments/assets/1c426570-7e0b-4318-aa78-bbc7987bac87)

### 8. Financial Goals Management

End-users are able to establish personal or family financial goals, monitor them and manage them. There is a clear distinction between the **Active Goals** and **Completed Goals** and it is easy to track progress.

![Financial Goals Screenshot](https://github.com/user-attachments/assets/6cc489f8-58a1-485b-bb78-74e2d7c81cf6)

### 9. Personal Ledger

Just like the family ledger, the personal ledger offers an in-depth financial account to the individual user including charts, summaries, and transaction history.

![Personal Ledger Screenshot](https://github.com/user-attachments/assets/f47686d0-cc39-4e39-869e-88737a6c9b42)

### 10. Account Settings

The users are enabled to change their profile details and change their password on the account settings page in a secure manner.

![Settings Screenshot](https://github.com/user-attachments/assets/5433e0f8-9311-401b-a9b2-853e51045f00)

---

## Technologies Used

### Backend (API)

-   PHP 8.2 & Laravel 11
-   PostgreSQL
-   Laravel Sanctum (for API Authentication)

### Frontend (Client)

-   React 18 & Vite
-   Tailwind CSS
-   React Router
-   Chart.js   

## Deployment

The deployment of the application is based on a modern decoupled architecture that is scalable and has performance guarantees.

### Backend (Laravel API)

- **Service:** Hosted on **Render**.
- **Process:** The API is containerized with the assistance of the Docker and is executed as a web service. Render is a tool that automatically constructs the Docker image based on the Dockerfile and deploy it, attaching it to an instance of a managed PostgreSQL database.

### Frontend (React App)

- **Service:** Linked to **Cloudflare Pages**.
- **Workflow:** Cloudflare Pages has direct connection with the GitHub repository. With each push to the main branch, it will construct the React application (with the npm run build command) then deploy the static files to its global edge network.
