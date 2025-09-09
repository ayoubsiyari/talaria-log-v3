import React from 'react';
import {
  Shield,
  Users,
  BarChart3,
  Settings,
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
  Lock,
  Globe,
  Headphones,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const HomePage = () => {
  const features = [
    {
      icon: Shield,
      title: "Robust Role-Based Access Control",
      description: "Implement precise permissions and role management to safeguard your organization's data and workflows."
    },
    {
      icon: Users,
      title: "Comprehensive User Management",
      description: "Easily administer user profiles, track activities, and maintain accountability."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics Dashboard",
      description: "Leverage real-time insights and custom metrics to optimize operations and growth."
    },
    {
      icon: Settings,
      title: "Efficient System Administration",
      description: "Simplify complex configurations with powerful admin tools for full control."
    }
  ];

  const benefits = [
    "Enterprise-grade security architecture",
    "Real-time activity monitoring",
    "Audit trails for accountability",
    "Scalable across organizational levels",
    "User-friendly admin interface",
    "24/7 proactive system monitoring"
  ];

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden text-slate-100">

      {/* Animated Gradient Background */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-[-50%] w-[200%] h-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 opacity-30 animate-gradientShift"></div>
        <div className="absolute top-[30%] left-[10%] w-[40rem] h-[40rem] bg-purple-500/20 rounded-full blur-3xl animate-pulseSlow"></div>
        <div className="absolute bottom-[20%] right-[15%] w-[50rem] h-[50rem] bg-blue-500/10 rounded-full blur-3xl animate-pulseSlow delay-1000"></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Shield className="h-10 w-10 text-cyan-500" />
                <div className="absolute inset-0 bg-cyan-500/25 rounded-lg blur-md animate-pulse"></div>
              </div>
              <span className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-600 bg-clip-text text-transparent select-none">
                Talaria Admin
              </span>
            </div>
            <div className="flex items-center space-x-5">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent hover:border-cyan-600 transition">
                Sign In
              </Button>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-cyan-600/40 rounded-xl px-8 py-3 font-semibold transition transform hover:scale-105">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-36">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center relative z-20">
          <div className="inline-flex items-center justify-center px-8 py-3 mb-10 rounded-full bg-gradient-to-r from-cyan-700 to-blue-700 shadow-lg shadow-cyan-900/40">
            <Star className="w-5 h-5 mr-3 text-yellow-400" />
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Enterprise-Grade Admin Dashboard
            </span>
          </div>

          <h1 className="text-7xl font-extrabold leading-tight mb-8 tracking-tight">
            <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Powerful & Secure
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Admin Dashboard
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-xl text-slate-400 leading-relaxed mb-16">
            Streamline your organization’s administration with a comprehensive, scalable platform that puts you in control of users, permissions, and system health.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
            <Button size="lg" className="flex items-center gap-3 px-12 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-2xl rounded-xl font-semibold transform transition hover:scale-105">
              Sign In to Dashboard
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="px-12 py-4 text-slate-300 border-2 border-slate-600 rounded-xl hover:bg-slate-800/60 hover:border-cyan-500 transition font-semibold">
              Create Account
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-gradient-to-br from-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-extrabold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Everything You Need to Manage Your Organization
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Comprehensive tools and features designed to streamline administrative tasks while enhancing security and control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gradient-to-br from-slate-800/70 to-slate-900/80 border border-slate-700 rounded-3xl backdrop-blur-md shadow-lg hover:shadow-cyan-600/40 transition-shadow duration-500 group">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-6 relative w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-700 to-blue-700 flex items-center justify-center group-hover:scale-110 transform transition-transform duration-300 shadow-xl">
                    <feature.icon className="w-9 h-9 text-white" />
                    <div className="absolute inset-0 rounded-3xl bg-cyan-400/25 blur group-hover:blur-md transition-all duration-300"></div>
                  </div>
                  <CardTitle className="text-2xl text-white font-bold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-slate-300 leading-relaxed text-lg">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl font-extrabold mb-10 tracking-tight">
                <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Why Choose Talaria Admin?
                </span>
              </h2>
              <p className="text-xl text-slate-400 mb-12 leading-relaxed max-w-xl">
                Our platform offers enterprise-grade security, unmatched scalability, and an intuitive management experience tailored to grow with your organization.
              </p>

              <div className="space-y-7">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-5 group cursor-default select-none">
                    <div className="relative">
                      <CheckCircle className="w-7 h-7 text-green-400 flex-shrink-0" />
                      <div className="absolute inset-0 bg-green-400/30 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
                    </div>
                    <span className="text-slate-300 text-lg font-semibold">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <Card className="bg-gradient-to-br from-slate-800/70 to-slate-900/80 border border-slate-700 rounded-3xl backdrop-blur-md hover:border-yellow-500/70 transition-all duration-300 group shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-5 mb-6">
                    <Zap className="w-12 h-12 text-yellow-400" />
                    <h3 className="text-2xl font-extrabold text-white">Lightning Fast</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-lg font-medium">
                    Optimized for speed and responsiveness, ensuring seamless user experience even under heavy loads.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800/70 to-slate-900/80 border border-slate-700 rounded-3xl backdrop-blur-md hover:border-green-500/70 transition-all duration-300 group shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-5 mb-6">
                    <Lock className="w-12 h-12 text-green-400" />
                    <h3 className="text-2xl font-extrabold text-white">Secure by Design</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-lg font-medium">
                    Enterprise-grade security protocols, role-based access, and detailed auditing keep your data safe.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800/70 to-slate-900/80 border border-slate-700 rounded-3xl backdrop-blur-md hover:border-blue-500/70 transition-all duration-300 group shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-5 mb-6">
                    <Globe className="w-12 h-12 text-blue-400" />
                    <h3 className="text-2xl font-extrabold text-white">Global Access</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-lg font-medium">
                    Access your dashboard securely anywhere with our cloud-hosted infrastructure.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800/70 to-slate-900/80 border border-slate-700 rounded-3xl backdrop-blur-md hover:border-purple-500/70 transition-all duration-300 group shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-5 mb-6">
                    <Headphones className="w-12 h-12 text-purple-400" />
                    <h3 className="text-2xl font-extrabold text-white">24/7 Support</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-lg font-medium">
                    Dedicated, round-the-clock support to ensure uninterrupted system performance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-700/20 via-blue-700/20 to-purple-700/20 -z-10"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-20">
          <h2 className="text-5xl font-extrabold mb-8 tracking-tight">
            <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Ready to get started?
            </span>
          </h2>
          <p className="text-xl text-slate-300 mb-14 leading-relaxed max-w-xl mx-auto">
            Join thousands of organizations elevating their administration with Talaria Admin.
          </p>
          <div className="flex flex-col sm:flex-row gap-8 justify-center">
            <Button size="lg" className="flex items-center gap-3 px-14 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-2xl shadow-cyan-600/40 font-semibold hover:scale-105 transform transition">
              Sign In Now
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="px-14 py-4 border-2 border-slate-600 text-slate-300 rounded-xl hover:bg-slate-800/70 hover:border-cyan-500 font-semibold transition">
              Create Free Account
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-14">
            <div>
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative">
                  <Shield className="h-9 w-9 text-cyan-500" />
                  <div className="absolute inset-0 bg-cyan-500/30 rounded-lg blur-md"></div>
                </div>
                <span className="text-2xl font-extrabold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent select-none">
                  Talaria Admin
                </span>
              </div>
              <p className="text-slate-400 text-lg leading-relaxed">
                Enterprise-grade admin dashboard redefined for the modern, security-first organization.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-7 text-slate-200 tracking-wide">Product</h3>
              <ul className="space-y-4 text-slate-400 text-lg">
                <li><a href="#" className="hover:text-cyan-500 transition">Features</a></li>
                <li><a href="#" className="hover:text-cyan-500 transition">Security</a></li>
                <li><a href="#" className="hover:text-cyan-500 transition">Pricing</a></li>
                <li><a href="#" className="hover:text-cyan-500 transition">Updates</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-7 text-slate-200 tracking-wide">Support</h3>
              <ul className="space-y-4 text-slate-400 text-lg">
                <li><a href="#" className="hover:text-cyan-500 transition">Documentation</a></li>
                <li><a href="#" className="hover:text-cyan-500 transition">Help Center</a></li>
                <li><a href="#" className="hover:text-cyan-500 transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-cyan-500 transition">Status</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-7 text-slate-200 tracking-wide">Company</h3>
              <ul className="space-y-4 text-slate-400 text-lg">
                <li><a href="#" className="hover:text-cyan-500 transition">About</a></li>
                <li><a href="#" className="hover:text-cyan-500 transition">Blog</a></li>
                <li><a href="#" className="hover:text-cyan-500 transition">Careers</a></li>
                <li><a href="#" className="hover:text-cyan-500 transition">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-14 pt-8 border-t border-slate-800 text-center text-slate-500 select-none text-sm">
            &copy; 2024 Talaria Admin. All rights reserved.
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradientShift {
          0% { transform: translateX(0); }
          50% { transform: translateX(-25%); }
          100% { transform: translateX(0); }
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }
        .animate-gradientShift {
          animation: gradientShift 20s ease-in-out infinite;
        }
        .animate-pulseSlow {
          animation: pulseSlow 8s ease-in-out infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
