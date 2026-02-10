export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    console.log('=== AUTH DEBUG START ===');
    console.log('Email:', email);
    console.log('Password provided:', password ? 'YES' : 'NO');

    // Step 1: Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        step: 'USER_NOT_FOUND',
        message: 'User does not exist in database'
      });
    }

    console.log('User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password?.length
    });

    // Step 2: Check if password field exists
    if (!user.password) {
      return NextResponse.json({
        success: false,
        step: 'NO_PASSWORD',
        message: 'User has no password set',
        user: {
          id: user.id,
          email: user.email,
          hasPassword: false
        }
      });
    }

    // Step 3: Test bcrypt comparison
    console.log('Testing bcrypt.compare...');
    const isCorrectPassword = await bcrypt.compare(password, user.password);
    console.log('Password match:', isCorrectPassword);

    // Step 4: Test with known hash
    const testHash = await bcrypt.hash(password, 10);
    console.log('Generated test hash:', testHash);
    const testMatch = await bcrypt.compare(password, testHash);
    console.log('Test hash match:', testMatch);

    return NextResponse.json({
      success: true,
      step: 'COMPLETE',
      results: {
        userExists: true,
        hasPassword: true,
        passwordLength: user.password.length,
        passwordMatch: isCorrectPassword,
        testHashWorks: testMatch,
        storedHash: user.password.substring(0, 20) + '...',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });

  } catch (error: any) {
    console.error('Auth debug error:', error);
    return NextResponse.json({
      success: false,
      step: 'ERROR',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
