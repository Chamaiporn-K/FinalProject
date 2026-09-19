import { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// กำหนดประเภทข้อมูล (TypeScript Interface)
interface Transaction {
  id: string;
  name: string;
  amount: number;
  category: string;
}

export default function FinanceTrackerApp() {
  // State สำหรับจัดการหน้าจอ (Tabs)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'history'>('dashboard');

  // State สำหรับฟอร์มเพิ่มข้อมูล
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [aiCategory, setAiCategory] = useState('รอ AI วิเคราะห์...');

  // ข้อมูลจำลอง (Mock Data) รอต่อ Backend
  const [balance, setBalance] = useState(4500);
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', name: 'สุกี้ตี๋น้อย', amount: 219, category: 'อาหาร' },
    { id: '2', name: 'ค่ารถเมล์', amount: 25, category: 'เดินทาง' }
  ]);

  // ฟังก์ชันจำลองการบันทึกข้อมูล (เดี๋ยวต้องเปลี่ยนเป็น fetch API ไปหา Backend)
  const handleSubmit = () => {
    if (!itemName || !itemAmount) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      name: itemName,
      amount: parseFloat(itemAmount),
      category: 'อาหาร (จำลอง AI)', // รอรับค่าจาก AI Backend
    };

    // อัปเดตข้อมูลในหน้าจอทันที (ก่อนส่ง Backend จริง)
    setTransactions([newTransaction, ...transactions]);
    setBalance(balance - newTransaction.amount);
    
    Alert.alert('สำเร็จ', `บันทึกรายการ: ${itemName}\nจำนวน: ${itemAmount} บาท`);
    
    // เคลียร์ฟอร์มและเด้งกลับหน้าแรก
    setItemName('');
    setItemAmount('');
    setActiveTab('dashboard');
  };

  // ฟังก์ชันจำลองการลบข้อมูล
  const handleDelete = (id: string) => {
    Alert.alert('ยืนยัน', 'ต้องการลบรายการนี้ใช่หรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { 
        text: 'ลบ', 
        style: 'destructive',
        onPress: () => {
          setTransactions(transactions.filter(t => t.id !== id));
          // ในของจริงต้องยิง API ไปลบที่ Backend ด้วย
        }
      }
    ]);
  };

  // --- ส่วนหน้าจอ Dashboard ---
  const renderDashboard = () => (
    <View style={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardSubtitle}>ยอดเงินคงเหลือเดือนนี้</Text>
        <Text style={styles.balanceText}>฿{balance.toLocaleString()}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>สรุปรายจ่าย (รอใส่ Chart)</Text>
        {/* แนะนำให้ลงไลบรารี 'react-native-chart-kit' เพื่อวาดกราฟตรงนี้ */}
        <View style={styles.placeholderChart}>
          <Text style={{ color: '#888' }}>พื้นที่สำหรับแสดงกราฟวงกลม</Text>
        </View>
      </View>
    </View>
  );

  // --- ส่วนหน้าจอบันทึกรายจ่าย ---
  const renderAdd = () => (
    <View style={styles.content}>
      <Text style={styles.pageTitle}>บันทึกรายจ่าย</Text>
      <View style={styles.card}>
        <Text style={styles.label}>ชื่อรายการ</Text>
        <TextInput 
          style={styles.input}
          placeholder="เช่น ชาบู, ค่าหอ"
          value={itemName}
          onChangeText={(text) => {
            setItemName(text);
            // จำลอง AI ทำงานเมื่อพิมพ์ข้อความ
            if(text.includes('ชาบู') || text.includes('ข้าว')) setAiCategory('อาหาร');
            else setAiCategory('กำลังวิเคราะห์...');
          }}
        />

        <Text style={styles.label}>จำนวนเงิน (บาท)</Text>
        <TextInput 
          style={styles.input}
          placeholder="0.00"
          keyboardType="numeric"
          value={itemAmount}
          onChangeText={setItemAmount}
        />

        <View style={styles.aiBox}>
          <Text style={styles.aiText}>หมวดหมู่ AI: {aiCategory}</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
          <Text style={styles.primaryButtonText}>บันทึกข้อมูล</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- ส่วนหน้าจอประวัติ ---
  const renderHistory = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.pageTitle}>ประวัติการใช้จ่าย</Text>
      {transactions.map((item) => (
        <View key={item.id} style={styles.historyItem}>
          <View>
            <Text style={styles.historyName}>{item.name}</Text>
            <Text style={styles.historyCategory}>{item.category}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.historyAmount}>-฿{item.amount}</Text>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
              <Text style={styles.deleteText}>ลบ</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Finance Tracker</Text>
      </View>

      {/* Main Content (สลับตาม Tab) */}
      <View style={{ flex: 1 }}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'add' && renderAdd()}
        {activeTab === 'history' && renderHistory()}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('dashboard')}>
          <Text style={[styles.navText, activeTab === 'dashboard' && styles.navTextActive]}>ภาพรวม</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItemCenter} onPress={() => setActiveTab('add')}>
          <Text style={styles.navTextCenter}>+</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('history')}>
          <Text style={[styles.navText, activeTab === 'history' && styles.navTextActive]}>ประวัติ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ตกแต่ง UI ด้วย StyleSheet
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { backgroundColor: '#2563eb', padding: 16, alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 16, flex: 1 },
  
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardSubtitle: { color: '#6b7280', fontSize: 14, textAlign: 'center' },
  balanceText: { color: '#2563eb', fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginTop: 8 },
  cardTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 12 },
  placeholderChart: { height: 150, backgroundColor: '#f9fafb', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  
  pageTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#1f2937' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#4b5563', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: 'white' },
  
  aiBox: { backgroundColor: '#eff6ff', padding: 12, borderRadius: 8, marginBottom: 16 },
  aiText: { color: '#1e40af', fontWeight: 'bold' },
  
  primaryButton: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  historyItem: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  historyName: { fontWeight: 'bold', fontSize: 16 },
  historyCategory: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  historyAmount: { color: '#ef4444', fontWeight: 'bold', marginRight: 12, fontSize: 16 },
  deleteButton: { backgroundColor: '#fee2e2', padding: 8, borderRadius: 6 },
  deleteText: { color: '#ef4444', fontSize: 12, fontWeight: 'bold' },
  
  navBar: { flexDirection: 'row', backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingBottom: 20, paddingTop: 10, justifyContent: 'space-around', alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center' },
  navText: { color: '#9ca3af', fontSize: 14 },
  navTextActive: { color: '#2563eb', fontWeight: 'bold' },
  navItemCenter: { backgroundColor: '#2563eb', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: -20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  navTextCenter: { color: 'white', fontSize: 24, fontWeight: 'bold' }
});