'use client';

import { useState } from 'react';
import { Bell, Search, User, LogOut, Settings } from 'lucide-react';
import { adminAPI } from '@/app/services/api';

export default function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-lg">
            PG
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">PaysaGo Admin Panel</h1>
            <p className="text-sm text-gray-500">Manage users, analytics, and platform insights</p>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-4 md:justify-end">
          <div className="relative hidden w-full max-w-md md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications((prev) => !prev)}
                className="relative rounded-lg p-2 text-gray-400 hover:text-gray-600"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
                  <div className="p-4">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="mt-2 h-2 w-2 rounded-full bg-blue-500"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">New user registered</p>
                          <p className="text-xs text-gray-500">2 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="mt-2 h-2 w-2 rounded-full bg-green-500"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">Transaction completed</p>
                          <p className="text-xs text-gray-500">5 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="mt-2 h-2 w-2 rounded-full bg-yellow-500"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">System maintenance scheduled</p>
                          <p className="text-xs text-gray-500">1 hour ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="flex items-center space-x-2 rounded-lg p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden text-sm font-medium md:block">Admin User</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
                  <div className="py-1">
                    <button className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        adminAPI.logout();
                      }}
                      className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
