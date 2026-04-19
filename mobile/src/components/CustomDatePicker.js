import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../theme/designSystem';

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 3;

export default function CustomDatePicker({ visible, onClose, onSelect, initialDate }) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    if (initialDate) {
      const d = new Date(initialDate);
      setSelectedDay(d.getDate());
      setSelectedMonth(d.getMonth());
      setSelectedYear(d.getFullYear());
    }
  }, [initialDate, visible]);

  const handleConfirm = () => {
    const date = new Date(selectedYear, selectedMonth, selectedDay);
    onSelect(date.toISOString());
    onClose();
  };

  const PickerColumn = ({ data, selectedValue, onValueChange, label }) => {
    const flatListRef = useRef(null);

    return (
      <View style={styles.columnWrapper}>
        <Text style={styles.columnLabel}>{label}</Text>
        <FlatList
          ref={flatListRef}
          data={['', ...data, '']} // Padding for alignment
          keyExtractor={(item, index) => `${label}-${index}`}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
            if (index >= 0 && index < data.length) {
              onValueChange(data[index]);
            }
          }}
          renderItem={({ item, index }) => (
            <View style={[styles.item, item === '' && { height: ITEM_HEIGHT }]}>
              <Text style={[
                styles.itemText,
                item === selectedValue && styles.selectedItemText
              ]}>
                {item}
              </Text>
            </View>
          )}
          style={styles.flatList}
        />
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissView} onPress={onClose} />
        
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Date</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerRow}>
            <PickerColumn 
              label="DAY"
              data={days} 
              selectedValue={selectedDay} 
              onValueChange={setSelectedDay} 
            />
            <PickerColumn 
              label="MONTH"
              data={months} 
              selectedValue={months[selectedMonth]} 
              onValueChange={(val) => setSelectedMonth(months.indexOf(val))} 
            />
            <PickerColumn 
              label="YEAR"
              data={years} 
              selectedValue={selectedYear} 
              onValueChange={setSelectedYear} 
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>SET DATE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dismissView: {
    flex: 1,
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingBottom: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  closeText: {
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    marginBottom: SPACING.xxl,
  },
  columnWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  columnLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.brandGreen,
    letterSpacing: 1,
    marginBottom: 10,
  },
  flatList: {
    width: '100%',
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  selectedItemText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '900',
  },
  footer: {
    marginTop: SPACING.md,
  },
  confirmButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
});
