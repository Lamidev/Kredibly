# Kredibly V3: Merchant Dashboard Design & Philosophy Blueprint

The transition from Kredibly V1 to V2/V3 marks a major philosophical shift in how software serves small and medium businesses. 

*   **V1 Mental Model**: The dashboard is a manual transactional workspace (Create Invoice, Record Payment, Send Reminder).
*   **V3 Mental Model**: **WhatsApp (Kreddy) is the business workspace. The Dashboard is Mission Control.** The web dashboard is exclusively reserved for **Observation, Configuration, Auditing, and Exception Handling**.

---

## 1. Core Operating Rule
> The dashboard must never become a second way of performing the same operational task. It exists to observe, configure, review, analyze, and override what Kreddy is already doing conversationally on WhatsApp.
>
> **Every feature check**:
> *   Can Kreddy already do this conversationally? ➔ Don't duplicate it.
> *   Does this require visualization, oversight, bulk management, or exception handling? ➔ It belongs on the dashboard.

---

## 2. Global Navigation & Information Architecture

The sidebar navigation links are organized strictly around the merchant's business objects:

```
🏠 Mission Control  ➔ Attention & Timelines
👥 Customers        ➔ CRM & AI Memory
📋 Workspace        ➔ Work In Progress Board (Swimlanes)
💰 Money            ➔ Income, Expenses, Payouts, Subscriptions
✅ Tasks            ➔ Reminders, Collections, Follow-ups
🧠 Kreddy           ➔ AI OS Morning Brief, Predictions, Insights
⚙️ Settings         ➔ Configuration & Billing
```

---

## 3. Global Dashboard Elements

### A. The Linear-Style Command Bar (Top of Every Page)
Every page on the dashboard renders a prominent central input field:
```
┌────────────────────────────────────────────────────────┐
│  🔍 Ask or tell Kreddy anything...                    │
└────────────────────────────────────────────────────────┘
```
The placeholder rotates dynamically to teach capabilities:
*   *Create invoice...* | *Who still owes me?* | *Show today's collections* | *Add fuel expense* | *Find Rebecca* | *Call David tomorrow...* | *Who usually pays late?*
*   Tapping or submitting a command routes the text directly to the Kreddy webhook engine for execution.

### B. Floating Quick Capture (Bottom Right of Every Page)
A persistent floating `+` button that opens a popup menu for quick action triggers:
*   `Ask Kreddy` (Focuses command bar)
*   `Record Sale`
*   `Expense`
*   `Task`
*(Note: Customers are not created manually; they emerge naturally when invoices or payments are logged.)*

---

## 4. Entity Page breakdowns

### 1. Mission Control (Home)
Designed to answer a single question: *"What needs my attention right now?"*
*   **Today's Snapshot Cards (Exactly 4 Numbers)**:
    1.  *Collected Today* (settled Nomba payments)
    2.  *Outstanding* (total unpaid accounts receivables)
    3.  *Waiting For You* (Exceptions Kreddy cannot resolve: extension approvals, OCR reviews, failed checkouts, etc.)
    4.  *Health* (🟢 Stable / 🟡 Attention Needed) - *Clickable*: Opens the **Health Center** detailing Collection rate, Average delay, Overdue customers, and AI scores.
*   **Kreddy Action Center (Awaiting Decision)**:
    *   A high-priority alert box detailing blocks Kreddy cannot resolve autonomously:
        *   `Extension Approval` (e.g. John requests +2 days)
        *   `OCR Review` (e.g. low-confidence scan check)
        *   `Failed Payment` (e.g. bank transfer checkout rejection)
        *   `Staff Approval` (e.g. David drafted invoice requiring Oga confirmation)
*   **Business Timeline**: A chronological event stream tracking the exact heartbeat of the business:
    *   `09:15` — *Invoice sent to Rebecca (₦120,000)*
    *   `09:42` — *Payment received (₦50,000)*
    *   `10:20` — *Extension requested by John*
    *   `11:01` — *Approved extension for John* ✓
    *   `12:40` — *Reminder sent to Amina* ✓
    *   `14:14` — *Invoice settled by Rebecca* ✓
*   **Timeline Filters**: Filter the live event log by `All` | `Payments` | `Invoices` | `Tasks` | `Customers` | `Staff`.

### 2. Customers (The CRM)
Focused on managing customer relationships over transaction history.
*   **CRM Grid**: Shows Name, Outstanding Balance, Active Invoices, Last Interaction, Next Scheduled Reminder, and Risk (🟢 Low | 🟡 Medium | 🔴 High).
*   **Relationship Profiling**: Customer cards show trust indicators (e.g. `★★★★★ Trusted Customer`, `Prefers mornings`, `Buys every month`).
*   **AI Memory Box**: Exposes Kreddy's behavioral observations (e.g. *"Usually pays after reminder #2"* or *"Always requests extension around salary dates"*). The merchant has edit permission to add, edit, pin, or delete notes to guide Kreddy.

### 3. Workspace (Work)
Unifies all active, in-progress items into a responsibility-driven board:
*   **Swimlanes**: Displays Invoices, Extensions, OCR Reviews, and Drafts grouped by responsibility:
    `Waiting For Me` ➔ `Waiting Customer` ➔ `Scheduled` (Kreddy owns this: reminder tomorrow, collection Friday) ➔ `Done`
*   **The Stepper Drawer**: Clicking a card opens a details side drawer:
    *   *Invoice Stepper*: `Draft ➔ Sent ➔ Delivered ➔ Viewed ➔ Reminder Sent ➔ Paid ➔ Settled`.
    *   *Timeline Event Log*: Event trail showing exact operational history. Clicking `"Show Messages"` displays raw WhatsApp bubbles.
    *   *Reminders*: A single `[Send Reminder]` button that triggers Kreddy natively.

### 4. Money
A central financial cockpit showing income, expenses, settlements, and cashflow.
*   **Income & Expenses**: Logs expenses (e.g. fuel, deliveries) to compare collections against net profit.
*   **Settlement History & Payouts**: Details sweep bank logs, transfer states, and gateway fee assessments.

### 5. Tasks
A dedicated productivity center showing Kreddy's scheduled work:
*   **Task List**: Grouped by: `Due Today`, `Scheduled`, `Completed`, `Recurring`.
*   Includes scheduled collections, payment follow-ups, CAC renewals, and personal tasks.

### 6. Kreddy (AI OS Dashboard)
Exposes the intelligent reasoning center of the business.
*   **Morning Brief**: AI-generated summary of the day's tasks, collections, and forecasts (e.g. *"Yesterday you collected ₦430,000. 3 customers become overdue today. Rebecca is likely to settle."*).
*   **Predictions & Insights**: Cashflow forecasts, collection statistics, and customer risk trends.

### 7. Settings
*   Grouped into: **Business**, **Payments**, **Kreddy** (Tone, title, work hours), **Team** (Staff list + performance columns: invoices, collections, tasks completed, response time), and **Billing**.
