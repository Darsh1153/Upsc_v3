import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Handle CORS for all API routes
    const origin = request.headers.get('origin');
    const allowedOrigins = [
        'http://localhost:8081',
        'http://localhost:3000',
        'http://127.0.0.1:8081',
        'http://127.0.0.1:3000',
        'https://upsc-app-admin.vercel.app',
        'https://my-app-three-alpha-63.vercel.app',
        'https://admin-panel-umber-eight-34.vercel.app',
    ];

    // Check if origin is allowed or request has no origin (mobile native apps often don't send origin)
    const isAllowedOrigin = !origin || allowedOrigins.includes(origin);
    // For mobile apps without origin, use wildcard '*'
    const corsOrigin = origin ? (isAllowedOrigin ? origin : '*') : '*';

    // Handle preflight requests immediately
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': corsOrigin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    // Create response
    const response = NextResponse.next();

    // Delete any existing CORS headers to prevent duplicates
    response.headers.delete('Access-Control-Allow-Origin');
    response.headers.delete('Access-Control-Allow-Methods');
    response.headers.delete('Access-Control-Allow-Headers');
    response.headers.delete('Access-Control-Allow-Credentials');

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', corsOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400');

    return response;
}

export const config = {
    matcher: '/api/:path*',
};

