import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Silently handle missing credentials - app can work offline for local features like AI Mind Map

// DISABLED: Custom fetch interceptor causing issues with admin panel proxy
// The mobile app will now connect directly to Supabase which works better
const customFetch = undefined;

// Old proxy code (disabled) - kept for reference:
// const customFetch = Platform.OS === 'web' 
//   ? async (url, options = {}) => {
//       // Check if this is a Supabase auth request
//       const urlString = typeof url === 'string' ? url : url.toString();
//       const isAuthRequest = urlString && urlString.includes('/auth/v1/');
//       
//       if (isAuthRequest) {
//         // Route through our API proxy to avoid CORS issues
//         const { MOBILE_API_URL } = require('../config/api');
//         const proxyUrl = `${MOBILE_API_URL}/auth/supabase`;
//         
//         console.log('[Supabase] Intercepting auth request:', urlString);
//         
//         try {
//           // Parse the request body
//           let body = {};
//           if (options.body) {
//             if (typeof options.body === 'string') {
//               try {
//                 body = JSON.parse(options.body);
//               } catch (e) {
//                 console.warn('[Supabase] Could not parse body as JSON:', options.body);
//               }
//             } else {
//               body = options.body;
//             }
//           }
//           
//           // Determine action from URL path
//           const urlObj = new URL(urlString);
//           const path = urlObj.pathname;
//           
//           let action = 'signIn';
//           if (path.includes('/token') && body.grant_type === 'password') {
//             action = 'signIn';
//           } else if (path.includes('/signup')) {
//             action = 'signUp';
//           } else if (path.includes('/logout') || path.includes('/signout')) {
//             action = 'signOut';
//           }
//           
//           console.log('[Supabase] Proxy action:', action);
//           
//           // Forward the request to our proxy
//           const response = await fetch(proxyUrl, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//               action,
//               email: body.email,
//               password: body.password,
//               name: body.data?.name || body.data?.full_name,
//             }),
//           });
//           
//           const data = await response.json();
//           
//           console.log('[Supabase] Proxy response:', { success: data.success, hasUser: !!data.user });
//           
//           // Return a response that matches Supabase's expected format
//           if (!response.ok || !data.success) {
//             const errorResponse = {
//               error: {
//                 message: data.error || 'Authentication failed',
//                 status: response.status,
//               },
//             };
//             return new Response(JSON.stringify(errorResponse), {
//               status: response.status || 400,
//               headers: { 'Content-Type': 'application/json' },
//             });
//           }
//           
//           // For sign in/sign up, return the session data in Supabase format
//           if (action === 'signIn' || action === 'signUp') {
//             const successResponse = {
//               user: data.user,
//               session: data.session,
//             };
//             return new Response(JSON.stringify(successResponse), {
//               status: 200,
//               headers: { 'Content-Type': 'application/json' },
//             });
//           }
//           
//           // For sign out, return empty success
//           return new Response(JSON.stringify({}), {
//             status: 200,
//             headers: { 'Content-Type': 'application/json' },
//           });
//         } catch (error) {
//           console.error('[Supabase] Proxy request failed:', error);
//           // Return an error response instead of falling back
//           return new Response(JSON.stringify({
//             error: {
//               message: error.message || 'Proxy request failed',
//               status: 500,
//             },
//           }), {
//             status: 500,
//             headers: { 'Content-Type': 'application/json' },
//           });
//         }
//       }
//       
//       // For non-auth requests, use normal fetch
//       return fetch(url, {
//         ...options,
//         headers: {
//           ...options.headers,
//           'Content-Type': 'application/json',
//         },
//         mode: 'cors',
//         credentials: 'include',
//       });
//     }
//   : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce', // Use PKCE flow for better security and CORS handling
  },
  global: {
    fetch: customFetch,
  },
});

console.log('Supabase client initialized');
console.log('Platform:', Platform.OS);

