# Fiambond: Tracking Family and Personal Finances

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-%2361DAFB.svg?style=for-the-badge&logo=react&logoColor=black"/>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-%233178C6.svg?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img alt="NodeJS" src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white"/>
  <img alt="Express.js" src="https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB"/>
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white"/>
  <img alt="Firebase" src="https://img.shields.io/badge/Firebase-%23FFCA28.svg?style=for-the-badge&logo=firebase&logoColor=black"/>
  <img alt="Cloudinary" src="https://img.shields.io/badge/Cloudinary-%233448C5.svg?style=for-the-badge&logo=cloudinary&logoColor=white"/>
</p>

Fiamband is a complete full-stack finance tracking app that was designed to help individuals and families manage their income and expenses and financial goals in a systematic way. The Fiambond, which is based on a React front end and Firebase back end (previously based on the original Laravel API), provides an easy-to-understand, easy-to-read, and fully-responsive interface.  Depending on a mobile phone, tablet, and desktop computer, the user can easily track the financial well-being.  

The app allows to have a safe space to handle personal finances, with the added option of creating a so-called Family Realm in which family members can use to track their finances jointly.

---

## Key Features

The platform is divided into two major realms, each with specialized features:

### 👤 Personal Realm
- **Centralized Dashboard:** The level of financial status of a person is presented in a full picture in terms of current liquid assets, active goals, and outstanding loans.  
- **Transaction Management:** Income and expenses are added conveniently and there is an optional feature of uploading receipts which are hosted on Cloudinary; a detailed view of transactions provides a complete history of the transactions.  
- **Financial Goal Setting:** All personal financial goals can be generated, monitored, and adjusted; the user can indicate the goal as accomplished or give up on it, and even add an achievement photo to show the success.  
- **Lending and Borrowing:** This is a strong system that monitors money borrowed and given to other people in the family and outside of the family.  
- **Financial Summary:** The visualisation of financial health is presented in weekly, monthly, and annual data presented on bar graphs with an analysis summary.  

### 👨‍👩‍👧‍👦 Family Realm
- **Collaborative Dashboard:** A common pool of finances is availed to family members to operate their common finances into focus with net family wealth, active family objectives, and family loans.  
- **Shared Transaction Ledger:** All income and expenses connected with the family are presented in a transparent manner with the possibility to see the receipts and recognize the contributors or spenders of the family fund.  
- **Family Financial Goals:** Financial objectives can be established and tracked together as a family with all members having a contribution and being able to see the progress.  
- **Integrated Family Lending:** Loans amongst the members of the family are handled in a special system that has a two-way confirmation system to ascertain accuracy and agreement as the debtor and the creditor are the only people who see the details of their loan.  
- **Member Management:** The Invitation of family members to the Family Realm is facilitated through their email addresses, and thus, collaborative financial tracking is launched.

---

## 🛠️ Technology Stack

| Stack Component | Technologies Used |
|---|---|
| **Frontend** | React, TypeScript, Vite |
| **Backend API**| Node.js, Express.js |
| **Hybrid Database**| MongoDB (Core Data) & Firebase Firestore (User Profiles) |
| **Authentication**| Firebase Auth |
| **Image Hosting** | Cloudinary |
| **Deployment** | Firebase Hosting |
| **Archived / Explored** | Cloudflare Pages, Render, Laravel, PHP, Python, Docker Desktop, LocalStack, Supabase (PostgreSQL) |

---

## Architectural Journey & Key Decisions

It was marked by a significant architectural transformation of the project, which was dictated by the limitations of free-of-charge Platform-as-a-Service (PaaS) providers.

The first release made use of a **Laravel-based API** server. In spite of its use, implementation of this stack on free platforms presented essential, non-sustainable issues:
- **Service Expiration:** Services provided by providers like **Render** do expire in 90 days, which makes them not suitable in long-term projects.
- **Temporary URLs:** **Back4app** the free version provides temporary URLs that are rotating. Whenever it is reinstated after the application has been put into an idle position, the API endpoint differs, which requires a painstaking, manual deployment process and constant updates of the frontend environment variables on **Cloudflare** to keep connected.

The above limitations had pointed to the need to have a more stable, server-free architecture. As a result, there was a strategic pivot to a Hybrid Architecture:
- **Node.js, Express.js, & MongoDB:** To ensure complete control over data relationships and API logic, the core backend was migrated to a custom RESTful API using Node.js and Express. This is backed by MongoDB (Atlas), which provides a permanent, scalable database solution for handling complex financial transactions and loan records without the risk of data loss or service expiration.
- **Firebase:** To leverage robust security without reinventing the wheel, Firebase Authentication and Firestore were retained to h[4]andle user identity and profile management, working in sync with the Node.js backend.
- **Cloudinary:** To store files, Cloudinary was chosen due to its large free option and efficient media APIs, eliminatin[1][2][5]g the necessity of a custom backend file system or paid cloud storage.

This transformation is a typical example of a practical attitude to software development; it recognizes the constraints of the original design but transitions to a long-term viable MERN-Hybrid design that ensures stability and a professional user experience.

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
Figure 1. The Fiambond Opening demonstrates the introductory interface of the app, with the most prominent action control being login and register.

---
<img width="1834" height="911" alt="image" src="https://github.com/user-attachments/assets/42c214cd-dad3-4432-bdf8-0fa5b6d05bdf" />
<img width="1853" height="915" alt="image" src="https://github.com/user-attachments/assets/978c0401-8dd4-457a-b8cf-f2429a759d2d" />
Figure 2. FiamBond V2 will have the option of manual authentication and Sign In With Google, thus allowing an immediate registration and a login with Firebase.

---
<img width="1365" height="677" alt="image" src="https://github.com/user-attachments/assets/fc9db7f5-17b9-4707-8bfb-8a35b0bcbb4b" />
Figure 3. Once registered, one must verify their e-mail address.

---
<img width="1855" height="918" alt="image" src="https://github.com/user-attachments/assets/90494758-6e81-48fe-90f1-0e5654e8c0b0" />
Figure 4. When the verification link is being clicked, the Firebase provides this screen which guarantees the user that he is now authorized to sign in.

---
<img width="1360" height="674" alt="image" src="https://github.com/user-attachments/assets/474f3434-c986-4e74-b7f1-465cab9d7140" />
<img width="1383" height="678" alt="image" src="https://github.com/user-attachments/assets/d67db565-70a2-43c2-a25d-a3d7e2055b98" />
Figure 5. The Forgot Password option sends a secure connection through Firebase, which allows the user to modify their password.

---
<img width="998" height="724" alt="image" src="https://github.com/user-attachments/assets/caa46d75-11b1-4484-b932-c228f4b9a5c1" />
Figure 6. The Account Settings page enables the user to change their profile information and change the password.

</details>

<details>
<summary><strong>👤 Personal Dashboard & Core Features</strong></summary>

---
<img width="1832" height="1751" alt="image" src="https://github.com/user-attachments/assets/6abef73e-651e-4370-9dca-64ab5c93c8be" />
Figure 7. The User dashboard is the overall financial management center that has summary cards, a set of action buttons, and a financial status representation graph.

---
<img width="1827" height="889" alt="image" src="https://github.com/user-attachments/assets/9dc9f7b7-178a-44bd-8fcf-2ff6e6b0e665" />
Figure 8. The Personal Transaction modal shows a complete analysis of the user income and expenses, with the ability of printed receipts.

---
<img width="1833" height="894" alt="image" src="https://github.com/user-attachments/assets/56d9ddf7-d7ac-40c3-a938-66b3e601faf4" />
<img width="1831" height="895" alt="image" src="https://github.com/user-attachments/assets/5b5ed023-9317-4590-9e11-59f61ac3c93e" />
<img width="1828" height="892" alt="image" src="https://github.com/user-attachments/assets/b9942527-bd1b-4fff-baa3-618a82233189" />
Figure 9. The Financial Goals modal shows active goals, allows one to mark a goal complete (possibly with an achievement photo), and also keeps a goal history.

---
<img width="1825" height="890" alt="image" src="https://github.com/user-attachments/assets/8f60a459-a8b3-4bef-91e1-a79217bd7727" />
Figure 10. The modal titled Add New Transaction enables one to record personal income or expenses.

---
<img width="1826" height="893" alt="image" src="https://github.com/user-attachments/assets/653a69bb-583e-4462-8f8c-ddddbec2bf47" />
Figure 11. The modal of adding a goal allows one to add a new personal financial goal.

</details>

<details>
<summary><strong>💸 Lending and Borrowing Activity</strong></summary>

---
<img width="1825" height="891" alt="image" src="https://github.com/user-attachments/assets/bf2123b9-7fd2-47bb-a65c-d8a716868fc7" />
Figure 12. The first option to be entered when recording a new loan is either to a Family Member or to an individual (Personal).

---
<img width="1828" height="890" alt="image" src="https://github.com/user-attachments/assets/1380bc5b-4b3c-48ae-bba8-e15c6e3e692c" />
Figure 13. The application to be filled in recording a personal loan to a person who is not part of the Fiambond family system is shown.

---
<img width="1826" height="891" alt="image" src="https://github.com/user-attachments/assets/cdf621f4-5228-4b3f-b7fd-e6f52ff1cb7d" />
Figure 14. The loan form that is used to register a new loan to a particular family member is provided in the application.

---
<img width="1830" height="893" alt="image" src="https://github.com/user-attachments/assets/6bd7b6a2-5a19-4a4e-906d-a73ec7af6c65" />
Figure 15. The Lending Activity section is divided into collapsible groups, including: Action required, Money you have lent and Money you have borrowed.

---
<img width="1827" height="910" alt="image" src="https://github.com/user-attachments/assets/d813e150-2f86-4c5b-a99e-0b4d79909791" />
Figure 16. The section of Action required shows the unfinished confirmations of loans and repayments among users.

---
<img width="1831" height="892" alt="image" src="https://github.com/user-attachments/assets/066b74c1-becd-4e64-aecf-818c254afc8c" />
Figure 17. Debtor recognizes the money received by a creditor.

---
<img width="1831" height="891" alt="image" src="https://github.com/user-attachments/assets/ee79979f-f121-40fb-afc0-3edfc5716d11" />
Figure 18. A creditor ascertains that a debtor repays his or her debt.

---
<img width="1828" height="889" alt="image" src="https://github.com/user-attachments/assets/88c7566c-5311-4846-bf42-c58caeec2f9b" />
Figure 19. The Money you have lent section displays the information regarding the loan directions that the user has.

---
<img width="1825" height="892" alt="image" src="https://github.com/user-attachments/assets/f78987de-5392-4f07-b06e-a4fc114bf6f0" />
Figure 20. The creditor enters the payment made by a debtor, and he or she can append evidence.

---
<img width="1830" height="890" alt="image" src="https://github.com/user-attachments/assets/4b9e62dc-1dff-4c47-a61c-c7c352a30b38" />
Figure 21. The Money You have Borrowed page displays the information about loans the user is owing.

---
<img width="1830" height="889" alt="image" src="https://github.com/user-attachments/assets/ccfea221-3664-42a9-9a99-d7753b7b07e3" />
Figure 22. The debtor repays and this is registered in the creditor Action required section.

---
<img width="1829" height="888" alt="image" src="https://github.com/user-attachments/assets/82f61a54-6c60-4775-91bd-ccd10efc6e98" />
Figure 23. The loan history shows the list of the loan history between the debtor and the creditor.

</details>

<details>
<summary><strong>👨‍👩‍👧‍👦 Family Realm & Collaborative Finance</strong></summary>

---
<img width="1826" height="907" alt="image" src="https://github.com/user-attachments/assets/b9c4115e-0550-47e8-b2a5-d2ebe70f7ee5" />
Figure 24. One condition that is prerequisite to the users is the formation or choice of a family cohort before indulging oneself in a family-related financial activity.  

---
<img width="1828" height="892" alt="image" src="https://github.com/user-attachments/assets/56bdd74d-b4a2-44fe-ba09-9df1cd30ebec" />
Figure 25. The Manage Families modal, where the users have the ability to create their family groups, rename them, or delete them.  

---
<img width="1832" height="1789" alt="image" src="https://github.com/user-attachments/assets/dbd92b85-1745-4a8c-8319-3716ba8d068a" />
Figure 26. The Family Dashboard provides a summary of the family financial health.  

---
<img width="1830" height="911" alt="image" src="https://github.com/user-attachments/assets/4c561aa5-7a32-4785-af76-6ff71a705877" />
Figure 27. Family Transaction modal shows an extensive information on family income and spending shared.  

---
<img width="1831" height="909" alt="image" src="https://github.com/user-attachments/assets/c42e8d29-8fdf-4673-a94f-cef7a136d40a" />
<img width="1828" height="903" alt="image" src="https://github.com/user-attachments/assets/b8437561-aaad-4237-8960-de5f651d97ea" />
<img width="1834" height="908" alt="image" src="https://github.com/user-attachments/assets/fec67887-bbe5-42cb-9a98-10e3cef05849" />
Figure 28. The Family Goals modal allows the members to see goal objectives that were currently undertaken, indicate that they are finished and the history of goals.  

---
<img width="1825" height="906" alt="image" src="https://github.com/user-attachments/assets/5c5da2f6-9f5d-46e2-b7f0-73d9b5ed9c58" />
<img width="1830" height="907" alt="image" src="https://github.com/user-attachments/assets/96926368-d467-4e44-b403-f16ca1282d3b" />
<img width="1827" height="905" alt="image" src="https://github.com/user-attachments/assets/bb368d31-1639-40cf-96ae-8528bf33de11" />
<img width="1833" height="910" alt="image" src="https://github.com/user-attachments/assets/b28dc5ca-5d66-49da-bed0-5fc68a61f804" />
Figure 29. The Family Lending Activity is effectively identical to personal lending except in that it is limited to selected family members.  

---
<img width="1831" height="906" alt="image" src="https://github.com/user-attachments/assets/6f57c852-87d7-42d1-91bb-e09b5d57480c" />
Figure 30. There is the addition of a family transaction, which is the deduction of an income entry to the personal funds, and addition of an expense to the family pot.  

---
<img width="1826" height="901" alt="image" src="https://github.com/user-attachments/assets/83182f9a-707c-4b81-a1f1-5aa5426d3151" />
Figure 31. The form to include the new financial goal of the family.  

---
<img width="1826" height="908" alt="image" src="https://github.com/user-attachments/assets/ad88dabb-ff13-4bdd-9019-044cb047062c" />
Figure 32. The form that enables a creditor to document a loan to another family member, with specification of interest, and the reason why it is so.  

---
<img width="1467" height="718" alt="image" src="https://github.com/user-attachments/assets/4fa61417-9139-4bf6-a4a1-8ec3a01eaa2c" />
Figure 33. The interface application, Manage Members which allows users to invite others to join to their family realm through email.  

</details>
