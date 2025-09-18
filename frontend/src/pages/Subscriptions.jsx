import React from 'react';
import EnhancedSubscriptionManagement from '../components/Subscriptions/EnhancedSubscriptionManagement';

const Subscriptions = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">View Subscriptions</h1>
      <EnhancedSubscriptionManagement />
    </div>
  );
};

export default Subscriptions;
