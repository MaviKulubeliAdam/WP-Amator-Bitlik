const defaultConfig = {
  header_title: "Amatör Telsiz İlan Vitrini",
  header_subtitle: "Kaliteli ekipmanları keşfedin",
  search_placeholder: "İlan ara... (başlık, çağrı işareti, açıklama)",
  load_more_text: "Daha Fazla Yükle",
  no_results_text: "Sonuç bulunamadı. Lütfen farklı bir arama deneyin.",
  primary_color: "#667eea",
  secondary_color: "#f8f9fa",
  surface_color: "#ffffff",
  text_color: "#1a1a1a",
  accent_color: "#667eea"
};

let allListings = [];
let displayedListings = [];
let currentFilter = 'all';
let currentConditionFilter = 'all';
let currentBrandFilter = [];
let currentLocationFilter = [];
let currentPriceRangeFilter = 'all';
let currentSort = 'newest'; // Varsayılan sıralama
let currentSearch = '';
let itemsPerPage = 24; // Sayfa başına 24 ilan
let currentPage = 1; // Sayfa numarası (1'den başlar)
let totalPages = 1; // Toplam sayfa sayısı
let selectedListing = null;
let editingListing = null;
let userCallsign = localStorage.getItem('userCallsign') || null;

let uploadedImages = [];
let featuredImageIndex = 0;

// Lightbox fonksiyonları
let currentLightboxSlide = 0;
let isLightboxOpen = false;
let currentImages = [];
let lightboxSource = ''; // 'detail' veya 'gallery'

// Slider değişkenleri
let currentSlide = 0;

// Sayfa türü: 'gallery' veya 'my-listings'
let pageType = 'gallery';

async function initApp() {
  await loadListings();
  populateFilterOptions();
  applyFiltersAndRender();

  document.getElementById('searchInput').addEventListener('input', handleSearch);

  setupDropdowns();
  setupModal();
  setupForm();
}

// API İşlemleri - WordPress AJAX kullanacak
async function apiCall(action, data = null) {
  const formData = new FormData();
  formData.append('action', 'ativ_ajax');
  
  // İşlem türüne göre doğru nonce'u kullan
  const critical_actions = ['save_listing', 'update_listing', 'delete_listing'];
  const public_actions = ['get_listings', 'get_brands', 'get_locations'];
  
  if (critical_actions.includes(action) && ativ_ajax.is_user_logged_in) {
    formData.append('nonce', ativ_ajax.nonce);
  } else if (public_actions.includes(action)) {
    formData.append('nonce', ativ_ajax.public_nonce);
  } else {
    formData.append('nonce', ativ_ajax.nonce);
  }
  
  formData.append('action_type', action);

  if (data) {
    for (const key in data) {
      if (data[key] !== null && data[key] !== undefined) {
        if (typeof data[key] === 'object' && !(data[key] instanceof File)) {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    }
  }

  try {
    const response = await fetch(ativ_ajax.url, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.data || 'İşlem başarısız');
    }
    
    return result;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

async function loadListings() {
  try {
    const response = await apiCall('get_listings');
    allListings = response.data || [];
    // Listeler yüklendikten sonra sıralamayı uygula
    allListings = sortListings(allListings, currentSort);
  } catch (error) {
    console.error('Listeler yüklenirken hata oluştu:', error);
    allListings = [];
  }
}

async function saveListing(listingData) {
  const response = await apiCall('save_listing', listingData);
  return response;
}

async function updateListing(id, listingData) {
  listingData.id = id;
  const response = await apiCall('update_listing', listingData);
  return response;
}

async function deleteListing(id) {
  const response = await apiCall('delete_listing', { id: id });
  return response;
}

function populateFilterOptions() {
  const brands = [...new Set(allListings.map(listing => listing.brand))].sort();
  const brandOptions = document.getElementById('brandOptions');
  brandOptions.innerHTML = '<div class="dropdown-option multi-select selected" data-value="all">Tüm Markalar</div>';
  brands.forEach(brand => {
    const option = document.createElement('div');
    option.className = 'dropdown-option multi-select';
    option.dataset.value = brand;
    option.textContent = brand;
    brandOptions.appendChild(option);
  });

  const locations = [...new Set(allListings.map(listing => listing.location))].sort();
  const locationOptions = document.getElementById('locationOptions');
  locationOptions.innerHTML = '<div class="dropdown-option multi-select selected" data-value="all">Tüm Konumlar</div>';
  locations.forEach(location => {
    const option = document.createElement('div');
    option.className = 'dropdown-option multi-select';
    option.dataset.value = location;
    option.textContent = location;
    locationOptions.appendChild(option);
  });
}

function setupDropdowns() {
  setupSingleSelectDropdown('category', (value) => {
    currentFilter = value;
    currentPage = 1;
    applyFiltersAndRender();
  });

  setupSingleSelectDropdown('condition', (value) => {
    currentConditionFilter = value;
    currentPage = 1;
    applyFiltersAndRender();
  });

  setupSingleSelectDropdown('price', (value) => {
    currentPriceRangeFilter = value;
    currentPage = 1;
    applyFiltersAndRender();
  });

  setupSingleSelectDropdown('sort', (value) => {
    currentSort = value;
    currentPage = 1;
    applyFiltersAndRender();
  });

  setupMultiSelectDropdown('brand', (values) => {
    currentBrandFilter = values;
    currentPage = 1;
    applyFiltersAndRender();
  });

  setupMultiSelectDropdown('location', (values) => {
    currentLocationFilter = values;
    currentPage = 1;
    applyFiltersAndRender();
  });

  const brandSearchInput = document.getElementById('brandSearchInput');
  if (brandSearchInput) {
    brandSearchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      const options = document.querySelectorAll('#brandOptions .dropdown-option');
      options.forEach(option => {
        if (option.dataset.value === 'all') return;
        const text = option.textContent.toLowerCase();
        option.classList.toggle('hidden', !text.includes(searchTerm));
      });
    });
    brandSearchInput.addEventListener('click', (e) => e.stopPropagation());
  }

  const locationSearchInput = document.getElementById('locationSearchInput');
  if (locationSearchInput) {
    locationSearchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      const options = document.querySelectorAll('#locationOptions .dropdown-option');
      options.forEach(option => {
        if (option.dataset.value === 'all') return;
        const text = option.textContent.toLowerCase();
        option.classList.toggle('hidden', !text.includes(searchTerm));
      });
    });
    locationSearchInput.addEventListener('click', (e) => e.stopPropagation());
  }

  document.addEventListener('click', (e) => {
    document.querySelectorAll('.dropdown-filter.open').forEach(dropdown => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
        const searchInput = dropdown.querySelector('.dropdown-search input');
        if (searchInput) {
          searchInput.value = '';
          dropdown.querySelectorAll('.dropdown-option').forEach(opt => opt.classList.remove('hidden'));
        }
      }
    });
  });
}

function setupSingleSelectDropdown(type, callback) {
  const dropdown = document.getElementById(`${type}Dropdown`);
  const button = document.getElementById(`${type}Button`);
  const options = document.getElementById(`${type}Options`);
  const buttonText = document.getElementById(`${type}ButtonText`);

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('open');
    document.querySelectorAll('.dropdown-filter.open').forEach(d => d.classList.remove('open'));
    if (!isOpen) dropdown.classList.add('open');
  });

  options.addEventListener('click', (e) => {
    if (e.target.classList.contains('dropdown-option')) {
      const value = e.target.dataset.value;
      const clickedOption = e.target;
      
      options.querySelectorAll('.dropdown-option').forEach(opt => opt.classList.remove('selected'));
      clickedOption.classList.add('selected');
      
      buttonText.textContent = clickedOption.textContent;
      dropdown.classList.remove('open');
      callback(value);
    }
  });
}

function setupMultiSelectDropdown(type, callback) {
  const dropdown = document.getElementById(`${type}Dropdown`);
  const button = document.getElementById(`${type}Button`);
  const options = document.getElementById(`${type}Options`);
  const buttonText = document.getElementById(`${type}ButtonText`);
  let selectedValues = [];

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('open');
    document.querySelectorAll('.dropdown-filter.open').forEach(d => d.classList.remove('open'));
    if (!isOpen) dropdown.classList.add('open');
  });

  options.addEventListener('click', (e) => {
    if (e.target.classList.contains('dropdown-option')) {
      const value = e.target.dataset.value;
      
      if (value === 'all') {
        selectedValues = [];
        options.querySelectorAll('.dropdown-option').forEach(opt => {
          opt.classList.toggle('selected', opt.dataset.value === 'all');
        });
        buttonText.textContent = e.target.textContent;
      } else {
        const allOption = options.querySelector('.dropdown-option[data-value="all"]');
        allOption.classList.remove('selected');
        
        if (selectedValues.includes(value)) {
          selectedValues = selectedValues.filter(v => v !== value);
          e.target.classList.remove('selected');
        } else {
          selectedValues.push(value);
          e.target.classList.add('selected');
        }
        
        if (selectedValues.length === 0) {
          allOption.classList.add('selected');
          buttonText.textContent = allOption.textContent;
        } else if (selectedValues.length === 1) {
          buttonText.textContent = selectedValues[0];
        } else {
          buttonText.textContent = `${selectedValues.length} ${type === 'brand' ? 'Marka' : 'Konum'} Seçili`;
        }
      }
      
      callback(selectedValues);
    }
  });
}

function setupModal() {
  const addBtn = document.getElementById('addListingBtn');
  const closeBtn = document.getElementById('modalCloseBtn');
  const cancelBtn = document.getElementById('formCancelBtn');
  const modal = document.getElementById('addListingModal');
  
  if (addBtn) addBtn.addEventListener('click', openAddListingModal);
  if (closeBtn) closeBtn.addEventListener('click', closeAddListingModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeAddListingModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'addListingModal') closeAddListingModal();
    });
  }
}

function setupForm() {
  document.getElementById('addListingForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('formImages').addEventListener('change', handleImageUpload);

  ['formTitle', 'formBrand', 'formModel', 'formSellerName', 'formLocation', 'formDescription'].forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener('input', (e) => {
      const start = e.target.selectionStart;
      const value = e.target.value;
      if (value.length > 0) {
        e.target.value = value.charAt(0).toUpperCase() + value.slice(1);
        e.target.setSelectionRange(start, start);
      }
      if (id === 'formTitle' || id === 'formCallsign' || id === 'formPrice') {
        updatePreview();
      }
    });
  });

  const callsignInput = document.getElementById('formCallsign');
  callsignInput.addEventListener('input', (e) => {
    const start = e.target.selectionStart;
    e.target.value = e.target.value.toUpperCase();
    e.target.setSelectionRange(start, start);
    updatePreview();
  });

  document.getElementById('formCurrency').addEventListener('change', updatePreview);

  const emailInput = document.getElementById('formEmail');
  emailInput.addEventListener('blur', (e) => {
    const email = e.target.value.trim();
    if (email && !isValidEmail(email)) {
      e.target.setCustomValidity('Geçerli bir e-posta adresi girin');
      e.target.reportValidity();
    } else {
      e.target.setCustomValidity('');
    }
  });
  emailInput.addEventListener('input', (e) => e.target.setCustomValidity(''));

  const phoneInput = document.getElementById('formPhone');
  phoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    e.target.value = value;
    e.target.setCustomValidity(value.length > 0 && value.length !== 11 ? 'Telefon numarası tam olarak 11 hane olmalıdır' : '');
  });
  phoneInput.addEventListener('blur', (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length > 0 && value.length !== 11) {
      e.target.setCustomValidity('Telefon numarası tam olarak 11 hane olmalıdır');
      e.target.reportValidity();
    }
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function openAddListingModal() {
  // Çift katmanlı güvenlik kontrolü
  if (!ativ_ajax.is_user_logged_in) {
    alert('İlan eklemek için giriş yapmalısınız.');
    return;
  }
  
  // Butonun görünür olup olmadığını kontrol et (ekstra güvenlik)
  const addButton = document.getElementById('addListingBtn');
  if (!addButton || addButton.style.display === 'none' || addButton.offsetParent === null) {
    alert('Bu işlem için yetkiniz bulunmamaktadır.');
    return;
  }
  
  editingListing = null;
  document.getElementById('addListingModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  document.querySelector('.modal-header h2').textContent = 'Yeni İlan Ekle';
  document.getElementById('formSubmitBtn').textContent = 'İlanı Yayınla';
  updatePreview();
}

async function openEditListingModal(listingOrId) {
  // Accept either a listing object or an id. Always try to use the freshest listing from allListings.
  let listing = listingOrId;
  if (typeof listingOrId === 'number' || typeof listingOrId === 'string') {
    listing = allListings.find(l => l.id == listingOrId);
    if (!listing) {
      try {
        await loadListings();
        listing = allListings.find(l => l.id == listingOrId);
      } catch (e) {
        console.error('Listing yüklenemedi:', e);
      }
    }
  }

  if (!listing) {
    alert('İlan bilgisi yüklenemedi');
    return;
  }

  console.log('[DEBUG] openEditListingModal resolved listing id:', listing.id, 'user_id:', listing.user_id);

  // Use a shallow copy to avoid accidental mutation of the global allListings item
  editingListing = Object.assign({}, listing);

  // Populate modal fields
  document.getElementById('formTitle').value = listing.title || '';
  document.getElementById('formCategory').value = listing.category || '';
  document.getElementById('formBrand').value = listing.brand || '';
  document.getElementById('formModel').value = listing.model || '';
  document.getElementById('formCondition').value = listing.condition || '';
  document.getElementById('formPrice').value = listing.price || '';
  document.getElementById('formCurrency').value = listing.currency || 'TRY';
  document.getElementById('formDescription').value = listing.description || '';
  document.getElementById('formCallsign').value = listing.callsign || '';
  document.getElementById('formSellerName').value = listing.seller_name || '';
  document.getElementById('formLocation').value = listing.location || '';
  document.getElementById('formEmail').value = listing.seller_email || '';
  document.getElementById('formPhone').value = listing.seller_phone || '';

  // Normalize images for previews: stored images may be strings (filenames) or objects
  uploadedImages.forEach(img => { if (img && img.previewUrl) URL.revokeObjectURL(img.previewUrl); });
  uploadedImages = [];
  featuredImageIndex = 0;

  if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
    listing.images.forEach((img, idx) => {
      if (typeof img === 'string') {
        // Existing filename stored in DB -> build URL for preview
        const src = (typeof ativ_ajax !== 'undefined' && ativ_ajax.upload_url) ? (ativ_ajax.upload_url + listing.id + '/' + img) : img;
        uploadedImages.push({ name: img, data: src });
      } else if (img && (img.data || img.name)) {
        // Already an object (legacy support)
        if (img.data && img.name) uploadedImages.push({ name: img.name, data: img.data });
        else if (img.name) uploadedImages.push({ name: img.name, data: (typeof ativ_ajax !== 'undefined' ? (ativ_ajax.upload_url + listing.id + '/' + img.name) : img.name) });
      }
    });
    featuredImageIndex = listing.featured_image_index || 0;
    renderImagePreviews();
  }

  // Show modal last so previews/fields are ready
  document.getElementById('addListingModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  document.querySelector('.modal-header h2').textContent = 'İlanı Düzenle';
  document.getElementById('formSubmitBtn').textContent = 'Değişiklikleri Kaydet';

  updatePreview();
}

function closeAddListingModal() {
  document.getElementById('addListingModal').style.display = 'none';
  document.body.style.overflow = 'auto';
  document.getElementById('addListingForm').reset();
  document.getElementById('formMessage').innerHTML = '';
  uploadedImages = [];
  featuredImageIndex = 0;
  editingListing = null;
  renderImagePreviews();
}

function updatePreview() {
  const title = document.getElementById('formTitle').value.trim();
  const callsign = document.getElementById('formCallsign').value.trim();
  const price = document.getElementById('formPrice').value;
  const currency = document.getElementById('formCurrency').value;

  const previewTitle = document.getElementById('previewTitle');
  const previewCallsign = document.getElementById('previewCallsign');
  const previewPrice = document.getElementById('previewPrice');
  const previewImage = document.getElementById('previewImage');

  previewTitle.innerHTML = title || '<span class="preview-empty-state">İlan başlığı...</span>';
  previewCallsign.innerHTML = callsign || '<span class="preview-empty-state">Çağrı işareti...</span>';

  const currencySymbol = getCurrencySymbol(currency);
  const displayPrice = price && parseFloat(price) > 0 ? parseFloat(price) : 0;
  previewPrice.innerHTML = `${currencySymbol}${displayPrice} ${currency}`;
  
  if (uploadedImages.length > 0) {
    previewImage.innerHTML = `<img src="${uploadedImages[featuredImageIndex].data}" alt="Preview">`;
  } else {
    previewImage.innerHTML = '📻';
  }
}

function handleImageUpload(e) {
  const files = Array.from(e.target.files);
  const maxFiles = 5;
  
  if (uploadedImages.length + files.length > maxFiles) {
    const messageDiv = document.getElementById('formMessage');
    messageDiv.innerHTML = '<div class="error-message">Maksimum 5 görsel yükleyebilirsiniz.</div>';
    setTimeout(() => messageDiv.innerHTML = '', 3000);
    return;
  }

  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        uploadedImages.push({ data: event.target.result, name: file.name });
        renderImagePreviews();
      };
      reader.readAsDataURL(file);
    }
  });

  e.target.value = '';
}

function renderImagePreviews() {
  const container = document.getElementById('imagePreviewContainer');
  container.innerHTML = '';

  uploadedImages.forEach((image, index) => {
    const previewItem = document.createElement('div');
    previewItem.className = 'image-preview-item' + (index === featuredImageIndex ? ' featured' : '');
    
    previewItem.innerHTML = `
      <img src="${image.data}" alt="Preview ${index + 1}">
      <div class="image-preview-actions">
        <button type="button" class="image-action-btn" onclick="setFeaturedImage(${index})" title="Vitrin Fotoğrafı Yap">⭐</button>
        <button type="button" class="image-action-btn" onclick="removeImage(${index})" title="Sil">🗑️</button>
      </div>
      ${index === featuredImageIndex ? '<div class="featured-badge">VİTRİN</div>' : ''}
    `;
    
    container.appendChild(previewItem);
  });
  
  updatePreview();
}

window.setFeaturedImage = function(index) {
  featuredImageIndex = index;
  renderImagePreviews();
};

window.removeImage = function(index) {
  uploadedImages.splice(index, 1);
  if (featuredImageIndex >= uploadedImages.length) {
    featuredImageIndex = Math.max(0, uploadedImages.length - 1);
  }
  renderImagePreviews();
};

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('formSubmitBtn');
  const messageDiv = document.getElementById('formMessage');
  
  submitBtn.disabled = true;
  const isEditing = editingListing !== null;
  submitBtn.innerHTML = `<span class="loading-spinner"></span>${isEditing ? 'Kaydediliyor...' : 'Ekleniyor...'}`;
  messageDiv.innerHTML = '';

  const callsign = document.getElementById('formCallsign').value.trim();
  
  if (!userCallsign) {
    userCallsign = callsign;
    localStorage.setItem('userCallsign', callsign);
  }

  const listingData = {
    title: document.getElementById('formTitle').value.trim(),
    category: document.getElementById('formCategory').value,
    brand: document.getElementById('formBrand').value.trim(),
    model: document.getElementById('formModel').value.trim(),
    condition: document.getElementById('formCondition').value,
    price: parseFloat(document.getElementById('formPrice').value),
    currency: document.getElementById('formCurrency').value,
    description: document.getElementById('formDescription').value.trim(),
    images: uploadedImages.length > 0 ? uploadedImages : null,
    featuredImageIndex: featuredImageIndex,
    emoji: uploadedImages.length > 0 ? null : "📻",
    callsign: callsign,
    seller_name: document.getElementById('formSellerName').value.trim(),
    location: document.getElementById('formLocation').value.trim(),
    seller_email: document.getElementById('formEmail').value.trim(),
    seller_phone: document.getElementById('formPhone').value.trim()
  };

  try {
    if (isEditing) {
      await updateListing(editingListing.id, listingData);
      messageDiv.innerHTML = '<div class="success-message">İlan başarıyla güncellendi!</div>';
    } else {
      await saveListing(listingData);
      messageDiv.innerHTML = '<div class="success-message">İlanınız başarıyla eklendi!</div>';
    }
    
    await loadListings();
    populateFilterOptions();
    applyFiltersAndRender();
    
    setTimeout(() => {
      closeAddListingModal();
    }, 2000);
  } catch (error) {
    messageDiv.innerHTML = '<div class="error-message">İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.</div>';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = isEditing ? 'Değişiklikleri Kaydet' : 'İlanı Yayınla';
  }
}

function handleSearch(e) {
  currentSearch = e.target.value.toLowerCase().trim();
  currentPage = 1;
  applyFiltersAndRender();
}

function applyFiltersAndRender() {
  let filtered = allListings;

  if (currentFilter !== 'all') {
    filtered = filtered.filter(listing => listing.category === currentFilter);
  }

  if (currentConditionFilter !== 'all') {
    filtered = filtered.filter(listing => listing.condition === currentConditionFilter);
  }

  if (currentBrandFilter.length > 0) {
    filtered = filtered.filter(listing => currentBrandFilter.includes(listing.brand));
  }

  if (currentLocationFilter.length > 0) {
    filtered = filtered.filter(listing => currentLocationFilter.includes(listing.location));
  }

  if (currentPriceRangeFilter !== 'all') {
    const [min, max] = currentPriceRangeFilter.split('-').map(Number);
    filtered = filtered.filter(listing => {
      const priceInTRY = listing.currency === 'TRY' ? listing.price : listing.price * 30;
      return priceInTRY >= min && priceInTRY <= max;
    });
  }

  if (currentSearch) {
    filtered = filtered.filter(listing => {
      const searchableText = `${listing.title} ${listing.callsign} ${listing.description}`.toLowerCase();
      return searchableText.includes(currentSearch);
    });
  }

  // Sıralama işlemini uygula
  filtered = sortListings(filtered, currentSort);

  displayedListings = filtered;
  renderListings();
}

// Sıralama fonksiyonu
function sortListings(listings, sortType) {
  const sorted = [...listings];
  
  switch (sortType) {
    case 'newest':
      // Yeniden eskiye - created_at DESC
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
      
    case 'oldest':
      // Eskiden yeniye - created_at ASC
      sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      break;
      
    case 'price_asc':
      // Ucuzdan pahalıya - price ASC (TRY bazında)
      sorted.sort((a, b) => {
        const priceA = convertToTRY(a.price, a.currency);
        const priceB = convertToTRY(b.price, b.currency);
        return priceA - priceB;
      });
      break;
      
    case 'price_desc':
      // Pahalıdan ucuza - price DESC (TRY bazında)
      sorted.sort((a, b) => {
        const priceA = convertToTRY(a.price, a.currency);
        const priceB = convertToTRY(b.price, b.currency);
        return priceB - priceA;
      });
      break;
      
    case 'title_asc':
      // A'dan Z'ye - title ASC
      sorted.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
      break;
      
    case 'title_desc':
      // Z'den A'ya - title DESC
      sorted.sort((a, b) => b.title.localeCompare(a.title, 'tr'));
      break;
      
    default:
      // Varsayılan: yeniden eskiye
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  
  return sorted;
}

function renderListings() {
  const grid = document.getElementById('listingsGrid');
  const noResults = document.getElementById('noResults');
  const paginationContainer = document.getElementById('paginationContainer');

  // Toplam sayfa sayısını hesapla
  totalPages = Math.ceil(displayedListings.length / itemsPerPage);
  
  // Eğer mevcut sayfa toplam sayfadan büyükse, son sayfaya git
  if (currentPage > totalPages && totalPages > 0) {
    currentPage = totalPages;
  }
  
  // Hangi ilanların gösterileceğini hesapla
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const listingsToShow = displayedListings.slice(startIndex, endIndex);

  if (displayedListings.length === 0) {
    grid.innerHTML = '';
    paginationContainer.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }

  noResults.style.display = 'none';
  grid.innerHTML = '';

  listingsToShow.forEach(listing => {
    const card = createListingCard(listing);
    grid.appendChild(card);
  });

  // Sayfa navigasyonunu oluştur
  renderPagination();
}

function renderPagination() {
  const paginationContainer = document.getElementById('paginationContainer');
  
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  let paginationHTML = '<div class="pagination">';
  
  // Önceki sayfa butonu
  if (currentPage > 1) {
    paginationHTML += `<button class="pagination-btn prev-next" onclick="changePage(${currentPage - 1})">‹ Önceki</button>`;
  } else {
    paginationHTML += `<button class="pagination-btn prev-next disabled" disabled>‹ Önceki</button>`;
  }

  // Sayfa numaraları
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // Eğer başlangıç ve bitiş sayfaları arasında yeterli sayı yoksa, ayarla
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  // İlk sayfa ve üç nokta
  if (startPage > 1) {
    paginationHTML += `<button class="pagination-btn" onclick="changePage(1)">1</button>`;
    if (startPage > 2) {
      paginationHTML += `<span class="pagination-dots">...</span>`;
    }
  }

  // Sayfa numaraları
  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      paginationHTML += `<button class="pagination-btn active">${i}</button>`;
    } else {
      paginationHTML += `<button class="pagination-btn" onclick="changePage(${i})">${i}</button>`;
    }
  }

  // Son sayfa ve üç nokta
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<span class="pagination-dots">...</span>`;
    }
    paginationHTML += `<button class="pagination-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
  }

  // Sonraki sayfa butonu
  if (currentPage < totalPages) {
    paginationHTML += `<button class="pagination-btn prev-next" onclick="changePage(${currentPage + 1})">Sonraki ›</button>`;
  } else {
    paginationHTML += `<button class="pagination-btn prev-next disabled" disabled>Sonraki ›</button>`;
  }

  paginationHTML += '</div>';
  
  paginationContainer.innerHTML = paginationHTML;
}

// Global function olarak tanımla
window.changePage = function(page) {
  currentPage = page;
  renderListings();
  // Sayfanın başına kaydır
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function createListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.onclick = () => openDetailPanel(listing);

    let displayImage;
    let imageCountBadge = '';
    
    if (listing.images && listing.images.length > 0) {
        const featuredIndex = listing.featured_image_index || 0;
        displayImage = `<img src="${listing.images[featuredIndex].data}" alt="${listing.title}">`;
        if (listing.images.length > 1) {
            imageCountBadge = `<div class="image-count-badge">${listing.images.length} 📷</div>`;
        }
    } else {
        displayImage = listing.emoji || '📻';
    }

    const currencySymbol = getCurrencySymbol(listing.currency || 'TRY');

    // Kullanıcı kontrolü - user_id'ye göre
    const isMyListing = ativ_ajax.user_id && listing.user_id == ativ_ajax.user_id;

    card.innerHTML = `
        ${isMyListing ? '<div class="my-listings-badge">Benim İlanım</div>' : ''}
        ${imageCountBadge}
        ${isMyListing && pageType === 'my-listings' ? `
          <div class="listing-actions">
            <button class="action-btn edit-btn" onclick="event.stopPropagation(); editListing(${listing.id})" title="Düzenle" aria-label="İlanı düzenle">✏️</button>
            <button class="action-btn delete-btn" onclick="event.stopPropagation(); confirmDeleteListing(${listing.id})" title="Sil" aria-label="İlanı sil">🗑️</button>
          </div>
        ` : ''}
        <div class="listing-image">${displayImage}</div>
        <div class="listing-content">
          <h3 class="listing-title">${listing.title}</h3>
          <p class="listing-callsign">${listing.callsign}</p>
          <p class="listing-price">${currencySymbol}${listing.price} ${listing.currency || 'TRY'}</p>
        </div>
      `;

    return card;
}

window.editListing = async function(id) {
  console.log('[DEBUG] editListing called with id:', id, 'typeof:', typeof id);
  // My-listings veya gallery'den gelmiş olabilir
  let listing = null;
  const idNum = Number(id);
  // Önce allListings'den ara (gallery)
  listing = allListings.find(l => Number(l.id) === idNum);
  
  // Yoksa loadListings'i çağır ve yeniden ara
  if (!listing) {
    try {
      await loadListings();
      listing = allListings.find(l => Number(l.id) === idNum);
    } catch (e) {
      console.error('Listing yüklenemedi:', e);
    }
  }
  
  if (listing) {
    console.log('[DEBUG] editListing resolved listing id:', listing.id, 'user_id:', listing.user_id);
    openEditListingModal(listing);
  } else {
    console.warn('[DEBUG] editListing could not find listing for id:', idNum);
    alert('İlan bilgisi yüklenemedi');
  }
};

window.confirmDeleteListing = async function(id) {
  // My-listings sayfasından gelen silme işlemi için direkt title bul
  let listing = null;
  
  // Eğer sayfada listing varsa (my-listings) direkt HTML'den al
  const rowElement = document.querySelector(`[data-listing-id="${id}"]`);
  if (rowElement) {
    const titleElement = rowElement.querySelector('.listing-row-title');
    listing = {
      id: id,
      title: titleElement ? titleElement.textContent : 'İlan'
    };
  } else {
    // Yoksa allListings'den ara (gallery sayfası)
    listing = allListings.find(l => l.id === id);
  }
  
  if (!listing) {
    alert('İlan bulunamadı');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'deleteConfirmModal';
  
  modal.innerHTML = `
    <div class="delete-confirmation">
      <h3>İlanı Sil</h3>
      <p><strong>${listing.title}</strong> ilanını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
      <div class="delete-confirmation-actions">
        <button class="btn-delete-cancel" id="deleteCancelBtn">İptal</button>
        <button class="btn-delete-confirm" id="deleteConfirmBtn">Sil</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  document.getElementById('deleteCancelBtn').addEventListener('click', () => {
    modal.remove();
    document.body.style.overflow = 'auto';
  });

  document.getElementById('deleteConfirmBtn').addEventListener('click', async () => {
    const confirmBtn = document.getElementById('deleteConfirmBtn');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="loading-spinner"></span>Siliniyor...';

    try {
      await deleteListing(id);
      
      // My-listings sayfasında ise satırı sil
      if (rowElement) {
        const wrapper = rowElement.closest('.listing-row-wrapper');
        if (wrapper) {
          wrapper.remove();
        }
      } else {
        // Gallery sayfasında ise yeniden yükle
        await loadListings();
        populateFilterOptions();
        applyFiltersAndRender();
      }
      
      modal.remove();
      document.body.style.overflow = 'auto';
    } catch (error) {
      console.error('Silme işlemi başarısız:', error);
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Sil';
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target.id === 'deleteConfirmModal') {
      modal.remove();
      document.body.style.overflow = 'auto';
    }
  });
};

// Lightbox fonksiyonları
function openLightbox(images, startIndex = 0, source = 'detail') {
  if (!images || images.length === 0) return;
  
  currentImages = images;
  currentLightboxSlide = startIndex;
  isLightboxOpen = true;
  lightboxSource = source;
  
  // Lightbox HTML'ini oluştur
  const lightboxHTML = `
    <div class="lightbox-overlay active" id="lightboxOverlay">
      <button class="lightbox-close" onclick="closeLightbox()">×</button>
      
      <div class="lightbox-nav">
        <button class="lightbox-arrow prev-arrow" onclick="changeLightboxSlide(-1)">‹</button>
        <button class="lightbox-arrow next-arrow" onclick="changeLightboxSlide(1)">›</button>
      </div>
      
      <div class="lightbox-content" id="lightboxContent">
        ${images.map((image, index) => `
          <img src="${image.data}" 
               alt="İlan görseli ${index + 1}" 
               class="lightbox-image ${index === startIndex ? 'active' : ''} ${source === 'detail' ? 'zoomable' : ''}"
               ${source === 'detail' ? 'onclick="toggleZoom(this)"' : ''}
               loading="lazy">
        `).join('')}
      </div>
      
      <div class="lightbox-counter">
        ${startIndex + 1} / ${images.length}
      </div>
      
      ${images.length > 1 ? `
        <div class="lightbox-thumbnails">
          ${images.map((image, index) => `
            <div class="lightbox-thumbnail ${index === startIndex ? 'active' : ''}" 
                 onclick="goToLightboxSlide(${index})">
              <img src="${image.data}" alt="Thumbnail ${index + 1}">
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', lightboxHTML);
  document.body.style.overflow = 'hidden';
  
  // Klavye event listener'larını ekle
  document.addEventListener('keydown', handleLightboxKeydown);
}

function closeLightbox() {
  const lightbox = document.getElementById('lightboxOverlay');
  if (lightbox) {
    lightbox.remove();
  }
  isLightboxOpen = false;
  lightboxSource = '';
  document.body.style.overflow = 'auto';
  
  // Klavye event listener'larını kaldır
  document.removeEventListener('keydown', handleLightboxKeydown);
}

function changeLightboxSlide(direction) {
  if (currentImages.length === 0) return;
  
  // Mevcut slaytı gizle
  const currentImage = document.querySelector('.lightbox-image.active');
  if (currentImage) {
    currentImage.classList.remove('active');
    currentImage.classList.remove('zooming'); // Zoom'u sıfırla
    currentImage.style.transform = 'scale(1)'; // Transform'u sıfırla
  }
  
  // Thumbnail'leri güncelle
  const currentThumbnail = document.querySelector('.lightbox-thumbnail.active');
  if (currentThumbnail) {
    currentThumbnail.classList.remove('active');
  }
  
  // Yeni slaytı hesapla
  currentLightboxSlide += direction;
  
  // Sınırları kontrol et
  if (currentLightboxSlide >= currentImages.length) {
    currentLightboxSlide = 0;
  } else if (currentLightboxSlide < 0) {
    currentLightboxSlide = currentImages.length - 1;
  }
  
  // Yeni slaytı göster
  showLightboxSlide(currentLightboxSlide);
}

function goToLightboxSlide(slideIndex) {
  if (slideIndex < 0 || slideIndex >= currentImages.length) return;
  
  // Mevcut slaytı gizle
  const currentImage = document.querySelector('.lightbox-image.active');
  if (currentImage) {
    currentImage.classList.remove('active');
    currentImage.classList.remove('zooming');
    currentImage.style.transform = 'scale(1)';
  }
  
  // Thumbnail'leri güncelle
  const currentThumbnail = document.querySelector('.lightbox-thumbnail.active');
  if (currentThumbnail) {
    currentThumbnail.classList.remove('active');
  }
  
  currentLightboxSlide = slideIndex;
  showLightboxSlide(slideIndex);
}

function showLightboxSlide(slideIndex) {
  const images = document.querySelectorAll('.lightbox-image');
  const thumbnails = document.querySelectorAll('.lightbox-thumbnail');
  const counter = document.querySelector('.lightbox-counter');
  
  if (images[slideIndex]) {
    images[slideIndex].classList.add('active');
  }
  
  if (thumbnails[slideIndex]) {
    thumbnails[slideIndex].classList.add('active');
  }
  
  if (counter) {
    counter.textContent = `${slideIndex + 1} / ${currentImages.length}`;
  }
}

function handleLightboxKeydown(e) {
  if (!isLightboxOpen) return;
  
  switch(e.key) {
    case 'Escape':
      closeLightbox();
      break;
    case 'ArrowLeft':
      changeLightboxSlide(-1);
      break;
    case 'ArrowRight':
      changeLightboxSlide(1);
      break;
    case ' ':
      // Sadece detail sayfasından açılmışsa zoom yap
      if (lightboxSource === 'detail') {
        e.preventDefault();
        const currentImage = document.querySelector('.lightbox-image.active');
        if (currentImage) {
          toggleZoom(currentImage);
        }
      }
      break;
  }
}

// Zoom fonksiyonu - sadece detail sayfasında çalışır
function toggleZoom(imageElement) {
  if (lightboxSource !== 'detail') return;
  
  if (imageElement.classList.contains('zooming')) {
    // Zoom'u kapat
    imageElement.classList.remove('zooming');
    imageElement.style.transform = 'scale(1)';
    imageElement.style.cursor = 'zoom-in';
  } else {
    // Zoom'u aç
    imageElement.classList.add('zooming');
    imageElement.style.transform = 'scale(1.5)';
    imageElement.style.cursor = 'zoom-out';
  }
}

// Lightbox overlay'e tıklanınca kapatma - zoom'u da sıfırla
document.addEventListener('click', function(e) {
  if (isLightboxOpen && e.target.id === 'lightboxOverlay') {
    // Zoom açıksa kapat
    const zoomedImage = document.querySelector('.lightbox-image.zooming');
    if (zoomedImage) {
      zoomedImage.classList.remove('zooming');
      zoomedImage.style.transform = 'scale(1)';
    }
    closeLightbox();
  }
});

// Slider fonksiyonları
function initSlider(images, containerId) {
  const container = document.getElementById(containerId);
  if (!container || !images || images.length === 0) return;
  
  currentSlide = 0;
  
  // Slider HTML'ini oluştur
  let sliderHTML = `
    <div class="image-slider">
      <div class="slider-counter">1 / ${images.length}</div>
      <div class="slider-arrows">
        <button class="slider-arrow prev-arrow" onclick="changeSlide(-1, '${containerId}')">‹</button>
        <button class="slider-arrow next-arrow" onclick="changeSlide(1, '${containerId}')">›</button>
      </div>
  `;
  
  // Görselleri ekle - tıklanabilir yap (detail source ile)
  images.forEach((image, index) => {
    sliderHTML += `
      <img src="${image.data}" 
           alt="İlan görseli ${index + 1}" 
           class="slider-image ${index === 0 ? 'active' : ''}"
           onclick="openLightbox(currentImages, ${index}, 'detail')"
           loading="lazy">
    `;
  });
  
  // Navigasyon noktalarını ekle
  sliderHTML += `<div class="slider-nav">`;
  images.forEach((_, index) => {
    sliderHTML += `
      <div class="slider-dot ${index === 0 ? 'active' : ''}" 
           onclick="goToSlide(${index}, '${containerId}')"></div>
    `;
  });
  sliderHTML += `</div>`;
  
  sliderHTML += `</div>`;
  
  // Küçük resim önizlemeleri
  if (images.length > 1) {
    sliderHTML += `<div class="image-thumbnails">`;
    images.forEach((image, index) => {
      sliderHTML += `
        <div class="thumbnail ${index === 0 ? 'active' : ''}" 
             onclick="goToSlide(${index}, '${containerId}')">
          <img src="${image.data}" alt="Thumbnail ${index + 1}">
        </div>
      `;
    });
    sliderHTML += `</div>`;
  }
  
  container.innerHTML = sliderHTML;
  
  // Global currentImages'i güncelle (lightbox için)
  currentImages = images;
}

function changeSlide(direction, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const images = container.querySelectorAll('.slider-image');
  const dots = container.querySelectorAll('.slider-dot');
  const thumbnails = container.querySelectorAll('.thumbnail');
  const counter = container.querySelector('.slider-counter');
  
  if (images.length === 0) return;
  
  // Mevcut slaytı gizle
  images[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  if (thumbnails.length > 0) {
    thumbnails[currentSlide].classList.remove('active');
  }
  
  // Yeni slaytı hesapla
  currentSlide += direction;
  
  // Sınırları kontrol et
  if (currentSlide >= images.length) {
    currentSlide = 0;
  } else if (currentSlide < 0) {
    currentSlide = images.length - 1;
  }
  
  // Yeni slaytı göster
  images[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
  if (thumbnails.length > 0) {
    thumbnails[currentSlide].classList.add('active');
  }
  
  // Sayacı güncelle
  if (counter) {
    counter.textContent = `${currentSlide + 1} / ${images.length}`;
  }
}

function goToSlide(slideIndex, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const images = container.querySelectorAll('.slider-image');
  const dots = container.querySelectorAll('.slider-dot');
  const thumbnails = container.querySelectorAll('.thumbnail');
  const counter = container.querySelector('.slider-counter');
  
  if (slideIndex < 0 || slideIndex >= images.length) return;
  
  // Mevcut slaytı gizle
  images[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  if (thumbnails.length > 0) {
    thumbnails[currentSlide].classList.remove('active');
  }
  
  // Yeni slayta geç
  currentSlide = slideIndex;
  
  // Yeni slaytı göster
  images[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
  if (thumbnails.length > 0) {
    thumbnails[currentSlide].classList.add('active');
  }
  
  // Sayacı güncelle
  if (counter) {
    counter.textContent = `${currentSlide + 1} / ${images.length}`;
  }
}

// Klavye kontrolleri
document.addEventListener('keydown', function(e) {
  const detailModal = document.getElementById('detailModal');
  if (!detailModal || detailModal.style.display === 'none') return;
  
  if (e.key === 'ArrowLeft') {
    changeSlide(-1, 'detailSlider');
  } else if (e.key === 'ArrowRight') {
    changeSlide(1, 'detailSlider');
  } else if (e.key === 'Escape') {
    closeDetailPanel();
  }
});

function openDetailPanel(listing) {
  closeDetailPanel();
  
  selectedListing = listing;
  
  const currencySymbol = getCurrencySymbol(listing.currency || 'TRY');

  const detailModal = document.createElement('div');
  detailModal.className = 'detail-modal-overlay';
  detailModal.id = 'detailModal';
  detailModal.setAttribute('tabindex', '0');
  
  let imageSection;
  
  if (listing.images && listing.images.length > 0) {
    // Görsel varsa slider göster
    imageSection = `
      <div class="detail-left-section">
        <div class="detail-card-preview">
          <div id="detailSlider"></div>
          <div class="detail-preview-content">
            <h3 class="detail-preview-title">${listing.title}</h3>
            <p class="detail-preview-callsign">${listing.callsign}</p>
            <p class="detail-preview-price">${currencySymbol}${listing.price} ${listing.currency || 'TRY'}</p>
          </div>
        </div>
      </div>
    `;
  } else {
    // Görsel yoksa emoji göster
    imageSection = `
      <div class="detail-left-section">
        <div class="detail-card-preview">
          <div class="detail-preview-image">
            ${listing.emoji || '📻'}
          </div>
          <div class="detail-preview-content">
            <h3 class="detail-preview-title">${listing.title}</h3>
            <p class="detail-preview-callsign">${listing.callsign}</p>
            <p class="detail-preview-price">${currencySymbol}${listing.price} ${listing.currency || 'TRY'}</p>
          </div>
        </div>
      </div>
    `;
  }
  
  detailModal.innerHTML = `
    <div class="detail-modal-content">
      ${imageSection}
      <div class="detail-right-section">
        <div class="detail-header">
          <h2>İlan Detayı</h2>
          <button class="close-btn" id="detailCloseBtn" aria-label="Kapat">×</button>
        </div>
        <div class="detail-sections">
          ${createDetailSections(listing)}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(detailModal);
  document.body.style.overflow = 'hidden';

  // Slider'ı başlat (eğer görsel varsa)
  if (listing.images && listing.images.length > 0) {
    setTimeout(() => {
      initSlider(listing.images, 'detailSlider');
    }, 100);
  }

  // Odağı modal'a ver
  detailModal.focus();

  document.getElementById('detailCloseBtn').addEventListener('click', closeDetailPanel);
  
  detailModal.addEventListener('click', (e) => {
    if (e.target.id === 'detailModal') {
      closeDetailPanel();
    }
  });
}

// Detay bölümlerini oluşturan yardımcı fonksiyon
function createDetailSections(listing) {
  return `
    <div class="product-details">
      <h3>Ürün Bilgileri</h3>
      <div class="detail-info">
        <div class="detail-label">Marka</div>
        <div class="detail-value">${listing.brand}</div>
      </div>
      <div class="detail-info">
        <div class="detail-label">Model</div>
        <div class="detail-value">${listing.model}</div>
      </div>
      <div class="detail-info">
        <div class="detail-label">Durum</div>
        <div class="detail-value">${listing.condition}</div>
      </div>
      <div class="detail-info">
        <div class="detail-label">Kategori</div>
        <div class="detail-value">${getCategoryName(listing.category)}</div>
      </div>
      <div class="detail-info">
        <div class="detail-label">Fiyat</div>
        <div class="detail-value">${getCurrencySymbol(listing.currency || 'TRY')}${listing.price} ${listing.currency || 'TRY'}</div>
      </div>
    </div>
    <div class="product-details">
      <h3>Açıklama</h3>
      <div class="detail-description">
        <p>${listing.description}</p>
      </div>
    </div>
    <div class="seller-section">
      <h3>Satıcı Bilgileri</h3>
      <div class="detail-info">
        <div class="detail-label">Ad Soyad</div>
        <div class="detail-value">${listing.seller_name}</div>
      </div>
      <div class="detail-info">
        <div class="detail-label">Çağrı İşareti</div>
        <div class="detail-value">${listing.callsign}</div>
      </div>
      <div class="detail-info">
        <div class="detail-label">Konum</div>
        <div class="detail-value">${listing.location}</div>
      </div>
      <div class="detail-info">
        <div class="detail-label">E-posta</div>
        <div class="detail-value">${listing.seller_email}</div>
      </div>
      <div class="detail-info">
        <div class="detail-label">Telefon</div>
        <div class="detail-value">${listing.seller_phone}</div>
      </div>
    </div>
  `;
}

function closeDetailPanel() {
  const detailModal = document.getElementById('detailModal');
  if (detailModal) {
    detailModal.remove();
    document.body.style.overflow = 'auto';
  }
  selectedListing = null;
}

function getCategoryName(category) {
  const categories = {
    'transceiver': 'Telsiz',
    'antenna': 'Anten',
    'amplifier': 'Amplifikatör',
    'accessory': 'Aksesuar',
    'other': 'Diğer'
  };
  return categories[category] || category;
}

function getCurrencySymbol(currency) {
  const symbols = {
    'TRY': '₺',
    'USD': '$',
    'EUR': '€'
  };
  return symbols[currency] || '';
}

/**
 * Toggle accordion detail section for a listing row
 * @param {HTMLElement} titleElement - The h3.listing-row-title element that was clicked
 */
function toggleListingDetails(titleElement) {
  if (!titleElement) return;

  // Find the parent listing-row
  const listingRow = titleElement.closest('.listing-row');
  if (!listingRow) return;

  // Find the parent wrapper
  const wrapper = listingRow.closest('.listing-row-wrapper');
  if (!wrapper) return;

  // Find all accordion sections within this wrapper
  const detailsElement = wrapper.querySelector('.listing-row-details-expanded');
  if (!detailsElement) {
    console.error('Accordion details element not found in wrapper');
    return;
  }

  // Close any other open accordion sections
  document.querySelectorAll('.listing-row-details-expanded.expanded').forEach(element => {
    if (element !== detailsElement) {
      element.classList.remove('expanded');
    }
  });

  // Toggle current accordion
  const isExpanded = detailsElement.classList.contains('expanded');
  
  if (isExpanded) {
    detailsElement.classList.remove('expanded');
  } else {
    detailsElement.classList.add('expanded');
  }
}

document.addEventListener('DOMContentLoaded', initApp);