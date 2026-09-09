import { useAuth } from "../../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { usePurchases } from "../../contexts/PurchasesContext";
import { useTheme } from "../../contexts/ThemeContext";

// Imagens locais dentro de app/image
import kitRevisaoImg from "../image/Prot#U00f3tipos Toyota.jpg";
import tapeteImg from "../image/carro toyota.jpg";
import boneImg from "../image/logoT.png";
import limpezaImg from "../image/download.png";
import acessorioImg from "../image/sw4.png";
import logoToyotaImg from "../image/Logo.png";

const promotions = [
  {
    id: 1,
    title: "Kit Revisão Toyota",
    description: "Até 20% OFF em kits selecionados de manutenção.",
    price: "A partir de R$ 189,90",
    image: kitRevisaoImg,
  },
  {
    id: 2,
    title: "Acessórios Originais",
    description: "Tapetes, protetores e itens exclusivos Toyota.",
    price: "Promoções especiais",
    image: tapeteImg,
  },
  {
    id: 3,
    title: "Linha Lifestyle",
    description: "Bonés, camisetas, garrafas e produtos oficiais.",
    price: "Até 15% OFF",
    image: boneImg,
  },
];

const products = [
  {
    id: 1,
    name: "Tapete Original Toyota",
    category: "Acessórios",
    price: 249.9,
    oldPrice: 299.9,
    image: tapeteImg,
  },
  {
    id: 2,
    name: "Kit Limpeza Automotiva",
    category: "Cuidados",
    price: 89.9,
    oldPrice: 119.9,
    image: limpezaImg,
  },
  {
    id: 3,
    name: "Boné Toyota Gazoo Racing",
    category: "Lifestyle",
    price: 129.9,
    oldPrice: 159.9,
    image: boneImg,
  },
  {
    id: 4,
    name: "Protetor de Porta Toyota",
    category: "Acessórios",
    price: 79.9,
    oldPrice: 99.9,
    image: acessorioImg,
  },
  {
    id: 5,
    name: "Capa de Chave Toyota",
    category: "Acessórios",
    price: 59.9,
    oldPrice: 79.9,
    image: logoToyotaImg,
  },
  {
    id: 6,
    name: "Kit Emergência Veicular",
    category: "Segurança",
    price: 149.9,
    oldPrice: 189.9,
    image: acessorioImg,
  },
];

const paymentMethods = [
  { id: "pix", label: "Pix", icon: "qr-code-outline" },
  { id: "credito", label: "Cartão de crédito", icon: "card-outline" },
  { id: "debito", label: "Cartão de débito", icon: "wallet-outline" },
  { id: "boleto", label: "Boleto", icon: "document-text-outline" },
];

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ShopPage() {
  const { theme } = useTheme();
  const { addPurchase } = usePurchases();
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("");

  const promotion = promotions[currentSlide];

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const discount = subtotal >= 300 ? subtotal * 0.1 : 0;
  const total = subtotal - discount;

  const selectedPayment = paymentMethods.find(
    (item) => item.id === paymentMethod
  );

  function nextSlide() {
    setCurrentSlide((prev) =>
      prev === promotions.length - 1 ? 0 : prev + 1
    );
  }

  function prevSlide() {
    setCurrentSlide((prev) =>
      prev === 0 ? promotions.length - 1 : prev - 1
    );
  }

  function addToCart(product) {
    setCart((prev) => {
      const itemExists = prev.find((item) => item.id === product.id);

      if (itemExists) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });

    Alert.alert("Produto adicionado", `${product.name} foi para o carrinho.`);
  }

  function decreaseQuantity(id) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function increaseQuantity(id) {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  async function finishPurchase() {
    if (cart.length === 0) {
      Alert.alert("Carrinho vazio", "Adicione algum produto primeiro.");
      return;
    }

    if (!paymentMethod) {
      Alert.alert("Pagamento", "Selecione uma forma de pagamento.");
      return;
    }

    try {
      const clienteId = user?.id;

      if (!clienteId) {
        Alert.alert("Erro", "Cliente não identificado. Faça login novamente.");
        return;
      }

      for (const item of cart) {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || "http://localhost:8083/api"}/compras`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clienteId: clienteId,
            produto: item.name,
            quantidade: item.quantity,
            preco: item.price,
            total: item.price * item.quantity,
            metodoPagamento: paymentMethod,
            statusPedido: "REALIZADO",
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao registrar compra no backend.");
        }
      }

      addPurchase(cart, paymentMethod, total);

      setCartOpen(false);
      setSuccessOpen(true);
    } catch (error) {
      console.log("Erro ao finalizar compra:", error);
      Alert.alert(
        "Erro na compra",
        "Não foi possível registrar a compra. Tente novamente."
      );
    }
  }

  function resetPurchase() {
    setCart([]);
    setPaymentMethod("");
    setSuccessOpen(false);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>
            Toyota Shop
          </Text>

          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            Produtos, acessórios e promoções exclusivas Toyota.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.cartButton, { backgroundColor: theme.primary }]}
          onPress={() => setCartOpen(true)}
        >
          <Ionicons name="cart-outline" size={22} color="#fff" />

          {totalItems > 0 ? (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <View style={styles.banner}>
        <View style={styles.promoBadge}>
          <Ionicons name="pricetag-outline" size={13} color="#fff" />
          <Text style={styles.promoBadgeText}>Promoção Especial</Text>
        </View>

        <Text style={styles.bannerTitle}>{promotion.title}</Text>

        <Text style={styles.bannerDescription}>{promotion.description}</Text>

        <Text style={styles.bannerPrice}>{promotion.price}</Text>

        <View style={styles.bannerImageBox}>
          <Image source={promotion.image} style={styles.bannerImage} />
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.arrowButton} onPress={prevSlide}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.dots}>
            {promotions.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => setCurrentSlide(index)}
                style={[
                  styles.dot,
                  currentSlide === index && styles.dotActive,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.arrowButton} onPress={nextSlide}>
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Produtos em destaque
      </Text>

      <Text style={[styles.sectionSubtitle, { color: theme.subtext }]}>
        Escolha produtos originais e acessórios Toyota.
      </Text>

      <View style={styles.productsGrid}>
        {products.map((product) => (
          <View
            key={product.id}
            style={[styles.productCard, { backgroundColor: theme.card }]}
          >
            <View
              style={[
                styles.productImageBox,
                { backgroundColor: theme.box },
              ]}
            >
              <Image source={product.image} style={styles.productImage} />
            </View>

            <Text style={[styles.category, { color: theme.primary }]}>
              {product.category}
            </Text>

            <Text
              style={[styles.productName, { color: theme.text }]}
              numberOfLines={2}
            >
              {product.name}
            </Text>

            <View style={styles.stars}>
              <Ionicons name="star" size={12} color="#facc15" />
              <Ionicons name="star" size={12} color="#facc15" />
              <Ionicons name="star" size={12} color="#facc15" />
              <Ionicons name="star" size={12} color="#facc15" />
              <Ionicons name="star-outline" size={12} color="#facc15" />
            </View>

            <Text style={[styles.price, { color: theme.text }]}>
              {formatPrice(product.price)}
            </Text>

            <Text style={[styles.oldPrice, { color: theme.subtext }]}>
              {formatPrice(product.oldPrice)}
            </Text>

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={() => addToCart(product)}
            >
              <Ionicons name="cart-outline" size={14} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Text style={[styles.footer, { color: theme.subtext }]}>
        © {new Date().getFullYear()} Toyota do Brasil
      </Text>

      <Modal visible={cartOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Carrinho
                </Text>

                <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>
                  Revise seus produtos antes de finalizar.
                </Text>
              </View>

              <TouchableOpacity onPress={() => setCartOpen(false)}>
                <Ionicons name="close" size={26} color={theme.text} />
              </TouchableOpacity>
            </View>

            {cart.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.subtext }]}>
                Seu carrinho está vazio.
              </Text>
            ) : (
              <ScrollView style={styles.cartList}>
                {cart.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.cartItem, { backgroundColor: theme.box }]}
                  >
                    <Image source={item.image} style={styles.cartImage} />

                    <View style={styles.cartInfo}>
                      <Text style={[styles.cartName, { color: theme.text }]}>
                        {item.name}
                      </Text>

                      <Text
                        style={[styles.cartCategory, { color: theme.subtext }]}
                      >
                        {item.category}
                      </Text>

                      <Text style={[styles.cartPrice, { color: theme.text }]}>
                        {formatPrice(item.price)}
                      </Text>
                    </View>

                    <View style={styles.quantityBox}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => decreaseQuantity(item.id)}
                      >
                        <Ionicons name="remove" size={16} color={theme.text} />
                      </TouchableOpacity>

                      <Text style={[styles.quantityText, { color: theme.text }]}>
                        {item.quantity}
                      </Text>

                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => increaseQuantity(item.id)}
                      >
                        <Ionicons name="add" size={16} color={theme.text} />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color={theme.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={[styles.summaryBox, { backgroundColor: theme.box }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryText, { color: theme.subtext }]}>
                  Subtotal
                </Text>

                <Text style={[styles.summaryText, { color: theme.text }]}>
                  {formatPrice(subtotal)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryText, { color: theme.subtext }]}>
                  Desconto
                </Text>

                <Text style={styles.discountText}>
                  - {formatPrice(discount)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={[styles.totalText, { color: theme.text }]}>
                  Total
                </Text>

                <Text style={[styles.totalText, { color: theme.text }]}>
                  {formatPrice(total)}
                </Text>
              </View>
            </View>

            <Text style={[styles.paymentTitle, { color: theme.text }]}>
              Forma de pagamento
            </Text>

            <View style={styles.paymentGrid}>
              {paymentMethods.map((method) => {
                const selected = paymentMethod === method.id;

                return (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentOption,
                      { backgroundColor: theme.box },
                      selected && { backgroundColor: theme.primary },
                    ]}
                    onPress={() => setPaymentMethod(method.id)}
                  >
                    <Ionicons
                      name={method.icon}
                      size={18}
                      color={selected ? "#fff" : theme.text}
                    />

                    <Text
                      style={[
                        styles.paymentText,
                        { color: selected ? "#fff" : theme.text },
                      ]}
                    >
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.finishButton,
                { backgroundColor: theme.primary },
                cart.length === 0 && styles.disabled,
              ]}
              onPress={finishPurchase}
              disabled={cart.length === 0}
            >
              <Text style={styles.finishButtonText}>Finalizar compra</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={successOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.successModal, { backgroundColor: theme.card }]}>
            <Ionicons name="checkmark-circle" size={72} color="#22c55e" />

            <Text style={[styles.successTitle, { color: theme.text }]}>
              Compra simulada com sucesso!
            </Text>

            <Text style={[styles.successText, { color: theme.subtext }]}>
              Seu pedido Toyota foi registrado.
            </Text>

            <View style={[styles.summaryBox, { backgroundColor: theme.box }]}>
              <Text style={[styles.summaryText, { color: theme.text }]}>
                Total: {formatPrice(total)}
              </Text>

              <Text style={[styles.summaryText, { color: theme.text }]}>
                Pagamento: {selectedPayment?.label}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.finishButton, { backgroundColor: theme.primary }]}
              onPress={resetPurchase}
            >
              <Text style={styles.finishButtonText}>Finalizar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 18,
    paddingBottom: 110,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 18,
  },

  cartButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#fff",
    minWidth: 22,
    height: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  cartBadgeText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "bold",
  },

  banner: {
    backgroundColor: "#050505",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#dc2626",
    padding: 16,
    marginBottom: 24,
  },

  promoBadge: {
    backgroundColor: "#dc2626",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  promoBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 6,
  },

  bannerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 7,
  },

  bannerDescription: {
    color: "#d4d4d8",
    fontSize: 13,
    marginBottom: 10,
  },

  bannerPrice: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 14,
  },

  bannerImageBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 125,
  },

  bannerImage: {
    width: "100%",
    height: 110,
    resizeMode: "contain",
  },

  controls: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  arrowButton: {
    backgroundColor: "rgba(255,255,255,0.12)",
    width: 38,
    height: 38,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  dots: {
    flexDirection: "row",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 4,
  },

  dotActive: {
    width: 26,
    backgroundColor: "#dc2626",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },

  sectionSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 14,
  },

  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },

  productCard: {
    width: "48%",
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
  },

  productImageBox: {
    height: 105,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    overflow: "hidden",
  },

  productImage: {
    width: "100%",
    height: 85,
    resizeMode: "contain",
  },

  category: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 3,
  },

  productName: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 6,
    minHeight: 34,
  },

  stars: {
    flexDirection: "row",
    marginBottom: 6,
  },

  price: {
    fontSize: 15,
    fontWeight: "bold",
  },

  oldPrice: {
    fontSize: 11,
    textDecorationLine: "line-through",
    marginBottom: 10,
  },

  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 6,
    fontSize: 12,
  },

  footer: {
    textAlign: "center",
    padding: 20,
    fontSize: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 18,
  },

  modal: {
    maxHeight: "90%",
    borderRadius: 22,
    padding: 18,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },

  modalSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },

  emptyText: {
    textAlign: "center",
    padding: 30,
  },

  cartList: {
    maxHeight: 260,
  },

  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },

  cartImage: {
    width: 52,
    height: 52,
    resizeMode: "contain",
    marginRight: 12,
  },

  cartInfo: {
    flex: 1,
  },

  cartName: {
    fontSize: 14,
    fontWeight: "bold",
  },

  cartCategory: {
    fontSize: 12,
    marginTop: 2,
  },

  cartPrice: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 4,
  },

  quantityBox: {
    alignItems: "center",
  },

  quantityButton: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 3,
  },

  quantityText: {
    fontWeight: "bold",
    marginVertical: 3,
  },

  summaryBox: {
    padding: 14,
    borderRadius: 16,
    marginTop: 14,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  summaryText: {
    fontSize: 14,
  },

  discountText: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "bold",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: 4,
  },

  totalText: {
    fontSize: 18,
    fontWeight: "bold",
  },

  paymentTitle: {
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 10,
  },

  paymentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },

  paymentText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },

  finishButton: {
    marginTop: 18,
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
  },

  finishButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  disabled: {
    opacity: 0.45,
  },

  successModal: {
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
  },

  successTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 12,
  },

  successText: {
    textAlign: "center",
    marginTop: 8,
  },
});