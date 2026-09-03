// Mock import.meta.env.VITE_API_URL
const mockEnv = {
  VITE_API_URL: "https://api.theplotone.com/api",
};

const getImageUrl = (path, env) => {
  if (!path) return "https://placehold.co/800x600?text=No+Image";

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("//")
  ) {
    return path;
  }

  const baseUrl = (env.VITE_API_URL || "").replace(/\/api$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
};

const testCases = [
  { path: null, expected: "https://placehold.co/800x600?text=No+Image" },
  {
    path: "http://example.com/img.jpg",
    expected: "http://example.com/img.jpg",
  },
  {
    path: "/uploads/image.jpg",
    expected: "https://api.theplotone.com/uploads/image.jpg",
  },
  {
    path: "uploads/image.jpg",
    expected: "https://api.theplotone.com/uploads/image.jpg",
  },
];

console.log("Running getImageUrl Verification...");
testCases.forEach((tc, i) => {
  const result = getImageUrl(tc.path, mockEnv);
  const passed = result === tc.expected;
  console.log(`Test ${i + 1}: ${passed ? "PASSED" : "FAILED"}`);
  if (!passed) {
    console.log(`  Path: ${tc.path}`);
    console.log(`  Expected: ${tc.expected}`);
    console.log(`  Result:   ${result}`);
  }
});
