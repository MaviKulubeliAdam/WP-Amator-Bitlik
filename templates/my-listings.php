<div id="ativ-container" class="container my-listings-page">
  <script>pageType = 'my-listings';</script>
  <header class="header">
    <h1>Benim İlanlarım</h1>
    <p>Kendi yayınladığınız ilanların listesi</p>
  </header>

  <div class="controls" style="margin-bottom:20px;">
    <?php if (is_user_logged_in()): ?>
      <button id="addListingBtn" class="add-listing-btn">+ Yeni İlan</button>
    <?php endif; ?>
  </div>

  <div class="listings-wrapper">
    <div class="listings-container">
      <div id="myListingsGrid" class="listings-list">
        <!-- Debug: Toplam <?php echo count($my_listings); ?> ilan bulundu -->
        <?php if (empty($my_listings)): ?>
          <div class="no-results">Henüz ilanınız yok.</div>
        <?php else: ?>
          <?php foreach ($my_listings as $listing):
            $image_url = '';
            if (!empty($listing['images']) && is_array($listing['images'])) {
              $featured_index = intval($listing['featured_image_index'] ?? 0);
              $featured_img = $listing['images'][$featured_index] ?? $listing['images'][0] ?? null;
              if ($featured_img && !empty($featured_img['data'])) {
                $image_url = $featured_img['data'];
              } elseif ($featured_img && !empty($featured_img['name'])) {
                $image_url = ATIV_UPLOAD_URL . $listing['id'] . '/' . $featured_img['name'];
              }
            }
          ?>
          <div class="listing-row-wrapper">
            <div class="listing-row" data-listing-id="<?php echo esc_attr($listing['id']); ?>">
              <div class="listing-row-image">
                <?php if ($image_url): ?>
                  <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($listing['title']); ?>">
                <?php else: ?>
                  <div class="listing-row-image-fallback"><?php echo esc_html($listing['emoji'] ?? '📻'); ?></div>
                <?php endif; ?>
              </div>
              <div class="listing-row-info">
                <h3 class="listing-row-title" style="cursor: pointer;" onclick="toggleListingDetails(this)"><?php echo esc_html($listing['title']); ?></h3>
                <p class="listing-row-category"><?php echo esc_html(getCategoryName($listing['category'])); ?> • <?php echo esc_html($listing['condition']); ?></p>
                <p class="listing-row-details"><?php echo esc_html($listing['brand']); ?> <?php echo esc_html($listing['model']); ?> • <?php echo esc_html($listing['callsign']); ?></p>
                <p class="listing-row-date">Yayınlanma: <?php echo esc_html(date_i18n('d.m.Y H:i', strtotime($listing['created_at']))); ?></p>
              </div>
              <div class="listing-row-price">
                <div class="price-amount"><?php echo esc_html($listing['price']); ?> <?php echo esc_html($listing['currency'] ?? 'TRY'); ?></div>
              </div>
              <div class="listing-row-actions">
                <button class="action-btn edit-btn" onclick="event.stopPropagation(); window.editListing(<?php echo intval($listing['id']); ?>)" title="Düzenle">✏️ Düzenle</button>
                <button class="action-btn delete-btn" onclick="event.stopPropagation(); window.confirmDeleteListing(<?php echo intval($listing['id']); ?>)" title="Sil">🗑️ Sil</button>
              </div>
            </div>
            <div class="listing-row-details-expanded">
              <div class="listing-details-content">
                <div class="details-section">
                  <h4>Ürün Açıklaması</h4>
                  <p><?php echo nl2br(esc_html($listing['description'])); ?></p>
                </div>
                <div class="details-grid">
                <div class="detail-item">
                  <span class="detail-label">Kategori:</span>
                  <span class="detail-value"><?php echo esc_html(getCategoryName($listing['category'])); ?></span>
                </div>
                  <div class="detail-item">
                    <span class="detail-label">Durum:</span>
                    <span class="detail-value"><?php echo esc_html($listing['condition']); ?></span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Marka:</span>
                    <span class="detail-value"><?php echo esc_html($listing['brand']); ?></span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Model:</span>
                    <span class="detail-value"><?php echo esc_html($listing['model']); ?></span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Fiyat:</span>
                    <span class="detail-value"><?php echo esc_html($listing['price'] . ' ' . ($listing['currency'] ?? 'TRY')); ?></span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Konum:</span>
                    <span class="detail-value"><?php echo esc_html($listing['location']); ?></span>
                  </div>
                </div>
                <div class="details-section">
                  <h4>Satıcı Bilgileri</h4>
                  <div class="seller-info">
                    <p><strong><?php echo esc_html($listing['seller_name']); ?></strong></p>
                    <p>Çağrı İşareti: <?php echo esc_html($listing['callsign']); ?></p>
                    <p>E-posta: <?php echo esc_html($listing['seller_email']); ?></p>
                    <p>Telefon: <?php echo esc_html($listing['seller_phone']); ?></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <?php endforeach; ?>
        <?php endif; ?>
      </div>
    </div>
  </div>
    <?php include ATIV_PLUGIN_PATH . 'templates/partial-modal.php'; ?>
