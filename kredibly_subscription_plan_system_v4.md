# Kredibly V4.0: Subscription & Plan System Specification
**Canonical Product Requirements Document (PRD) & Technical Specification**

---

## 1. Product Philosophy & Value Proposition

Kredibly is a premium, AI-powered conversational business operating system running natively on WhatsApp and backed by a web-based "Mission Control" dashboard. 

Rather than relying on permanent free tiers that dilute brand value and strain system resources, Kredibly's monetization strategy is built on a **Value-First, Frictionless Onboarding** model.

### Core Principles
1.  **Experience Before Payment**: Every merchant gets full, unrestricted access to the top-tier **Chairman** plan for 14 days. Value is proven before a credit card is ever requested.
2.  **Ledger Integrity**: The merchant's data is sacred. If a subscription expires, data is never deleted, hidden, or held hostage. The workspace transitions into a **Read-Only** state.
3.  **Conversational Dignity**: Kreddy is a professional digital Chief of Staff. When a plan expires, Kreddy's refusal to perform tasks is polite, clear, and business-focused, avoiding high-pressure or guilt-inducing sales tactics.
4.  **Cost Sustainability**: The subscription pricing is mathematically structured to fully absorb hosting (Contabo), AI processing (Google Studio), Meta conversation costs, and Nomba bank sweep charges.
5.  **Outcome-Based Value**: Marketing focuses strictly on outcomes ("Get paid faster", "Automate follow-ups", "Run your team"). Limits are secondary details in the comparison tables, keeping the focus on business transformation rather than quota counts.

---

## 2. The Trial Lifecycle (The Onboarding Funnel)

Every new business workspace registered on Kredibly starts in the **Trial State** automatically.

```
[Signup] ➔ [14-Day Chairman Trial] ➔ [Active Work] ➔ [Expiry Warning Sequence] ➔ [Trial End] ➔ [Read-Only State]
```

### Trial Configuration
*   **Duration**: 14 calendar days from signup.
*   **Access Tier**: **Chairman Plan** (Unrestricted access to all features).
*   **Verification**: No billing details or credit cards required to start.

### The 14-Day Conversational Touchpoint Timeline

#### Day 1: Welcome & Active Setup *(Already Implemented)*
*   **Status**: Natively integrated. When the merchant launches their workspace on the web dashboard and clicks the "Open WhatsApp" button, Kreddy triggers the welcome sequence.
*   **Kreddy Action**: Greets the merchant, introduces her roles, and walks them through business setup, first invoice recording, and payment links.

#### Day 7: Mid-Point Value Reinforcement
*   **Trigger**: 7 days after onboarding.
*   **Kreddy Action**: Performs an automated ledger sweep and reports a summary of the value delivered, proving ROI.
*   **Sample Copy**:
    > *"High power, [Boss Name]! We've been working together for a week now. In the last 7 days, I've helped you send **{count} invoices** and track **₦{amount}** in collections. Imagine never going back to manual books! Let's keep the momentum going."*

#### Day 11 (3 Days to Expiry): Initial Pre-Warning
*   **Trigger**: 72 hours before trial expiration.
*   **Kreddy Action**: Sends a gentle advisory message. The web dashboard displays a persistent top banner: `Trial ends in 3 days. Upgrade to keep Kreddy active.`
*   **Sample Copy**:
    > *"Quick update, [Boss Name]: Your free Chairman trial ends in 3 days. Everything you've built and all your records are completely safe. You can choose a plan at any time to keep me running on your team."*

#### Day 13 (1 Day to Expiry): High-Visibility Alert
*   **Trigger**: 24 hours before trial expiration.
*   **Kreddy Action**: Broadcasts a warning across WhatsApp, Email, and the Dashboard with direct payment links.
*   **Sample Copy**:
    > *"Hi [Boss Name], tomorrow your free Chairman trial ends. Don't worry, your records remain completely safe. To prevent any pause in creating invoices and collecting payments, you can upgrade your plan here: {upgrade_link}."*

#### Day 14: Expiry Day
*   **Trigger**: Exactly 14 days after signup at the registration hour.
*   **Kreddy Action**: Moves workspace state to `inactive` and sends a final service-suspension message.
*   **Sample Copy**:
    > *"Your free Chairman trial has ended, [Boss Name]. Thank you for trying Kredibly! Your business records are completely safe and readable on your dashboard. To continue creating invoices, sending reminders, and collecting payments, please select a plan here: {upgrade_link}."*

---

## 3. The "Inactive" Read-Only State

When a workspace becomes `inactive` or `cancelled`, it enters a restricted state. This enforces payment while maintaining the merchant's trust.

### Dashboard Permissions Matrix
Merchants have full read access to historical operations to ensure they never feel locked out of their own business intelligence.

| Allowed (READ) | Blocked (WRITE) |
| :--- | :--- |
| View all historical sales and invoices | Create new invoices or record new sales |
| View complete payment ledger history | Generate new payment links or QR codes |
| View customer directory and details | Send manually triggered or auto payment reminders |
| View all dashboard analytics and reports | Create digital receipts |
| Download PDFs of past invoices | Add new customers or staff members |
| Export ledger records to Excel/CSV | Initiate bank sweeps for new transactions |

### Kreddy (WhatsApp AI) Post-Expiry Behavior
If an inactive merchant messages Kreddy on WhatsApp attempting an operational task, Kreddy intercepts the message and politely declines, redirecting them to the pricing page.

#### Example A: Creating an Invoice
> **Merchant**: *Create invoice of ₦50,000 for David*
>
> **Kreddy**: *"I'd love to help with that, Boss, but your Kredibly subscription has expired. Your records are still safely stored in your dashboard. Once you renew your plan, I'll generate this invoice and send it to David immediately! Renew here: {upgrade_link}"*

#### Example B: Sending a Reminder
> **Merchant**: *Remind John to pay*
>
> **Kreddy**: *"That feature is currently paused because your workspace is inactive. Renew your subscription and I'll chase John for this payment right away! Renew here: {upgrade_link}"*

---

## 4. Post-Renewal Ledger Recovery Check

When a merchant renews an inactive workspace, they may have collected payments offline or outside of Kredibly during the inactive period. To prevent record drift, Kreddy triggers a **Recovery Reconciliation Check** on first interaction.

```
[Merchant Renews] ➔ [Kreddy Detects Gap] ➔ [Suggests Pending Invoice Review] ➔ [Merchant Reconciles]
```

### Recovery Check Workflow
1.  **Scan Ledger**: Kreddy identifies all invoices that were left in `unpaid` or `partial` states during the inactive period.
2.  **Prompt Merchant**:
    > *"Welcome back, [Boss Name]! I'm back on duty and ready to roll. While your workspace was inactive, did your customers pay any of these outstanding invoices outside Kredibly?*
    >
    > *1. **Invoice #KR-1049** (₦45,000 - Amina)*
    > *2. **Invoice #KR-1052** (₦12,000 - Samuel)*
    >
    > *Reply with the number to mark it as **Paid**, or say **Skip** if they are still outstanding!"*
3.  **Execute**: Updates database statuses based on merchant's replies to ensure bookkeeping matches reality.

---

## 5. Pricing Tiers & Feature Breakdown

Kredibly is priced to align naturally with a merchant's business lifecycle. Rather than selling limit capacities, the plans are positioned around the operational outcomes they deliver:

*   **Hustler Tier**: Digitize your business operations.
*   **Oga Tier**: Automate your daily operations.
*   **Chairman Tier**: Scale your multi-staff or multi-office enterprise.

### Feature Matrix

| Feature | Hustler | Oga | Chairman |
| :--- | :--- | :--- | :--- |
| **Monthly Price** | **₦3,000** | **₦6,000** | **₦9,000** |
| **Yearly Price (10% Off)** | **₦32,400** | **₦64,800** | **₦97,200** |
| **14-Day Full Trial** | Yes | Yes | Yes |
| **Monthly Invoices** | Capped at 50 | Unlimited | Unlimited |
| **AI Conversations** | Capped at 100 | Unlimited (Fair Use) | Unlimited (Fair Use) |
| **Customer Reminders** | Capped at 20 | Unlimited | Unlimited |
| **Voice Conversations with Kreddy** | No | Yes | Yes |
| **Morning Business Briefing** | No | Yes | Yes |
| **Local Language Support** | No | Yes | Yes |
| **Staff Accounts** | Owner Only | 1 Staff | Up to 5 Staff |
| **Multi-Office Management** | No | No | Yes |
| **AI Invoice Scanner (OCR)** | No | No | Yes |
| **AI Business Insights** | Basic | Standard | Advanced |
| **Priority AI Processing** | No | No | Yes |
| **Early Feature Access** | No | No | Yes |
| **Support** | Email | WhatsApp | Priority |
| **Settlement (Sweep) Charges** | Covered | Covered | Covered |

---

### Universal Invoice Customization
*   **Custom Merchant Logo**: Available on all plans (Hustler, Oga, Chairman) for both PDF invoices and payment links.
*   **Fallback Logo Branding**: If no logo is uploaded, the invoice layout automatically defaults to displaying the business name initials, matching the merchant dashboard design.

---

### Detailed Premium Feature Specifications (Chairman Only)

#### A. AI Invoice Scanner (OCR)
*   **Pricing Page Description**: Capture paper invoices with your camera. Kreddy extracts the details into your ledger and lets you review before saving.
*   **Product Implementation**: Snap a photo of a handwritten or printed invoice. Kreddy extracts the line items, customer name, date, and amounts, creates a draft digital sales record, generates a summary, and asks for explicit confirmation before saving. If any parsed item is inaccurate, the merchant can modify it before commit.

#### B. AI Business Reports & Forecasting
*   **Product Implementation**: Gated analytical queries. Allows the merchant to use Kreddy as a financial analyst. The backend routes complex, retroactive, and predictive inquiries to the LLM agent only for Chairman workspaces.
*   **Supported Queries**:
    *   *Performance Analysis*: "Why were my sales lower this week?"
    *   *Debt Exposure*: "Which customer owes me the most and what is their payment history?"
    *   *Comparative Tracking*: "Compare this month's collections and expenses to last month."
    *   *Velocity Analytics*: "What products sell the most on weekends?"
    *   *Cash Flow Forecasts*: "Predict next month's cash flow based on unpaid invoice due dates."

---

## 6. Marketing & Messaging Guidelines (Trust-First Positioning)

To build strong consumer confidence and address fee skepticism in the financial space, Kredibly's customer-facing copy must remain clear, simple, and upfront.

### A. Landing Page Copy Guidelines
Avoid detailed percentages or processing partner mentions on the main landing page. Focus on reassurance and outcomes.

**Transparent Payments. No Surprises.**
*   Your customers pay securely using our licensed payment infrastructure.
*   You decide whether payment gateway charges are paid by you or your customer.
*   Kredibly covers the settlement transfer cost on all paid plans.
*   Funds are sent directly to your verified bank account—no wallets, no hidden platform commissions.

**Pricing Card Badges**:
*   Direct Bank Settlement
*   Settlement Transfer Covered

### B. Pricing Page Copy Guidelines
Position this directly below the pricing selection layout:

**Payment & Settlement: How Payments Work**
Every payment processed through Kredibly follows a simple and transparent structure:
*   **Payment Gateway Fee**: When a customer pays an invoice, a payment gateway fee applies. You decide who covers it.
    *   *Customer pays the gateway fee*: You receive the full invoice amount.
    *   *Merchant pays the gateway fee*: The gateway fee is deducted from your settlement.
    *   *Setting*: You can change this preference anytime in your settings.
*   **Settlement Transfer**: After payment is confirmed, Kredibly transfers your money directly to your verified bank account. We cover the settlement transfer cost on every paid plan. There are no additional settlement charges from Kredibly.
*   **No Hidden Commissions**: Kredibly does not take a percentage of your sales. Your monthly subscription gives you access to the platform, while payment processing follows the transparent rules above.

### C. FAQ Copy Guidelines
*   **Are there any hidden charges?**
    No. Kredibly charges only your subscription. Payment gateway fees are handled according to the option you choose (merchant or customer), and Kredibly covers the settlement transfer cost on all paid plans.
*   **Why do I still see payment gateway charges?**
    Payment gateway fees are charged by our licensed payment infrastructure to securely process customer payments. You can choose whether these charges are paid by you or by your customer.
*   **Does Kredibly deduct commissions from my sales?**
    No. Kredibly does not charge commissions on your sales. We only charge your selected subscription plan.

---

## 7. Technical Payment Processing & Cost Recovery

### Gateway Fee Allocation (Merchant Choice)
During onboarding, the merchant chooses how to handle the Nomba collection gateway fees (1% capped at ₦150):
*   **Option A: Customer Absorbs Fee (Default)**: The collection fee is added to the checkout total.
    *   *Example*: For a ₦10,000 invoice, the customer pays ₦10,100 at checkout. The merchant receives exactly ₦10,000 in their bank account.
*   **Option B: Merchant Absorbs Fee**: The collection fee is deducted from the payout.
    *   *Example*: For a ₦10,000 invoice, the customer pays ₦10,000. The merchant receives ₦9,900 in their bank account.

### Sweep Fee Absorption
*   **Settlement Transfer Cost**: Kredibly absorbs the **₦10 to ₦50 Nomba bank transfer (sweep) charges** when pushing funds from the virtual account wallet to the merchant's real bank account.
*   **Sustainability Check**: The ₦3,000/mo (Hustler), ₦6,000/mo (Oga), and ₦9,000/mo (Chairman) pricing scales are designed to easily cover this transaction sweep fee and still retain healthy margins.

