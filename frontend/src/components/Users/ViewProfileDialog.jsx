import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Crown, 
  CheckCircle, 
  XCircle,
  Clock,
  BookOpen,
  CreditCard,
  Activity
} from 'lucide-react';

const ViewProfileDialog = ({ user, isOpen, onClose }) => {
  if (!user) return null;

  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-emerald-500' : 'bg-rose-400';
  };

  const getSubscriptionColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'premium': return 'bg-slate-800 text-white border-slate-700 shadow-slate-700/20';
      case 'pro': return 'bg-slate-700 text-white border-slate-600 shadow-slate-600/20';
      case 'basic': return 'bg-slate-600 text-white border-slate-500 shadow-slate-500/20';
      default: return 'bg-slate-500 text-white border-slate-400 shadow-slate-400/20';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-2xl">
        <div className="relative">
          {/* Minimalist Hero Section */}
          <div className="relative h-40 sm:h-48 md:h-56 bg-gradient-to-b from-blue-50/30 via-slate-50/50 to-white overflow-hidden">
            {/* Subtle Geometric Elements */}
            <div className="absolute inset-0 opacity-40">
              <div className="absolute top-6 left-6 w-20 h-20 border border-blue-200/60 rounded-full animate-float"></div>
              <div className="absolute top-12 right-10 w-14 h-14 border border-indigo-100/80 rounded-full animate-float-delayed"></div>
              <div className="absolute bottom-8 left-1/3 w-16 h-16 border border-slate-200/70 rounded-full animate-float-slow"></div>
              
              {/* Minimal Lines */}
              <div className="absolute top-16 left-1/4 w-10 h-px bg-blue-200/50 animate-fade"></div>
              <div className="absolute bottom-16 right-1/4 w-6 h-px bg-indigo-200/60 animate-fade-delayed"></div>
            </div>
            
            {/* Perfectly Centered Profile Section */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative group transform translate-y-6">
                {/* Minimal Glow Ring */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-all duration-700 animate-pulse-subtle scale-110"></div>
                
                {/* Avatar Container */}
                <div className="relative">
                  <Avatar className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 border-4 border-white shadow-2xl shadow-slate-900/10 hover:scale-105 transition-all duration-500 group-hover:shadow-blue-500/20">
                    <AvatarImage src={user.avatar} className="object-cover" />
                    <AvatarFallback className="text-2xl sm:text-3xl font-light bg-gradient-to-br from-slate-700 to-slate-900 text-white">
                      {getInitials(user.first_name, user.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Minimalist Status Indicator */}
                  <div className={`absolute -bottom-2 -right-2 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full border-3 border-white ${getStatusColor(user.is_active)} shadow-lg`}>
                    <div className={`absolute inset-1 rounded-full ${getStatusColor(user.is_active)} ${user.is_active ? 'animate-pulse-gentle' : ''}`}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Minimalist Profile Content */}
          <div className="pt-12 sm:pt-14 pb-6 px-5 sm:px-6 bg-gradient-to-b from-white via-slate-50/30 to-blue-50/20">
            {/* Centered Name and Info */}
            <div className="text-center mb-8">
              <div className="relative bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 group">
                {/* Soft Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/30 rounded-2xl opacity-60"></div>
                
                <div className="relative z-10">
                  <h2 className="text-2xl sm:text-3xl font-light mb-2 text-slate-900">
                    {user.first_name} {user.last_name}
                    {user.is_super_admin && (
                      <Crown className="inline-block ml-3 w-6 h-6 text-amber-500 animate-bounce-gentle" />
                    )}
                  </h2>
                  
                  <p className="text-slate-500 mb-6 text-base font-light tracking-wide">@{user.username}</p>
                  
                  {/* Minimalist Badge Section */}
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <Badge 
                      variant={user.is_active ? 'default' : 'outline'}
                      className={`px-5 py-2 text-sm font-medium border-2 hover:scale-105 transition-all duration-300 ${
                        user.is_active 
                          ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-700 shadow-slate-800/20' 
                          : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {user.is_active ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Inactive
                        </>
                      )}
                    </Badge>
                    
                    {user.is_verified && (
                      <Badge className="px-5 py-2 text-sm font-medium bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:scale-105 transition-all duration-300 hover:bg-emerald-100 shadow-emerald-200/30">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verified
                      </Badge>
                    )}
                    
                    {user.is_admin && (
                      <Badge className="px-5 py-2 text-sm font-medium bg-blue-50 text-blue-700 border-2 border-blue-200 hover:scale-105 transition-all duration-300 hover:bg-blue-100 shadow-blue-200/30">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Minimalist Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { value: user.id, label: 'User ID' },
                { value: user.journal_count || 0, label: 'Journals' },
                { value: user.roles?.length || 1, label: 'Roles' },
                { value: user.subscription_status || 'Free', label: 'Plan' }
              ].map((stat, index) => (
                <Card key={index} className="group hover:scale-105 transition-all duration-500 bg-white/90 backdrop-blur-sm border border-slate-200/60 shadow-md hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                  <CardContent className="p-6 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10">
                      <div className="text-2xl sm:text-3xl font-light mb-2 text-slate-800">
                        {stat.value}
                      </div>
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-widest">{stat.label}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Information Sections */}
            {[
              {
                title: 'Contact Information',
                icon: User,
                items: [
                  { icon: Mail, label: 'Email', value: user.email },
                  ...(user.phone ? [{ icon: Phone, label: 'Phone', value: user.phone }] : []),
                  ...(user.country ? [{ icon: MapPin, label: 'Location', value: user.country }] : [])
                ]
              },
              {
                title: 'Account Details',
                icon: Shield,
                items: [
                  { 
                    label: 'Subscription Status', 
                    value: (
                      <Badge className={`${getSubscriptionColor(user.subscription_status)} px-4 py-2 font-medium hover:scale-105 transition-transform`}>
                        {user.subscription_status || 'Free'}
                      </Badge>
                    )
                  },
                  { 
                    label: 'Account Type', 
                    value: (
                      <Badge variant="outline" className="px-4 py-2 font-medium bg-white border-2 border-gray-300 text-gray-700 hover:scale-105 transition-transform hover:border-gray-400">
                        {user.account_type === 'admin' ? 'Administrator' : 'Regular User'}
                      </Badge>
                    )
                  },
                  ...(user.roles && user.roles.length > 0 ? [{
                    label: 'Assigned Roles',
                    value: (
                      <div className="flex gap-2 flex-wrap">
                        {user.roles.map((role, index) => (
                          <Badge key={index} className="text-xs px-3 py-1 bg-gray-800 text-white border border-gray-700 hover:scale-105 transition-transform">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    )
                  }] : [])
                ]
              },
              {
                title: 'Activity Information',
                icon: Activity,
                items: [
                  { icon: Calendar, label: 'Member Since', value: formatDate(user.created_at) },
                  { icon: Clock, label: 'Last Login', value: formatDate(user.last_login) },
                  ...(user.updated_at ? [{ icon: Activity, label: 'Last Updated', value: formatDate(user.updated_at) }] : [])
                ]
              }
            ].map((section, sectionIndex) => (
              <Card key={sectionIndex} className="mb-6 bg-white/90 backdrop-blur-sm border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-500 group">
                <CardContent className="p-6">
                  <h3 className="text-lg sm:text-xl font-light mb-5 flex items-center text-slate-800">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center mr-3 shadow-md group-hover:scale-105 transition-transform duration-300">
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    {section.title}
                  </h3>
                  
                  <div className="space-y-3">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50/60 to-blue-50/40 rounded-xl hover:from-slate-100/80 hover:to-blue-100/60 transition-all duration-300 group/item border border-slate-100/50">
                        <span className="text-sm font-medium text-slate-700 flex items-center">
                          {item.icon && <item.icon className="w-4 h-4 mr-3 text-slate-500 group-hover/item:text-slate-700 transition-colors" />}
                          {item.label}
                        </span>
                        <span className="text-sm font-medium text-slate-800">
                          {typeof item.value === 'string' ? item.value : item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Minimalist Custom Animations */}
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); opacity: 0.6; }
            50% { transform: translateY(-8px); opacity: 1; }
          }
          
          @keyframes float-delayed {
            0%, 100% { transform: translateY(0px); opacity: 0.4; }
            50% { transform: translateY(-6px); opacity: 0.8; }
          }
          
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px); opacity: 0.5; }
            50% { transform: translateY(-4px); opacity: 0.9; }
          }
          
          @keyframes fade {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.7; }
          }
          
          @keyframes fade-delayed {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.6; }
          }
          
          @keyframes bounce-gentle {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
          }
          
          @keyframes pulse-subtle {
            0%, 100% { opacity: 0.05; transform: scale(1.1); }
            50% { opacity: 0.1; transform: scale(1.15); }
          }
          
          @keyframes pulse-gentle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          .animate-float { animation: float 6s ease-in-out infinite; }
          .animate-float-delayed { animation: float-delayed 5s ease-in-out infinite 1s; }
          .animate-float-slow { animation: float-slow 7s ease-in-out infinite 2s; }
          .animate-fade { animation: fade 4s ease-in-out infinite; }
          .animate-fade-delayed { animation: fade-delayed 3s ease-in-out infinite 1.5s; }
          .animate-bounce-gentle { animation: bounce-gentle 3s ease-in-out infinite; }
          .animate-pulse-subtle { animation: pulse-subtle 4s ease-in-out infinite; }
          .animate-pulse-gentle { animation: pulse-gentle 2s ease-in-out infinite; }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default ViewProfileDialog;