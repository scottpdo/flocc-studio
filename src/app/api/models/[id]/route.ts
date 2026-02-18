import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { models } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, or } from 'drizzle-orm';
import type { StudioModel } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/models/[id]
 * Get a single model
 */
export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params;

  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Query model - must be public OR owned by current user
    const conditions = [eq(models.id, id)];
    if (currentUserId) {
      conditions.push(or(eq(models.isPublic, true), eq(models.userId, currentUserId))!);
    } else {
      conditions.push(eq(models.isPublic, true));
    }

    const result = await db
      .select()
      .from(models)
      .where(and(...conditions))
      .limit(1);

    if (!result.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const row = result[0];
    const model: StudioModel = {
      ...row.definition,
      id: row.id,
      userId: row.userId ?? undefined,
      isPublic: row.isPublic ?? false,
      isFeatured: row.isFeatured ?? false,
    };

    return NextResponse.json(model);
  } catch (error) {
    console.error('Failed to get model:', error);
    return NextResponse.json({ error: 'Failed to get model' }, { status: 500 });
  }
}

/**
 * PUT /api/models/[id]
 * Update a model
 */
export async function PUT(request: NextRequest, { params }: Props) {
  const { id } = await params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const existing = await db
      .select()
      .from(models)
      .where(eq(models.id, id))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (existing[0].userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: Partial<StudioModel> = await request.json();
    const now = new Date();

    // Update the model
    await db
      .update(models)
      .set({
        name: body.name ?? existing[0].name,
        description: body.description,
        definition: {
          ...existing[0].definition,
          ...body,
          id,
          userId: session.user.id,
          updatedAt: now.toISOString(),
        },
        isPublic: body.isPublic ?? existing[0].isPublic,
        version: (existing[0].version ?? 1) + 1,
        updatedAt: now,
      })
      .where(eq(models.id, id));

    // Return updated model
    const updatedModel: StudioModel = {
      ...existing[0].definition,
      ...body,
      id,
      userId: session.user.id,
      updatedAt: now.toISOString(),
      version: (existing[0].version ?? 1) + 1,
    };

    return NextResponse.json(updatedModel);
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

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const existing = await db
      .select()
      .from(models)
      .where(eq(models.id, id))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (existing[0].userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete
    await db.delete(models).where(eq(models.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete model:', error);
    return NextResponse.json({ error: 'Failed to delete model' }, { status: 500 });
  }
}
