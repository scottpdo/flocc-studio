import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db/client';
import { models } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, desc, or, and, ilike, sql } from 'drizzle-orm';
import type { StudioModel } from '@/types';

/**
 * GET /api/models
 * List models with optional filters
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(Math.max(1, Number(searchParams.get('limit') ?? '20')), 100);
  const userId = searchParams.get('userId');
  const featured = searchParams.get('featured') === 'true';
  const search = searchParams.get('search');

  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Build conditions
    const conditions = [];

    // Public models OR user's own models
    if (currentUserId) {
      conditions.push(or(eq(models.isPublic, true), eq(models.userId, currentUserId)));
    } else {
      conditions.push(eq(models.isPublic, true));
    }

    // Filter by specific user
    if (userId) {
      conditions.push(eq(models.userId, userId));
    }

    // Filter by featured
    if (featured) {
      conditions.push(eq(models.isFeatured, true));
    }

    // Search by name
    if (search) {
      conditions.push(ilike(models.name, `%${search}%`));
    }

    // Query
    const offset = (page - 1) * limit;
    const results = await db
      .select()
      .from(models)
      .where(and(...conditions))
      .orderBy(desc(models.updatedAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(models)
      .where(and(...conditions));
    const total = Number(countResult[0]?.count ?? 0);

    // Map to StudioModel format
    const modelList = results.map((row) => ({
      ...row.definition,
      id: row.id,
      userId: row.userId,
      isPublic: row.isPublic ?? false,
      isFeatured: row.isFeatured ?? false,
    }));

    return NextResponse.json({
      models: modelList,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to list models:', error);
    return NextResponse.json({ error: 'Failed to list models' }, { status: 500 });
  }
}

/**
 * POST /api/models
 * Create a new model
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: StudioModel = await request.json();
    
    const id = nanoid();
    const now = new Date();

    // Create the model record
    await db.insert(models).values({
      id,
      userId: session.user.id,
      name: body.name,
      description: body.description,
      definition: {
        ...body,
        id,
        userId: session.user.id,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      isPublic: body.isPublic ?? false,
      isFeatured: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Return the created model
    const createdModel: StudioModel = {
      ...body,
      id,
      userId: session.user.id,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      version: 1,
    };

    return NextResponse.json(createdModel, { status: 201 });
  } catch (error) {
    console.error('Failed to create model:', error);
    return NextResponse.json({ error: 'Failed to create model' }, { status: 500 });
  }
}
