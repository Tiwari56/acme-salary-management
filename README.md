# Harvynex Technologies - Landing Page

Landing page for Harvynex Technologies, customised from the "AI Agency Landing Page & Portfolio Site" template. It keeps the template's dark layout and indigo accent (`#7A7FEE`) and replaces the original "Automatic" branding and copy.

Built with Next.js (App Router), TypeScript, Tailwind CSS, next-themes and Lucide icons.

## What has been done so far

### Branding
- Replaced the "Automatic" name and logo with Harvynex Technologies.
- Added a reusable `BrandLogo` component (`components/landing-page/brand-logo.tsx`) used in the header, footer and mobile menu.
- Added a new favicon at `app/icon.svg`.
- Updated page title, description and metadata in `app/layout.tsx`.

### Hero
- Headline: **Make your systems work together.**
- Sub-copy: "We build custom software, connect the tools your team uses, and automate repetitive work."
- Primary button: **Discuss your project** (links to `/start`, the enquiry form), plus a secondary "See how it works" link.

### Services (Build / Connect / Automate)
Three cards in `services.tsx`:
- **Build** - web and backend software
- **Connect** - Odoo, ERP and fintech integrations
- **Automate** - workflows and AI-assisted tasks

### "Without Harvynex / With Harvynex" comparison
New section in `components/landing-page/comparison.tsx` showing one support request handled two ways:
- **Without Harvynex:** arrives by email, forwarded to a group chat, copied into a spreadsheet, customer follows up. Ends with "Owner: unknown / Status: unclear / Repeated chasing".
- **With Harvynex:** request arrives, task is created automatically, assigned to a clear owner with due date and priority, status updates flow through. Ends with a tracked-task summary (Task, Owner, Status).

### Navigation, footer and CTA
- Header, mobile menu and `nav-data.ts` updated for the Harvynex brand and navigation.
- Footer rewritten with the Harvynex name, tagline and copyright.
- Bottom call-to-action reworded ("Tell us what isn't connected yet") with the **Discuss your project** button.
- Contact form button and FAQ copy updated to match.

### Launch preparation
- Removed the template's sample portfolio (pages, components, data and images). `/portfolio` and `/portfolio/*` redirect to `/#comparison`.
- The Projects section is no longer on the homepage.
- `/start` is branded for Harvynex and uses the existing form. It posts to `app/api/enquiry/route.ts` and shows success only after the request succeeds.
- FAQ is limited to what we do, what to expect and the tools we use. It makes no pricing, timeline or support promises.

### Page composition
`components/landing-page/index.tsx` renders: Header, Hero, Services, Comparison, FAQ, Call to Action, Footer.

## Configuration required
- `ENQUIRY_WEBHOOK_URL`: the endpoint that receives enquiries as JSON (for example a Zapier, Make or Slack-compatible webhook, or your own endpoint). Until it is set, the form returns an error and never shows success.

## Suggested next steps
1. Set `ENQUIRY_WEBHOOK_URL` and submit a test enquiry.
2. Add real Harvynex case studies when they are ready.
3. Add an Open Graph image and canonical site URL for production.

## Getting started

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000).

## Project structure

\`\`\`
app/                        Next.js routes (/, /start) and the /api/enquiry handler
components/landing-page/    Header, hero, services, comparison, FAQ, CTA, footer, brand logo, enquiry form
\`\`\`

## Customising

- Colours and theme: `components/landing-page/styles.css`, `tailwind.config.ts`
- Hero copy: `components/landing-page/hero.tsx`
- Services: `components/landing-page/services.tsx`
- Comparison steps: `components/landing-page/comparison.tsx`
- FAQ: `components/landing-page/faq.tsx`
- Navigation: `components/landing-page/nav-data.ts`

## Deployment

Set `ENQUIRY_WEBHOOK_URL` in the project environment variables, then publish from v0 or deploy on Vercel from GitHub.
