import { motion } from "framer-motion";

const LoadingState = () => {
  return (
    <div
      className="flex items-center justify-center min-h-screen bg-center bg-no-repeat bg-cover"
      style={{ backgroundImage: "url('/KwikProofpattern.png')" }}
    >
      <motion.img
        src="/Kwikproofnew.png"
        alt="Loading..."
        className="w-24 sm:w-28 md:w-32 lg:w-36 h-auto"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [1, 0.8, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

export default LoadingState;
