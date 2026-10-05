CREATE TABLE `daily_invoice_sequences` (
    `date` CHAR(8) NOT NULL,
    `value` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
