export const pageTitles: Record<string, string> = {
  "/": "WitsQuest",
  "/Login": "Sign in",
  "/signup": "Sign up",
  "/map": "Map",
  "/reset-password": "Reset Password",
  "/profile": "Profile",
  "/account/delete": "Delete Account",
  "/dashboard": "Dashboard",
  "/dashboard/cards": "Cards",
  "/dashboard/events": "Events",
  "/dashboard/games": "Battles",
  "/dashboard/leaderboard": "Leaderboard",
  "/dashboard/map": "Map",
  "/dashboard/notifications": "Notifications",
  "/dashboard/trails": "Trails",
  "/dashboard/triviaquestions": "Trivia Questions",
  "/dashboard/settings": "Settings",
  "/dashboard/settings/rulebook": "Rulebook",
  "/dashboard/admin": "Admin",
  "/dashboard/admin/campaigns": "Admin · Campaigns",
  "/dashboard/admin/cards": "Admin · Cards",
  "/dashboard/admin/challenges": "Admin · Challenges",
  "/dashboard/admin/events": "Admin · Events",
  "/dashboard/admin/stats": "Admin · Stats",
  "/dashboard/admin/trails": "Admin · Trails",
};

export function resolvePageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/dashboard/games/")) return "Match";
  return "WitsQuest";
}