# BenchBuddy Launch Checklist

## Environment Setup
- [ ] Neon database created and `DATABASE_URL` set
- [ ] Run `npx prisma migrate dev --name init` to create tables
- [ ] Run `npm run db:seed` to create test data
- [ ] `NEXTAUTH_SECRET` generated (`openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` set to production domain
- [ ] `RESEND_API_KEY` set (create account at resend.com)
- [ ] `CRON_SECRET` set for transfer reminder cron auth
- [ ] Sending domain configured in Resend (SPF/DKIM/DMARC)

## Vercel Deployment
- [ ] Connect GitHub repo to Vercel
- [ ] Set all environment variables in Vercel dashboard
- [ ] Verify `npm run build` succeeds
- [ ] Custom domain configured
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Cron job configured (vercel.json — daily at 9am UTC)

## Database
- [ ] Run `npx prisma migrate deploy` in production
- [ ] Verify Prisma can connect to Neon from Vercel
- [ ] Remove seed data from production

## Functional Testing
- [ ] **Holder flow**: signup → create package → schedule loads → share link works
- [ ] **Claimer flow**: open share link → browse games → sign up → claim → see in My Games
- [ ] **Transfer flow**: claim → holder gets email → mark transferred → claimer gets email
- [ ] **Free game flow**: $0 game claim → no payment info → transfer only
- [ ] **Release flow**: claimer releases → game back to available → holder notified
- [ ] **Password reset**: forgot → email → reset → login
- [ ] **Magic link**: claimer email → magic link → logged in

## Cross-Browser/Device
- [ ] Chrome desktop
- [ ] Safari desktop
- [ ] Firefox desktop
- [ ] iOS Safari (320px, 375px, 428px)
- [ ] Android Chrome

## Email
- [ ] Transfer action email renders in Gmail
- [ ] Transfer action email renders in Apple Mail
- [ ] Claim confirmation email renders correctly
- [ ] Transfer reminder fires for games within 48h
- [ ] "Mark as Transferred" one-click link works
- [ ] Emails not landing in spam (test with mail-tester.com)

## Security
- [ ] All `/dashboard/*` routes require authentication
- [ ] All `/api/owner/*` routes check ownership
- [ ] Claims only work for authenticated users
- [ ] Password hashing uses bcrypt
- [ ] JWT tokens have 30-day expiry
- [ ] Magic link tokens expire in 15 minutes
- [ ] No PII in analytics events

## Performance
- [ ] Landing page loads in < 2s
- [ ] Share link page loads in < 2s on 4G
- [ ] API responses < 500ms (95th percentile)

## Post-Launch
- [ ] Monitor Vercel Analytics for errors
- [ ] Monitor Resend for email delivery issues
- [ ] Set up Neon database alerts
- [ ] Remove test accounts
