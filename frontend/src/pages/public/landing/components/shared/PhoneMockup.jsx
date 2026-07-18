import React from "react";
import { motion } from "framer-motion";

/**
 * PhoneMockup - Reusable vector iPhone frame with Dynamic Island notch
 * @param {string} imgSrc - Image path to render inside phone screen
 * @param {string} alt - Accessibility alt text
 * @param {string} maxWidth - Max width of phone mockup container (default: '300px')
 * @param {string} glowColor - Box shadow glow styling
 */
const PhoneMockup = ({ 
    imgSrc, 
    alt = "Kreddy AI WhatsApp Interface", 
    maxWidth = "300px",
    glowColor = "rgba(76, 29, 149, 0.25)"
}) => {
    return (
        <div className="phone-mockup-wrapper" style={{
            position: 'relative',
            width: '100%',
            maxWidth: maxWidth,
            margin: '0 auto'
        }}>
            <motion.div
                className="phone-mockup"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                style={{
                    width: '100%',
                    background: '#0F172A',
                    borderRadius: '48px',
                    padding: '8px',
                    boxShadow: `0 60px 120px -20px ${glowColor}, 0 0 0 1px rgba(255,255,255,0.08)`,
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                {/* Dynamic Island Notch */}
                <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100px',
                    height: '28px',
                    backgroundColor: '#000000',
                    borderRadius: '24px',
                    zIndex: 20,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    padding: '0 10px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ 
                        width: '10px', 
                        height: '10px', 
                        borderRadius: '50%', 
                        backgroundColor: '#111', 
                        border: '1px solid #222' 
                    }}></div>
                </div>

                {/* Inner Screen Display */}
                <div style={{
                    width: '100%',
                    borderRadius: '40px',
                    overflow: 'hidden',
                    lineHeight: 0,
                    backgroundColor: '#F8FAFC'
                }}>
                    <img
                        src={imgSrc}
                        alt={alt}
                        loading="lazy"
                        decoding="async"
                        style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                            objectFit: 'cover',
                            objectPosition: 'top'
                        }}
                    />
                </div>
            </motion.div>
        </div>
    );
};

export default PhoneMockup;
