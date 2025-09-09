import React from 'react'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'

const RealtimeDebug = () => {
  const { isConnected, updates, subscribe, unsubscribe } = useRealtimeUpdates()

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
      <h3 className="font-bold mb-2">🔔 Real-time Debug</h3>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-semibold">Status:</span> 
          <span className={`ml-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div>
          <span className="font-semibold">Updates:</span> 
          <span className="ml-2 text-blue-400">{updates.length}</span>
        </div>
        {updates.length > 0 && (
          <div className="mt-2">
            <div className="font-semibold">Latest:</div>
            <div className="text-xs bg-gray-800 p-2 rounded mt-1">
              {updates[updates.length - 1]?.update_type}: {JSON.stringify(updates[updates.length - 1]?.data?.sidebar_components)}
            </div>
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <button 
            onClick={subscribe}
            className="px-2 py-1 bg-green-600 rounded text-xs hover:bg-green-700"
          >
            Subscribe
          </button>
          <button 
            onClick={unsubscribe}
            className="px-2 py-1 bg-red-600 rounded text-xs hover:bg-red-700"
          >
            Unsubscribe
          </button>
        </div>
      </div>
    </div>
  )
}

export default RealtimeDebug

