<div id="addListingModal" class="modal-overlay" style="display: none;">
 <div class="modal-content">
  <div class="modal-header">
   <h2>Yeni İlan Ekle</h2><button class="modal-close" id="modalCloseBtn" aria-label="Kapat">×</button>
  </div>
  <div id="formMessage"></div>
  <div class="modal-body">
   <div class="preview-section">
    <div class="preview-card">
     <h3>👁️ Canlı Önizleme</h3>
     <p>İlanınız böyle görünecek</p>
     <div class="preview-listing-card">
      <div class="preview-listing-image" id="previewImage">📻</div>
      <div class="preview-listing-content">
       <h3 class="preview-listing-title" id="previewTitle"><span class="preview-empty-state">İlan başlığı...</span></h3>
       <p class="preview-listing-callsign" id="previewCallsign"><span class="preview-empty-state">Çağrı işareti...</span></p>
       <p class="preview-listing-price" id="previewPrice"><span class="preview-empty-state">₺0 TRY</span></p>
      </div>
     </div>
    </div>
   </div>
   <div class="form-section">
    <form id="addListingForm">
     <div class="form-group"><label for="formTitle">İlan Başlığı *</label> <input type="text" id="formTitle" required placeholder="Örn: Yaesu FT-991A HF/VHF/UHF"></div>
     <div class="form-group"><label for="formCategory">Kategori *</label> <select id="formCategory" required> <option value="">Kategori seçin</option> <option value="transceiver">Telsiz</option> <option value="antenna">Anten</option> <option value="amplifier">Amplifikatör</option> <option value="accessory">Aksesuar</option> <option value="other">Diğer</option> </select></div>
     <div class="form-group"><label for="formBrand">Marka *</label> <input type="text" id="formBrand" required placeholder="Örn: Yaesu, Icom, Kenwood"></div>
     <div class="form-group"><label for="formModel">Model *</label> <input type="text" id="formModel" required placeholder="Örn: FT-991A"></div>
     <div class="form-group"><label for="formCondition">Durum *</label> <select id="formCondition" required> <option value="">Durum seçin</option> <option value="Sıfır">Sıfır</option> <option value="Kullanılmış">Kullanılmış</option> <option value="Arızalı">Arızalı</option> </select></div>
     <div class="form-group"><label for="formPrice">Fiyat *</label>
      <div style="display: flex; gap: 12px;"><input type="number" id="formPrice" required min="0" step="0.01" placeholder="0" style="flex: 2;"> <select id="formCurrency" required style="flex: 1; padding: 14px 16px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 15px;"> <option value="TRY">₺ TRY</option> <option value="USD">$ USD</option> <option value="EUR">€ EUR</option> </select></div>
     </div>
     <div class="form-group"><label for="formDescription">Açıklama *</label> <textarea id="formDescription" required placeholder="Ürün hakkında detaylı bilgi verin..."></textarea></div>
     <div class="form-group"><label>Ürün Görselleri (Maksimum 5 adet)</label>
      <div class="file-upload-wrapper"><input type="file" id="formImages" accept="image/*" multiple class="file-input"> <label for="formImages" class="file-upload-label">
        <svg width="24" height="24" viewbox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path> <polyline points="17 8 12 3 7 8"></polyline> <line x1="12" y1="3" x2="12" y2="15"></line></svg>
        <span class="file-upload-text">Görselleri seçin veya sürükleyin</span> <span class="file-upload-hint">PNG, JPG, JPEG (Max 5 dosya)</span> </label></div>
      <div id="imagePreviewContainer" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-top: 16px;"></div>
     </div>
     <div class="form-group"><label for="formCallsign">Çağrı İşareti *</label> <input type="text" id="formCallsign" required placeholder="Örn: TA1ABC"></div>
     <div class="form-group"><label for="formSellerName">Ad Soyad *</label> <input type="text" id="formSellerName" required placeholder="Adınız ve soyadınız"></div>
     <div class="form-group"><label for="formLocation">Konum *</label> <input type="text" id="formLocation" required placeholder="Örn: İstanbul, Kadıköy"></div>
     <div class="form-group"><label for="formEmail">E-posta *</label> <input type="email" id="formEmail" required placeholder="ornek@email.com"></div>
     <div class="form-group"><label for="formPhone">Telefon *</label> <input type="tel" id="formPhone" required placeholder="0532 111 22 33"></div>
     <div class="form-actions"><button type="button" class="btn-cancel" id="formCancelBtn">İptal</button> <button type="submit" class="btn-submit" id="formSubmitBtn">İlanı Yayınla</button></div>
    </form>
   </div>
  </div>
 </div>
</div>
