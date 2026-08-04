
  console.log("App generated using GAS WebApp Builder");
  const API_URL = 'https://script.google.com/macros/s/AKfycbztTLWWLOz5Gpny__wMaJ-AOtTiIW85t5Vkkm0O9V6rGmRwYhTiZW1OEmN0qIt8hNq-/exec';
async function apiRequest(action, payload = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({
      action: action,
      ...payload,
      sessionToken: sessionToken || ''
    })
  });

  if (!response.ok) {
    throw new Error(
      'HTTP ' + response.status + ': gagal menghubungi backend'
    );
  }

  const result = await response.json();

  if (result.code === 'SESSION_INVALID') {
    currentUser = null;
    sessionToken = '';

    document
      .getElementById('mainSection')
      ?.classList.add('hidden');

    document
      .getElementById('authSection')
      ?.classList.remove('hidden');

    showToast(
      result.message ||
      'Sesi login telah berakhir. Silakan login kembali.',
      false
    );

    throw new Error(
      result.message ||
      'Sesi login telah berakhir.'
    );
  }

  return result;
}
async function testApiConnection() {
  try {
    const result = await apiRequest('ping');

    console.log('Hasil koneksi API:', result);

    if (result.status === 'success') {
      showToast('Koneksi backend berhasil!', true);
    } else {
      showToast(result.message || 'Koneksi backend gagal.', false);
    }
  } catch (error) {
    console.error('Kesalahan koneksi API:', error);
    showToast('Tidak dapat terhubung ke backend.', false);
  }
}

  let currentUser = null;
  let sessionToken = '';
  let appData = { proyek: [], tenagaKerja: [], pembinaan: [], pendaftaran: [], bujk: [], users: [], pengawasan: [] };
  let dashboardMap = null;
  let mapMarkersGroup = null;

  function showLoading() {
    document.getElementById('loadingOverlay')?.classList.remove('hidden');
  }

  function endLoading() {
    document.getElementById('loadingOverlay')?.classList.add('hidden');
  }

  function showToast(msg, isSuccess = true) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    if (!toast) return;

    toastMsg.innerText = msg;
    if (isSuccess) {
      toastIcon.className = 'fas fa-check-circle text-emerald-400 text-xl';
    } else {
      toastIcon.className = 'fas fa-exclamation-circle text-rose-400 text-xl';
    }

    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(hideToast, 4000);
  }

  function hideToast() {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.classList.add('translate-y-20', 'opacity-0');
    toast.classList.remove('translate-y-0', 'opacity-100');
  }

  function toggleAuthCard(card) {
    if (card === 'register') {
      document.getElementById('loginCard').classList.add('hidden');
      document.getElementById('registerCard').classList.remove('hidden');
    } else {
      document.getElementById('registerCard').classList.add('hidden');
      document.getElementById('loginCard').classList.remove('hidden');
    }
  }

async function handleLogin(e) {
  e.preventDefault();

  const username = document
    .getElementById('loginUsername')
    .value
    .trim();

  const password = document
    .getElementById('loginPassword')
    .value
    .trim();

  if (!username || !password) {
    showToast('Username dan password wajib diisi.', false);
    return;
  }

  showLoading();

  try {
    const res = await apiRequest('login', {
      username: username,
      password: password
    });

    endLoading();

    if (res && res.status === 'success') {
      currentUser = res.user;
      sessionToken = res.sessionToken || '';

      setupUserSession();

      showToast(
        'Selamat datang, ' +
        (currentUser.fullName || currentUser.username) +
        '!'
      );

      loadAllData();
    } else {
      showToast(
        res && res.message
          ? res.message
          : 'Username atau password salah!',
        false
      );
    }
  } catch (error) {
    endLoading();

    console.error('Login error:', error);

    showToast(
      'Tidak dapat terhubung ke backend login.',
      false
    );
  }
}
async function handleRegister(e) {
  e.preventDefault();

  const payload = {
    fullName: document.getElementById('regFullName').value.trim(),
    username: document.getElementById('regUsername').value.trim(),
    password: document.getElementById('regPassword').value.trim(),
    email: document.getElementById('regEmail').value.trim(),
    phone: document.getElementById('regPhone').value.trim()
  };

  if (
    !payload.fullName ||
    !payload.username ||
    !payload.password ||
    !payload.email ||
    !payload.phone
  ) {
    showToast('Semua data registrasi wajib diisi.', false);
    return;
  }

  showLoading();

  try {
    const res = await apiRequest(
      'registerPublicUser',
      payload
    );

    endLoading();

    if (res && res.status === 'success') {
      showToast(
        res.message || 'Registrasi akun berhasil!',
        true
      );

      document.getElementById('regFullName').value = '';
      document.getElementById('regUsername').value = '';
      document.getElementById('regPassword').value = '';
      document.getElementById('regEmail').value = '';
      document.getElementById('regPhone').value = '';

      toggleAuthCard('login');
    } else {
      showToast(
        res && res.message
          ? res.message
          : 'Registrasi akun gagal.',
        false
      );
    }
  } catch (error) {
    endLoading();

    console.error('Register error:', error);

    showToast(
      'Tidak dapat terhubung ke backend registrasi.',
      false
    );
  }
}

  function setupUserSession() {
    if (!currentUser) return;

    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('mainSection').classList.remove('hidden');

    document.getElementById('userNameDisplay').innerText = currentUser.fullName || currentUser.username;
    document.getElementById('userRoleBadge').innerText = currentUser.role || 'User';
    document.getElementById('userAvatar').innerText = (currentUser.fullName || currentUser.username).charAt(0).toUpperCase();

    const isStaffOrAdmin = currentUser.role === 'Admin' || currentUser.role === 'Staff';
    const isAdmin = currentUser.role === 'Admin';

    document.querySelectorAll('.role-staff-admin').forEach(el => {
      if (isStaffOrAdmin) el.classList.remove('hidden');
      else el.classList.add('hidden');
    });

    document.querySelectorAll('.role-admin').forEach(el => {
      if (isAdmin) el.classList.remove('hidden');
      else el.classList.add('hidden');
    });

    const lblPendaftaran = document.getElementById('lblNavPendaftaran');
    if (lblPendaftaran) {
      lblPendaftaran.innerText = currentUser.role === 'Public' ? 'Pendaftaran Saya' : 'Kelola Pendaftaran';
    }

    switchTab('dashboard');
  }

  function handleLogout() {
    currentUser = null;
    sessionToken = '';
    document.getElementById('mainSection').classList.add('hidden');
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    showToast('Anda telah keluar dari aplikasi.');
  }

async function loadAllData() {
  showLoading();

  try {
    const res = await apiRequest('getInitialData');

    endLoading();

    if (res && res.status === 'success') {
      appData = {
        proyek: res.proyek || [],
        tenagaKerja: res.tenagaKerja || [],
        pembinaan: res.pembinaan || [],
        pendaftaran: res.pendaftaran || [],
        bujk: res.bujk || [],
        users: res.users || [],
        pengawasan: res.pengawasan || []
      };

      renderAllViews();
      showToast('Data Spreadsheet berhasil dimuat!', true);
    } else {
      showToast(
        'Gagal memuat data: ' +
        (res && res.message ? res.message : 'Respons backend tidak valid'),
        false
      );
    }
 } catch (error) {
  endLoading();

  console.error('Load data error:', error);

  if (
    String(error.message || '').includes('sesi') ||
    String(error.message || '').includes('Token sesi')
  ) {
    return;
  }

  showToast(
    'Tidak dapat memuat data dari Spreadsheet.',
    false
  );
}
}

  function renderAllViews() {
    renderDashboard();
    renderBUJKTable();
    renderProyekTable();
    renderTKTable();
    renderPembinaanGrid();
    renderPendaftaranTable();
    renderPengawasanTable();
    renderUsersTable();
  }

  function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.remove('text-amber-400', 'bg-slate-800');
      el.classList.add('text-slate-400');
    });

    document.getElementById('tab-' + tabName)?.classList.remove('hidden');
    const activeNav = document.getElementById('nav-' + tabName);
    if (activeNav) {
      activeNav.classList.add('text-amber-400', 'bg-slate-800');
      activeNav.classList.remove('text-slate-400');
    }

    if (tabName === 'dashboard') {
      setTimeout(() => {
        if (dashboardMap) dashboardMap.invalidateSize();
      }, 150);
    }

    const titles = {
      dashboard: 'Dashboard Utama',
      bujk: 'Informasi Badan Usaha Jasa Konstruksi (BUJK)',
      proyek: 'Data Proyek Konstruksi',
      tenagaKerja: 'Data Tenaga Kerja Konstruksi',
      pembinaan: 'Program Pembinaan & Pelatihan',
      pengawasan: 'Modul Pengawasan Proyek & K3',
      pendaftaran: currentUser?.role === 'Public' ? 'Riwayat Pendaftaran Saya' : 'Kelola Pendaftaran Peserta',
      users: 'Pengelolaan Akun Pengguna'
    };
    document.getElementById('pageTitle').innerText = titles[tabName] || 'SI-BIKON';
  }

  function renderDashboard() {
    document.getElementById('statTotalBUJK').innerText = (appData.bujk || []).length;
    document.getElementById('statTotalProyek').innerText = (appData.proyek || []).length;
    document.getElementById('statTotalTK').innerText = (appData.tenagaKerja || []).length;
    document.getElementById('statTotalPembinaan').innerText = (appData.pembinaan || []).length;
    document.getElementById('statTotalPendaftaran').innerText = (appData.pendaftaran || []).length;

    const pemBox = document.getElementById('dashPembinaanList');
    if (pemBox) {
      if ((appData.pembinaan || []).length === 0) {
        pemBox.innerHTML = '<p class="text-xs text-slate-400 italic">Belum ada agenda pembinaan.</p>';
      } else {
        pemBox.innerHTML = appData.pembinaan.slice(0, 3).map(p => 
          '<div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">' +
            '<div>' +
              '<p class="font-semibold text-xs text-slate-800">' + p.judulPembinaan + '</p>' +
              '<p class="text-[11px] text-slate-500"><i class="far fa-calendar-alt mr-1"></i> ' + p.tglPelaksanaan + ' | <i class="fas fa-map-marker-alt mr-1"></i> ' + p.lokasi + '</p>' +
            '</div>' +
            '<span class="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg">' + p.status + '</span>' +
          '</div>'
        ).join('');
      }
    }

    const prjBox = document.getElementById('dashProyekList');

if (prjBox) {
  const proyekList = appData.proyek || [];

  if (proyekList.length === 0) {
    prjBox.innerHTML =
      '<p class="text-xs text-slate-400 italic">' +
      'Belum ada data proyek.' +
      '</p>';
  } else {
    prjBox.className =
      'space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar';

    prjBox.innerHTML = proyekList.map(p =>
      '<div class="' +
        'p-3 rounded-xl bg-slate-50 border border-slate-100 ' +
        'flex items-center justify-between gap-3' +
      '">' +

        '<div class="min-w-0 flex-1">' +
          '<p class="' +
            'font-semibold text-xs text-slate-800 truncate' +
          '">' +
            (p.judulProyek || '-') +
          '</p>' +

          '<p class="' +
            'text-[11px] text-slate-500 truncate' +
          '">' +
            'Nilai: Rp ' +
            Number(p.nilaiProyek || 0).toLocaleString('id-ID') +
            ' | PPTK: ' +
            (p.pptkBidang || '-') +
          '</p>' +
        '</div>' +

        '<span class="' +
          'shrink-0 px-2 py-1 bg-blue-100 text-blue-800 ' +
          'text-[10px] font-bold rounded-lg' +
        '">' +
          (p.status || '-') +
        '</span>' +

      '</div>'
    ).join('');
  }
}


    renderDashboardMap();
  }
function parseCoordinate(value) {
  if (typeof value === 'number') {
    return value;
  }

  let text = String(value ?? '').trim();

  if (!text) {
    return NaN;
  }

  // Hilangkan spasi
  text = text.replace(/\s/g, '');

  /*
   * Format Indonesia:
   * 5,2036  menjadi 5.2036
   * 96,7009 menjadi 96.7009
   */
  if (text.includes(',') && !text.includes('.')) {
    text = text.replace(',', '.');
  }

  /*
   * Jika terdapat titik dan koma:
   * 1.234,567 menjadi 1234.567
   */
  if (text.includes('.') && text.includes(',')) {
    text = text.replace(/\./g, '').replace(',', '.');
  }

  return Number(text);
}
  function renderDashboardMap() {
  const mapElement = document.getElementById('mapDashboard');

  if (!mapElement) return;

  if (typeof L === 'undefined') {
    setTimeout(renderDashboardMap, 300);
    return;
  }

  if (!dashboardMap) {
    dashboardMap = L
      .map('mapDashboard')
      .setView([5.2013, 96.7011], 13);

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }
    ).addTo(dashboardMap);

    mapMarkersGroup = L.layerGroup().addTo(dashboardMap);
  } else {
    mapMarkersGroup.clearLayers();
  }

  setTimeout(function () {
    dashboardMap.invalidateSize();
  }, 250);

  const proyeks = appData.proyek || [];
  const bounds = [];

  proyeks.forEach(function (p) {
    const lat = parseCoordinate(p.lat);
    const lng = parseCoordinate(p.lng);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      console.warn(
        'Koordinat proyek tidak valid:',
        p.id,
        p.lat,
        p.lng
      );
      return;
    }

    bounds.push([lat, lng]);

    let pinColor = '#3b82f6';
    let iconFa = 'fa-building';

    if (p.status === 'Selesai') {
      pinColor = '#10b981';
      iconFa = 'fa-check-circle';
    } else if (p.status === 'Perencanaan') {
      pinColor = '#f59e0b';
      iconFa = 'fa-drafting-compass';
    } else if (p.status === 'Dibatalkan') {
      pinColor = '#f43f5e';
      iconFa = 'fa-times-circle';
    }

    const markerHtml =
      '<div style="position:relative;width:32px;height:32px;">' +
        '<div class="marker-pulse-ring" ' +
          'style="background-color:' + pinColor + ';">' +
        '</div>' +
        '<div style="' +
          'background-color:' + pinColor + ';' +
          'width:32px;' +
          'height:32px;' +
          'border-radius:50%;' +
          'border:3px solid #ffffff;' +
          'box-shadow:0 4px 12px rgba(0,0,0,0.35);' +
          'display:flex;' +
          'align-items:center;' +
          'justify-content:center;' +
          'color:white;' +
          'font-size:13px;' +
          'position:relative;' +
          'z-index:2;' +
        '">' +
          '<i class="fas ' + iconFa + '"></i>' +
        '</div>' +
      '</div>';

    const customIcon = L.divIcon({
      className: 'custom-proyek-marker',
      html: markerHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18]
    });

    const popupContent =
      '<div style="' +
        'font-family:Inter,sans-serif;' +
        'min-width:210px;' +
        'padding:4px;' +
      '">' +
        '<div style="' +
          'font-size:10px;' +
          'font-weight:700;' +
          'color:#d97706;' +
          'text-transform:uppercase;' +
          'margin-bottom:2px;' +
        '">' +
          (p.pptkBidang || 'Proyek Konstruksi') +
        '</div>' +

        '<h4 style="' +
          'font-size:13px;' +
          'font-weight:700;' +
          'color:#0f172a;' +
          'margin:0 0 6px 0;' +
        '">' +
          (p.judulProyek || '-') +
        '</h4>' +

        '<p style="' +
          'font-size:11px;' +
          'color:#64748b;' +
          'margin:0 0 4px 0;' +
        '">' +
          '<b>No. Kontrak:</b> ' +
          (p.noKontrak || '-') +
        '</p>' +

        '<p style="' +
          'font-size:11px;' +
          'color:#64748b;' +
          'margin:0 0 4px 0;' +
        '">' +
          '<b>Koordinat:</b> ' +
          lat.toFixed(6) +
          ', ' +
          lng.toFixed(6) +
        '</p>' +

        '<p style="' +
          'font-size:11px;' +
          'color:#64748b;' +
          'margin:0 0 8px 0;' +
        '">' +
          '<b>Nilai:</b> Rp ' +
          Number(p.nilaiProyek || 0).toLocaleString('id-ID') +
        '</p>' +

        '<div style="' +
          'display:inline-block;' +
          'padding:3px 10px;' +
          'border-radius:9999px;' +
          'font-size:10px;' +
          'font-weight:700;' +
          'background-color:' + pinColor + '20;' +
          'color:' + pinColor + ';' +
        '">' +
          (p.status || '-') +
        '</div>' +
      '</div>';

    L.marker([lat, lng], {
      icon: customIcon
    })
      .bindPopup(popupContent)
      .addTo(mapMarkersGroup);
  });

  if (bounds.length === 1) {
    dashboardMap.setView(bounds[0], 15);
  } else if (bounds.length > 1) {
    dashboardMap.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 15
    });
  }
}


  function renderBUJKTable() {
    const q = (document.getElementById('searchBUJK')?.value || '').toLowerCase();
    const list = appData.bujk || [];
    const filtered = list.filter(b => 
      String(b.namaBujk).toLowerCase().includes(q) ||
      String(b.nib).toLowerCase().includes(q) ||
      String(b.pjbu).toLowerCase().includes(q)
    );

    const isStaffOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Staff';
    const tbody = document.getElementById('tblBUJK');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="p-6 text-center text-slate-400 text-xs">Tidak ada data BUJK ditemukan.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(b => {
      const badgeClass = b.statusSbu === 'Aktif' ? 'bg-emerald-100 text-emerald-800' :
        b.statusSbu === 'Masa Perpanjangan' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800';

      return (
        '<tr class="hover:bg-slate-50/80 transition">' +
          '<td class="p-4 font-semibold text-slate-800">' + b.namaBujk + ' <br><span class="text-[10px] font-mono text-slate-400">' + b.id + '</span></td>' +
          '<td class="p-4 font-mono text-xs text-slate-600">' + b.nib + '</td>' +
          '<td class="p-4 text-slate-700 font-medium text-xs">' + b.pjbu + '</td>' +
          '<td class="p-4 text-xs text-slate-600">' + b.kualifikasi + '</td>' +
          '<td class="p-4 text-xs text-slate-600">' + b.klasifikasi + '</td>' +
          '<td class="p-4 text-xs text-slate-600">' + b.alamat + ' <br><span class="text-amber-600">' + (b.noTelepon || '-') + '</span></td>' +
          '<td class="p-4"><span class="px-2.5 py-1 text-xs font-semibold rounded-full ' + badgeClass + '">' + b.statusSbu + '</span></td>' +
          '<td class="p-4 text-center ' + (isStaffOrAdmin ? '' : 'hidden') + '">' +
            '<div class="flex items-center justify-center space-x-2">' +
              '<button onclick="editBUJK(\'' + b.id + '\')" class="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs" title="Edit"><i class="fas fa-edit"></i></button>' +
              '<button onclick="deleteBUJKItem(\'' + b.id + '\')" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs" title="Hapus"><i class="fas fa-trash-alt"></i></button>' +
            '</div>' +
          '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function openModalBUJK(data = null) {
    document.getElementById('bujkId').value = data ? data.id : '';
    document.getElementById('bujkNama').value = data ? data.namaBujk : '';
    document.getElementById('bujkNib').value = data ? data.nib : '';
    document.getElementById('bujkPjbu').value = data ? data.pjbu : '';
    document.getElementById('bujkKualifikasi').value = data ? data.kualifikasi : 'Kecil';
    document.getElementById('bujkKlasifikasi').value = data ? data.klasifikasi : '';
    document.getElementById('bujkAlamat').value = data ? data.alamat : '';
    document.getElementById('bujkTelepon').value = data ? data.noTelepon : '';
    document.getElementById('bujkStatusSbu').value = data ? data.statusSbu : 'Aktif';

    document.getElementById('modalBUJKTitle').innerText = data ? 'Edit BUJK' : 'Tambah BUJK Baru';
    document.getElementById('modalBUJK').classList.remove('hidden');
  }

  function editBUJK(id) {
    const item = (appData.bujk || []).find(b => b.id === id);
    if (item) openModalBUJK(item);
  }

async function handleSaveBUJK(e) {
  e.preventDefault();

  const payload = {
    id: document.getElementById('bujkId').value.trim(),
    namaBujk: document.getElementById('bujkNama').value.trim(),
    nib: document.getElementById('bujkNib').value.trim(),
    pjbu: document.getElementById('bujkPjbu').value.trim(),
    kualifikasi: document.getElementById('bujkKualifikasi').value,
    klasifikasi: document.getElementById('bujkKlasifikasi').value.trim(),
    alamat: document.getElementById('bujkAlamat').value.trim(),
    noTelepon: document.getElementById('bujkTelepon').value.trim(),
    statusSbu: document.getElementById('bujkStatusSbu').value
  };

  if (
    !payload.namaBujk ||
    !payload.nib ||
    !payload.pjbu ||
    !payload.klasifikasi ||
    !payload.alamat
  ) {
    showToast('Data wajib BUJK belum lengkap.', false);
    return;
  }

  showLoading();

  try {
    const res = await apiRequest('saveBUJK', payload);

    endLoading();

    if (res && res.status === 'success') {
      closeModal('modalBUJK');

      showToast(
        res.message || 'Data BUJK berhasil disimpan!',
        true
      );

      await loadAllData();
    } else {
      showToast(
        res && res.message
          ? res.message
          : 'Data BUJK gagal disimpan.',
        false
      );
    }
  } catch (error) {
    endLoading();

    console.error('Save BUJK error:', error);

    showToast(
      'Tidak dapat menyimpan data BUJK ke Spreadsheet.',
      false
    );
  }
}

async function deleteBUJKItem(id) {
  const isConfirmed = confirm(
    'Apakah Anda yakin ingin menghapus data BUJK ini?'
  );

  if (!isConfirmed) {
    return;
  }

  showLoading();

  try {
    const res = await apiRequest('deleteBUJK', {
      id: id
    });

    endLoading();

    if (res && res.status === 'success') {
      showToast(
        res.message || 'Data BUJK berhasil dihapus!',
        true
      );

      await loadAllData();
    } else {
      showToast(
        res && res.message
          ? res.message
          : 'Data BUJK gagal dihapus.',
        false
      );
    }
  } catch (error) {
    endLoading();

    console.error('Delete BUJK error:', error);

    showToast(
      'Tidak dapat menghapus data BUJK dari Spreadsheet.',
      false
    );
  }
}

  function renderProyekTable() {
    const q = (document.getElementById('searchProyek')?.value || '').toLowerCase();
    const list = appData.proyek || [];
    const filtered = list.filter(p => 
      String(p.judulProyek).toLowerCase().includes(q) ||
      String(p.noKontrak).toLowerCase().includes(q) ||
      String(p.pptkBidang).toLowerCase().includes(q)
    );

    const isStaffOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Staff';
    const tbody = document.getElementById('tblProyek');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-400 text-xs">Tidak ada data proyek ditemukan.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(p => {
      const badgeClass = p.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' :
        p.status === 'Sedang Berjalan' ? 'bg-blue-100 text-blue-800' :
        p.status === 'Perencanaan' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800';

      return (
        '<tr class="hover:bg-slate-50/80 transition">' +
          '<td class="p-4 font-semibold text-slate-800">' + p.judulProyek + ' <br><span class="text-[10px] font-mono text-slate-400">' + p.id + '</span></td>' +
          '<td class="p-4 font-mono text-xs text-slate-600">' + (p.noKontrak || '-') + '</td>' +
          '<td class="p-4 font-semibold text-slate-800 text-xs">Rp ' + Number(p.nilaiProyek || 0).toLocaleString('id-ID') + '</td>' +
          '<td class="p-4 text-xs text-slate-600">' + (p.tahun || '-') + '</td>' +
          '<td class="p-4 text-xs text-slate-600">' + (p.pptkBidang || '-') + '</td>' +
          '<td class="p-4"><span class="px-2.5 py-1 text-xs font-semibold rounded-full ' + badgeClass + '">' + p.status + '</span></td>' +
          '<td class="p-4 text-center ' + (isStaffOrAdmin ? '' : 'hidden') + '">' +
            '<div class="flex items-center justify-center space-x-2">' +
              '<button onclick="editProyek(\'' + p.id + '\')" class="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs" title="Edit"><i class="fas fa-edit"></i></button>' +
              '<button onclick="deleteProyekItem(\'' + p.id + '\')" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs" title="Hapus"><i class="fas fa-trash-alt"></i></button>' +
            '</div>' +
          '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function openModalProyek(data = null) {
    document.getElementById('proyekId').value = data ? data.id : '';
    document.getElementById('proyekJudul').value = data ? data.judulProyek : '';
    document.getElementById('proyekNoKontrak').value = data ? data.noKontrak : '';
    document.getElementById('proyekTahun').value = data ? data.tahun : new Date().getFullYear();
    document.getElementById('proyekNilai').value = data ? data.nilaiProyek : '';
    document.getElementById('proyekStatus').value = data ? data.status : 'Sedang Berjalan';
    document.getElementById('proyekPPTK').value = data ? data.pptkBidang : '';
    document.getElementById('proyekLat').value = data ? (data.lat || '') : '';
    document.getElementById('proyekLng').value = data ? (data.lng || '') : '';

    document.getElementById('modalProyekTitle').innerText = data ? 'Edit Proyek' : 'Tambah Proyek Baru';
    document.getElementById('modalProyek').classList.remove('hidden');
  }

  function editProyek(id) {
    const item = (appData.proyek || []).find(p => p.id === id);
    if (item) openModalProyek(item);
  }

async function handleSaveProyek(e) {
  e.preventDefault();

  const lat = parseCoordinate(
    document.getElementById('proyekLat').value
  );

  const lng = parseCoordinate(
    document.getElementById('proyekLng').value
  );

  if (
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90
  ) {
    showToast(
      'Latitude tidak valid. Contoh: 5.203600',
      false
    );
    return;
  }

  if (
    !Number.isFinite(lng) ||
    lng < -180 ||
    lng > 180
  ) {
    showToast(
      'Longitude tidak valid. Contoh: 96.700900',
      false
    );
    return;
  }

  const payload = {
    id: document.getElementById('proyekId').value.trim(),
    judulProyek: document
      .getElementById('proyekJudul')
      .value
      .trim(),
    noKontrak: document
      .getElementById('proyekNoKontrak')
      .value
      .trim(),
    tahun: document.getElementById('proyekTahun').value,
    nilaiProyek: document.getElementById('proyekNilai').value,
    status: document.getElementById('proyekStatus').value,
    pptkBidang: document
      .getElementById('proyekPPTK')
      .value
      .trim(),
    lat: lat,
    lng: lng
  };

  if (
    !payload.judulProyek ||
    !payload.noKontrak ||
    !payload.tahun ||
    !payload.nilaiProyek ||
    !payload.pptkBidang
  ) {
    showToast(
      'Data wajib proyek belum lengkap.',
      false
    );
    return;
  }

  showLoading();

  try {
    const res = await apiRequest(
      'saveProyek',
      payload
    );

    endLoading();

    if (res && res.status === 'success') {
      closeModal('modalProyek');

      showToast(
        res.message || 'Data proyek berhasil disimpan!',
        true
      );

      await loadAllData();
    } else {
      showToast(
        res && res.message
          ? res.message
          : 'Data proyek gagal disimpan.',
        false
      );
    }
  } catch (error) {
    endLoading();

    console.error('Save proyek error:', error);

    showToast(
      'Tidak dapat menyimpan data proyek ke Spreadsheet.',
      false
    );
  }
}

async function deleteProyekItem(id) {
  const isConfirmed = confirm(
    'Apakah Anda yakin ingin menghapus proyek ini?'
  );

  if (!isConfirmed) {
    return;
  }

  showLoading();

  try {
    const res = await apiRequest('deleteProyek', {
      id: id
    });

    endLoading();

    if (res && res.status === 'success') {
      showToast(
        res.message || 'Proyek berhasil dihapus!',
        true
      );

      await loadAllData();
    } else {
      showToast(
        res && res.message
          ? res.message
          : 'Proyek gagal dihapus.',
        false
      );
    }
  } catch (error) {
    endLoading();

    console.error('Delete proyek error:', error);

    showToast(
      'Tidak dapat menghapus proyek dari Spreadsheet.',
      false
    );
  }
}

  function renderTKTable() {
    const q = (document.getElementById('searchTK')?.value || '').toLowerCase();
    const list = appData.tenagaKerja || [];
    const filtered = list.filter(t => 
      String(t.nama).toLowerCase().includes(q) ||
      String(t.nik).toLowerCase().includes(q) ||
      String(t.noSertifikat).toLowerCase().includes(q)
    );

    const isStaffOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Staff';
    const tbody = document.getElementById('tblTenagaKerja');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="12" class="p-6 text-center text-slate-400 text-xs">Tidak ada data tenaga kerja ditemukan.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(t => 
      '<tr class="hover:bg-slate-50/80 transition">' +
        '<td class="p-4 font-semibold text-slate-800">' + t.nama + '</td>' +
        '<td class="p-4 text-slate-600 font-mono text-xs">' + t.nik + '</td>' +
        '<td class="p-4 text-slate-600 text-xs">' + t.noHp + '</td>' +
        '<td class="p-4 text-slate-600 text-xs">' + t.klasifikasi + '</td>' +
        '<td class="p-4 text-slate-600 text-xs">' + t.subklasifikasi + '</td>' +
        '<td class="p-4 text-slate-600 text-xs">' + t.jabatan + '</td>' +
        '<td class="p-4 text-slate-600 font-medium text-xs">' + t.noSertifikat + '</td>' +
        '<td class="p-4 text-slate-600 font-medium text-xs">' + t.kualifikasi + '</td>' +
        '<td class="p-4 text-slate-600 font-medium text-xs">' + t.jenjang + '</td>' +
        '<td class="p-4 text-slate-600 text-xs">' + t.tglSertifikat + '</td>' +
        '<td class="p-4"><span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">' + t.status + '</span></td>' +
        '<td class="p-4 text-center ' + (isStaffOrAdmin ? '' : 'hidden') + '">' +
          '<div class="flex items-center justify-center space-x-2">' +
            '<button onclick="editTK(\'' + t.id + '\')" class="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs"><i class="fas fa-edit"></i></button>' +
            '<button onclick="deleteTKItem(\'' + t.id + '\')" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs"><i class="fas fa-trash-alt"></i></button>' +
          '</div>' +
        '</td>' +
      '</tr>'
    ).join('');
  }

  function openModalTK(data = null) {
    document.getElementById('tkId').value = data ? data.id : '';
    document.getElementById('tkNama').value = data ? data.nama : '';
    document.getElementById('tkNik').value = data ? data.nik : '';
    document.getElementById('tkHp').value = data ? data.noHp : '';
    document.getElementById('tkklasifikasi').value = data ? data.klasifikasi : '';
    document.getElementById('tksubklasifikasi').value = data ? data.subklasifikasi : '';
    document.getElementById('tkjabatan').value = data ? data.jabatan : '';
    document.getElementById('tkSertifikat').value = data ? data.noSertifikat : '';
    document.getElementById('tkkualifikasi').value = data ? data.kualifikasi : 'Operator';
    document.getElementById('tkjenjang').value = data ? data.jenjang : '';
    document.getElementById('tktglSertifikat').value = data ? data.tglSertifikat : '';
    document.getElementById('tkStatus').value = data ? data.status : 'Aktif';

    document.getElementById('modalTKTitle').innerText = data ? 'Edit Tenaga Kerja' : 'Tambah Tenaga Kerja';
    document.getElementById('modalTK').classList.remove('hidden');
  }

  function editTK(id) {
    const item = (appData.tenagaKerja || []).find(t => t.id === id);
    if (item) openModalTK(item);
  }

async function handleSaveTK(e) {
  e.preventDefault();

  const payload = {
    id: document.getElementById('tkId').value.trim(),
    nama: document.getElementById('tkNama').value.trim(),
    nik: document.getElementById('tkNik').value.trim(),
    noHp: document.getElementById('tkHp').value.trim(),
    klasifikasi: document.getElementById('tkklasifikasi').value.trim(),
    subklasifikasi: document
      .getElementById('tksubklasifikasi')
      .value
      .trim(),
    jabatan: document.getElementById('tkjabatan').value.trim(),
    noSertifikat: document
      .getElementById('tkSertifikat')
      .value
      .trim(),
    kualifikasi: document.getElementById('tkkualifikasi').value,
    jenjang: document.getElementById('tkjenjang').value.trim(),
    tglSertifikat: document.getElementById('tktglSertifikat').value,
    status: document.getElementById('tkStatus').value
  };

  if (
    !payload.nama ||
    !payload.nik ||
    !payload.noHp ||
    !payload.klasifikasi ||
    !payload.subklasifikasi ||
    !payload.jabatan ||
    !payload.noSertifikat ||
    !payload.jenjang ||
    !payload.tglSertifikat
  ) {
    showToast(
      'Data wajib tenaga kerja belum lengkap.',
      false
    );
    return;
  }

  showLoading();

  try {
    const res = await apiRequest(
      'saveTenagaKerja',
      payload
    );

    endLoading();

    if (res && res.status === 'success') {
      closeModal('modalTK');

      showToast(
        res.message || 'Data tenaga kerja berhasil disimpan!',
        true
      );

      await loadAllData();
    } else {
      showToast(
        res && res.message
          ? res.message
          : 'Data tenaga kerja gagal disimpan.',
        false
      );
    }
  } catch (error) {
    endLoading();

    console.error('Save tenaga kerja error:', error);

    showToast(
      'Tidak dapat menyimpan data tenaga kerja ke Spreadsheet.',
      false
    );
  }
}

async function deleteTKItem(id) {
  const isConfirmed = confirm(
    'Apakah Anda yakin ingin menghapus data tenaga kerja ini?'
  );

  if (!isConfirmed) {
    return;
  }

  showLoading();

  try {
    const res = await apiRequest('deleteTenagaKerja', {
      id: id
    });

    endLoading();

    if (res && res.status === 'success') {
      showToast(
        res.message || 'Data tenaga kerja berhasil dihapus!',
        true
      );

      await loadAllData();
    } else {
      showToast(
        res && res.message
          ? res.message
          : 'Data tenaga kerja gagal dihapus.',
        false
      );
    }
  } catch (error) {
    endLoading();

    console.error('Delete tenaga kerja error:', error);

    showToast(
      'Tidak dapat menghapus data tenaga kerja dari Spreadsheet.',
      false
    );
  }
}

  function renderPembinaanGrid() {
    const container = document.getElementById('gridPembinaan');
    if (!container) return;

    const isStaffOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Staff';
    const list = appData.pembinaan || [];

    if (list.length === 0) {
      container.innerHTML = '<div class="col-span-full text-center p-8 text-slate-400">Belum ada agenda pembinaan tersedia.</div>';
      return;
    }

    container.innerHTML = list.map(p => 
      '<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition">' +
        '<div>' +
          '<div class="flex justify-between items-start mb-2">' +
            '<span class="px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-lg">' + p.status + '</span>' +
            '<span class="text-xs text-slate-500 font-medium"><i class="fas fa-users mr-1"></i> Kuota: ' + p.kuota + '</span>' +
          '</div>' +
          '<h3 class="font-bold text-slate-800 text-base mb-2">' + p.judulPembinaan + '</h3>' +
          '<p class="text-xs text-slate-500 mb-3 line-clamp-2">' + (p.deskripsi || 'Tidak ada deskripsi.') + '</p>' +
          '<div class="space-y-1.5 text-xs text-slate-600">' +
            '<p><i class="far fa-calendar-alt text-amber-500 w-5"></i> ' + p.tglPelaksanaan + '</p>' +
            '<p><i class="fas fa-map-marker-alt text-amber-500 w-5"></i> ' + p.lokasi + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="pt-3 border-t border-slate-100 flex items-center justify-between">' +
          '<button onclick="openModalDaftar(\'' + p.id + '\')" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1">' +
            '<i class="fas fa-user-plus mr-1"></i><span>Daftar</span>' +
          '</button>' +
          '<div class="' + (isStaffOrAdmin ? 'flex' : 'hidden') + ' space-x-2">' +
            '<button onclick="editPembinaan(\'' + p.id + '\')" class="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs"><i class="fas fa-edit"></i></button>' +
            '<button onclick="deletePembinaanItem(\'' + p.id + '\')" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs"><i class="fas fa-trash-alt"></i></button>' +
          '</div>' +
        '</div>' +
      '</div>'
    ).join('');
  }

  function openModalPembinaan(data = null) {
    document.getElementById('pemId').value = data ? data.id : '';
    document.getElementById('pemJudul').value = data ? data.judulPembinaan : '';
    document.getElementById('pemTgl').value = data ? data.tglPelaksanaan : '';
    document.getElementById('pemKuota').value = data ? data.kuota : 30;
    document.getElementById('pemLokasi').value = data ? data.lokasi : '';
    document.getElementById('pemStatus').value = data ? data.status : 'Buka Pendaftaran';
    document.getElementById('pemDeskripsi').value = data ? data.deskripsi : '';

    document.getElementById('modalPembinaanTitle').innerText = data ? 'Edit Pembinaan' : 'Tambah Pembinaan Baru';
    document.getElementById('modalPembinaan').classList.remove('hidden');
  }

  function editPembinaan(id) {
    const item = (appData.pembinaan || []).find(p => p.id === id);
    if (item) openModalPembinaan(item);
  }

async function handleSavePembinaan(e) {
  e.preventDefault();

  const payload = {
    id: document.getElementById('pemId').value.trim(),
    judulPembinaan: document
      .getElementById('pemJudul')
      .value
      .trim(),
    tglPelaksanaan: document
      .getElementById('pemTgl')
      .value,
    kuota: document
      .getElementById('pemKuota')
      .value,
    lokasi: document
      .getElementById('pemLokasi')
      .value
      .trim(),
    status: document
      .getElementById('pemStatus')
      .value,
    deskripsi: document
      .getElementById('pemDeskripsi')
      .value
      .trim()
  };

  if (
    !payload.judulPembinaan ||
    !payload.tglPelaksanaan ||
    !payload.kuota ||
    !payload.lokasi
  ) {
    showToast(
      'Data wajib pembinaan belum lengkap.',
      false
    );
    return;
  }

  showLoading();

  try {
    const res = await apiRequest(
      'savePembinaan',
      payload
    );

    endLoading();

    if (res && res.status === 'success') {
      closeModal('modalPembinaan');

      showToast(
        res.message || 'Data pembinaan berhasil disimpan!',
        true
      );

      await loadAllData();
    } else {
      showToast(
        res && res.message
          ? res.message
          : 'Data pembinaan gagal disimpan.',
        false
      );
    }
  } catch (error) {
    endLoading();

    console.error('Save pembinaan error:', error);

    showToast(
      'Tidak dapat menyimpan data pembinaan ke Spreadsheet.',
      false
    );
  }
}

async function deletePembinaanItem(id) {
  const isConfirmed = confirm(
    'Apakah Anda yakin ingin menghapus agenda pembinaan ini?'
  );

  if (!isConfirmed) {
    return;
  }

  showLoading();

  try {
    const res = await apiRequest('deletePembinaan', {
      id: id
    });

    endLoading();

    if (res && res.status === 'success') {
      showToast(
        res.message || 'Agenda pembinaan berhasil dihapus!',
        true
      );

      await loadAllData();
    } else {
      showToast(
        res && res.message
          ? res.message
          : 'Agenda pembinaan gagal dihapus.',
        false
      );
    }
  } catch (error) {
    endLoading();

    console.error('Delete pembinaan error:', error);

    showToast(
      'Tidak dapat menghapus agenda pembinaan dari Spreadsheet.',
      false
    );
  }
}

  function openModalDaftar(pembinaanId) {
    const target = (appData.pembinaan || []).find(p => p.id === pembinaanId);
    if (!target) return;

    document.getElementById('regPembinaanId').value = target.id;
    document.getElementById('lblSelectedPembinaan').innerText = 'Program: ' + target.judulPembinaan;

    if (currentUser) {
      document.getElementById('regPesertaNama').value = currentUser.fullName || '';
      document.getElementById('regPesertaEmail').value = currentUser.email || '';
      document.getElementById('regPesertaHp').value = currentUser.phone || '';
    }

    document.getElementById('modalDaftarPeserta').classList.remove('hidden');
  }

async function handleSendRegistration(e) {
  e.preventDefault();

  const payload = {
    pembinaanId: document
      .getElementById('regPembinaanId')
      .value
      .trim(),

    pesertaNama: document
      .getElementById('regPesertaNama')
      .value
      .trim(),

    pesertaNik: document
      .getElementById('regPesertaNik')
      .value
      .trim(),

    pesertaHp: document
      .getElementById('regPesertaHp')
      .value
      .trim(),

    email: document
      .getElementById('regPesertaEmail')
      .value
      .trim(),

    userId: currentUser
      ? currentUser.id
      : 'PUBLIC'
  };

  if (
    !payload.pembinaanId ||
    !payload.pesertaNama ||
    !payload.pesertaNik ||
    !payload.pesertaHp ||
    !payload.email
  ) {
    showToast(
      'Data pendaftaran belum lengkap.',
      false
    );
    return;
  }

  showLoading();

  try {
    const res = await apiRequest(
      'registerParticipant',
      payload
    );

    endLoading();

    if (res && res.status === 'success') {
      closeModal('modalDaftarPeserta');

      showToast(
        res.message || 'Pendaftaran peserta berhasil dikirim!',
        true
      );

      document.getElementById('regPesertaNama').value = '';
      document.getElementById('regPesertaNik').value = '';
      document.getElementById('regPesertaHp').value = '';
      document.getElementById('regPesertaEmail').value = '';

      await loadAllData();
    } else {
      showToast(
        res && res.message
          ? res.message
          : 'Pendaftaran peserta gagal.',
        false
      );
    }
  } catch (error) {
    endLoading();

    console.error('Registration error:', error);

    showToast(
      'Tidak dapat mengirim pendaftaran ke Spreadsheet.',
      false
    );
  }
}

  function renderPendaftaranTable() {
    const tbody = document.getElementById('tblPendaftaran');
    if (!tbody) return;

    let list = appData.pendaftaran || [];
    if (currentUser?.role === 'Public') {
      list = list.filter(r => r.userId === currentUser.id || r.email === currentUser.email);
    }

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-400 text-xs">Belum ada data pendaftaran.</td></tr>';
      return;
    }

    const isStaffOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Staff';

    tbody.innerHTML = list.map(r => {
      const pem = (appData.pembinaan || []).find(p => p.id === r.pembinaanId);
      const title = pem ? pem.judulPembinaan : 'Program Pembinaan';

      const statusBadgeClass = r.statusPendaftaran === 'Disetujui' ? 'bg-emerald-100 text-emerald-800' :
        r.statusPendaftaran === 'Ditolak' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800';

      const actionButtons = isStaffOrAdmin ? 
        '<div class="flex items-center justify-center space-x-1">' +
          '<button onclick="changeStatusReg(\'' + r.id + '\', \'Disetujui\')" title="Setujui" class="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs"><i class="fas fa-check"></i></button>' +
          '<button onclick="changeStatusReg(\'' + r.id + '\', \'Ditolak\')" title="Tolak" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs"><i class="fas fa-times"></i></button>' +
          '<button onclick="deleteRegItem(\'' + r.id + '\')" title="Hapus" class="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs"><i class="fas fa-trash-alt"></i></button>' +
        '</div>' : 
        '<button onclick="deleteRegItem(\'' + r.id + '\')" class="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold">Batalkan</button>';

      return (
        '<tr class="hover:bg-slate-50/80 transition">' +
          '<td class="p-4 font-mono text-xs text-slate-500">' + r.id + '</td>' +
          '<td class="p-4 font-semibold text-slate-800">' + title + '</td>' +
          '<td class="p-4 font-medium text-slate-700">' + r.pesertaNama + ' <br><span class="text-[10px] text-slate-400 font-mono">NIK: ' + r.pesertaNik + '</span></td>' +
          '<td class="p-4 text-xs text-slate-600">' + r.pesertaHp + ' <br><span class="text-slate-400">' + r.email + '</span></td>' +
          '<td class="p-4"><span class="px-2.5 py-1 text-xs font-semibold rounded-full ' + statusBadgeClass + '">' + r.statusPendaftaran + '</span></td>' +
          '<td class="p-4 text-center">' + actionButtons + '</td>' +
        '</tr>'
      );
    }).join('');
  }

async function changeStatusReg(id, status) {
  showLoading();

  try {
    const res = await apiRequest(
      'updateStatusPendaftaran',
      {
        id: id,
        status: status
      }
    );

    endLoading();

    if (res && res.status === 'success') {
      showToast(
        res.message ||
          'Status pendaftaran berhasil diperbarui.',
        true
      );

      await loadAllData();
    } else {
      showToast(
        res && res.message
          ? res.message
          : 'Status pendaftaran gagal diperbarui.',
        false
      );
    }
  } catch (error) {
    endLoading();

    console.error(
      'Update status pendaftaran error:',
      error
    );

    showToast(
      'Tidak dapat memperbarui status pendaftaran.',
      false
    );
  }
}

async function deleteRegItem(id) {
  const isConfirmed = confirm(
    'Apakah Anda yakin ingin menghapus atau membatalkan pendaftaran ini?'
  );

  if (!isConfirmed) {
    return;
  }

  showLoading();

  try {
    const res = await apiRequest(
      'deletePendaftaran',
      {
        id: id
      }
    );

    endLoading();

    if (res && res.status === 'success') {
      showToast(
        res.message || 'Pendaftaran berhasil dihapus!',
        true
      );

      await loadAllData();
    } else {
      showToast(
        res && res.message
          ? res.message
          : 'Pendaftaran gagal dihapus.',
        false
      );
    }
  } catch (error) {
    endLoading();

    console.error(
      'Delete pendaftaran error:',
      error
    );

    showToast(
      'Tidak dapat menghapus pendaftaran dari Spreadsheet.',
      false
    );
  }
}

  function renderUsersTable() {
    const tbody = document.getElementById('tblUsers');
    if (!tbody) return;

    const list = appData.users || [];
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-400 text-xs">Belum ada pengguna.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(u => {
      const badgeClass = u.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
        u.role === 'Staff' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800';

      return (
        '<tr class="hover:bg-slate-50/80 transition">' +
          '<td class="p-4 font-semibold text-slate-800">' + u.username + '</td>' +
          '<td class="p-4 text-slate-700">' + u.fullName + '</td>' +
          '<td class="p-4 text-xs text-slate-500">' + u.email + ' / ' + (u.phone || '-') + '</td>' +
          '<td class="p-4"><span class="px-2.5 py-1 text-xs font-bold rounded-full ' + badgeClass + '">' + u.role + '</span></td>' +
          '<td class="p-4 text-center">' +
            '<div class="flex items-center justify-center space-x-2">' +
              '<button onclick="editUser(\'' + u.id + '\')" class="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs"><i class="fas fa-edit"></i></button>' +
              '<button onclick="deleteUserItem(\'' + u.id + '\')" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs"><i class="fas fa-trash-alt"></i></button>' +
            '</div>' +
          '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function openModalUser(data = null) {
    document.getElementById('usrId').value = data ? data.id : '';
    document.getElementById('usrUsername').value = data ? data.username : '';
    document.getElementById('usrPassword').value = '';
    document.getElementById('usrFullName').value = data ? data.fullName : '';
    document.getElementById('usrEmail').value = data ? data.email : '';
    document.getElementById('usrPhone').value = data ? data.phone : '';
    document.getElementById('usrRole').value = data ? data.role : 'Staff';

    document.getElementById('modalUserTitle').innerText = data ? 'Edit Pengguna' : 'Tambah Pengguna Baru';
    document.getElementById('modalUser').classList.remove('hidden');
  }

  function editUser(id) {
    const item = (appData.users || []).find(u => u.id === id);
    if (item) openModalUser(item);
  }

async function handleSaveUser(e) {
  e.preventDefault();

  const payload = {
    id: document
      .getElementById('usrId')
      .value
      .trim(),

    username: document
      .getElementById('usrUsername')
      .value
      .trim(),

    password: document
      .getElementById('usrPassword')
      .value,

    fullName: document
      .getElementById('usrFullName')
      .value
      .trim(),

    email: document
      .getElementById('usrEmail')
      .value
      .trim(),

    phone: document
      .getElementById('usrPhone')
      .value
      .trim(),

    role: document
      .getElementById('usrRole')
      .value
  };

  if (
    !payload.username ||
    !payload.fullName ||
    !payload.email ||
    !payload.role
  ) {
    showToast(
      'Data wajib pengguna belum lengkap.',
      false
    );
    return;
  }

  if (!payload.id && !payload.password) {
    showToast(
      'Password wajib diisi untuk pengguna baru.',
      false
    );
    return;
  }

  showLoading();

  try {
    const res = await apiRequest(
      'saveUser',
      payload
    );

    endLoading();

    if (res && res.status === 'success') {
      closeModal('modalUser');

      showToast(
        res.message || 'Data pengguna berhasil disimpan!',
        true
      );

      await loadAllData();
    } else {
      showToast(
        res && res.message
          ? res.message
          : 'Data pengguna gagal disimpan.',
        false
      );
    }
  } catch (error) {
    endLoading();

    console.error(
      'Save user error:',
      error
    );

    showToast(
      'Tidak dapat menyimpan data pengguna ke Spreadsheet.',
      false
    );
  }
}

async function deleteUserItem(id) {
  const isConfirmed = confirm(
    'Apakah Anda yakin ingin menghapus pengguna ini?'
  );

  if (!isConfirmed) {
    return;
  }

  if (currentUser && currentUser.id === id) {
    showToast(
      'Akun yang sedang digunakan tidak dapat dihapus.',
      false
    );
    return;
  }

  showLoading();

  try {
    const res = await apiRequest(
      'deleteUser',
      {
        id: id
      }
    );

    endLoading();

    if (res && res.status === 'success') {
      showToast(
        res.message || 'Pengguna berhasil dihapus!',
        true
      );

      await loadAllData();
    } else {
      showToast(
        res && res.message
          ? res.message
          : 'Pengguna gagal dihapus.',
        false
      );
    }
  } catch (error) {
    endLoading();

    console.error(
      'Delete user error:',
      error
    );

    showToast(
      'Tidak dapat menghapus pengguna dari Spreadsheet.',
      false
    );
  }
}

  function renderPengawasanTable() {
    const q = (document.getElementById('searchPengawasan')?.value || '').toLowerCase();
    const list = appData.pengawasan || [];
    const filtered = list.filter(p => 
      String(p.judulPekerjaan).toLowerCase().includes(q) ||
      String(p.checklistK3).toLowerCase().includes(q) ||
      String(p.status).toLowerCase().includes(q)
    );

    const isStaffOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Staff';
    const tbody = document.getElementById('tblPengawasan');

    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-400 text-xs">Tidak ada data pengawasan ditemukan.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(p => {
      const photos = [p.foto1, p.foto2, p.foto3, p.foto4].filter(Boolean);
      const photoHtml = photos.length > 0
  ? (
      '<div class="flex flex-wrap gap-2">' +
      photos.map(function(f, idx) {
        const previewUrl =
          convertDriveUrlToPreview(f);

        return (
          '<a ' +
            'href="' + f + '" ' +
            'target="_blank" ' +
            'rel="noopener noreferrer" ' +
            'class="' +
              'w-12 h-12 rounded-lg overflow-hidden ' +
              'border border-slate-200 inline-block ' +
              'bg-slate-100 shadow-sm ' +
              'hover:opacity-80 transition' +
            '" ' +
            'title="Lihat Foto ' + (idx + 1) + '"' +
          '>' +
            '<img ' +
              'src="' + previewUrl + '" ' +
              'class="w-full h-full object-cover" ' +
              'loading="lazy" ' +
              'onerror="' +
                "this.onerror=null;" +
                "this.src='https://placehold.co/100x100?text=Foto';" +
              '"' +
            '>' +
          '</a>'
        );
      }).join('') +
      '</div>'
    )
  : '<span class="text-slate-400 text-xs italic">Tanpa Foto</span>';

      const statusBadgeClass = p.status === 'Sesuai Standar' ? 'bg-emerald-100 text-emerald-800' :
        p.status === 'Perlu Perbaikan' ? 'bg-amber-100 text-amber-800' :
        p.status === 'Diberhentikan Sementara' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800';

      return (
        '<tr class="hover:bg-slate-50/80 transition">' +
          '<td class="p-4"><p class="font-semibold text-slate-800">' + p.judulPekerjaan + '</p><span class="text-[10px] text-slate-400 font-mono">' + p.id + '</span></td>' +
          '<td class="p-4 text-slate-700 font-medium text-xs">' + p.jumlahPekerja + ' Orang</td>' +
          '<td class="p-4 text-xs text-slate-600">' + p.checklistK3 + '</td>' +
          '<td class="p-4">' + photoHtml + '</td>' +
          '<td class="p-4 text-xs text-slate-600">' + (p.tahun || '-') + '</td>' +
          '<td class="p-4"><span class="px-2.5 py-1 text-xs font-semibold rounded-full ' + statusBadgeClass + '">' + p.status + '</span></td>' +
          '<td class="p-4 text-center ' + (isStaffOrAdmin ? '' : 'hidden') + '">' +
            '<div class="flex items-center justify-center space-x-2">' +
              '<button onclick="editPengawasan(\'' + p.id + '\')" class="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs" title="Edit"><i class="fas fa-edit"></i></button>' +
              '<button onclick="deletePengawasanItem(\'' + p.id + '\')" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs" title="Hapus"><i class="fas fa-trash-alt"></i></button>' +
            '</div>' +
          '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function handleCameraCapture(event, index) {
    const file = event.target.files[0];
    if (!file) return;

    showLoading();
    compressAndResizeImage(file, 800, 0.7)
      .then(base64Image => {
        endLoading();
        document.getElementById('pgwFoto' + index).value = base64Image;
        const imgEl = document.getElementById('imgPreview' + index);
        const iconEl = document.getElementById('iconBox' + index);

        imgEl.src = base64Image;
        imgEl.classList.remove('hidden');
        iconEl.classList.add('hidden');
        showToast('Foto ' + index + ' berhasil diambil!', true);
      })
      .catch(err => {
        endLoading();
        showToast('Gagal memproses foto kamera HP.', false);
      });
  }

  function compressAndResizeImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
function convertDriveUrlToPreview(url) {
  if (!url) return '';

  const text = String(url);

  const match =
    text.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    text.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (match) {
    return (
      'https://drive.google.com/thumbnail?id=' +
      match[1] +
      '&sz=w500'
    );
  }

  return text;
}
function openModalPengawasan(data = null) {
  document.getElementById('pgwId').value =
    data ? data.id : '';

  document.getElementById('pgwJudul').value =
    data ? data.judulPekerjaan : '';

  document.getElementById('pgwJumlahPekerja').value =
    data ? data.jumlahPekerja : '';

  document.getElementById('pgwTahun').value =
    data ? data.tahun : new Date().getFullYear();

  document.getElementById('pgwChecklistK3').value =
    data ? data.checklistK3 : '';

  document.getElementById('pgwStatus').value =
    data ? data.status : 'Sesuai Standar';

  for (let i = 1; i <= 4; i++) {
    const oldPhoto =
      data ? data['foto' + i] || '' : '';

    const hiddenInput =
      document.getElementById('pgwFoto' + i);

    const imgEl =
      document.getElementById('imgPreview' + i);

    const iconEl =
      document.getElementById('iconBox' + i);

    if (hiddenInput) {
      hiddenInput.value = '';
    }

    if (oldPhoto) {
      imgEl.src =
        convertDriveUrlToPreview(oldPhoto);

      imgEl.classList.remove('hidden');
      iconEl.classList.add('hidden');
    } else {
      imgEl.src = '';
      imgEl.classList.add('hidden');
      iconEl.classList.remove('hidden');
    }
  }

  document.getElementById(
    'modalPengawasanTitle'
  ).innerText = data
    ? 'Edit Pengawasan Bikon'
    : 'Tambah Pengawasan Bikon';

  document
    .getElementById('modalPengawasan')
    .classList.remove('hidden');
}

  function editPengawasan(id) {
    const item = (appData.pengawasan || []).find(p => p.id === id);
    if (item) openModalPengawasan(item);
  }

async function handleSavePengawasan(e) {
  e.preventDefault();

  const payload = {
    id: document
      .getElementById('pgwId')
      .value
      .trim(),

    judulPekerjaan: document
      .getElementById('pgwJudul')
      .value
      .trim(),

    jumlahPekerja: document
      .getElementById('pgwJumlahPekerja')
      .value,

    tahun: document
      .getElementById('pgwTahun')
      .value,

    checklistK3: document
      .getElementById('pgwChecklistK3')
      .value
      .trim(),

    status: document
      .getElementById('pgwStatus')
      .value,

    foto1: document
      .getElementById('pgwFoto1')
      .value,

    foto2: document
      .getElementById('pgwFoto2')
      .value,

    foto3: document
      .getElementById('pgwFoto3')
      .value,

    foto4: document
      .getElementById('pgwFoto4')
      .value
  };

  if (!payload.judulPekerjaan) {
    showToast(
      'Judul pekerjaan wajib diisi.',
      false
    );
    return;
  }

  if (!payload.jumlahPekerja) {
    showToast(
      'Jumlah pekerja wajib diisi.',
      false
    );
    return;
  }

  if (!payload.tahun) {
    showToast(
      'Tahun pengawasan wajib diisi.',
      false
    );
    return;
  }

  if (!payload.checklistK3) {
    showToast(
      'Checklist K3 wajib diisi.',
      false
    );
    return;
  }

  showLoading();

  try {
    const res = await apiRequest(
      'savePengawasan',
      payload
    );
    
    endLoading();

    if (res && res.status === 'success') {
      closeModal('modalPengawasan');

      showToast(
        res.message ||
          'Data pengawasan berhasil disimpan!',
        true
      );

      await loadAllData();
    } else {
      showToast(
        res && res.message
          ? res.message
          : 'Data pengawasan gagal disimpan.',
        false
      );
    }
  } catch (error) {
    endLoading();

    console.error(
      'Save pengawasan error:',
      error
    );

    showToast(
      'Tidak dapat menyimpan data pengawasan dan foto.',
      false
    );
  }
}

async function deletePengawasanItem(id) {
  const isConfirmed = confirm(
    'Apakah Anda yakin ingin menghapus data pengawasan ini?'
  );

  if (!isConfirmed) {
    return;
  }

  showLoading();

  try {
    const res = await apiRequest(
      'deletePengawasan',
      {
        id: id
      }
    );
    
    endLoading();

    if (res && res.status === 'success') {
      showToast(
        res.message || 'Data pengawasan berhasil dihapus!',
        true
      );

      await loadAllData();
    } else {
      showToast(
        res && res.message
          ? res.message
          : 'Data pengawasan gagal dihapus.',
        false
      );
    }
  } catch (error) {
    endLoading();

    console.error(
      'Delete pengawasan error:',
      error
    );

    showToast(
      'Tidak dapat menghapus data pengawasan dari Spreadsheet.',
      false
    );
  }
}
  function closeModal(modalId) {
    document.getElementById(modalId)?.classList.add('hidden');
  }

  function exportToExcel(moduleName) {
    let data = [];
    let filename = 'SI-BIKON_' + moduleName.toUpperCase() + '_' + new Date().toISOString().slice(0, 10) + '.csv';
    let headers = [];

    if (moduleName === 'bujk') {
      headers = ['Nama BUJK', 'NIB', 'PJBU / Pimpinan', 'Kualifikasi', 'Klasifikasi', 'Alamat', 'No. Telepon', 'Status SBU'];
      data = (appData.bujk || []).map(b => [b.namaBujk, b.nib, b.pjbu, b.kualifikasi, b.klasifikasi, b.alamat, b.noTelepon, b.statusSbu]);
    } else if (moduleName === 'proyek') {
      headers = ['Judul Proyek', 'No. Kontrak', 'Nilai Proyek', 'Tahun', 'PPTK / Bidang', 'Status'];
      data = (appData.proyek || []).map(p => [p.judulProyek, p.noKontrak, p.nilaiProyek, p.tahun, p.pptkBidang, p.status]);
    } else if (moduleName === 'tenagaKerja') {
      headers = ['Nama Lengkap', 'NIK', 'No. HP', 'Klasifikasi', 'Sub Klasifikasi', 'Jabatan', 'No. Sertifikat', 'Kualifikasi', 'Jenjang', 'Tgl Sertifikat', 'Status'];
      data = (appData.tenagaKerja || []).map(t => [t.nama, t.nik, t.noHp, t.klasifikasi, t.subklasifikasi, t.jabatan, t.noSertifikat, t.kualifikasi, t.jenjang, t.tglSertifikat, t.status]);
    } else if (moduleName === 'pengawasan') {
      headers = ['ID', 'Judul Pekerjaan', 'Jumlah Pekerja', 'Checklist K3', 'Tahun', 'Status'];
      data = (appData.pengawasan || []).map(p => [p.id, p.judulPekerjaan, p.jumlahPekerja, p.checklistK3, p.tahun, p.status]);
    } else if (moduleName === 'pendaftaran') {
      headers = ['ID Pendaftaran', 'Program Pembinaan', 'Nama Peserta', 'NIK Peserta', 'No HP', 'Email', 'Status Pendaftaran'];
      data = (appData.pendaftaran || []).map(r => {
        const pem = (appData.pembinaan || []).find(p => p.id === r.pembinaanId);
        return [r.id, pem ? pem.judulPembinaan : '-', r.pesertaNama, r.pesertaNik, r.pesertaHp, r.email, r.statusPendaftaran];
      });
    }

    if (!data || data.length === 0) {
      showToast("Tidak ada data untuk diexport!", false);
      return;
    }

    let csvContent = "\uFEFF";
    csvContent += headers.map(h => '"' + String(h).replace(/"/g, '""') + '"').join(',') + "\n";
    data.forEach(row => {
      csvContent += row.map(v => '"' + String(v || '').replace(/"/g, '""') + '"').join(',') + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Data " + moduleName.toUpperCase() + " berhasil diexport!");
    }
  }

  // Window Onload Application Initializer
 window.onload = function() {
  currentUser = null;

  const authSection = document.getElementById('authSection');
  const mainSection = document.getElementById('mainSection');

  if (authSection) {
    authSection.classList.remove('hidden');
  }

  if (mainSection) {
    mainSection.classList.add('hidden');
  }

 };
window.addEventListener('load', function () {
  testApiConnection();
});
