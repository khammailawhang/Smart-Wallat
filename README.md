# 💳 Secure Smart Wallet App (Full-Stack)

ລະບົບກະເປົາເງິນດິຈິຕອນ (Digital Wallet Dashboard) ທີ່ພັດທະນາຂຶ້ນມາໂດຍເນັ້ນໃສ່ **ຄວາມປອດໄພຂອງຂໍ້ມູນການເງິນ (Financial Security)** ແລະ **ຄວາມຖືກຕ້ອງ 100% ຂອງທຸລະກຳ** ບົນລະບົບຖານຂໍ້ມູນ MariaDB.

## 🚀 ຄຸນສົມບັດຫຼັກຂອງລະບົບ (Features)
- **Real-time Balance Inquiry:** ດຶງຂໍ້ມູນຍອດເງິນຄົງເຫຼືອສົດໆ ຈາກຖານຂໍ້ມູນໂດຍກົງ ພ້ອມລະບົບປ້ອງກັນ Cache ຫຼົ້ມ.
- **Secure Database Transactions (ACID):** ລະບົບໂອນເງິນທີ່ໃຊ້ `BEGIN TRANSACTION`, `COMMIT`, ແລະ `ROLLBACK` ຮັບປະກັນວ່າເງິນບໍ່ມີທາງຫາຍ.
- **Concurrency Control (Pessimistic Locking):** ໃຊ້ຄຳສັ່ງ `FOR UPDATE` ຢູ່ລະດັບ SQL ເພື່ອບັອກການກົດ(Race Conditions) ແລະ ປ້ອງກັນການຕັດເງິນຊໍ້າຊ້ອນ.
- **Idempotency API Pattern:** ດັກຈັບ `UNIQUE reference_id` ໃນຕາຕະລາງປະຫວັດ ເພື່ອປ້ອງກັນການຍິງ Request ໂອນເງິນຊໍ້າຈາກປັນຫາເນັດຫຼຸດ.
- **BigInt JSON Serialization:** ແກ້ໄຂປັນຫາ Node.js Serialization ບົນຂໍ້ມູນປະເພດ BIGINT ລະດັບ Enterprise.
- **Cross-Origin Resource Sharing (CORS):** ປົດລັອກ API ໃຫ້ໜ້າບ້ານ ແລະ ຫຼັງບ້ານ ເຊື່ອມຕໍ່ກັນຢ່າງປອດໄພ.

## 🛠️ ເຕັກໂນໂລຊີທີ່ໃຊ້ (Tech Stack)
- **Backend:** Node.js, Express.js, MariaDB (Official Connector)
- **Frontend:** React (Next.js App Router), Tailwind CSS, Lucide Icons
- **DevOps/Tools:** Git, GitHub, PowerShell/CMD, HeidiSQL

## 🛢️ ໂຄງສ້າງຖານຂໍ້ມູນ (Database Schema)
ລະບົບປະກອບດ້ວຍ 3 ຕາຕະລາງຫຼັກທີ່ເຊື່ອມໂຍງກັນ:
1. `users`: ເກັບຂໍ້ມູນຜູ້ໃຊ້ ແລະ Verification
2. `walltets` (MariaDB): ເກັບຍອດເງິນຄົງເຫຼືອ (`balance`) ແລະ ສະກຸນເງິນ
3. `wallet_transactions`: ເກັບປະຫວັດການຝາກ-ໂອນ ພ້ອມ `reference_id` (Unique)
