# Fiambond: Tracking Family and Personal Finances.

Fiambond is a full stack financial tracking application to help people and families to manage their income, spending and financial goals. Fiambond is an application built on an API that uses Laravel and a React frontend enabling you to experience a clear and transparent, **fully responsive, app interface, whether on a phone, tablet, or computer**, to keep track of your financial well-being. 

### Live Application Link

**https://fiambond.web.app/welcome**

> **Disclaimer:** It is just a demo application. It is not about actual money transactions or actual money. Every information is purely demonstrative.

<img width="1851" height="911" alt="image" src="https://github.com/user-attachments/assets/472fe763-182b-4669-84c3-f2c2d1a41c8c" />

Figure 1. The Fiambond Opening displays the application's introduction, featuring well-known action buttons, such as login and register, with the same approach in the top side-bar that directs to the authentication process, and the FiamBond name redirects the user to this opening screen.

<img width="1834" height="911" alt="image" src="https://github.com/user-attachments/assets/42c214cd-dad3-4432-bdf8-0fa5b6d05bdf" />

<img width="1853" height="915" alt="image" src="https://github.com/user-attachments/assets/978c0401-8dd4-457a-b8cf-f2429a759d2d" />

Figure 2. The Fiambond V1 has integrated the Laravel + React, resulting in manual login, register and forgot password together with Brevo Gmail notification. In the FiamBond V2 will feature a polished feature Sign In With Google, that immediately register and login to the FiamBond's application. The users still manually authentication process, and Firebase integration notifies their email address.

Verify Email Address

<img width="1830" height="910" alt="image" src="https://github.com/user-attachments/assets/37ada9a7-827d-49a3-a11a-db4a8b515bd7" />

Figure 3. Once the register and login form processes the login credentials, the users must first validate their email address.

<img width="1855" height="918" alt="image" src="https://github.com/user-attachments/assets/90494758-6e81-48fe-90f1-0e5654e8c0b0" />

Figure 4. Upon clicking the Firebase link, it displays that users can now sign in the Fiambond's application. 

<img width="1833" height="910" alt="image" src="https://github.com/user-attachments/assets/7eb5a126-3743-43a1-82c0-bd8da3f9617e" />

<img width="1854" height="914" alt="image" src="https://github.com/user-attachments/assets/65ee4de1-0ca2-435d-9b0a-3fd743fe3c0d" />

Figure 5. The functionality of the Forgot Password immediately returns a command error requiring the user to enter their email address first on the Login page, and Firebase integration provides a link to change the user's password. 

<img width="1832" height="1751" alt="image" src="https://github.com/user-attachments/assets/6abef73e-651e-4370-9dca-64ab5c93c8be" />

Figure 6. The User dashboard serves as the central hub for financial management, featuring the dashboard cards (current money, active goals, and outstanding loans), action buttons (for adding transactions, recording a loans, adding goals and managing families), and a Financial Summary that allows users to toggle between weekly, monthly, and yearly data views on the bar graph (total inflow, total outflow, net position and analyst's summary).

<img width="1827" height="889" alt="image" src="https://github.com/user-attachments/assets/9dc9f7b7-178a-44bd-8fcf-2ff6e6b0e665" />

Figure 4. The View Transaction link displays the Personal Transaction modal, which contains a comprehensive breakdown of user income and expenses categorized by goals, loans, and family transactions. This modal also allows users to view receipts, leveraging Cloudinary for image hosting and retrieval.

<img width="1833" height="894" alt="image" src="https://github.com/user-attachments/assets/56d9ddf7-d7ac-40c3-a938-66b3e601faf4" />
<img width="1831" height="895" alt="image" src="https://github.com/user-attachments/assets/5b5ed023-9317-4590-9e11-59f61ac3c93e" />
<img width="1828" height="892" alt="image" src="https://github.com/user-attachments/assets/b9942527-bd1b-4fff-baa3-618a82233189" />

Figure 5. The View Goals link displays the Financial Goals, which contains a comprehensive breakdown of user active and history goals. This modal also allows users to abandon, mark completed - optional to upload their achievement, and view to the history, leveraging Cloudinary for image hosting and retrieval. 

Introduction of Lending Activity

<img width="1830" height="893" alt="image" src="https://github.com/user-attachments/assets/6bd7b6a2-5a19-4a4e-906d-a73ec7af6c65" />

Figure 6. The Lending Activity incorporates the collapsible section to simplify the long lending transactions, categorized as Action Required, Money You've Lent, and Money You've Borrowed.


<img width="1827" height="910" alt="image" src="https://github.com/user-attachments/assets/d813e150-2f86-4c5b-a99e-0b4d79909791" />


Figure 7. The Action Required section presents loan details (From: Creditor and To: Debtor), Optional fields (Deadline and View Loan Receipt), and Action buttons for Confirmation between the users and family members. 

<img width="1831" height="892" alt="image" src="https://github.com/user-attachments/assets/066b74c1-becd-4e64-aecf-818c254afc8c" />

Figure 8. The Debtor confirms fund receipt from Creditor when they click the submit button and this action transfers the loan to the Debtor's personal transaction history.

<img width="1831" height="891" alt="image" src="https://github.com/user-attachments/assets/ee79979f-f121-40fb-afc0-3edfc5716d11" />

Figure 9. The Creditor confirms repayment from Debtor when they click the submit button and this action transfers the loan to the Creditor's personal transaction history.

<img width="1828" height="889" alt="image" src="https://github.com/user-attachments/assets/88c7566c-5311-4846-bf42-c58caeec2f9b" />

Figure 10. The Money You've Lent section presents loan details (From: Creditor and To: Debtor), Optional fields (Deadline and View Loan eceipt), and Action buttons (Pending and Record Payment) between users and family members.

<img width="1825" height="892" alt="image" src="https://github.com/user-attachments/assets/f78987de-5392-4f07-b06e-a4fc114bf6f0" />

Figure 11. The Creditor received payment from Debtor when they click the submit button and optional attachment proof of receipt, and this action transfers the loan to the Creditor's personal transaction history.  

Money You've Borrowed

<img width="1830" height="890" alt="image" src="https://github.com/user-attachments/assets/4b9e62dc-1dff-4c47-a61c-c7c352a30b38" />
Figure 12. The Money You've Borrowed section presents (From: Creditor and To: Debtor), Optional fields (View Loan Receipt), and Action Buttons (Make Repayment), when the users already received the Creditor's loan.

<img width="1830" height="889" alt="image" src="https://github.com/user-attachments/assets/ccfea221-3664-42a9-9a99-d7753b7b07e3" />

Figure 13. The Debtor deduct the personal transaction when they click the submit button, and this action transfer the payment to the Creditor's Action Required section.

History

<img width="1829" height="888" alt="image" src="https://github.com/user-attachments/assets/82f61a54-6c60-4775-91bd-ccd10efc6e98" />

Figure 14. The history of loan shows the completed loan and their receipts between the Creditor and Debtor


<img width="1825" height="890" alt="image" src="https://github.com/user-attachments/assets/8f60a459-a8b3-4bef-91e1-a79217bd7727" />

Figure 15. The Add New Transaction embodies the income (Added) and Expense (Deducted), where users pick one and fill out the description, and optional add receipt to transmit to the personal transactions.

Record a New Loan (Choices: For a Family Member and To An Individual (Personal))

<img width="1825" height="891" alt="image" src="https://github.com/user-attachments/assets/bf2123b9-7fd2-47bb-a65c-d8a716868fc7" />

Figure 16. The Record a New Loan presents two choices, such as For a Family Member and To An Individual (Personal) to make systematic route in the Loan interaction

Select Family

<img width="1826" height="907" alt="image" src="https://github.com/user-attachments/assets/b9c4115e-0550-47e8-b2a5-d2ebe70f7ee5" />

Figure 17. The user creates a family if don't have to execute family loan between users and family members. 

Manage Families

<img width="1828" height="892" alt="image" src="https://github.com/user-attachments/assets/56bdd74d-b4a2-44fe-ba09-9df1cd30ebec" />

Figure 18. The users click the create a family or manage families, it presents this to create a family's name. The users can delete (if don't have a family transaction yet) or rename family's name. 

For a Family Member

<img width="1826" height="891" alt="image" src="https://github.com/user-attachments/assets/cdf621f4-5228-4b3f-b7fd-e6f52ff1cb7d" />

Figure 19. The Record a New Loan for family presents the lending fill out forms, such as select family member, loan, interest, reason/description, and optional fields (deadline and attachment receipt) to implement the Loan functionality  

To An Individual (Personal)

<img width="1828" height="890" alt="image" src="https://github.com/user-attachments/assets/1380bc5b-4b3c-48ae-bba8-e15c6e3e692c" />

Figure 20. The users allowed to enter their loan outside of the family or if family members are don't apply FiamBond's application to their daily life, like making a draft, and purpose is to remember and evidence of the users.

Add Goal

<img width="1826" height="893" alt="image" src="https://github.com/user-attachments/assets/653a69bb-583e-4462-8f8c-ddddbec2bf47" />

Figure 21. The Add Goal purpose is to enter their desired, amount and date financial goal. 

Families Realm

Family Dashboard

<img width="1832" height="1789" alt="image" src="https://github.com/user-attachments/assets/dbd92b85-1745-4a8c-8319-3716ba8d068a" />

Figure 22. The Manage Families button is the one way to go the Family Realm. It is same face of the personal dashboard, where display the action buttons (Add New Family Transaction, Family Goal, Record a Loan, and Manage Members), dashboard cards (Family Money Net, Active Family Goal, and Active Family Loans), and family financial summary using an bar graph (Total Inflow, Total Outflow and Analysis Summary) 

View Family Transaction

<img width="1830" height="911" alt="image" src="https://github.com/user-attachments/assets/4c561aa5-7a32-4785-af76-6ff71a705877" />

Figure 23. The View Family Transaction link displays the Family Transaction modal, which contains a comprehensive breakdown of family members income and expenses categorized by goals, loans, and family transactions. This modal also allows family members to view receipts, leveraging Cloudinary for image hosting and retrieval.

View Family Active Goal

<img width="1831" height="909" alt="image" src="https://github.com/user-attachments/assets/c42e8d29-8fdf-4673-a94f-cef7a136d40a" />
<img width="1828" height="903" alt="image" src="https://github.com/user-attachments/assets/b8437561-aaad-4237-8960-de5f651d97ea" />
<img width="1834" height="908" alt="image" src="https://github.com/user-attachments/assets/fec67887-bbe5-42cb-9a98-10e3cef05849" />

Figure 34. The View Family Goals link displays the Family Financial Goals, which contains a comprehensive breakdown of family active and history goals. This modal also allows family members to abandon, mark completed - optional to upload their achievement, and view to the history, leveraging Cloudinary for image hosting and retrieval. 

Introduction of Family Lending Activity

<img width="1825" height="906" alt="image" src="https://github.com/user-attachments/assets/5c5da2f6-9f5d-46e2-b7f0-73d9b5ed9c58" />
<img width="1830" height="907" alt="image" src="https://github.com/user-attachments/assets/96926368-d467-4e44-b403-f16ca1282d3b" />
<img width="1827" height="905" alt="image" src="https://github.com/user-attachments/assets/bb368d31-1639-40cf-96ae-8528bf33de11" />
<img width="1833" height="910" alt="image" src="https://github.com/user-attachments/assets/b28dc5ca-5d66-49da-bed0-5fc68a61f804" />

Figure 35. The Introduction of Family Lending Activity is already explanation enough to the Personal Lending Activity, but the difference is the specific family members to have a loan interaction. Only the creditor and debtor track their loan lending, and not part of family parties.

Add Family Transaction

<img width="1831" height="906" alt="image" src="https://github.com/user-attachments/assets/6f57c852-87d7-42d1-91bb-e09b5d57480c" />

Figure 36. The Add Family Transaction is same the functionality of the Personal Transaction, but the difference is when the users select the income, it deduct their personal transaction, because it transfer the money to the family money and when the users select the expense, it deduct to the family money.

Add Family Goal

<img width="1826" height="901" alt="image" src="https://github.com/user-attachments/assets/83182f9a-707c-4b81-a1f1-5aa5426d3151" />

Figure 37. The Family Goal is same the functionality of the Personal Goal, where the family members can fill out their financial family goal.

Record a Family Loan

<img width="1826" height="908" alt="image" src="https://github.com/user-attachments/assets/ad88dabb-ff13-4bdd-9019-044cb047062c" />

Figure 38. The Family Loan is the same the functionality of Personal Loan, where the creditor can lending to the family members, such as loan, interest, reason/description, and optional fields (Deadline and Attachment Receipt) to perform the functionality of Loan Tracking

Manage Members

<img width="1829" height="907" alt="image" src="https://github.com/user-attachments/assets/829350e9-6f8a-40f1-b832-5627f0daecd2" />

Figure 39. The users can add their family members with use their email address to have a interaction to the FiamBond's application

Account Settings

<img width="1832" height="1338" alt="image" src="https://github.com/user-attachments/assets/4d2e9798-659a-454d-8ec2-f2d481dd54a1" />

Figure 40. The users can change their profile information, such as first name, last name, email address or change their password.









































