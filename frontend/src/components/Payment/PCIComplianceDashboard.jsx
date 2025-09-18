import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Lock,
  Eye,
  FileText,
  Clock,
  Database,
  Key,
  AlertCircle,
  Info
} from 'lucide-react';

const PCIComplianceDashboard = () => {
  const [complianceData, setComplianceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      const response = await fetch('/api/payments/pci/compliance-check', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch PCI compliance data');
      }

      const data = await response.json();
      setComplianceData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceColor = (status) => {
    switch (status) {
      case 'compliant':
        return 'text-green-600 bg-green-100';
      case 'non-compliant':
        return 'text-red-600 bg-red-100';
      case 'unknown':
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getComplianceIcon = (status) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4" />;
      case 'non-compliant':
        return <XCircle className="h-4 w-4" />;
      case 'unknown':
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Template for PCI requirements (without status - will be computed from API data)
  const pciRequirementsTemplate = [
    {
      id: 'data_protection',
      title: 'Data Protection',
      description: 'Sensitive cardholder data is encrypted and protected',
      icon: <Lock className="h-5 w-5" />
    },
    {
      id: 'tokenization',
      title: 'Tokenization',
      description: 'Card data is tokenized and never stored in plain text',
      icon: <Key className="h-5 w-5" />
    },
    {
      id: 'access_controls',
      title: 'Access Controls',
      description: 'Proper access controls and authentication in place',
      icon: <Shield className="h-5 w-5" />
    },
    {
      id: 'audit_logging',
      title: 'Audit Logging',
      description: 'Comprehensive audit logging for all payment activities',
      icon: <FileText className="h-5 w-5" />
    },
    {
      id: 'data_retention',
      title: 'Data Retention',
      description: 'Proper data retention policies (7 years for PCI)',
      icon: <Clock className="h-5 w-5" />
    },
    {
      id: 'encryption',
      title: 'Encryption',
      description: 'End-to-end encryption for sensitive data transmission',
      icon: <Database className="h-5 w-5" />
    }
  ];

  // Compute PCI requirements with status derived from API data
  const pciRequirements = useMemo(() => {
    if (!complianceData) {
      // Return template with 'unknown' status when no data is available
      return pciRequirementsTemplate.map(req => ({
        ...req,
        status: 'unknown'
      }));
    }

    // Map API response to individual requirement statuses
    const getRequirementStatus = (requirementId) => {
      // Check if there are specific violations for this requirement
      const violations = complianceData.violations || [];
      const recommendations = complianceData.recommendations || [];
      
      // Map requirement IDs to potential violation patterns
      const violationPatterns = {
        'data_protection': ['sensitive data', 'encryption', 'protection'],
        'tokenization': ['tokenization', 'plain text', 'stored'],
        'access_controls': ['access control', 'authentication', 'authorization'],
        'audit_logging': ['audit', 'logging', 'log'],
        'data_retention': ['retention', 'policy', '7 years'],
        'encryption': ['encryption', 'encrypted', 'cipher']
      };

      // Check if any violations match this requirement
      const hasViolation = violations.some(violation => {
        const pattern = violationPatterns[requirementId] || [];
        return pattern.some(keyword => 
          violation.toLowerCase().includes(keyword.toLowerCase())
        );
      });

      if (hasViolation) {
        return 'non-compliant';
      }

      // If no specific violations and overall compliance is true, mark as compliant
      if (complianceData.pci_compliant === true) {
        return 'compliant';
      }

      // If overall compliance is false but no specific violation found, mark as unknown
      return 'unknown';
    };

    return pciRequirementsTemplate.map(req => ({
      ...req,
      status: getRequirementStatus(req.id)
    }));
  }, [complianceData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading PCI compliance data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">PCI DSS Compliance Dashboard</h2>
        <p className="text-gray-600">Payment Card Industry Data Security Standard compliance monitoring</p>
      </div>

      {/* Overall Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Overall Compliance Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge className={`${getComplianceColor(complianceData?.pci_compliant)} flex items-center space-x-1`}>
                {getComplianceIcon(complianceData?.pci_compliant)}
                <span className="font-medium">
                  {complianceData?.pci_compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                </span>
              </Badge>
              <span className="text-sm text-gray-600">
                Last checked: {new Date().toLocaleString()}
              </span>
            </div>
            <Button onClick={fetchComplianceData} size="sm" variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PCI Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pciRequirements.map((requirement) => (
          <Card key={requirement.id}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {requirement.icon}
                <span>{requirement.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  {requirement.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge className={`${getComplianceColor(requirement.status)} flex items-center space-x-1`}>
                    {getComplianceIcon(requirement.status)}
                    <span className="font-medium">
                      {requirement.status === 'compliant' ? 'COMPLIANT' : 
                       requirement.status === 'non-compliant' ? 'NON-COMPLIANT' : 'UNKNOWN'}
                    </span>
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compliance Violations */}
      {complianceData?.violations && complianceData.violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Compliance Violations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceData.violations.map((violation, index) => (
                <Alert key={index} className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium text-red-800">{violation}</div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Recommendations */}
      {complianceData?.recommendations && complianceData.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-600" />
              <span>Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceData.recommendations.map((recommendation, index) => (
                <Alert key={index} className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="text-blue-800">{recommendation}</div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Features */}
      {complianceData?.features && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Features</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {complianceData.features.map((category, categoryIndex) => (
                <div key={categoryIndex} className="space-y-4">
                  <h4 className="font-medium text-gray-900">{category.name}</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {category.items?.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-2">
                        {feature.compliant ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={feature.compliant ? "text-gray-900" : "text-gray-400"}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Features Loading/Empty State */}
      {!complianceData?.features && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Features</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Security features data not available</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Information */}
      {complianceData?.auditMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Audit Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {complianceData.auditMetrics.retentionYears || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Audit Retention</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {complianceData.auditMetrics.loggingStatus || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Logging</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-2xl font-bold ${
                  complianceData.auditMetrics.pciStatus === 'compliant' 
                    ? 'text-green-600' 
                    : complianceData.auditMetrics.pciStatus === 'non-compliant'
                    ? 'text-red-600'
                    : 'text-gray-900'
                }`}>
                  {complianceData.auditMetrics.pciStatus || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">PCI DSS Status</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Information Loading/Empty State */}
      {!complianceData?.auditMetrics && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Audit Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Audit metrics data not available</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PCIComplianceDashboard;

