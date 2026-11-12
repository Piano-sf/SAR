import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Network, LayoutDashboard, FileCheck2, ArrowRight } from 'lucide-react';

export default function Landing() {
  const features = [
    {
      icon: <Network className="w-6 h-6 text-blue-600" />,
      title: 'Smart Auto-Routing',
      description: 'Documents automatically route to the correct department heads based on course mapping.'
    },
    {
      icon: <LayoutDashboard className="w-6 h-6 text-indigo-600" />,
      title: 'Real-Time Analytics',
      description: 'Multi-level visibility dashboards for Department Heads and Executives.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-green-600" />,
      title: 'Enterprise Security',
      description: 'Row-Level Security (RLS) ensures strict role-based access to sensitive files.'
    },
    {
      icon: <FileCheck2 className="w-6 h-6 text-purple-600" />,
      title: 'TQF & QA Automation',
      description: 'Streamlined tracking for TQF 3-6, research documents, and training records.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">QA Workspace</span>
        </div>
        <Link 
          to="/login" 
          className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-full hover:bg-gray-800 transition shadow-sm"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 pt-20 pb-24 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-3xl space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            System v1.0 Online
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Institutional Quality <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Assurance Modernized.
            </span>
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A centralized, secure, and automated document management platform designed to eliminate redundancy and provide real-time visibility across all academic departments.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Link 
              to="/login"
              className="group flex items-center gap-2 px-8 py-4 text-white bg-blue-600 rounded-full font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-200"
            >
              Access Portal
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-24"
        >
          {features.map((feature, index) => (
            <div key={index} className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition text-left">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4 border border-gray-100">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}