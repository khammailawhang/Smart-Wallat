'use client';

import { useEffect, useState, useCallback } from 'react';
import { Wallet, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

export default function WalletDashboard() {
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('LAK');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);

  // State ສຳລັບຟອມໂອນເງິນ
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formError, setFormError] = useState('');

  const userId = 1; // ຈຳລອງວ່າເຮົາຄື User ID: 1

  // 🚀 1. ຟັງຊັນດຶງຂໍ້ມູນ (ບັງຄັບວິ່ງໄປຫາ Port 5000 ຂອງ Backend ເທົ່ານັ້ນ)
  const fetchWalletData = useCallback(async () => {
    try {
      setError(null);
      const [balanceRes, historyRes] = await Promise.all([
        fetch(`http://localhost:5000/api/v1/wallet/balance?userId=${userId}`, { method: 'GET', cache: 'no-store' }),
        fetch(`http://localhost:5000/api/v1/wallet/history?userId=${userId}`, { method: 'GET', cache: 'no-store' })
      ]);
      
      const balanceResult = await balanceRes.json();
      const historyResult = await historyRes.json();

      if (!balanceRes.ok) throw new Error(balanceResult.error || 'ດຶງຍອດເງິນຫຼົ້ມ');
      if (!historyRes.ok) throw new Error(historyResult.error || 'ດຶງປະຫວັດຫຼົ້ມ');

      if (balanceResult.success) {
        setBalance(balanceResult.data.balance);
        setCurrency(balanceResult.data.currency);
      }
      if (historyResult.success) {
        setTransactions(historyResult.data);
      }
    } catch (err) {
      console.error("Fetch Error Details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  // 💸 2. ຟັງຊັນເວລາກົດປຸ່ມໂອນເງິນ (POST ໄປ Port 5000)
  const handleTransfer = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    
    if (!recipientId || !amount) {
      setFormError('ກະລຸນາປ້ອນ ID ຜູ້ຮັບ ແລະ ຈຳນວນເງິນ');
      return;
    }
    if (Number(amount) <= 0) {
      setFormError('ຈຳນວນເງິນຕ້ອງຫຼາຍກວ່າ 0 ກີບ');
      return;
    }
    if (Number(amount) > balance) {
      setFormError('ຍອດເງິນໃນກະເປົາຂອງທ່ານບໍ່ພໍໂອນ');
      return;
    }

    setSubmitting(true);
    const randomRef = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
      const response = await fetch('http://localhost:5000/api/v1/wallet/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          amount: Number(amount),
          referenceId: randomRef,
          description: description || `ໂອນໃຫ້ User ID: ${recipientId}`
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ການໂອນເງິນຫຼົ້ມ');

      if (result.success) {
        setSuccessMessage(`✅ ໂອນເງິນສຳເລັດ!`);
        setAmount('');
        setRecipientId('');
        setDescription('');
        fetchWalletData(); // 🔄 ດຶງຂໍ້ມູນໃໝ່ທັນທີ
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchWalletData();
  };

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" /><p className="text-gray-500 text-sm font-black">ກຳລັງໂຫຼດຂໍ້ມູນ Wallet...</p></div>;
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center text-black"><div className="text-red-500 mb-4"><AlertCircle size={48} /></div><h1 className="text-lg font-black text-red-600 mb-2">ບໍ່ສາມາດເຊື່ອມຕໍ່ Backend ໄດ້</h1><p className="text-gray-500 text-xs mb-4 font-mono">{error}</p><button onClick={fetchWalletData} className="bg-orange-500 text-white text-sm font-black px-6 py-2.5 rounded-full">ລອງໃໝ່ອີຄັ້ງ</button></div>;
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 max-w-md mx-auto shadow-2xl min-w-[360px] text-black space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">💳 My Smart Wallet</h1>
          <p className="text-[11px] text-gray-500 font-bold mt-0.5">ລະບົບກະເປົາເງິນດິຈິຕອນ ບົນ MariaDB</p>
        </div>
        <button onClick={handleRefresh} disabled={isRefreshing} className="p-2.5 rounded-xl bg-white shadow-sm border border-gray-200 active:scale-95 transition text-gray-700 disabled:opacity-50">
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-orange-500' : ''} />
        </button>
      </div>

      {/* Credit Card UI */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="flex justify-between items-start mb-8">
          <div className="bg-white/20 p-2.5 rounded-2xl"><Wallet size={24} /></div>
          <span className="text-xs font-black bg-black/20 px-3 py-1 rounded-full uppercase tracking-wider">Secured</span>
        </div>
        <p className="text-xs text-orange-100 font-medium mb-1">ຍອດເງິນຄົງເຫຼືອທັງໝົດ</p>
        <div className="flex items-baseline gap-2">
          <h2 className="text-3xl font-black tracking-tight">{balance.toLocaleString()}</h2>
          <span className="text-sm font-black opacity-90">{currency}</span>
        </div>
        <div className="mt-6 pt-4 border-t border-white/20 flex justify-between text-[11px] opacity-80 font-medium">
          <p>User ID: #000{userId}</p>
          <p>MariaDB Engine Active</p>
        </div>
      </div>

      {/* ຟອມໂອນເງິນ */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm">
        <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-1.5">
          <ArrowUpRight size={18} className="text-orange-500" /> ຟອມໂອນເງິນດ່ວນ
        </h3>
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black text-gray-700 mb-1">ID ຜູ້ຮັບ</label>
              <input type="number" placeholder="ID" value={recipientId} onChange={(e) => setRecipientId(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-black outline-none focus:border-orange-500 focus:bg-white" />
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-700 mb-1">ຈຳນວນເງິນ</label>
              <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-bold text-black outline-none focus:border-orange-500 focus:bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-700 mb-1">ໝາຍເຫດ</label>
            <input type="text" placeholder="ຄຳອະທິບາຍ..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-black outline-none focus:border-orange-500 focus:bg-white" />
          </div>
          {formError && <p className="rounded-xl bg-red-50 p-2.5 text-[11px] font-bold text-red-600">{formError}</p>}
          {successMessage && <p className="rounded-xl bg-green-50 p-2.5 text-[11px] font-bold text-green-700">{successMessage}</p>}
          <button type="submit" disabled={submitting} className="w-full bg-orange-500 text-white font-black text-xs py-3 rounded-xl shadow-md active:scale-95 transition disabled:opacity-50">{submitting ? 'ກຳລັງໂອນ...' : 'ຢືນຢັນການໂອນເງິນ'}</button>
        </form>
      </div>

      {/* ປະຫວັດການທຸລະກຳຍ້ອນຫຼັງ */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm">
        <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-1.5">
          <Clock size={18} className="text-orange-500" /> ປະຫວັດການທຸລະກຳ
        </h3>
        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
          {transactions.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-6">ບໍ່ມີປະຫວັດການທຸລະກຳ</p>
          ) : (
            transactions.map((txn) => {
              const isDeposit = txn.transaction_type === 'deposit';
              const amt = Number(txn.amount);
              return (
                <div key={txn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 transition hover:bg-gray-100/50">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isDeposit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {isDeposit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-800">{txn.description || txn.transaction_type}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">Ref: {txn.reference_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-black ${isDeposit ? 'text-green-600' : 'text-red-600'}`}>
                      {isDeposit ? '+' : ''}{amt.toLocaleString()}
                    </p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{new Date(txn.created_at).toLocaleDateString('lo-LA')}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
