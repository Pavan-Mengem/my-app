import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import connectToDatabase from '../../lib/mongodb';

export async function GET(request) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database connection failed");
    }
    const transactions = await db.collection("transactions").find({}).toArray();
    return NextResponse.json({ transactions }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database connection failed");
    }
    const { amount, date, description,category } = await request.json();
    if (!amount || !date || !description || !category) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const newTransaction = {
      amount: parseFloat(amount),
      date: new Date(date),
      description,
      category,
    };
    const result = await db.collection("transactions").insertOne(newTransaction);
    return NextResponse.json(
      { transaction: { ...newTransaction, _id: result.insertedId } },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database connection failed");
    }
    const { id, amount, date, description,category } = await request.json();
    if (!id || !amount || !date || !description || !category) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const updatedTransaction = {
      amount: parseFloat(amount),
      date: new Date(date),
      description,
      category,
    };
    const result = await db.collection("transactions").updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedTransaction }
    );
    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Transaction not found or unchanged" }, { status: 400 });
    }
    return NextResponse.json(
      { transaction: { ...updatedTransaction, _id: id } },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database connection failed");
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const result = await db.collection("transactions").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 400 });
    }
    return NextResponse.json({ message: "Transaction deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}