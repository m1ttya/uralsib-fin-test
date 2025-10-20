import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Банк Уралсиб. Все права защищены.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <span className="sr-only">VK</span>
              {/* Placeholder for VK icon */}
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-5H9v-2.5h2V8.5c0-2 1.3-3.5 3.5-3.5h2v2.5h-2c-.5 0-1 .5-1 1v1.5h3l-.5 2.5h-2.5V17h-2z"/></svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <span className="sr-only">Telegram</span>
              {/* Placeholder for Telegram icon */}
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.88l-1.45 6.84c-.13.62-.57.78-1.08.48l-2.22-1.64-1.08 1.04c-.12.12-.22.22-.44.22l.16-2.28 4.1-3.72c.18-.16-.05-.25-.3-.1l-5.04 3.16-2.18-.68c-.6-.18-.6-.6.13-1.04l8.5-3.32c.52-.2.95.1.8.72z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
