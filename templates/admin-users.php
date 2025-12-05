<?php
/**
 * Admin Kullanıcılar Sayfası Template
 * Kayıtlı kullanıcıları kartlar halinde listeler, detay modalı ile gösterir
 */

// Direkt erişimi engelle
if (!defined('ABSPATH')) {
    exit;
}

global $wpdb;
$users_table = $wpdb->prefix . 'amator_bitlik_kullanıcılar';
$listings_table = $wpdb->prefix . 'amator_ilanlar';

// Sayfalama
$per_page = 12;
$current_page = isset($_GET['paged']) ? max(1, intval($_GET['paged'])) : 1;
$offset = ($current_page - 1) * $per_page;

// Toplam kullanıcı sayısı
$total_users = $wpdb->get_var("SELECT COUNT(*) FROM $users_table");
$total_pages = ceil($total_users / $per_page);

// Kullanıcıları ve ilan sayılarını getir
$users = $wpdb->get_results($wpdb->prepare(
    "SELECT u.*, 
            COUNT(l.id) as listing_count,
            SUM(CASE WHEN l.status = 'approved' THEN 1 ELSE 0 END) as active_listings,
            SUM(CASE WHEN l.status = 'pending' THEN 1 ELSE 0 END) as pending_listings
     FROM $users_table u
     LEFT JOIN $listings_table l ON u.user_id = l.user_id
     GROUP BY u.id
     ORDER BY u.id DESC
     LIMIT %d OFFSET %d",
    $per_page,
    $offset
));

// İstatistikler
$active_listing_owners = $wpdb->get_var("SELECT COUNT(DISTINCT user_id) FROM $listings_table WHERE status = 'approved'");
$total_listings = $wpdb->get_var("SELECT COUNT(*) FROM $listings_table");
?>

<div class="wrap ativ-admin-users-wrap">
    <style>
    .ativ-admin-users-wrap {
        background: #f8f9fa;
        padding: 20px 0 !important;
    }
    
    .ativ-users-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        border-radius: 8px;
        margin: 0 20px 30px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .ativ-users-header h1 {
        color: white;
        margin: 0 0 10px 0;
        font-size: 28px;
    }
    
    .ativ-users-header p {
        margin: 0;
        opacity: 0.9;
        font-size: 14px;
    }
    
    .ativ-users-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin: 0 20px 30px;
    }
    
    .ativ-user-stat-card {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        text-align: center;
        transition: all 0.3s ease;
    }
    
    .ativ-user-stat-card:hover {
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        transform: translateY(-2px);
    }
    
    .ativ-user-stat-card:nth-child(1) {
        border-left: 4px solid #667eea;
    }
    
    .ativ-user-stat-card:nth-child(2) {
        border-left: 4px solid #28a745;
    }
    
    .ativ-user-stat-card:nth-child(3) {
        border-left: 4px solid #ffc107;
    }
    
    .ativ-user-stat-value {
        font-size: 36px;
        font-weight: bold;
        color: #333;
        margin-bottom: 5px;
    }
    
    .ativ-user-stat-label {
        font-size: 13px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .ativ-users-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 20px;
        margin: 0 20px 30px;
    }
    
    .ativ-user-card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        overflow: hidden;
        border-top: 3px solid #667eea;
        transition: all 0.3s ease;
    }
    
    .ativ-user-card:hover {
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        transform: translateY(-2px);
    }
    
    .ativ-user-card-content {
        padding: 20px;
    }
    
    .ativ-user-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 15px;
    }
    
    .ativ-user-avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 24px;
        flex-shrink: 0;
    }
    
    .ativ-user-info {
        flex: 1;
        min-width: 0;
    }
    
    .ativ-user-name {
        font-size: 18px;
        font-weight: bold;
        color: #1d2327;
        margin-bottom: 3px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .ativ-user-callsign {
        font-size: 14px;
        color: #667eea;
        font-weight: 600;
    }
    
    .ativ-user-stats-mini {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin: 15px 0;
        padding: 15px;
        background: #f6f7f7;
        border-radius: 6px;
    }
    
    .ativ-user-stat-mini {
        text-align: center;
    }
    
    .ativ-user-stat-mini-value {
        font-size: 24px;
        font-weight: bold;
        line-height: 1;
        margin-bottom: 5px;
    }
    
    .ativ-user-stat-mini-label {
        font-size: 11px;
        color: #666;
    }
    
    .ativ-user-contact {
        font-size: 13px;
        color: #666;
        margin-bottom: 15px;
    }
    
    .ativ-user-contact > div {
        margin-bottom: 5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .ativ-user-detail-btn {
        width: 100%;
        padding: 10px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.2s ease;
    }
    
    .ativ-user-detail-btn:hover {
        background: #5568d3;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(102,126,234,0.3);
    }
    
    .ativ-no-users {
        background: white;
        padding: 60px 20px;
        border-radius: 8px;
        text-align: center;
        margin: 0 20px;
    }
    
    .ativ-no-users-icon {
        font-size: 64px;
        margin-bottom: 20px;
    }
    
    .ativ-no-users-text {
        font-size: 18px;
        color: #666;
    }
    
    .ativ-user-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 100000;
        overflow-y: auto;
        animation: fadeIn 0.3s ease;
    }
    
    .ativ-user-modal.active {
        display: block;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .ativ-user-modal-content {
        max-width: 900px;
        margin: 50px auto;
        background: white;
        border-radius: 12px;
        box-shadow: 0 5px 25px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease;
    }
    
    .ativ-user-modal-header {
        padding: 25px;
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px 12px 0 0;
    }
    
    .ativ-user-modal-header h2 {
        margin: 0;
        color: white;
        font-size: 24px;
    }
    
    .ativ-user-modal-close {
        background: none;
        border: none;
        color: white;
        font-size: 32px;
        cursor: pointer;
        line-height: 1;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
    }
    
    .ativ-user-modal-close:hover {
        background: rgba(255,255,255,0.2);
    }
    
    .ativ-user-modal-body {
        padding: 30px;
    }
    
    .ativ-user-detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 30px;
    }
    
    .ativ-user-detail-field {
        margin-bottom: 0;
    }
    
    .ativ-user-detail-field.full-width {
        grid-column: 1 / -1;
    }
    
    .ativ-user-detail-field label {
        display: block;
        font-weight: 600;
        color: #666;
        margin-bottom: 5px;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .ativ-user-detail-field input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
        background: #f6f7f7;
        font-size: 14px;
    }
    
    .ativ-user-listings-section {
        border-top: 2px solid #ddd;
        padding-top: 20px;
    }
    
    .ativ-user-listings-section h3 {
        margin-bottom: 15px;
        color: #333;
    }
    
    .ativ-user-listings-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
    }
    
    .ativ-user-listings-table thead {
        background: #f5f5f5;
    }
    
    .ativ-user-listings-table th {
        padding: 12px;
        text-align: left;
        font-weight: 600;
        color: #333;
        border-bottom: 2px solid #ddd;
    }
    
    .ativ-user-listings-table td {
        padding: 12px;
        border-bottom: 1px solid #e8e8e8;
    }
    
    .ativ-user-listings-table tbody tr:hover {
        background-color: #f9f9f9;
    }
    
    .ativ-listing-status-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        display: inline-block;
    }
    
    .ativ-listing-status-approved {
        background: #d4edda;
        color: #155724;
    }
    
    .ativ-listing-status-pending {
        background: #fff3cd;
        color: #856404;
    }
    
    .ativ-listing-status-rejected {
        background: #f8d7da;
        color: #721c24;
    }
    
    .ativ-pagination {
        display: flex;
        gap: 5px;
        justify-content: center;
        margin: 30px 20px;
        flex-wrap: wrap;
    }
    
    .ativ-pagination a,
    .ativ-pagination span {
        padding: 8px 12px;
        border-radius: 4px;
        border: 1px solid #ddd;
        text-decoration: none;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s ease;
        color: #333;
    }
    
    .ativ-pagination a:hover {
        background: #667eea;
        color: white;
        border-color: #667eea;
    }
    
    .ativ-pagination .current {
        background: #667eea;
        color: white;
        border-color: #667eea;
    }
    </style>
    
    <div class="ativ-users-header">
        <h1>👥 Kayıtlı Kullanıcılar</h1>
        <p>Bitlik Profilim sayfasından bilgilerini kaydeden kullanıcılar</p>
    </div>
    
    <!-- İstatistikler -->
    <div class="ativ-users-stats">
        <div class="ativ-user-stat-card">
            <div class="ativ-user-stat-value"><?php echo number_format($total_users); ?></div>
            <div class="ativ-user-stat-label">Toplam Kullanıcı</div>
        </div>
        <div class="ativ-user-stat-card">
            <div class="ativ-user-stat-value"><?php echo number_format($active_listing_owners); ?></div>
            <div class="ativ-user-stat-label">Aktif İlan Sahibi</div>
        </div>
        <div class="ativ-user-stat-card">
            <div class="ativ-user-stat-value"><?php echo number_format($total_listings); ?></div>
            <div class="ativ-user-stat-label">Toplam İlan</div>
        </div>
    </div>
    
    <?php if (empty($users)): ?>
        <div class="ativ-no-users">
            <div class="ativ-no-users-icon">📭</div>
            <p class="ativ-no-users-text">Henüz kayıtlı kullanıcı yok.</p>
        </div>
    <?php else: ?>
        <!-- Kullanıcı Kartları -->
        <div class="ativ-users-grid">
            <?php foreach ($users as $user): ?>
                <div class="ativ-user-card">
                    <div class="ativ-user-card-content">
                        <div class="ativ-user-header">
                            <div class="ativ-user-avatar">
                                <?php echo strtoupper(substr($user->callsign, 0, 2)); ?>
                            </div>
                            <div class="ativ-user-info">
                                <div class="ativ-user-name"><?php echo esc_html($user->name); ?></div>
                                <div class="ativ-user-callsign">📻 <?php echo esc_html($user->callsign); ?></div>
                            </div>
                        </div>
                        
                        <div class="ativ-user-stats-mini">
                            <div class="ativ-user-stat-mini">
                                <div class="ativ-user-stat-mini-value" style="color: #667eea;">
                                    <?php echo intval($user->listing_count); ?>
                                </div>
                                <div class="ativ-user-stat-mini-label">Toplam İlan</div>
                            </div>
                            <div class="ativ-user-stat-mini">
                                <div class="ativ-user-stat-mini-value" style="color: #28a745;">
                                    <?php echo intval($user->active_listings); ?>
                                </div>
                                <div class="ativ-user-stat-mini-label">Aktif</div>
                            </div>
                            <div class="ativ-user-stat-mini">
                                <div class="ativ-user-stat-mini-value" style="color: #ffc107;">
                                    <?php echo intval($user->pending_listings); ?>
                                </div>
                                <div class="ativ-user-stat-mini-label">Beklemede</div>
                            </div>
                        </div>
                        
                        <div class="ativ-user-contact">
                            <div>📍 <?php echo esc_html($user->location); ?></div>
                            <div>📧 <?php echo esc_html($user->email); ?></div>
                            <div>📞 <?php echo esc_html($user->phone); ?></div>
                        </div>
                        
                        <button 
                            class="ativ-user-detail-btn"
                            onclick="showUserDetails(<?php echo esc_js(json_encode($user)); ?>)">
                            🔍 Detay Görüntüle
                        </button>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
        
        <?php if ($total_pages > 1): ?>
            <div class="ativ-pagination">
                <?php
                echo paginate_links(array(
                    'base' => add_query_arg('paged', '%#%'),
                    'format' => '',
                    'prev_text' => '&laquo; Önceki',
                    'next_text' => 'Sonraki &raquo;',
                    'total' => $total_pages,
                    'current' => $current_page
                ));
                ?>
            </div>
        <?php endif; ?>
    <?php endif; ?>
</div>

<!-- Kullanıcı Detay Modal -->
<div id="userDetailModal" class="ativ-user-modal">
    <div class="ativ-user-modal-content">
        <div class="ativ-user-modal-header">
            <h2>👤 Kullanıcı Detayları</h2>
            <button class="ativ-user-modal-close" onclick="closeUserModal()">&times;</button>
        </div>
        <div class="ativ-user-modal-body">
            <div id="userDetailContent"></div>
        </div>
    </div>
</div>

<script>
function showUserDetails(user) {
    const modal = document.getElementById('userDetailModal');
    const content = document.getElementById('userDetailContent');
    
    // Loading göster
    content.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;"><p style="font-size: 48px; margin: 0;">⏳</p><p>Yükleniyor...</p></div>';
    
    // Modalı aç
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Kullanıcı ilanlarını AJAX ile getir
    fetch(ajaxurl + '?action=get_user_listings&user_id=' + user.user_id)
        .then(res => res.json())
        .then(data => {
            let listingsHtml = '';
            
            if (data.success && data.data.length > 0) {
                listingsHtml = `
                    <table class="ativ-user-listings-table">
                        <thead>
                            <tr>
                                <th>Başlık</th>
                                <th>Kategori</th>
                                <th>Fiyat</th>
                                <th>Durum</th>
                                <th>Tarih</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                data.data.forEach(listing => {
                    let statusClass = 'ativ-listing-status-pending';
                    let statusText = listing.durum;
                    
                    if (listing.durum === 'approved') {
                        statusClass = 'ativ-listing-status-approved';
                        statusText = 'Onaylandı';
                    } else if (listing.durum === 'pending') {
                        statusClass = 'ativ-listing-status-pending';
                        statusText = 'Beklemede';
                    } else if (listing.durum === 'rejected') {
                        statusClass = 'ativ-listing-status-rejected';
                        statusText = 'Reddedildi';
                    }
                    
                    const categoryName = listing.kategori;
                    const date = new Date(listing.created_at).toLocaleDateString('tr-TR');
                    
                    listingsHtml += `
                        <tr>
                            <td><strong>${listing.baslik}</strong></td>
                            <td>${categoryName}</td>
                            <td><strong>${listing.fiyat} ${listing.para_birimi}</strong></td>
                            <td><span class="ativ-listing-status-badge ${statusClass}">${statusText}</span></td>
                            <td>${date}</td>
                        </tr>
                    `;
                });
                
                listingsHtml += '</tbody></table>';
            } else {
                listingsHtml = '<p style="text-align: center; color: #666; padding: 20px; background: #f6f7f7; border-radius: 8px;">Bu kullanıcının henüz ilanı yok.</p>';
            }
            
            content.innerHTML = `
                <div class="ativ-user-detail-grid">
                    <div class="ativ-user-detail-field">
                        <label>Çağrı İşareti</label>
                        <input type="text" value="${user.callsign}" readonly>
                    </div>
                    <div class="ativ-user-detail-field">
                        <label>Ad Soyad</label>
                        <input type="text" value="${user.name}" readonly>
                    </div>
                    <div class="ativ-user-detail-field">
                        <label>E-posta</label>
                        <input type="text" value="${user.email}" readonly>
                    </div>
                    <div class="ativ-user-detail-field">
                        <label>Telefon</label>
                        <input type="text" value="${user.phone}" readonly>
                    </div>
                    <div class="ativ-user-detail-field full-width">
                        <label>Konum</label>
                        <input type="text" value="${user.location}" readonly>
                    </div>
                </div>
                
                <div class="ativ-user-listings-section">
                    <h3>📋 Kullanıcının İlanları (${user.listing_count})</h3>
                    ${listingsHtml}
                </div>
            `;
        })
        .catch(error => {
            content.innerHTML = '<div style="text-align: center; padding: 40px; color: #dc3545;"><p>❌ İlanlar yüklenirken hata oluştu</p><p>' + error + '</p></div>';
        });
}

function closeUserModal() {
    const modal = document.getElementById('userDetailModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Modal dışına tıklandığında kapat
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('userDetailModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeUserModal();
            }
        });
    }
});

// ESC tuşu ile kapat
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('userDetailModal');
        if (modal && modal.classList.contains('active')) {
            closeUserModal();
        }
    }
});
</script>
