import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
// import { db } from '@/lib/db/client';
// import { models } from '@/lib/db/schema';
// import { auth } from '@/lib/auth';

/**
 * GET /api/models
 * List models with optional filters
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get('page') ?? '1');
  const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);
  const userId = searchParams.get('userId');
  const featured = searchParams.get('featured') === 'true';
  const search = searchParams.get('search');

  // TODO: Implement actual database query
  // const results = await db.select().from(models).where(...).limit(limit).offset((page - 1) * limit);

  return NextResponse.json({
    models: [],
    total: 0,
    page,
    limit,
  });
}

/**
 * POST /api/models
 * Create a new model
 */
export async function POST(request: NextRequest) {
  // TODO: Implement auth check
  // const session = await auth();
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const body = await request.json();
    
    const id = nanoid();
    const model = {
      id,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // TODO: Save to database
    // await db.insert(models).values({
    //   id,
    //   userId: session.user.id,
    //   name: body.name,
    //   definition: model,
    //   ...
    // });

    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    console.error('Failed to create model:', error);
    return NextResponse.json({ error: 'Failed to create model' }, { status: 500 });
  }
}
