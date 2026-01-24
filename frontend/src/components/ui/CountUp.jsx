import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

/**
 * A reusable component that counts up to a target number when it scrolls into view.
 * @param {number} to - The number to count up to.
 * @param {string} suffix - text to append after number (e.g. "+", "%")
 * @param {string} prefix - text to prepend (e.g. "₦")
 */
const CountUp = ({ to, from = 0, suffix = "", prefix = "", className = "" }) => {
    const ref = useRef(null);
    const motionValue = useMotionValue(from);
    const springValue = useSpring(motionValue, {
        stiffness: 50,
        damping: 20,
        duration: 2
    });
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    useEffect(() => {
        if (isInView) {
            motionValue.set(to);
        }
    }, [isInView, motionValue, to]);

    useEffect(() => {
        return springValue.on("change", (latest) => {
            if (ref.current) {
                // Format with commas for large numbers
                const formatted = Math.floor(latest).toLocaleString();
                ref.current.textContent = prefix + formatted + suffix;
            }
        });
    }, [springValue, suffix, prefix]);

    return <span className={className} ref={ref} />;
};

export default CountUp;
