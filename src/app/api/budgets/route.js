import { NextResponse } from 'next/server';
import connectToDatabase from '../../lib/mongodb.js';
import Budget from '../../../models/budget';

export async function GET() {
  try {
    await connectToDatabase();
    const budgets = await Budget.find({});
    return NextResponse.json({ budgets }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const { category, amount, month } = await request.json();
    if (!category || amount == null || !month) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    // Update if exists or create new:
    let budget = await Budget.findOne({ category, month });
    if (budget) {
      budget.amount = amount;
      await budget.save();
    } else {
      budget = new Budget({ category, amount, month });
      await budget.save();
    }
    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}