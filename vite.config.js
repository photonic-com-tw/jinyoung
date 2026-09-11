import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: 'src',
  publicDir: false,
  plugins: [
    handlebars({
      partialDirectory: [
        resolve(__dirname, 'src/components'),
        resolve(__dirname, 'src/layouts'),
      ],
    }),
  ],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/pages/index.html'),
        about: resolve(__dirname, 'src/pages/about.html'),
        services: resolve(__dirname, 'src/pages/services.html'),
        news: resolve(__dirname, 'src/pages/news.html'),
        newsDetail: resolve(__dirname, 'src/pages/news-detail.html'),
        recommendedTrips: resolve(__dirname, 'src/pages/recommended-trips.html'),
        freeTrip: resolve(__dirname, 'src/pages/free-trip.html'),
        serviceFlow: resolve(__dirname, 'src/pages/service-flow.html'),
        faq: resolve(__dirname, 'src/pages/faq.html'),
        rentalAirport: resolve(__dirname, 'src/pages/rental-airport.html'),
        rentalCharter: resolve(__dirname, 'src/pages/rental-charter.html'),
        rentalSelfDrive: resolve(__dirname, 'src/pages/rental-self-drive.html'),
        rentalLongcare: resolve(__dirname, 'src/pages/rental-longcare.html'),
        rentalDetail: resolve(__dirname, 'src/pages/rental-detail.html'),
        bookingEntry: resolve(__dirname, 'src/pages/booking-entry.html'),
        bookingSelection: resolve(__dirname, 'src/pages/booking-selection.html'),
        bookingDetails: resolve(__dirname, 'src/pages/booking-details.html'),
        bookingConfirmation: resolve(__dirname, 'src/pages/booking-confirmation.html'),
      },
    },
  },
  server: {
    open: '/pages/index.html',
  },
});
