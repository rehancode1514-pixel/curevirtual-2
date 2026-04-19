import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from "../../../theme/designSystem";

const CATEGORIES = ["All", "Prescription", "OTC", "Wellness"];

const PRODUCTS = [
  { id: 1, name: "Vitamin C 1000mg", category: "Wellness", price: "$15.00", image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=300" },
  { id: 2, name: "Ibuprofen 200mg", category: "OTC", price: "$8.50", image: "https://images.unsplash.com/photo-1550572017-ed20015dd085?auto=format&fit=crop&q=80&w=300" },
  { id: 3, name: "Nightly Sleep Aid", category: "OTC", price: "$12.00", image: "https://images.unsplash.com/photo-1626963014763-0245576ac64d?auto=format&fit=crop&q=80&w=300" },
  { id: 4, name: "Omega 3 Capsules", category: "Wellness", price: "$22.00", image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300" },
];

export default function MedicineMarketScreen() {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" }}
            style={styles.avatar}
          />
          <Text style={styles.logo}>CureVirtual</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Title Section */}
        <View style={styles.section}>
          <Text style={styles.title}>Pharmacy</Text>
          <Text style={styles.subtitle}>
            Order medications and health essentials
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search medicines..."
              placeholderTextColor={COLORS.textPlaceholder}
              style={styles.input}
            />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setActiveCategory(i)}
                style={[
                  styles.categoryBtn,
                  activeCategory === i && styles.activeCategory,
                ]}
              >
                <Text style={[
                  styles.categoryText,
                  activeCategory === i && styles.activeActiveText
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Prescription Card */}
        <View style={styles.prescriptionCard}>
          <View style={styles.row}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name="pill" size={30} color={COLORS.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Text style={styles.smallText}>Refill Available</Text>
              </View>
              <Text style={styles.cardTitle}>Lisinopril 10mg</Text>
              <Text style={styles.cardSubtitle}>
                30 Tablets • Daily Dose
              </Text>

              <View style={styles.rowBetween}>
                <Text style={styles.price}>$12.50</Text>
                <TouchableOpacity style={styles.cartBtn}>
                  <Text style={styles.cartBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Products Grid */}
        <View style={styles.grid}>
          {PRODUCTS.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <Image
                source={{ uri: product.image }}
                style={styles.productImg}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.productCategory}>{product.category}</Text>

                <View style={styles.rowBetween}>
                  <Text style={styles.price}>{product.price}</Text>
                  <TouchableOpacity style={styles.addBtn}>
                    <Ionicons name="add" size={20} color={COLORS.onSurface} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Cart */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>2</Text>
        </View>
        <Ionicons name="cart" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  scrollContent: {
    padding: SPACING.base,
    paddingBottom: 100, // For FAB
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  profileRow: { flexDirection: "row", alignItems: "center" },
  avatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORS.primaryContainer,
  },
  logo: { 
    fontSize: 18, 
    fontWeight: TYPOGRAPHY.black, 
    marginLeft: 12,
    color: COLORS.onSurface,
    letterSpacing: -0.5,
  },
  notificationBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainer,
  },

  section: { marginVertical: SPACING.md },
  title: { 
    fontSize: 28, 
    fontWeight: TYPOGRAPHY.black, 
    color: COLORS.onSurface,
    letterSpacing: -1,
  },
  subtitle: { 
    color: COLORS.textMuted, 
    fontSize: 14,
    fontWeight: TYPOGRAPHY.medium,
    marginTop: 2,
  },

  searchContainer: {
    marginVertical: SPACING.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  input: { 
    flex: 1,
    fontSize: 15,
    color: COLORS.onSurface,
    fontWeight: TYPOGRAPHY.medium,
  },

  categoryContainer: {
    marginBottom: SPACING.lg,
  },
  categoryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainer,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  activeCategory: { 
    backgroundColor: COLORS.secondary,
    ...SHADOWS.sm,
  },
  categoryText: { 
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.bold,
  },
  activeActiveText: { 
    color: COLORS.white,
  },

  prescriptionCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: RADIUS.xl,
    marginVertical: SPACING.md,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  row: { flexDirection: "row", gap: 16 },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  smallText: { 
    fontSize: 10, 
    color: COLORS.warning, 
    fontWeight: TYPOGRAPHY.black,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardTitle: { 
    fontSize: 18,
    fontWeight: TYPOGRAPHY.black, 
    color: COLORS.onSurface,
    marginTop: 2,
  },
  cardSubtitle: { 
    color: COLORS.textMuted, 
    fontSize: 12,
    fontWeight: TYPOGRAPHY.medium,
    marginTop: 2,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    marginTop: 12,
  },
  price: { 
    fontSize: 18,
    fontWeight: TYPOGRAPHY.black,
    color: COLORS.onSurface,
  },
  cartBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  cartBtnText: { 
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.black,
    fontSize: 12,
    textTransform: 'uppercase',
  },

  iconBox: {
    width: 64,
    height: 64,
    backgroundColor: COLORS.primaryContainer + '40', // Semi-transparent
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: SPACING.md,
  },
  productCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 10,
    marginBottom: 16,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  productImg: { 
    width: "100%", 
    height: 120, 
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainer,
  },
  productInfo: {
    marginTop: 10,
  },
  productTitle: { 
    fontSize: 14,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.onSurface,
  },
  productCategory: { 
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.medium,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: COLORS.surfaceContainer,
    padding: 6,
    borderRadius: RADIUS.md,
  },

  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: COLORS.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.premium,
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.error,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.black,
  },
});
