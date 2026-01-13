import React from 'react';
import { Button } from '@/components/ui/button';
import { Compass} from 'lucide-react'; // Example icon from lucide-react

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 text-gray-800 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-lg w-full transform -translate-y-4">
        <Compass className="w-20 h-20 text-blue-500 mx-auto mb-6" />
        <h1 className="text-5xl font-extrabold text-gray-800 mb-4">
          Oops! Page Not Found
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          We can't seem to find the page you're looking for.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Perhaps you mistyped the URL, or the page has moved.
          Don't worry, we'll help you find your way back.
        </p>
        <Button
          onClick={() => window.location.href = '/'}
          className="px-8 py-3 text-lg bg-blue-700 hover:bg-blue-600 text-white transition-colors duration-300"
        >
          Take Me Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;