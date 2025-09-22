// Cloud Storage System for Cross-Server Data Sharing
// Using JSONBin.io as free cloud database service

const CLOUD_CONFIG = {
  // JSONBin.io configuration (free service)
  API_URL: 'https://api.jsonbin.io/v3/b',
  BIN_ID: 'REPLACE_WITH_YOUR_BIN_ID', // Will be created dynamically
  API_KEY: '$2a$10$example.api.key.here', // Replace with your JSONBin API key
  
  // Alternative: Firebase Realtime Database
  FIREBASE_URL: 'https://your-project.firebaseio.com',
  
  // Local fallback
  LOCAL_STORAGE_KEY: 'scores',
  SYNC_STATUS_KEY: 'cloud_sync_status'
};

class CloudDataManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.setupNetworkListeners();
    this.lastSyncTime = localStorage.getItem('last_sync_time') || 0;
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('📶 Koneksi online - memulai sinkronisasi...');
      this.syncData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📵 Koneksi offline - mode lokal aktif');
    });
  }

  // Save student results to cloud
  async saveResultToCloud(resultData) {
    if (!this.isOnline) {
      console.log('💾 Offline - menyimpan ke localStorage');
      this.saveToLocalStorage(resultData);
      return { success: true, source: 'local' };
    }

    try {
      // Method 1: Using JSONBin.io (Simple and Free)
      const response = await this.saveToJSONBin(resultData);
      
      if (response.success) {
        console.log('☁️ Data berhasil disimpan ke cloud');
        this.updateSyncStatus('success', new Date().toISOString());
        
        // Also save locally as backup
        this.saveToLocalStorage(resultData);
        
        return { success: true, source: 'cloud', data: response.data };
      } else {
        throw new Error('Cloud save failed');
      }
    } catch (error) {
      console.error('❌ Gagal menyimpan ke cloud:', error);
      
      // Fallback to local storage
      this.saveToLocalStorage(resultData);
      this.updateSyncStatus('failed', new Date().toISOString(), error.message);
      
      return { success: true, source: 'local_fallback', error: error.message };
    }
  }

  // Load all results from cloud
  async loadResultsFromCloud() {
    if (!this.isOnline) {
      console.log('📱 Offline - mengambil data dari localStorage');
      return this.loadFromLocalStorage();
    }

    try {
      // Try to load from cloud first
      const cloudData = await this.loadFromJSONBin();
      
      if (cloudData.success && cloudData.data) {
        console.log('☁️ Data berhasil dimuat dari cloud');
        
        // Merge with local data if any
        const localData = this.loadFromLocalStorage();
        const mergedData = this.mergeResults(cloudData.data, localData);
        
        // Update local storage with merged data
        localStorage.setItem(CLOUD_CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(mergedData));
        
        this.updateSyncStatus('success', new Date().toISOString());
        return mergedData;
      } else {
        throw new Error('No cloud data available');
      }
    } catch (error) {
      console.error('❌ Gagal memuat dari cloud:', error);
      
      // Fallback to local storage
      const localData = this.loadFromLocalStorage();
      this.updateSyncStatus('failed', new Date().toISOString(), error.message);
      
      return localData;
    }
  }

  // JSONBin.io implementation
  async saveToJSONBin(resultData) {
    try {
      // First, get existing data
      const existingData = await this.loadFromJSONBin();
      let allResults = existingData.success ? existingData.data : [];
      
      // Add new result
      allResults.push({
        ...resultData,
        cloudTimestamp: new Date().toISOString(),
        syncId: this.generateSyncId()
      });

      // Save back to JSONBin
      const binId = this.getBinId();
      const url = binId ? `${CLOUD_CONFIG.API_URL}/${binId}` : CLOUD_CONFIG.API_URL;
      
      const response = await fetch(url, {
        method: binId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': CLOUD_CONFIG.API_KEY,
          'X-Bin-Name': 'Informatika-SMP-Results'
        },
        body: JSON.stringify({
          schoolId: 'SMP_INFORMATIKA_2025',
          lastUpdated: new Date().toISOString(),
          results: allResults
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Save bin ID for future use
        if (!binId && data.metadata?.id) {
          localStorage.setItem('cloud_bin_id', data.metadata.id);
        }
        
        return { success: true, data: allResults };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`JSONBin save failed: ${error.message}`);
    }
  }

  async loadFromJSONBin() {
    try {
      const binId = this.getBinId();
      if (!binId) {
        return { success: false, data: [] };
      }

      const response = await fetch(`${CLOUD_CONFIG.API_URL}/${binId}/latest`, {
        headers: {
          'X-Master-Key': CLOUD_CONFIG.API_KEY
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          data: data.record?.results || [] 
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`JSONBin load failed: ${error.message}`);
    }
  }

  // Local storage operations
  saveToLocalStorage(resultData) {
    try {
      const existing = JSON.parse(localStorage.getItem(CLOUD_CONFIG.LOCAL_STORAGE_KEY) || '[]');
      existing.push({
        ...resultData,
        localTimestamp: new Date().toISOString(),
        needsSync: true
      });
      localStorage.setItem(CLOUD_CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(existing));
      console.log('💾 Data disimpan ke localStorage');
    } catch (error) {
      console.error('❌ Gagal menyimpan ke localStorage:', error);
    }
  }

  loadFromLocalStorage() {
    try {
      const data = JSON.parse(localStorage.getItem(CLOUD_CONFIG.LOCAL_STORAGE_KEY) || '[]');
      console.log('📱 Data dimuat dari localStorage');
      return data;
    } catch (error) {
      console.error('❌ Gagal memuat dari localStorage:', error);
      return [];
    }
  }

  // Data merging and sync utilities
  mergeResults(cloudData, localData) {
    const merged = [...cloudData];
    
    // Add local data that doesn't exist in cloud
    localData.forEach(localItem => {
      if (localItem.needsSync) {
        const exists = cloudData.some(cloudItem => 
          cloudItem.userId === localItem.userId && 
          cloudItem.date === localItem.date
        );
        
        if (!exists) {
          merged.push(localItem);
        }
      }
    });
    
    // Sort by date
    merged.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return merged;
  }

  // Auto-sync functionality
  async syncData() {
    if (!this.isOnline) return;

    try {
      console.log('🔄 Memulai sinkronisasi data...');
      
      // Get local data that needs sync
      const localData = this.loadFromLocalStorage();
      const unsyncedData = localData.filter(item => item.needsSync);
      
      if (unsyncedData.length > 0) {
        console.log(`📤 Mengsinkronkan ${unsyncedData.length} data lokal...`);
        
        for (const item of unsyncedData) {
          await this.saveToJSONBin(item);
          // Mark as synced
          item.needsSync = false;
        }
        
        // Update local storage
        localStorage.setItem(CLOUD_CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(localData));
      }
      
      // Load latest data from cloud
      const cloudData = await this.loadResultsFromCloud();
      console.log('✅ Sinkronisasi selesai');
      
      // Dispatch event for UI update
      window.dispatchEvent(new CustomEvent('datasynced', { detail: cloudData }));
      
    } catch (error) {
      console.error('❌ Sinkronisasi gagal:', error);
    }
  }

  // Utility functions
  getBinId() {
    return localStorage.getItem('cloud_bin_id') || CLOUD_CONFIG.BIN_ID;
  }

  generateSyncId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  updateSyncStatus(status, timestamp, error = null) {
    const syncStatus = {
      status,
      timestamp,
      error,
      online: this.isOnline
    };
    localStorage.setItem(CLOUD_CONFIG.SYNC_STATUS_KEY, JSON.stringify(syncStatus));
  }

  getSyncStatus() {
    try {
      return JSON.parse(localStorage.getItem(CLOUD_CONFIG.SYNC_STATUS_KEY) || '{}');
    } catch {
      return {};
    }
  }

  // Initialize cloud storage (call this once)
  async initializeCloudStorage() {
    try {
      console.log('🚀 Menginisialisasi cloud storage...');
      
      // Create initial bin if doesn't exist
      const binId = this.getBinId();
      if (!binId || binId === 'REPLACE_WITH_YOUR_BIN_ID') {
        const response = await fetch(CLOUD_CONFIG.API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': CLOUD_CONFIG.API_KEY,
            'X-Bin-Name': 'Informatika-SMP-Results'
          },
          body: JSON.stringify({
            schoolId: 'SMP_INFORMATIKA_2025',
            created: new Date().toISOString(),
            results: []
          })
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('cloud_bin_id', data.metadata.id);
          console.log('✅ Cloud storage berhasil diinisialisasi');
          return data.metadata.id;
        }
      }
      
      return binId;
    } catch (error) {
      console.error('❌ Gagal menginisialisasi cloud storage:', error);
      return null;
    }
  }
}

// Global instance
const cloudManager = new CloudDataManager();

// Export for use in other files
window.CloudDataManager = CloudDataManager;
window.cloudManager = cloudManager;

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', () => {
  cloudManager.initializeCloudStorage();
  
  // Start periodic sync every 5 minutes
  setInterval(() => {
    if (cloudManager.isOnline) {
      cloudManager.syncData();
    }
  }, 5 * 60 * 1000);
});

console.log('☁️ Cloud Data Manager loaded successfully');