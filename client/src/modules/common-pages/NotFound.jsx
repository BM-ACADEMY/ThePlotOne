import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full text-center space-y-8"
            >
                <div className="relative">
                    <h1 className="text-9xl font-extrabold text-gray-100 tracking-widest">
                        404
                    </h1>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-2 py-1 bg-white text-sm rounded rotate-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold shadow-lg">
                        Page Not Found
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Oops! Where did you go?
                    </h2>
                    <p className="text-gray-500 text-base sm:text-lg">
                        The page you are looking for might have been removed, had its name
                        changed, or is temporarily unavailable.
                    </p>
                </div>

                
            </motion.div>
        </div>
    );
};

export default NotFound;
