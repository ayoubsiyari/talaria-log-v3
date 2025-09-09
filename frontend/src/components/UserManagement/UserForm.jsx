import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Shield, 
  Crown, 
  Calendar,
  Eye,
  EyeOff,
  Save,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../config/api';

const UserForm = ({ user, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    country: '',
    password: '',
    confirmPassword: '',
    is_active: true,
    is_verified: false,
    is_admin: false,
    subscription_status: 'free',
    subscription_plan: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    
    if (user) {
      setIsEditing(true);
      setFormData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        country: user.country || '',
        password: '',
        confirmPassword: '',
        is_active: user.is_active !== undefined ? user.is_active : true,
        is_verified: user.is_verified || false,
        is_admin: user.is_admin || false,
        subscription_status: user.subscription_status || 'free',
        subscription_plan: user.subscription_plan || '',
      });
    } else {
      setIsEditing(false);
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        country: '',
        password: '',
        confirmPassword: '',
        is_active: true,
        is_verified: false,
        is_admin: false,
        subscription_status: 'free',
        subscription_plan: '',
      });
    }
    setErrors({});
  }, [user]);

  const checkAvailability = async (field, value, excludeUserId = null) => {
    try {
      const response = await api.post('/auth/check-availability', { field, value, excludeUserId });
      return response.available;
    } catch (err) {
      console.error('Error checking availability:', err);
      return true; // Assume available if check fails
    }
  };

  const validateForm = async () => {
    const newErrors = {};

    // Required fields
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation for new users
    if (!isEditing && !formData.password) {
      newErrors.password = 'Password is required for new users';
    }

    // Password confirmation
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Password strength for new passwords
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    // Check for duplicates (only if no other validation errors)
    if (Object.keys(newErrors).length === 0) {
      const excludeUserId = isEditing ? user?.id : null;
      
      // Check username availability
      const usernameAvailable = await checkAvailability('username', formData.username, excludeUserId);
      if (!usernameAvailable) {
        newErrors.username = 'Username is already taken';
      }
      
      // Check email availability
      const emailAvailable = await checkAvailability('email', formData.email, excludeUserId);
      if (!emailAvailable) {
        newErrors.email = 'Email is already registered';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) {
      toast.error('Please fix the errors in the form');
      return;
    }

    const dataToSend = { ...formData };
    
    // Remove password fields if not provided
    if (!dataToSend.password) {
      delete dataToSend.password;
    }
    delete dataToSend.confirmPassword;
    
    // Remove empty subscription plan if not selected
    if (!dataToSend.subscription_plan) {
      delete dataToSend.subscription_plan;
    }

    onSubmit(dataToSend);
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, color: 'bg-gray-200', text: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    
    return {
      strength: Math.min(strength, 5),
      color: colors[strength - 1] || 'bg-gray-200',
      text: texts[strength - 1] || ''
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b py-2 sm:py-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                {isEditing ? 'Edit User Profile' : 'Create New User'}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600">
                {isEditing ? 'Update user information and permissions' : 'Add a new user to the system'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 sm:p-4">
          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
            {/* Basic Information Section */}
            <div>
              <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2 flex items-center">
                <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-600" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
                    First Name *
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className={`h-9 ${errors.first_name ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="Enter first name"
                  />
                  {errors.first_name && (
                    <p className="text-xs text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.first_name}
                    </p>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
                    Last Name *
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className={`h-9 ${errors.last_name ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="Enter last name"
                  />
                  {errors.last_name && (
                    <p className="text-xs text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.last_name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-3" />

            {/* Account Information Section */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                <Shield className="h-4 w-4 mr-2 text-green-600" />
                Account Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Username *
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`h-9 ${errors.username ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="Enter username"
                  />
                  {errors.username && (
                    <p className="text-xs text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.username}
                    </p>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`h-9 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-3" />

            {/* Contact Information Section */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                <Phone className="h-4 w-4 mr-2 text-purple-600" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="h-9"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                    Country
                  </Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="h-9"
                    placeholder="Enter country"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-3" />

            {/* Security Section */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                <Lock className="h-4 w-4 mr-2 text-red-600" />
                Security
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    {isEditing ? 'New Password' : 'Password *'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className={`h-9 pr-10 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder={isEditing ? 'Leave blank to keep current password' : 'Enter password'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-9 px-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full ${
                              level <= passwordStrength.strength ? passwordStrength.color : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{passwordStrength.text}</p>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-xs text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.password}
                    </p>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`h-9 pr-10 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="Confirm password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-9 px-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-3" />

            {/* Account Settings Section */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                <Crown className="h-4 w-4 mr-2 text-yellow-600" />
                Account Settings
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium text-gray-700">Account Status</Label>
                      <p className="text-xs text-gray-500">Enable or disable user account</p>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium text-gray-700">Email Verified</Label>
                      <p className="text-xs text-gray-500">Mark email as verified</p>
                    </div>
                    <Switch
                      checked={formData.is_verified}
                      onCheckedChange={(checked) => handleSwitchChange('is_verified', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium text-gray-700">Admin Access</Label>
                      <p className="text-xs text-gray-500">Grant administrative privileges</p>
                    </div>
                    <Switch
                      checked={formData.is_admin}
                      onCheckedChange={(checked) => handleSwitchChange('is_admin', checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Subscription Status</Label>
                    <Select
                      value={formData.subscription_status}
                      onValueChange={(value) => handleSelectChange('subscription_status', value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select subscription status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pending">Pending Payment</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="past_due">Past Due</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Subscription Plan</Label>
                    <Select
                      value={formData.subscription_plan || ''}
                      onValueChange={(value) => handleSelectChange('subscription_plan', value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select subscription plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {isEditing && (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">Account Created</Label>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="w-full sm:w-auto px-4 h-9"
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-4 h-9 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update User' : 'Create User'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserForm;
