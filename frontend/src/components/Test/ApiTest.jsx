import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, AlertCircle, Play } from 'lucide-react';
import api from '../../config/api';

const ApiTest = () => {
  const [results, setResults] = useState({});
  const [testing, setTesting] = useState(false);

  const testEndpoints = [
    { name: 'Backend Health', url: '/health', method: 'GET' },
    { name: 'User Stats', url: '/admin/users/stats', method: 'GET' },
    { name: 'Users List', url: '/admin/users?page=1&per_page=5', method: 'GET' },
    { name: 'Admin Users', url: '/admin/admin-users', method: 'GET' },
    { name: 'My Permissions', url: '/admin/me/permissions', method: 'GET' }
  ];

  const runTests = async () => {
    setTesting(true);
    const newResults = {};

    for (const endpoint of testEndpoints) {
      try {
        console.log(`Testing ${endpoint.name}: ${endpoint.url}`);
        const startTime = Date.now();
        
        let response;
        if (endpoint.method === 'GET') {
          response = await api.get(endpoint.url);
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;

        newResults[endpoint.name] = {
          status: 'success',
          response: response,
          duration: duration,
          error: null
        };

        console.log(`✅ ${endpoint.name} success:`, response);
      } catch (error) {
        newResults[endpoint.name] = {
          status: 'error',
          response: null,
          duration: 0,
          error: error.message
        };

        console.log(`❌ ${endpoint.name} failed:`, error);
      }
    }

    setResults(newResults);
    setTesting(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Not Tested</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            API Endpoint Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runTests} disabled={testing}>
            {testing ? 'Testing...' : 'Run API Tests'}
          </Button>

          <div className="grid gap-4">
            {testEndpoints.map((endpoint) => {
              const result = results[endpoint.name];
              return (
                <Card key={endpoint.name} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result?.status)}
                        <div>
                          <h3 className="font-semibold">{endpoint.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {endpoint.method} {endpoint.url}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result?.duration && (
                          <span className="text-sm text-muted-foreground">
                            {result.duration}ms
                          </span>
                        )}
                        {getStatusBadge(result?.status)}
                      </div>
                    </div>

                    {result?.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-800">
                          <strong>Error:</strong> {result.error}
                        </p>
                      </div>
                    )}

                    {result?.response && (
                      <div className="mt-2">
                        <details className="cursor-pointer">
                          <summary className="text-sm font-medium text-blue-600 hover:text-blue-800">
                            View Response Data
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-50 border rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(result.response, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {Object.keys(results).length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-semibold text-blue-800 mb-2">Test Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Successful:</strong> {
                    Object.values(results).filter(r => r.status === 'success').length
                  } / {Object.keys(results).length}
                </div>
                <div>
                  <strong>Failed:</strong> {
                    Object.values(results).filter(r => r.status === 'error').length
                  } / {Object.keys(results).length}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiTest;
