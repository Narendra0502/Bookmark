'use client';
import './globals.css';
import { useState, useEffect } from 'react';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { FiBookmark, FiPlus, FiUser, FiLogOut } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.reload();
  };

  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Add your global styles here */}
        <div className="min-h-screen flex flex-col">
          <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <Link href="/auth/LoginForm" className="flex items-center space-x-2">
                    <FiBookmark className="w-6 h-6 text-blue-600" />
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                      Book Mark Manager
                    </span>
                  </Link>
                </div>

                <div className="flex items-center space-x-4">
                  {isLoggedIn && (
                    <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 p-2 text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <FiLogOut className="w-6 h-6" />
                      <span>Logout</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </nav>

          <main className="flex-grow bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
             
              {children}
            </div>
          </main>

          <footer className="bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} BookMarker. All rights reserved.
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}