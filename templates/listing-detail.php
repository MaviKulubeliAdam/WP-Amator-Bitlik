<?php
/**
 * İlan Detay Sayfası - Modern Tasarım
 * URL: /ilan/{id}/
 */

if (!defined('ABSPATH')) {
    exit;
}

global $wpdb, $wp_query;

$listing_id = intval($wp_query->query_vars['listing_detail'] ?? $_GET['listing_detail'] ?? 0);
if (!$listing_id) {
    wp_die('İlan bulunamadı', 404);
}
$wp_query->is_404 = false;

$listings_table = $wpdb->prefix . 'amator_ilanlar';
$users_table    = $wpdb->prefix . 'amator_bitlik_kullanıcılar';

$listing = $wpdb->get_row($wpdb->prepare(
    "SELECT l.*, u.callsign, u.name, u.email, u.location, u.is_banned 
     FROM `{$listings_table}` l
     LEFT JOIN `{$users_table}` u ON l.user_id = u.user_id
     WHERE l.id = %d",
    $listing_id
));

if (!$listing) {
    wp_die('İlan bulunamadı (ID: ' . $listing_id . ')', 404);
}

if (!empty($listing->is_banned) && $listing->is_banned == 1) {
    get_header();
    ?>
    <div style="max-width: 600px; margin: 60px auto; padding: 0 20px; text-align: center;">
        <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
            <h1 style="color: #856404; font-size: 28px; margin: 0 0 15px 0;">İlan Askıya Alındı</h1>
            <p style="color: #856404; font-size: 16px; line-height: 1.6; margin: 0;">
                Bu ilanın sahibi platformda yasaklandığı için bu ilan artık görüntülenemez.
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 20px; margin-bottom: 0;">
                Başka ilanları görmek için <a href="<?php echo esc_url(home_url('/')); ?>" style="color: #667eea; text-decoration: none; font-weight: 600;">ana sayfaya dönebilirsiniz</a>.
            </p>
        </div>
    </div>
    <?php
    get_footer();
    exit;
}

get_header();

$exchange_rates = get_option('ativ_exchange_rates');
if (!$exchange_rates) {
    $exchange_rates = array('USD' => 1, 'EUR' => 1.1, 'GBP' => 1.27);
}

$category_map = [
    'transceiver'   => 'Telsiz',
    'antenna'       => 'Antena',
    'microphone'    => 'Mikrofon',
    'power-supply'  => 'Güç Kaynağı',
    'cable'         => 'Kablo'
];
$category = isset($category_map[$listing->category]) ? $category_map[$listing->category] : $listing->category;

$try_price = $listing->price;
if ($listing->currency != 'TRY' && isset($exchange_rates[$listing->currency])) {
    $try_price = $listing->price * $exchange_rates[$listing->currency];
}
?>

<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f5f7fa; }

    .listing-modern-container { max-width: 1200px; margin: 20px auto; padding: 0 15px; }
    .listing-modern-layout { display: grid; grid-template-columns: 1fr 380px; gap: 30px; margin-bottom: 40px; }

    .listing-gallery-section { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .listing-detail-images { display: flex; flex-direction: column; gap: 12px; }
    .listing-detail-main-image { width: 100%; height: 500px; object-fit: contain; background: #f8f9fa; cursor: zoom-in; transition: transform 0.3s; }
    .listing-detail-main-image.image-clickable:hover { transform: scale(1.01); }
    .listing-detail-thumbnails { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; padding: 12px; background: #fafbfc; border-top: 1px solid #e5e7eb; }
    .listing-detail-thumbnail { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: all 0.3s; }
    .listing-detail-thumbnail:hover, .listing-detail-thumbnail.active { border-color: #667eea; transform: scale(1.05); }
    .gallery-nav-btn { background: rgba(0,0,0,0.5) !important; color: #fff !important; border: none !important; width: 44px !important; height: 44px !important; border-radius: 50% !important; cursor: pointer !important; font-size: 20px !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: all 0.3s; padding: 0 !important; line-height: 1 !important; }
    .gallery-nav-btn:hover { background: rgba(0,0,0,0.8) !important; transform: scale(1.1); }

    .listing-sidebar { display: flex; flex-direction: column; gap: 20px; }
    .price-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .price-label { color: #9ca3af; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .price-value { font-size: 42px; font-weight: 700; color: #667eea; line-height: 1; margin-bottom: 8px; }
    .price-currency { font-size: 18px; color: #6b7280; }
    .price-try { font-size: 13px; color: #9ca3af; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; }

    .seller-card { background: #fff; border-radius: 16px; padding: 24px; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .seller-avatar { width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 700; margin: 0 auto 16px; }
    .seller-name { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 6px; }
    .seller-callsign { color: #667eea; font-weight: 600; font-size: 13px; margin-bottom: 16px; }
    .seller-location { color: #6b7280; font-size: 13px; margin-bottom: 16px; }
    .seller-contact { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
    .contact-item { text-align: left; padding: 10px; background: #f9fafb; border-radius: 8px; font-size: 12px; }
    .contact-label { color: #6b7280; font-weight: 600; margin-bottom: 4px; }
    .contact-link { color: #667eea; text-decoration: none; word-break: break-all; font-weight: 500; }
    .contact-link:hover { text-decoration: underline; }
    .contact-buttons { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
    .btn { padding: 12px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.3s; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-primary { background: #667eea; color: #fff; }
    .btn-primary:hover { background: #5568d3; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }
    .btn-whatsapp { background: #25D366; color: #fff; }
    .btn-whatsapp:hover { background: #1ea853; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37,211,102,0.4); }
    .btn-share { background: #8b5cf6; color: #fff; }
    .btn-share:hover { background: #7c3aed; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(139,92,246,0.4); }

    .share-modal { display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); animation: fadeIn 0.3s; }
    .share-modal.active { display: flex; align-items: center; justify-content: center; }
    .share-modal-content { background: #fff; border-radius: 16px; padding: 32px; max-width: 500px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
    .share-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .share-modal-title { font-size: 24px; font-weight: 700; color: #111827; }
    .share-modal-close { background: none; border: none; font-size: 32px; color: #9ca3af; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: color 0.3s; }
    .share-modal-close:hover { color: #111827; }
    .share-buttons { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
    .share-btn { padding: 16px; border-radius: 12px; border: none; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.3s; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; color: #fff; }
    .share-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .share-btn-whatsapp { background: #25D366; }
    .share-btn-telegram { background: #0088cc; }
    .share-btn-messenger { background: #0084ff; }
    .share-btn-copy { background: #6b7280; grid-column: span 2; }
    .share-url-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; font-size: 13px; color: #6b7280; word-break: break-all; margin-top: 16px; }

    .listing-main-content { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); margin-bottom: 40px; }
    .listing-title { font-size: 32px; font-weight: 700; color: #111827; margin-bottom: 12px; line-height: 1.2; }
    .listing-meta { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
    .meta-item { display: flex; align-items: center; gap: 8px; font-size: 14px; }
    .meta-label { color: #6b7280; }
    .meta-value { color: #111827; font-weight: 600; }
    .badge { display: inline-block; padding: 6px 12px; background: #f0f4ff; color: #667eea; border-radius: 6px; font-size: 13px; font-weight: 600; }

    .listing-specs { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .spec-item { padding: 16px; background: #f9fafb; border-radius: 12px; border-left: 4px solid #667eea; }
    .spec-label { color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; }
    .spec-value { color: #111827; font-size: 16px; font-weight: 700; }

    .listing-description-section { margin-top: 32px; padding-top: 32px; border-top: 1px solid #e5e7eb; }
    .section-title { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 16px; }
    .description-text { color: #4b5563; line-height: 1.8; font-size: 15px; white-space: pre-wrap; word-break: break-word; }

    .listing-lightbox { display: none; position: fixed; z-index: 9999; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.95); animation: fadeIn 0.3s; }
    .listing-lightbox.active { display: flex; align-items: center; justify-content: center; }
    .listing-lightbox-content { max-width: 95%; max-height: 95vh; position: relative; display: flex; flex-direction: column; align-items: center; }
    .listing-lightbox-image { max-width: 100%; max-height: 85vh; object-fit: contain; border-radius: 8px; }
    .listing-lightbox-close { position: absolute; top: 20px; right: 40px; color: #fff !important; font-size: 40px; cursor: pointer !important; background: rgba(0,0,0,0.5) !important; border: none !important; width: 50px !important; height: 50px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: all 0.3s; z-index: 10001; padding: 0 !important; line-height: 1 !important; text-align: center !important; min-width: 50px; min-height: 50px; }
    .listing-lightbox-close:hover { background: rgba(0,0,0,0.8) !important; transform: scale(1.1); }
    .listing-lightbox-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: #fff; border: none; padding: 15px 20px; font-size: 24px; cursor: pointer; border-radius: 4px; transition: all 0.3s; z-index: 10000; }
    .listing-lightbox-nav:hover { background: rgba(0,0,0,0.8); }
    .listing-lightbox-prev { left: 20px; }
    .listing-lightbox-next { right: 20px; }
    .listing-lightbox-counter { color: #fff; margin-top: 15px; font-size: 14px; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    @media (max-width: 768px) {
        .listing-modern-layout { grid-template-columns: 1fr; }
        .listing-detail-main-image { height: 300px; }
        .listing-title { font-size: 24px; }
        .price-value { font-size: 32px; }
        .listing-meta { gap: 12px; }
        .listing-specs { grid-template-columns: 1fr; }
        .listing-main-content { padding: 20px; }
    }
</style>

<div class="listing-modern-container">
    <div class="listing-modern-layout">
        <div>
            <div class="listing-gallery-section">
                <div class="listing-detail-images">
                    <?php
                    $image_files = !empty($listing->images) ? json_decode($listing->images, true) : array();
                    $has_video   = !empty($listing->video);
                    $has_images  = !empty($image_files) && is_array($image_files);

                    $gallery_items = array();
                    if ($has_images) {
                        foreach ($image_files as $image_file) {
                            $gallery_items[] = array('type' => 'image', 'url' => ATIV_UPLOAD_URL . $listing->id . '/' . $image_file);
                        }
                    }
                    if ($has_video) {
                        $gallery_items[] = array('type' => 'video', 'url' => $listing->video);
                    }

                    if (!empty($gallery_items)) {
                        $featured_idx  = intval($listing->featured_image_index ?? 0);
                        if ($featured_idx >= count($gallery_items)) { $featured_idx = 0; }
                        $featured_item = $gallery_items[$featured_idx];

                        echo '<div style="position: relative; display: inline-block; width: 100%;">';
                        if ($featured_item['type'] === 'image') {
                            echo '<img src="' . esc_url($featured_item['url']) . '" class="listing-detail-main-image image-clickable" id="mainGallery" alt="' . esc_attr($listing->title) . '" style="display:block;">';
                        } else {
                            echo '<video id="mainGallery" class="listing-detail-main-image" controls style="display:block; background:#000;">';
                            echo '<source src="' . esc_url($featured_item['url']) . '" type="video/mp4">Tarayıcınız video desteği sunmuyor.';
                            echo '</video>';
                        }
                        if (count($gallery_items) > 1) {
                            echo '<button class="gallery-nav-btn gallery-prev" onclick="previousGalleryItem()" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); z-index:10;">❮</button>';
                            echo '<button class="gallery-nav-btn gallery-next" onclick="nextGalleryItem()" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); z-index:10;">❯</button>';
                        }
                        echo '</div>';

                        if (count($gallery_items) > 1) {
                            echo '<div class="listing-detail-thumbnails">';
                            foreach ($gallery_items as $index => $item) {
                                $active = ($index === $featured_idx) ? 'active' : '';
                                if ($item['type'] === 'image') {
                                    echo '<img src="' . esc_url($item['url']) . '" class="listing-detail-thumbnail ' . $active . '" onclick="changeGalleryItem(' . $index . ')" alt="Görsel ' . ($index + 1) . '">';
                                } else {
                                    echo '<div class="listing-detail-thumbnail ' . $active . '" data-video-url="' . esc_attr($item['url']) . '" onclick="changeGalleryItem(' . $index . ')" style="cursor:pointer; background:#1a1a1a; display:flex; align-items:center; justify-content:center; font-size:30px; border-radius:8px; border:2px solid transparent; height:80px; width:80px; transition:all 0.3s;">▶️</div>';
                                }
                            }
                            echo '</div>';
                        }
                    } else {
                        echo '<div style="width:100%; height:500px; background:#f0f0f0; border-radius:16px; display:flex; align-items:center; justify-content:center; color:#999; font-size:18px;">Görsel veya video yok</div>';
                    }
                    ?>
                </div>
            </div>

            <div class="listing-main-content">
                <h1 class="listing-title"><?php echo esc_html($listing->title); ?></h1>
                <div class="listing-meta">
                    <div class="meta-item"><span class="badge"><?php echo esc_html($category); ?></span></div>
                    <div class="meta-item"><span class="meta-label">Oluşturulma:</span><span class="meta-value"><?php echo date_i18n('j F Y', strtotime($listing->created_at)); ?></span></div>
                    <?php if (!empty($listing->condition)) : ?>
                        <div class="meta-item"><span class="meta-label">Durum:</span><span class="meta-value"><?php echo esc_html($listing->condition); ?></span></div>
                    <?php endif; ?>
                </div>

                <div class="listing-specs">
                    <?php if (!empty($listing->brand)) : ?>
                        <div class="spec-item"><div class="spec-label">Marka</div><div class="spec-value"><?php echo esc_html($listing->brand); ?></div></div>
                    <?php endif; ?>
                    <?php if (!empty($listing->model)) : ?>
                        <div class="spec-item"><div class="spec-label">Model</div><div class="spec-value"><?php echo esc_html($listing->model); ?></div></div>
                    <?php endif; ?>
                    <?php if (!empty($listing->location)) : ?>
                        <div class="spec-item"><div class="spec-label">📍 Konum</div><div class="spec-value"><?php echo esc_html($listing->location); ?></div></div>
                    <?php endif; ?>
                </div>

                <?php if (!empty($listing->description)) : ?>
                    <div class="listing-description-section">
                        <h2 class="section-title">📝 Açıklama</h2>
                        <div class="description-text"><?php echo esc_html($listing->description); ?></div>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <div class="listing-sidebar">
            <div class="price-card">
                <div class="price-label">Fiyat</div>
                <div class="price-value"><?php echo number_format($listing->price, 0, ',', '.'); ?></div>
                <div class="price-currency"><?php echo esc_html($listing->currency); ?></div>
                <?php if ($listing->currency !== 'TRY') : ?>
                    <div class="price-try">≈ <?php echo number_format($try_price, 2, ',', '.'); ?> TRY</div>
                <?php endif; ?>
            </div>

            <div class="seller-card">
                <div class="seller-avatar"><?php echo strtoupper(substr($listing->callsign, 0, 2)); ?></div>
                <div class="seller-name"><?php echo esc_html($listing->name); ?></div>
                <div class="seller-callsign">📻 <?php echo esc_html($listing->callsign); ?></div>
                <?php if (!empty($listing->location)) : ?><div class="seller-location">📍 <?php echo esc_html($listing->location); ?></div><?php endif; ?>

                <div class="seller-contact">
                    <?php if (!empty($listing->email)) : ?>
                        <div class="contact-item"><div class="contact-label">📧 E-posta</div><a href="mailto:<?php echo esc_attr($listing->email); ?>" class="contact-link"><?php echo esc_html($listing->email); ?></a></div>
                    <?php endif; ?>
                    <?php if (!empty($listing->seller_phone)) : ?>
                        <div class="contact-item"><div class="contact-label">📱 Telefon</div><a href="tel:<?php echo esc_attr($listing->seller_phone); ?>" class="contact-link"><?php echo esc_html($listing->seller_phone); ?></a></div>
                    <?php endif; ?>
                </div>

                <div class="contact-buttons">
                    <a href="mailto:<?php echo esc_attr($listing->email); ?>" class="btn btn-primary">✉️ E-posta Gönder</a>
                    <?php if (!empty($listing->seller_phone)) :
                        $whatsapp_phone = preg_replace('/\D/', '', $listing->seller_phone);
                        if (strpos($whatsapp_phone, '0') === 0) { $whatsapp_phone = '90' . substr($whatsapp_phone, 1); }
                        if (strpos($whatsapp_phone, '90') !== 0) { $whatsapp_phone = '90' . $whatsapp_phone; }
                        $whatsapp_url = 'https://wa.me/' . $whatsapp_phone . '?text=' . urlencode('Merhaba! ' . $listing->title . ' ilanınız hakkında bilgi almak istiyorum.');
                    ?>
                    <a href="<?php echo esc_url($whatsapp_url); ?>" class="btn btn-whatsapp" target="_blank">💬 WhatsApp</a>
                    <?php endif; ?>
                    <button class="btn btn-share" onclick="openShareModal()">🔗 İlanı Paylaş</button>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="listingLightbox" class="listing-lightbox">
    <div class="listing-lightbox-content">
        <button class="listing-lightbox-close" onclick="closeLightbox()">&times;</button>
        <img id="lightboxImage" class="listing-lightbox-image" src="" alt="">
        <button class="listing-lightbox-nav listing-lightbox-prev" onclick="lightboxPrevious()">❮</button>
        <button class="listing-lightbox-nav listing-lightbox-next" onclick="lightboxNext()">❯</button>
        <div class="listing-lightbox-counter"><span id="lightboxCounter">1</span> / <span id="lightboxTotal">1</span></div>
    </div>
</div>

<script>
    let currentGalleryIndex = 0;
    let galleryItems = [];
    let lightboxImages = [];
    let lightboxCurrentIndex = 0;

    document.addEventListener('DOMContentLoaded', function() {
        const thumbnails = document.querySelectorAll('.listing-detail-thumbnail');
        const mainGallery = document.getElementById('mainGallery');

        if (mainGallery) {
            if (mainGallery.tagName === 'IMG') {
                galleryItems.push({ type: 'image', src: mainGallery.src });
            } else if (mainGallery.tagName === 'VIDEO') {
                galleryItems.push({ type: 'video', src: mainGallery.querySelector('source')?.src || '' });
            }
            thumbnails.forEach((thumb, index) => {
                if (galleryItems.length > 0 && index === 0) return;
                if (thumb.tagName === 'IMG') {
                    galleryItems.push({ type: 'image', src: thumb.src });
                } else if (thumb.dataset.videoUrl) {
                    galleryItems.push({ type: 'video', src: thumb.dataset.videoUrl });
                }
            });
        }

        lightboxImages = galleryItems.filter(item => item.type === 'image');
        if (mainGallery && mainGallery.tagName === 'IMG') {
            mainGallery.addEventListener('click', openLightboxFromMain);
        }

        document.addEventListener('keydown', function(event) {
            const lightbox = document.getElementById('listingLightbox');
            if (!lightbox || !lightbox.classList.contains('active')) return;
            if (event.key === 'ArrowRight') { lightboxNext(); }
            else if (event.key === 'ArrowLeft') { lightboxPrevious(); }
            else if (event.key === 'Escape') { closeLightbox(); }
        });
    });

    function changeGalleryItem(index) {
        currentGalleryIndex = index;
        const mainGallery = document.getElementById('mainGallery');
        if (!mainGallery || !galleryItems[index]) return;
        const item = galleryItems[index];

        if (item.type === 'image') {
            mainGallery.replaceWith(createImage(item.src));
        } else {
            mainGallery.replaceWith(createVideo(item.src));
        }
        document.querySelectorAll('.listing-detail-thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }

    function createImage(src) {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'listing-detail-main-image image-clickable';
        img.id = 'mainGallery';
        img.alt = 'Görsel';
        img.addEventListener('click', openLightboxFromMain);
        return img;
    }

    function createVideo(src) {
        const video = document.createElement('video');
        video.src = src;
        video.className = 'listing-detail-main-image';
        video.id = 'mainGallery';
        video.controls = true;
        video.style.display = 'block';
        video.style.background = '#000';
        const source = document.createElement('source');
        source.src = src;
        source.type = 'video/mp4';
        video.appendChild(source);
        video.appendChild(document.createTextNode('Tarayıcınız video desteği sunmuyor.'));
        return video;
    }

    function previousGalleryItem() {
        if (galleryItems.length <= 1) return;
        currentGalleryIndex = (currentGalleryIndex - 1 + galleryItems.length) % galleryItems.length;
        changeGalleryItem(currentGalleryIndex);
    }

    function nextGalleryItem() {
        if (galleryItems.length <= 1) return;
        currentGalleryIndex = (currentGalleryIndex + 1) % galleryItems.length;
        changeGalleryItem(currentGalleryIndex);
    }

    function openLightboxFromMain() {
        const mainGallery = document.getElementById('mainGallery');
        if (!mainGallery || mainGallery.tagName !== 'IMG') return;
        const currentSrc = mainGallery.src;
        lightboxCurrentIndex = lightboxImages.findIndex(img => img.src === currentSrc);
        if (lightboxCurrentIndex < 0) lightboxCurrentIndex = 0;
        openLightbox(lightboxCurrentIndex);
    }

    function openLightbox(index) {
        if (lightboxImages.length === 0) return;
        lightboxCurrentIndex = index < lightboxImages.length ? index : 0;
        const lightbox = document.getElementById('listingLightbox');
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxCounter = document.getElementById('lightboxCounter');
        const lightboxTotal = document.getElementById('lightboxTotal');
        if (lightboxImage && lightboxCounter && lightboxTotal) {
            lightboxImage.src = lightboxImages[lightboxCurrentIndex].src;
            lightboxCounter.textContent = lightboxCurrentIndex + 1;
            lightboxTotal.textContent = lightboxImages.length;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeLightbox() {
        const lightbox = document.getElementById('listingLightbox');
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    document.getElementById('listingLightbox')?.addEventListener('click', function(e) {
        if (e.target === this) {
            closeLightbox();
        }
    });

    function lightboxNext() {
        if (lightboxImages.length === 0) return;
        lightboxCurrentIndex = (lightboxCurrentIndex + 1) % lightboxImages.length;
        updateLightbox();
    }

    function lightboxPrevious() {
        if (lightboxImages.length === 0) return;
        lightboxCurrentIndex = (lightboxCurrentIndex - 1 + lightboxImages.length) % lightboxImages.length;
        updateLightbox();
    }

    function updateLightbox() {
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxCounter = document.getElementById('lightboxCounter');
        if (lightboxImage && lightboxCounter) {
            lightboxImage.src = lightboxImages[lightboxCurrentIndex].src;
            lightboxCounter.textContent = lightboxCurrentIndex + 1;
        }
    }

    // Share modal functions
    function openShareModal() {
        document.getElementById('shareModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeShareModal() {
        document.getElementById('shareModal').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    document.getElementById('shareModal')?.addEventListener('click', function(e) {
        if (e.target === this) {
            closeShareModal();
        }
    });

    function shareToWhatsApp() {
        const shareUrl = '<?php echo esc_js(add_query_arg(['ilan_id' => $listing->id], home_url('ilan-detay'))); ?>';
        const shareText = '<?php echo esc_js($listing->title . ' - ' . number_format($listing->price, 2) . ' ' . $listing->currency . ' | ' . $listing->category_name); ?>';
        const whatsappUrl = 'https://wa.me/?text=' + encodeURIComponent(shareText + '\n' + shareUrl);
        window.open(whatsappUrl, '_blank');
    }

    function shareToTelegram() {
        const shareUrl = '<?php echo esc_js(add_query_arg(['ilan_id' => $listing->id], home_url('ilan-detay'))); ?>';
        const shareText = '<?php echo esc_js($listing->title . ' - ' . number_format($listing->price, 2) . ' ' . $listing->currency . ' | ' . $listing->category_name); ?>';
        const telegramUrl = 'https://t.me/share/url?url=' + encodeURIComponent(shareUrl) + '&text=' + encodeURIComponent(shareText);
        window.open(telegramUrl, '_blank');
    }

    function shareToMessenger() {
        const shareUrl = '<?php echo esc_js(add_query_arg(['ilan_id' => $listing->id], home_url('ilan-detay'))); ?>';
        const messengerUrl = 'fb-messenger://share?link=' + encodeURIComponent(shareUrl);
        window.open(messengerUrl, '_blank');
    }

    function copyListingUrl() {
        const shareUrl = '<?php echo esc_js(add_query_arg(['ilan_id' => $listing->id], home_url('ilan-detay'))); ?>';
        const shareText = '<?php echo esc_js($listing->title . ' - ' . number_format($listing->price, 2) . ' ' . $listing->currency); ?>';
        const fullText = shareText + '\n' + shareUrl;
        
        navigator.clipboard.writeText(fullText).then(() => {
            const copyBtn = document.querySelector('.share-btn-copy');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '✓ Kopyalandı!';
            copyBtn.style.background = '#10b981';
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.background = '#6b7280';
            }, 2000);
        });
    }
</script>

<!-- Share Modal -->
<div id="shareModal" class="share-modal">
    <div class="share-modal-content">
        <div class="share-modal-header">
            <h3 class="share-modal-title">İlanı Paylaş</h3>
            <button class="share-modal-close" onclick="closeShareModal()">&times;</button>
        </div>
        <div class="share-buttons">
            <button class="share-btn share-btn-whatsapp" onclick="shareToWhatsApp()">
                📱 WhatsApp
            </button>
            <button class="share-btn share-btn-telegram" onclick="shareToTelegram()">
                ✈️ Telegram
            </button>
            <button class="share-btn share-btn-messenger" onclick="shareToMessenger()">
                💬 Messenger
            </button>
            <button class="share-btn share-btn-copy" onclick="copyListingUrl()">
                🔗 URL Kopyala
            </button>
        </div>
        <div class="share-url-box">
            <?php echo esc_html($listing->title . ' - ' . number_format($listing->price, 2) . ' ' . $listing->currency); ?><br>
            <?php echo esc_url(add_query_arg(['ilan_id' => $listing->id], home_url('ilan-detay'))); ?>
        </div>
    </div>
</div>

<?php get_footer(); ?>
