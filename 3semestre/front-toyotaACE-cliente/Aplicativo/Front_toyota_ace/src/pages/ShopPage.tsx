import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";

import kitrevisao from "@/assets/kitrevisao.webp";
import tapete from "@/assets/tapete.webp";
import roupas from "@/assets/roupas.jpg";
import bone from "@/assets/bone.webp";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Tag,
  Star,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
} from "lucide-react";

import { toast } from "sonner";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice: number;
  image: string;
};

type CartItem = Product & {
  quantity: number;
};

const promotions = [
  {
    id: 1,
    title: "Kit Revisão Toyota",
    description: "Até 20% OFF em kits selecionados de manutenção.",
    price: "A partir de R$ 189,90",
    image: kitrevisao,
  },
  {
    id: 2,
    title: "Acessórios Originais",
    description: "Tapetes, protetores e itens exclusivos Toyota.",
    price: "Promoções especiais",
    image: tapete,
  },
  {
    id: 3,
    title: "Linha Lifestyle",
    description: "Bonés, camisetas, garrafas e produtos oficiais.",
    price: "Até 15% OFF",
    image: roupas,
  },
];

const products: Product[] = [
  {
    id: 1,
    name: "Tapete Original Toyota",
    category: "Acessórios",
    price: 249.9,
    oldPrice: 299.9,
    image: tapete,
  },
  {
    id: 2,
    name: "Boné Toyota Gazoo Racing",
    category: "Lifestyle",
    price: 129.9,
    oldPrice: 159.9,
    image: bone,
  },
];

const formatPrice = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const ShopPage = () => {
  const { user } = useAuth();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);

  const promotion = promotions[currentSlide];

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const discount = subtotal >= 300 ? subtotal * 0.1 : 0;
  const total = subtotal - discount;

  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev === promotions.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? promotions.length - 1 : prev - 1
    );
  };

  const addToCart = (product: Product) => {
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

    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const decreaseQuantity = (id: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const increaseQuantity = (id: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    toast.success("Produto removido do carrinho.");
  };

  const paymentLabel = (method: string) => {
    const labels: Record<string, string> = {
      pix: "Pix",
      credito: "Cartão de crédito",
      debito: "Cartão de débito",
      boleto: "Boleto",
    };

    return labels[method] || method;
  };

  const finishPurchase = async () => {
    if (!user?.id) {
      toast.error("Faça login para finalizar a compra.");
      return;
    }

    if (cart.length === 0) {
      toast.error("Seu carrinho está vazio.");
      return;
    }

    if (!paymentMethod) {
      toast.error("Selecione uma forma de pagamento.");
      return;
    }

    try {
      setLoading(true);

      for (const item of cart) {
        await api.criarCompra({
          clienteId: user.id,
          produto: item.name,
          quantidade: item.quantity,
          preco: item.price,
          total: item.price * item.quantity,
          metodoPagamento: paymentMethod,
        });
      }

      setCartOpen(false);
      setSuccessOpen(true);
      toast.success("Compra registrada com sucesso!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao registrar compra."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetPurchase = () => {
    setCart([]);
    setPaymentMethod("");
    setSuccessOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Toyota Shop
            </h1>

            <p className="text-sm text-muted-foreground mt-1">
              Produtos, acessórios e promoções exclusivas Toyota.
            </p>
          </div>

          <Button variant="outline" onClick={() => setCartOpen(true)}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Carrinho

            {totalItems > 0 && (
              <span className="ml-2 rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white">
                {totalItems}
              </span>
            )}
          </Button>
        </div>

        <section className="relative overflow-hidden rounded-2xl bg-black border border-zinc-900 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-6 md:p-10">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 bg-zinc-900 text-white px-3 py-1 rounded-full text-xs font-semibold">
                <Tag className="h-3.5 w-3.5" />
                Promoção Especial
              </span>

              <h2 className="text-3xl md:text-4xl font-bold text-white">
                {promotion.title}
              </h2>

              <p className="text-gray-300">{promotion.description}</p>

              <p className="text-xl font-bold text-red-500">
                {promotion.price}
              </p>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-xs h-[320px] bg-white rounded-2xl overflow-hidden shadow-xl">
                <img
                  src={promotion.image}
                  alt={promotion.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {promotions.map((item, index) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === index ? "w-8 bg-red-600" : "w-2 bg-white/40"
                }`}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Produtos em destaque
            </h2>

            <p className="text-sm text-muted-foreground">
              Escolha produtos originais e acessórios Toyota.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden border hover:border-red-600/70 transition-all hover:shadow-2xl hover:-translate-y-1 duration-300 bg-white dark:bg-zinc-900 rounded-2xl"
              >
                <div className="relative w-full h-72 overflow-hidden bg-gray-100 dark:bg-zinc-800">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                  />

                  <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                    {product.category}
                  </div>
                </div>

                <CardContent className="p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-1 text-yellow-500 mt-2">
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(product.price)}
                    </p>

                    <p className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.oldPrice)}
                    </p>
                  </div>

                  <Button
                    className="w-full bg-red-600 hover:bg-red-600 text-white h-11 text-sm font-semibold rounded-xl"
                    onClick={() => addToCart(product)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Adicionar ao carrinho
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Carrinho de compras</DialogTitle>

            <DialogDescription>
              Finalize sua compra de produtos Toyota.
            </DialogDescription>
          </DialogHeader>

          {cart.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              Seu carrinho está vazio.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg border bg-card p-3"
                  >
                    <div className="h-20 w-20 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden border">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                        {item.name}
                      </h3>

                      <p className="text-xs text-muted-foreground">
                        {item.category}
                      </p>

                      <p className="font-semibold text-sm">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => decreaseQuantity(item.id)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <span className="w-6 text-center font-medium">
                        {item.quantity}
                      </span>

                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => increaseQuantity(item.id)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto</span>
                  <span>- {formatPrice(discount)}</span>
                </div>

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Forma de pagamento</p>

                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma forma de pagamento" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="pix">Pix</SelectItem>
                    <SelectItem value="credito">Cartão de crédito</SelectItem>
                    <SelectItem value="debito">Cartão de débito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                  </SelectContent>
                </Select>

                {paymentMethod && (
                  <p className="text-xs text-muted-foreground">
                    Pagamento selecionado: {paymentLabel(paymentMethod)}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCartOpen(false)}>
              Continuar comprando
            </Button>

            <Button
              onClick={finishPurchase}
              disabled={loading || cart.length === 0}
              className="bg-zinc-900 hover:bg-zinc-800 text-white"
            >
              {loading ? "Finalizando..." : "Finalizar compra"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-9 w-9 text-green-600" />
            </div>

            <DialogTitle className="text-center">
              Compra registrada!
            </DialogTitle>

            <DialogDescription className="text-center">
              Sua compra foi salva no sistema e poderá ser consultada no seu
              perfil.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              onClick={resetPurchase}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopPage;