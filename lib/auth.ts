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
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.id = profile.sub || '';
        token.email = profile.email || '';
        // Check if user is admin via Azure AD groups
        // This can be customized based on your Azure AD setup
        token.isAdmin = await checkIfUserIsAdmin((profile.email as string) || '');
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || '';
        session.user.email = (token.email as string) || '';
        session.user.isAdmin = (token.isAdmin as boolean) || false;
      }
      return session;
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
  // Option 1: Check against a list of admin emails (case-insensitive)
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase());
  
  if (adminEmails.includes(email.toLowerCase())) {
    return true;
  }

  // Option 2: Check Azure AD group membership (would require Microsoft Graph API call)
  // This is a placeholder - implement based on your needs
  
  return false;
}
