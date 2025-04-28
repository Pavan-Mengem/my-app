'use client'

import { useState, useEffect } from "react";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend 
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A'];

export default function Home() {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ amount: "", date: "", description: "", category: "Food" });
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  // New state for monthly category budgets (default budgets for each category)
  const [budgets, setBudgets] = useState({ Food: 300, Travel: 200, Shopping: 150, Bills: 400, Others: 100 });

  // Predefined categories list
  const categories = ["Food", "Travel", "Shopping", "Bills", "Others"];
  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      setTransactions(data.transactions);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || !form.date || !form.description || !form.category) {
      setError("All fields are required");
      return;
    }
    setError("");
    try {
      if (editingId) {
        const res = await fetch("/api/transactions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...form })
        });
        if (res.ok) {
          const resData = await res.json();
          setTransactions(transactions.map(t => t._id === editingId ? resData.transaction : t));
          setEditingId(null);
          setForm({ amount: "", date: "", description: "", category: "" });
        } else {
          const errData = await res.json();
          setError(errData.error);
        }
      } else {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        if (res.ok) {
          const resData = await res.json();
          setTransactions([...transactions, resData.transaction]);
          setForm({ amount: "", date: "", description: "", category: "" });
        } else {
          const errData = await res.json();
          setError(errData.error);
        }
      }
    } catch (err) {
      setError("Error adding/updating transaction");
    }
  }

  async function deleteTransaction(id) {
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setTransactions(transactions.filter(t => t._id !== id));
      } else {
        const errData = await res.json();
        setError(errData.error);
      }
    } catch (err) {
      setError("Error deleting transaction");
    }
  }

  function startEditing(transaction) {
    setEditingId(transaction._id);
    setForm({
      amount: transaction.amount,
      date: new Date(transaction.date).toISOString().split("T")[0],
      description: transaction.description,
      category: transaction.category || "Food"
    });
  }

  // Dashboard computations
  const totalExpenses = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  // Group transactions by category for category breakdown
  const categoryData = transactions.reduce((acc, cur) => {
    const cat = cur.category || "Others";
    acc[cat] = (acc[cat] || 0) + parseFloat(cur.amount);
    return acc;
  }, {});
  const pieData = Object.keys(categoryData).map(key => ({
    name: key,
    value: categoryData[key]
  }));

  // Most recent transactions (sorted descending by date)
  const recentTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);

  // Monthly data for Bar Chart (remains unchanged)
  const monthlyData = transactions.reduce((acc, cur) => {
    const dateObj = new Date(cur.date);
    const monthKey = dateObj.toLocaleString("default", { month: "short", year: "numeric" });
    acc[monthKey] = (acc[monthKey] || 0) + parseFloat(cur.amount);
    return acc;
  }, {});
  const barChartData = Object.keys(monthlyData).map(key => ({
    month: key,
    total: monthlyData[key]
  }));

  // New: Prepare Budget vs Actual data (by category)
  const budgetComparisonData = categories.map(cat => ({
    category: cat,
    budget: budgets[cat] || 0,
    actual: categoryData[cat] || 0
  }));

  // New: Simple spending insights
  const highestCategory = Object.keys(categoryData).reduce((a, b) => categoryData[a] > categoryData[b] ? a : b, "N/A");
  const averageSpend = transactions.length > 0 ? (totalExpenses / transactions.length).toFixed(2) : 0;

  // Handler to update budgets state
  function handleBudgetChange(e, cat) {
    setBudgets({ ...budgets, [cat]: parseFloat(e.target.value) || 0 });
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-100 to-purple-100">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Transaction Tracker</h1>
        
        {/* Dashboard Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700">Total Expenses</h2>
            <p className="text-3xl font-bold text-gray-800">${totalExpenses.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700">Category Breakdown</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No data</p>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700">Recent Transactions</h2>
            {recentTransactions.length > 0 ? (
              <ul className="mt-2">
                {recentTransactions.map((t) => (
                  <li key={t._id} className="border-b py-1">
                    <p className="text-gray-800">{t.description} - ${parseFloat(t.amount).toFixed(2)}</p>
                    <small className="text-gray-500">{new Date(t.date).toLocaleDateString()}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No recent transactions</p>
            )}
          </div>
        </div>

        {/* New: Monthly Category Budget Settings */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Set Monthly Category Budgets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat}>
                <label className="block font-medium text-gray-600">{cat}</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={budgets[cat]} 
                  onChange={(e) => handleBudgetChange(e, cat)}
                  className="w-full bg-white border border-gray-300 rounded-md p-2 mt-1 focus:ring focus:ring-blue-300"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            {editingId ? "Edit Transaction" : "Add Transaction"}
          </h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600">Amount</label>
            <input 
              type="number" 
              step="0.01"
              value={form.amount} 
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="block w-full bg-white text-black border border-gray-300 rounded-md p-2 mt-1 focus:ring focus:ring-blue-300"
              placeholder="e.g. 50.00"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600">Date</label>
            <input 
              type="date" 
              value={form.date} 
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="block w-full bg-white text-black border border-gray-300 rounded-md p-2 mt-1 focus:ring focus:ring-blue-300"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600">Description</label>
            <input 
              type="text" 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="block w-full bg-white text-black border border-gray-300 rounded-md p-2 mt-1 focus:ring focus:ring-blue-300"
              placeholder="Transaction details"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="block w-full bg-white text-black border border-gray-300 rounded-md p-2 mt-1 focus:ring focus:ring-blue-300"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <button 
            type="submit" 
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {editingId ? "Update Transaction" : "Add Transaction"}
          </button>
          {editingId && (
            <button 
              type="button"
              onClick={() => { setEditingId(null); setForm({ amount: "", date: "", description: "", category: "Food" }); }}
              className="w-full mt-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel Edit
            </button>
          )}
        </form>

        {/* Monthly Expenses Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Monthly Expenses</h2>
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dfe3ee" />
                <XAxis dataKey="month" tick={{ fill: "#555" }}/>
                <YAxis tick={{ fill: "#555" }}/>
                <Tooltip contentStyle={{ backgroundColor: "#f7fafc", borderRadius: "4px" }}/>
                <Bar dataKey="total" fill="#3182ce" barSize={50}/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">No data to display.</p>
          )}
        </div>

        {/* New: Budget vs Actual Comparison Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Budget vs Actual Comparison</h2>
          {budgetComparisonData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dfe3ee" />
                <XAxis dataKey="category" tick={{ fill: "#555" }}/>
                <YAxis tick={{ fill: "#555" }}/>
                <Tooltip contentStyle={{ backgroundColor: "#f7fafc", borderRadius: "4px" }}/>
                <Bar dataKey="budget" fill="#4CAF50" barSize={30} name="Budget" />
                <Bar dataKey="actual" fill="#F44336" barSize={30} name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">No budget data</p>
          )}
        </div>

        {/* New: Simple Spending Insights */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Spending Insights</h2>
          <ul className="list-disc ml-6 text-gray-800">
            <li>Total Expenses: ${totalExpenses.toFixed(2)}</li>
            <li>Average Transaction: ${averageSpend}</li>
            <li>Highest Spending Category: {highestCategory}</li>
          </ul>
        </div>

        {/* Transaction List */}
        <div className="bg-white p-6 rounded-lg shadow-lg mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Transactions</h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500">No transactions found.</p>
          ) : (
            <ul>
              {transactions.map((t) => (
                <li key={t._id} className="border-b py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{t.description}</p>
                    <small className="text-gray-500">{new Date(t.date).toLocaleDateString()}</small>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => startEditing(t)}
                      className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteTransaction(t._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}