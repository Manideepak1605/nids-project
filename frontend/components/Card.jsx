import React from 'react';

const Card = ({ children, className = '', glowColor = 'violet' }) => {
    const glowClass = glowColor === 'violet' ? 'border-violet-500/20 shadow-lg shadow-violet-900/10' : 'border-white/10 shadow-lg';

    return (
        <div className={`bg-white/5 backdrop-blur-md border rounded-2xl p-6 relative overflow-hidden transition-all hover:border-violet-500/40 ${glowClass} ${className}`}>
            <div className="absolute top-0 left-0 w-6 h-[1px] bg-gradient-to-r from-violet-400/50 to-transparent"></div>
            <div className="absolute top-0 left-0 w-[1px] h-6 bg-gradient-to-b from-violet-400/50 to-transparent"></div>
            <div className="absolute bottom-0 right-0 w-6 h-[1px] bg-gradient-to-l from-violet-400/30 to-transparent"></div>
            <div className="absolute bottom-0 right-0 w-[1px] h-6 bg-gradient-to-t from-violet-400/30 to-transparent"></div>
            {children}
        </div>
    );
};

export default Card;
