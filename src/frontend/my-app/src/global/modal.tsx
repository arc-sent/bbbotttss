import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { bgClasses } from "./handle";


type ModalProps = {
    isOpen: boolean;
    children: React.ReactNode;
    type: string
};

export const Modal = ({ isOpen, type, children }: ModalProps) => {

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 flex items-center justify-center z-51 bg-black/40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className={`${bgClasses[type]} rounded-2xl p-[20px] shadow-xl`}
                        style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)' }}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};