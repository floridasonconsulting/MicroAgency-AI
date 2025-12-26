# Make.com Automation Setup Guide

## Overview

MicroAgency-AI integrates with Make.com (formerly Integromat) to automate prospect outreach campaigns. When you click "Launch Campaign" on a prospect, the app sends a webhook to Make.com with prospect data.

**You need to create your own Make.com scenario** - this guide shows you how.

---

## Webhook Payload Format

When a campaign is launched, the app sends this JSON to your webhook:

```json
{
  "id": "uuid-of-prospect",
  "businessName": "Joe's Plumbing",
  "address": "123 Main St, Tampa, FL",
  "phone": "(555) 123-4567",
  "website": "https://example.com",
  "rating": 3.5,
  "reviewCount": 15,
  "painPoints": ["No website", "Low reviews", "Slow response time"],
  "hasWebsite": false,
  "campaignStatus": "Active",
  "timestamp": "2024-12-26T13:00:00.000Z",
  "source": "MicroAgency_LeadFinder"
}
```

---

## Step-by-Step Make.com Setup

### 1. Create a New Scenario

1. Go to [make.com](https://make.com) and log in
2. Click **"Create a new scenario"**
3. Click the **"+"** button to add your first module

### 2. Add Webhook Trigger

1. Search for **"Webhooks"** module
2. Select **"Custom webhook"**
3. Click **"Create a webhook"**
4. Name it: `MicroAgency Prospect Trigger`
5. **Copy the webhook URL** - you'll paste this in MicroAgency settings

### 3. Add Router for Multiple Actions

1. Click the **"+"** after the webhook
2. Add a **"Router"** module
3. This lets you send email AND SMS from one trigger

### 4. Path 1: Send Email via Gmail/SMTP

1. On the first router path, add **"Gmail"** (or your email provider)
2. Select **"Send an Email"**
3. Configure:
   - **To**: Use a static email for yourself, or integrate with a CRM
   - **Subject**: `New AI Receptionist Lead: {{1.businessName}}`
   - **Content**: 
   ```
   Hi {{1.businessName}},

   I noticed your business could benefit from never missing another call. 
   Our AI receptionist answers 24/7, books appointments, and follows up 
   automatically.

   Would you be open to a quick demo?

   Best regards,
   [Your Name]
   ```

### 5. Path 2: Send SMS via Twilio

1. On the second router path, add **"Twilio"**
2. Select **"Send an SMS"**
3. Configure:
   - **From**: Your Twilio number
   - **To**: `{{1.phone}}`
   - **Message**: 
   ```
   Hi! This is [Your Name]. I help {{1.businessName}} 
   businesses never miss calls with AI. Interested in a quick chat?
   ```

### 6. Path 3: Add to CRM (Optional)

Add prospects to your CRM (HubSpot, Airtable, Google Sheets, etc.):

1. Add **"Google Sheets"** → **"Add a Row"**
2. Map fields:
   - Business Name: `{{1.businessName}}`
   - Phone: `{{1.phone}}`
   - Website: `{{1.website}}`
   - Rating: `{{1.rating}}`
   - Pain Points: `{{1.painPoints}}`
   - Date Added: `{{1.timestamp}}`

---

## Complete Scenario Blueprint

```
[Webhook Trigger]
       |
   [Router]
       |
   +---+---+---+
   |   |   |   |
[Email][SMS][Sheet][Delay→FollowUp]
```

### JSON Blueprint for Import

Save this as `microagency_scenario.json` and import in Make.com:

```json
{
  "name": "MicroAgency Prospect Automation",
  "flow": [
    {
      "id": 1,
      "module": "gateway:CustomWebHook",
      "version": 1,
      "parameters": {
        "hook": "MicroAgency Prospect Trigger",
        "maxResults": 1
      },
      "mapper": {},
      "metadata": {
        "designer": { "x": 0, "y": 0 },
        "restore": { "parameters": { "hook": { "label": "MicroAgency Prospect Trigger" }}}
      }
    },
    {
      "id": 2,
      "module": "builtin:BasicRouter",
      "version": 1,
      "mapper": null,
      "metadata": {
        "designer": { "x": 300, "y": 0 }
      },
      "routes": [
        {
          "flow": [
            {
              "id": 3,
              "module": "google-email:ActionSendEmail",
              "version": 2,
              "parameters": { "account": "__IMTCONN__" },
              "mapper": {
                "to": "your-email@example.com",
                "cc": "",
                "bcc": "",
                "subject": "New Lead: {{1.businessName}}",
                "content": "Business: {{1.businessName}}\nPhone: {{1.phone}}\nRating: {{1.rating}}\nWebsite: {{1.website}}\nPain Points: {{1.painPoints}}"
              }
            }
          ]
        },
        {
          "flow": [
            {
              "id": 4,
              "module": "twilio:ActionSendSMS",
              "version": 2,
              "parameters": { "account": "__IMTCONN__" },
              "mapper": {
                "from": "+1XXXXXXXXXX",
                "to": "{{1.phone}}",
                "body": "Hi! I noticed {{1.businessName}} could use help with missed calls. Interested in a demo?"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Configure in MicroAgency

1. In MicroAgency, go to **Settings** → **API Integrations**
2. Paste your Make.com webhook URL in **"Make.com Webhook"** field
3. Click **Save Changes**
4. Test by launching a campaign on any prospect

---

## Testing Your Scenario

1. In Make.com, click **"Run once"** to arm the scenario
2. In MicroAgency, find a prospect and click **"Launch Campaign"**
3. Check Make.com to see the data received
4. Verify email/SMS was sent

---

## Advanced: Multi-Step Drip Campaign

For follow-up sequences, add delays:

```
[Webhook] → [Email 1] → [Delay 2 days] → [Email 2] → [Delay 3 days] → [SMS Follow-up]
```

Use Make.com's **"Sleep"** module between messages.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Webhook not triggering | Check URL is correct in Settings |
| No data received | Verify prospect has phone/email |
| SMS not sending | Check Twilio credentials and phone format |
| Email blocked | Use business email, not Gmail personal |
