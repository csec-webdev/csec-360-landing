import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
        },
      },
    }),
  ],
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  debug: true,
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log('[Auth] signIn callback - User:', user?.email);
        console.log('[Auth] signIn callback - Account:', account?.provider);
        console.log('[Auth] signIn callback - Profile:', profile?.email);
        return true;
      } catch (error) {
        console.error('[Auth] signIn callback error:', error);
        return false;
      }
    },
    async jwt({ token, account, profile }) {
      try {
        if (account && profile) {
          console.log('[Auth] JWT callback - Profile:', JSON.stringify(profile, null, 2));
          token.id = profile.sub || '';
          token.email = profile.email || '';
          // Check if user is admin via Azure AD groups
          // This can be customized based on your Azure AD setup
          token.isAdmin = await checkIfUserIsAdmin((profile.email as string) || '');
          console.log('[Auth] JWT callback - Token created for:', token.email, 'isAdmin:', token.isAdmin);
        }
      } catch (error) {
        console.error('[Auth] JWT callback error:', error);
        // Return token even if admin check fails
        if (account && profile) {
          token.id = profile.sub || '';
          token.email = profile.email || '';
          token.isAdmin = false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = (token.id as string) || '';
          session.user.email = (token.email as string) || '';
          session.user.isAdmin = (token.isAdmin as boolean) || false;
          console.log('[Auth] Session created for:', session.user.email);
        }
      } catch (error) {
        console.error('[Auth] Session callback error:', error);
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('[Auth] Redirect callback - url:', url, 'baseUrl:', baseUrl);
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to check if user is admin
// You can customize this based on your Azure AD group membership or other criteria
async function checkIfUserIsAdmin(email: string): Promise<boolean> {
  try {
    if (!email) {
      console.log('[Auth] checkIfUserIsAdmin - No email provided');
      return false;
    }

    // Option 1: Check against a list of admin emails (case-insensitive)
    const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
    console.log('[Auth] checkIfUserIsAdmin - Checking email:', email, 'against ADMIN_EMAILS');
    
    if (!adminEmailsEnv) {
      console.log('[Auth] checkIfUserIsAdmin - No ADMIN_EMAILS configured');
      return false;
    }

    const adminEmails = adminEmailsEnv
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);
    
    const isAdmin = adminEmails.includes(email.toLowerCase());
    console.log('[Auth] checkIfUserIsAdmin - Result:', isAdmin);
    
    return isAdmin;

    // Option 2: Check Azure AD group membership (would require Microsoft Graph API call)
    // This is a placeholder - implement based on your needs
  } catch (error) {
    console.error('[Auth] checkIfUserIsAdmin error:', error);
    return false;
  }
}
