
---

# LAPORAN DOKUMENTASI BACKEND API - INFRACHECK

**Base URL:** `[http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)`

Dokumen ini merangkum seluruh *endpoint* yang sudah siap digunakan oleh *frontend* untuk berinteraksi dengan *database* melalui Laravel.

---

### 1. Kirim Laporan Baru (Warga)

* **Fungsi:** Mengirim laporan kerusakan infrastruktur baru. Sistem otomatis membuatkan *Tracking ID* unik dan *User Token*.
* **Metode:** `POST`
* **URL Endpoint:** `/reports`
* **Request Body (JSON):**
```json
{
  "category": "jalan",
  "description": "Jalan berlubang parah di dekat tikungan.",
  "urgency": "high",
  "latitude": -6.2088,
  "longitude": 106.8456
}

```


* **Response Sukses (201):**
```json
{
  "message": "Laporan berhasil disubmit!",
  "tracking_id": "IC-2026-KUKHR",
  "report_id": 1
}

```



---

### 2. Ambil Semua Laporan (Peta Publik)

* **Fungsi:** Menarik seluruh data laporan untuk ditampilkan sebagai titik-titik marker di peta interaktif.
* **Metode:** `GET`
* **URL Endpoint:** `/reports`
* **Response Sukses (200):** Mengembalikan array JSON berisi daftar seluruh laporan.

---

### 3. Lacak Status Laporan via Tracking ID

* **Fungsi:** Memungkinkan warga memantau status penanganan laporan tanpa harus *login*.
* **Metode:** `GET`
* **URL Endpoint:** `/reports/track/{trackingId}`
* **Contoh Akses:** `/reports/track/IC-2026-KUKHR`
* **Response Sukses (200):** Mengembalikan detail objek laporan tunggal milik ID tersebut.

---

### 4. Konfirmasi Laporan ("Saya Juga Merasakan Ini")

* **Fungsi:** Fitur bagi warga untuk mengonfirmasi laporan yang sudah ada. Dilengkapi proteksi anti-spam agar satu *token* tidak bisa *spam* klik berkali-kali.
* **Metode:** `POST`
* **URL Endpoint:** `/reports/{id}/confirm`
* **Request Body (JSON):**
```json
{
  "user_token": "token-anonim-warga-123"
}

```


* **Response Sukses (200):** `Berhasil mengkonfirmasi laporan!`

---

### 5. Tambah Foto Kontribusi Bukti

* **Fungsi:** Memungkinkan warga melampirkan foto tambahan dari sudut pandang lain pada laporan yang sama.
* **Metode:** `POST`
* **URL Endpoint:** `/reports/{id}/photos`
* **Request Body (JSON):**
```json
{
  "user_token": "token-anonim-warga-123",
  "photo_url": "https://example.com/foto.jpg",
  "caption": "Kondisi setelah hujan deras."
}

```


* **Response Sukses (201):** `Foto bukti berhasil ditambahkan ke laporan!`

---

### 6. Update Status Laporan (Admin / Dinas)

* **Fungsi:** Mengubah status alur penanganan laporan oleh pihak admin.
* **Metode:** `PATCH`
* **URL Endpoint:** `/reports/{id}/status`
* **Request Body (JSON):**
```json
{
  "status": "processing"
}

```


*(Pilihan nilai status yang valid: `new`, `processing`, `done`)*
* **Response Sukses (200):** `Status laporan berhasil diperbarui!`

---

### 7. Unduh Dokumen Audit PDF

* **Fungsi:** Men-generate dan mengunduh laporan resmi beserta seluruh foto kontribusinya ke format PDF.
* **Metode:** `GET`
* **URL Endpoint:** `/reports/{id}/pdf`
* **Cara Akses:** Langsung buka URL tersebut di *browser* (contoh: `[http://127.0.0.1:8000/api/reports/1/pdf](http://127.0.0.1:8000/api/reports/1/pdf)`), dan file PDF akan otomatis terunduh.

---