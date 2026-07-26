UPDATE `giveaways`
SET
	`title` = 'Deniz Ünlü 1.000 EP Çekilişi',
	`description` = 'YouTube kanalına abone olan ve WhatsApp kanalına katılan 50 kişi arasından kazanan otomatik çark ile belirlenir. Katılım şartları Deniz Ünlü tarafından manuel olarak kontrol edilir.',
	`prize` = '1.000 EP',
	`status` = 'active',
	`target_entries` = 50,
	`starts_at` = NULL,
	`ends_at` = NULL,
	`updated_at` = CURRENT_TIMESTAMP
WHERE
	`title` = 'Deniz Ünlü Topluluk Çekilişi'
	AND `prize` = 'Ödül bilgisi yakında'
	AND `status` = 'draft'
	AND NOT EXISTS (
		SELECT 1
		FROM `giveaway_entries`
		WHERE `giveaway_entries`.`giveaway_id` = `giveaways`.`id`
	);
