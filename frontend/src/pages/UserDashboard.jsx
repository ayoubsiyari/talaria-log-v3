import React, { useState, useEffect } from 'react'
import DynamicUserSidebar from '../components/Layout/DynamicUserSidebar'
import Breadcrumb from '../components/Layout/Breadcrumb'
import UserDashboardHome from '../components/UserDashboard/UserDashboardHome'
import UserJournals from '../components/UserDashboard/UserJournals'
import UserAnalytics from '../components/UserDashboard/UserAnalytics'
import UserSubscription from '../components/UserDashboard/UserSubscription'
import UserSettings from '../components/UserDashboard/UserSettings'
import HelpSupportPage from '../components/Support/HelpSupportPage'
import Chart from './Chart'
import TradingJournal from '../components/Pages/TradingJournal'
import Analytics from '../components/Pages/Analytics'
import Portfolio from '../components/Pages/Portfolio'
import MarketScanner from '../components/MarketScanner'

function UserDashboard({ onLogout, userData }) {
  const [activeItem, setActiveItem] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleItemClick = (itemId) => {
    setActiveItem(itemId)
    setMobileMenuOpen(false) // Close mobile menu when item is selected
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return <UserDashboardHome onNavigate={handleItemClick} />
      case 'journals':
        return <UserJournals onNavigate={handleItemClick} />
      case 'journal':
        return <TradingJournal />
      case 'analytics':
        return <Analytics />
      case 'portfolio':
        return <Portfolio />
      case 'chart':
        return <Chart />
      case 'subscription':
        return <UserSubscription onNavigate={handleItemClick} />
      case 'profile':
        return <UserSettings onNavigate={handleItemClick} />
      case 'settings':
        return <UserSettings onNavigate={handleItemClick} />
      case 'help':
        return <HelpSupportPage onNavigate={handleItemClick} />
      case 'help-support':
        return <HelpSupportPage onNavigate={handleItemClick} />
      case 'api-access':
        return <div className="p-6"><h2 className="text-2xl font-bold mb-4">API Access</h2><p className="text-muted-foreground">API access management coming soon...</p></div>
      case 'priority-support':
        return <div className="p-6"><h2 className="text-2xl font-bold mb-4">Priority Support</h2><p className="text-muted-foreground">Priority customer support coming soon...</p></div>
      case 'advanced-analytics':
        return <div className="p-6"><h2 className="text-2xl font-bold mb-4">Advanced Analytics</h2><p className="text-muted-foreground">Advanced trading analytics coming soon...</p></div>
      case 'market-scanner':
        return <MarketScanner />
      default:
        return <UserDashboardHome onNavigate={handleItemClick} />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DynamicUserSidebar
          activeItem={activeItem}
          onItemClick={handleItemClick}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          onLogout={onLogout}
          theme={darkMode ? 'dark' : 'light'}
          onThemeToggle={toggleDarkMode}
          user={{
            name: userData?.username || 'User',
            email: userData?.email || 'user@example.com',
            avatar: null
          }}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black/50 animate-fade-in" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full animate-slide-in-left">
            <DynamicUserSidebar
              activeItem={activeItem}
              onItemClick={handleItemClick}
              collapsed={false}
              onToggleCollapse={() => setMobileMenuOpen(false)}
              onLogout={onLogout}
              theme={darkMode ? 'dark' : 'light'}
              onThemeToggle={toggleDarkMode}
              user={{
                name: userData?.username || 'User',
                email: userData?.email || 'user@example.com',
                avatar: null
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Menu Button */}
        <div className="md:hidden p-4 border-b border-border">
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-md hover:bg-accent"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {activeItem === 'chart' ? (
            // Full screen chart without container padding
            <div className="h-full w-full">
              {renderContent()}
            </div>
          ) : (
            // Regular content with breadcrumb
            <div className="container mx-auto px-4 py-6 space-y-6">
              {/* Breadcrumb */}
              <Breadcrumb 
                items={[
                  { label: 'User Dashboard', href: '/user-dashboard' },
                  { label: activeItem.charAt(0).toUpperCase() + activeItem.slice(1), href: `#${activeItem}` }
                ]} 
              />

              {/* Page Content */}
              <div className="space-y-6">
                {renderContent()}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default UserDashboard
