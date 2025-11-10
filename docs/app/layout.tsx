import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Next Introspect',
  description: 'Comprehensive Next.js project introspection tool that analyzes routing structures and generates detailed metadata',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">Next Introspect</h1>
                </div>
                <nav className="flex space-x-8">
                  <a href="#features" className="text-gray-500 hover:text-gray-900">Features</a>
                  <a href="#installation" className="text-gray-500 hover:text-gray-900">Installation</a>
                  <a href="#usage" className="text-gray-500 hover:text-gray-900">Usage</a>
                  <a href="https://github.com/benfavre/next-introspect" className="text-gray-500 hover:text-gray-900">GitHub</a>
                </nav>
              </div>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}