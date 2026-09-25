const express = require('express');
const mariadb = require('mariadb');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors()); // ເປີດໃຫ້ທຸກໜ້າບ້ານສາມາດຍິງມາດຶງຂໍ້ມູນໄດ້ປອດໄພ
app.use(express.json()); // ເປີດໃຫ້ Server ອ່ານຂໍ້ມູນແບບ JSON ທີ່ໜ້າບ້ານສົ່ງມາໄດ້

// ຕັ້ງຄ່າການເຊື່ອມຕໍ່ MariaDB ໂດຍດຶງຄ່າຈາກໄຟລ໌ .env ຜ່ານ process.env
const pool = mariadb.createPool({
     host: process.env.DB_HOST,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_NAME,
     port: Number(process.env.DB_PORT) || 3306,
     connectionLimit: 5
});


// 🚀 ສ້າງ POST API ເສັ້ນທາງ /api/v1/wallet/pay
app.post('/api/v1/wallet/pay', async (req, res) => {
    // ຮັບຂໍ້ມູນທີ່ Mobile ຫຼື Frontend ສົ່ງມາ
    const { userId, amount, referenceId, description } = req.body;

    // ກວດສອບຂໍ້ມູນເບື້ອງຕົ້ນ
    if (!userId || !amount || !referenceId) {
        return res.status(400).json({ success: false, error: "ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ" });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 1. ລັອກແຖວຂໍ້ມູນ Wallet ປ້ອງກັນການກົດເບິລ
        const walletRows = await conn.query(
            'SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE',
            [userId]
        );

        if (walletRows.length === 0) {
            throw new Error('ບໍ່ພົບກະເປົາເງິນຂອງຜູ້ໃຊ້ນີ້');
        }

        const wallet = walletRows[0];
        const currentBalance = Number(wallet.balance);

        // 2. ເຊັກວ່າເງິນພໍບໍ່
        if (currentBalance < amount) {
            throw new Error('ຍອດ微ງິນໃນກະເປົາຂອງທ່ານບໍ່ພໍຈ່າຍ');
        }

        // 3. ອັບເດດຍອດເງິນໃໝ່
        const newBalance = currentBalance - amount;
        await conn.query('UPDATE wallets SET balance = ? WHERE id = ?', [newBalance, wallet.id]);

        // 4. ບັນທຶກປະຫວັດ (ຕິດ Unique reference_id)
        await conn.query(
            `INSERT INTO wallet_transactions 
            (wallet_id, amount, transaction_type, status, reference_id, description) 
            VALUES (?, ?, 'payment', 'success', ?, ?)`,
            [wallet.id, -amount, referenceId, description || '']
        );

        await conn.commit();
        
        // ສົ່ງຜົນລັບກັບໄປຫາ Mobile / Frontend ວ່າຈ່າຍສຳເລັດແລ້ວ
        return res.status(200).json({
            success: true,
            message: "ຈ່າຍເງິນສຳເລັດ",
            data: { balance: newBalance }
        });

    } catch (error) {
        if (conn) await conn.rollback();
        
        // ຫາກເກີດ Error ຈາກເລກບິນຊ້ຳ (no: 1062) ໃຫ້ຕອບກັບແບບສຸພາບ
        if (error.no === 1062) {
            return res.status(409).json({ success: false, error: "ເລກບິນນີ້ໄດ້ທຳການຈ່າຍເງິນໄປແລ້ວ ຫ້າມຈ່າຍຊ້ຳ" });
        }

        return res.status(500).json({ success: false, error: error.message });
    } finally {
        if (conn) conn.release();
    }
});
// 🚀 ສ້າງ GET API ເສັ້ນທາງ /api/v1/wallet/balance
// ເຮົາຈະຮັບຄ່າ userId ຜ່ານທາງ Query Parameter (ເຊັ່ນ: /api/v1/wallet/balance?userId=1)
app.get('/api/v1/wallet/balance', async (req, res) => {
    // ບັງຄັບໃຫ້ Header ຕອບກັບເປັນ JSON ສະເໝີ
    res.setHeader('Content-Type', 'application/json');
    
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ 
            success: false, 
            error: "ກະລຸນາລະບຸ userId ທີ່ຕ້ອງການກວດສອບຍອດເງິນ" 
        });
    }

    let conn;
    try {
        conn = await pool.getConnection();

        const walletRows = await conn.query(
            'SELECT balance, currency FROM wallets WHERE user_id = ?',
            [userId]
        );

        // 🌟 ຈຸດສຳຄັນ: ຫາກບໍ່ພົບຂໍ້ມູນໃນ MariaDB ໃຫ້ສົ່ງ JSON ບອກໜ້າບ້ານ (ບໍ່ປ່ອຍໃຫ້ວ່າງ)
        if (!walletRows || walletRows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: "ບໍ່ພົບຂໍ້ມູນກະເປົາເງິນສຳລັບຜູ້ໃຊ້ນີ້ໃນຖານຂໍ້ມູນ" 
            });
        }

        // ດຶງຂໍ້ມູນແຖວທຳອິດອອກມາ
        const wallet = walletRows[0]; 

        return res.status(200).json({
            success: true,
            message: "ດຶງຂໍ້ມູນຍອດເງິນສຳເລັດ",
            data: {
                userId: Number(userId),
                balance: Number(wallet.balance), 
                currency: wallet.currency
            }
        });

    } catch (error) {
        console.error(`❌ ເກີດຂໍ້ຜິດພາດ: ${error.message}`);
        return res.status(500).json({ 
            success: false, 
            error: `ເກີດຂໍ້ຜິດພາດພາຍໃນເຊີເວີ: ${error.message}` 
        });
    } finally {
        if (conn) conn.release();
    }
});

// ປ່ຽນບ່ອນ listen port ໃຫ້ດຶງຈາກ .env ນຳ
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Wallet API Server is running on http://localhost:${PORT}`);
});