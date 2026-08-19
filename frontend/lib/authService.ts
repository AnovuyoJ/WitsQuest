import { supabase } from "./supabaseClient";

export async function signUp(email: string, password: string, fullName: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

// Fires off Google OAuth
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // Sends the student right back to the app homepage once Google verifies them
      redirectTo: `${window.location.origin}`,
    },
  });
  return { data, error };
}

// Fires off GitHub OAuth
export async function signInWithGithub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}`,
    },
  });
  return { data, error };
}

// Sends a link to the user's email so they can reset a lost password
export async function sendPasswordReset(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    // Page where the user picks a brand-new password after clicking their email link
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
}

//updates password in the database for the user who is currently logged in. This function should only be called after the user has successfully logged in and has a valid session. It uses the supabase.auth.updateUser method to update the user's password in the database.

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
}




