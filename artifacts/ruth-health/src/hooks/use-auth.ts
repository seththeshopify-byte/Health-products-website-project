import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

export function useAuth() {
  const { data: user, isLoading } = useGetMe({ 
    query: { 
      queryKey: getGetMeQueryKey(), 
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    } 
  });
  
  return {
    user,
    isLoading,
    isLoggedIn: !!user,
    isAdmin: user?.role === "admin",
    isMember: user?.role === "member" || user?.role === "admin",
  };
}
