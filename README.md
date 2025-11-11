# Fiambond: Tracking Family and Personal Finances

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-%2361DAFB.svg?style=for-the-badge&logo=react&logoColor=black"/>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-%233178C6.svg?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img alt="Firebase" src="https://img.shields.io/badge/Firebase-%23FFCA28.svg?style=for-the-badge&logo=firebase&logoColor=black"/>
  <img alt="Cloudinary" src="https://img.shields.io/badge/Cloudinary-%233448C5.svg?style=for-the-badge&logo=cloudinary&logoColor=white"/>
  <img alt="Laravel" src="https://img.shields.io/badge/Laravel-%23FF2D20.svg?style=for-the-badge&logo=laravel&logoColor=white"/>
</p>

Fiambond is a full-stack financial tracking application designed to help individuals and families manage their income, spending, and financial goals. Built with a React frontend and a Firebase backend (migrated from an original Laravel API), Fiambond offers a clear, transparent, and fully responsive interface. Whether on a phone, tablet, or computer, you can keep track of your financial well-being.

The application provides a secure environment for managing personal finances, with the added capability of creating a "Family Realm" for collaborative financial tracking among family members.

---

## Key Features

The platform is divided into two major realms, each with specialized features:

### 👤 Personal Realm
- **Centralized Dashboard:** A comprehensive overview of your financial status, including current money, active goals, and outstanding loans.
- **Transaction Management:** Easily add income and expenses, with optional receipt uploads hosted on Cloudinary. A detailed transaction view provides a complete history of your financial activities.
- **Financial Goal Setting:** Create, track, and manage personal financial goals. You can mark goals as complete, abandon them, and even upload an "achievement photo" to celebrate your success.
- **Lending and Borrowing:** A robust system for tracking money you've lent to and borrowed from others, including family members and individuals outside the application.
- **Financial Summary:** Visualize your financial health with weekly, monthly, and yearly data views on a bar graph, complete with an analyst's summary.

### 👨‍👩‍👧‍👦 Family Realm
- **Collaborative Dashboard:** A shared space for family members to manage their collective finances, featuring family money net worth, active family goals, and active family loans.
- **Shared Transaction Ledger:** A transparent view of all family-related income and expenses, with the ability to view receipts and see who contributed to or spent from the family fund.
- **Family Financial Goals:** Set and track financial goals as a family, allowing all members to contribute and monitor progress.
- **Integrated Family Lending:** A dedicated system for managing loans between family members, with a two-way confirmation process to ensure accuracy and agreement. Only the creditor and debtor can view the details of their specific loan.
- **Member Management:** Easily invite family members to your Family Realm via their email address to begin collaborative financial tracking.

---

## 🛠️ Technology Stack

| Stack Component | Technologies Used |
|---|---|
| **Frontend** | React, TypeScript, Vite |
| **Backend & Database**| Firebase (Authentication, Firestore) |
| **Image Hosting** | Cloudinary |
| **Deployment** | Firebase Hosting, Cloudflare Pages |
| **Archived / Explored** | Laravel, PHP, Python, Docker Desktop, LocalStack (for AWS S3 simulation), Render, Back4app, Supabase (PostgreSQL) |

---

## Architectural Journey & Key Decisions

This project underwent a significant architectural evolution driven by the limitations of free-tier Platform-as-a-Service (PaaS) providers.

The initial version was built with a **Laravel API backend**. While functional, deploying this stack to free platforms presented critical, unsustainable challenges:
- **Service Expiration:** Services on platforms like **Render** had a 90-day expiration, making them unsuitable for a long-term project.
- **Temporary URLs:** The free tier on **Back4app** provided temporary, rotating URLs. Every time the application "woke up" from an idle state, the API endpoint would change. This created a painful and manual deployment cycle, requiring constant updates to the frontend's environment variables on **Cloudflare** to keep the application connected.

These issues made it clear that a more stable, serverless architecture was needed. To solve this, a strategic pivot was made:
- The entire Laravel backend was replaced with **Firebase's** robust serverless offerings (Authentication and Firestore), which provide a permanent, stable infrastructure on their free plan.
- For file storage, **Cloudinary** was selected for its generous free tier and powerful media APIs, avoiding the need for a custom backend or billable cloud storage solutions.

This journey demonstrates a practical approach to software development: recognizing the limitations of an initial architecture and migrating to a more sustainable solution that ensures long-term stability and a professional user experience.

---

## ⚙️ Live Application

Experience the live demo of the Fiambond application:

**https://fiambond.web.app/welcome**

> **Disclaimer:** This is a demo application. It does not involve actual money transactions. All information is for demonstration purposes only.

---

## 📸 Project Gallery

<details>
<summary><strong>🔑 User Authentication & Account Management</strong></summary>

---
<img width="1851" height="911" alt="image" src="https://github.com/user-attachments/assets/472fe763-182b-4669-84c3-f2c2d1a41c8c" />
Figure 1. The Fiambond Opening displays the application's introduction, featuring well-known action buttons, such as login and register.

---
<img width="1834" height="911" alt="image" src="https://github.com/user-attachments/assets/42c214cd-dad3-4432-bdf8-0fa5b6d05bdf" />
<img width="1853" height="915" alt="image" src="https://github.com/user-attachments/assets/978c0401-8dd4-457a-b8cf-f2429a759d2d" />
Figure 2. FiamBond V2 features both manual authentication and a "Sign In With Google" option for immediate registration and login via Firebase.

---
<img width="1830" height="910" alt="image" src="https://github.com/user-attachments/assets/37ada9a7-827d-49a3-a11a-db4a8b515bd7" />
Figure 3. After registration, users must first validate their email address.

---
<img width="1855" height="918" alt="image" src="https://github.com/user-attachments/assets/90494758-6e81-48fe-90f1-0e5654e8c0b0" />
Figure 4. Upon clicking the verification link from Firebase, this screen confirms that the user can now sign in.

---
<img width="1833" height="910" alt="image" src="https://github.com/user-attachments/assets/7eb5a126-3743-43a1-82c0-bd8da3f9617e" />
<img width="1854" height="914" alt="image" src="https://github.com/user-attachments/assets/65ee4de1-0ca2-435d-9b0a-3fd743fe3c0d" />
Figure 5. The Forgot Password functionality sends a secure link via Firebase to allow the user to change their password.

---
<img width="1832" height="1338" alt="image" src="https://github.com/user-attachments/assets/4d2e9798-659a-454d-8ec2-f2d481dd54a1" />
Figure 6. The Account Settings page where users can update their profile information and change their password.

</details>

<details>
<summary><strong>👤 Personal Dashboard & Core Features</strong></summary>

---
<img width="1832" height="1751" alt="image" src="https://github.com/user-attachments/assets/6abef73e-651e-4370-9dca-64ab5c93c8be" />
Figure 7. The User dashboard serves as the central hub for financial management, featuring summary cards, action buttons, and a financial summary graph.

---
<img width="1827" height="889" alt="image" src="https://github.com/user-attachments/assets/9dc9f7b7-178a-44bd-8fcf-2ff6e6b0e665" />
Figure 8. The Personal Transaction modal, which contains a comprehensive breakdown of user income and expenses with receipt viewing capabilities.

---
<img width="1833" height="894" alt="image" src="https://github.com/user-attachments/assets/56d9ddf7-d7ac-40c3-a938-66b3e601faf4" />
<img width="1831" height="895" alt="image" src="https://github.com/user-attachments/assets/5b5ed023-9317-4590-9e11-59f61ac3c93e" />
<img width="1828" height="892" alt="image" src="https://github.com/user-attachments/assets/b9942527-bd1b-4fff-baa3-618a82233189" />
Figure 9. The Financial Goals modal, showing active goals, the option to mark a goal as complete (with an optional achievement photo), and the goal history.

---
<img width="1825" height="890" alt="image" src="https://github.com/user-attachments/assets/8f60a459-a8b3-4bef-91e1-a79217bd7727" />
Figure 10. The "Add New Transaction" modal for recording personal income or expenses.

---
<img width="1826" height="893" alt="image" src="https://github.com/user-attachments/assets/653a69bb-583e-4462-8f8c-ddddbec2bf47" />
Figure 11. The "Add Goal" modal for entering a new personal financial goal.

</details>

<details>
<summary><strong>💸 Lending and Borrowing Activity</strong></summary>

---
<img width="1825" height="891" alt="image" src="https://github.com/user-attachments/assets/bf2123b9-7fd2-47bb-a65c-d8a716868fc7" />
Figure 12. The initial choice when recording a new loan: either "For a Family Member" or "To An Individual (Personal)".

---
<img width="1828" height="890" alt="image" src="https://github.com/user-attachments/assets/1380bc5b-4b3c-48ae-bba8-e15c6e3e692c" />
Figure 13. The form for recording a personal loan to an individual outside of the Fiambond family system.

---
<img width="1826" height="891" alt="image" src="https://github.com/user-attachments/assets/cdf621f4-5228-4b3f-b7fd-e6f52ff1cb7d" />
Figure 14. The form for recording a new loan to a specific family member within the application.

---
<img width="1830" height="893" alt="image" src="https://github.com/user-attachments/assets/6bd7b6a2-5a19-4a4e-906d-a73ec7af6c65" />
Figure 15. The Lending Activity section is organized into collapsible categories: "Action Required," "Money You've Lent," and "Money You've Borrowed."

---
<img width="1827" height="910" alt="image" src="https://github.com/user-attachments/assets/d813e150-2f86-4c5b-a99e-0b4d79909791" />
Figure 16. The "Action Required" section, which displays pending confirmations for loans and repayments between users.

---
<img width="1831" height="892" alt="image" src="https://github.com/user-attachments/assets/066b74c1-becd-4e64-aecf-818c254afc8c" />
Figure 17. A debtor confirms the receipt of funds from a creditor.

---
<img width="1831" height="891" alt="image" src="https://github.com/user-attachments/assets/ee79979f-f121-40fb-afc0-3edfc5716d11" />
Figure 18. A creditor confirms they have received a repayment from a debtor.

---
<img width="1828" height="889" alt="image" src="https://github.com/user-attachments/assets/88c7566c-5311-4846-bf42-c58caeec2f9b" />
Figure 19. The "Money You've Lent" section, showing details of active loans owed to the user.

---
<img width="1825" height="892" alt="image" src="https://github.com/user-attachments/assets/f78987de-5392-4f07-b06e-a4fc114bf6f0" />
Figure 20. A creditor recording a payment received from a debtor, with an option to attach proof.

---
<img width="1830" height="890" alt="image" src="https://github.com/user-attachments/assets/4b9e62dc-1dff-4c47-a61c-c7c352a30b38" />
Figure 21. The "Money You've Borrowed" section, showing details of loans the user owes.

---
<img width="1830" height="889" alt="image" src="https://github.com/user-attachments/assets/ccfea221-3664-42a9-9a99-d7753b7b07e3" />
Figure 22. A debtor making a repayment, which will then appear in the creditor's "Action Required" section for confirmation.

---
<img width="1829" height="888" alt="image" src="https://github.com/user-attachments/assets/82f61a54-6c60-4775-91bd-ccd10efc6e98" />
Figure 23. The loan history, displaying a record of all completed loans between the creditor and debtor.

</details>

<details>
<summary><strong>👨‍👩‍👧‍👦 Family Realm & Collaborative Finance</strong></summary>

---
<img width="1826" height="907" alt="image" src="https://github.com/user-attachments/assets/b9c4115e-0550-47e8-b2a5-d2ebe70f7ee5" />
Figure 24. A user must first create or select a family to engage in family-related financial activities.

---
<img width="1828" height="892" alt="image" src="https://github.com/user-attachments/assets/56bdd74d-b4a2-44fe-ba09-9df1cd30ebec" />
Figure 25. The "Manage Families" modal, where users can create, rename, or delete their family groups.

---
<img width="1832" height="1789" alt="image" src="https://github.com/user-attachments/assets/dbd92b85-1745-4a8c-8319-3716ba8d068a" />
Figure 26. The Family Dashboard provides a centralized view of the family's collective financial health.

---
<img width="1830" height="911" alt="image" src="https://github.com/user-attachments/assets/4c561aa5-7a32-4785-af76-6ff71a705877" />
Figure 27. The Family Transaction modal, showing a detailed breakdown of shared family income and expenses.

---
<img width="1831" height="909" alt="image" src="https://github.com/user-attachments/assets/c42e8d29-8fdf-4673-a94f-cef7a136d40a" />
<img width="1828" height="903" alt="image" src="https://github.com/user-attachments/assets/b8437561-aaad-4237-8960-de5f651d97ea" />
<img width="1834" height="908" alt="image" src="https://github.com/user-attachments/assets/fec67887-bbe5-42cb-9a98-10e3cef05849" />
Figure 28. The Family Goals modal, allowing members to view active goals, mark them as complete, and see goal history.

---
<img width="1825" height="906" alt="image" src="https://github.com/user-attachments/assets/5c5da2f6-9f5d-46e2-b7f0-73d9b5ed9c58" />
<img width="1830" height="907" alt="image" src="https://github.com/user-attachments/assets/96926368-d467-4e44-b403-f16ca1282d3b" />
<img width="1827" height="905" alt="image" src="https://github.com/user-attachments/assets/bb368d31-1639-40cf-96ae-8528bf33de11" />
<img width="1833" height="910" alt="image" src="https://github.com/user-attachments/assets/b28dc5ca-5d66-49da-bed0-5fc68a61f804" />
Figure 29. The Family Lending Activity is functionally identical to personal lending but is scoped to specific family members.

---
<img width="1831" height="906" alt="image" src="https://github.com/user-attachments/assets/6f57c852-87d7-42d1-91bb-e09b5d57480c" />
Figure 30. Adding a family transaction. An income transaction deducts from the user's personal funds and adds to the family pot. An expense deducts from the family pot.

---
<img width="1826" height="901" alt="image" src="https://github.com/user-attachments/assets/83182f9a-707c-4b81-a1f1-5aa5426d3151" />
Figure 31. The form for adding a new financial goal for the family.

---
<img width="1826" height="908" alt="image" src="https://github.com/user-attachments/assets/ad88dabb-ff13-4bdd-9019-044cb047062c" />
Figure 32. The form for a creditor to record a loan to another family member, including details like interest and reason.

---
<img width="1829" height="907" alt="image" src="https://github.com/user-attachments/assets/829350e9-6f8a-40f1-b832-5627f0daecd2" />
Figure 33. The "Manage Members" interface, where users can invite others to join their family realm via email.

</details>
