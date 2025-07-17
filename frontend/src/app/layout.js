'use client';
import './globals.css';
import { useState, useEffect } from 'react';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { FiBookmark, FiPlus, FiUser, FiLogOut, FiMoon, FiSun } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { ThemeProvider, useTheme } from '../components/ThemeContext';
import toast, { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

function ThemeToggle() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      {darkMode ? (
        <FiSun className="w-5 h-5 text-yellow-500" />
      ) : (
        <FiMoon className="w-5 h-5 text-gray-500" />
      )}
    </button>
  );
}

function Layout({ children }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.reload();
  };

  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-white dark:bg-gray-900 transition-colors duration-200`}>
        <div className="min-h-screen flex flex-col">
          <nav className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <Link href="/" className="flex items-center space-x-2">
                    <FiBookmark className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
                      Book Mark Manager
                    </span>
                  </Link>
                </div>

                <div className="flex items-center space-x-4">
                  <ThemeToggle />
                  {isLoggedIn && (
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <FiLogOut className="w-6 h-6" />
                      <span>Logout</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </nav>

          <main className="flex-grow bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>

          <footer className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                © {new Date().getFullYear()} BookMarker. All rights reserved.
              </div>
            </div>
          </footer>
        </div>
        <Toaster 
          position="top-center" 
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
              maxWidth: '500px',
              padding: '16px 24px',
              textAlign: 'center',
            },
            success: {
              style: {
                background: '#166534',
              },
            },
            error: {
              style: {
                background: '#991b1b',
              },
            },
          }} 
        />
      </body>
    </html>
  );
}

export default function RootLayout({ children }) {
  return (
    <ThemeProvider>
      <Layout>{children}</Layout>
    </ThemeProvider>
  );
}