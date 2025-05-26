/**
 * ==============================================
 * OTENTIKASI JWT & MANAJEMEN TOKEN
 * ==============================================
 */

// URL dasar untuk backend API
const BASE_URL = 'https://fam07-283162572185.us-central1.run.app';

// Configure axios defaults for all requests

// Variabel global untuk menyimpan informasi user dari token
let token = "";    // Token JWT aktif
let expire = "";   // Waktu kedaluwarsa token
let name = "";     // Nama user dari token
let id = "";       // ID user dari token

/**
 * Mendekode token JWT tanpa library eksternal
 * 
 * @param {string} token - Token JWT yang akan didekode
 * @returns {object|null} - Objek hasil dekode payload JWT atau null jika gagal
 */
function decodeJWT(token) {
  try {
    // Ambil bagian payload dari token (segment kedua)
    const base64Url = token.split('.')[1];
    
    // Konversi dari Base64URL ke Base64 standar
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Dekode Base64 menjadi string JSON dan parsing
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    
    // Parse JSON menjadi objek JavaScript
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error saat mendekode JWT:", e);
    return null;
  }
}

/**
 * Memperbarui informasi user dari token yang tersimpan di localStorage
 * Fungsi ini mengatur variabel global token, expire, name, dan id
 */
function updateUserFromToken() {
  // Ambil token dari localStorage atau string kosong jika tidak ada
  token = localStorage.getItem('token') || "";
  
  if (token) {
    try {
      // Dekode token untuk mendapatkan informasi user
      const decoded = decodeJWT(token);
      expire = decoded.exp;  // Waktu kedaluwarsa dalam format Unix timestamp
      name = decoded.name;   // Nama user
      id = decoded.id;       // ID user
    } catch (e) {
      // Reset semua informasi user jika terjadi error
      token = "";
      expire = "";
      name = "";
      id = "";
    }
  } else {
    console.log("Token tidak ditemukan di localStorage");
  }
}

// Initialize user info from token saat halaman dimuat
updateUserFromToken();

/**
 * Memeriksa dan memperbarui token jika diperlukan
 * 
 * Fungsi ini akan mengecek apakah token sudah kedaluwarsa,
 * jika ya, maka akan melakukan request untuk mendapatkan token baru.
 * 
 * @returns {string} - Token yang valid
 */
async function checkAndRefreshToken() {
  const currentDate = new Date();
  console.log("Current Date:", currentDate);
  
  // Cek apakah token sudah expire
  if (!token || expire * 1000 < currentDate.getTime()) {
    try {
      // Request token baru
      const response = await $.ajax({
        url: `${BASE_URL}/api/token`,
        type: 'GET',
        xhrFields: {
          withCredentials: true // Ini penting untuk mengirim cookies
        }
      });
      
      console.log("Token refreshed:", response);
      
      // Update token
      token = response.accessToken;
      localStorage.setItem('token', token);
      
      // Decode token baru
      const decoded = decodeJWT(token);
      expire = decoded.exp;
      name = decoded.name;
      id = decoded.id;
      
      return token;
    } catch (err) {
      console.error("Error refreshing token:", err);
      alert("Session expired, please login again");
      // Redirect ke halaman login
      window.location.href = '/login';
      throw err;
    }
  }
  return token;
}

// Get token synchronously (use existing value or from localStorage)
function getToken() {
  if (!token) {
    updateUserFromToken();
  }
  return token;
}

// preload token saat halaman dimuat
(async function() {
  try {
    await checkAndRefreshToken();
  } catch (err) {
    console.error("Failed to preload token:", err);
  }
})();

// Setup jQuery AJAX untuk selalu menggunakan token
$.ajaxSetup({
  beforeSend: function(xhr, settings) {
    // Skip untuk beberapa jenis request yang tidak perlu token
    if (settings.url === `${BASE_URL}/api/token` || settings.url.indexOf('/login') > -1) {
      return;
    }
    
    // Use token synchronously - no async/await here
    const currentToken = getToken();
    if (currentToken) {
      console.log("Setting Authorization header with token:", currentToken);
      xhr.setRequestHeader('Authorization', `Bearer ${currentToken}`);
    }
  },
  // Ensure we're sending credentials (cookies) with cross-domain requests
  xhrFields: {
    withCredentials: true
  },
  crossDomain: true,
  complete: function(xhr) {
    // Log headers sent for debugging
    console.log("Request headers sent:", xhr.getAllResponseHeaders());
  }
});

/**
 * Memastikan token selalu valid sebelum melakukan operasi penting
 * 
 * @returns {boolean} - True jika token valid, False jika gagal
 */
async function ensureValidToken() {
  try {
    await checkAndRefreshToken();
    return true;
  } catch (error) {
    console.error("Failed to ensure valid token:", error);
    return false;
  }
}

// Inisialisasi Family Tree
var options = getOptions();

// pastikan token valid sebelum memuat pohon keluarga
(async function() {
  await ensureValidToken();
  loadFamilyTree();
})();

// Definisikan nodeMenu tanpa konfirmasi untuk delete
var nodeMenu = {
    edit: { text: 'Edit' },
    details: { text: 'Details' },
    delete: { text: 'Hapus', icon: '✕', onClick: deleteNodeWithoutConfirm }
};

// Chart configuration
var chart = new FamilyTree(document.getElementById('tree'), {
  showXScroll: FamilyTree.scroll.visible,
  showYScroll: FamilyTree.scroll.visible,
  mouseScrool: FamilyTree.action.zoom,
  scaleInitial: options.scaleInitial,
  mode: 'dark',
  template: 'john',
  roots: [3],
  nodeMenu: nodeMenu,
  nodeTreeMenu: true,
  nodeBinding: {
    field_0: 'name',
    field_1: 'born',
    img_0: 'photo'
  },
  editForm: {
    titleBinding: "name",
    photoBinding: "photo",
    addMore: false,
    elements: [
      { type: 'textbox', label: 'Nama Lengkap', binding: 'name' },
      { type: 'textbox', label: 'Alamat Email', binding: 'email' },
      { type: 'date', label: 'Tanggal Lahir', binding: 'born' },
      { type: 'textbox', label: 'URL Foto', binding: 'photo', btn: 'Upload' },
    ]
  }
});


    $("#logout").click(function (e) {
      e.preventDefault();
      $.ajax({
        url: `${BASE_URL}/api/logout`,
        method: "DELETE",
        contentType: "application/json",
        success: function () {
          window.location.href = "index.html"; // Redirect ke halaman tree
        },
        error: function (xhr) {
          if (xhr.responseJSON && xhr.responseJSON.message) {
            $("#msg").text(xhr.responseJSON.message);
          } else {
            $("#msg").text("Logout failed. Please try again.");
          }
        }
      });
    });

// Format birth date
chart.on('field', function (sender, args) {
    if (args.name == 'born') {
        var date = new Date(args.value);
        args.value = date.toLocaleDateString();
    }
});

// aplud foto handler
chart.editUI.on('element-btn-click', function(sender, args) {
    // membuat input file untuk memilih foto
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // trigger klik untuk membuka dialog file
    fileInput.click();

    // handler untuk menangani file yang dipilih
    fileInput.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;

        // membuat FormData untuk mengirim file
        var formData = new FormData();
        formData.append('photo', file);

        // uplaod foto ke server
        $.ajax({
            url: `${BASE_URL}/api/upload-photo`,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                console.log('Photo uploaded:', response);

                // upadte input foto di form edit
                var photoInput = document.querySelector('[data-binding="photo"]');
                if (photoInput) {
                    // Use the complete public URL instead of just the filename
                    photoInput.value = response.publicUrl;

                    // Trigger change event to ensure the familytree library detects the change
                    var changeEvent = new Event('change');
                    photoInput.dispatchEvent(changeEvent);

                    // perbarui preview foto jika ada
                    var photoPreview = photoInput.parentNode.querySelector('img') ||
                        photoInput.parentNode.querySelector('.photo-preview img');
                    if (photoPreview) {
                        photoPreview.src = response.publicUrl;
                    } else {
                        // Create preview if it doesn't exist
                        var preview = document.createElement('div');
                        preview.className = 'photo-preview';
                        preview.style.marginTop = '10px';

                        var img = document.createElement('img');
                        img.src = response.publicUrl;
                        console.log('Preview URL:', response.publicUrl);
                        img.style.maxWidth = '100px';
                        img.style.maxHeight = '100px';

                        preview.appendChild(img);
                        console.log("img : ", img)
                        photoInput.parentNode.appendChild(preview);
                    }
                }
            },
            error: function(xhr, status, error) {
                console.error('Error uploading photo:', error);
                alert('Failed to upload photo. Please try again.');
            }
        });
        // buang input file setelah selesai
        document.body.removeChild(fileInput);
    };
});

// handler untuk menambahkan node baru jika chart kosong
chart.on('add', function (sender, node) {
    if (chart.nodes.length >= 1) return; // jika chart sudah ada node, tidak perlu menambah
    // jika chart kosong, tambahkan node baru
    addNewNode();
    return false;
});

// fungsi untuk menambahkan node baru
function addNewNode() {
    var node = { id: 1, name: "Nama anda", gender: "male" };
    ensureValidToken().then(() => {
        $.ajax({
            url: `${BASE_URL}/api/family`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(node),
            success: function(newPerson) {
                console.log('Family member added test:', newPerson);
                loadFamilyTree(function() {
                    // highlight atau center pada node baru
                    if (newPerson && newPerson.data && newPerson.data.id) {
                        chart.center(newPerson.data.id);
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error('Error adding family member:', error);
            }
        });
    });
}

// handler untuk memperbarui node ketika ada perubahan
chart.onUpdateNode(function (args) {
    let promises = [];
    // menambahkan node baru (POST)
    if (args.addNodesData.length) {
        args.addNodesData.forEach(function(person) {
            //jangan sertakan fid dan mid jika tidak ada
            if (!person.fid) delete person.fid;
            if (!person.mid) delete person.mid;
            console.log('Menambahkan node:', person);

            // tambah anggota keluarga ke database
            let promise = new Promise((resolve, reject) => {
                $.ajax({
                    url: `${BASE_URL}/api/family`,
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(person),
                    success: function(newPerson) {
                        console.log('Anggota keluarga berhasil ditambahkan:', newPerson);
                        resolve(newPerson);
                    },
                    error: function(xhr, status, error) {
                        console.error('Gagal menambahkan anggota keluarga:', error);
                        reject(error);
                    }
                });
            });

            promises.push(promise);
        });
    }

    // Perbarui data yang sudah ada (PUT)
    if (args.updateNodesData.length) {
        args.updateNodesData.forEach(function(person) {
            console.log('Memperbarui node:', person);
            let promise = new Promise((resolve, reject) => {
                $.ajax({
                    url: `${BASE_URL}/api/family/${person.id}`,
                    type: 'PUT',
                    contentType: 'application/json',
                    xhrFields: {
                    withCredentials: true // Ini penting untuk mengirim cookies
                    },
                    data: JSON.stringify(person),
                    success: function(updatedPerson) {
                        console.log('Anggota keluarga berhasil diperbarui:', updatedPerson);
                        resolve(updatedPerson);
                    },
                    error: function(xhr, status, error) {
                        console.error('Gagal memperbarui anggota keluarga:', error);
                        reject(error);
                    }
                });
            });
            promises.push(promise);
        });
    }

    // menunggu semua operasi selesai sebelum memuat ulang pohon
    Promise.all(promises)
        .then(() => {
            console.log('Semua operasi node selesai, memuat ulang pohon keluarga');
            loadFamilyTree();
        })
        .catch(error => {
            console.error('Terjadi kesalahan saat operasi node:', error);
            loadFamilyTree(); // Tetap coba muat ulang meskipun terjadi kesalahan
        });
});

// hapus node dari chart dan database
function deleteNode(nodeId) {
    console.log('Menghapus node:', nodeId);
    if (confirm('Apakah Anda yakin ingin menghapus anggota keluarga ini?')) {
        ensureValidToken().then(() => {
            $.ajax({
                url: `${BASE_URL}/api/family/${nodeId}`,
                type: 'DELETE',
                success: function(response) {
                    console.log('Anggota keluarga berhasil dihapus dari database:', response);
                    // Hapus node dari chart
                    chart.removeNode(nodeId);
                    // Muat ulang pohon untuk memastikan semua hubungan terupdate
                    loadFamilyTree();
                },
                error: function(xhr, status, error) {
                    console.error('Gagal menghapus anggota keluarga:', error);
                }
            });
        });
    }
}

// Fungsi hapus node tanpa konfirmasi
function deleteNodeWithoutConfirm(nodeId) {
    console.log('Menghapus node:', nodeId);
    ensureValidToken().then(() => {
        $.ajax({
            url: `${BASE_URL}/api/family/${nodeId}`,
            type: 'DELETE',
            success: function(response) {
                console.log('Anggota keluarga berhasil dihapus dari database:', response);
                // Hapus node dari chart
                chart.removeNode(nodeId);
                // Muat ulang pohon untuk memastikan semua hubungan terupdate
                loadFamilyTree();
            },
            error: function(xhr, status, error) {
                console.error('Gagal menghapus anggota keluarga:', error);
            }
        });
    });
}

// Muat data keluarga dari API dan tampilkan di chart
function loadFamilyTree(callback) {
    console.log('Memuat pohon keluarga');
    
    // Pastikan token valid terlebih dahulu
    ensureValidToken().then(() => {
        $.ajax({
            url: `${BASE_URL}/api/family`,
            type: 'GET',
            success: function(data) {
                // cek apakah data yang diterima valid
                console.log('Data keluarga diterima:', data);
                if (Array.isArray(data)) {
                    chart.load(data);
                    console.log('Pohon keluarga berhasil dimuat dengan', data.length, 'anggota');

                    // Jalankan callback jika ada
                    if (typeof callback === 'function') {
                        callback();
                    }
                } else {
                    console.error('Format data yang diterima tidak valid:', data);
                }
            },
            error: function(xhr, status, error) {
                console.error('Gagal memuat data keluarga:', error);
            }
        });
    });
}

// Get options from URL parameters
function getOptions() {
    const searchParams = new URLSearchParams(window.location.search);
    var fit = searchParams.get('fit');
    var enableSearch = true;
    var scaleInitial = 1;
    if (fit == 'yes') {
        enableSearch = false;
        scaleInitial = FamilyTree.match.boundary;
    }
    return {enableSearch, scaleInitial};
}