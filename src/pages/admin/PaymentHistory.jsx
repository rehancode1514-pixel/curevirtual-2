import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import api from "../../Lib/api";
import { toast, ToastContainer } from "react-toastify";

const PaymentHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const userName = localStorage.getItem("userName");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get("/payments/transactions");
        if (res.data?.success) {
          setTransactions(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load transactions", err);
        toast.error("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(t => filter === "ALL" || t.status === filter);

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden">
      <Sidebar role="SUPERADMIN" />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar userName={userName} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                  Payment History
                </h1>
                
                <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md px-4 py-2 text-[var(--text-main)]"
                >
                    <option value="ALL">All Transactions</option>
                    <option value="SUCCESS">Successful</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                </select>
            </div>

            <div className="bg-[var(--bg-glass)] shadow-xl rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-card)]">
                  <h2 className="text-lg font-semibold text-[var(--text-main)]">Recent Transactions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#f8f9fa] dark:bg-[#1a1f36]">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipient / Provider</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-[var(--text-soft)]">
                          Loading transactions...
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-[var(--text-soft)]">
                          No transactions found.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[var(--bg-card)] transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-soft)]">
                            {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-[var(--text-main)]">
                              {tx.user?.firstName} {tx.user?.lastName}
                            </div>
                            <div className="text-xs text-[var(--text-soft)]">
                              {tx.user?.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-main)]">
                            {tx.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--text-main)]">
                            ${tx.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${tx.status === 'SUCCESS' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                              ${tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
                              ${tx.status === 'FAILED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
                            `}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default PaymentHistory;
