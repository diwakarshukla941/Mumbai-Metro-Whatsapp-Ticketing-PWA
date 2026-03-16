# Mumbai Metro One PWA

Installable web app for Mumbai Metro One Line 1 ticketing with a React frontend and Express backend.

## What it includes

- Booking page with live Line 1 fare calculation
- Payment page backed by backend payment intent and confirmation APIs
- Ticket page with generated QR ticket and WhatsApp assist link
- PWA manifest and service worker
- Backend metadata shaped around Metro One Line 1 and the public WhatsApp ticketing flow

## Run

```bash
npm install --prefix frontend
npm install --prefix backend
npm run build
npm start
```

The app is served from `http://localhost:4000`.

## Research sources used

- https://www.reliancemumbaimetro.com/
- https://www.reliancemumbaimetro.com/tickets-fares.aspx
- https://indianexpress.com/article/cities/mumbai/mumbai-metro-line-1-now-book-tickets-on-whatsapp-8473712/
