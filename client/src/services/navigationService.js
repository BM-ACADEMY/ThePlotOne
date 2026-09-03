/**
 * A simple singleton to hold the navigate function from react-router.
 * This allows non-component files (like api.js or AuthContext logic) 
 * to perform navigation without full page reloads.
 */

let navigateFunction = null;

export const setGlobalNavigate = (nav) => {
  navigateFunction = nav;
};

export const navigate = (path, options = {}) => {
  if (navigateFunction) {
    navigateFunction(path, options);
  } else {
    // Fallback if called before initialization (rare)
    window.location.href = path;
  }
};

export default {
  navigate,
  setGlobalNavigate,
};
