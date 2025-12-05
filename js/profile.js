// Bitlik Profilim - AJAX ile profil kaydetme

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('profileInfoForm');
    if (!form) return;

    // Alan kodu seçeneğini doldur (modal.js'den countryCodes kullanıyoruz)
    const countryCodeSelect = document.getElementById('profileCountryCode');
    
    // Kısa bir delay ile countryCodes'ın yüklenmesini bekle
    setTimeout(function() {
        if (countryCodeSelect && typeof countryCodes !== 'undefined' && countryCodes.length > 0) {
            countryCodeSelect.innerHTML = '';
            countryCodes.forEach(country => {
                const option = document.createElement('option');
                option.value = country.dialCode;
                option.textContent = `${country.flag} ${country.dialCode}`;
                option.setAttribute('data-name', country.name);
                if (country.dialCode === '+90') {
                    option.selected = true;
                }
                countryCodeSelect.appendChild(option);
            });
        } else if (!countryCodeSelect) {
            console.warn('[WARN] profileCountryCode element bulunamadı');
        } else {
            console.warn('[WARN] countryCodes yüklenemedi');
        }
    }, 100);

    // Telefon numarasını formatla
    const phoneInput = document.getElementById('profilePhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, ''); // Sadece rakamlar
            let formatted = '';
            
            if (value.length >= 1) formatted = value.substring(0, 3);
            if (value.length >= 4) formatted += ' ' + value.substring(3, 6);
            if (value.length >= 7) formatted += ' ' + value.substring(6, 8);
            if (value.length >= 9) formatted += ' ' + value.substring(8, 10);
            
            e.target.value = formatted.trim();
        });
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        console.log('[PROFILE DEBUG] Form submit başladı');
        console.log('[PROFILE DEBUG] ajaxurl:', window.ajaxurl);
        console.log('[PROFILE DEBUG] atheneaNonce:', window.atheneaNonce);
        
        // Önce ban durumunu kontrol et
        try {
            console.log('[PROFILE DEBUG] Ban kontrolü yapılıyor...');
            const banCheckResponse = await fetch(window.ajaxurl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action: 'check_user_ban',
                    nonce: window.atheneaNonce || ''
                })
            });
            console.log('[PROFILE DEBUG] Ban yanıt status:', banCheckResponse.status);
            
            const banStatus = await banCheckResponse.json();
            console.log('[PROFILE DEBUG] Ban durumu tam:', banStatus);
            console.log('[PROFILE DEBUG] banStatus.data:', banStatus.data);
            console.log('[PROFILE DEBUG] banStatus.data.is_banned:', banStatus.data?.is_banned);
            
            if (banStatus.data && banStatus.data.is_banned) {
                console.log('[PROFILE DEBUG] Kullanıcı banlanmış! Modal gösterilecek');
                console.log('[PROFILE DEBUG] showBannedUserModal var mı?', !!window.showBannedUserModal);
                
                // Ban modalı göster
                if (window.showBannedUserModal) {
                    console.log('[PROFILE DEBUG] Modal gösteriliyor...');
                    window.showBannedUserModal(banStatus.data.ban_reason, banStatus.data.banned_at);
                } else {
                    console.error('[PROFILE DEBUG] showBannedUserModal fonksiyonu bulunamadı!');
                }
                return;
            }
            console.log('[PROFILE DEBUG] Kullanıcı banlanmamış, form devam ediyor');
        } catch (e) {
            console.error('[PROFILE DEBUG] Ban durumu kontrol hatası:', e);
            // Hata durumunda devam et (opsiyonel)
        }
        
        const callsign = document.getElementById('profileCallsign').value.trim();
        const name = document.getElementById('profileName').value.trim();
        const email = document.getElementById('profileEmail').value.trim();
        const location = document.getElementById('profileLocation').value.trim();
        
        // Telefon: alan kodu + numarası boşluksuz birleştir
        const countryCode = document.getElementById('profileCountryCode').value;
        const phoneNumber = document.getElementById('profilePhone').value.replace(/\D/g, ''); // Sadece rakamlar
        const phone = countryCode + phoneNumber;
        
        const termsAccepted = document.getElementById('profileTermsCheckbox').checked;
        const user_id = window.bitlikUserId || null;

        console.log('[PROFILE DEBUG] Validasyon başlıyor');
        console.log('[PROFILE DEBUG] termsAccepted:', termsAccepted);
        console.log('[PROFILE DEBUG] callsign:', callsign);
        console.log('[PROFILE DEBUG] name:', name);
        console.log('[PROFILE DEBUG] email:', email);
        console.log('[PROFILE DEBUG] location:', location);
        console.log('[PROFILE DEBUG] phoneNumber:', phoneNumber);
        console.log('[PROFILE DEBUG] phone (birleştirilmiş):', phone);

        // Sözleşme kontrolü
        if (!termsAccepted) {
            console.log('[PROFILE DEBUG] HATA: Sözleşme kabul edilmemiş');
            showMessage('Kullanıcı sözleşmesini kabul etmelisiniz.', false);
            return;
        }

        // Zorunlu alan kontrolü
        if (!callsign || !name || !email || !location || !phoneNumber) {
            console.log('[PROFILE DEBUG] HATA: Boş zorunlu alan var');
            showMessage('Tüm alanları doldurun.', false);
            return;
        }

        // E-posta formatı kontrolü
        if (!validateEmail(email)) {
            console.log('[PROFILE DEBUG] HATA: E-posta formatı yanlış');
            showMessage('Geçerli bir e-posta girin.', false);
            return;
        }

        // Telefon formatı kontrolü (örnek: +90 5XX XXX XXXX)
        const phoneRegex = /^\+90\s?5\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;
        console.log('[PROFILE DEBUG] Telefon regex testi:');
        console.log('[PROFILE DEBUG] Regex:', phoneRegex);
        console.log('[PROFILE DEBUG] Test değeri:', phone);
        console.log('[PROFILE DEBUG] Regex sonucu:', phoneRegex.test(phone));
        
        if (!phoneRegex.test(phone)) {
            console.log('[PROFILE DEBUG] HATA: Telefon formatı yanlış - ' + phone);
            showMessage('Telefon formatı: +90 5XX XXX XX XX', false);
            return;
        }

        // AJAX ile kaydet
        const data = new FormData();
        data.append('action', 'amator_bitlik_add_user');
        data.append('user_id', user_id);
        data.append('callsign', callsign);
        data.append('name', name);
        data.append('email', email);
        data.append('location', location);
        data.append('phone', phone);
        
        console.log('[PROFILE DEBUG] FormData oluşturma:');
        console.log('[PROFILE DEBUG] window.atheneaNonce değeri:', window.atheneaNonce);
        console.log('[PROFILE DEBUG] typeof atheneaNonce:', typeof window.atheneaNonce);
        
        data.append('_wpnonce', window.atheneaNonce || '');
        
        console.log('[PROFILE DEBUG] FormData nonce eklenmiştir');

        showLoading(true);
        fetch(window.ajaxurl, {
            method: 'POST',
            body: data
        })
        .then(res => res.json())
        .then(res => {
            showLoading(false);
            console.log('[PROFILE DEBUG] Form submit yanıtı:', res);
            console.log('[PROFILE DEBUG] res.success:', res.success);
            console.log('[PROFILE DEBUG] res.data:', res.data);
            if (res.success) {
                showMessage(res.data.message, true);
            } else {
                showMessage(res.data.message || 'Kayıt başarısız.', false);
            }
        })
        .catch((err) => {
            showLoading(false);
            console.error('[PROFILE DEBUG] Fetch hatası:', err);
            showMessage('Sunucu hatası.', false);
        });
    });

    function showMessage(msg, success) {
        const el = document.getElementById('profileInfoMessage');
        el.textContent = msg;
        el.style.color = success ? 'green' : 'red';
    }
    function showLoading(show) {
        document.getElementById('profileLoadingOverlay').style.display = show ? 'flex' : 'none';
    }
    function validateEmail(email) {
        return /^\S+@\S+\.\S+$/.test(email);
    }

    // Sözleşme linkine tıklayınca modal aç
    const termsLink = document.getElementById('profileTermsLink');
    
    if (termsLink) {
        termsLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const modal = document.getElementById('termsModal');
            const acceptBtn = document.getElementById('acceptTermsBtn');
            
            if (modal) {
                modal.style.display = 'flex';
                if (acceptBtn) {
                    const isAccepted = localStorage.getItem('termsAccepted') === 'true';
                    acceptBtn.style.display = isAccepted ? 'none' : 'inline-block';
                    
                    // Kabul butonuna tıklayınca checkbox'ı işaretle
                    acceptBtn.onclick = function() {
                        localStorage.setItem('termsAccepted', 'true');
                        const checkbox = document.getElementById('profileTermsCheckbox');
                        if (checkbox) checkbox.checked = true;
                        modal.style.display = 'none';
                    };
                }
            }
        });
    }
});
