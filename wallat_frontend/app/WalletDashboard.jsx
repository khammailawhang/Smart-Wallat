'use client';

import { useEffect, useState, useCallback } from 'react';
import { Wallet, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function WalletDashboard() {
  // 1. ສ້າງ State ສຳລັບເກັບຂໍ້ມູນ ແລະ ສະຖານະຂອງ UI
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('LAK');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ຈຳລອງວ່າ User ທີ່ລັອກອິນເຂົ້າມາແມ່ນ User ID: 1
  const userId = 1; 

  // 🚀 2. ຟັງຊັນການວິ່ງໄປດຶງຂໍ້ມູນ (Fetch) ຈາກ Backend API ທີ່ເຮົາຂຽນໄວ້
  const fetchWalletBalance = useCallback(async () => {
    try {
      setError(null);
      // ຍິງໄປທີ່ Port 5000 ທີ່ Backend ຂອງເຮົາລັນຖິ້ມໄວ້
      const response = await fetch(`http://localhost:5000/api/v1/wallet/balance?userId=${userId}`);
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນ');
      }

      if (result.success) {
        // ຢອດຂໍ້ມູນຍອດເງິນ ແລະ ສະກຸນເງິນລົງໃນ State ເພື່ອໃຫ້ UI ປ່ຽນແປງ
        setBalance(result.data.balance);
        setCurrency(result.data.currency);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  // 3. ສັ່ງໃຫ້ດຶງຂໍ້ມູນອັດຕະໂນມັດທັນທີເມື່ອເປີດໜ້າຈໍນີ້ຂຶ້ນມາ
  useEffect(() => {
    fetchWalletBalance();
  }, [fetchWalletBalance]);

  // 4. ຟັງຊັນຕອນກົດປຸ່ມ Refresh (ດຶງຂໍ້ມູນໃໝ່ດ້ວຍມື)
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchWalletBalance();
  };

  // 5. ຈັດການໜ້າຕາ UI ຕອນກຳລັງໂຫຼດຂໍ້ມູນ (Loading State)
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-black">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm font-black">ກຳລັງດຶງຂໍ້ມູນກະເປົາເງິນປອດໄພ...</p>
      </div>
    );
  }

  // 6. ຈັດການໜ້າຕາ UI ຕອນເກີດ Error (Error State)
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center text-black">
        <div className="text-red-500 mb-4"><AlertCircle size={48} /></div>
        <h1 className="text-lg font-black text-red-600 mb-2">ເກີດຂໍ້ຜິດພາດຂອງລະບົບ Wallet</h1>
        <p className="text-gray-500 text-xs mb-4 font-mono">{error}</p>
        <button onClick={fetchWalletBalance} className="bg-orange-500 text-white text-sm font-black px-6 py-2.5 rounded-full shadow-md active:scale-95 transition">
          ລອງໃໝ່ອີກຄັ້ງ
        </button>
      </div>
    );
  }

  // 7. ໜ้าຕາ Dashboard ຕົວຈິງ (Main UI Render)
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 max-w-md mx-auto shadow-2xl min-w-[360px] text-black">
      
      {/* ແຖບດ້ານເທິງ (Header) */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            💳 My Smart Wallet
          </h1>
          <p className="text-[11px] text-gray-500 font-bold mt-0.5">ລະບົບກະເປົາເງິນດິຈິຕອນ ປອດໄພ 100%</p>
        </div>
        
        {/* ປຸ່ມກົດກວດສອບຍອດເງິນໃໝ່ */}
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl bg-white shadow-sm border border-gray-200 active:scale-95 transition text-gray-700 disabled:opacity-50"
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-orange-500' : ''} />
        </button>
      </div>

      {/* ບັດເຄຣດິດຈຳລອງ (Wallet Card UI) */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden mb-6">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        
        <div className="flex justify-between items-start mb-8">
          <div className="bg-white/20 p-2.5 rounded-2xl"><Wallet size={24} /></div>
          <span className="text-xs font-black bg-black/20 px-3 py-1 rounded-full uppercase tracking-wider">
            Active
          </span>
        </div>

        <p className="text-xs text-orange-100 font-medium mb-1">ຍອດເງິນຄົງເຫຼືອທັງໝົດ</p>
        <div className="flex items-baseline gap-2">
          {/* ສະແດງຕົວເລກເງິນທີ່ດຶງມາຈາກ Backend */}
          <h2 className="text-3xl font-black tracking-tight">
            {balance.toLocaleString()}
          </h2>
          <span className="text-sm font-black opacity-90">{currency}</span>
        </div>

        <div className="mt-6 pt-4 border-t border-white/20 flex justify-between text-[11px] opacity-80 font-medium">
          <p>User ID: #000{userId}</p>
          <p>MariaDB Secure Secured</p>
        </div>
      </div>

      {/* ປຸ່ມດຳເນີນການດ່ວນ (Quick Actions UI) */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button className="flex items-center justify-center gap-2 bg-white border border-gray-200 p-4 rounded-2xl font-black text-xs text-gray-800 shadow-sm active:scale-95 transition">
          <div className="bg-green-100 p-1.5 rounded-lg text-green-600"><ArrowDownLeft size={16} /></div>
          ຝາກເງິນເຂົ້າ
        </button>
        <button className="flex items-center justify-center gap-2 bg-white border border-gray-200 p-4 rounded-2xl font-black text-xs text-gray-800 shadow-sm active:scale-95 transition">
          <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><ArrowUpRight size={16} /></div>
          ໂອນເງິນອອກ
        </button>
      </div>

    </div>
  );
}
