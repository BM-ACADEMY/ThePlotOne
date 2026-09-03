import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname, search } = useLocation();

    useEffect(() => {
        // Scroll window
        window.scrollTo(0, 0);

        // Scroll custom layouts if they exist
        const mainContent = document.getElementById("main-content");
        if (mainContent) {
            mainContent.scrollTo(0, 0);
        }

        const adminContent = document.getElementById("admin-content");
        if (adminContent) {
            adminContent.scrollTo(0, 0);
        }
        // Send pageview to Google Analytics if available
        if (typeof window.gtag === 'function') {
            window.gtag('config', 'G-W39NTXN03D', {
                page_path: pathname + search,
            });
        }
    }, [pathname, search]);

    return null;
};

export default ScrollToTop;
