import './globals.css';

export const metadata = {
  title: 'ahorra | Turning Surplus into Opportunity',
  description:
    'ahorra helps brands, distributors and retailers find new ways to sell surplus inventory, and gives consumers quality products at better prices.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#075C50',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
