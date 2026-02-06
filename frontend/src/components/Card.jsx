import React from 'react';

const Card = ({ children, className = '', glowColor = 'purple' }) => {
    const glowClass = glowColor === 'purple' ? 'glow-border-purple shadow-vibranium-glow' : 'glow-border-blue shadow-blue-glow';

    return (
        <div className={`glass-panel p-5 rounded-xl relative overflow-hidden ${glowClass} ${className}`}>
            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-wakanda-accent opacity-70"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-wakanda-accent opacity-70"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-wakanda-accent opacity-70"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-wakanda-accent opacity-70"></div>
            {children}
        </div>
    );
};

export default Card;
