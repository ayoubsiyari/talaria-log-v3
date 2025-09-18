import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import roleService from './services/roleService'
import userTypeService from './services/userTypeService'
import subscriptionService from './services/subscriptionService'
import tokenRefreshService from './services/tokenRefreshService'
import { PermissionsProvider } from './hooks/usePermissions.jsx'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const UserDashboard = lazy(() => import('./pages/UserDashboard.jsx').catch(err => {
  console.error('Failed to load UserDashboard:', err);
  return { default: () => <div>Error loading UserDashboard. Please refresh the page.</div> };
}))
const HomePage = lazy(() => import('./pages/HomePage'))
const PromotionLanding = lazy(() => import('./pages/PromotionLanding'))
const SubscriptionSelection = lazy(() => import('./pages/SubscriptionSelection'))
const Checkout = lazy(() => import('./pages/Checkout'))
const SubscriptionSuccess = lazy(() => import('./pages/SubscriptionSuccess'))
const Invoice = lazy(() => import('./pages/Invoice'))
const PaymentDashboard = lazy(() => import('./pages/PaymentDashboard'))

// Emergency Fix Components
const OneClickFix = lazy(() => import('./components/Test/OneClickFix'))
const EmergencyFix = lazy(() => import('./components/Test/EmergencyFix'))
const QuickLogin = lazy(() => import('./components/Test/QuickLogin'))
const SubscriptionChecker = lazy(() => import('./components/Test/SubscriptionChecker'))

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState(null)

  // Centralized admin check using userTypeService
  const isUserAdmin = (user) => {
    if (!user) return false;
    const userTypeInfo = userTypeService.determineUserType(user);
    return userTypeInfo.isAdmin;
  };

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token')
      const storedUser = localStorage.getItem('user')
      
      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUserData(parsedUser)
          setIsAuthenticated(true)

          // Initialize user type service
          userTypeService.determineUserType(parsedUser)

          // Ensure roles/permissions are loaded (force refresh on app load)
          // Note: This is optional and can fail for regular users
          try {
            await roleService.getRolesAndPermissions(true)
          } catch (e) {
            console.warn('RBAC roles load failed (this is normal for regular users), using user type detection')
          }

          // Route decision is handled by route guards; avoid hard redirects here to prevent loops
        } catch (error) {
          console.error('Error parsing user data:', error)
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user')
        }
      } else {
        // Not authenticated: clear any RBAC cache from prior sessions
        roleService.clearCache()
        userTypeService.clear()
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  // Handle token refresh events
  useEffect(() => {
    const handleTokenExpired = (event) => {
      console.log('🔄 Token expired, logging out user:', event.detail);
      setIsAuthenticated(false);
      setUserData(null);
      // Clear any cached data
      roleService.clearCache();
      userTypeService.clear();
      subscriptionService.clearCache();
    };

    window.addEventListener('auth:logout', handleTokenExpired);
    
    return () => {
      window.removeEventListener('auth:logout', handleTokenExpired);
    };
  }, [])

  // Handle successful login
  const handleLoginSuccess = async (userData, tokens) => {
    console.log('🔍 Login success - user data:', userData);
    
    // Store tokens and user data
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Update authentication state
    setIsAuthenticated(true);
    setUserData(userData);
    
    // Clear any previous RBAC cache (from a prior session)
    roleService.clearCache();
    userTypeService.clear();
    
    // Clear subscription service cache to ensure fresh data
    try {
      // Use imported subscription service
      subscriptionService.clearCache();
      console.log('✅ Cleared subscription service cache on login');
    } catch (error) {
      console.log('⚠️ Could not clear subscription service cache:', error);
    }
    
    // Initialize user type service and determine admin status
    const userTypeInfo = userTypeService.determineUserType(userData);
    let isAdmin = userTypeInfo.isAdmin;
    
    // Check if user has admin roles (not just any roles)
    if (userData.roles && userData.roles.length > 0) {
      // Only treat as admin if they have actual admin roles
      const adminRoleNames = ['super_admin', 'admin', 'user_manager', 'content_manager', 'analyst', 'system_administrator'];
      const hasAdminRole = userData.roles.some(role => 
        adminRoleNames.includes(role.name) || 
        (role.permissions && role.permissions.some(perm => 
          perm.includes('user_management') || 
          perm.includes('rbac_management') || 
          perm.includes('system_admin')
        ))
      );
      if (hasAdminRole) {
        isAdmin = true;
      }
    }

    console.log('🔍 User is admin:', isAdmin);
    console.log('🔍 User subscription status:', userData.subscription_status);
    console.log('🔍 User is active:', userData.is_active);

    // Admin users go directly to admin dashboard (no subscription required)
    if (isAdmin) {
      console.log('🔍 Admin user, redirecting to admin dashboard');
      window.location.href = '/dashboard';
      return;
    }

    // Regular users with active accounts go to user dashboard
    // (Users can only login if they've already paid, so no payment check needed)
    console.log('🔍 Regular user with active account, redirecting to user dashboard');
    window.location.href = '/user-dashboard';
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    // Clear RBAC cache and user type to avoid stale data on next login
    roleService.clearCache()
    userTypeService.clear()
    setIsAuthenticated(false)
    setUserData(null)
    window.location.href = '/login';
  }

  // Global function to update user data (for post-payment login)
  window.updateUserData = (newUserData) => {
    console.log('🔄 Updating user data globally:', newUserData);
    setUserData(newUserData);
    setIsAuthenticated(true);
  };

  // Protected Route component for admin dashboard
  const AdminRoute = ({ children }) => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="text-white text-lg">Loading...</div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }

    // Admin check using centralized user type service
    let isAdmin = false;
    
    if (userData) {
      // Use userTypeService for consistent detection
      const userTypeInfo = userTypeService.determineUserType(userData);
      isAdmin = userTypeInfo.isAdmin;
      
      // Additional check with role service if available
      if (roleService.isAdmin()) {
        isAdmin = true;
      }
    }
    
    if (!isAdmin) {
      return <Navigate to="/user-dashboard" replace />
    }

    return children
  }

  // Protected Route component for user dashboard
  const UserRoute = ({ children }) => {
    const [subscriptionLoading, setSubscriptionLoading] = useState(true)
    const [subscriptionStatus, setSubscriptionStatus] = useState(null)

    useEffect(() => {
      const checkSubscription = async () => {
        // Check if user just completed payment and has post-payment order info
        const postPaymentInfo = localStorage.getItem('postPaymentOrderInfo');
        if (postPaymentInfo) {
          console.log('🔍 UserRoute: User has post-payment order info, allowing access immediately');
          const orderInfo = JSON.parse(postPaymentInfo);
          const postPaymentStatus = {
            hasActiveSubscription: true,
            status: 'active',
            plan: orderInfo.subscriptionPlan || 'premium'
          };
          setSubscriptionStatus(postPaymentStatus);
          setSubscriptionLoading(false);
          return;
        }

        if (isAuthenticated && userData) {
          console.log('🔍 UserRoute: Checking subscription for user:', userData.email)
          console.log('🔍 UserRoute: User data:', userData)
          
          // First check localStorage user data (fastest)
          const hasActiveSubscriptionFromLocal = userData.subscription_status === 'active' || userData.is_active === true
          console.log('🔍 UserRoute: LocalStorage check - hasActiveSubscription:', hasActiveSubscriptionFromLocal)
          console.log('🔍 UserRoute: LocalStorage - subscription_status:', userData.subscription_status)
          console.log('🔍 UserRoute: LocalStorage - is_active:', userData.is_active)
          console.log('🔍 UserRoute: LocalStorage - is_admin:', userData.is_admin)
          
          if (hasActiveSubscriptionFromLocal) {
            // User has active subscription according to localStorage, allow access immediately
            const localStatus = {
              hasActiveSubscription: true,
              status: userData.subscription_status || 'active',
              plan: userData.subscription_plan || 'premium'
            }
            console.log('✅ UserRoute: User has active subscription (from localStorage), allowing access')
            console.log('✅ UserRoute: Local status:', localStatus)
            setSubscriptionStatus(localStatus)
            setSubscriptionLoading(false)
            return
          }
          
          // If localStorage doesn't show active subscription, but user is authenticated,
          // there might be a race condition - always check API to be sure
          console.log('🔍 UserRoute: LocalStorage shows no active subscription, checking API...')
          
          // If localStorage doesn't show active subscription, try API call
          try {
            // Import subscription service dynamically to avoid circular imports
            // Use imported subscription service
            const status = await subscriptionService.checkSubscriptionStatus(true) // Force refresh
            console.log('🔍 UserRoute: Subscription status result from API:', status)
            
            // If API shows active subscription, update localStorage to keep it in sync
            if (status.hasActiveSubscription && status.subscription) {
              console.log('✅ UserRoute: API shows active subscription, updating localStorage...')
              const updatedUserData = {
                ...userData,
                subscription_status: status.subscription.subscription_status || 'active',
                subscription_plan: status.subscription.subscription_plan || 'premium',
                is_active: status.subscription.is_active || true,
                is_admin: false // Ensure user is regular user, not admin
              }
              localStorage.setItem('user', JSON.stringify(updatedUserData))
              console.log('✅ UserRoute: Updated localStorage with fresh subscription data')
            }
            
            // If API shows no active subscription but localStorage shows active, 
            // there might be a race condition - wait a bit and try again
            if (!status.hasActiveSubscription && hasActiveSubscriptionFromLocal) {
              console.log('⚠️ UserRoute: Race condition detected - API shows inactive but localStorage shows active')
              console.log('⚠️ UserRoute: Waiting 2 seconds and retrying...')
              
              await new Promise(resolve => setTimeout(resolve, 2000))
              const retryStatus = await subscriptionService.checkSubscriptionStatus(true)
              console.log('🔍 UserRoute: Retry subscription status result:', retryStatus)
              
              // Update localStorage if retry shows active subscription
              if (retryStatus.hasActiveSubscription && retryStatus.subscription) {
                const updatedUserData = {
                  ...userData,
                  subscription_status: retryStatus.subscription.subscription_status || 'active',
                  subscription_plan: retryStatus.subscription.subscription_plan || 'premium',
                  is_active: retryStatus.subscription.is_active || true,
                  is_admin: false
                }
                localStorage.setItem('user', JSON.stringify(updatedUserData))
                console.log('✅ UserRoute: Updated localStorage after retry')
              }
              
              setSubscriptionStatus(retryStatus)
            } else {
              setSubscriptionStatus(status)
            }
          } catch (error) {
            console.error('Error checking subscription:', error)
            // Fallback: check localStorage user data
            const hasActiveSubscription = userData.subscription_status === 'active' || userData.is_active === true
            const fallbackStatus = {
              hasActiveSubscription,
              status: userData.subscription_status || 'free',
              plan: userData.subscription_plan || null
            }
            console.log('🔍 UserRoute: Using fallback subscription status:', fallbackStatus)
            console.log('🔍 UserRoute: Fallback - userData.is_active:', userData.is_active)
            console.log('🔍 UserRoute: Fallback - userData.subscription_status:', userData.subscription_status)
            setSubscriptionStatus(fallbackStatus)
          } finally {
            setSubscriptionLoading(false)
          }
        } else {
          console.log('🔍 UserRoute: Not authenticated or no user data')
          setSubscriptionLoading(false)
        }
      }

      checkSubscription()
    }, [isAuthenticated, userData])

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="text-white text-lg">Loading...</div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }

    // Check subscription status
    if (subscriptionStatus === null) {
      // Still loading, don't redirect yet
      console.log('🔄 UserRoute: Subscription status still loading...')
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="text-white text-lg">Loading...</div>
        </div>
      )
    }
    
    if (subscriptionStatus && !subscriptionStatus.hasActiveSubscription) {
      console.log('❌ UserRoute: User does not have active subscription, redirecting to subscription page')
      console.log('❌ UserRoute: Subscription status:', subscriptionStatus)
      console.log('❌ UserRoute: User data from localStorage:', userData)
      console.log('❌ UserRoute: hasActiveSubscription:', subscriptionStatus.hasActiveSubscription)
      console.log('❌ UserRoute: subscription_status:', subscriptionStatus.status)
      console.log('❌ UserRoute: is_active from localStorage:', userData?.is_active)
      return <Navigate to="/subscription/select" replace />
    }

    console.log('✅ UserRoute: User has active subscription, allowing access')
    console.log('✅ UserRoute: Final subscription status:', subscriptionStatus)

    return children
  }

  // Public Route component (redirects to appropriate dashboard if already authenticated)
  const PublicRoute = ({ children }) => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="text-white text-lg">Loading...</div>
        </div>
      )
    }

    if (isAuthenticated) {
      let isAdmin = false;
      
      if (userData) {
        // Use userTypeService for consistent detection
        const userTypeInfo = userTypeService.determineUserType(userData);
        isAdmin = userTypeInfo.isAdmin;
        
        // Additional check with role service if available
        if (roleService.isAdmin()) {
          isAdmin = true;
        }
      }
      
      if (isAdmin) {
        return <Navigate to="/dashboard" replace />
      } else {
        return <Navigate to="/user-dashboard" replace />
      }
    }

    return children
  }

  return (
    <PermissionsProvider>
      <Router>
        <div className="App">
          <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                <HomePage />
              </Suspense>
            } 
          />
          
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white text-lg">Loading Login...</div>}>
                  <LoginPage onLoginSuccess={handleLoginSuccess} />
                </Suspense>
              </PublicRoute>
            } 
          />
          
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white text-lg">Loading Registration...</div>}>
                  <RegisterPage />
                </Suspense>
              </PublicRoute>
            } 
          />
          
          {/* Emergency Fix Routes */}
          <Route 
            path="/fix" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Emergency Fix...</div>}>
                <OneClickFix />
              </Suspense>
            } 
          />
          
          <Route 
            path="/fix-step-by-step" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Step-by-Step Fix...</div>}>
                <EmergencyFix />
              </Suspense>
            } 
          />

          <Route 
            path="/quick-login" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Login...</div>}>
                <QuickLogin />
              </Suspense>
            } 
          />

          <Route 
            path="/subscription-checker" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Checker...</div>}>
                <SubscriptionChecker />
              </Suspense>
            } 
          />
          
          {/* Public Promotion Landing Page */}
          <Route 
            path="/promo/:code" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Promotion...</div>}>
                <PromotionLanding />
              </Suspense>
            } 
          />
          
          {/* Subscription Selection Page */}
          <Route 
            path="/subscription/select" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Subscription Plans...</div>}>
                <SubscriptionSelection />
              </Suspense>
            } 
          />

          {/* Checkout Page */}
          <Route 
            path="/checkout" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Checkout...</div>}>
                <Checkout />
              </Suspense>
            } 
          />

          {/* Payment Success Page */}
          <Route 
            path="/payment-success" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Success Page...</div>}>
                <SubscriptionSuccess />
              </Suspense>
            } 
          />


          {/* Invoice Page */}
          <Route 
            path="/invoice/:orderId" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Invoice...</div>}>
                <Invoice />
              </Suspense>
            } 
          />

          {/* Direct subscription route - redirects to selection */}
          <Route 
            path="/subscription" 
            element={<Navigate to="/subscription/select" replace />} 
          />

          {/* Payment Dashboard - Admin Only */}
          <Route 
            path="/payment-dashboard" 
            element={
              <AdminRoute>
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white text-lg">Loading Payment Dashboard...</div>}>
                  <PaymentDashboard />
                </Suspense>
              </AdminRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard/*" 
            element={
              <AdminRoute>
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white text-lg">Loading Dashboard...</div>}>
                  <DashboardPage onLogout={handleLogout} />
                </Suspense>
              </AdminRoute>
            } 
          />

          <Route 
            path="/user-dashboard/*" 
            element={
              <UserRoute>
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white text-lg">Loading User Dashboard...</div>}>
                  <UserDashboard onLogout={handleLogout} userData={userData} />
                </Suspense>
              </UserRoute>
            } 
          />
          
          {/* Dashboard redirect for authenticated users */}
          <Route 
            path="/dashboard-redirect" 
            element={
              isAuthenticated ? (
                (() => {
                  let isAdmin = false;
                  
                  if (userData) {
                    // Use userTypeService for consistent detection
                    const userTypeInfo = userTypeService.determineUserType(userData);
                    isAdmin = userTypeInfo.isAdmin;
                    
                    // Additional check with role service if available
                    if (roleService.isAdmin()) {
                      isAdmin = true;
                    }
                  }
                  
                  return isAdmin ? <Navigate to="/dashboard" replace /> : <Navigate to="/user-dashboard" replace />;
                })()
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Catch-all route */}
          <Route 
            path="*" 
            element={
              isAuthenticated ? (
                (() => {
                  let isAdmin = false;
                  
                  if (userData) {
                    // Use userTypeService for consistent detection
                    const userTypeInfo = userTypeService.determineUserType(userData);
                    isAdmin = userTypeInfo.isAdmin;
                    
                    // Additional check with role service if available
                    if (roleService.isAdmin()) {
                      isAdmin = true;
                    }
                  }
                  
                  return isAdmin ? <Navigate to="/dashboard" replace /> : <Navigate to="/user-dashboard" replace />;
                })()
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          </Routes>
        </div>
      </Router>
    </PermissionsProvider>
  )
}

export default App
