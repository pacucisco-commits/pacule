
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-brand-card/50 backdrop-blur-sm p-4 border-b border-gray-700 fixed top-0 left-0 right-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <div className='flex items-center gap-3'>
            <div className="w-10 h-10 bg-gradient-to-tr from-brand-primary to-purple-400 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                </svg>
            </div>
            <h1 className="text-xl font-bold text-white">AI Dropshipping Assistant</h1>
        </div>
        <div className="text-sm text-gray-400">
          Para: <span className="font-semibold text-brand-secondary">Zefanias Pacule</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
