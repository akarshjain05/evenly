import re

with open('frontend/src/context/AuthContext.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { useQueryClient } from '@tanstack/react-query';", "import { useQueryClient } from '@tanstack/react-query';\nimport { db } from '../db/db';")

old_logout = """  const logout = async () => {
    try {
      await apiClient.post('auth/logout');
      // Only clear client state if the server successfully revokes the HttpOnly session cookie
      setAuthStatus(false);
      setIsAuthenticated(false);
      queryClient.clear();
    } catch (e) {"""

new_logout = """  const logout = async () => {
    try {
      await apiClient.post('auth/logout');
      // Only clear client state if the server successfully revokes the HttpOnly session cookie
      setAuthStatus(false);
      setIsAuthenticated(false);
      queryClient.clear();
      
      // Wipe the offline database for security and to prevent data mixing between accounts
      try { await db.delete(); await db.open(); } catch (e) { console.error("Failed to clear local db", e); }
    } catch (e) {"""

content = content.replace(old_logout, new_logout)

with open('frontend/src/context/AuthContext.tsx', 'w') as f:
    f.write(content)
