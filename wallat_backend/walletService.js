const mariadb = require('mariadb');
require('dotenv').config();

// ຕັ້ງຄ່າການເຊື່ອມຕໍ່ MariaDB ໂດຍດຶງຄ່າຈາກໄຟລ໌ .env ຜ່ານ process.env
const pool = mariadb.createPool({
     host: process.env.DB_HOST,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_NAME,
     port: Number(process.env.DB_PORT) || 3306,
     connectionLimit: 5
});

/**
 * ຟັງຊັນການຫັກເງິນ/ຈ່າຍເງິນຈາກ Wallet ແບບປອດໄພ
 * @param {number} userId - ID ຂອງຜູ້ໃຊ້
 * @param {number} amount - ຈຳນວນເງິນທີ່ຕ້ອງການຫັກ (ຕ້ອງເປັນຕົວເລກບວກ ເຊັ່ນ: 50000)
 * @param {string} referenceId - ເລກອ້າງອິງບິນ (Idempotency Key) ປ້ອງກັນການຈ່າຍຊໍ້າ
 * @param {string} description - ຄຳອະທິບາຍເພີ່ມເຕີມ
 */
async function processPayment(userId, amount, referenceId, description) {
    let conn;
    try {
        // ດຶງ Connection ອອກມາຈາກ Pool
        conn = await pool.getConnection();

        // 🚀 [ຂັ້ນຕອນສຳຄັນ 1]: ເລີ່ມຕົ້ນເຮັດ Database Transaction
        await conn.beginTransaction();

        // 🚀 [ຂັ້ນຕອນສຳຄັນ 2]: ດຶງຍອດເງິນ ແລະ ລັອກແຖວຂໍ້ມູນ (Pessimistic Lock)
        // ໃຊ້ "FOR UPDATE" ເພື່ອບລັອກບໍ່ໃຫ້ API ອື່ນມາແອບແກ້ໄຂເງິນຂອງ User ຄົນນີ້ພ້ອມກັນ
        const walletRows = await conn.query(
            'SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE',
            [userId]
        );

        // ກວດສອບວ່າມີ Wallet ນີ້ແທ້ບໍ່
        if (walletRows.length === 0) {
            throw new Error('ບໍ່ພົບກະເປົາເງິນຂອງຜູ້ໃຊ້ນີ້');
        }

        const wallet = walletRows[0];
        const currentBalance = Number(wallet.balance);

        // 🚀 [ຂັ້ນຕອນສຳຄັນ 3]: ກວດສອບວ່າຍອດເງິນພໍຈ່າຍບໍ່
        if (currentBalance < amount) {
            throw new Error('ຍອດເງິນໃນກະເປົາຂອງທ່ານບໍ່ພໍຈ່າຍ');
        }

        // ຄິດໄລ່ຍອດເງິນໃໝ່
        const newBalance = currentBalance - amount;

        // 🚀 [ຂັ້ນຕອນສຳຄັນ 4]: ອັບເດດຍອດເງິນໃໝ່ລົງໃນຕາຕະລາງ wallets
        await conn.query(
            'UPDATE wallets SET balance = ? WHERE id = ?',
            [newBalance, wallet.id]
        );

        // 🚀 [ຂັ້ນຕອນສຳຄັນ 5]: ບັນທຶກປະຫວັດການຫັກເງິນ (ເກັບເປັນຄ່າຕິດລົບ -amount)
        // ຫ້ອງ reference_id ເປັນ UNIQUE ຖ້າຍິງເລກບິນຊໍ້າມາ MariaDB ຈະຟ້ອງ Error ທັນທີ
        await conn.query(
            `INSERT INTO wallet_transactions 
            (wallet_id, amount, transaction_type, status, reference_id, description) 
            VALUES (?, ?, 'payment', 'success', ?, ?)`,
            [wallet.id, -amount, referenceId, description]
        );

        // 🚀 [ຂັ້ນຕອນສຳຄັນ 6]: ບັນທຶກທຸກຢ່າງລົງຖານຂໍ້ມູນພ້ອມກັນ ຫາກບໍ່ມີຫຍັງຜິດພາດ
        await conn.commit();
        
        console.log(`✅ ຈ່າຍເງິນສຳເລັດ! ຍອດເງິນຄົງເຫຼືອ: ${newBalance}`);
        return { success: true, balance: newBalance };

    } catch (error) {
        // ❌ [ຂັ້ນຕອນກູ້ໄພ]: ຫາກຂັ້ນຕອນໃດໜຶ່ງຫຼົ້ມ ຫຼື ຂໍ້ມູນບໍ່ຖືກຕ້ອງ
        // ສັ່ງ ROLLBACK ທັນທີ! ເພື່ອຍົກເລີກທຸກຢ່າງ ເງິນຈະບໍ່ຖືກຫັກ ແລະ ປະຫວັດຈະບໍ່ຖືກບັນທຶກ
        if (conn) {
            await conn.rollback();
        }
        console.error(`❌ Transaction ຫຼົ້ມ: ${error.message}`);
        return { success: false, error: error.message };
    } finally {
        // ຄືນ Connection ກັບເຂົ້າ Pool ເພື່ອໃຫ້ API ໂຕອື່ນເອົາໄປໃຊ້ຕໍ່
        if (conn) conn.release();
    }
}

// === ຕົວຢ່າງການເອົາໄປ调用ໃຊ້ງານ ===
// ລອງຈຳລອງການກົດຊື້ເຄື່ອງ 50,000 ກີບ ຈາກ User ID: 1
const billNo = "BILL-20260925-001"; // ເລກບິນອ້າງອິງ
processPayment(1, 50000.00, billNo, "ຊື້ເຝີ 1 ຖ້ວຍ ແລະ ນ້ຳດື່ມ");
