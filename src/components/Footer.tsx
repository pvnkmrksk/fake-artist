
import React from 'react';
import { ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 text-sm text-center text-muted-foreground">
      <p className="flex items-center justify-center gap-1">
        Made with ❤️ by 
        <a 
          href="https://twitter.com/pvnkmrksk" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center underline hover:text-primary"
        >
          @pvnkmrksk
          <ExternalLink className="h-3 w-3 ml-0.5" />
        </a>
      </p>
    </footer>
  );
};

export default Footer;
