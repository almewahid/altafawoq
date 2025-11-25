// ملف بديل لـ Base44 - يستخدم Firebase بدلاً منه
// هذا الملف موجود فقط للتوافق مع الكود القديم

import { db, auth } from '@/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

// محاكاة Base44 API باستخدام Firebase
export const base44 = {
  // جلب كل السجلات من collection
  async getAll(collectionName) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      return [];
    }
  },

  // جلب سجل واحد بالـ ID
  async getById(collectionName, id) {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching ${collectionName}/${id}:`, error);
      return null;
    }
  },

  // البحث بشرط
  async query(collectionName, filters = {}) {
    try {
      let q = collection(db, collectionName);
      
      // تطبيق الفلاتر إن وجدت
      if (filters.where) {
        const [field, operator, value] = filters.where;
        q = query(q, where(field, operator, value));
      }
      
      if (filters.orderBy) {
        const [field, direction = 'asc'] = filters.orderBy;
        q = query(q, orderBy(field, direction));
      }
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error querying ${collectionName}:`, error);
      return [];
    }
  },

  // إضافة سجل جديد
  async create(collectionName, data) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return {
        id: docRef.id,
        ...data
      };
    } catch (error) {
      console.error(`Error creating ${collectionName}:`, error);
      throw error;
    }
  },

  // تحديث سجل
  async update(collectionName, id, data) {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      
      return {
        id,
        ...data
      };
    } catch (error) {
      console.error(`Error updating ${collectionName}/${id}:`, error);
      throw error;
    }
  },

  // حذف سجل
  async delete(collectionName, id) {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting ${collectionName}/${id}:`, error);
      throw error;
    }
  },

  // جلب المستخدم الحالي
  getCurrentUser() {
    return auth.currentUser;
  }
};

export default base44;