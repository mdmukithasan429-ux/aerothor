import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const VALID_ORDER_STATUSES = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'Paid - Ready for CJ Fulfill',
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
] as const;

function normalizeStatus(input: string): string {
  const upper = input.trim().toUpperCase();
  if (upper === 'PENDING') return 'Pending';
  if (upper === 'PROCESSING') return 'Processing';
  if (upper === 'SHIPPED') return 'Shipped';
  if (upper === 'DELIVERED') return 'Delivered';
  if (upper === 'CANCELLED' || upper === 'CANCELED') return 'Cancelled';
  if (upper.includes('PAID')) return 'Paid - Ready for CJ Fulfill';
  return input.trim();
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const rawStatus = String(body?.status || '').trim();

    if (!rawStatus) {
      return NextResponse.json(
        { error: 'Order status is required.' },
        { status: 400 }
      );
    }

    const isAllowed = VALID_ORDER_STATUSES.some(
      (s) => s.toUpperCase() === rawStatus.toUpperCase()
    );
    if (!isAllowed) {
      return NextResponse.json(
        { error: `Invalid status "${rawStatus}". Allowed: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED.` },
        { status: 400 }
      );
    }

    const normalizedStatus = normalizeStatus(rawStatus);

    // Update by id or orderNumber in Prisma PostgreSQL
    const existing = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: `Order "${id}" not found.` },
        { status: 404 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: existing.id },
      data: {
        status: normalizedStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Order ${updatedOrder.orderNumber} status updated to ${updatedOrder.status}.`,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('[PATCH /api/admin/orders/[id]/status Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order status.' },
      { status: 500 }
    );
  }
}
