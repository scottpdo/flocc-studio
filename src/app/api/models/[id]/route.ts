import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/lib/db/client';
// import { models } from '@/lib/db/schema';
// import { auth } from '@/lib/auth';
// import { eq } from 'drizzle-orm';

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/models/[id]
 * Get a single model
 */
export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params;

  // TODO: Implement actual database query
  // const model = await db.select().from(models).where(eq(models.id, id)).limit(1);
  // if (!model.length) {
  //   return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // }

  // Placeholder response
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

/**
 * PUT /api/models/[id]
 * Update a model
 */
export async function PUT(request: NextRequest, { params }: Props) {
  const { id } = await params;

  // TODO: Implement auth check
  // const session = await auth();
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const body = await request.json();

    // TODO: Check ownership and update
    // const existing = await db.select().from(models).where(eq(models.id, id)).limit(1);
    // if (!existing.length || existing[0].userId !== session.user.id) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }
    // await db.update(models).set({ ...body, updatedAt: new Date() }).where(eq(models.id, id));

    return NextResponse.json({ id, ...body, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Failed to update model:', error);
    return NextResponse.json({ error: 'Failed to update model' }, { status: 500 });
  }
}

/**
 * DELETE /api/models/[id]
 * Delete a model
 */
export async function DELETE(request: NextRequest, { params }: Props) {
  const { id } = await params;

  // TODO: Implement auth check and deletion
  // const session = await auth();
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
  // await db.delete(models).where(eq(models.id, id));

  return NextResponse.json({ success: true });
}
