import re

with open('frontend/src/App.tsx', 'r') as f:
    content = f.read()

# Replace the useEffect
content = re.sub(
    r'  // Start the sync engine when authenticated, stop on logout\n  useEffect\(\(\) => \{\n    if \(getAuthStatus\(\)\) \{\n      syncEngine\.start\(\);\n    \}\n    return \(\) => syncEngine\.stop\(\);\n  \}, \[\]\);',
    '''  // Start the sync engine when authenticated, stop on logout
  const location = useLocation();
  useEffect(() => {
    if (getAuthStatus()) {
      syncEngine.start();
    } else {
      syncEngine.stop();
    }
    // DO NOT return syncEngine.stop() on unmount because App doesn't unmount on route change
  }, [location.pathname]);''',
    content
)

with open('frontend/src/App.tsx', 'w') as f:
    f.write(content)
