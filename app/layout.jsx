export const metadata = {
  title: "Romantic Composer",
  description: "Create romantic letters, overlays, and images",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-pink-50">{children}</body>
    </html>
  );
}
