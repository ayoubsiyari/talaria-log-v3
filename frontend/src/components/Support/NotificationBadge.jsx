import React from 'react'
import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const NotificationBadge = ({ count, onClick, className = "" }) => {
  if (count === 0) return null

  return (
    <div 
      className={`relative cursor-pointer ${className}`}
      onClick={onClick}
    >
      <Bell className="w-5 h-5 text-gray-600" />
      <Badge 
        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white border-2 border-white"
      >
        {count > 99 ? '99+' : count}
      </Badge>
    </div>
  )
}

export default NotificationBadge
